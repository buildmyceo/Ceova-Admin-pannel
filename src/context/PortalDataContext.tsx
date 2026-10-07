import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    // 1. Listen for database changes on profiles and departments
    const dbChannel = client
      .channel('ceova-realtime-portal-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
        refreshData();
      })
      .subscribe();

    // 2. Setup Instant Realtime Presence WebSocket Channel
    const presenceChannel = client.channel('ceova-portal-presence', {
      config: {
        presence: {
          key: user?.id || 'anonymous'
        }
      }
    });

    // Cross-tab broadcast channel for instantaneous zero-latency updates
    let tabBroadcast: BroadcastChannel | null = null;
    try {
      tabBroadcast = new BroadcastChannel('ceova-tab-presence-channel');
      tabBroadcast.onmessage = (event) => {
        if (event.data?.type === 'ONLINE' && event.data.userId) {
          setOnlineUserIds(prev => new Set(prev).add(event.data.userId));
        } else if (event.data?.type === 'OFFLINE' && event.data.userId) {
          setOnlineUserIds(prev => {
            const next = new Set(prev);
            next.delete(event.data.userId);
            if (user?.id) next.add(user.id);
            return next;
          });
        }
      };
      if (user?.id) {
        tabBroadcast.postMessage({ type: 'ONLINE', userId: user.id });
      }
    } catch {
      // BroadcastChannel optional fallback
    }

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          activeIds.add(key);
          const presences = state[key] as any[];
          presences?.forEach(p => {
            if (p.user_id) activeIds.add(p.user_id);
          });
        });
        if (user?.id) activeIds.add(user.id);
        setOnlineUserIds(activeIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          next.add(key);
          newPresences?.forEach((p: any) => {
            if (p.user_id) next.add(p.user_id);
          });
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          next.delete(key);
          leftPresences?.forEach((p: any) => {
            if (p.user_id) next.delete(p.user_id);
          });
          if (user?.id) next.add(user.id);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user?.id) {
          await presenceChannel.track({
            user_id: user.id,
            full_name: user.full_name,
            email: user.email,
            online_at: new Date().toISOString()
          });
        }
      });

    // Handle beforeunload to untrack presence immediately
    const handleBeforeUnload = () => {
      if (user?.id) {
        presenceChannel.untrack();
        tabBroadcast?.postMessage({ type: 'OFFLINE', userId: user.id });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      client.removeChannel(dbChannel);
      client.removeChannel(presenceChannel);
      if (tabBroadcast) {
        tabBroadcast.close();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [refreshData, isSupabaseConfigured, user?.id]);

  const isUserOnline = useCallback((userId: string): boolean => {
    if (!userId) return false;
    if (user?.id && user.id === userId) return true;
    return onlineUserIds.has(userId);
  }, [user?.id, onlineUserIds]);

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

  return (
    <PortalDataContext.Provider
      value={{
        members,
        departments,
        isLoadingData,
        refreshData,
        onlineUserIds,
        isUserOnline,
        updateMemberStatus,
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
