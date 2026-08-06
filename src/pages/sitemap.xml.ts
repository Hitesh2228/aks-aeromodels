import type { APIRoute } from 'astro';
import { PRODUCTS } from '../data/products';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://aks-aeromodels.com';
  
  const staticPages = ['', '/aircrafts', '/shop', '/about', '/contact', '/privacy', '/terms', '/pricing-policy', '/blog'];
  
  const productUrls = PRODUCTS.map(p => `/product/${p.id}`);
  const blogUrls = [
    '/blog/how-to-break-in-nitro-engine',
    '/blog/choosing-first-seagull-trainer',
    '/blog/balsa-wood-density-guide'
  ];

  const allUrls = [...staticPages, ...productUrls, ...blogUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls.map(url => `
    <url>
      <loc>${baseUrl}${url}</loc>
      <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${url === '' ? '1.0' : url.startsWith('/product/') ? '0.8' : '0.6'}</priority>
    </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
