import { PRODUCTS, type Product } from '../data/products';

export interface CartItemState {
  productId: string;
  quantity: number;
  productData?: Product;
}

const CART_KEY = 'skynodes_cart_v2';
const PRODUCTS_CACHE_KEY = 'skynodes_products_cache_v1';

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

export function registerProductsCache(products: Product[]) {
  if (typeof window === 'undefined' || !products || products.length === 0) return;
  try {
    const existingRaw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    const existing: Record<string, Product> = existingRaw ? JSON.parse(existingRaw) : {};
    products.forEach(p => {
      if (p.id) existing[p.id] = p;
      if (p.handle) existing[p.handle] = p;
    });
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(existing));
  } catch (e) {}
}

export function getCachedProduct(id: string): Product | undefined {
  const staticFound = PRODUCTS.find(p => p.id === id || p.handle === id);
  if (staticFound) return staticFound;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (raw) {
        const cache: Record<string, Product> = JSON.parse(raw);
        if (cache[id]) return cache[id];
      }
    } catch (e) {}
  }
  return undefined;
}

export function showCartToast(title = 'Item') {
  if (typeof window === 'undefined') return;
  
  let toast = document.getElementById('cart-toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #111111;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      z-index: 99999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `🛒 <span><strong>${title}</strong> added to cart!</span>`;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    if (toast) {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }
  }, 2500);
}

export function addToCart(productOrId: string | Product, quantity = 1) {
  const current = getCartFromStorage();
  
  let productId: string;
  let productObj: Product | undefined;

  if (typeof productOrId === 'string') {
    productId = productOrId;
    productObj = getCachedProduct(productId);
  } else {
    productId = productOrId.id;
    productObj = productOrId;
    registerProductsCache([productObj]);
  }

  const existingIndex = current.findIndex(i => i.productId === productId);
  if (existingIndex > -1) {
    current[existingIndex].quantity += quantity;
    if (productObj) current[existingIndex].productData = productObj;
  } else {
    current.push({
      productId,
      quantity,
      productData: productObj
    });
  }

  saveCartToStorage(current);
  showCartToast(productObj?.name || 'Item');
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
    const product = item.productData || getCachedProduct(item.productId);
    return {
      product: product!,
      quantity: item.quantity
    };
  }).filter(item => item.product !== undefined && item.product !== null);
}

export function getCartCount(): number {
  const items = getCartFromStorage();
  return items.reduce((acc, item) => acc + item.quantity, 0);
}
