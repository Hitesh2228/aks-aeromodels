import { PRODUCTS, type Product } from '../data/products';
import { getCachedProduct } from './cartStore';

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

export function showWishlistToast(title = 'Product', isAdded = true) {
  if (typeof window === 'undefined') return;

  let toast = document.getElementById('wishlist-toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wishlist-toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
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
      border: 1px solid #333333;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = isAdded 
    ? `<span style="font-size: 1.1rem; color: #ef4444;">❤️</span> <span><strong>${title}</strong> added to Wishlist!</span>`
    : `<span style="font-size: 1.1rem; color: #999999;">🤍</span> <span><strong>${title}</strong> removed from Wishlist</span>`;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    if (toast) {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }
  }, 2500);
}

export function toggleWishlist(product: Product): boolean {
  if (typeof window === 'undefined' || !product) return false;
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
    showWishlistToast(product.name, isAdded);
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

export function initWishlistButtons() {
  if (typeof window === 'undefined') return;

  function refreshAllButtons() {
    const btns = document.querySelectorAll('.wishlist-toggle-btn, .btn-heart-wishlist, .btn-card-wishlist, .btn-pdp-wishlist');
    btns.forEach(btn => {
      const pId = btn.getAttribute('data-id');
      if (!pId) return;
      const inWish = isInWishlist(pId);
      const heart = btn.querySelector('svg');

      if (inWish) {
        btn.classList.add('active');
        btn.setAttribute('title', 'Remove from Wishlist');
        if (heart) {
          heart.setAttribute('fill', '#e63946');
          heart.setAttribute('stroke', '#e63946');
        }
      } else {
        btn.classList.remove('active');
        btn.setAttribute('title', 'Save to Wishlist');
        if (heart) {
          heart.setAttribute('fill', 'none');
          heart.setAttribute('stroke', 'currentColor');
        }
      }
    });
  }

  refreshAllButtons();

  if ((window as any).__wishlistButtonsInitialized) {
    (window as any).__refreshWishlistButtons = refreshAllButtons;
    return;
  }
  (window as any).__wishlistButtonsInitialized = true;
  (window as any).__refreshWishlistButtons = refreshAllButtons;

  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.wishlist-toggle-btn, .btn-heart-wishlist, .btn-card-wishlist, .btn-pdp-wishlist') as HTMLElement | null;
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();

    const pId = btn.getAttribute('data-id');
    if (!pId) return;

    let product = getCachedProduct(pId) || PRODUCTS.find(p => p.id === pId || p.handle === pId);
    if (!product && btn.dataset.name) {
      product = {
        id: pId,
        name: btn.dataset.name || 'Product',
        price: Number(btn.dataset.price) || 0,
        originalPrice: Number(btn.dataset.originalPrice) || Number(btn.dataset.price) || 0,
        image: btn.dataset.image || '',
        category: 'accessories',
        categoryLabel: btn.dataset.category || 'AEROMODELS',
        rating: Number(btn.dataset.rating) || 4.9,
        reviewsCount: Number(btn.dataset.reviewsCount) || 42,
        discountBadge: btn.dataset.discountBadge || '',
        isBestseller: btn.dataset.isBestseller === 'true',
        description: '',
        features: []
      } as Product;
    }

    if (product) {
      toggleWishlist(product);
      refreshAllButtons();
    }
  });

  window.addEventListener('wishlist-updated', refreshAllButtons);
}
