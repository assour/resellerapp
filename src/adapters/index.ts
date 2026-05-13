import type { MarketplaceAdapter, MarketplaceId } from '@/lib/types';
import { depopAdapter } from './depop';
import { ebayAdapter } from './ebay';
import { etsyAdapter } from './etsy';
import { facebookAdapter } from './facebook';
import { mercariAdapter } from './mercari';
import { poshmarkAdapter } from './poshmark';
import { tiktokAdapter } from './tiktok';

export const marketplaceAdapters: Record<MarketplaceId, MarketplaceAdapter> = {
  ebay: ebayAdapter,
  facebook: facebookAdapter,
  depop: depopAdapter,
  tiktok: tiktokAdapter,
  mercari: mercariAdapter,
  poshmark: poshmarkAdapter,
  etsy: etsyAdapter
};
