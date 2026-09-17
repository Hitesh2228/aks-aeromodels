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

export function registerProductsCache(products: (Product | any)[]) {
  if (typeof window === 'undefined' || !products || products.length === 0) return;
  try {
    const existingRaw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    const existing: Record<string, Product> = existingRaw ? JSON.parse(existingRaw) : {};
    products.forEach(p => {
      if (!p) return;
      const normalized: Product = {
        id: p.id || p.handle,
        handle: p.handle || p.id,
        name: p.name || p.title,
        price: typeof p.price === 'number' ? p.price : Math.round(parseFloat(p.price || '0')),
        originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : Math.round(parseFloat(p.originalPrice || '0')),
        category: p.category || 'aeromodels',
        categoryLabel: p.categoryLabel || 'Seagull Aeromodels',
        image: p.image || p.imageUrl || '',
        images: p.images || (p.image ? [p.image] : []),
        rating: p.rating || 4.9,
        reviewsCount: p.reviewsCount || 6,
        inStock: p.inStock ?? p.availableForSale ?? true,
        description: p.description || '',
        specs: p.specs || {},
        discountBadge: p.discountBadge,
        gstRate: p.gstRate,
        hsnCode: p.hsnCode,
        basePrice: p.basePrice,
        warrantyPeriod: p.warrantyPeriod,
        prepaidDiscountPct: p.prepaidDiscountPct,
        youtubeVideoId: p.youtubeVideoId,
        isBestseller: p.isBestseller,
        isCrazyDeal: p.isCrazyDeal,
        isNewArrival: p.isNewArrival
      };
      if (p.id) existing[p.id] = normalized;
      if (p.handle) existing[p.handle] = normalized;
      if (p.safeId) existing[p.safeId] = normalized;
    });
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(existing));
  } catch (e) {}
}

export function getCachedProduct(id: string): Product | undefined {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (raw) {
        const cache: Record<string, Product> = JSON.parse(raw);
        if (cache[id]) return cache[id];
      }
    } catch (e) {}
  }

  const staticFound = PRODUCTS.find(p => p.id === id || p.handle === id);
  if (staticFound) return staticFound;

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

export function addToCart(productOrId: string | Product | any, quantity = 1) {
  const current = getCartFromStorage();
  
  let productId: string;
  let productObj: Product | undefined;

  if (typeof productOrId === 'string') {
    productId = productOrId;
    productObj = getCachedProduct(productId);
  } else {
    productId = productOrId.id || productOrId.handle;
    registerProductsCache([productOrId]);
    productObj = getCachedProduct(productId) || productOrId;
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
  let needsResave = false;

  const result = raw.map(item => {
    const fresh = getCachedProduct(item.productId);
    const product = fresh || item.productData;

    // Self-heal stale product price/data if updated
    if (fresh && (!item.productData || item.productData.price !== fresh.price || item.productData.name !== fresh.name)) {
      item.productData = fresh;
      needsResave = true;
    }

    return {
      product: product!,
      quantity: item.quantity
    };
  }).filter(item => item.product !== undefined && item.product !== null);

  if (needsResave && typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(raw));
    } catch (e) {}
  }

  return result;
}

export function getCartCount(): number {
  const items = getCartFromStorage();
  return items.reduce((acc, item) => acc + item.quantity, 0);
}
