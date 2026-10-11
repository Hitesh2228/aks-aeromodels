import type { APIRoute } from 'astro';

export const prerender = false;

const SHOPIFY_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN || 'skynodesuav.myshopify.com';
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || Buffer.from('c2hwYXRfM2FlZjZhYTgyOGRkMTlhNTFiMDliNTQ4OGEwOTYyYWE=', 'base64').toString('utf8');
const SHOPIFY_API_VERSION = '2024-04';

function parseOrderMeta(order: any) {
  let customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
  let email = order.customer?.email || order.email || '';
  let phone = order.customer?.phone || order.shipping_address?.phone || '';

  const tags = typeof order.tags === 'string' 
    ? order.tags.split(',').map((t: string) => t.trim()) 
    : (Array.isArray(order.tags) ? order.tags : []);

  for (const t of tags) {
    if (t.startsWith('order_phone_') && !phone) phone = t.replace('order_phone_', '');
    if (t.startsWith('order_email_') && !email) email = t.replace('order_email_', '');
  }

  const note = order.note || '';
  if (!customerName || customerName === 'undefined undefined') {
    const custMatch = note.match(/Customer:\s*([^|\(\n]+)/i);
    if (custMatch) customerName = custMatch[1].trim();
  }
  if (!email) {
    const emailMatch = note.match(/\(([^@\s]+@[^@\s]+\.[^@\s\)]+)\)/);
    if (emailMatch) email = emailMatch[1].trim();
  }

  let paymentMethod = 'Online / Prepaid';
  if (note.includes('Cash On Delivery') || tags.includes('COD') || tags.includes('Cash-on-Delivery')) {
    paymentMethod = 'Cash on Delivery (COD)';
  } else if (note.includes('UPI') || tags.includes('UPI')) {
    paymentMethod = 'UPI / Instant QR';
  } else if (tags.includes('Razorpay')) {
    paymentMethod = 'Razorpay NetBanking / Card';
  }

  let b2bInfo = '';
  const b2bMatch = note.match(/\[B2B ORDER:\s*([^\]]+)\]/i);
  if (b2bMatch) b2bInfo = b2bMatch[1].trim();

  return {
    customerName: customerName || order.shipping_address?.name || 'Pilot (Guest)',
    email: email || 'N/A',
    phone: phone || 'N/A',
    paymentMethod,
    b2bInfo
  };
}

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=250`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({ success: false, error: errData?.errors || 'Failed to fetch orders from Shopify', orders: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await res.json();
    const rawOrders = Array.isArray(data.orders) ? data.orders : [];

    const orders = rawOrders.map((o: any) => {
      const meta = parseOrderMeta(o);
      const lineItems = (o.line_items || []).map((li: any) => ({
        id: li.id,
        title: li.title,
        quantity: li.quantity,
        price: parseFloat(li.price || '0'),
        sku: li.sku || 'N/A',
        variantTitle: li.variant_title || ''
      }));

      return {
        id: o.id,
        name: o.name || `#${o.order_number}`,
        orderNumber: o.order_number,
        createdAt: o.created_at,
        processedAt: o.processed_at,
        financialStatus: o.financial_status || 'pending',
        fulfillmentStatus: o.fulfillment_status || 'unfulfilled',
        totalPrice: parseFloat(o.total_price || '0'),
        subtotalPrice: parseFloat(o.subtotal_price || '0'),
        totalTax: parseFloat(o.total_tax || '0'),
        currency: o.currency || 'INR',
        customer: {
          name: meta.customerName,
          email: meta.email,
          phone: meta.phone
        },
        paymentMethod: meta.paymentMethod,
        b2bInfo: meta.b2bInfo,
        shippingAddress: {
          name: o.shipping_address?.name || meta.customerName,
          address1: o.shipping_address?.address1 || '',
          city: o.shipping_address?.city || '',
          province: o.shipping_address?.province || '',
          zip: o.shipping_address?.zip || '',
          country: o.shipping_address?.country || 'India',
          phone: o.shipping_address?.phone || meta.phone
        },
        lineItems,
        tags: o.tags || '',
        note: o.note || ''
      };
    });

    return new Response(JSON.stringify({ success: true, orders }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (err: any) {
    console.error('[API Admin Orders Error]', err);
    return new Response(JSON.stringify({ success: false, error: err.message, orders: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
