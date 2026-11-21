import type { APIRoute } from 'astro';
import { getStoreInquiries, saveStoreInquiry, updateInquiryStatus } from '../../lib/shopifyAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const inquiries = await getStoreInquiries();
    return new Response(JSON.stringify({ success: true, inquiries }), {
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
    if (!body || !body.email) {
      return new Response(JSON.stringify({ success: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const type = body.type === 'newsletter' ? 'newsletter' : 'contact';
    const res = await saveStoreInquiry({
      type,
      name: body.name ? String(body.name).trim() : (type === 'newsletter' ? 'VIP Newsletter Subscriber' : 'Prospective Pilot'),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : '',
      topic: body.topic ? String(body.topic).trim() : (type === 'newsletter' ? 'Exclusive Pilot Newsletter' : 'General Inquiry'),
      message: body.message ? String(body.message).trim() : 'Joined exclusive subscriber list for technical aviation updates and offers.'
    });

    if (!res.success) {
      return new Response(JSON.stringify({ success: false, error: res.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Inquiry registered successfully', 
      inquiry: res.inquiry 
    }), {
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body || !body.id || !body.status) {
      return new Response(JSON.stringify({ success: false, error: 'Missing id or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const res = await updateInquiryStatus(String(body.id), body.status);
    if (!res.success) {
      return new Response(JSON.stringify({ success: false, error: res.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
