import { createMockMarketplaceAdapter } from './mockAdapterFactory';

// Production: replace mock calls with Etsy Open API v3 using OAuth scopes for listings, inventory, and receipts.
export const etsyAdapter = createMockMarketplaceAdapter('etsy');
