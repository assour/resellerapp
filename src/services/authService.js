import { demoMode, useSupabaseData } from '../config';
import { demoStore } from './storage';
import { getSupabaseUser, supabase } from './supabaseClient';

export async function getCurrentUser() {
  if (demoMode) return demoStore.getUser();
  if (!useSupabaseData) return demoStore.getUser();

  const user = await getSupabaseUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(`Could not load profile: ${error.message}`);

  if (!profile) {
    const fallbackProfile = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Reseller',
      email: user.email
    };
    await supabase.from('profiles').upsert(fallbackProfile);
    return fallbackProfile;
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email || user.email
  };
}

export async function signInWithEmail(email, password) {
  if (!useSupabaseData) throw new Error('Turn off demo mode and add Supabase keys before signing in.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUpWithEmail(name, email, password) {
  if (!useSupabaseData) throw new Error('Turn off demo mode and add Supabase keys before signing up.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) throw new Error(error.message);

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name: name || data.user.email?.split('@')[0] || 'Reseller',
      email: data.user.email
    });
  }
}

export async function signOut() {
  if (!useSupabaseData) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
