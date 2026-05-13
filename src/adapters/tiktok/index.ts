import { createMarketplaceAdapter } from '../mockMarketplaceAdapter';

export const tiktokAdapter = createMarketplaceAdapter({ marketplaceId: 'tiktok', supported: true, partnerRequired: true, rateLimitEvery: 7 });
