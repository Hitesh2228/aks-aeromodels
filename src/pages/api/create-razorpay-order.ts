import type { APIRoute } from 'astro';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_ACCOUNT_NAME } from '../../lib/razorpay';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const rawAmount = Number(data.amount);
    const amountInPaise = Math.round(rawAmount * 100);

    if (!amountInPaise || amountInPaise <= 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid order amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const cleanReceipt = String(data.receipt || `ord_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 40);

    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: cleanReceipt,
      notes: {
        merchant: RAZORPAY_ACCOUNT_NAME,
        customer_name: String(data.customer?.name || '').substring(0, 50),
        customer_email: String(data.customer?.email || '').substring(0, 50),
        customer_phone: String(data.customer?.phone || '').substring(0, 20),
        isB2B: data.customer?.isB2B ? 'true' : 'false',
        company_name: String(data.customer?.companyName || '').substring(0, 50),
        gstin: String(data.customer?.gstin || '').substring(0, 20),
        payment_method: String(data.paymentMethod || 'upi').substring(0, 20)
      }
    };

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('[Razorpay Order Creation Error]', errJson);
      return new Response(JSON.stringify({
        success: false,
        error: errJson.error?.description || 'Failed to create Razorpay order'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const order = await res.json();

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      accountName: RAZORPAY_ACCOUNT_NAME
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[Create Razorpay Order Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
