import type { MarketplaceAdapter, MarketplaceId } from '../types';
import { depopAdapter } from './depopAdapter';
import { ebayAdapter } from './ebayAdapter';
import { etsyAdapter } from './etsyAdapter';
import { facebookAdapter } from './facebookAdapter';
import { mercariAdapter } from './mercariAdapter';
import { poshmarkAdapter } from './poshmarkAdapter';
import { tiktokShopAdapter } from './tiktokShopAdapter';

export const marketplaceAdapters: Record<MarketplaceId, MarketplaceAdapter> = {
  ebay: ebayAdapter,
  facebook: facebookAdapter,
  depop: depopAdapter,
  tiktok: tiktokShopAdapter,
  mercari: mercariAdapter,
  poshmark: poshmarkAdapter,
  etsy: etsyAdapter
};
