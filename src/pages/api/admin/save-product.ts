import type { APIRoute } from 'astro';
import { createOrUpdateAdminProduct, type AdminProductPayload } from '../../../lib/shopifyAdmin';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: AdminProductPayload = await request.json();

    if (!data || !data.title || data.price === undefined) {
      return new Response(JSON.stringify({ success: false, error: 'Product title and price are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await createOrUpdateAdminProduct(data);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    console.error('[API Admin Save Product Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
