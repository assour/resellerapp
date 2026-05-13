import { createMockMarketplaceAdapter } from './mockAdapterFactory';

// Production: Depop Selling API requires partner approval and OAuth with PKCE.
export const depopAdapter = createMockMarketplaceAdapter('depop');
