import { marketplaceAdapters } from '@/adapters';
import { createAutoDelistJobs, createNotification, createSyncLog, publishListingThroughSyncEngine } from '@/lib/syncEngine';
import type { AppData, Listing, MarketplaceId, SyncIssue } from '@/lib/types';
import { marketplaceName } from '@/lib/marketplaces';

export const syncService = {
  publishListing: publishListingThroughSyncEngine,

  async connectMarketplace(data: AppData, id: MarketplaceId) {
    const result = await marketplaceAdapters[id].connect();
    const now = result.lastSyncedAt;
    return {
      ...data,
      marketplaceAccounts: data.marketplaceAccounts.map((account) =>
        account.id === id
          ? {
              ...account,
              connected: result.ok,
              status: result.ok ? 'connected' as const : 'error' as const,
              health: result.ok ? 'healthy' as const : 'limited' as const,
              lastSyncedAt: now,
              accessTokenPreview: result.ok ? `mock_${id}_****${Math.floor(1000 + Math.random() * 9000)}` : account.accessTokenPreview
            }
          : account
      ),
      syncLogs: [createSyncLog(result.message, result.ok ? 'success' : 'warning', id), ...data.syncLogs],
      notifications: [createNotification(result.ok ? 'sync_completed' : 'sync_failed', result.ok ? 'success' : 'warning', result.ok ? 'Marketplace connected' : 'Manual channel', result.message, id), ...data.notifications]
    };
  },

  async disconnectMarketplace(data: AppData, id: MarketplaceId) {
    const result = await marketplaceAdapters[id].disconnect();
    return {
      ...data,
      marketplaceAccounts: data.marketplaceAccounts.map((account) =>
        account.id === id
          ? { ...account, connected: false, status: 'disconnected' as const, lastSyncedAt: null, accessTokenPreview: undefined }
          : account
      ),
      syncLogs: [createSyncLog(result.message, 'info', id), ...data.syncLogs]
    };
  },

  async retryIssue(issue: SyncIssue) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const manual = issue.status === 'manual_required';
    return {
      ...issue,
      status: manual ? 'manual_required' as const : 'success' as const,
      attempts: issue.attempts + 1,
      errorReason: manual ? issue.errorReason : `${marketplaceName(issue.marketplaceId)} sandbox retry succeeded.`,
      suggestedFix: manual ? issue.suggestedFix : 'No action needed.',
      updatedAt: new Date().toISOString()
    };
  },

  createAutoDelistJobs(listing: Listing, soldMarketplaceId: MarketplaceId, data: AppData) {
    return createAutoDelistJobs(listing, soldMarketplaceId, data.marketplaceListings);
  }
};
