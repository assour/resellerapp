import { createMockMarketplaceAdapter } from './mockAdapterFactory';

// Production: do not scrape or automate Poshmark closet actions. Use official or approved APIs only.
export const poshmarkAdapter = createMockMarketplaceAdapter('poshmark');
