import { createClient } from '@supabase/supabase-js';
import { supabaseConfig, supabaseConfigured } from '../config';

export const supabase = supabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

export async function getSupabaseUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('Supabase user lookup failed.', error);
    return null;
  }
  return data.user;
}

export async function getSupabaseUserId() {
  const user = await getSupabaseUser();
  return user?.id || null;
}

export function assertSupabaseReady() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or keep demo mode enabled.');
  }
  return supabase;
}
