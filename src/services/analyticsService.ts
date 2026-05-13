import { marketplaceMeta } from '@/lib/marketplaces';
import type { AppData } from '@/lib/types';

export const analyticsService = {
  dashboard(data: AppData) {
    const activeListings = data.marketplaceListings.filter((listing) => listing.status === 'listed').length;
    const soldItems = data.orders.length;
    const revenue = data.orders.reduce((sum, order) => sum + order.salePrice, 0);
    const connected = data.marketplaceAccounts.filter((account) => account.connected).length;
    const failedSyncs = data.syncIssues.filter((issue) => issue.status === 'failed').length;
    const syncSuccessRate = data.syncIssues.length
      ? Math.round((data.syncIssues.filter((issue) => issue.status === 'success').length / data.syncIssues.length) * 100)
      : 100;

    return { activeListings, soldItems, revenue, connected, failedSyncs, syncSuccessRate };
  },

  advanced(data: AppData) {
    const revenue = data.orders.reduce((sum, order) => sum + order.salePrice, 0);
    const avgSale = data.orders.length ? revenue / data.orders.length : 0;
    const fees = data.orders.reduce((sum, order) => sum + order.fees, 0);
    const unsold = data.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const staleInventory = data.inventoryItems.filter((item) => new Date(item.updatedAt).getTime() < Date.now() - 7 * 86400000).length;
    const sellThrough = data.listings.length ? Math.round((data.orders.length / data.listings.length) * 100) : 0;
    const profit = data.orders.reduce((sum, order) => sum + order.netProfit, 0);
    const syncSuccessRate = data.syncIssues.length
      ? Math.round((data.syncIssues.filter((issue) => issue.status === 'success').length / data.syncIssues.length) * 100)
      : 100;
    const byMarketplace = marketplaceMeta.map((marketplace) => ({
      ...marketplace,
      revenue: data.orders.filter((order) => order.marketplaceId === marketplace.id).reduce((sum, order) => sum + order.salePrice, 0),
      sales: data.orders.filter((order) => order.marketplaceId === marketplace.id).length
    }));
    const revenueTrend = [
      { label: 'Week 1', value: Math.max(120, revenue * 0.25) },
      { label: 'Week 2', value: Math.max(180, revenue * 0.45) },
      { label: 'Week 3', value: Math.max(240, revenue * 0.7) },
      { label: 'Week 4', value: Math.max(revenue, 320) }
    ];
    const profitTrend = revenueTrend.map((item, index) => ({ label: item.label, value: Math.round((item.value * (0.42 + index * 0.04)) * 100) / 100 }));

    return { revenue, avgSale, fees, unsold, staleInventory, sellThrough, profit, syncSuccessRate, byMarketplace, revenueTrend, profitTrend };
  }
};
