import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Profile, Department, UserStatus } from '../types';
import { REAL_MEMBERS, REAL_DEPARTMENTS } from '../lib/realData';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PortalDataContextType {
  members: Profile[];
  departments: Department[];
  isLoadingData: boolean;
  refreshData: () => Promise<void>;
  onlineUserIds: Set<string>;
  isUserOnline: (userId: string) => boolean;
  updateMemberStatus: (memberId: string, status: UserStatus) => Promise<{ success: boolean; error?: string }>;
  createGroup: (group: { name: string; description?: string; color?: string }) => Promise<{ success: boolean; error?: string; department?: Department }>;
}

const PortalDataContext = createContext<PortalDataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ceova_team_os_v2_ceo_';

export const PortalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseConfigured } = useAuth();

  const [members, setMembers] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'members');
      return saved ? JSON.parse(saved) : REAL_MEMBERS;
    } catch {
      return REAL_MEMBERS;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'departments');
      return saved ? JSON.parse(saved) : REAL_DEPARTMENTS;
    } catch {
      return REAL_DEPARTMENTS;
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (user?.id) initial.add(user.id);
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(departments));
  }, [departments]);

  const refreshData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) return;

    setIsLoadingData(true);
    try {
      const [membersRes, deptsRes] = await Promise.all([
        client.from('profiles').select('*').order('created_at', { ascending: true }),
        client.from('departments').select('*').order('created_at', { ascending: true })
      ]);

      if (membersRes.data && membersRes.data.length > 0) {
        setMembers(membersRes.data as Profile[]);
      }

      if (deptsRes.data && deptsRes.data.length > 0) {
        setDepartments(deptsRes.data as Department[]);
      }
    } catch (err) {
      console.error('Error refreshing Supabase data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [isSupabaseConfigured]);

  // Realtime Database & Supabase Presence Channel
  useEffect(() => {
    refreshData();

    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) return;

    let refreshTimer: any = null;
    const triggerDebouncedRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshData();
      }, 3000);
    };

    // 1. Listen for database changes on profiles and departments (debounced & filtered)
    const dbChannel = client
      .channel('ceova-realtime-portal-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        // If only activity timestamp changed, do not re-fetch all profiles (saves egress and log quota)
        if (payload?.eventType === 'UPDATE' && payload?.new && payload?.old) {
          const n = payload.new;
          const o = payload.old;
          const isStructural =
            n.full_name !== o.full_name ||
            n.role !== o.role ||
            n.department !== o.department ||
            n.status !== o.status ||
            n.avatar_url !== o.avatar_url ||
            n.email !== o.email ||
            n.designation !== o.designation;
          if (!isStructural) return;
        }
        triggerDebouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
        triggerDebouncedRefresh();
      })
      .subscribe();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      client.removeChannel(dbChannel);
    };
  }, [refreshData, isSupabaseConfigured]);

  const isUserOnline = useCallback((userId: string): boolean => {
    if (!userId) return false;
    return Boolean(user?.id && user.id === userId);
  }, [user?.id]);

  const updateMemberStatus = useCallback(async (memberId: string, status: UserStatus): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) {
      return { success: false, error: 'Database connection is not configured.' };
    }

    try {
      // Optimistic local update
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));

      const { error } = await client
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) {
        console.error('Failed to update status in Supabase:', error);
        await refreshData();
        return { success: false, error: error.message };
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating member status:', err);
      return { success: false, error: err?.message || 'Failed to update member status' };
    }
  }, [isSupabaseConfigured, refreshData]);

  const createGroup = useCallback(async (newGroup: { name: string; description?: string; color?: string }): Promise<{ success: boolean; error?: string; department?: Department }> => {
    const trimmedName = newGroup.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Group name is required.' };
    }

    // Check if group already exists (case-insensitive)
    const existing = departments.find(d => d.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      return { success: true, department: existing };
    }

    const deptId = 'dept-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now());
    const code = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    const color = newGroup.color || '#3b82f6';
    const description = newGroup.description?.trim() || `${trimmedName} Group`;

    const deptObj: Department = {
      id: deptId,
      name: trimmedName,
      code,
      description,
      color,
      member_count: 0,
      status: 'Operational'
    };

    setDepartments(prev => {
      const updated = [...prev, deptObj];
      try {
        localStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        const { data, error } = await client
          .from('departments')
          .insert([{
            id: deptId,
            name: trimmedName,
            code,
            description,
            color,
            member_count: 0
          }])
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Departments insert warning:', error.message);
        } else if (data) {
          deptObj.id = data.id;
        }
      } catch (err: any) {
        console.warn('Departments insert error:', err);
      }
    }

    return { success: true, department: deptObj };
  }, [departments, isSupabaseConfigured]);

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ceo'));

  // Security & Visibility Rule: Once any user is blocked or paused by admin,
  // their profile is completely hidden from all other users. Only admins can view and manage them.
  const visibleMembers = useMemo(() => {
    if (isAdmin) {
      return members;
    }
    return members.filter(m => m.status !== 'blocked' && m.status !== 'paused');
  }, [members, isAdmin]);

  return (
    <PortalDataContext.Provider
      value={{
        members: visibleMembers,
        departments,
        isLoadingData,
        refreshData,
        onlineUserIds,
        isUserOnline,
        updateMemberStatus,
        createGroup,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
};

export const usePortalData = () => {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error('usePortalData must be used within a PortalDataProvider');
  }
  return context;
};
