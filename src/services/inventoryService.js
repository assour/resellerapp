import { marketplaceConfig } from '../config';
import { demoStore } from './storage';

export async function getProducts() {
  return demoStore.getProducts();
}

export async function saveProduct(product, publish = false) {
  const products = demoStore.getProducts();
  const selectedMarketplaces = product.selectedMarketplaces || [];
  const status = publish ? 'listed' : 'draft';
  const marketplaceStatus = Object.keys(marketplaceConfig).reduce((acc, id) => {
    acc[id] = selectedMarketplaces.includes(id) && publish ? 'listed' : 'draft';
    return acc;
  }, {});

  const nextProduct = {
    ...product,
    id: product.id || `prd-${Date.now()}`,
    cost: Number(product.cost || 0),
    listingPrice: Number(product.listingPrice || 0),
    soldPrice: product.soldPrice ? Number(product.soldPrice) : null,
    status,
    marketplaceStatus,
    photos: product.photos?.length ? product.photos : ['placeholder-photo'],
    createdDate: product.createdDate || new Date().toISOString().slice(0, 10)
  };

  const exists = products.some((item) => item.id === nextProduct.id);
  const nextProducts = exists
    ? products.map((item) => (item.id === nextProduct.id ? nextProduct : item))
    : [nextProduct, ...products];

  demoStore.setProducts(nextProducts);
  demoStore.addActivity(`${nextProduct.title} ${publish ? 'listed in demo mode' : 'saved as a draft'}.`, publish ? 'listing' : 'draft');
  return nextProduct;
}

export async function markProductSold(productId, marketplaceId, soldPrice) {
  const products = demoStore.getProducts();
  const product = products.find((item) => item.id === productId);
  if (!product) throw new Error('Product not found');
  if (!marketplaceConfig[marketplaceId]) throw new Error('Unsupported marketplace');

  const delisted = [];
  const marketplaceStatus = Object.entries(product.marketplaceStatus).reduce((acc, [id, status]) => {
    if (id === marketplaceId) {
      acc[id] = 'sold';
    } else if (status === 'listed') {
      acc[id] = 'delisted';
      delisted.push(marketplaceConfig[id].label);
    } else {
      acc[id] = status;
    }
    return acc;
  }, {});

  const updated = {
    ...product,
    status: 'sold',
    soldPrice: Number(soldPrice || product.listingPrice),
    marketplaceStatus
  };

  demoStore.setProducts(products.map((item) => (item.id === productId ? updated : item)));
  const message = `Sold on ${marketplaceConfig[marketplaceId].label}. ${delisted.length ? `Removed from ${delisted.join(' and ')}.` : 'No other active listings needed removal.'}`;
  demoStore.addActivity(`${product.title}: ${message}`, 'sale');
  return { product: updated, message };
}

export async function resetDemoData() {
  demoStore.reset();
  return demoStore.getProducts();
}
