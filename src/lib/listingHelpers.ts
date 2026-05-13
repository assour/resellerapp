import type { ListingFormInput } from './types';

export function generateDescription(input: Partial<ListingFormInput>) {
  const title = input.title || 'this standout resale find';
  const brand = input.brand ? `${input.brand} ` : '';
  const condition = input.condition || 'great';
  const category = input.category || 'style';

  return `${brand}${title} is a ${condition.toLowerCase()} ${category.toLowerCase()} piece selected for shoppers who want quality, value, and fast shipping. Includes careful packaging, clear photos, and same-week handling from ResellSync.`;
}

export function suggestPrice(input: Partial<ListingFormInput>) {
  const cost = Number(input.cost || 20);
  const categoryBoost = input.category?.toLowerCase().includes('shoe') ? 2.6 : input.category?.toLowerCase().includes('home') ? 2.2 : 2.8;
  const conditionBoost = input.condition === 'New' ? 1.18 : input.condition === 'Excellent' ? 1.08 : input.condition === 'Fair' ? 0.82 : 1;
  return Math.max(12, Math.round(cost * categoryBoost * conditionBoost));
}
