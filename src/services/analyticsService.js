import { marketplaceConfig } from '../config';
import { getActivity } from './activityService';
import { getProducts } from './inventoryService';

export async function getDashboardData() {
  const products = await getProducts();
  const listed = products.filter((product) => product.status === 'listed');
  const sold = products.filter((product) => product.status === 'sold');
  const grossSales = sold.reduce((sum, product) => sum + Number(product.soldPrice || 0), 0);
  const soldCost = sold.reduce((sum, product) => sum + Number(product.cost || 0), 0);
  const estimatedProfit = grossSales - soldCost;
  const inventoryValue = products
    .filter((product) => product.status !== 'sold')
    .reduce((sum, product) => sum + Number(product.listingPrice || 0), 0);
  const marketplaceSales = sold.reduce((acc, product) => {
    const soldOn = Object.entries(product.marketplaceStatus).find(([, status]) => status === 'sold')?.[0];
    if (soldOn) acc[soldOn] = (acc[soldOn] || 0) + Number(product.soldPrice || 0);
    return acc;
  }, {});
  const bestMarketplaceId = Object.entries(marketplaceSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ebay';
  const categorySales = sold.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + Number(product.soldPrice || 0);
    return acc;
  }, {});
  const bestCategory = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Shoes';

  return {
    totalInventoryValue: inventoryValue,
    activeListings: listed.length,
    soldItems: sold.length,
    grossSales,
    estimatedProfit,
    averageProfitMargin: grossSales ? Math.round((estimatedProfit / grossSales) * 100) : 0,
    bestMarketplace: marketplaceConfig[bestMarketplaceId]?.label || 'eBay',
    unsoldInventoryCount: products.filter((product) => product.status !== 'sold').length,
    recentActivity: await getActivity(),
    marketplaceSales,
    bestCategory
  };
}
