import type { APIRoute } from 'astro';
import { resetShopifyCustomerPassword } from '../../lib/shopifyAdmin';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const email = data?.email;
    const phone = data?.phone;
    const newPassword = data?.newPassword;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a valid registered email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/[^0-9]/g, '').length < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter your registered 10-digit mobile number.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return new Response(JSON.stringify({ success: false, error: 'New password must be at least 6 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await resetShopifyCustomerPassword(email, phone, newPassword);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[forgot-password API Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

