import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys
const STORAGE_URL_KEY = 'ceova_supabase_url';
const STORAGE_ANON_KEY = 'ceova_supabase_anon_key';

// Default Supabase project credentials for Ceova Portal (used when env vars are not set in Vercel/hosting)
const DEFAULT_SUPABASE_URL = 'https://yuvkddpfcokqctomsbun.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dmtkZHBmY29rcWN0b21zYnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzgwMjksImV4cCI6MjA5OTgxNDAyOX0.6sNzr-PbmDTsETaVAKycsxiwJCVKTgwsgFuWshnj1hM';

export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  // Check env vars first
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  // Check localStorage runtime override
  let localUrl = '';
  let localKey = '';
  try {
    localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
    localKey = localStorage.getItem(STORAGE_ANON_KEY) || '';
  } catch (e) {
    console.warn('Could not read localStorage', e);
  }

  const url = (localUrl || envUrl || DEFAULT_SUPABASE_URL).trim();
  const key = (localKey || envKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  // Basic validation (must have valid format and not be placeholder)
  const isConfigured = 
    url.length > 10 && 
    url.startsWith('http') && 
    !url.includes('your-project') &&
    key.length > 20 &&
    !key.includes('your-anon-key');

  return { url, key, isConfigured };
}

export function saveSupabaseCredentials(url: string, key: string) {
  try {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, key.trim());
  } catch (e) {
    console.error('Failed to save Supabase credentials', e);
  }
}

export function clearSupabaseCredentials() {
  try {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  } catch (e) {
    console.error('Failed to clear Supabase credentials', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (supabaseInstance && url === lastUsedUrl && key === lastUsedKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getAnonSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch (err) {
    console.error('Failed to create anon Supabase client:', err);
    return null;
  }
}

// Health check / Connection test
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    
    // Check if we can connect to the project auth or rest endpoint
    const { data: _data, error } = await testClient.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      // It reached Supabase, even if table doesn't exist yet
      if (error.message.includes('relation "public.profiles" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! Note: Please run the provided SQL schema in your Supabase SQL Editor.',
        };
      }
      // If unauthorized or bad key
      if (error.code === 'PGRST301' || error.message.toLowerCase().includes('jwt')) {
        return { success: false, message: `Invalid Supabase Anon Key: ${error.message}` };
      }
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect. Please verify the URL and Anon Key.',
    };
  }
}
