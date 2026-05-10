import { supabaseConfig, useSupabaseData } from '../config';
import { getSupabaseUserId, supabase } from './supabaseClient';

function safeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'photo';
}

export async function uploadProductPhotos(productId, files = []) {
  if (!files.length) return [];
  if (!useSupabaseData) return files.map((file) => file.name);

  const userId = await getSupabaseUserId();
  if (!userId) throw new Error('Please sign in before uploading photos.');

  const urls = [];
  for (const file of files) {
    const path = `${userId}/${productId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from(supabaseConfig.storageBucket)
      .upload(path, file, { upsert: true });

    if (error) throw new Error(`Photo upload failed: ${error.message}`);

    const { data } = supabase.storage.from(supabaseConfig.storageBucket).getPublicUrl(path);
    urls.push(data.publicUrl || path);
  }

  return urls;
}
