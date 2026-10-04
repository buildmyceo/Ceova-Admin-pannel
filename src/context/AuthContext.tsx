import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, Permission } from '../types';
import { 
  getSupabaseClient, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials 
} from '../lib/supabase';
import { REAL_MEMBERS } from '../lib/realData';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  isCSuite: boolean;
  canViewFinancials: boolean;
  canAccessExecutiveRoom: boolean;
  hasPermission: (permission: Permission) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string, 
    password: string, 
    meta: { fullName: string; role: UserRole; department: string }
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  quickLoginAs: (role: UserRole) => void;
  switchUserById: (memberId: string) => void;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSupabaseConfig: (url: string, key: string) => void;
  disconnectSupabase: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'ceova_active_user_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const { isConfigured } = getSupabaseCredentials();
      setIsSupabaseConfigured(isConfigured);

      const client = getSupabaseClient();

      if (client && isConfigured) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            const { data: profileData } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData) {
              setUser(profileData as Profile);
              localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profileData));
              setIsLoading(false);
              return;
            }
          }

          // Check if previously saved user or default to CEO in Supabase
          const savedUser = localStorage.getItem(LOCAL_USER_KEY);
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            const { data: verified } = await client
              .from('profiles')
              .select('*')
              .eq('id', parsed.id)
              .maybeSingle();

            if (verified) {
              setUser(verified as Profile);
              setIsLoading(false);
              return;
            }
          }

          // Default to Harshit (CEO) from real Supabase database
          const { data: realCeo } = await client
            .from('profiles')
            .select('*')
            .eq('role', 'ceo')
            .limit(1)
            .maybeSingle();

          if (realCeo) {
            setUser(realCeo as Profile);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(realCeo));
          } else {
            setUser(REAL_MEMBERS[0]);
          }
        } catch (err) {
          console.error('Error fetching Supabase session/profile:', err);
          setUser(REAL_MEMBERS[0]);
        }

        const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const { data: profileData } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData) {
              setUser(profileData as Profile);
              localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profileData));
            }
          }
        });

        setIsLoading(false);
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } else {
        // Fallback to real bootstrap data
        try {
          const savedUser = localStorage.getItem(LOCAL_USER_KEY);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(REAL_MEMBERS[0]);
          }
        } catch {
          setUser(REAL_MEMBERS[0]);
        }
        setIsLoading(false);
      }
    }

    initAuth();
  }, [isSupabaseConfigured]);

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const client = getSupabaseClient();

    if (client && isSupabaseConfigured) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // Check if profile exists directly in Supabase profiles table
          const { data: directProfile } = await client
            .from('profiles')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (directProfile) {
            setUser(directProfile as Profile);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(directProfile));
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return { success: false, error: error.message || 'Access denied. If you are a new member, please submit an Access Clearance request.' };
        }

        if (data.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            setUser(profile as Profile);
          }
        }
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Login failed' };
      }
    } else {
      const matched = REAL_MEMBERS.find((m) => m.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setUser(matched);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(matched));
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Account not recognized. Please submit an access clearance request on the waiting list.' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    meta: { fullName: string; role: UserRole; department: string }
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setIsLoading(true);
    const client = getSupabaseClient();

    if (client && isSupabaseConfigured) {
      try {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: meta.fullName,
              role: meta.role,
              department: meta.department,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            email: email.trim(),
            full_name: meta.fullName,
            role: meta.role,
            department: meta.department,
            designation: meta.role === 'ceo' ? 'Chief Executive Officer' : 'Team Member',
            status: 'active',
            permissions: ['manage_tasks'],
            created_at: new Date().toISOString(),
          };
          setUser(newProfile);
        }

        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Sign up failed' };
      }
    } else {
      const newDemoUser: Profile = {
        id: 'usr-new-' + Date.now(),
        email: email.trim(),
        full_name: meta.fullName,
        role: meta.role,
        department: meta.department,
        designation: 'Team Member',
        status: 'active',
        permissions: ['manage_tasks'],
        created_at: new Date().toISOString(),
      };
      setUser(newDemoUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newDemoUser));
      setIsLoading(false);
      return { success: true };
    }
  };

  const logout = async () => {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.error('Error signing out', e);
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const quickLoginAs = async (targetRole: UserRole) => {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client
          .from('profiles')
          .select('*')
          .eq('role', targetRole)
          .limit(1)
          .maybeSingle();

        if (data) {
          setUser(data as Profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.error('Error fetching role from Supabase:', err);
      }
    }
    const target = REAL_MEMBERS.find((m) => m.role === targetRole) || REAL_MEMBERS[0];
    setUser(target);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(target));
  };

  const switchUserById = async (memberId: string) => {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .maybeSingle();

        if (data) {
          setUser(data as Profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.error('Error switching user in Supabase:', err);
      }
    }
    const target = REAL_MEMBERS.find((m) => m.id === memberId);
    if (target) {
      setUser(target);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(target));
    }
  };

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('profiles').update(updates).eq('id', user.id);
      } catch (err) {
        console.error('Failed to sync profile update:', err);
      }
    }
  };

  const updateSupabaseConfig = (url: string, key: string) => {
    saveSupabaseCredentials(url, key);
    const { isConfigured } = getSupabaseCredentials();
    setIsSupabaseConfigured(isConfigured);
  };

  const disconnectSupabase = () => {
    clearSupabaseCredentials();
    setIsSupabaseConfigured(false);
  };

  // Helper checks
  const role = user?.role || null;
  const isCSuite = role === 'ceo' || role === 'cto' || role === 'cmo' || role === 'cfo' || role === 'coo' || role === 'admin';
  const canViewFinancials = role === 'cfo' || role === 'ceo' || role === 'admin' || (user?.permissions?.includes('view_financials') ?? false);
  const canAccessExecutiveRoom = isCSuite || (user?.permissions?.includes('view_executive_room') ?? false);

  const hasPermission = (permission: Permission): boolean => {
    if (role === 'ceo' || role === 'admin') return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isSupabaseConfigured,
        isCSuite,
        canViewFinancials,
        canAccessExecutiveRoom,
        hasPermission,
        loginWithEmail,
        signUpWithEmail,
        logout,
        quickLoginAs,
        switchUserById,
        updateCurrentProfile,
        updateSupabaseConfig,
        disconnectSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
