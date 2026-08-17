export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  productType: string;
  price: number;
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
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            description
            vendor
            productType
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

  return data.products.edges.map((edge: any) => {
    const node = edge.node;
    const variantNode = node.variants?.edges?.[0]?.node;
    const imageNode = node.images?.edges?.[0]?.node;

    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      description: node.description || "",
      vendor: node.vendor || "SKYNODES UAV",
      productType: node.productType || "Aeromodel",
      price: parseFloat(node.priceRange?.minVariantPrice?.amount || "0"),
      currencyCode: node.priceRange?.minVariantPrice?.currencyCode || "INR",
      imageUrl: imageNode?.url || "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800",
      imageAlt: imageNode?.altText || node.title,
      variantId: variantNode?.id || "",
      availableForSale: variantNode?.availableForSale ?? true
    };
  });
}

// 2. Generate Shopify Direct Checkout URL or Cart Permalink
export function buildShopifyCheckoutUrl(cartItems: any[]): string {
  if (!cartItems || cartItems.length === 0) {
    return `https://${SHOPIFY_DOMAIN}/cart`;
  }

  // Filter items that have Shopify variant IDs
  const validLines = cartItems.map(item => {
    let variantId = item.product?.variantId || item.variantId || item.product?.id || "";
    // Clean numeric ID if full GraphQL GID
    if (variantId.includes("ProductVariant/")) {
      variantId = variantId.split("ProductVariant/")[1];
    } else if (variantId.includes("Product/")) {
      variantId = variantId.split("Product/")[1];
    }
    return { variantId, quantity: item.quantity || 1 };
  }).filter(l => l.variantId);

  if (validLines.length === 0) {
    return `/checkout`;
  }

  const permalink = validLines.map(l => `${l.variantId}:${l.quantity}`).join(",");
  return `https://${SHOPIFY_DOMAIN}/cart/${permalink}`;
}
