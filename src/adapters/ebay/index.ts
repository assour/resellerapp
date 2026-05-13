import { createMarketplaceAdapter } from '../mockMarketplaceAdapter';

export const ebayAdapter = createMarketplaceAdapter({ marketplaceId: 'ebay', supported: true, rateLimitEvery: 5 });
