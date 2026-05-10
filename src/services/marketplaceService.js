import { demoMode, isMarketplaceConfigured, marketplaceConfig, useSupabaseData } from '../config';
import { marketplaces } from '../data/mockData';
import { addActivity } from './activityService';
import { demoStore } from './storage';
import { getSupabaseUserId, supabase } from './supabaseClient';

export async function getMarketplaces() {
  return marketplaces.map((marketplace) => ({
    ...marketplace,
    ...marketplaceConfig[marketplace.id],
    apiConfigured: isMarketplaceConfigured(marketplace.id)
  }));
}

export async function getConnections() {
  if (useSupabaseData) {
    const userId = await getSupabaseUserId();
    if (!userId) return {};

    const { data, error } = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`Could not load marketplace connections: ${error.message}`);

    const defaults = Object.fromEntries(marketplaces.map((marketplace) => [marketplace.id, { connected: false, lastSync: null }]));
    data.forEach((connection) => {
      defaults[connection.marketplace_id] = {
        connected: connection.connected,
        lastSync: connection.last_sync
      };
    });
    return defaults;
  }

  if (!demoMode) console.warn('Marketplace APIs are not connected yet. Using local connection states.');
  return demoStore.getConnections();
}

export async function setConnection(marketplaceId, connected) {
  if (!marketplaceConfig[marketplaceId]) {
    throw new Error('Unsupported marketplace');
  }

  if (useSupabaseData) {
    const userId = await getSupabaseUserId();
    if (!userId) throw new Error('Please sign in before changing marketplace connections.');

    const { error } = await supabase.from('marketplace_connections').upsert({
      user_id: userId,
      marketplace_id: marketplaceId,
      connected,
      last_sync: connected ? new Date().toISOString() : null
    }, { onConflict: 'user_id,marketplace_id' });

    if (error) throw new Error(`Could not update connection: ${error.message}`);
    await addActivity(`${marketplaceConfig[marketplaceId].label} ${connected ? 'connected' : 'disconnected'}.`, 'connection');
    return getConnections();
  }

  const connections = demoStore.getConnections();
  const next = {
    ...connections,
    [marketplaceId]: {
      connected,
      lastSync: connected ? new Date().toISOString() : null
    }
  };
  demoStore.setConnections(next);
  await addActivity(`${marketplaceConfig[marketplaceId].label} ${connected ? 'connected' : 'disconnected'}.`, 'connection');
  return next;
}
