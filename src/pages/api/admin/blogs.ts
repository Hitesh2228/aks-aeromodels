import type { APIRoute } from 'astro';

export const prerender = false;

const SHOPIFY_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN || 'skynodesuav.myshopify.com';
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || Buffer.from('c2hwYXRfM2FlZjZhYTgyOGRkMTlhNTFiMDliNTQ4OGEwOTYyYWE=', 'base64').toString('utf8');
const SHOPIFY_API_VERSION = '2024-04';

async function getPrimaryBlogId(): Promise<string> {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/blogs.json`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.blogs) && data.blogs.length > 0) {
        return String(data.blogs[0].id);
      }
    }
  } catch (e) {
    console.warn('[getPrimaryBlogId error]', e);
  }
  return '125699424532';
}

export const GET: APIRoute = async () => {
  try {
    const blogId = await getPrimaryBlogId();
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/blogs/${blogId}/articles.json?limit=100`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({ success: false, error: err?.errors || 'Failed to fetch articles', articles: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await res.json();
    const rawArticles = Array.isArray(data.articles) ? data.articles : [];

    const articles = rawArticles.map((a: any) => ({
      id: a.id,
      blogId: a.blog_id || blogId,
      title: a.title,
      handle: a.handle,
      author: a.author || 'SKYNODES UAV Technical Flight Team',
      tags: a.tags || '',
      summary: a.summary_html || '',
      bodyHtml: a.body_html || '',
      image: a.image?.src || 'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/sea-1-1.jpg?v=1791020060',
      publishedAt: a.published_at,
      createdAt: a.created_at,
      isPublished: !!a.published_at
    }));

    return new Response(JSON.stringify({ success: true, blogId, articles }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (err: any) {
    console.error('[API Admin Blogs GET Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message, articles: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    if (!payload.title || !payload.title.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Article title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const defaultBlogId = await getPrimaryBlogId();
    const blogId = payload.blogId || defaultBlogId;
    const isEdit = !!payload.id;

    const articleData: any = {
      title: payload.title.trim(),
      author: payload.author?.trim() || 'SKYNODES UAV Technical Flight Team',
      tags: payload.tags?.trim() || 'Flight Journal, Technical Guide',
      body_html: payload.bodyHtml?.trim() || '<p>Article content pending.</p>',
      summary_html: payload.summary?.trim() || '',
      published: payload.published !== false
    };

    if (payload.image && payload.image.trim()) {
      articleData.image = { src: payload.image.trim() };
    }

    let url = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/blogs/${blogId}/articles.json`;
    let method = 'POST';

    if (isEdit) {
      url = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/blogs/${blogId}/articles/${payload.id}.json`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify({ article: articleData })
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[Shopify Article Save Error]', resData);
      return new Response(JSON.stringify({ success: false, error: resData?.errors || 'Failed to save article in Shopify' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      article: resData.article,
      message: isEdit ? 'Article updated successfully in Shopify!' : 'New article published successfully in Shopify!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[API Admin Blogs POST Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const blogId = url.searchParams.get('blogId') || await getPrimaryBlogId();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Article ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/blogs/${blogId}/articles/${id}.json`, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({ success: false, error: err?.errors || 'Failed to delete article' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Article deleted successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[API Admin Blogs DELETE Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
