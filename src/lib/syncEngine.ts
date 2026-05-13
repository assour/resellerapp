import { marketplaceAdapters } from '@/adapters';
import { marketplaceName } from './marketplaces';
import { getMarketplaceMissingFields, isManualOnlyMarketplace } from './resellerFeatures';
import type { AppNotification, Listing, MarketplaceId, MarketplaceListing, SyncIssue, SyncLog, SyncQueueJob } from './types';
import { marketplaceUrl, uid } from './utils';

interface SyncEngineResult {
  marketplaceListings: MarketplaceListing[];
  logs: SyncLog[];
  issues: SyncIssue[];
  queue: SyncQueueJob[];
  notifications: AppNotification[];
}

function now() {
  return new Date().toISOString();
}

export function createSyncLog(message: string, level: SyncLog['level'] = 'info', marketplaceId?: MarketplaceId, listingId?: string): SyncLog {
  return {
    id: uid('log'),
    level,
    message,
    marketplaceId,
    listingId,
    createdAt: now()
  };
}

export function createNotification(
  type: AppNotification['type'],
  tone: AppNotification['tone'],
  title: string,
  message: string,
  marketplaceId?: MarketplaceId,
  listingId?: string
): AppNotification {
  return {
    id: uid('note'),
    type,
    tone,
    title,
    message,
    read: false,
    marketplaceId,
    listingId,
    createdAt: now()
  };
}

function createIssue(
  listing: Listing,
  marketplaceId: MarketplaceId,
  status: SyncIssue['status'],
  errorReason: string,
  suggestedFix: string,
  attempts = 0
): SyncIssue {
  const timestamp = now();
  return {
    id: uid('issue'),
    marketplaceId,
    listingId: listing.id,
    listingTitle: listing.title,
    status,
    errorReason,
    suggestedFix,
    attempts,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createJob(listing: Listing, marketplaceId: MarketplaceId, status: SyncQueueJob['status'] = 'queued', error?: string): SyncQueueJob {
  const timestamp = now();
  return {
    id: uid('job'),
    action: 'publish',
    status,
    marketplaceId,
    listingId: listing.id,
    listingTitle: listing.title,
    attempt: status === 'queued' ? 0 : 1,
    maxAttempts: isManualOnlyMarketplace(marketplaceId) ? 0 : 3,
    error,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function publishListingThroughSyncEngine(listing: Listing): Promise<SyncEngineResult> {
  const marketplaceListings: MarketplaceListing[] = [];
  const logs: SyncLog[] = [];
  const issues: SyncIssue[] = [];
  const queue: SyncQueueJob[] = [];
  const notifications: AppNotification[] = [];

  for (const marketplaceId of listing.selectedMarketplaces) {
    const override = listing.marketplaceOverrides.find((item) => item.marketplaceId === marketplaceId);

    if (override?.excluded) {
      queue.push(createJob(listing, marketplaceId, 'manual_required', 'Excluded by marketplace override.'));
      logs.push(createSyncLog(`${marketplaceName(marketplaceId)} skipped by marketplace override.`, 'info', marketplaceId, listing.id));
      issues.push(createIssue(listing, marketplaceId, 'manual_required', 'Excluded by marketplace override.', 'Remove the exclusion if you want this marketplace included.'));
      continue;
    }

    if (isManualOnlyMarketplace(marketplaceId)) {
      const marketplaceListingId = uid(`manual_${marketplaceId}`);
      queue.push(createJob(listing, marketplaceId, 'manual_required', 'Manual channel.'));
      marketplaceListings.push({
        id: uid('mpl'),
        listingId: listing.id,
        inventoryItemId: listing.inventoryItemId,
        marketplaceId,
        marketplaceListingId,
        status: 'manual_required',
        url: marketplaceUrl(marketplaceId, marketplaceListingId),
        lastSyncedAt: now(),
        error: 'Manual channel'
      });
      logs.push(createSyncLog(`${marketplaceName(marketplaceId)} manual export created. Automated posting stays disabled unless official API access exists.`, 'info', marketplaceId, listing.id));
      issues.push(createIssue(listing, marketplaceId, 'manual_required', `${marketplaceName(marketplaceId)} is manual-only in this demo.`, 'Use the exported listing details to post manually and update status afterward.'));
      notifications.push(createNotification('info', 'info', 'Manual export ready', `${marketplaceName(marketplaceId)} needs manual posting.`, marketplaceId, listing.id));
      continue;
    }

    const missing = getMarketplaceMissingFields({ ...listing, marketplaces: listing.selectedMarketplaces }, marketplaceId);
    if (missing.length > 0) {
      const error = `Missing ${missing.join(', ')}.`;
      const marketplaceListingId = uid(`failed_${marketplaceId}`);
      queue.push(createJob(listing, marketplaceId, 'failed', error));
      marketplaceListings.push({
        id: uid('mpl'),
        listingId: listing.id,
        inventoryItemId: listing.inventoryItemId,
        marketplaceId,
        marketplaceListingId,
        status: 'failed',
        url: marketplaceUrl(marketplaceId, marketplaceListingId),
        lastSyncedAt: now(),
        error
      });
      logs.push(createSyncLog(`${marketplaceName(marketplaceId)} sync failed: ${error}`, 'warning', marketplaceId, listing.id));
      issues.push(createIssue(listing, marketplaceId, 'failed', error, 'Complete required marketplace fields, then retry.', 1));
      notifications.push(createNotification('sync_failed', 'warning', 'Sync failed', `${marketplaceName(marketplaceId)} needs ${missing.join(', ')}.`, marketplaceId, listing.id));
      continue;
    }

    const job = createJob(listing, marketplaceId, 'running');
    queue.push(job);
    const result = await marketplaceAdapters[marketplaceId].publishListing(listing);
    const marketplaceListingId = result.marketplaceListingId || uid(`mock_${marketplaceId}`);
    const finalStatus = result.ok ? 'listed' : result.status === 'retrying' ? 'pending' : 'failed';

    marketplaceListings.push({
      id: uid('mpl'),
      listingId: listing.id,
      inventoryItemId: listing.inventoryItemId,
      marketplaceId,
      marketplaceListingId,
      status: finalStatus,
      url: result.url || marketplaceUrl(marketplaceId, marketplaceListingId),
      lastSyncedAt: result.lastSyncedAt,
      error: result.error
    });

    job.status = result.ok ? 'succeeded' : result.status === 'retrying' ? 'retrying' : 'failed';
    job.attempt = 1;
    job.resultMessage = result.message;
    job.error = result.error;
    job.updatedAt = now();

    logs.push(createSyncLog(result.message, result.ok ? 'success' : 'warning', marketplaceId, listing.id));
    issues.push(createIssue(
      listing,
      marketplaceId,
      result.ok ? 'success' : result.status === 'retrying' ? 'pending' : 'failed',
      result.ok ? `${marketplaceName(marketplaceId)} accepted the sandbox publish.` : result.message,
      result.ok ? 'No action needed.' : 'Retry from Sync Status or review marketplace requirements.',
      1
    ));
    notifications.push(createNotification(
      result.ok ? 'sync_completed' : 'sync_failed',
      result.ok ? 'success' : 'warning',
      result.ok ? 'Sync completed' : 'Sync needs retry',
      result.message,
      marketplaceId,
      listing.id
    ));
  }

  return { marketplaceListings, logs, issues, queue, notifications };
}

export function createAutoDelistJobs(listing: Listing, soldMarketplaceId: MarketplaceId, marketplaceListings: MarketplaceListing[]) {
  const timestamp = now();
  const jobs = marketplaceListings
    .filter((marketplaceListing) => marketplaceListing.listingId === listing.id && marketplaceListing.marketplaceId !== soldMarketplaceId && marketplaceListing.status === 'listed')
    .map((marketplaceListing) => ({
      id: uid('job'),
      action: 'delist' as const,
      status: 'queued' as const,
      marketplaceId: marketplaceListing.marketplaceId,
      listingId: listing.id,
      listingTitle: listing.title,
      attempt: 0,
      maxAttempts: 3,
      createdAt: timestamp,
      updatedAt: timestamp
    }));

  return jobs;
}
