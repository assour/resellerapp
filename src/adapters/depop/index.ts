import { createMarketplaceAdapter } from '../mockMarketplaceAdapter';

export const depopAdapter = createMarketplaceAdapter({ marketplaceId: 'depop', supported: true, partnerRequired: true, rateLimitEvery: 6 });
