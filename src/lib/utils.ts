import type { ListingStatus, MarketplaceId } from './types';

export function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function shortDate(value: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function statusTone(status: ListingStatus) {
  const tones: Record<ListingStatus, string> = {
    draft: 'bg-slate-100 text-slate-700',
    listed: 'bg-emerald-100 text-emerald-700',
    sold: 'bg-violet-100 text-violet-700',
    deactivated: 'bg-amber-100 text-amber-700',
    failed: 'bg-rose-100 text-rose-700',
    pending: 'bg-blue-100 text-blue-700',
    manual_required: 'bg-orange-100 text-orange-700'
  };
  return tones[status];
}

export function marketplaceUrl(marketplaceId: MarketplaceId, marketplaceListingId: string) {
  return `https://demo.resellsync.local/${marketplaceId}/${marketplaceListingId}`;
}

export function calcFees(price: number, marketplaceId: MarketplaceId) {
  const rates: Record<MarketplaceId, number> = {
    ebay: 0.1325,
    facebook: 0.05,
    depop: 0.1,
    tiktok: 0.08,
    mercari: 0.1,
    poshmark: 0.2,
    etsy: 0.095
  };
  return Math.round(price * rates[marketplaceId] * 100) / 100;
}
