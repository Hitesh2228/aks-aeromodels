import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { RAZORPAY_KEY_SECRET, RAZORPAY_ACCOUNT_NAME } from '../../lib/razorpay';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required Razorpay verification parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return new Response(JSON.stringify({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        merchant: RAZORPAY_ACCOUNT_NAME
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('[Razorpay Signature Mismatch]');
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        error: 'Invalid Razorpay payment signature'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err: any) {
    console.error('[Verify Razorpay Payment Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
