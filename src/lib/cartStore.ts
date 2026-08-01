import { PRODUCTS, type Product } from '../data/products';
import { buildShopifyCheckoutUrl } from './shopify';

export interface CartItemState {
  productId: string;
  quantity: number;
}

const CART_KEY = 'aks_cart_v1';

export function getCartFromStorage(): CartItemState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItemState[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

export function addToCart(productId: string, quantity = 1) {
  const current = getCartFromStorage();
  const existingIndex = current.findIndex(i => i.productId === productId);
  if (existingIndex > -1) {
    current[existingIndex].quantity += quantity;
  } else {
    current.push({ productId, quantity });
  }
  saveCartToStorage(current);
  openCartDrawer();
}

export function updateCartQuantity(productId: string, quantity: number) {
  let current = getCartFromStorage();
  if (quantity <= 0) {
    current = current.filter(i => i.productId !== productId);
  } else {
    const item = current.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  saveCartToStorage(current);
}

export function openCartDrawer() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-cart-drawer'));
  }
}

export function getCartHydrated() {
  const raw = getCartFromStorage();
  return raw.map(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return {
      product: product!,
      quantity: item.quantity
    };
  }).filter(item => item.product !== undefined);
}
