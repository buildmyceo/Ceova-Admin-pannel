import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { 
  getSupabaseClient, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials 
} from '../lib/supabase';
import { INITIAL_MEMBERS } from '../lib/mockData';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string, 
    password: string, 
    meta: { fullName: string; role: UserRole; department: string }
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  quickLoginAs: (role: UserRole) => void;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSupabaseConfig: (url: string, key: string) => void;
  disconnectSupabase: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'ceova_active_user';

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
            // Fetch profile
            const { data: profileData } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileData) {
              setUser(profileData as Profile);
            } else {
              // Create fallback profile from user metadata if table was newly created
              const fallback: Profile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: (session.user.user_metadata?.role as UserRole) || 'member',
                department: session.user.user_metadata?.department || 'General',
                designation: 'Team Member',
                status: 'active',
                created_at: new Date().toISOString(),
              };
              setUser(fallback);
            }
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }

        // Listen to auth events
        const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const { data: profileData } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData) {
              setUser(profileData as Profile);
            } else {
              const fallback: Profile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: (session.user.user_metadata?.role as UserRole) || 'member',
                department: session.user.user_metadata?.department || 'General',
                designation: 'Team Member',
                status: 'active',
                created_at: new Date().toISOString(),
              };
              setUser(fallback);
            }
          } else {
            setUser(null);
          }
        });

        setIsLoading(false);
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } else {
        // Fallback / local demo mode restore
        try {
          const savedUser = localStorage.getItem(LOCAL_USER_KEY);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            // Default to Alex Rivera (Admin) for instant preview
            setUser(INITIAL_MEMBERS[0]);
          }
        } catch (e) {
          setUser(INITIAL_MEMBERS[0]);
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
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            setUser(profile as Profile);
          } else {
            const fallback: Profile = {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              role: (data.user.user_metadata?.role as UserRole) || 'member',
              department: data.user.user_metadata?.department || 'General',
              designation: 'Team Member',
              status: 'active',
              created_at: new Date().toISOString(),
            };
            setUser(fallback);
          }
        }
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Login failed' };
      }
    } else {
      // Offline / Demo check
      const matched = INITIAL_MEMBERS.find((m) => m.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setUser(matched);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(matched));
        setIsLoading(false);
        return { success: true };
      }

      // Allow generic login in demo mode
      const dummy: Profile = {
        id: 'usr-custom-' + Date.now(),
        email: email.trim(),
        full_name: email.split('@')[0].replace('.', ' '),
        role: email.includes('admin') ? 'admin' : email.includes('head') ? 'head' : 'member',
        department: 'Engineering',
        designation: 'Staff Member',
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setUser(dummy);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(dummy));
      setIsLoading(false);
      return { success: true };
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

        // If email confirmation is required:
        if (data.user && !data.session) {
          setIsLoading(false);
          return { 
            success: true, 
            message: 'Registration successful! Please check your email inbox to confirm your account.' 
          };
        }

        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            email: email.trim(),
            full_name: meta.fullName,
            role: meta.role,
            department: meta.department,
            designation: meta.role === 'admin' ? 'Administrator' : meta.role === 'head' ? 'Department Head' : 'Team Member',
            status: 'active',
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
      // Demo signup
      const newDemoUser: Profile = {
        id: 'usr-new-' + Date.now(),
        email: email.trim(),
        full_name: meta.fullName,
        role: meta.role,
        department: meta.department,
        designation: meta.role === 'admin' ? 'Administrator' : meta.role === 'head' ? 'Department Head' : 'Team Member',
        status: 'active',
        created_at: new Date().toISOString(),
        bio: 'Newly registered Ceova member.',
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
        console.error('Error signing out of Supabase', e);
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const quickLoginAs = (targetRole: UserRole) => {
    const target = INITIAL_MEMBERS.find((m) => m.role === targetRole) || INITIAL_MEMBERS[0];
    setUser(target);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(target));
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
        console.error('Failed to sync profile update to Supabase:', err);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isSupabaseConfigured,
        loginWithEmail,
        signUpWithEmail,
        logout,
        quickLoginAs,
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
