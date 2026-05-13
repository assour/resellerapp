import type { InventoryItem, Listing, ListingFormInput } from '@/lib/types';
import { uid } from '@/lib/utils';

export const listingsService = {
  createDraftRecords(input: ListingFormInput): { item: InventoryItem; listing: Listing } {
    const now = new Date().toISOString();
    const inventoryItemId = uid('inv');
    const listingId = uid('lst');
    const images = input.images.length ? input.images : ['mock-upload'];

    const base = {
      title: input.title,
      description: input.description,
      category: input.category,
      brand: input.brand,
      size: input.size,
      condition: input.condition,
      price: input.price,
      quantity: input.quantity,
      shippingPrice: input.shippingPrice,
      images,
      cost: input.cost,
      sku: input.sku,
      bin: input.bin,
      rack: input.rack,
      shelf: input.shelf,
      lowStockThreshold: input.lowStockThreshold,
      etsyClassification: input.etsyClassification,
      marketplaceOverrides: input.marketplaceOverrides
    };

    return {
      item: {
        id: inventoryItemId,
        ...base,
        createdAt: now,
        updatedAt: now
      },
      listing: {
        id: listingId,
        inventoryItemId,
        ...base,
        selectedMarketplaces: input.marketplaces,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }
    };
  },

  duplicateListing(source: Listing, sourceItem: InventoryItem): { item: InventoryItem; listing: Listing } {
    const now = new Date().toISOString();
    const inventoryItemId = uid('inv');
    const newListingId = uid('lst');
    const item: InventoryItem = {
      ...sourceItem,
      id: inventoryItemId,
      title: `${sourceItem.title} Copy`,
      sku: `${sourceItem.sku}-COPY`,
      quantity: Math.max(1, sourceItem.quantity),
      createdAt: now,
      updatedAt: now
    };

    return {
      item,
      listing: {
        ...source,
        id: newListingId,
        inventoryItemId,
        title: `${source.title} Copy`,
        sku: item.sku,
        quantity: item.quantity,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }
    };
  }
};
