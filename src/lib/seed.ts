import { marketplaceMeta } from './marketplaces';
import { isManualOnlyMarketplace } from './resellerFeatures';
import type { AppData, AppNotification, AppSettings, AuthSession, InventoryItem, Listing, MarketplaceAccount, MarketplaceListing, Order, Payment, SyncIssue, SyncLog, SyncQueueJob, User } from './types';

const now = new Date('2026-05-10T14:30:00.000Z');
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const demoUser: User = {
  id: 'usr_demo',
  name: 'Demo Reseller',
  email: 'demo@resellsync.app',
  avatarColor: 'bg-emerald-700'
};

export const demoAuthSession: AuthSession = {
  user: demoUser,
  token: 'mock_session_demo_reseller',
  expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
  provider: 'demo'
};

export const demoAccounts: MarketplaceAccount[] = marketplaceMeta.map((marketplace, index) => ({
  id: marketplace.id,
  name: marketplace.name,
  status: index % 3 === 1 ? 'disconnected' : 'connected',
  connected: index % 3 !== 1,
  lastSyncedAt: index % 3 !== 1 ? iso(index + 1) : null,
  permissions: ['Read listings', 'Publish listings', 'Sync inventory', 'Read orders'],
  health: marketplace.officialApiPath === 'manual' ? 'limited' : 'healthy',
  accessTokenPreview: index % 3 !== 1 ? `mock_${marketplace.id}_****${1420 + index}` : undefined
}));

export const demoInventory: InventoryItem[] = [
  {
    id: 'inv_501',
    title: 'Vintage Levi 501 Jeans',
    description: 'Classic straight-leg denim with light fading and a strong resale history.',
    category: 'Denim',
    brand: 'Levi\'s',
    size: '32x30',
    condition: 'Good',
    price: 68,
    quantity: 1,
    shippingPrice: 8.95,
    images: ['denim'],
    cost: 18,
    sku: 'DENIM-LEVIS-501-3230',
    bin: 'A12',
    rack: 'R1',
    shelf: 'S3',
    lowStockThreshold: 1,
    etsyClassification: 'vintage',
    marketplaceOverrides: [
      { marketplaceId: 'etsy', customCategory: 'Vintage Clothing', customPrice: 72 },
      { marketplaceId: 'poshmark', excluded: false }
    ],
    createdAt: iso(16),
    updatedAt: iso(2)
  },
  {
    id: 'inv_airmax',
    title: 'Nike Air Max 90 Sneakers',
    description: 'Clean white and navy sneakers, ready for a streetwear buyer.',
    category: 'Shoes',
    brand: 'Nike',
    size: '9.5',
    condition: 'Very Good',
    price: 115,
    quantity: 0,
    shippingPrice: 11.95,
    images: ['sneakers'],
    cost: 35,
    sku: 'SHOE-NIKE-AM90-95',
    bin: 'B04',
    rack: 'R2',
    shelf: 'S1',
    lowStockThreshold: 1,
    etsyClassification: '',
    marketplaceOverrides: [
      { marketplaceId: 'facebook', excluded: false, customTitle: 'Nike Air Max 90 - local pickup friendly' },
      { marketplaceId: 'mercari', excluded: false }
    ],
    createdAt: iso(22),
    updatedAt: iso(1)
  },
  {
    id: 'inv_synchilla',
    title: 'Patagonia Synchilla Fleece',
    description: 'Forest green quarter-snap fleece with cozy texture and no major flaws.',
    category: 'Outerwear',
    brand: 'Patagonia',
    size: 'M',
    condition: 'Excellent',
    price: 129,
    quantity: 1,
    shippingPrice: 9.95,
    images: ['fleece'],
    cost: 42,
    sku: 'OUT-PATA-SYN-M',
    bin: 'C09',
    rack: 'R1',
    shelf: 'S5',
    lowStockThreshold: 1,
    etsyClassification: '',
    marketplaceOverrides: [
      { marketplaceId: 'tiktok', customCategory: 'Men Clothing & Accessories' },
      { marketplaceId: 'etsy', excluded: true }
    ],
    createdAt: iso(12),
    updatedAt: iso(1)
  },
  {
    id: 'inv_coach',
    title: 'Coach Leather Crossbody Bag',
    description: 'Black leather crossbody with brass hardware and a polished look.',
    category: 'Bags',
    brand: 'Coach',
    size: 'Small',
    condition: 'Good',
    price: 92,
    quantity: 1,
    shippingPrice: 7.95,
    images: ['bag'],
    cost: 28,
    sku: 'BAG-COACH-CROSSBODY',
    bin: 'D02',
    rack: 'R3',
    shelf: 'S2',
    lowStockThreshold: 1,
    etsyClassification: '',
    marketplaceOverrides: [],
    createdAt: iso(9),
    updatedAt: iso(3)
  },
  {
    id: 'inv_etsy_mug',
    title: 'Hand-thrown Speckled Ceramic Mug',
    description: 'Small-batch mug with glaze variation, ideal for Etsy-style handmade shoppers.',
    category: 'Home',
    brand: 'Studio Batch',
    size: '12 oz',
    condition: 'New',
    price: 42,
    quantity: 4,
    shippingPrice: 6.5,
    images: ['mug'],
    cost: 12,
    sku: 'HOME-MUG-SPECKLED',
    bin: 'H01',
    rack: 'R4',
    shelf: 'S1',
    lowStockThreshold: 2,
    etsyClassification: 'handmade',
    marketplaceOverrides: [
      { marketplaceId: 'etsy', customTitle: 'Handmade speckled ceramic mug', customCategory: 'Home & Living' }
    ],
    createdAt: iso(5),
    updatedAt: iso(1)
  }
];

export const demoListings: Listing[] = [
  {
    id: 'lst_501',
    inventoryItemId: 'inv_501',
    title: demoInventory[0].title,
    description: demoInventory[0].description,
    category: demoInventory[0].category,
    brand: demoInventory[0].brand,
    size: demoInventory[0].size,
    condition: demoInventory[0].condition,
    price: demoInventory[0].price,
    quantity: demoInventory[0].quantity,
    shippingPrice: demoInventory[0].shippingPrice,
    images: demoInventory[0].images,
    cost: demoInventory[0].cost,
    sku: demoInventory[0].sku,
    bin: demoInventory[0].bin,
    rack: demoInventory[0].rack,
    shelf: demoInventory[0].shelf,
    lowStockThreshold: demoInventory[0].lowStockThreshold,
    etsyClassification: demoInventory[0].etsyClassification,
    marketplaceOverrides: demoInventory[0].marketplaceOverrides,
    selectedMarketplaces: ['ebay', 'depop', 'poshmark', 'etsy'],
    status: 'listed',
    createdAt: iso(14),
    updatedAt: iso(2)
  },
  {
    id: 'lst_airmax',
    inventoryItemId: 'inv_airmax',
    title: demoInventory[1].title,
    description: demoInventory[1].description,
    category: demoInventory[1].category,
    brand: demoInventory[1].brand,
    size: demoInventory[1].size,
    condition: demoInventory[1].condition,
    price: demoInventory[1].price,
    quantity: demoInventory[1].quantity,
    shippingPrice: demoInventory[1].shippingPrice,
    images: demoInventory[1].images,
    cost: demoInventory[1].cost,
    sku: demoInventory[1].sku,
    bin: demoInventory[1].bin,
    rack: demoInventory[1].rack,
    shelf: demoInventory[1].shelf,
    lowStockThreshold: demoInventory[1].lowStockThreshold,
    etsyClassification: demoInventory[1].etsyClassification,
    marketplaceOverrides: demoInventory[1].marketplaceOverrides,
    selectedMarketplaces: ['ebay', 'facebook', 'mercari', 'poshmark'],
    status: 'sold',
    createdAt: iso(20),
    updatedAt: iso(1)
  },
  {
    id: 'lst_synchilla',
    inventoryItemId: 'inv_synchilla',
    title: demoInventory[2].title,
    description: demoInventory[2].description,
    category: demoInventory[2].category,
    brand: demoInventory[2].brand,
    size: demoInventory[2].size,
    condition: demoInventory[2].condition,
    price: demoInventory[2].price,
    quantity: demoInventory[2].quantity,
    shippingPrice: demoInventory[2].shippingPrice,
    images: demoInventory[2].images,
    cost: demoInventory[2].cost,
    sku: demoInventory[2].sku,
    bin: demoInventory[2].bin,
    rack: demoInventory[2].rack,
    shelf: demoInventory[2].shelf,
    lowStockThreshold: demoInventory[2].lowStockThreshold,
    etsyClassification: demoInventory[2].etsyClassification,
    marketplaceOverrides: demoInventory[2].marketplaceOverrides,
    selectedMarketplaces: ['ebay', 'tiktok', 'depop', 'etsy'],
    status: 'listed',
    createdAt: iso(11),
    updatedAt: iso(1)
  }
];

export const demoMarketplaceListings: MarketplaceListing[] = [
  ...demoListings[0].selectedMarketplaces.map((marketplaceId) => ({
    id: `mpl_${demoListings[0].id}_${marketplaceId}`,
    listingId: demoListings[0].id,
    inventoryItemId: demoListings[0].inventoryItemId,
    marketplaceId,
    marketplaceListingId: `mock_${marketplaceId}_501`,
    status: isManualOnlyMarketplace(marketplaceId) ? 'manual_required' as const : 'listed' as const,
    url: `https://demo.resellsync.local/${marketplaceId}/mock_${marketplaceId}_501`,
    lastSyncedAt: iso(2)
  })),
  ...demoListings[1].selectedMarketplaces.map((marketplaceId) => ({
    id: `mpl_${demoListings[1].id}_${marketplaceId}`,
    listingId: demoListings[1].id,
    inventoryItemId: demoListings[1].inventoryItemId,
    marketplaceId,
    marketplaceListingId: `mock_${marketplaceId}_airmax`,
    status: marketplaceId === 'ebay' ? 'sold' as const : 'deactivated' as const,
    url: `https://demo.resellsync.local/${marketplaceId}/mock_${marketplaceId}_airmax`,
    lastSyncedAt: iso(1)
  })),
  ...demoListings[2].selectedMarketplaces.map((marketplaceId) => ({
    id: `mpl_${demoListings[2].id}_${marketplaceId}`,
    listingId: demoListings[2].id,
    inventoryItemId: demoListings[2].inventoryItemId,
    marketplaceId,
    marketplaceListingId: `mock_${marketplaceId}_synchilla`,
    status: isManualOnlyMarketplace(marketplaceId) ? 'manual_required' as const : 'listed' as const,
    url: `https://demo.resellsync.local/${marketplaceId}/mock_${marketplaceId}_synchilla`,
    lastSyncedAt: iso(1)
  }))
];

export const demoOrders: Order[] = [
  {
    id: 'ord_1001',
    buyerName: 'Avery Stone',
    marketplaceId: 'ebay',
    productTitle: 'Nike Air Max 90 Sneakers',
    listingId: 'lst_airmax',
    salePrice: 108,
    fees: 14.31,
    netProfit: 58.69,
    shippingStatus: 'shipped',
    orderStatus: 'paid',
    soldAt: iso(1)
  }
];

export const demoPayments: Payment[] = [
  {
    id: 'pay_1001',
    orderId: 'ord_1001',
    listingId: 'lst_airmax',
    amount: 108,
    provider: 'DemoPay',
    status: 'succeeded',
    createdAt: iso(1)
  }
];

export const demoSyncLogs: SyncLog[] = [
  { id: 'log_1', level: 'success', message: 'Sold on eBay. Deactivated Facebook Marketplace, Mercari, and Poshmark listings.', marketplaceId: 'ebay', listingId: 'lst_airmax', createdAt: iso(1) },
  { id: 'log_2', level: 'success', message: 'Patagonia Synchilla Fleece published to eBay, TikTok Shop, Depop, and Etsy.', listingId: 'lst_synchilla', createdAt: iso(1) },
  { id: 'log_3', level: 'warning', message: 'Etsy sync failed for Vintage Levi 501 Jeans because classification needs review.', marketplaceId: 'etsy', listingId: 'lst_501', createdAt: iso(0) },
  { id: 'log_4', level: 'info', message: 'Manual export created for Poshmark closet workflow.', marketplaceId: 'poshmark', listingId: 'lst_501', createdAt: iso(0) },
  { id: 'log_5', level: 'success', message: 'Listing created from reseller template.', listingId: 'lst_501', createdAt: iso(3) },
  { id: 'log_6', level: 'info', message: 'Marketplace health check completed with 5 connected channels.', createdAt: iso(0) }
];

export const demoSyncIssues: SyncIssue[] = [
  {
    id: 'issue_ebay_category',
    marketplaceId: 'ebay',
    listingId: 'lst_501',
    listingTitle: 'Vintage Levi 501 Jeans',
    status: 'failed',
    errorReason: 'Missing eBay category mapping for Denim.',
    suggestedFix: 'Choose an eBay category before retrying the sync.',
    attempts: 1,
    createdAt: iso(0),
    updatedAt: iso(0)
  },
  {
    id: 'issue_etsy_classification',
    marketplaceId: 'etsy',
    listingId: 'lst_501',
    listingTitle: 'Vintage Levi 501 Jeans',
    status: 'failed',
    errorReason: 'Etsy requires handmade, vintage, or supply classification.',
    suggestedFix: 'Set the Etsy classification to vintage for qualified items.',
    attempts: 1,
    createdAt: iso(0),
    updatedAt: iso(0)
  },
  {
    id: 'issue_depop_partner',
    marketplaceId: 'depop',
    listingId: 'lst_synchilla',
    listingTitle: 'Patagonia Synchilla Fleece',
    status: 'pending',
    errorReason: 'Depop partner API approval is not connected for production.',
    suggestedFix: 'Keep the sandbox sync for demos or add approved Depop partner credentials.',
    attempts: 0,
    createdAt: iso(1),
    updatedAt: iso(0)
  },
  {
    id: 'issue_facebook_manual',
    marketplaceId: 'facebook',
    listingId: 'lst_airmax',
    listingTitle: 'Nike Air Max 90 Sneakers',
    status: 'manual_required',
    errorReason: 'Facebook Marketplace is manual-only in this demo.',
    suggestedFix: 'Use the manual export checklist instead of automated posting.',
    attempts: 0,
    createdAt: iso(1),
    updatedAt: iso(1)
  },
  {
    id: 'issue_mercari_manual',
    marketplaceId: 'mercari',
    listingId: 'lst_airmax',
    listingTitle: 'Nike Air Max 90 Sneakers',
    status: 'manual_required',
    errorReason: 'Mercari is manual-only unless official API access exists.',
    suggestedFix: 'Track the listing manually and do not use scraping or browser automation.',
    attempts: 0,
    createdAt: iso(1),
    updatedAt: iso(1)
  },
  {
    id: 'issue_poshmark_manual',
    marketplaceId: 'poshmark',
    listingId: 'lst_501',
    listingTitle: 'Vintage Levi 501 Jeans',
    status: 'manual_required',
    errorReason: 'Poshmark is manual-only unless official API access exists.',
    suggestedFix: 'Create a closet-ready export and update status manually.',
    attempts: 0,
    createdAt: iso(0),
    updatedAt: iso(0)
  },
  {
    id: 'issue_sync_success',
    marketplaceId: 'tiktok',
    listingId: 'lst_synchilla',
    listingTitle: 'Patagonia Synchilla Fleece',
    status: 'success',
    errorReason: 'TikTok Shop sandbox listing synced successfully.',
    suggestedFix: 'No action needed.',
    attempts: 1,
    createdAt: iso(1),
    updatedAt: iso(1)
  }
];

export const demoSyncQueue: SyncQueueJob[] = [
  {
    id: 'job_tiktok_inventory',
    action: 'inventory_sync',
    status: 'succeeded',
    marketplaceId: 'tiktok',
    listingId: 'lst_synchilla',
    listingTitle: 'Patagonia Synchilla Fleece',
    attempt: 1,
    maxAttempts: 3,
    resultMessage: 'TikTok Shop sandbox inventory count confirmed.',
    createdAt: iso(1),
    updatedAt: iso(1)
  },
  {
    id: 'job_etsy_retry',
    action: 'publish',
    status: 'failed',
    marketplaceId: 'etsy',
    listingId: 'lst_501',
    listingTitle: 'Vintage Levi 501 Jeans',
    attempt: 2,
    maxAttempts: 3,
    error: 'Missing Etsy classification.',
    createdAt: iso(0),
    updatedAt: iso(0)
  },
  {
    id: 'job_poshmark_manual',
    action: 'publish',
    status: 'manual_required',
    marketplaceId: 'poshmark',
    listingId: 'lst_501',
    listingTitle: 'Vintage Levi 501 Jeans',
    attempt: 0,
    maxAttempts: 0,
    resultMessage: 'Manual export prepared for Poshmark.',
    createdAt: iso(0),
    updatedAt: iso(0)
  }
];

export const demoNotifications: AppNotification[] = [
  {
    id: 'note_sold_airmax',
    type: 'sold_item',
    tone: 'success',
    title: 'Item sold',
    message: 'Nike Air Max 90 sold on eBay and auto-delisting was triggered.',
    read: false,
    marketplaceId: 'ebay',
    listingId: 'lst_airmax',
    createdAt: iso(1)
  },
  {
    id: 'note_etsy_failed',
    type: 'sync_failed',
    tone: 'warning',
    title: 'Sync needs attention',
    message: 'Etsy requires a handmade, vintage, or supply classification.',
    read: false,
    marketplaceId: 'etsy',
    listingId: 'lst_501',
    createdAt: iso(0)
  },
  {
    id: 'note_low_stock',
    type: 'low_inventory',
    tone: 'warning',
    title: 'Low inventory',
    message: 'Several items are at or below their low-stock threshold.',
    read: true,
    createdAt: iso(0)
  }
];

export const demoSettings: AppSettings = {
  autoDelistEnabled: true,
  syncRetries: 3,
  syncDelayMs: 450,
  notifySyncComplete: true,
  notifyLowInventory: true,
  notifyFailedSync: true,
  notifySoldItems: true,
  billingPlan: 'demo'
};

export const seedData: AppData = {
  user: null,
  marketplaceAccounts: demoAccounts,
  inventoryItems: demoInventory,
  listings: demoListings,
  marketplaceListings: demoMarketplaceListings,
  orders: demoOrders,
  payments: demoPayments,
  syncLogs: demoSyncLogs,
  syncIssues: demoSyncIssues,
  syncQueue: demoSyncQueue,
  notifications: demoNotifications,
  settings: demoSettings,
  authSession: null
};
