import type { MarketplaceId } from './types';

export const marketplaceCredentialRequirements: Record<MarketplaceId, string[]> = {
  ebay: ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_REDIRECT_URI'],
  etsy: ['ETSY_CLIENT_ID', 'ETSY_REDIRECT_URI'],
  depop: ['DEPOP_CLIENT_ID', 'DEPOP_CLIENT_SECRET', 'DEPOP_AUTH_URL', 'DEPOP_TOKEN_URL', 'DEPOP_REDIRECT_URI'],
  facebook: ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI'],
  mercari: [],
  poshmark: [],
  tiktok: ['TIKTOK_SHOP_CLIENT_KEY', 'TIKTOK_SHOP_CLIENT_SECRET', 'TIKTOK_SHOP_MERCHANT_ID']
};

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function validateMarketplaceCredentials(env: Record<string, string | undefined> = process.env) {
  return Object.entries(marketplaceCredentialRequirements).map(([marketplaceId, required]) => {
    const missing = required.filter((key) => !env[key]);
    return {
      marketplaceId: marketplaceId as MarketplaceId,
      configured: missing.length === 0,
      missing,
      mode: isDemoMode() || missing.length ? 'demo' : 'ready'
    };
  });
}
