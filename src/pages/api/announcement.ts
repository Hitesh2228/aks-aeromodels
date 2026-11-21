import type { APIRoute } from 'astro';
import { getStoreAnnouncement } from '../../lib/shopifyAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const announcement = await getStoreAnnouncement();
    return new Response(JSON.stringify({ success: true, announcement }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
