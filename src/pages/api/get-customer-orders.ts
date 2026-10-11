import type { APIRoute } from 'astro';
import { getCustomerOrdersFromShopify } from '../../lib/shopifyAdmin';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || '';
    const phone = url.searchParams.get('phone') || '';

    if (!email && !phone) {
      return new Response(JSON.stringify({ success: true, orders: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await getCustomerOrdersFromShopify(email, phone);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    console.error('[get-customer-orders API Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Server error', orders: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
