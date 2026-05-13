import type { AdapterResult, Listing, ListingValidationResult, MarketplaceAdapter, MarketplaceId } from '../types';
import { marketplaceName } from '../marketplaces';
import { marketplaceUrl, sleep, uid } from '../utils';
import { getMarketplaceMissingFields, isManualOnlyMarketplace } from '../resellerFeatures';

const marketplaceFees: Record<MarketplaceId, string> = {
  ebay: 'estimated 13.25% final value fee',
  facebook: 'estimated 5% selling fee',
  depop: 'estimated 10% marketplace fee',
  tiktok: 'estimated 8% referral fee',
  mercari: 'estimated 10% selling fee',
  poshmark: 'estimated 20% selling fee',
  etsy: 'estimated 9.5% listing and transaction fees'
};

function validationFailure(marketplaceId: MarketplaceId, listing?: Listing): string | null {
  if (!listing) return null;
  if (listing.price <= 0) return `${marketplaceName(marketplaceId)} rejected the listing because price must be greater than $0.`;
  if (!listing.title.trim()) return `${marketplaceName(marketplaceId)} rejected the listing because a title is required.`;
  if (listing.title.toLowerCase().includes('forbidden')) return `${marketplaceName(marketplaceId)} policy check failed for this title in sandbox mode.`;
  return null;
}

async function validateListing(marketplaceId: MarketplaceId, listing: Listing): Promise<ListingValidationResult> {
  const missingFields = getMarketplaceMissingFields({ ...listing, marketplaces: listing.selectedMarketplaces }, marketplaceId);
  const warnings = isManualOnlyMarketplace(marketplaceId)
    ? [`${marketplaceName(marketplaceId)} is manual-safe unless official API access exists.`]
    : [];

  return {
    ok: missingFields.length === 0 && !isManualOnlyMarketplace(marketplaceId),
    missingFields,
    warnings,
    message: missingFields.length
      ? `Missing ${missingFields.join(', ')}.`
      : warnings[0] || `${marketplaceName(marketplaceId)} validation passed.`
  };
}

async function respond(marketplaceId: MarketplaceId, action: string, listing?: Listing): Promise<AdapterResult> {
  await sleep(250 + Math.round(Math.random() * 350));
  const marketplaceListingId = listing ? uid(`${marketplaceId}_${listing.id}`) : uid(`${marketplaceId}_connection`);
  const failedMessage = validationFailure(marketplaceId, listing);

  if (failedMessage) {
    return {
      ok: false,
      status: 'failed',
      marketplaceListingId,
      url: marketplaceUrl(marketplaceId, marketplaceListingId),
      message: failedMessage,
      error: failedMessage,
      lastSyncedAt: new Date().toISOString()
    };
  }

  return {
    ok: true,
    status: 'succeeded',
    marketplaceListingId,
    url: marketplaceUrl(marketplaceId, marketplaceListingId),
    message: `${marketplaceName(marketplaceId)} ${action} completed in sandbox mode with ${marketplaceFees[marketplaceId]}.`,
    lastSyncedAt: new Date().toISOString()
  };
}

export function createMockMarketplaceAdapter(marketplaceId: MarketplaceId): MarketplaceAdapter {
  return {
    marketplaceId,
    connect: () => respond(marketplaceId, 'connection'),
    disconnect: () => respond(marketplaceId, 'disconnect'),
    validateListing: (listing) => validateListing(marketplaceId, listing),
    publishListing: (listing) => respond(marketplaceId, 'publish listing', listing),
    delistListing: (marketplaceListingId) => respond(marketplaceId, `delist listing ${marketplaceListingId}`),
    updateListing: (listing) => respond(marketplaceId, 'update listing', listing),
    deleteListing: (marketplaceListingId) => respond(marketplaceId, `delete listing ${marketplaceListingId}`),
    markSold: (marketplaceListingId) => respond(marketplaceId, `mark sold ${marketplaceListingId}`),
    syncInventory: (listing) => respond(marketplaceId, 'inventory sync', listing),
    getStatus: () => respond(marketplaceId, 'status check')
  };
}
