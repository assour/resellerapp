import { createMarketplaceAdapter } from '../mockMarketplaceAdapter';

export const etsyAdapter = createMarketplaceAdapter({ marketplaceId: 'etsy', supported: true, rateLimitEvery: 4 });
