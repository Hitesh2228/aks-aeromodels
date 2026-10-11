import type { APIRoute } from 'astro';
import { getStoreNavigation, saveStoreNavigation } from '../../../lib/shopifyAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const navigation = await getStoreNavigation();
    return new Response(JSON.stringify({ success: true, navigation }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.items)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid items array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const res = await saveStoreNavigation(body.items);
    if (!res.success) {
      return new Response(JSON.stringify({ success: false, error: res.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Navigation updated successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
