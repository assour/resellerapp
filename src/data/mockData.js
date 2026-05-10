export const marketplaces = [
  { id: 'ebay', name: 'eBay' },
  { id: 'facebook', name: 'Facebook Marketplace' },
  { id: 'depop', name: 'Depop' },
  { id: 'mercari', name: 'Mercari' },
  { id: 'poshmark', name: 'Poshmark' }
];

export const demoUser = {
  name: 'Demo Reseller',
  email: 'demo@example.com'
};

export const demoConnections = {
  ebay: { connected: true, lastSync: '2026-05-08T14:20:00.000Z' },
  facebook: { connected: false, lastSync: null },
  depop: { connected: true, lastSync: '2026-05-09T10:15:00.000Z' },
  mercari: { connected: false, lastSync: null },
  poshmark: { connected: true, lastSync: '2026-05-07T18:45:00.000Z' }
};

export const demoProducts = [
  {
    id: 'prd-001',
    title: 'Vintage Levi 501 Jeans',
    description: 'Classic straight-leg denim with light fading and no major flaws.',
    category: 'Jeans',
    brand: 'Levi\'s',
    size: '32x30',
    condition: 'Good',
    cost: 18,
    listingPrice: 68,
    soldPrice: null,
    status: 'listed',
    marketplaceStatus: { ebay: 'listed', facebook: 'draft', depop: 'listed', mercari: 'draft', poshmark: 'listed' },
    photos: ['placeholder-denim'],
    createdDate: '2026-04-25'
  },
  {
    id: 'prd-002',
    title: 'Nike Air Max 90 Sneakers',
    description: 'White and navy sneakers, cleaned and ready to ship.',
    category: 'Shoes',
    brand: 'Nike',
    size: '10',
    condition: 'Very Good',
    cost: 35,
    listingPrice: 115,
    soldPrice: 108,
    status: 'sold',
    marketplaceStatus: { ebay: 'sold', facebook: 'delisted', depop: 'delisted', mercari: 'draft', poshmark: 'delisted' },
    photos: ['placeholder-shoes'],
    createdDate: '2026-04-18'
  },
  {
    id: 'prd-003',
    title: 'Patagonia Synchilla Fleece',
    description: 'Cozy pullover fleece in forest green with quarter snap closure.',
    category: 'Outerwear',
    brand: 'Patagonia',
    size: 'M',
    condition: 'Excellent',
    cost: 42,
    listingPrice: 129,
    soldPrice: null,
    status: 'listed',
    marketplaceStatus: { ebay: 'listed', facebook: 'draft', depop: 'listed', mercari: 'draft', poshmark: 'listed' },
    photos: ['placeholder-fleece'],
    createdDate: '2026-04-28'
  },
  {
    id: 'prd-004',
    title: 'Coach Leather Crossbody Bag',
    description: 'Black leather bag with brass hardware and adjustable strap.',
    category: 'Bags',
    brand: 'Coach',
    size: 'One Size',
    condition: 'Good',
    cost: 28,
    listingPrice: 92,
    soldPrice: null,
    status: 'draft',
    marketplaceStatus: { ebay: 'draft', facebook: 'draft', depop: 'draft', mercari: 'draft', poshmark: 'draft' },
    photos: ['placeholder-bag'],
    createdDate: '2026-05-01'
  },
  {
    id: 'prd-005',
    title: 'Madewell Denim Jacket',
    description: 'Medium wash denim jacket with relaxed fit and clean cuffs.',
    category: 'Jackets',
    brand: 'Madewell',
    size: 'S',
    condition: 'Very Good',
    cost: 22,
    listingPrice: 74,
    soldPrice: null,
    status: 'listed',
    marketplaceStatus: { ebay: 'listed', facebook: 'draft', depop: 'failed', mercari: 'draft', poshmark: 'listed' },
    photos: ['placeholder-jacket'],
    createdDate: '2026-05-02'
  },
  {
    id: 'prd-006',
    title: 'Lululemon Align Leggings',
    description: 'High-rise leggings in black with minimal wear.',
    category: 'Activewear',
    brand: 'Lululemon',
    size: '6',
    condition: 'Good',
    cost: 20,
    listingPrice: 58,
    soldPrice: 54,
    status: 'sold',
    marketplaceStatus: { ebay: 'delisted', facebook: 'draft', depop: 'sold', mercari: 'draft', poshmark: 'delisted' },
    photos: ['placeholder-activewear'],
    createdDate: '2026-04-15'
  },
  {
    id: 'prd-007',
    title: 'Ralph Lauren Oxford Shirt',
    description: 'Blue button-down shirt with embroidered chest logo.',
    category: 'Shirts',
    brand: 'Ralph Lauren',
    size: 'L',
    condition: 'Excellent',
    cost: 12,
    listingPrice: 45,
    soldPrice: null,
    status: 'listed',
    marketplaceStatus: { ebay: 'listed', facebook: 'draft', depop: 'listed', mercari: 'draft', poshmark: 'listed' },
    photos: ['placeholder-shirt'],
    createdDate: '2026-05-04'
  },
  {
    id: 'prd-008',
    title: 'Dr. Martens 1460 Boots',
    description: 'Black leather 8-eye boots with light creasing and strong soles.',
    category: 'Shoes',
    brand: 'Dr. Martens',
    size: '8',
    condition: 'Good',
    cost: 48,
    listingPrice: 138,
    soldPrice: null,
    status: 'delisted',
    marketplaceStatus: { ebay: 'delisted', facebook: 'draft', depop: 'delisted', mercari: 'draft', poshmark: 'delisted' },
    photos: ['placeholder-boots'],
    createdDate: '2026-04-10'
  }
];

export const demoActivity = [
  { id: 'act-1', message: 'Nike Air Max 90 Sneakers sold on eBay.', date: '2026-05-09T13:05:00.000Z', type: 'sale' },
  { id: 'act-2', message: 'Patagonia Synchilla Fleece listed to eBay, Depop, and Poshmark.', date: '2026-05-08T16:30:00.000Z', type: 'listing' },
  { id: 'act-3', message: 'Madewell Denim Jacket failed to publish on Depop.', date: '2026-05-08T09:10:00.000Z', type: 'warning' }
];
