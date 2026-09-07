import { PRODUCTS as staticProducts, type Product } from '../data/products';

export interface ShopifyProduct {
  id: string;
  safeId: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  price: number;
  compareAtPrice: number;
  currencyCode: string;
  imageUrl: string;
  imageAlt: string;
  variantId: string;
  availableForSale: boolean;
}

const SHOPIFY_DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN || "skynodesuav.myshopify.com";
const SHOPIFY_TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "ec578fcbf0e0c5a4b6234c56dd36288a";
const SHOPIFY_API_VERSION = import.meta.env.PUBLIC_SHOPIFY_API_VERSION || "2024-04";

export async function fetchShopifyStorefront<T = any>(query: string, variables: Record<string, any> = {}): Promise<T | null> {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      console.error(`[Shopify Error] HTTP status ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (json.errors) {
      console.error("[Shopify GraphQL Errors]", json.errors);
    }
    return json.data;
  } catch (err) {
    console.error("[Shopify Fetch Exception]", err);
    return null;
  }
}

// 1. Fetch All Active Products from Shopify Storefront
export async function getAllShopifyProducts(): Promise<ShopifyProduct[]> {
  const query = `
    query getProducts {
      products(first: 250, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            description
            vendor
            productType
            tags
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await fetchShopifyStorefront(query);
  if (!data?.products?.edges) return [];

  const items = data.products.edges.map((edge: any) => {
    const node = edge.node;
    const variantNode = node.variants?.edges?.[0]?.node;
    const imageNode = node.images?.edges?.[0]?.node;
    const rawId = node.id;
    const numericId = rawId.includes('/') ? rawId.split('/').pop() : rawId;
    const safeId = `shopify-${numericId}`;
    const priceVal = parseFloat(node.priceRange?.minVariantPrice?.amount || variantNode?.price?.amount || "0");
    const compareAtVal = parseFloat(variantNode?.compareAtPrice?.amount || "0");

    return {
      id: node.id,
      safeId,
      title: node.title,
      handle: node.handle || safeId,
      description: node.description || "",
      vendor: node.vendor || "SKYNODES UAV",
      productType: node.productType || "Aeromodel",
      tags: Array.isArray(node.tags) ? node.tags : [],
      price: priceVal,
      compareAtPrice: compareAtVal,
      currencyCode: node.priceRange?.minVariantPrice?.currencyCode || "INR",
      imageUrl: imageNode?.url || "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800",
      imageAlt: imageNode?.altText || node.title,
      variantId: variantNode?.id || "",
      availableForSale: variantNode?.availableForSale ?? true
    };
  });

  // Filter out mock demo items so official aeromodelling client products display 100%
  return items.filter((p: any) => 
    !p.title.toLowerCase().includes('snowboard') && 
    !p.title.toLowerCase().includes('ski wax') &&
    !p.title.toLowerCase().includes('gift card')
  );
}

// Helper: Convert Shopify product to standard site Product format
export function mapShopifyToProduct(sp: ShopifyProduct, idx = 0): Product {
  const price = Math.round(sp.price);
  const compareAtPrice = Math.round(sp.compareAtPrice);
  const origPrice = compareAtPrice > price ? compareAtPrice : Math.round(price * 1.2);
  const pctOff = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

  const tagsLower = (sp.tags || []).map(t => t.toLowerCase().trim());

  // Check tags for Bestseller, Crazy Deal, New Arrival
  const isBestsellerTag = tagsLower.some(t => t === 'bestseller' || t === 'best-seller' || t === 'best seller' || t.includes('bestseller'));
  const isCrazyDealTag = tagsLower.some(t => t === 'crazy-deal' || t === 'crazydeal' || t === 'crazy deal' || t.includes('crazy'));
  const isNewArrivalTag = tagsLower.some(t => t === 'new' || t === 'new-arrival' || t === 'new arrival');

  let customBadge: string | undefined = pctOff > 0 ? `${pctOff}% OFF` : undefined;
  const badgeTag = (sp.tags || []).find(t => t.toLowerCase().startsWith('badge:'));
  if (badgeTag) {
    customBadge = badgeTag.substring(6).trim();
  }

  const catList: Array<{ id: 'engine' | 'radio-receiver' | 'aeromodels' | 'balsa-wood' | 'accessories'; label: string }> = [
    { id: 'engine', label: 'Engine' },
    { id: 'radio-receiver', label: 'Radio & Receiver' },
    { id: 'aeromodels', label: 'Seagull Aeromodels' },
    { id: 'balsa-wood', label: 'Balsa Wood' },
    { id: 'accessories', label: 'Aeromodel Accessories' }
  ];

  const titleLower = (sp.title || '').toLowerCase();
  const typeLower = (sp.productType || '').toLowerCase();

  let assignedCat = catList[2]; // Default to Seagull Aeromodels
  if (
    titleLower.includes('engine') || 
    typeLower.includes('engine') || 
    tagsLower.includes('engine') ||
    titleLower.includes('nitro') || 
    titleLower.includes('gasoline') || 
    titleLower.includes('o.s.') || 
    titleLower.includes('os max') ||
    (titleLower.includes('stroke') && !titleLower.includes('arf') && !titleLower.includes('trainer') && !titleLower.includes('sea'))
  ) {
    assignedCat = catList[0];
  } else if (
    titleLower.includes('radio') || 
    titleLower.includes('receiver') || 
    titleLower.includes('futaba') || 
    titleLower.includes('transmitter') || 
    typeLower.includes('radio') ||
    tagsLower.includes('radio') ||
    tagsLower.includes('receiver') ||
    titleLower.includes('telemetry')
  ) {
    assignedCat = catList[1];
  } else if (
    titleLower.includes('balsa') || 
    titleLower.includes('wood') || 
    titleLower.includes('plywood') || 
    titleLower.includes('sheet') || 
    typeLower.includes('balsa') ||
    tagsLower.includes('balsa')
  ) {
    assignedCat = catList[3];
  } else if (
    titleLower.includes('servo') || 
    titleLower.includes('propeller') || 
    titleLower.includes('accessory') || 
    titleLower.includes('accessories') || 
    titleLower.includes('spinner') || 
    titleLower.includes('wheel') || 
    titleLower.includes('fuel tank') || 
    typeLower.includes('accessory') ||
    tagsLower.includes('accessory') ||
    tagsLower.includes('accessories')
  ) {
    assignedCat = catList[4];
  } else if (
    typeLower.includes('aeromodel') || 
    typeLower.includes('seagull') || 
    tagsLower.includes('aeromodels') || 
    tagsLower.includes('aeromodel') || 
    tagsLower.includes('seagull') ||
    titleLower.includes('sea') || 
    titleLower.includes('boomerang') || 
    titleLower.includes('trainer') || 
    titleLower.includes('arf') || 
    titleLower.includes('yak') || 
    titleLower.includes('pilatus') || 
    titleLower.includes('decathlon') || 
    titleLower.includes('edge') || 
    titleLower.includes('extra') || 
    titleLower.includes('bi-plane') ||
    titleLower.includes('plane') ||
    titleLower.includes('aircraft')
  ) {
    assignedCat = catList[2];
  }

  return {
    id: sp.handle || sp.safeId || sp.id,
    handle: sp.handle,
    name: sp.title,
    category: assignedCat.id,
    categoryLabel: assignedCat.label,
    price: price,
    originalPrice: origPrice,
    discountBadge: customBadge,
    rating: 4.9,
    reviewsCount: 35 + idx * 4,
    isBestseller: isBestsellerTag,
    isNewArrival: isNewArrivalTag,
    isCrazyDeal: isCrazyDealTag,
    isFromShopify: true,
    image: sp.imageUrl,
    description: sp.description || 'Official SKYNODES UAV product synced live from Shopify Storefront.',
    specs: { Vendor: sp.vendor, Type: sp.productType, Status: sp.availableForSale ? 'In Stock' : 'Out of Stock' },
    inStock: sp.availableForSale,
    variantId: sp.variantId
  };
}

// Get Combined Products for Static Routes & Registry
export async function getCombinedProducts(): Promise<Product[]> {
  const shopifyList = await getAllShopifyProducts();
  const convertedShopify = shopifyList.map((sp, idx) => mapShopifyToProduct(sp, idx));
  
  if (convertedShopify.length === 0) {
    return staticProducts;
  }

  const shopifyIds = new Set(convertedShopify.map(p => p.id));
  const shopifyHandles = new Set(convertedShopify.map(p => p.handle).filter(Boolean));
  
  const filteredStatic = staticProducts.filter(p => !shopifyIds.has(p.id) && !shopifyHandles.has(p.id));

  return [...convertedShopify, ...filteredStatic];
}

// 2. Sync Cart / Order to Shopify Storefront API and Return Official Checkout URL
export async function syncCartToShopifyStorefront(order: any): Promise<string> {
  try {
    const lines = (order.items || []).map((item: any) => {
      let variantId = item.product?.variantId || item.product?.id || "";
      if (!variantId.startsWith('gid://')) {
        const num = variantId.replace(/[^0-9]/g, '');
        variantId = num ? `gid://shopify/ProductVariant/${num}` : `gid://shopify/ProductVariant/53673599598868`;
      }
      return {
        merchandiseId: variantId,
        quantity: item.quantity || 1
      };
    });

    const mutation = `
      mutation createCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const validEmail = order.customer.email && order.customer.email.includes('@') ? order.customer.email : 'pilot@gmail.com';

    const variables = {
      input: {
        lines,
        buyerIdentity: {
          email: validEmail
        }
      }
    };

    const res = await fetchShopifyStorefront(mutation, variables);
    const checkoutUrl = res?.cartCreate?.cart?.checkoutUrl;

    if (checkoutUrl) {
      return checkoutUrl;
    }
  } catch (err) {
    console.error('[Shopify Cart Sync Exception]', err);
  }

  // Fallback to Shopify Cart permalink
  return buildShopifyCheckoutUrl(order.items);
}

// 3. Generate Shopify Direct Checkout URL or Cart Permalink
export function buildShopifyCheckoutUrl(cartItems: any[]): string {
  if (!cartItems || cartItems.length === 0) {
    return `https://${SHOPIFY_DOMAIN}/cart`;
  }

  const validLines = cartItems.map(item => {
    let variantId = item.product?.variantId || item.variantId || item.product?.id || "";
    if (variantId.includes("ProductVariant/")) {
      variantId = variantId.split("ProductVariant/")[1];
    } else if (variantId.includes("Product/")) {
      variantId = variantId.split("Product/")[1];
    }
    return { variantId, quantity: item.quantity || 1 };
  }).filter(l => l.variantId);

  if (validLines.length === 0) {
    return `https://${SHOPIFY_DOMAIN}/cart`;
  }

  const permalink = validLines.map(l => `${l.variantId}:${l.quantity}`).join(",");
  return `https://${SHOPIFY_DOMAIN}/cart/${permalink}`;
}
