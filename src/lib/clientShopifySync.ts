// Client-Side Live Shopify Sync for Instant UI Updates without Rebuilds

const SHOPIFY_DOMAIN = "skynodesuav.myshopify.com";
const SHOPIFY_TOKEN = "ec578fcbf0e0c5a4b6234c56dd36288a";
const SHOPIFY_API_VERSION = "2024-04";

export interface LiveProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  originalPrice: number;
  discountBadge: string;
  imageUrl: string;
  isBestseller: boolean;
  isCrazyDeal: boolean;
  isNewArrival: boolean;
}

export async function fetchLiveShopifyProducts(): Promise<LiveProduct[] | null> {
  const query = `
    query getProducts {
      products(first: 250, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            description
            tags
            priceRange {
              minVariantPrice {
                amount
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  compareAtPrice {
                    amount
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

  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.data?.products?.edges) return null;

    return json.data.products.edges.map((e: any) => {
      const node = e.node;
      const variantNode = node.variants?.edges?.[0]?.node;
      const imageNode = node.images?.edges?.[0]?.node;
      const price = Math.round(parseFloat(node.priceRange?.minVariantPrice?.amount || "0"));
      const compareAtVal = parseFloat(variantNode?.compareAtPrice?.amount || "0");
      const compareAtPrice = Math.round(compareAtVal > price ? compareAtVal : price * 1.2);
      const tags = Array.isArray(node.tags) ? node.tags.map((t: string) => t.toLowerCase()) : [];
      const pctOff = compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

      return {
        id: node.handle || node.id,
        handle: node.handle || node.id,
        title: node.title,
        description: node.description || "",
        tags,
        price,
        originalPrice: compareAtPrice,
        discountBadge: pctOff > 0 ? `${pctOff}% OFF` : 'SPECIAL OFFER',
        imageUrl: imageNode?.url || "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800",
        isBestseller: tags.includes('bestseller') || tags.includes('best-seller'),
        isCrazyDeal: tags.includes('crazy-deal') || tags.includes('crazydeal') || tags.includes('crazy deal'),
        isNewArrival: tags.includes('new') || tags.includes('new-arrival')
      };
    });
  } catch (err) {
    console.error("[Client Sync Exception]", err);
    return null;
  }
}
