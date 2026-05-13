import type { ListingFormInput, MarketplaceId } from './types';

export const manualOnlyMarketplaces: MarketplaceId[] = ['facebook', 'mercari', 'poshmark'];
export const autoSyncMarketplaces: MarketplaceId[] = ['ebay', 'depop', 'tiktok', 'etsy'];

export const marketplaceFeeRates: Record<MarketplaceId, number> = {
  ebay: 0.1325,
  facebook: 0.05,
  depop: 0.1,
  tiktok: 0.08,
  mercari: 0.1,
  poshmark: 0.2,
  etsy: 0.095
};

export const expectedCsvColumns = ['title', 'price', 'brand', 'size', 'condition', 'sku', 'quantity', 'cost'];

export const demoImportRows = [
  { title: 'Adidas Samba Classic', price: '86', brand: 'Adidas', size: '10', condition: 'Very Good', sku: 'SHOE-SAMBA-10', quantity: '1', cost: '28' },
  { title: 'Harley Davidson Vintage Tee', price: '54', brand: 'Harley Davidson', size: 'L', condition: 'Good', sku: 'TEE-HARLEY-L', quantity: '1', cost: '11' },
  { title: 'Sony Cyber-shot DSC-W800', price: '118', brand: 'Sony', size: 'Compact', condition: 'Excellent', sku: 'ELEC-SONY-W800', quantity: '1', cost: '42' }
];

export const listingTemplates: Array<{ name: string; description: string; values: Partial<ListingFormInput> }> = [
  {
    name: 'Sneakers',
    description: 'Streetwear-friendly shoe listing with size, condition, and SKU filled.',
    values: {
      title: 'Nike Dunk Low Sneakers',
      category: 'Shoes',
      brand: 'Nike',
      size: '10',
      condition: 'Very Good',
      price: 120,
      cost: 38,
      shippingPrice: 11.95,
      marketplaceOverrides: [],
      sku: 'SHOE-NIKE-DUNK-10',
      bin: 'B12',
      rack: 'R2',
      shelf: 'S4'
    }
  },
  {
    name: 'Hoodie',
    description: 'Casual apparel format with brand, fit, and soft goods storage.',
    values: {
      title: 'Champion Reverse Weave Hoodie',
      category: 'Sweatshirts',
      brand: 'Champion',
      size: 'XL',
      condition: 'Good',
      price: 58,
      cost: 14,
      shippingPrice: 8.95,
      marketplaceOverrides: [],
      sku: 'HOODIE-CHAMP-XL',
      bin: 'C07',
      rack: 'R1',
      shelf: 'S2'
    }
  },
  {
    name: 'Vintage tee',
    description: 'Fast-fill template for graphic tees and single-stitch finds.',
    values: {
      title: 'Vintage Graphic Tee',
      category: 'T-Shirts',
      brand: 'Vintage',
      size: 'L',
      condition: 'Good',
      price: 42,
      cost: 6,
      shippingPrice: 5.95,
      marketplaceOverrides: [{ marketplaceId: 'etsy', customCategory: 'Vintage Clothing' }],
      sku: 'TEE-VTG-L',
      bin: 'A03',
      rack: 'R1',
      shelf: 'S1',
      etsyClassification: 'vintage'
    }
  },
  {
    name: 'Electronics',
    description: 'Electronics listing with model-style title and higher fee planning.',
    values: {
      title: 'Canon PowerShot Digital Camera',
      category: 'Electronics',
      brand: 'Canon',
      size: 'Compact',
      condition: 'Excellent',
      price: 149,
      cost: 55,
      shippingPrice: 9.95,
      marketplaceOverrides: [{ marketplaceId: 'etsy', excluded: true }],
      sku: 'ELEC-CANON-PS',
      bin: 'E02',
      rack: 'R4',
      shelf: 'S3'
    }
  },
  {
    name: 'Collectible',
    description: 'Collectible format for small, trackable items with careful cost basis.',
    values: {
      title: 'Limited Edition Collectible Figure',
      category: 'Collectibles',
      brand: 'Independent',
      size: 'Boxed',
      condition: 'New',
      price: 74,
      cost: 22,
      shippingPrice: 7.95,
      marketplaceOverrides: [],
      sku: 'COLL-FIG-001',
      bin: 'D15',
      rack: 'R3',
      shelf: 'S5'
    }
  }
];

export function isManualOnlyMarketplace(id: MarketplaceId) {
  return manualOnlyMarketplaces.includes(id);
}

export function estimateListingFee(price: number, id: MarketplaceId) {
  return Math.round(price * marketplaceFeeRates[id] * 100) / 100;
}

export function getMarketplaceMissingFields(input: ListingFormInput, id: MarketplaceId) {
  const missing: string[] = [];

  if (!input.title.trim()) missing.push('title');
  if (!input.price || input.price <= 0) missing.push('sale price');
  if (!input.condition.trim()) missing.push('condition');
  if ((id === 'ebay' || id === 'etsy') && !input.category.trim()) missing.push(`${id === 'ebay' ? 'eBay category' : 'Etsy category'}`);
  if (id === 'etsy' && !input.etsyClassification.trim()) missing.push('handmade, vintage, or supply classification');
  if ((id === 'depop' || id === 'tiktok') && !input.sku.trim()) missing.push('SKU');
  if (id === 'depop' && !input.size.trim()) missing.push('size');
  if (id === 'tiktok' && input.quantity <= 0) missing.push('available quantity');

  return missing;
}

export function generateMockTitle(input: ListingFormInput) {
  const parts = [input.brand, input.category, input.size && `Size ${input.size}`, input.condition].filter(Boolean);
  return parts.length ? parts.join(' - ') : 'Resale-ready marketplace listing';
}

export function generateHashtags(input: ListingFormInput) {
  return [input.brand, input.category, input.condition, input.size]
    .filter(Boolean)
    .map((part) => `#${part.replace(/[^a-z0-9]/gi, '').toLowerCase()}`)
    .join(' ');
}

export function generateSeoKeywords(input: ListingFormInput) {
  return [input.brand, input.category, input.condition, input.size, 'authentic', 'ready to ship', 'reseller verified']
    .filter(Boolean)
    .join(', ');
}
