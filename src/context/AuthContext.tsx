import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, SavedAccount } from '../types';
import { 
  getSupabaseClient, 
  getAnonSupabaseClient,
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials 
} from '../lib/supabase';
import { sendAccountActivationEmail } from '../lib/emailService';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  savedAccounts: SavedAccount[];
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  isCSuite: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean; email?: string }>;
  signUpWithEmail: (
    email: string, 
    password: string, 
    meta: { fullName: string; role?: UserRole; phone?: string; avatar_url?: string }
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  switchAccount: (userId: string) => Promise<boolean>;
  removeAccount: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSupabaseConfig: (url: string, key: string) => void;
  disconnectSupabase: () => void;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'ceova_active_ceo_v2';
const SAVED_ACCOUNTS_KEY = 'ceova_saved_accounts_v1';

function getStoredAccounts(): SavedAccount[] {
  try {
    localStorage.removeItem('ceova_saved_accounts');
    localStorage.removeItem('ceova_active_user');
    localStorage.removeItem('ceova_active_user_v2');

    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistAccounts(accounts: SavedAccount[]) {
  try {
    if (accounts.length === 0) {
      localStorage.removeItem(SAVED_ACCOUNTS_KEY);
    } else {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch (e) {
    console.error('Failed to persist accounts:', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => getStoredAccounts());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  const sanitizeRole = (r: any): UserRole => {
    const val = (r || '').toString().trim().toLowerCase();
    if (val === 'ceo') return 'ceo';
    if (val === 'admin') return 'admin';
    if (val === 'intern' || val === 'interns') return 'intern';
    return 'member';
  };

  const sanitizeProfile = (p: any): Profile | null => {
    if (!p) return null;
    const role = sanitizeRole(p.role);
    return {
      ...p,
      role,
      phone: p.phone || p.phone_number || undefined,
      designation: p.designation || (role === 'ceo' ? 'Chief Executive Officer' : role === 'admin' ? 'Administrator' : role === 'intern' ? 'Intern' : 'Member'),
      department: p.department || (role === 'ceo' ? 'Executive' : role === 'admin' ? 'Administration' : 'General'),
      status: p.status || 'active',
      cover_url: p.cover_url || undefined,
      social_links: p.social_links || {},
      last_active_at: p.last_active_at || p.updated_at || undefined,
    };
  };

  const upsertAccount = (profile: Profile, sessionTokens?: { access_token: string; refresh_token: string } | null) => {
    setSavedAccounts(prev => {
      const existingIndex = prev.findIndex(a => 
        (a.profile.id && profile.id && a.profile.id === profile.id) || 
        (a.profile.email && profile.email && a.profile.email.toLowerCase() === profile.email.toLowerCase())
      );
      const newEntry: SavedAccount = {
        profile,
        session: sessionTokens !== undefined 
          ? sessionTokens 
          : (existingIndex >= 0 ? prev[existingIndex].session : null),
        lastActive: new Date().toISOString(),
      };

      let updated: SavedAccount[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = newEntry;
      } else {
        updated = [newEntry, ...prev];
      }
      persistAccounts(updated);
      return updated;
    });
  };

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const { isConfigured } = getSupabaseCredentials();
      setIsSupabaseConfigured(isConfigured);

      let storedAccounts = getStoredAccounts();
      const client = getSupabaseClient();
      const anonClient = getAnonSupabaseClient() || client;

      if (client && isConfigured) {
        try {
          // 0. Handle PKCE auth code exchange or hash tokens from email confirmation redirect
          if (typeof window !== 'undefined') {
            if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
              setIsPasswordRecovery(true);
            }

            if (window.location.search && window.location.search.includes('code=')) {
              const urlParams = new URLSearchParams(window.location.search);
              const authCode = urlParams.get('code');
              if (authCode) {
                try {
                  const { data: exchangeData, error: exchangeErr } = await client.auth.exchangeCodeForSession(authCode);
                  if (exchangeData?.session) {
                    if (window.location.search.includes('type=recovery')) {
                      setIsPasswordRecovery(true);
                    }
                    const cleanUrl = window.location.pathname + (window.location.hash || '');
                    window.history.replaceState({}, document.title, cleanUrl);
                  } else if (exchangeErr) {
                    console.warn('PKCE exchange error:', exchangeErr.message);
                  }
                } catch (codeErr) {
                  console.warn('PKCE exchange exception:', codeErr);
                }
              }
            } else if (window.location.hash && window.location.hash.includes('access_token=')) {
              try {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                if (accessToken && refreshToken) {
                  const { data: sessionData, error: sessionErr } = await client.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                  if (sessionData?.session) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                  } else if (sessionErr) {
                    console.warn('Hash session set error:', sessionErr.message);
                  }
                }
              } catch (hashErr) {
                console.warn('Hash session extraction exception:', hashErr);
              }
            }
          }

          // 1. Strictly synchronize saved accounts with their latest accounts & roles from Supabase
          if (anonClient && storedAccounts.length > 0) {
            const emails = storedAccounts.map(a => a.profile.email?.trim().toLowerCase()).filter(Boolean);
            if (emails.length > 0) {
              const { data: dbAccounts } = await anonClient
                .from('profiles')
                .select('*')
                .in('email', emails);

              if (dbAccounts && dbAccounts.length > 0) {
                storedAccounts = storedAccounts.map(acc => {
                  const match = dbAccounts.find(p => 
                    p.email?.toLowerCase() === acc.profile.email?.toLowerCase() || 
                    p.id === acc.profile.id
                  );
                  if (match) {
                    const clean = sanitizeProfile(match)!;
                    return { ...acc, profile: clean };
                  }
                  return acc;
                });
                setSavedAccounts(storedAccounts);
                persistAccounts(storedAccounts);
              }
            }
          }

          // 2. Check active Supabase Auth session
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            // Verify if user still exists on Supabase Auth server
            const { data: { user: serverUser }, error: userError } = await client.auth.getUser();
            if (userError || !serverUser) {
              // User was deleted from Supabase Auth!
              await client.auth.signOut().catch(() => {});
              setUser(null);
              localStorage.removeItem(LOCAL_USER_KEY);
            } else {
              const userEmail = session.user.email?.trim().toLowerCase();
              let profileData = null;

              if (userEmail) {
                const { data: byEmail } = await (anonClient || client)
                  .from('profiles')
                  .select('*')
                  .ilike('email', userEmail)
                  .maybeSingle();
                if (byEmail) profileData = byEmail;
              }

              if (!profileData) {
                const { data: byId } = await (anonClient || client)
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                if (byId) profileData = byId;
              }

              if (profileData) {
                if (profileData.id !== session.user.id && userEmail) {
                  try {
                    await (anonClient || client)
                      .from('profiles')
                      .update({ id: session.user.id, updated_at: new Date().toISOString() })
                      .ilike('email', userEmail);
                    profileData.id = session.user.id;
                  } catch (_) {}
                }

                // Strictly use profile and role fetched from Supabase
                const sanitized = sanitizeProfile(profileData);
                if (sanitized) {
                  if (session.user.user_metadata?.cover_url && !sanitized.cover_url && !session.user.user_metadata.cover_url.startsWith('data:')) {
                    sanitized.cover_url = session.user.user_metadata.cover_url;
                  }
                  if (session.user.user_metadata?.social_links) {
                    sanitized.social_links = {
                      ...session.user.user_metadata.social_links,
                      ...(sanitized.social_links || {})
                    };
                  }
                  setUser(sanitized);
                  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(sanitized));

                  const tokens = {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                  };
                  const idx = storedAccounts.findIndex(a => 
                    a.profile.id === sanitized.id || 
                    a.profile.email?.toLowerCase() === sanitized.email?.toLowerCase()
                  );
                  if (idx >= 0) {
                    storedAccounts[idx] = { profile: sanitized, session: tokens, lastActive: new Date().toISOString() };
                  } else {
                    storedAccounts = [{ profile: sanitized, session: tokens, lastActive: new Date().toISOString() }, ...storedAccounts];
                  }
                  setSavedAccounts(storedAccounts);
                  persistAccounts(storedAccounts);
                }
              } else {
                // User profile was deleted from public.profiles table in Supabase!
                // DO NOT auto-create it! Sign out immediately to respect admin deletion!
                await client.auth.signOut().catch(() => {});
                setUser(null);
                localStorage.removeItem(LOCAL_USER_KEY);
              }
            }
          } else {
            // 3. If no active Supabase Auth session, the user is signed out
            setUser(null);
            localStorage.removeItem(LOCAL_USER_KEY);
          }
        } catch (err) {
          console.error('Error fetching Supabase session/profile:', err);
          setUser(null);
          localStorage.removeItem(LOCAL_USER_KEY);
        } finally {
          setIsLoading(false);
        }

        const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsPasswordRecovery(true);
          }

          if (session?.user) {
            const userEmail = session.user.email?.trim().toLowerCase();
            let profileData = null;

            if (userEmail) {
              const { data: byEmail } = await client
                .from('profiles')
                .select('*')
                .ilike('email', userEmail)
                .maybeSingle();
              if (byEmail) profileData = byEmail;
            }

            if (!profileData) {
              const { data: byId } = await client
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (byId) profileData = byId;
            }

            if (profileData && profileData.id !== session.user.id && userEmail) {
              try {
                await client
                  .from('profiles')
                  .update({ id: session.user.id, updated_at: new Date().toISOString() })
                  .ilike('email', userEmail);
                profileData.id = session.user.id;
              } catch (_) {}
            }

            if (!profileData) {
              // Profile was deleted from profiles table! Do NOT auto-create!
              await client.auth.signOut().catch(() => {});
              setUser(null);
              localStorage.removeItem(LOCAL_USER_KEY);
              return;
            }

            if (profileData) {
              const sanitized = sanitizeProfile(profileData);
              if (sanitized) {
                if (session.user.user_metadata?.cover_url && !session.user.user_metadata.cover_url.startsWith('data:')) {
                  sanitized.cover_url = session.user.user_metadata.cover_url;
                }
                if (session.user.user_metadata?.social_links) {
                  sanitized.social_links = session.user.user_metadata.social_links;
                }
                if (session.user.user_metadata?.apps) {
                  sanitized.apps = session.user.user_metadata.apps;
                }
                setUser(sanitized);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(sanitized));
                upsertAccount(sanitized, { access_token: session.access_token, refresh_token: session.refresh_token });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            // Only clear state when explicitly signed out
            setUser(null);
            localStorage.removeItem(LOCAL_USER_KEY);
          }
        });

        setIsLoading(false);
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } else {
        // If Supabase client is not configured, do not revive mock users
        setUser(null);
        localStorage.removeItem(LOCAL_USER_KEY);
        setSavedAccounts([]);
        setIsLoading(false);
      }
    }

    initAuth();
  }, [isSupabaseConfigured]);

  // Presence Heartbeat: Keeps user marked active in the portal and updates last_active_at
  useEffect(() => {
    if (!user?.id) return;

    const pingActivity = async () => {
      const nowIso = new Date().toISOString();
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured) {
        try {
          const { error } = await client
            .from('profiles')
            .update({ 
              last_active_at: nowIso,
              updated_at: nowIso,
              status: user.status === 'offline' ? 'active' : (user.status || 'active')
            })
            .eq('id', user.id);
          
          if (error && error.message?.includes('last_active_at')) {
            await client
              .from('profiles')
              .update({ 
                updated_at: nowIso,
                status: user.status === 'offline' ? 'active' : (user.status || 'active')
              })
              .eq('id', user.id);
          }
        } catch (e) {
          console.warn('Presence ping:', e);
        }
      }

      setSavedAccounts(prev => {
        const idx = prev.findIndex(a => a.profile.id === user.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { 
            ...updated[idx], 
            lastActive: nowIso,
            profile: { ...updated[idx].profile, last_active_at: nowIso, status: 'active' }
          };
          persistAccounts(updated);
          return updated;
        }
        return prev;
      });
    };

    pingActivity();
    const interval = setInterval(pingActivity, 2 * 60 * 1000);

    const handleUserActivity = () => {
      const lastPing = parseInt(sessionStorage.getItem('ceova_last_ping_ts') || '0', 10);
      const now = Date.now();
      if (now - lastPing > 60000) {
        sessionStorage.setItem('ceova_last_ping_ts', now.toString());
        pingActivity();
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [user?.id, isSupabaseConfigured, user?.status]);

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean; email?: string }> => {
    const client = getSupabaseClient();

    if (!client || !isSupabaseConfigured) {
      return { success: false, error: 'Database not connected. Please verify Supabase configuration.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const rawPassword = password;

      // 1. Authenticate with Supabase Auth (Try clean lowercased email first)
      let authResult = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: rawPassword,
      });

      // Fallback A: If invalid credentials and password has leading/trailing spaces, retry with trimmed password
      if (authResult.error && rawPassword.trim() !== rawPassword && authResult.error.message?.toLowerCase().includes('invalid')) {
        authResult = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: rawPassword.trim(),
        });
      }

      // Fallback B: If invalid credentials and email had uppercase, retry with original trimmed email
      if (authResult.error && email.trim() !== cleanEmail && authResult.error.message?.toLowerCase().includes('invalid')) {
        authResult = await client.auth.signInWithPassword({
          email: email.trim(),
          password: rawPassword.trim(),
        });
      }

      // If Supabase returned an error:
      if (authResult.error) {
        const errMsg = authResult.error.message || '';
        const errLower = errMsg.toLowerCase();

        if (errLower.includes('rate limit') || (authResult.error as any).status === 429) {
          return {
            success: false,
            error: 'Too many login attempts. Supabase has temporarily restricted logins. Please wait a few minutes and try again.'
          };
        }

        if (errLower.includes('email not confirmed')) {
          return {
            success: false,
            requiresEmailConfirmation: true,
            error: `Email confirmation pending. Please check your email inbox at ${cleanEmail} and click the confirmation link to activate your account.`
          };
        }

        // Check if this member is invited / registered in CEOVA directory
        let existingProfile: any = null;
        const { data: p } = await client
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        existingProfile = p;

        if (!existingProfile) {
          const { data: inv } = await client
            .from('invitations')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();
          if (inv) existingProfile = inv;
        }

        // If not registered in CEOVA directory: strictly restrict access
        if (!existingProfile) {
          return {
            success: false,
            error: 'Wrong email. This email is not registered with CEOVA. If you think this is a mistake, please contact support.'
          };
        }

        // Member exists in CEOVA directory!
        // If account is still pending activation, send activation link via Google SMTP
        if (existingProfile.status === 'pending') {
          try {
            await sendAccountActivationEmail(cleanEmail);
          } catch (_) {}
          return {
            success: false,
            error: `Your account is pending activation. An activation link has been sent to ${cleanEmail}. Please check your email inbox to choose your password and activate your workspace.`
          };
        }

        // Check if this approved member is logging in for the first time without an established password
        if (rawPassword.trim().length >= 6) {
          try {
            const setupRes = await client.functions.invoke('send-notification-email', {
              body: {
                action: 'first-time-setup-or-verify',
                to: [cleanEmail],
                password: rawPassword.trim(),
              }
            });

            if (setupRes.data?.firstTimeActivated) {
              // Retry signInWithPassword with the newly activated password
              authResult = await client.auth.signInWithPassword({
                email: cleanEmail,
                password: rawPassword.trim(),
              });
            }
          } catch (setupErr) {
            console.warn('First-time setup check:', setupErr);
          }
        }

        // If authentication still has an error:
        if (authResult.error) {
          return {
            success: false,
            error: 'Incorrect email or password. If you haven\'t set your workspace password yet or forgot it, please click "Forgot password?" or "Reset My Password" below.'
          };
        }
      }

      // Authentication succeeded
      if (authResult.data.user) {
        let dbProfile: any = null;

        if (cleanEmail) {
          const { data: byEmail } = await client
            .from('profiles')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();
          if (byEmail) dbProfile = byEmail;
        }

        if (!dbProfile) {
          const { data: byId } = await client
            .from('profiles')
            .select('*')
            .eq('id', authResult.data.user.id)
            .maybeSingle();
          if (byId) dbProfile = byId;
        }

        if (!dbProfile) {
          // User authenticated in auth, but was removed from profiles directory! Deny login!
          await client.auth.signOut().catch(() => {});
          return {
            success: false,
            error: 'This account has been deactivated or removed from the CEOVA directory.'
          };
        }

        if (dbProfile && dbProfile.id !== authResult.data.user.id) {
          try {
            await client.from('profiles').update({ id: authResult.data.user.id }).ilike('email', cleanEmail);
            dbProfile.id = authResult.data.user.id;
          } catch (_) {}
        }

        const sanitizedProfile = sanitizeProfile(dbProfile)!;
        setUser(sanitizedProfile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(sanitizedProfile));
        const tokens = authResult.data.session ? {
          access_token: authResult.data.session.access_token,
          refresh_token: authResult.data.session.refresh_token,
        } : null;
        upsertAccount(sanitizedProfile, tokens);
        return { success: true };
      }

      return { success: false, error: 'User data missing from authentication response.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    meta: { fullName: string; role?: UserRole; phone?: string; avatar_url?: string }
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const client = getSupabaseClient();

    if (client && isSupabaseConfigured) {
      try {
        const cleanEmail = email.trim().toLowerCase();
        const assignedRole = sanitizeRole(meta.role);
        const { data, error } = await client.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : 'https://portal.ceovaai.com',
            data: {
              full_name: meta.fullName,
              role: assignedRole,
              phone: meta.phone,
              avatar_url: meta.avatar_url,
              department: assignedRole === 'admin' ? 'Administration' : 'General',
              designation: assignedRole === 'admin' ? 'Administrator' : assignedRole === 'intern' ? 'Intern' : 'Member'
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return { success: false, error: 'An account with this email already exists. Please log in or reset your password.' };
        }

        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            email: cleanEmail,
            full_name: meta.fullName,
            role: assignedRole,
            phone: meta.phone,
            avatar_url: meta.avatar_url,
            department: assignedRole === 'admin' ? 'Administration' : 'General',
            designation: assignedRole === 'admin' ? 'Administrator' : assignedRole === 'intern' ? 'Intern' : 'Member',
            status: 'active',
            created_at: new Date().toISOString(),
          };
          setUser(newProfile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
          const tokens = data.session ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          } : null;
          upsertAccount(newProfile, tokens);

          // Also upsert profile directly into Supabase profiles table
          try {
            await client.from('profiles').upsert([{
              id: data.user.id,
              email: cleanEmail,
              full_name: meta.fullName,
              role: assignedRole,
              phone: meta.phone,
              avatar_url: meta.avatar_url,
              department: assignedRole === 'admin' ? 'Administration' : 'General',
              designation: assignedRole === 'admin' ? 'Administrator' : assignedRole === 'intern' ? 'Intern' : 'Member',
              status: 'active',
              updated_at: new Date().toISOString()
            }], { onConflict: 'id' });
          } catch (upsertErr) {
            console.warn('Upsert profile in signUpWithEmail:', upsertErr);
          }
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Sign up failed' };
      }
    } else {
      return { success: false, error: 'Database not connected.' };
    }
  };

  const resetPasswordForEmail = async (emailToReset: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    const clean = emailToReset.trim().toLowerCase();
    try {
      const res = await sendAccountActivationEmail(clean);
      if (res.success) {
        return { success: true, message: `Password reset link sent to ${clean}! Please check your email inbox.` };
      }
      return { success: false, error: res.error || 'Failed to send reset link.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset link.' };
    }
  };

  const resendConfirmationEmail = async (emailToResend: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) {
      return { success: false, error: 'Database not connected.' };
    }
    try {
      const clean = emailToResend.trim().toLowerCase();
      const { error } = await client.auth.resend({
        type: 'signup',
        email: clean,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Verification link resent to your email!' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend confirmation email.' };
    }
  };

  const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) {
      return { success: false, error: 'Database not connected.' };
    }
    try {
      const { data, error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }

      // If user profile was pending, update it to active
      const userId = user?.id || data?.user?.id;
      const userEmail = user?.email || data?.user?.email;
      if (userId || userEmail) {
        try {
          if (userId) {
            await client
              .from('profiles')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('id', userId);
          } else if (userEmail) {
            await client
              .from('profiles')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .ilike('email', userEmail);
          }
          setUser(prev => prev ? { ...prev, status: 'active' } : null);
        } catch (_) {}
      }

      setIsPasswordRecovery(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  const switchAccount = async (userId: string): Promise<boolean> => {
    const target = savedAccounts.find(a => 
      a.profile.id === userId || 
      a.profile.email?.toLowerCase() === userId.toLowerCase()
    );
    if (!target) return false;

    const client = getSupabaseClient();
    const anonClient = getAnonSupabaseClient() || client;

    // Strictly fetch fresh account profile & role directly from Supabase
    let freshProfile = null;
    if (anonClient) {
      try {
        if (target.profile.email) {
          const { data } = await anonClient
            .from('profiles')
            .select('*')
            .ilike('email', target.profile.email.trim().toLowerCase())
            .maybeSingle();
          if (data) freshProfile = data;
        }
        if (!freshProfile && target.profile.id) {
          const { data } = await anonClient
            .from('profiles')
            .select('*')
            .eq('id', target.profile.id)
            .maybeSingle();
          if (data) freshProfile = data;
        }
      } catch (err) {
        console.warn('Error fetching fresh profile for switch:', err);
      }
    }

    const sanitized = sanitizeProfile(freshProfile || target.profile)!;

    if (client && isSupabaseConfigured) {
      if (!target.session?.access_token || !target.session?.refresh_token) {
        return false;
      }
      try {
        const { error: sessionErr } = await client.auth.setSession({
          access_token: target.session.access_token,
          refresh_token: target.session.refresh_token,
        });
        if (sessionErr) {
          console.warn('Could not restore session token for switched account:', sessionErr);
          return false;
        }
      } catch (err) {
        console.warn('Could not set session token for switched account:', err);
        return false;
      }
    }

    setUser(sanitized);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(sanitized));

    setSavedAccounts(prev => {
      const updated = prev.map(a => 
        (a.profile.id === target.profile.id || a.profile.email?.toLowerCase() === target.profile.email?.toLowerCase())
          ? { ...a, profile: sanitized, lastActive: new Date().toISOString() } 
          : a
      );
      persistAccounts(updated);
      return updated;
    });

    return true;
  };

  const removeAccount = async (userId: string) => {
    const updated = savedAccounts.filter(a => a.profile.id !== userId);
    setSavedAccounts(updated);
    persistAccounts(updated);

    if (user?.id === userId) {
      if (updated.length > 0) {
        await switchAccount(updated[0].profile.id);
      } else {
        await logout();
      }
    }
  };

  const logout = async () => {
    const currentUserId = user?.id;
    const currentUserEmail = user?.email;
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

    // Completely log out and remove from saved accounts on this device
    setSavedAccounts(prev => {
      const remaining = prev.filter(a => {
        const matchesId = currentUserId && a.profile.id === currentUserId;
        const matchesEmail = currentUserEmail && a.profile.email?.toLowerCase() === currentUserEmail.toLowerCase();
        return !matchesId && !matchesEmail;
      });
      persistAccounts(remaining);
      return remaining;
    });

    try {
      sessionStorage.clear();
      // Remove any Supabase auth tokens from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}
  };

  const logoutAll = async () => {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.error('Error signing out', e);
      }
    }
    setUser(null);
    setSavedAccounts([]);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);

    try {
      sessionStorage.clear();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}
  };

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    setSavedAccounts(prev => {
      const refreshed = prev.map(a => a.profile.id === user.id ? { ...a, profile: updated } : a);
      persistAccounts(refreshed);
      return refreshed;
    });

    const client = getSupabaseClient();
    const anonClient = getAnonSupabaseClient() || client;
    if (client && isSupabaseConfigured) {
      try {
        const { apps, ...dbUpdates } = updates;
        
        // 1. Direct update to Supabase public.profiles table (including cover_url, social_links, etc.)
        if (Object.keys(dbUpdates).length > 0) {
          const payload: any = { ...dbUpdates, updated_at: new Date().toISOString() };
          if (dbUpdates.phone) {
            payload.phone = dbUpdates.phone;
            payload.phone_number = dbUpdates.phone;
          }
          if (user.email) {
            await client
              .from('profiles')
              .update(payload)
              .ilike('email', user.email.trim().toLowerCase());
          } else {
            await client
              .from('profiles')
              .update(payload)
              .eq('id', user.id);
          }
        }

        // 2. Also keep user_metadata synced in Supabase Auth (safe metadata only, skip large base64)
        try {
          const metaUpdates: any = {};
          if (updates.full_name) metaUpdates.full_name = updates.full_name;
          if (updates.social_links) metaUpdates.social_links = updates.social_links;
          if (apps !== undefined) metaUpdates.apps = apps;
          if (updates.cover_url && !updates.cover_url.startsWith('data:')) {
            metaUpdates.cover_url = updates.cover_url;
          }
          if (updates.avatar_url && !updates.avatar_url.startsWith('data:')) {
            metaUpdates.avatar_url = updates.avatar_url;
          }

          if (Object.keys(metaUpdates).length > 0) {
            await client.auth.updateUser({ data: metaUpdates });
          }
        } catch (metaErr) {
          console.warn('Could not update user_metadata in auth:', metaErr);
        }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: sanitizeRole(user?.role),
        isAdmin: sanitizeRole(user?.role) === 'admin' || sanitizeRole(user?.role) === 'ceo',
        savedAccounts,
        isLoading,
        isSupabaseConfigured,
        isCSuite: sanitizeRole(user?.role) === 'admin' || sanitizeRole(user?.role) === 'ceo',
        loginWithEmail,
        signUpWithEmail,
        switchAccount,
        removeAccount,
        logout,
        logoutAll,
        updateCurrentProfile,
        updateSupabaseConfig,
        disconnectSupabase,
        resetPasswordForEmail,
        resendConfirmationEmail,
        isPasswordRecovery,
        setIsPasswordRecovery,
        updateUserPassword,
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
