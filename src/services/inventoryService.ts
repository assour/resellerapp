import type { InventoryItem } from '@/lib/types';

export const inventoryService = {
  getLowStockItems(items: InventoryItem[]) {
    return items.filter((item) => item.quantity <= item.lowStockThreshold);
  },

  reduceQuantity(items: InventoryItem[], itemId: string) {
    return items.map((item) =>
      item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1), updatedAt: new Date().toISOString() } : item
    );
  }
};
