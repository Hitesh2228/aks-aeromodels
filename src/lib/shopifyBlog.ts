import { FALLBACK_POSTS, type BlogPost } from '../data/blogs';

export const SHOPIFY_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN || 'skynodesuav.myshopify.com';
export const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || Buffer.from('c2hwYXRfM2FlZjZhYTgyOGRkMTlhNTFiMDliNTQ4OGEwOTYyYWE=', 'base64').toString('utf8');
export const SHOPIFY_STOREFRONT_TOKEN = process.env.PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'ec578fcbf0e0c5a4b6234c56dd36288a';
export const SHOPIFY_API_VERSION = '2024-04';

function calculateReadTime(text: string): string {
  const words = text.replace(/<[^>]+>/g, '').trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// 1. Fetch articles from Shopify Admin API (when read_content scope is approved)
async function fetchShopifyAdminArticles(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/articles.json?limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.articles || !Array.isArray(data.articles)) return [];

    return data.articles.map((a: any) => {
      const rawContent = a.body_html || '';
      const tagsList = typeof a.tags === 'string' ? a.tags.split(',').map((t: string) => t.trim()) : (a.tags || []);
      const category = tagsList[0] || 'TECHNICAL GUIDE';

      return {
        id: `shopify-${a.id}`,
        slug: a.handle || `article-${a.id}`,
        title: a.title,
        excerpt: a.summary_html ? a.summary_html.replace(/<[^>]+>/g, '').trim() : (rawContent.replace(/<[^>]+>/g, '').substring(0, 160) + '...'),
        contentHtml: rawContent,
        date: formatDate(a.published_at || a.created_at),
        publishedAt: a.published_at || a.created_at,
        author: a.author || 'SKYNODES UAV Technical Flight Team',
        category: category.toUpperCase(),
        readTime: calculateReadTime(rawContent),
        image: a.image?.src || 'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/sea-1-1.jpg?v=1791020060',
        tags: tagsList
      };
    });
  } catch (e) {
    console.warn('[Shopify Admin Articles Sync] Could not reach Shopify Admin articles:', e);
    return [];
  }
}

// 2. Main getter for all blog posts (Shopify Live + Fallback)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const shopifyPosts = await fetchShopifyAdminArticles();
  
  if (shopifyPosts.length > 0) {
    // If client created or edited articles in Shopify, prioritize them!
    const combined: BlogPost[] = shopifyPosts.map(sp => {
      const matchingFallback = FALLBACK_POSTS.find(fp => fp.slug === sp.slug);
      if (matchingFallback) {
        return {
          ...matchingFallback,
          ...sp,
          contentHtml: sp.contentHtml || matchingFallback.contentHtml,
          title: sp.title || matchingFallback.title,
          excerpt: sp.excerpt || matchingFallback.excerpt,
          image: sp.image || matchingFallback.image,
          keyTakeaways: matchingFallback.keyTakeaways,
          relatedProductId: matchingFallback.relatedProductId || sp.relatedProductId,
          relatedCategory: matchingFallback.relatedCategory || sp.relatedCategory,
        };
      }
      return sp;
    });

    // Merge fallback posts whose slugs don't clash
    FALLBACK_POSTS.forEach(fp => {
      if (!combined.some(cp => cp.slug === fp.slug)) {
        combined.push(fp);
      }
    });
    return combined;
  }

  return FALLBACK_POSTS;
}

// 3. Get single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const all = await getAllBlogPosts();
  return all.find(p => p.slug === slug || p.id === slug);
}
