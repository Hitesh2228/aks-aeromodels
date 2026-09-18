import { registerProductsCache } from './cartStore';

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
  prepaidDiscountPct?: number;
  gstRate?: number;
  hsnCode?: string;
  basePrice?: number;
  warrantyPeriod?: string;
  youtubeVideoId?: string;
  availableForSale?: boolean;
  stock?: number;
  imageUrl: string;
  images?: string[];
  isBestseller: boolean;
  isCrazyDeal: boolean;
  isNewArrival: boolean;
  // Dynamic PDP Backend Controls
  comboId?: string;
  materialText?: string;
  howToUseText?: string;
  faqList?: Array<{ q: string; a: string }>;
  trustBadges?: string[];
  notesInSet?: Array<{ name: string; desc: string }>;
  whereToFly?: string[];
  vibesText?: string;
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
            totalInventory
            priceRange {
              minVariantPrice {
                amount
              }
            }
            images(first: 10) {
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
                  quantityAvailable
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store',
      body: JSON.stringify({ query })
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.data?.products?.edges) return null;

    return json.data.products.edges.map((e: any) => {
      const node = e.node;
      const variantNode = node.variants?.edges?.[0]?.node;
      const imageEdges = node.images?.edges || [];
      const imageList = imageEdges.map((e: any) => e.node?.url).filter(Boolean);
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

      function getTagValue(prefix: string): string | undefined {
        if (!node.tags || !Array.isArray(node.tags)) return undefined;
        const p = prefix.toLowerCase();
        for (const raw of node.tags) {
          const t = raw.trim();
          const tLower = t.toLowerCase();
          if (tLower.startsWith(p)) {
            const remainder = t.substring(prefix.length).trim();
            if (remainder.startsWith(':') || remainder.startsWith('-')) {
              return remainder.substring(1).trim();
            }
          }
        }
        return undefined;
      }

      let customBadge = pctOff > 0 ? `${pctOff}% OFF` : 'SPECIAL OFFER';
      const badgeVal = getTagValue('badge');
      if (badgeVal) {
        customBadge = badgeVal;
      }

      // Parse Configurable Prepaid Discount Tag (e.g. "prepaid:10%", "prepaid: 7%", "prepaid : 10")
      let prepaidDiscountPct = 5;
      const prepaidVal = getTagValue('prepaid');
      if (prepaidVal) {
        const parsed = parseInt(prepaidVal.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 90) {
          prepaidDiscountPct = parsed;
        }
      }

      // Parse Configurable GST Rate Tag (e.g. "gst:12%", "gst: 12%", "gst: 28%", "gst:5%")
      let gstRate = 18;
      const gstVal = getTagValue('gst');
      if (gstVal) {
        const parsed = parseInt(gstVal.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 40) {
          gstRate = parsed;
        }
      }

      // Parse Configurable Warranty Tag (e.g. "warranty:2-Year", "warranty: 6-Months")
      let warrantyPeriod: string | undefined = undefined;
      const warrantyVal = getTagValue('warranty');
      if (warrantyVal) {
        warrantyPeriod = warrantyVal;
      }

      // Parse Configurable YouTube Video Tag (e.g. "yt:l4J81G3H5e0" or "video:https://youtu.be/...")
      let youtubeVideoId: string | undefined = undefined;
      const videoVal = getTagValue('yt') || getTagValue('video');
      if (videoVal) {
        if (videoVal.includes('v=')) {
          youtubeVideoId = videoVal.split('v=')[1]?.split('&')[0];
        } else if (videoVal.includes('youtu.be/')) {
          youtubeVideoId = videoVal.split('youtu.be/')[1]?.split('?')[0];
        } else if (videoVal) {
          youtubeVideoId = videoVal;
        }
      }

      // Parse Configurable HSN Code Tag (e.g. "hsn:84071000", "HSN: 85432090")
      let hsnCode: string | undefined = undefined;
      const hsnVal = getTagValue('hsn');
      if (hsnVal) {
        hsnCode = hsnVal;
      }

      // Parse Configurable Best Selling Combo Paired Product Tag (e.g. "combo:acc-13" or "combo:eng-1")
      let comboId: string | undefined = undefined;
      const comboVal = getTagValue('combo');
      if (comboVal) {
        comboId = comboVal;
      }

      // Parse Material / Ingredients Tag (e.g. "material:Aircraft aluminum, balsa wood, steel crankshaft")
      let materialText: string | undefined = undefined;
      const matVal = getTagValue('material');
      if (matVal) {
        materialText = matVal;
      }

      // Parse How To Use / Break-In Steps Tag (e.g. "howtouse:Run 3 cycles at idle before flying")
      let howToUseText: string | undefined = undefined;
      const useVal = getTagValue('howtouse') || getTagValue('use');
      if (useVal) {
        howToUseText = useVal;
      }

      // Parse FAQ Tag (single tag "faq:Q: ... A: ... | Q: ... A: ..." or individual "faq1:...", "faq2:...")
      let faqList: Array<{ q: string; a: string }> | undefined = undefined;
      const faqVal = getTagValue('faq');
      if (faqVal) {
        const parts = faqVal.split('|');
        faqList = parts.map(p => {
          const m = p.match(/Q:\s*(.*?)\s*A:\s*(.*)/i);
          if (m) return { q: m[1].trim(), a: m[2].trim() };
          return { q: 'FAQ', a: p.trim() };
        }).filter(f => f.a);
      } else {
        const numberedFaqs: Array<{ q: string; a: string }> = [];
        for (let i = 1; i <= 10; i++) {
          const fVal = getTagValue(`faq${i}`);
          if (fVal) {
            const m = fVal.match(/Q:\s*(.*?)\s*A:\s*(.*)/i);
            if (m) numberedFaqs.push({ q: m[1].trim(), a: m[2].trim() });
            else numberedFaqs.push({ q: `FAQ ${i}`, a: fVal.trim() });
          }
        }
        if (numberedFaqs.length > 0) faqList = numberedFaqs;
      }

      // Parse 4 Trust Badges Tag (single tag "trust:A | B | C" or individual "trust1:...", "trust2:...")
      let trustBadges: string[] | undefined = undefined;
      const trustVal = getTagValue('trust');
      if (trustVal) {
        trustBadges = trustVal.split(/[|/]/).map(b => b.trim()).filter(Boolean);
      } else {
        const numberedTrust: string[] = [];
        for (let i = 1; i <= 10; i++) {
          const tVal = getTagValue(`trust${i}`);
          if (tVal) numberedTrust.push(tVal.trim());
        }
        if (numberedTrust.length > 0) trustBadges = numberedTrust;
      }

      // Parse Notes in This Set Tag (single tag "notes:Name - Desc | Name - Desc" or individual "note1:...", "note2:...")
      function parseNoteItem(raw: string): { name: string; desc: string } {
        const s = raw.trim();
        // Prioritize ' - ' (with spaces) so hyphenated model codes like 'E-4040 Silencer' aren't prematurely cut!
        let idx = s.indexOf(' - ');
        let delimLen = 3;
        if (idx === -1) {
          idx = s.indexOf(' : ');
          delimLen = 3;
        }
        if (idx === -1) {
          idx = s.indexOf(': ');
          delimLen = 2;
        }
        if (idx === -1) {
          idx = s.indexOf(' | ');
          delimLen = 3;
        }
        if (idx > -1) {
          return { name: s.substring(0, idx).trim(), desc: s.substring(idx + delimLen).trim() };
        }
        return { name: s, desc: '' };
      }

      let notesInSet: Array<{ name: string; desc: string }> | undefined = undefined;
      const notesVal = getTagValue('notes');
      if (notesVal) {
        notesInSet = notesVal.split('|').map(parseNoteItem).filter(n => n.name);
      } else {
        const numberedNotes: Array<{ name: string; desc: string }> = [];
        for (let i = 1; i <= 10; i++) {
          const nVal = getTagValue(`note${i}`);
          if (nVal) {
            const item = parseNoteItem(nVal);
            if (item.name) numberedNotes.push(item);
          }
        }
        if (numberedNotes.length > 0) notesInSet = numberedNotes;
      }

      // Parse Where To Fly Applications Tag (single tag "fly:A | B | C" or individual "fly1:...", "fly2:...")
      let whereToFly: string[] | undefined = undefined;
      const flyVal = getTagValue('fly');
      if (flyVal) {
        whereToFly = flyVal.split(/[|/]/).map(f => f.trim()).filter(Boolean);
      } else {
        const numberedFly: string[] = [];
        for (let i = 1; i <= 10; i++) {
          const fVal = getTagValue(`fly${i}`);
          if (fVal) numberedFly.push(fVal.trim());
        }
        if (numberedFly.length > 0) whereToFly = numberedFly;
      }

      // Parse Vibes Tag (e.g. "vibes:Versatile, confident, bold, high-performance flight")
      let vibesText: string | undefined = undefined;
      const vibesVal = getTagValue('vibes');
      if (vibesVal) {
        vibesText = vibesVal;
      }

      const rawTotalInv = typeof node.totalInventory === 'number' ? node.totalInventory : null;
      const rawQtyAvail = typeof variantNode?.quantityAvailable === 'number' ? variantNode.quantityAvailable : null;

      let availableForSale = variantNode?.availableForSale ?? true;
      if (rawTotalInv !== null && rawTotalInv <= 0) {
        availableForSale = false;
      } else if (rawQtyAvail !== null && rawQtyAvail <= 0) {
        availableForSale = false;
      }

      const currentStock = rawTotalInv ?? rawQtyAvail ?? (availableForSale ? 10 : 0);

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
        prepaidDiscountPct,
        gstRate,
        hsnCode,
        basePrice: Math.round(price / (1 + gstRate / 100)),
        warrantyPeriod,
        youtubeVideoId,
        availableForSale,
        stock: currentStock,
        imageUrl: imageList[0] || "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800",
        images: imageList,
        isBestseller: tagsLower.some((t: string) => t === 'bestseller' || t === 'best-seller' || t === 'best seller' || t.includes('bestseller')),
        isCrazyDeal: tagsLower.some((t: string) => t === 'crazy-deal' || t === 'crazydeal' || t === 'crazy deal' || t.includes('crazy')),
        isNewArrival: tagsLower.some((t: string) => t === 'new' || t === 'new-arrival' || t === 'new arrival'),
        comboId,
        materialText,
        howToUseText,
        faqList,
        trustBadges,
        notesInSet,
        whereToFly,
        vibesText
      };
    });

    // Auto-cache live products in cartStore so cart and shop always use up-to-date prices
    registerProductsCache(products);
    return products;
  } catch (err) {
    console.error("[Client Sync Exception]", err);
    return null;
  }
}
