import { useSupabaseData } from '../config';
import { demoStore } from './storage';
import { getSupabaseUserId, supabase } from './supabaseClient';

function mapActivity(row) {
  return {
    id: row.id,
    message: row.message,
    date: row.date,
    type: row.type
  };
}

export async function getActivity() {
  if (!useSupabaseData) return demoStore.getActivity();

  const userId = await getSupabaseUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('activity')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Could not load activity: ${error.message}`);
  return data.map(mapActivity);
}

export async function addActivity(message, type = 'info') {
  if (!useSupabaseData) {
    demoStore.addActivity(message, type);
    return;
  }

  const userId = await getSupabaseUserId();
  if (!userId) return;

  const { error } = await supabase.from('activity').insert({
    user_id: userId,
    message,
    type,
    date: new Date().toISOString()
  });

  if (error) console.warn('Could not save activity.', error);
}
