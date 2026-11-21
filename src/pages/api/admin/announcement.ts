import type { APIRoute } from 'astro';
import { getStoreAnnouncement, saveStoreAnnouncement, type StoreAnnouncement } from '../../../lib/shopifyAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const announcement = await getStoreAnnouncement();
    return new Response(JSON.stringify({ success: true, announcement }), {
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
    if (!body || typeof body.enabled !== 'boolean') {
      return new Response(JSON.stringify({ success: false, error: 'Invalid announcement payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanAnnouncement: StoreAnnouncement = {
      enabled: Boolean(body.enabled),
      highlightText: String(body.highlightText || 'Buzz Offer Ends').trim(),
      text: String(body.text || 'Extra ₹80 OFF on all orders!').trim(),
      endDate: String(body.endDate || new Date(Date.now() + 3 * 86400000).toISOString()).trim()
    };

    const res = await saveStoreAnnouncement(cleanAnnouncement);
    if (!res.success) {
      return new Response(JSON.stringify({ success: false, error: res.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Announcement strip updated successfully!' }), {
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
