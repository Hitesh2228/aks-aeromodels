import type { APIRoute } from 'astro';
import { getStoreCoupons, saveStoreCoupons, type CouponSettings } from '../../../lib/shopifyAdmin';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = await getStoreCoupons();
    return new Response(JSON.stringify({ success: true, settings }), {
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
    if (!body || typeof body.enabled !== 'boolean' || !Array.isArray(body.coupons)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid coupon settings format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanSettings: CouponSettings = {
      enabled: Boolean(body.enabled),
      coupons: body.coupons.map((c: any) => ({
        code: String(c.code || '').trim().toUpperCase(),
        type: c.type === 'percent' ? 'percent' : 'flat',
        value: Number(c.value) || 0,
        minOrder: Number(c.minOrder) || 0,
        description: c.description ? String(c.description).trim() : '',
        isActive: c.isActive !== false
      })).filter((c: any) => Boolean(c.code))
    };

    const res = await saveStoreCoupons(cleanSettings);
    if (!res.success) {
      return new Response(JSON.stringify({ success: false, error: res.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Coupons configuration saved successfully!' }), {
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
