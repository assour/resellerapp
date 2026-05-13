import type { AdapterResult, Listing, ListingValidationResult, MarketplaceAdapter, MarketplaceId, SyncJobStatus } from '@/lib/types';
import { marketplaceName } from '@/lib/marketplaces';
import { getMarketplaceMissingFields, isManualOnlyMarketplace, marketplaceFeeRates } from '@/lib/resellerFeatures';
import { marketplaceUrl, sleep, uid } from '@/lib/utils';

interface AdapterOptions {
  marketplaceId: MarketplaceId;
  supported: boolean;
  partnerRequired?: boolean;
  rateLimitEvery?: number;
}

const counters: Partial<Record<MarketplaceId, number>> = {};

function now() {
  return new Date().toISOString();
}

function result(marketplaceId: MarketplaceId, ok: boolean, status: SyncJobStatus, message: string, marketplaceListingId = uid(`${marketplaceId}_listing`), error?: string): AdapterResult {
  return {
    ok,
    status,
    marketplaceListingId,
    url: marketplaceUrl(marketplaceId, marketplaceListingId),
    message,
    error,
    lastSyncedAt: now()
  };
}

function applyOverride(listing: Listing, marketplaceId: MarketplaceId): Listing {
  const override = listing.marketplaceOverrides.find((item) => item.marketplaceId === marketplaceId);
  if (!override) return listing;

  return {
    ...listing,
    title: override.customTitle || listing.title,
    price: override.customPrice || listing.price,
    category: override.customCategory || listing.category
  };
}

export function createMarketplaceAdapter({ marketplaceId, supported, partnerRequired = false, rateLimitEvery = 0 }: AdapterOptions): MarketplaceAdapter {
  async function validateListing(listing: Listing): Promise<ListingValidationResult> {
    const override = listing.marketplaceOverrides.find((item) => item.marketplaceId === marketplaceId);
    const missingFields = getMarketplaceMissingFields({ ...applyOverride(listing, marketplaceId), marketplaces: listing.selectedMarketplaces }, marketplaceId);
    const warnings: string[] = [];

    if (override?.excluded) warnings.push(`${marketplaceName(marketplaceId)} is excluded by marketplace override.`);
    if (!supported || isManualOnlyMarketplace(marketplaceId)) warnings.push(`${marketplaceName(marketplaceId)} is manual-safe in this demo unless official API access exists.`);
    if (partnerRequired) warnings.push(`${marketplaceName(marketplaceId)} requires partner approval before production sync.`);

    return {
      ok: missingFields.length === 0 && supported && !override?.excluded,
      missingFields,
      warnings,
      message: missingFields.length
        ? `Missing ${missingFields.join(', ')}.`
        : warnings[0] || `${marketplaceName(marketplaceId)} listing schema is ready.`
    };
  }

  async function publishListing(listing: Listing): Promise<AdapterResult> {
    await sleep(320 + marketplaceId.length * 45);
    const validation = await validateListing(listing);

    if (!supported || isManualOnlyMarketplace(marketplaceId)) {
      return result(
        marketplaceId,
        false,
        'manual_required',
        `${marketplaceName(marketplaceId)} manual export prepared. Automated posting is disabled until official API access exists.`,
        uid(`manual_${marketplaceId}`)
      );
    }

    if (!validation.ok) {
      return result(marketplaceId, false, 'failed', validation.message, uid(`failed_${marketplaceId}`), validation.message);
    }

    counters[marketplaceId] = (counters[marketplaceId] || 0) + 1;
    if (rateLimitEvery > 0 && counters[marketplaceId] && counters[marketplaceId]! % rateLimitEvery === 0) {
      return result(
        marketplaceId,
        false,
        'retrying',
        `${marketplaceName(marketplaceId)} sandbox rate limit. Sync engine will retry.`,
        uid(`rate_${marketplaceId}`),
        'Sandbox rate limit'
      );
    }

    const listingId = uid(`${marketplaceId}_${listing.sku || listing.id}`);
    const feeRate = Math.round(marketplaceFeeRates[marketplaceId] * 10000) / 100;
    return result(
      marketplaceId,
      true,
      'succeeded',
      `${marketplaceName(marketplaceId)} published ${applyOverride(listing, marketplaceId).title} with estimated ${feeRate}% fee.`,
      listingId
    );
  }

  async function connect() {
    await sleep(500 + marketplaceId.length * 40);
    return result(
      marketplaceId,
      supported,
      supported ? 'succeeded' : 'manual_required',
      supported
        ? `${marketplaceName(marketplaceId)} OAuth sandbox connected.`
        : `${marketplaceName(marketplaceId)} is tracked as manual-only until official access exists.`,
      uid(`${marketplaceId}_connection`)
    );
  }

  return {
    marketplaceId,
    connect,
    disconnect: async () => {
      await sleep(240);
      return result(marketplaceId, true, 'succeeded', `${marketplaceName(marketplaceId)} disconnected.`);
    },
    validateListing,
    publishListing,
    delistListing: async (marketplaceListingId: string) => {
      await sleep(260);
      return result(marketplaceId, true, 'succeeded', `${marketplaceName(marketplaceId)} listing ${marketplaceListingId} delisted.`, marketplaceListingId);
    },
    updateListing: async (listing: Listing) => {
      await sleep(260);
      return result(marketplaceId, true, 'succeeded', `${marketplaceName(marketplaceId)} updated ${listing.title}.`);
    },
    deleteListing: async (marketplaceListingId: string) => {
      await sleep(260);
      return result(marketplaceId, true, 'succeeded', `${marketplaceName(marketplaceId)} listing ${marketplaceListingId} removed.`, marketplaceListingId);
    },
    markSold: async (marketplaceListingId: string) => {
      await sleep(240);
      return result(marketplaceId, true, 'succeeded', `${marketplaceName(marketplaceId)} listing ${marketplaceListingId} marked sold.`, marketplaceListingId);
    },
    syncInventory: async (listing: Listing) => {
      await sleep(280);
      return result(marketplaceId, true, 'succeeded', `${marketplaceName(marketplaceId)} inventory synced to quantity ${listing.quantity}.`);
    },
    getStatus: async () => {
      await sleep(180);
      return result(
        marketplaceId,
        supported,
        supported ? 'succeeded' : 'manual_required',
        supported ? `${marketplaceName(marketplaceId)} adapter healthy.` : `${marketplaceName(marketplaceId)} manual workflow healthy.`
      );
    }
  };
}
