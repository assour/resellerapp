import type { MarketplaceId, MarketplaceMeta } from './types';

export const marketplaceMeta: MarketplaceMeta[] = [
  {
    id: 'ebay',
    name: 'eBay',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: '#3468d8',
    officialApiPath: 'available',
    productionNote: 'Use eBay Sell Inventory API with OAuth, inventory locations, business policies, offers, and publish offer calls.'
  },
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    accent: '#1877f2',
    officialApiPath: 'manual',
    productionNote: 'Consumer Marketplace posting is not a general public API path. Use approved Meta commerce APIs only where eligible.'
  },
  {
    id: 'depop',
    name: 'Depop',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: '#ff4747',
    officialApiPath: 'partner',
    productionNote: 'Depop Selling API access requires partner approval. OAuth with PKCE belongs behind an approved integration.'
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    accent: '#111827',
    officialApiPath: 'partner',
    productionNote: 'Use TikTok Shop Partner Center APIs only after app approval and seller authorization.'
  },
  {
    id: 'mercari',
    name: 'Mercari',
    color: 'bg-red-50 text-red-700 border-red-200',
    accent: '#e23b3b',
    officialApiPath: 'manual',
    productionNote: 'No public seller-listing API was found. Keep Mercari as manual tracking unless approved access exists.'
  },
  {
    id: 'poshmark',
    name: 'Poshmark',
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    accent: '#d62471',
    officialApiPath: 'manual',
    productionNote: 'No public listing API was found. Do not scrape or automate closet actions.'
  },
  {
    id: 'etsy',
    name: 'Etsy',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    accent: '#f1641e',
    officialApiPath: 'available',
    productionNote: 'Use Etsy Open API v3 with OAuth scopes for listings, inventory, receipts, and shop management.'
  }
];

export const marketplaceIds = marketplaceMeta.map((marketplace) => marketplace.id) as MarketplaceId[];

export function marketplaceName(id: MarketplaceId) {
  return marketplaceMeta.find((marketplace) => marketplace.id === id)?.name || id;
}

export function isMarketplaceId(value: string): value is MarketplaceId {
  return marketplaceIds.includes(value as MarketplaceId);
}

export function getMarketplaceMeta(id: MarketplaceId) {
  return marketplaceMeta.find((marketplace) => marketplace.id === id) || marketplaceMeta[0];
}
