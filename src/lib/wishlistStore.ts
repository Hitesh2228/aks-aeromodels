import { type Product } from '../data/products';

const WISHLIST_STORAGE_KEY = 'skynodes_wishlist_items';

export function getWishlistItems(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isInWishlist(productId: string): boolean {
  const items = getWishlistItems();
  return items.some(item => item.id === productId);
}

export function toggleWishlist(product: Product): boolean {
  if (typeof window === 'undefined') return false;
  const items = getWishlistItems();
  const index = items.findIndex(item => item.id === product.id);
  let isAdded = false;

  if (index > -1) {
    items.splice(index, 1);
    isAdded = false;
  } else {
    items.push(product);
    isAdded = true;
  }

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { isAdded, product } }));
  } catch (e) {}

  return isAdded;
}

export function removeFromWishlist(productId: string): void {
  if (typeof window === 'undefined') return;
  const items = getWishlistItems().filter(item => item.id !== productId);
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
  } catch (e) {}
}

export function getWishlistCount(): number {
  return getWishlistItems().length;
}
