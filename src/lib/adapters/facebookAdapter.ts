import { createMockMarketplaceAdapter } from './mockAdapterFactory';

// Production: use only approved Meta commerce APIs. Do not scrape or automate Facebook Marketplace posting.
export const facebookAdapter = createMockMarketplaceAdapter('facebook');
