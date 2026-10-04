import { FALLBACK_POSTS } from '../src/data/blogs';
import fs from 'node:fs';
import path from 'node:path';

// Helper to load .env manually if not set
if (!process.env.SHOPIFY_ADMIN_TOKEN) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key]) process.env[key] = value;
        }
      });
    }
  } catch (e) {
    // Ignore error
  }
}

const SHOPIFY_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN || 'skynodesuav.myshopify.com';
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';
const API_VERSION = '2024-04';

if (!SHOPIFY_ADMIN_TOKEN) {
  console.error('❌ Error: SHOPIFY_ADMIN_TOKEN is missing in environment variables or .env file.');
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function shopifyRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Shopify API error [${res.status}] on ${endpoint}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function syncAllBlogs() {
  console.log('🚀 Starting Shopify Blog Sync for SKYNODES UAV...');
  console.log(`📡 Connecting to: ${SHOPIFY_DOMAIN}`);

  // 1. Fetch Blogs
  const blogsData = await shopifyRequest('/blogs.json');
  if (!blogsData.blogs || blogsData.blogs.length === 0) {
    throw new Error('No blogs found in Shopify Admin.');
  }

  // Use the primary blog
  const targetBlog = blogsData.blogs[0];
  console.log(`📂 Target Blog found: "${targetBlog.title}" (ID: ${targetBlog.id})`);

  // Optionally update blog title to reflect professional academy
  if (targetBlog.title === 'News') {
    try {
      await shopifyRequest(`/blogs/${targetBlog.id}.json`, 'PUT', {
        blog: {
          id: targetBlog.id,
          title: 'RC Flight Academy & News'
        }
      });
      console.log('✨ Updated Shopify blog title to: "RC Flight Academy & News"');
    } catch (e) {
      console.warn('Could not update blog title (continuing anyway):', e);
    }
  }

  // 2. Fetch existing articles in this blog
  const existingArticlesData = await shopifyRequest(`/blogs/${targetBlog.id}/articles.json?limit=50`);
  const existingArticles: any[] = existingArticlesData.articles || [];
  console.log(`📑 Found ${existingArticles.length} existing articles in Shopify.`);

  console.log(`\n⏳ Uploading/Syncing ${FALLBACK_POSTS.length} masterclass articles to Shopify Admin...\n`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < FALLBACK_POSTS.length; i++) {
    const post = FALLBACK_POSTS[i];
    const existing = existingArticles.find(a => a.handle === post.slug || a.title.toLowerCase() === post.title.toLowerCase());

    const articlePayload: any = {
      title: post.title,
      author: post.author,
      tags: post.tags.join(', '),
      body_html: post.contentHtml,
      summary_html: post.excerpt,
      handle: post.slug,
      published: true,
      published_at: post.publishedAt || new Date().toISOString()
    };

    if (post.image && post.image.startsWith('http')) {
      articlePayload.image = { src: post.image };
    }

    try {
      if (existing) {
        // Update existing article
        console.log(`[${i + 1}/${FALLBACK_POSTS.length}] 🔄 Updating: "${post.title.substring(0, 50)}..."`);
        const updateRes = await shopifyRequest(
          `/blogs/${targetBlog.id}/articles/${existing.id}.json`,
          'PUT',
          { article: { id: existing.id, ...articlePayload } }
        );
        console.log(`    ✅ Updated Article ID: ${updateRes.article.id}`);
        updatedCount++;
      } else {
        // Create new article
        console.log(`[${i + 1}/${FALLBACK_POSTS.length}] ⬆️ Creating: "${post.title.substring(0, 50)}..."`);
        const createRes = await shopifyRequest(
          `/blogs/${targetBlog.id}/articles.json`,
          'POST',
          { article: articlePayload }
        );
        console.log(`    ✅ Created Article ID: ${createRes.article.id} (slug: ${createRes.article.handle})`);
        createdCount++;
      }
    } catch (err: any) {
      console.error(`    ❌ Failed to sync "${post.slug}":`, err.message);
    }

    // Rate-limit safety pause
    await sleep(650);
  }

  console.log('\n========================================');
  console.log(`🎉 SHOPIFY BLOG SYNC COMPLETED SUCCESSFULLY!`);
  console.log(`📦 Newly Created: ${createdCount}`);
  console.log(`🔄 Updated: ${updatedCount}`);
  console.log(`📁 Total in Shopify Admin: ${createdCount + updatedCount}`);
  console.log('========================================\n');
}

syncAllBlogs().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
