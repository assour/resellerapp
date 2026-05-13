import { createMockMarketplaceAdapter } from './mockAdapterFactory';

// Production: replace mock calls with eBay Sell Inventory API calls after OAuth, seller policies, and inventory locations are configured.
export const ebayAdapter = createMockMarketplaceAdapter('ebay');
