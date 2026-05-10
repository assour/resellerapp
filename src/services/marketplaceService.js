import { demoMode, marketplaceConfig } from '../config';
import { marketplaces } from '../data/mockData';
import { demoStore } from './storage';

export async function getMarketplaces() {
  return marketplaces.map((marketplace) => ({ ...marketplace, ...marketplaceConfig[marketplace.id] }));
}

export async function getConnections() {
  if (!demoMode) console.warn('Real marketplace APIs are not connected yet. Using local demo connection states.');
  return demoStore.getConnections();
}

export async function setConnection(marketplaceId, connected) {
  if (!marketplaceConfig[marketplaceId]) {
    throw new Error('Unsupported marketplace');
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
  demoStore.addActivity(`${marketplaceConfig[marketplaceId].label} ${connected ? 'connected' : 'disconnected'}.`, 'connection');
  return next;
}
