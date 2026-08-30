import { type Product } from '../data/products';

const RECENTLY_VIEWED_KEY = 'skynodes_recently_viewed_products';
const MAX_RECENTLY_VIEWED = 8;

export function getRecentlyViewedProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addRecentlyViewedProduct(product: Product): void {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    let list = getRecentlyViewedProducts();
    // Remove if already exists to push to front
    list = list.filter(item => item.id !== product.id);
    list.unshift(product);
    if (list.length > MAX_RECENTLY_VIEWED) {
      list = list.slice(0, MAX_RECENTLY_VIEWED);
    }
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
  } catch (e) {}
}
