import type { APIRoute } from 'astro';
import { createOrUpdateShopifyCustomer } from '../../lib/shopifyAdmin';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data || (!data.email && !data.phone)) {
      return new Response(JSON.stringify({ success: false, error: 'Email or phone required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await createOrUpdateShopifyCustomer(data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[sync-customer API Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
