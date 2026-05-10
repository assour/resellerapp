import { marketplaceConfig, useSupabaseData } from '../config';
import { addActivity } from './activityService';
import { uploadProductPhotos } from './photoService';
import { demoStore } from './storage';
import { getSupabaseUserId, supabase } from './supabaseClient';

function mapProduct(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || '',
    brand: row.brand || '',
    size: row.size || '',
    condition: row.condition || 'Good',
    cost: Number(row.cost || 0),
    listingPrice: Number(row.listing_price || 0),
    soldPrice: row.sold_price === null ? null : Number(row.sold_price || 0),
    status: row.status || 'draft',
    marketplaceStatus: row.marketplace_status || {},
    photos: row.photos || [],
    createdDate: row.created_date || row.created_at?.slice(0, 10)
  };
}

function buildMarketplaceStatus(product, publish) {
  const selectedMarketplaces = product.selectedMarketplaces || [];
  return Object.keys(marketplaceConfig).reduce((acc, id) => {
    acc[id] = selectedMarketplaces.includes(id) && publish ? 'listed' : 'draft';
    return acc;
  }, {});
}

export async function getProducts() {
  if (useSupabaseData) {
    const userId = await getSupabaseUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Could not load products: ${error.message}`);
    return data.map(mapProduct);
  }

  return demoStore.getProducts();
}

export async function saveProduct(product, publish = false) {
  if (useSupabaseData) {
    const userId = await getSupabaseUserId();
    if (!userId) throw new Error('Please sign in before saving products.');

    const marketplaceStatus = buildMarketplaceStatus(product, publish);
    const payload = {
      user_id: userId,
      title: product.title,
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      size: product.size || '',
      condition: product.condition || 'Good',
      cost: Number(product.cost || 0),
      listing_price: Number(product.listingPrice || 0),
      sold_price: product.soldPrice ? Number(product.soldPrice) : null,
      status: publish ? 'listed' : 'draft',
      marketplace_status: marketplaceStatus,
      photos: product.photos?.length ? product.photos : [],
      created_date: product.createdDate || new Date().toISOString().slice(0, 10)
    };

    const query = product.id
      ? supabase.from('products').update(payload).eq('id', product.id).eq('user_id', userId).select().single()
      : supabase.from('products').insert(payload).select().single();

    const { data, error } = await query;
    if (error) throw new Error(`Could not save product: ${error.message}`);

    const uploadedPhotos = await uploadProductPhotos(data.id, product.photoFiles || []);
    if (uploadedPhotos.length) {
      const photos = [...(data.photos || []), ...uploadedPhotos];
      const { data: photoData, error: photoError } = await supabase
        .from('products')
        .update({ photos })
        .eq('id', data.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (photoError) throw new Error(`Could not save uploaded photos: ${photoError.message}`);
      await addActivity(`${photoData.title} ${publish ? 'listed from Supabase workspace' : 'saved as a draft'}.`, publish ? 'listing' : 'draft');
      return mapProduct(photoData);
    }

    await addActivity(`${data.title} ${publish ? 'listed from Supabase workspace' : 'saved as a draft'}.`, publish ? 'listing' : 'draft');
    return mapProduct(data);
  }

  const products = demoStore.getProducts();
  const status = publish ? 'listed' : 'draft';
  const marketplaceStatus = buildMarketplaceStatus(product, publish);

  const nextProduct = {
    ...product,
    id: product.id || `prd-${Date.now()}`,
    cost: Number(product.cost || 0),
    listingPrice: Number(product.listingPrice || 0),
    soldPrice: product.soldPrice ? Number(product.soldPrice) : null,
    status,
    marketplaceStatus,
    photos: product.photoFiles?.length ? product.photoFiles.map((file) => file.name) : product.photos?.length ? product.photos : ['placeholder-photo'],
    createdDate: product.createdDate || new Date().toISOString().slice(0, 10)
  };

  const exists = products.some((item) => item.id === nextProduct.id);
  const nextProducts = exists
    ? products.map((item) => (item.id === nextProduct.id ? nextProduct : item))
    : [nextProduct, ...products];

  demoStore.setProducts(nextProducts);
  await addActivity(`${nextProduct.title} ${publish ? 'listed in demo mode' : 'saved as a draft'}.`, publish ? 'listing' : 'draft');
  return nextProduct;
}

export async function markProductSold(productId, marketplaceId, soldPrice) {
  const products = await getProducts();
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

  if (useSupabaseData) {
    const userId = await getSupabaseUserId();
    if (!userId) throw new Error('Please sign in before updating products.');

    const { error } = await supabase
      .from('products')
      .update({
        status: updated.status,
        sold_price: updated.soldPrice,
        marketplace_status: updated.marketplaceStatus
      })
      .eq('id', productId)
      .eq('user_id', userId);

    if (error) throw new Error(`Could not mark product sold: ${error.message}`);
  } else {
    demoStore.setProducts(products.map((item) => (item.id === productId ? updated : item)));
  }

  const message = `Sold on ${marketplaceConfig[marketplaceId].label}. ${delisted.length ? `Removed from ${delisted.join(' and ')}.` : 'No other active listings needed removal.'}`;
  await addActivity(`${product.title}: ${message}`, 'sale');
  return { product: updated, message };
}

export async function resetDemoData() {
  if (useSupabaseData) {
    throw new Error('Reset demo data only applies while demo mode is active.');
  }

  demoStore.reset();
  return demoStore.getProducts();
}
