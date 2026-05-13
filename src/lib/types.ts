export type MarketplaceId =
  | 'ebay'
  | 'facebook'
  | 'depop'
  | 'tiktok'
  | 'mercari'
  | 'poshmark'
  | 'etsy';

export type MarketplaceStatus = 'connected' | 'disconnected' | 'syncing' | 'error';
export type ListingStatus = 'draft' | 'listed' | 'sold' | 'deactivated' | 'failed' | 'pending' | 'manual_required';
export type OrderStatus = 'paid' | 'pending' | 'refunded';
export type ShippingStatus = 'label_ready' | 'packed' | 'shipped' | 'delivered';
export type PaymentStatus = 'succeeded' | 'processing' | 'failed';
export type SyncLogLevel = 'success' | 'info' | 'warning' | 'error';
export type SyncIssueStatus = 'success' | 'failed' | 'pending' | 'manual_required';
export type SyncJobAction = 'publish' | 'delist' | 'inventory_sync' | 'connect' | 'disconnect';
export type SyncJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'retrying' | 'manual_required';
export type NotificationType = 'sync_completed' | 'low_inventory' | 'sync_failed' | 'sold_item' | 'info';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface MarketplaceMeta {
  id: MarketplaceId;
  name: string;
  color: string;
  accent: string;
  officialApiPath: 'available' | 'partner' | 'manual';
  productionNote: string;
}

export interface MarketplaceAccount {
  id: MarketplaceId;
  name: string;
  status: MarketplaceStatus;
  connected: boolean;
  lastSyncedAt: string | null;
  permissions: string[];
  health: 'healthy' | 'limited' | 'attention';
  accessTokenPreview?: string;
}

export interface MarketplaceOverride {
  marketplaceId: MarketplaceId;
  customTitle?: string;
  customPrice?: number;
  customCategory?: string;
  excluded?: boolean;
}

export interface InventoryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  size: string;
  condition: string;
  price: number;
  quantity: number;
  shippingPrice: number;
  images: string[];
  cost: number;
  sku: string;
  bin: string;
  rack: string;
  shelf: string;
  lowStockThreshold: number;
  etsyClassification: string;
  marketplaceOverrides: MarketplaceOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  inventoryItemId: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  size: string;
  condition: string;
  price: number;
  quantity: number;
  shippingPrice: number;
  images: string[];
  cost: number;
  sku: string;
  bin: string;
  rack: string;
  shelf: string;
  lowStockThreshold: number;
  etsyClassification: string;
  marketplaceOverrides: MarketplaceOverride[];
  selectedMarketplaces: MarketplaceId[];
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;
  listingId: string;
  inventoryItemId: string;
  marketplaceId: MarketplaceId;
  marketplaceListingId: string;
  status: ListingStatus;
  url: string;
  lastSyncedAt: string;
  error?: string;
}

export interface Order {
  id: string;
  buyerName: string;
  marketplaceId: MarketplaceId;
  productTitle: string;
  listingId: string;
  salePrice: number;
  fees: number;
  netProfit: number;
  shippingStatus: ShippingStatus;
  orderStatus: OrderStatus;
  soldAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  listingId: string;
  amount: number;
  provider: 'DemoPay' | 'Stripe Test Mode';
  status: PaymentStatus;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  level: SyncLogLevel;
  message: string;
  createdAt: string;
  marketplaceId?: MarketplaceId;
  listingId?: string;
}

export interface SyncIssue {
  id: string;
  marketplaceId: MarketplaceId;
  listingId?: string;
  listingTitle: string;
  status: SyncIssueStatus;
  errorReason: string;
  suggestedFix: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueJob {
  id: string;
  action: SyncJobAction;
  status: SyncJobStatus;
  marketplaceId: MarketplaceId;
  listingId?: string;
  listingTitle: string;
  attempt: number;
  maxAttempts: number;
  error?: string;
  resultMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  tone: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  marketplaceId?: MarketplaceId;
  listingId?: string;
}

export interface AppSettings {
  autoDelistEnabled: boolean;
  syncRetries: number;
  syncDelayMs: number;
  notifySyncComplete: boolean;
  notifyLowInventory: boolean;
  notifyFailedSync: boolean;
  notifySoldItems: boolean;
  billingPlan: 'demo' | 'starter' | 'pro';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
  provider: 'email' | 'demo' | 'google' | 'facebook' | 'apple';
}

export interface ListingFormInput {
  title: string;
  description: string;
  category: string;
  brand: string;
  size: string;
  condition: string;
  price: number;
  quantity: number;
  shippingPrice: number;
  cost: number;
  sku: string;
  bin: string;
  rack: string;
  shelf: string;
  lowStockThreshold: number;
  etsyClassification: string;
  marketplaceOverrides: MarketplaceOverride[];
  images: string[];
  marketplaces: MarketplaceId[];
}

export interface AdapterResult {
  ok: boolean;
  status?: SyncJobStatus;
  marketplaceListingId?: string;
  url?: string;
  message: string;
  lastSyncedAt: string;
  error?: string;
}

export interface ListingValidationResult {
  ok: boolean;
  missingFields: string[];
  warnings: string[];
  message: string;
}

export interface MarketplaceAdapter {
  marketplaceId: MarketplaceId;
  connect(): Promise<AdapterResult>;
  disconnect(): Promise<AdapterResult>;
  validateListing(listing: Listing): Promise<ListingValidationResult>;
  publishListing(listing: Listing): Promise<AdapterResult>;
  delistListing(marketplaceListingId: string): Promise<AdapterResult>;
  updateListing(listing: Listing): Promise<AdapterResult>;
  deleteListing(marketplaceListingId: string): Promise<AdapterResult>;
  markSold(marketplaceListingId: string): Promise<AdapterResult>;
  syncInventory(listing: Listing): Promise<AdapterResult>;
  getStatus(): Promise<AdapterResult>;
}

export interface AppData {
  user: User | null;
  marketplaceAccounts: MarketplaceAccount[];
  inventoryItems: InventoryItem[];
  listings: Listing[];
  marketplaceListings: MarketplaceListing[];
  orders: Order[];
  payments: Payment[];
  syncLogs: SyncLog[];
  syncIssues: SyncIssue[];
  syncQueue: SyncQueueJob[];
  notifications: AppNotification[];
  settings: AppSettings;
  authSession: AuthSession | null;
}
