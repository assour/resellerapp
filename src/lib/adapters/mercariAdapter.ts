import { createMockMarketplaceAdapter } from './mockAdapterFactory';

// Production: no public seller-listing API is assumed. Keep this adapter manual unless official access is granted.
export const mercariAdapter = createMockMarketplaceAdapter('mercari');
