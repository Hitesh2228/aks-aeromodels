import type { APIRoute } from 'astro';
import { createShopifyAdminOrder } from '../../lib/shopifyAdmin';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data || !data.orderId || !data.customer) {
      return new Response(JSON.stringify({ success: false, error: 'Missing order parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await createShopifyAdminOrder(data);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[create-shopify-order API Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
