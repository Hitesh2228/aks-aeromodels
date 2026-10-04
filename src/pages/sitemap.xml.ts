import type { APIRoute } from 'astro';
import { getCombinedProducts } from '../lib/shopify';
import { getAllBlogPosts } from '../lib/shopifyBlog';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveAbsoluteUrl(baseUrl: string, urlPath: string): string {
  if (!urlPath) return '';
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath;
  }
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${baseUrl}${cleanPath}`;
}

export const GET: APIRoute = async () => {
  const baseUrl = 'https://skynodesuav.in';
  const today = new Date().toISOString().split('T')[0];

  // 1. Core High-Priority Static Pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily', title: 'SKYNODES UAV | India Official Scale Aeromodels & UAV Store' },
    { url: '/shop', priority: '0.9', changefreq: 'daily', title: 'Shop All Aeromodelling Products' },
    { url: '/blog', priority: '0.9', changefreq: 'daily', title: 'RC Flight Academy & Technical Engineering Guides' },
    { url: '/aircrafts', priority: '0.8', changefreq: 'weekly', title: 'Seagull Aeromodels Scale Aircraft Fleet' },
    { url: '/flight-simulator', priority: '0.8', changefreq: 'weekly', title: 'RealFlight Evolution Simulator Experience' },
    { url: '/pro-experience', priority: '0.7', changefreq: 'monthly', title: 'Professional Aeromodelling Experience' },
    { url: '/about', priority: '0.7', changefreq: 'monthly', title: 'About SKYNODES UAV India' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly', title: 'Contact SKYNODES UAV Pilot Support & FAQ' },
    { url: '/sitemap', priority: '0.6', changefreq: 'weekly', title: 'SKYNODES UAV Complete Site Directory' },
    { url: '/profile', priority: '0.5', changefreq: 'monthly', title: 'Pilot Profile & Order Tracking' },
    { url: '/pricing-policy', priority: '0.5', changefreq: 'monthly', title: 'Pricing, Shipping, Refund & GST Tax Policy' },
    { url: '/privacy', priority: '0.5', changefreq: 'monthly', title: 'Privacy Policy' },
    { url: '/terms', priority: '0.5', changefreq: 'monthly', title: 'Terms of Service' },
  ];

  // 2. Category Collections
  const categoryPages = [
    { url: '/shop?category=engine', priority: '0.85', changefreq: 'daily', title: 'Nitro & Gasoline RC Airplane Engines' },
    { url: '/shop?category=aeromodels', priority: '0.85', changefreq: 'daily', title: 'Seagull ARF Scale Aeromodels' },
    { url: '/shop?category=radio-receiver', priority: '0.85', changefreq: 'daily', title: 'Futaba 2.4GHz Transmitters & Telemetry Receivers' },
    { url: '/shop?category=balsa-wood', priority: '0.85', changefreq: 'daily', title: 'AAA Contest Grade Balsa Wood Sheets' },
    { url: '/shop?category=accessories', priority: '0.85', changefreq: 'daily', title: 'Flight Accessories, Servos, Starters & Pumps' },
    { url: '/shop?filter=crazy-deals', priority: '0.85', changefreq: 'daily', title: 'Crazy Deals & Limited Time Discounts' },
    { url: '/shop?filter=bestsellers', priority: '0.85', changefreq: 'daily', title: 'Bestselling Pilot Gear' },
  ];

  // 3. Dynamic Products from Shopify & Static Catalog
  let products: any[] = [];
  try {
    products = await getCombinedProducts();
  } catch (err) {
    console.error('[Sitemap] Failed to fetch products:', err);
  }

  // 4. Dynamic Blogs from Shopify Admin & Flight Academy
  let blogs: any[] = [];
  try {
    blogs = await getAllBlogPosts();
  } catch (err) {
    console.error('[Sitemap] Failed to fetch blogs:', err);
  }

  // Build XML String
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Core Static Pages -->
  ${staticPages
    .map(
      page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}

  <!-- Catalog Categories & Featured Collections -->
  ${categoryPages
    .map(
      cat => `
  <url>
    <loc>${baseUrl}${escapeXml(cat.url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${cat.changefreq}</changefreq>
    <priority>${cat.priority}</priority>
  </url>`
    )
    .join('')}

  <!-- Official E-Commerce Products (With Google Image Extensions) -->
  ${products
    .map(p => {
      const prodUrl = `${baseUrl}/product/${p.id}`;
      const mainImg = resolveAbsoluteUrl(baseUrl, p.image || (p.images && p.images[0]) || '');
      const galleryImgs = (p.images || [])
        .map((img: string) => resolveAbsoluteUrl(baseUrl, img))
        .filter((img: string) => img && img !== mainImg);

      return `
  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${mainImg ? `
    <image:image>
      <image:loc>${escapeXml(mainImg)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
      <image:caption>${escapeXml(`${p.name} - Official SKYNODES UAV India`)}</image:caption>
    </image:image>` : ''}${galleryImgs
      .map(
        (img: string) => `
    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
    </image:image>`
      )
      .join('')}
  </url>`;
    })
    .join('')}

  <!-- RC Flight Academy Technical Articles (With Google Image Extensions) -->
  ${blogs
    .map(b => {
      const postUrl = `${baseUrl}/blog/${b.slug}`;
      const postDate = b.publishedAt ? new Date(b.publishedAt).toISOString().split('T')[0] : today;
      const featuredImg = resolveAbsoluteUrl(baseUrl, b.image || '');

      return `
  <url>
    <loc>${postUrl}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>${featuredImg ? `
    <image:image>
      <image:loc>${escapeXml(featuredImg)}</image:loc>
      <image:title>${escapeXml(b.title)}</image:title>
      <image:caption>${escapeXml(`${b.title} | SKYNODES UAV Flight Academy`)}</image:caption>
    </image:image>` : ''}
  </url>`;
    })
    .join('')}

</urlset>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Robots-Tag': 'noindex', // Sitemap itself shouldn't be a search result, but its contents crawled
    },
  });
};
