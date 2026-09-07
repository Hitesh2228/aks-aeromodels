// Client-Side Live Shopify Sync for Instant UI Updates without Rebuilds

const SHOPIFY_DOMAIN = "skynodesuav.myshopify.com";
const SHOPIFY_TOKEN = "ec578fcbf0e0c5a4b6234c56dd36288a";
const SHOPIFY_API_VERSION = "2024-04";

export interface LiveProduct {
  id: string;
  safeId: string;
  handle: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  productType: string;
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
            productType
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
      const rawId = node.id || "";
      const numId = rawId.includes('/') ? rawId.split('/').pop() : rawId;
      const safeId = `shopify-${numId}`;

      const price = Math.round(parseFloat(node.priceRange?.minVariantPrice?.amount || "0"));
      const compareAtVal = parseFloat(variantNode?.compareAtPrice?.amount || "0");
      const compareAtPrice = Math.round(compareAtVal > price ? compareAtVal : price * 1.2);
      const tagsLower = Array.isArray(node.tags) ? node.tags.map((t: string) => t.toLowerCase().trim()) : [];
      const pctOff = compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

      const titleLower = (node.title || '').toLowerCase();
      const typeLower = (node.productType || '').toLowerCase();

      let assignedCatId = 'aeromodels';
      let assignedCatLabel = 'Seagull Aeromodels';

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
        assignedCatId = 'engine';
        assignedCatLabel = 'Engine';
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
        assignedCatId = 'radio-receiver';
        assignedCatLabel = 'Radio & Receiver';
      } else if (
        titleLower.includes('balsa') || 
        titleLower.includes('wood') || 
        titleLower.includes('plywood') || 
        titleLower.includes('sheet') || 
        typeLower.includes('balsa') ||
        tagsLower.includes('balsa')
      ) {
        assignedCatId = 'balsa-wood';
        assignedCatLabel = 'Balsa Wood';
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
        assignedCatId = 'accessories';
        assignedCatLabel = 'Aeromodel Accessories';
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
        assignedCatId = 'aeromodels';
        assignedCatLabel = 'Seagull Aeromodels';
      }

      let customBadge = pctOff > 0 ? `${pctOff}% OFF` : 'SPECIAL OFFER';
      const badgeTag = (node.tags || []).find((t: string) => t.toLowerCase().startsWith('badge:'));
      if (badgeTag) {
        customBadge = badgeTag.substring(6).trim();
      }

      return {
        id: node.handle || safeId || node.id,
        safeId,
        handle: node.handle || safeId,
        title: node.title,
        description: node.description || "",
        category: assignedCatId,
        categoryLabel: assignedCatLabel,
        productType: node.productType || "Seagull Aeromodels",
        tags: tagsLower,
        price,
        originalPrice: compareAtPrice,
        discountBadge: customBadge,
        imageUrl: imageNode?.url || "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800",
        isBestseller: tagsLower.some((t: string) => t === 'bestseller' || t === 'best-seller' || t === 'best seller' || t.includes('bestseller')),
        isCrazyDeal: tagsLower.some((t: string) => t === 'crazy-deal' || t === 'crazydeal' || t === 'crazy deal' || t.includes('crazy')),
        isNewArrival: tagsLower.some((t: string) => t === 'new' || t === 'new-arrival' || t === 'new arrival')
      };
    });
  } catch (err) {
    console.error("[Client Sync Exception]", err);
    return null;
  }
}
