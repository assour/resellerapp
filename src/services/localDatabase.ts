import { seedData } from '@/lib/seed';
import type { AppData } from '@/lib/types';

export const STORAGE_KEY = 'resellsync.demo.v2';
const LEGACY_STORAGE_KEY = 'resellsync.demo.v1';

export function cloneSeed(): AppData {
  return JSON.parse(JSON.stringify(seedData)) as AppData;
}

function normalizeData(value: Partial<AppData>): AppData {
  const seed = cloneSeed();
  return {
    user: value.user === undefined ? seed.user : value.user,
    marketplaceAccounts: Array.isArray(value.marketplaceAccounts) ? value.marketplaceAccounts : seed.marketplaceAccounts,
    inventoryItems: Array.isArray(value.inventoryItems) ? value.inventoryItems.map((item, index) => ({
      ...item,
      size: item.size || 'One Size',
      sku: item.sku || `SKU-${index + 1}`,
      bin: item.bin || 'A01',
      rack: item.rack || 'R1',
      shelf: item.shelf || 'S1',
      lowStockThreshold: Number.isFinite(Number(item.lowStockThreshold)) ? Number(item.lowStockThreshold) : 1,
      etsyClassification: item.etsyClassification || '',
      marketplaceOverrides: Array.isArray(item.marketplaceOverrides) ? item.marketplaceOverrides : []
    })) : seed.inventoryItems,
    listings: Array.isArray(value.listings) ? value.listings.map((listing, index) => ({
      ...listing,
      size: listing.size || 'One Size',
      cost: Number.isFinite(Number(listing.cost)) ? Number(listing.cost) : 0,
      sku: listing.sku || `SKU-${index + 1}`,
      bin: listing.bin || 'A01',
      rack: listing.rack || 'R1',
      shelf: listing.shelf || 'S1',
      lowStockThreshold: Number.isFinite(Number(listing.lowStockThreshold)) ? Number(listing.lowStockThreshold) : 1,
      etsyClassification: listing.etsyClassification || '',
      marketplaceOverrides: Array.isArray(listing.marketplaceOverrides) ? listing.marketplaceOverrides : []
    })) : seed.listings,
    marketplaceListings: Array.isArray(value.marketplaceListings) ? value.marketplaceListings : seed.marketplaceListings,
    orders: Array.isArray(value.orders) ? value.orders : seed.orders,
    payments: Array.isArray(value.payments) ? value.payments : seed.payments,
    syncLogs: Array.isArray(value.syncLogs) ? value.syncLogs : seed.syncLogs,
    syncIssues: Array.isArray(value.syncIssues) ? value.syncIssues : seed.syncIssues,
    syncQueue: Array.isArray(value.syncQueue) ? value.syncQueue : seed.syncQueue,
    notifications: Array.isArray(value.notifications) ? value.notifications : seed.notifications,
    settings: value.settings ? { ...seed.settings, ...value.settings } : seed.settings,
    authSession: value.authSession === undefined ? seed.authSession : value.authSession
  };
}

export const localDatabase = {
  load(): AppData {
    if (typeof window === 'undefined') return cloneSeed();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? normalizeData(JSON.parse(raw) as Partial<AppData>) : cloneSeed();
    } catch {
      return cloneSeed();
    }
  },

  save(data: AppData) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  reset() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return cloneSeed();
  }
};
