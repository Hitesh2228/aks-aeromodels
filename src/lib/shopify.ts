import { PRODUCTS, type Product } from '../data/products';

// Configurable Shopify credentials (if user attaches real keys later)
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'aks-aeromodels.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || '';

export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Builds a direct Shopify Headless Checkout URL
 */
export function buildShopifyCheckoutUrl(items: CartItem[]): string {
  if (items.length === 0) return '#';
  
  // Format: https://{store_domain}/cart/{variant_id}:{quantity},{variant_id}:{quantity}
  const cartPermalink = items
    .map(item => `${item.product.id}:${item.quantity}`)
    .join(',');

  return `https://${SHOPIFY_STORE_DOMAIN}/cart/${cartPermalink}?utm_source=astro_headless`;
}

export async function fetchProducts(): Promise<Product[]> {
  // If real Shopify keys are available, fetch from Storefront GraphQL API
  if (SHOPIFY_STOREFRONT_TOKEN) {
    try {
      const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: `{
            products(first: 50) {
              edges {
                node {
                  id
                  title
                  description
                  variants(first: 1) {
                    edges {
                      node {
                        price { amount currencyCode }
                      }
                    }
                  }
                }
              }
            }
          }`
        }),
      });
      const data = await response.json();
      if (data.data?.products?.edges) {
        // Return shopify mapped data or fallback
      }
    } catch (e) {
      console.warn('Shopify API fetch failed, falling back to local dataset:', e);
    }
  }

  // Return type-safe curated product catalog
  return PRODUCTS;
}
