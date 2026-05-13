'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { marketplaceAdapters } from '@/adapters';
import { authService } from '@/services/authService';
import { inventoryService } from '@/services/inventoryService';
import { listingsService } from '@/services/listingsService';
import { cloneSeed, localDatabase } from '@/services/localDatabase';
import { syncService } from '@/services/syncService';
import type {
  AppNotification,
  AppData,
  Listing,
  ListingFormInput,
  MarketplaceId,
  Order,
  SyncLog
} from './types';
import { marketplaceName } from './marketplaces';
import { calcFees, uid } from './utils';
import { runDemoPayment } from './payments';

type Toast = { id: string; tone: 'success' | 'info' | 'warning' | 'error'; message: string };

interface StoreContextValue extends AppData {
  toast: Toast | null;
  loading: boolean;
  ready: boolean;
  loginDemo(): void;
  loginWithPassword(email: string): void;
  signUp(name: string, email: string): void;
  mockSocialLogin(provider: 'Google' | 'Facebook' | 'Apple'): void;
  logout(): void;
  connectMarketplace(id: MarketplaceId): Promise<void>;
  disconnectMarketplace(id: MarketplaceId): Promise<void>;
  createListing(input: ListingFormInput, publish: boolean): Promise<void>;
  duplicateListing(listingId: string): Promise<void>;
  retrySyncIssue(issueId: string): Promise<void>;
  markListingSold(listingId: string, marketplaceId: MarketplaceId, buyerName?: string): Promise<void>;
  demoCheckout(listingId: string, marketplaceId: MarketplaceId, buyerName: string): Promise<void>;
  markNotificationRead(id: string): void;
  updateSettings(settings: Partial<AppData['settings']>): void;
  resetDemo(): void;
  dismissToast(): void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function makeLog(message: string, level: SyncLog['level'] = 'info', marketplaceId?: MarketplaceId, listingId?: string): SyncLog {
  return {
    id: uid('log'),
    level,
    message,
    marketplaceId,
    listingId,
    createdAt: new Date().toISOString()
  };
}

function makeNotification(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
  const now = new Date().toISOString();
  return {
    ...notification,
    id: uid('note'),
    read: false,
    createdAt: now
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(cloneSeed());
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loaded = localDatabase.load();
    const session = authService.getSession();
    setData({
      ...loaded,
      user: session?.user || loaded.user,
      authSession: session || loaded.authSession
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localDatabase.save(data);
  }, [data, hydrated]);

  function showToast(message: string, tone: Toast['tone'] = 'success') {
    setToast({ id: uid('toast'), tone, message });
  }

  async function connectMarketplace(id: MarketplaceId) {
    setLoading(true);
    setData((current) => ({
      ...current,
      marketplaceAccounts: current.marketplaceAccounts.map((account) =>
        account.id === id ? { ...account, status: 'syncing' } : account
      )
    }));

    try {
      const nextData = await syncService.connectMarketplace(data, id);
      setData(nextData);
      showToast(`${marketplaceName(id)} connection flow completed.`);
    } finally {
      setLoading(false);
    }
  }

  async function disconnectMarketplace(id: MarketplaceId) {
    setLoading(true);
    const nextData = await syncService.disconnectMarketplace(data, id);
    setData(nextData);
    setLoading(false);
    showToast(`${marketplaceName(id)} disconnected.`, 'info');
  }

  async function createListing(input: ListingFormInput, publish: boolean) {
    setLoading(true);
    const { item, listing } = listingsService.createDraftRecords(input);
    let updatedListing = listing;
    const logs: SyncLog[] = [];
    let syncResult = {
      marketplaceListings: [],
      logs: [],
      issues: [],
      queue: [],
      notifications: []
    } as Awaited<ReturnType<typeof syncService.publishListing>>;

    if (publish) {
      syncResult = await syncService.publishListing(listing);
      updatedListing = {
        ...listing,
        status: syncResult.marketplaceListings.some((marketplaceListing) => marketplaceListing.status === 'listed')
          ? 'listed'
          : syncResult.marketplaceListings.some((marketplaceListing) => marketplaceListing.status === 'manual_required')
            ? 'manual_required'
            : 'failed',
        updatedAt: new Date().toISOString()
      };
    } else {
      logs.push(makeLog(`${listing.title} saved as a draft.`, 'info', undefined, listing.id));
    }

    setData((current) => ({
      ...current,
      inventoryItems: [item, ...current.inventoryItems],
      listings: [updatedListing, ...current.listings],
      marketplaceListings: [...syncResult.marketplaceListings, ...current.marketplaceListings],
      syncLogs: [...logs, ...syncResult.logs, ...current.syncLogs],
      syncIssues: [...syncResult.issues, ...current.syncIssues],
      syncQueue: [...syncResult.queue, ...current.syncQueue],
      notifications: [...syncResult.notifications, ...current.notifications]
    }));
    setLoading(false);
    showToast(publish ? 'Listing published to selected marketplaces.' : 'Draft saved.');
  }

  async function duplicateListing(listingId: string) {
    const source = data.listings.find((listing) => listing.id === listingId);
    const sourceItem = data.inventoryItems.find((item) => item.id === source?.inventoryItemId);
    if (!source || !sourceItem) return;

    setLoading(true);
    const { item, listing } = listingsService.duplicateListing(source, sourceItem);

    setData((current) => ({
      ...current,
      inventoryItems: [item, ...current.inventoryItems],
      listings: [listing, ...current.listings],
      syncLogs: [makeLog(`${source.title} duplicated as a draft listing.`, 'info', undefined, listing.id), ...current.syncLogs]
    }));
    setLoading(false);
    showToast('Listing duplicated as a draft.', 'success');
  }

  async function retrySyncIssue(issueId: string) {
    const issue = data.syncIssues.find((item) => item.id === issueId);
    if (!issue) return;

    setLoading(true);
    setData((current) => ({
      ...current,
      syncIssues: current.syncIssues.map((item) =>
        item.id === issueId ? { ...item, status: 'pending', attempts: item.attempts + 1, updatedAt: new Date().toISOString() } : item
      )
    }));

    const updatedIssue = await syncService.retryIssue(issue);

    setData((current) => ({
      ...current,
      syncIssues: current.syncIssues.map((item) =>
        item.id === issueId ? updatedIssue : item
      ),
      syncQueue: [
        {
          id: uid('job'),
          action: 'publish',
          status: updatedIssue.status === 'success' ? 'succeeded' : updatedIssue.status,
          marketplaceId: issue.marketplaceId,
          listingId: issue.listingId,
          listingTitle: issue.listingTitle,
          attempt: updatedIssue.attempts,
          maxAttempts: current.settings.syncRetries,
          error: updatedIssue.status === 'success' ? undefined : updatedIssue.errorReason,
          resultMessage: updatedIssue.status === 'success' ? updatedIssue.errorReason : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...current.syncQueue
      ],
      syncLogs: [makeLog(`Retry completed for ${issue.listingTitle} on ${marketplaceName(issue.marketplaceId)}.`, updatedIssue.status === 'success' ? 'success' : 'info', issue.marketplaceId, issue.listingId), ...current.syncLogs],
      notifications: [makeNotification({
        type: updatedIssue.status === 'success' ? 'sync_completed' : 'info',
        tone: updatedIssue.status === 'success' ? 'success' : 'info',
        title: updatedIssue.status === 'success' ? 'Retry succeeded' : 'Manual action still needed',
        message: updatedIssue.errorReason,
        marketplaceId: issue.marketplaceId,
        listingId: issue.listingId
      }), ...current.notifications]
    }));
    setLoading(false);
    showToast(`${marketplaceName(issue.marketplaceId)} retry finished.`, 'success');
  }

  async function recordSale(listingId: string, marketplaceId: MarketplaceId, buyerName: string, viaCheckout: boolean) {
    const listing = data.listings.find((item) => item.id === listingId);
    const item = data.inventoryItems.find((inventoryItem) => inventoryItem.id === listing?.inventoryItemId);
    if (!listing || !item) return;

    setLoading(true);
    const sourceMarketplaceListing = data.marketplaceListings.find(
      (marketplaceListing) => marketplaceListing.listingId === listingId && marketplaceListing.marketplaceId === marketplaceId
    );
    if (sourceMarketplaceListing) {
      await marketplaceAdapters[marketplaceId].markSold(sourceMarketplaceListing.marketplaceListingId);
    }

    const deactivated = data.marketplaceListings.filter(
      (marketplaceListing) => marketplaceListing.listingId === listingId && marketplaceListing.marketplaceId !== marketplaceId && marketplaceListing.status === 'listed'
    );
    await Promise.all(deactivated.map((marketplaceListing) => marketplaceAdapters[marketplaceListing.marketplaceId].deleteListing(marketplaceListing.marketplaceListingId)));

    const fees = calcFees(listing.price, marketplaceId);
    const orderId = uid('ord');
    const order: Order = {
      id: orderId,
      buyerName,
      marketplaceId,
      productTitle: listing.title,
      listingId: listing.id,
      salePrice: listing.price,
      fees,
      netProfit: Math.round((listing.price - fees - item.cost) * 100) / 100,
      shippingStatus: 'label_ready',
      orderStatus: 'paid',
      soldAt: new Date().toISOString()
    };
    const payment = await runDemoPayment(listing, marketplaceId);
    payment.orderId = orderId;

    setData((current) => ({
      ...current,
      inventoryItems: inventoryService.reduceQuantity(current.inventoryItems, item.id),
      listings: current.listings.map((currentListing) =>
        currentListing.id === listingId ? { ...currentListing, quantity: Math.max(0, currentListing.quantity - 1), status: 'sold', updatedAt: new Date().toISOString() } : currentListing
      ),
      marketplaceListings: current.marketplaceListings.map((marketplaceListing) => {
        if (marketplaceListing.listingId !== listingId) return marketplaceListing;
        if (marketplaceListing.marketplaceId === marketplaceId) return { ...marketplaceListing, status: 'sold', lastSyncedAt: new Date().toISOString() };
        if (marketplaceListing.status === 'listed') return { ...marketplaceListing, status: 'deactivated', lastSyncedAt: new Date().toISOString() };
        return marketplaceListing;
      }),
      orders: [order, ...current.orders],
      payments: [payment, ...current.payments],
      syncQueue: [...syncService.createAutoDelistJobs(listing, marketplaceId, current), ...current.syncQueue],
      notifications: [
        makeNotification({
          type: 'sold_item',
          tone: 'success',
          title: 'Item sold',
          message: `${listing.title} sold on ${marketplaceName(marketplaceId)}. Auto-delisting queued for other channels.`,
          marketplaceId,
          listingId
        }),
        ...current.notifications
      ],
      syncLogs: [
        makeLog(
          `${viaCheckout ? 'DemoPay checkout completed' : 'Sale recorded'} on ${marketplaceName(marketplaceId)}. Deactivated ${deactivated.length} other marketplace listing(s).`,
          'success',
          marketplaceId,
          listingId
        ),
        ...current.syncLogs
      ]
    }));
    setLoading(false);
    showToast(`Sold on ${marketplaceName(marketplaceId)}. Other listings were deactivated.`);
  }

  const value: StoreContextValue = {
    ...data,
    toast,
    loading,
    ready: hydrated,
    loginDemo: () => {
      const session = authService.loginDemo();
      setData((current) => ({ ...current, user: session.user, authSession: session }));
      showToast('Demo account loaded.');
    },
    loginWithPassword: (email: string) => {
      const session = authService.loginWithPassword(email);
      setData((current) => ({ ...current, user: session.user, authSession: session }));
      showToast('Signed in with mock email/password.');
    },
    signUp: (name: string, email: string) => {
      const session = authService.signUp(name, email);
      setData((current) => ({ ...current, user: session.user, authSession: session }));
      showToast('Account created in demo auth.');
    },
    mockSocialLogin: (provider) => {
      const session = authService.socialLogin(provider);
      setData((current) => ({ ...current, user: session.user, authSession: session }));
      showToast(`${provider} OAuth completed in demo mode.`);
    },
    logout: () => {
      authService.logout();
      setData((current) => ({ ...current, user: null, authSession: null }));
      showToast('Signed out.', 'info');
    },
    connectMarketplace,
    disconnectMarketplace,
    createListing,
    duplicateListing,
    retrySyncIssue,
    markListingSold: (listingId, marketplaceId, buyerName = 'Walk-in Buyer') => recordSale(listingId, marketplaceId, buyerName, false),
    demoCheckout: (listingId, marketplaceId, buyerName) => recordSale(listingId, marketplaceId, buyerName, true),
    markNotificationRead: (id) => {
      setData((current) => ({
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      }));
    },
    updateSettings: (settings) => {
      setData((current) => ({
        ...current,
        settings: { ...current.settings, ...settings },
        syncLogs: [makeLog('Settings updated.', 'info'), ...current.syncLogs]
      }));
      showToast('Settings saved.', 'success');
    },
    resetDemo: () => {
      const reset = localDatabase.reset();
      const session = authService.loginDemo();
      reset.user = session.user;
      reset.authSession = session;
      setData(reset);
      showToast('Demo data reset.');
    },
    dismissToast: () => setToast(null)
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useResellSync() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useResellSync must be used inside StoreProvider');
  return context;
}
