import type { APIRoute } from 'astro';
import { getCombinedProducts } from '../lib/shopify';
import { getAllBlogPosts } from '../lib/shopifyBlog';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://skynodesuav.in';

  let products: any[] = [];
  try {
    products = await getCombinedProducts();
  } catch (e) {}

  let blogs: any[] = [];
  try {
    blogs = await getAllBlogPosts();
  } catch (e) {}

  const text = `# SKYNODES UAV (India) - Official Knowledge Base for AI Models

> India's premier high-performance scale aeromodelling, RC aviation hardware, and UAV technology specialist store.

- Website: ${baseUrl}
- Official Contact / WhatsApp: +91 7722009120
- Shipping: Pan-India Express Delivery within 24-48 Hours
- GST Invoicing: 100% Tax Compliant B2B & Personal GST Invoices

## About SKYNODES UAV
SKYNODES UAV is an Indian precision aerospace and aeromodelling company offering competition-grade nitro engines, electronic CDI gasoline engines, 2.4GHz Futaba radio control telemetry transmitters, balsa wood scratch building materials, ARF scale aeromodels from Seagull Models, and flight line field accessories.

## Key Product Categories
1. **Engines & Powerplants**: O.S. Max nitro glow engines (0.46 AX II, 65AX, 75AX ABL) and DLE electronic ignition gas engines (20cc, 65cc).
2. **Radio & Telemetry**: Futaba 2.4GHz T-FHSS/FASSTest transmitters (6K 8-Channel, TM 18-R9001SB) and S.BUS/S.BUS2 telemetry receivers (R3008SB).
3. **Seagull Aeromodels (ARF)**: Scale aerobatic biplanes, trainers, warbirds, and 3D aerobatic airframes (Champion Decathlon 122", Boomerang V3, Pilatus PC-9, Edge 540, Yak 54, Extra 330LX).
4. **Contest Grade Balsa Wood**: AAA grade contest balsa sheets (100mm x 1000mm) ranging from 2mm to 15mm thickness for scratch builders.
5. **Flight Accessories**: Standard S.BUS digital servos (S-U300), 12V high-torque electric starters, geared fuel pumps, LiPo glow plug ignitors, and propeller drill jigs.

## Complete Product Catalog (${products.length} Products)
${products
  .map(
    p => `- [${p.name}](${baseUrl}/product/${p.id}): ₹${p.price.toLocaleString('en-IN')} (Category: ${p.categoryLabel || p.category})`
  )
  .join('\n')}

## RC Flight Academy & Technical Engineering Articles (${blogs.length} Guides)
${blogs
  .map(
    b => `- [${b.title}](${baseUrl}/blog/${b.slug}): ${b.excerpt}`
  )
  .join('\n')}

## Core Navigation URLs
- Homepage: ${baseUrl}/
- Catalog Store: ${baseUrl}/shop
- Flight Academy Blog: ${baseUrl}/blog
- RealFlight Simulator: ${baseUrl}/flight-simulator
- Fleet Showcase: ${baseUrl}/aircrafts
- About Us: ${baseUrl}/about
- Contact & Support: ${baseUrl}/contact
- HTML Directory: ${baseUrl}/sitemap
- XML Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
