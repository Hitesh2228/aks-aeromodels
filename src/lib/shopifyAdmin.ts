// Shopify Admin API Library
export const SHOPIFY_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN || 'skynodesuav.myshopify.com';
export const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || Buffer.from('c2hwYXRfM2FlZjZhYTgyOGRkMTlhNTFiMDliNTQ4OGEwOTYyYWE=', 'base64').toString('utf8');
export const SHOPIFY_API_VERSION = '2024-04';

export interface CreateOrderPayload {
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isB2B?: boolean;
    companyName?: string;
    gstin?: string;
  };
  items: Array<{
    product: {
      id?: string;
      name: string;
      price: number;
      variantId?: string;
      sku?: string;
      hsnCode?: string;
      categoryLabel?: string;
    };
    quantity: number;
  }>;
  total: number;
  subtotal: number;
  gst?: number;
  appliedDiscountAmount?: number;
  paymentMethod: string;
  paymentId?: string;
  razorpayOrderId?: string;
  merchant?: string;
  isPaid?: boolean;
}

export async function createShopifyAdminOrder(data: CreateOrderPayload) {
  try {
    const isPaid = data.isPaid ?? (data.paymentMethod && !data.paymentMethod.includes('COD'));
    const cleanOrderId = data.orderId || `#SKY-${Date.now()}`;
    
    // Split customer name
    const nameParts = (data.customer.name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Valued';
    const lastName = nameParts.slice(1).join(' ') || 'Pilot';

    // Format Line Items
    const lineItems = (data.items || []).map(item => {
      const p = item.product || ({} as any);
      let variantIdNum: number | undefined = undefined;
      if (p.variantId) {
        const cleaned = String(p.variantId).replace(/[^0-9]/g, '');
        if (cleaned) variantIdNum = parseInt(cleaned, 10);
      }

      const itemObj: any = {
        title: p.name || 'SKYNODES UAV Item',
        price: (p.price || 0).toString(),
        quantity: item.quantity || 1
      };

      if (variantIdNum && !isNaN(variantIdNum)) {
        itemObj.variant_id = variantIdNum;
      }
      if (p.sku) {
        itemObj.sku = p.sku;
      }

      return itemObj;
    });

    const isB2B = data.customer.isB2B || !!data.customer.gstin;
    const b2bNote = isB2B ? ` [B2B ORDER: Company: ${data.customer.companyName || 'N/A'}, GSTIN: ${data.customer.gstin || 'N/A'}]` : '';
    const paymentNote = data.paymentId 
      ? `Razorpay Payment ID: ${data.paymentId} | Beneficiary: ${data.merchant || 'WAY POINT'}` 
      : 'Cash On Delivery (Payment Pending upon Delivery)';

    const orderPayload: any = {
      order: {
        name: cleanOrderId,
        email: data.customer.email && data.customer.email.includes('@') ? data.customer.email : 'orders@skynodesuav.in',
        phone: data.customer.phone ? String(data.customer.phone).replace(/[^0-9+]/g, '') : undefined,
        currency: 'INR',
        financial_status: isPaid ? 'paid' : 'pending',
        payment_gateway_names: [isPaid ? 'Razorpay (Way Point)' : 'Cash on Delivery (COD)'],
        tags: (isPaid ? [
          'Paid',
          'Online',
          data.paymentMethod?.includes('UPI') ? 'UPI' : (data.paymentMethod?.includes('CARD') ? 'Card' : 'NetBanking'),
          'Razorpay',
          'Way-Point',
          isB2B ? 'B2B-Tax-Invoice' : 'B2C'
        ] : [
          'COD',
          'COD-Pending',
          'Cash-on-Delivery',
          isB2B ? 'B2B-Tax-Invoice' : 'B2C'
        ]).join(', '),
        note: `Order: ${cleanOrderId} | ${paymentNote}${b2bNote}`,
        line_items: lineItems.length > 0 ? lineItems : [{ title: 'SKYNODES UAV Gear', price: data.total.toString(), quantity: 1 }],
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: data.customer.email && data.customer.email.includes('@') ? data.customer.email : undefined,
          phone: data.customer.phone || undefined
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address1: data.customer.address || 'Standard Delivery',
          city: data.customer.city || 'Nashik',
          province: data.customer.state || 'Maharashtra',
          country: 'India',
          zip: data.customer.pincode || '422502',
          phone: data.customer.phone || undefined
        },
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1: data.customer.address || 'Standard Delivery',
          city: data.customer.city || 'Nashik',
          province: data.customer.state || 'Maharashtra',
          country: 'India',
          zip: data.customer.pincode || '422502',
          phone: data.customer.phone || undefined
        }
      }
    };

    if (isPaid && data.paymentId) {
      orderPayload.order.transactions = [
        {
          kind: 'sale',
          status: 'success',
          amount: data.total.toString(),
          currency: 'INR',
          gateway: 'Razorpay (Way Point)',
          authorization: data.paymentId
        }
      ];
    }

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify(orderPayload)
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[Shopify Admin Order Error]', resData);
      return { success: false, error: resData?.errors || 'Failed to create Shopify order' };
    }

    return {
      success: true,
      orderId: resData.order?.id,
      orderName: resData.order?.name,
      financialStatus: resData.order?.financial_status
    };
  } catch (err: any) {
    console.error('[createShopifyAdminOrder Exception]', err);
    return { success: false, error: err.message };
  }
}
