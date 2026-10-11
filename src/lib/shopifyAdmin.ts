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

    const cleanEmail = (data.customer.email || '').trim().toLowerCase();
    const cleanDigits = (data.customer.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const cleanPhone = cleanDigits ? `+91${cleanDigits}` : undefined;

    const tagsArr = isPaid ? [
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
    ];
    if (cleanEmail) tagsArr.push(`order_email_${cleanEmail}`);
    if (cleanDigits) tagsArr.push(`order_phone_${cleanDigits}`);

    const noteAttrs: Array<{ name: string; value: string }> = [
      { name: 'CustomerEmail', value: cleanEmail },
      { name: 'CustomerPhone', value: cleanDigits },
      { name: 'CustomerName', value: data.customer.name || 'Valued Pilot' },
      { name: 'PaymentMethod', value: data.paymentMethod || (isPaid ? 'PAID (ONLINE)' : 'CASH ON DELIVERY (COD)') }
    ];
    if (isB2B) {
      if (data.customer.companyName) noteAttrs.push({ name: 'CompanyName', value: data.customer.companyName });
      if (data.customer.gstin) noteAttrs.push({ name: 'GSTIN', value: data.customer.gstin });
    }

    const orderPayload: any = {
      order: {
        name: cleanOrderId,
        email: cleanEmail && cleanEmail.includes('@') ? cleanEmail : 'orders@skynodesuav.in',
        phone: cleanPhone || undefined,
        currency: 'INR',
        financial_status: isPaid ? 'paid' : 'pending',
        payment_gateway_names: [isPaid ? 'Razorpay (Way Point)' : 'Cash on Delivery (COD)'],
        tags: tagsArr.join(', '),
        note_attributes: noteAttrs,
        note: `Order: ${cleanOrderId} | Customer: ${data.customer.name || 'Valued Pilot'} (${cleanEmail || cleanDigits}) | ${paymentNote}${b2bNote}`,
        line_items: lineItems.length > 0 ? lineItems : [{ title: 'SKYNODES UAV Gear', price: data.total.toString(), quantity: 1 }],
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: cleanEmail && cleanEmail.includes('@') ? cleanEmail : undefined,
          phone: cleanPhone || undefined
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address1: data.customer.address || 'Standard Delivery',
          city: data.customer.city || 'Nashik',
          province: data.customer.state || 'Maharashtra',
          country: 'India',
          zip: data.customer.pincode || '422502',
          phone: cleanPhone || undefined
        },
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1: data.customer.address || 'Standard Delivery',
          city: data.customer.city || 'Nashik',
          province: data.customer.state || 'Maharashtra',
          country: 'India',
          zip: data.customer.pincode || '422502',
          phone: cleanPhone || undefined
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

export async function getCustomerOrdersFromShopify(email?: string, phone?: string) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanDigits = (phone || '').replace(/[^0-9]/g, '').slice(-10);

    if (!cleanEmail && (!cleanDigits || cleanDigits.length < 10)) {
      return { success: true, orders: [] };
    }

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=250`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(resData.orders)) {
      console.error('[getCustomerOrdersFromShopify Error]', resData);
      return { success: false, error: 'Failed to fetch orders from Shopify', orders: [] };
    }

    const matchedOrders = resData.orders.filter((order: any) => {
      // 1. Match by Email
      if (cleanEmail && cleanEmail.includes('@')) {
        if (order.email && order.email.toLowerCase() === cleanEmail) return true;
        if (order.customer?.email && order.customer.email.toLowerCase() === cleanEmail) return true;
        if (order.contact_email && order.contact_email.toLowerCase() === cleanEmail) return true;
        if (order.tags && order.tags.toLowerCase().includes(`order_email_${cleanEmail}`)) return true;
        if (order.tags && order.tags.toLowerCase().includes(`pilot_email_${cleanEmail}`)) return true;
        if (order.note && order.note.toLowerCase().includes(cleanEmail)) return true;
        if (order.note_attributes && order.note_attributes.some((a: any) => a.name === 'CustomerEmail' && a.value && a.value.toLowerCase() === cleanEmail)) return true;
      }

      // 2. Match by Phone Digits
      if (cleanDigits && cleanDigits.length >= 10) {
        if (order.phone && order.phone.replace(/[^0-9]/g, '').endsWith(cleanDigits)) return true;
        if (order.customer?.phone && order.customer.phone.replace(/[^0-9]/g, '').endsWith(cleanDigits)) return true;
        if (order.shipping_address?.phone && order.shipping_address.phone.replace(/[^0-9]/g, '').endsWith(cleanDigits)) return true;
        if (order.tags && (order.tags.includes(`order_phone_${cleanDigits}`) || order.tags.includes(`pilot_phone_${cleanDigits}`))) return true;
        if (order.note && order.note.includes(cleanDigits)) return true;
        if (order.note_attributes && order.note_attributes.some((a: any) => a.name === 'CustomerPhone' && a.value && a.value.endsWith(cleanDigits))) return true;
      }

      return false;
    });

    const formattedOrders = matchedOrders.map((order: any) => {
      const attrMap: Record<string, string> = {};
      (order.note_attributes || []).forEach((a: any) => {
        if (a.name && a.value) attrMap[a.name] = a.value;
      });

      const rawDate = new Date(order.created_at);
      const formattedDate = isNaN(rawDate.getTime()) 
        ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : rawDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      const isPaid = order.financial_status === 'paid';
      const total = Math.round(parseFloat(order.total_price || '0'));
      const subtotal = Math.round(parseFloat(order.subtotal_price || order.total_price || '0'));
      const totalTax = Math.round(parseFloat(order.total_tax || '0'));

      const shipping = order.shipping_address || order.billing_address || {};
      const customerObj = order.customer || {};

      const name = [customerObj.first_name || shipping.first_name || '', customerObj.last_name || shipping.last_name || ''].join(' ').trim() || attrMap['CustomerName'] || 'Valued Pilot';
      const orderEmail = order.email || customerObj.email || attrMap['CustomerEmail'] || cleanEmail;
      const orderPhone = order.phone || customerObj.phone || shipping.phone || attrMap['CustomerPhone'] || cleanDigits;
      const address = [shipping.address1, shipping.address2].filter(Boolean).join(', ') || 'Standard Delivery';
      const city = shipping.city || 'Nashik';
      const state = shipping.province || 'Maharashtra';
      const pincode = shipping.zip || '422502';

      const cleanZip = String(pincode || '').replace(/\D/g, '');
      const p2 = parseInt(cleanZip.substring(0, 2), 10);
      const isMhZip = cleanZip.length >= 2 && p2 >= 40 && p2 <= 44 && !cleanZip.startsWith('403');
      const isMhState = state && state.toLowerCase().includes('maharashtra');
      const isMH = isMhZip || isMhState || (attrMap['GSTIN'] ? attrMap['GSTIN'].startsWith('27') : false);
      const isInterState = !isMH;
      const finalState = isMH ? 'Maharashtra' : state;

      const items = (order.line_items || []).map((li: any) => ({
        quantity: li.quantity || 1,
        product: {
          name: li.title || 'SKYNODES UAV Equipment',
          price: Math.round(parseFloat(li.price || '0')),
          sku: li.sku || '',
          hsnCode: li.sku ? (li.sku.match(/\b\d{4,8}\b/) ? li.sku : '9503') : '9503',
          categoryLabel: 'Aeromodelling Gear',
          gstRate: 18
        }
      }));

      const awb = order.fulfillments?.[0]?.tracking_number || (order.name ? `#AWB-${order.name.replace(/[^0-9]/g, '')}` : '#AWB-TRACKING');
      const paymentMethod = attrMap['PaymentMethod'] || (isPaid ? 'PAID (ONLINE)' : 'CASH ON DELIVERY (COD)');

      return {
        orderId: order.name || `#SKY-INV-${order.id}`,
        shopifyId: order.id,
        date: formattedDate,
        createdAt: order.created_at,
        paymentMethod,
        status: order.fulfillment_status === 'fulfilled' ? 'DELIVERED' : (isPaid ? 'PAID & CONFIRMED' : 'PENDING (COD UPON DELIVERY)'),
        merchant: 'WAY POINT',
        isPaid,
        awb,
        customer: {
          name,
          email: orderEmail,
          phone: orderPhone,
          address,
          city,
          state: finalState,
          pincode,
          isB2B: (order.tags && order.tags.includes('B2B')) || !!attrMap['GSTIN'],
          companyName: attrMap['CompanyName'] || '',
          gstin: attrMap['GSTIN'] || ''
        },
        isInterState,
        supplyType: isInterState ? 'Inter-State (IGST 18%)' : 'Intra-State (CGST 9% + SGST 9%)',
        items: items.length > 0 ? items : [{ quantity: 1, product: { name: 'Aeromodelling Equipment', price: total, gstRate: 18, hsnCode: '9503' } }],
        subtotal,
        gst: totalTax,
        total
      };
    });

    return { success: true, orders: formattedOrders };
  } catch (err: any) {
    console.error('[getCustomerOrdersFromShopify Exception]', err);
    return { success: false, error: err.message, orders: [] };
  }
}

export async function createOrUpdateShopifyCustomer(customerData: {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  note?: string;
}) {
  try {
    const rawName = (customerData.name || 'Pilot').trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0] || 'Valued';
    const lastName = nameParts.slice(1).join(' ') || 'Pilot';

    const cleanEmail = customerData.email && customerData.email.includes('@') ? customerData.email.trim().toLowerCase() : undefined;
    const cleanPhone = customerData.phone ? customerData.phone.replace(/[^0-9+]/g, '') : undefined;
    const cleanDigits = customerData.phone ? customerData.phone.replace(/[^0-9]/g, '').slice(-10) : undefined;

    if (!cleanEmail && !cleanPhone) {
      return { success: false, error: 'Email or phone required' };
    }

    // Build searchable tags
    const tagsList = ['Pilot Portal', 'Registered User', 'Website Member'];
    if (cleanEmail) tagsList.push(`pilot_email_${cleanEmail}`);
    if (cleanDigits) tagsList.push(`pilot_phone_${cleanDigits}`);

    const payload: any = {
      customer: {
        first_name: firstName,
        last_name: lastName,
        tags: tagsList.join(', '),
        note: customerData.note || 'Registered via SKYNODES UAV Pilot Portal'
      }
    };

    if (cleanEmail) payload.customer.email = cleanEmail;
    if (cleanPhone && cleanPhone.length >= 10) payload.customer.phone = cleanPhone;

    // Attach password if provided
    if (customerData.password && customerData.password.length >= 6) {
      payload.customer.password = customerData.password;
      payload.customer.password_confirmation = customerData.password;
      payload.customer.send_email_welcome = false;
    }

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Customer may already exist (HTTP 422: Email has already been taken)
      if (res.status === 422) {
        // If password provided, update their password and tags on existing customer
        if (cleanEmail && customerData.password) {
          try {
            const listRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=250`, {
              headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN }
            });
            const listData = await listRes.json().catch(() => ({}));
            const existingCust = (listData.customers || []).find((c: any) => 
              c.tags?.includes(`pilot_email_${cleanEmail}`) || (cleanDigits && c.tags?.includes(`pilot_phone_${cleanDigits}`))
            );
            if (existingCust && existingCust.id) {
              await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/${existingCust.id}.json`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
                },
                body: JSON.stringify({
                  customer: {
                    id: existingCust.id,
                    password: customerData.password,
                    password_confirmation: customerData.password,
                    tags: tagsList.join(', ')
                  }
                })
              });
            }
          } catch (updateErr) {}
        }
        return { success: true, alreadyExists: true, message: 'Customer already exists in Shopify' };
      }
      return { success: false, error: resData?.errors };
    }

    return {
      success: true,
      customerId: resData.customer?.id,
      customer: resData.customer
    };
  } catch (err: any) {
    console.error('[createOrUpdateShopifyCustomer Exception]', err);
    return { success: false, error: err.message };
  }
}

export async function resetShopifyCustomerPassword(email: string, phone: string, newPassword: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanDigits = phone.replace(/[^0-9]/g, '').slice(-10);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required' };
    }
    if (!cleanDigits || cleanDigits.length < 10) {
      return { success: false, error: 'A valid 10-digit mobile number is required' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    // Retrieve customers from Shopify Admin
    const listRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=250`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    const listData = await listRes.json().catch(() => ({}));
    const customers = listData.customers || [];

    // Match customer by email tag AND/OR phone tag
    let matchedCustomer = customers.find((c: any) => {
      const tags = c.tags || '';
      return tags.includes(`pilot_email_${cleanEmail}`) && tags.includes(`pilot_phone_${cleanDigits}`);
    });

    // Fallback: match by email tag
    if (!matchedCustomer) {
      matchedCustomer = customers.find((c: any) => {
        const tags = c.tags || '';
        return tags.includes(`pilot_email_${cleanEmail}`);
      });
    }

    // Fallback 2: match by phone tag
    if (!matchedCustomer) {
      matchedCustomer = customers.find((c: any) => {
        const tags = c.tags || '';
        return tags.includes(`pilot_phone_${cleanDigits}`);
      });
    }

    if (matchedCustomer && matchedCustomer.id) {
      // Update password directly via Shopify Admin PUT API
      const updateRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/${matchedCustomer.id}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
        },
        body: JSON.stringify({
          customer: {
            id: matchedCustomer.id,
            password: newPassword,
            password_confirmation: newPassword,
            tags: `Pilot Portal, Registered User, Website Member, pilot_email_${cleanEmail}, pilot_phone_${cleanDigits}`
          }
        })
      });

      const updateData = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) {
        console.warn('[Shopify Password Update warning]', updateData);
      }

      return {
        success: true,
        customerId: matchedCustomer.id,
        email: cleanEmail,
        message: 'Password reset successfully!'
      };
    }

    // If customer record not found yet in Shopify, create it so they are registered
    const createResult = await createOrUpdateShopifyCustomer({
      email: cleanEmail,
      phone: `+91 ${cleanDigits}`,
      password: newPassword,
      name: cleanEmail.split('@')[0]
    });

    return {
      success: true,
      customerId: createResult.customerId,
      email: cleanEmail,
      message: 'Password reset successfully and account synchronized!'
    };
  } catch (err: any) {
    console.error('[resetShopifyCustomerPassword Exception]', err);
    return { success: false, error: err.message };
  }
}

export interface AdminProductPayload {
  id?: string | number;
  title: string;
  category: string;
  subCategory?: string;
  vendor?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stock?: number;
  hsnCode?: string;
  gstRate?: number;
  description: string;
  images: string[];
  discountBadge?: string;
  isBestseller?: boolean;
  isCrazyDeal?: boolean;
  isNewArrival?: boolean;
  isHero?: boolean;
  heroOrder?: number;
  trustBadges?: string[];
  notesInSet?: Array<{ name: string; desc: string }>;
  whereToFly?: string[];
  vibesText?: string;
  specs?: Record<string, string>;
  youtubeVideoId?: string;
  faqList?: Array<{ q: string; a: string }>;
  materialText?: string;
  howToUseText?: string;
  comboId?: string;
  warrantyPeriod?: string;
}

export function buildProductTags(data: AdminProductPayload): string {
  const tags: string[] = [];

  // Helper to ensure tag values do NOT contain commas (which Shopify breaks into separate tags)
  const sanitizeTag = (val: string) => val.replace(/,/g, ';').trim();

  if (data.category) {
    tags.push(sanitizeTag(data.category));
    tags.push(`cat:${sanitizeTag(data.category)}`);
  }
  if (data.subCategory) {
    tags.push(sanitizeTag(data.subCategory));
    tags.push(`sub:${sanitizeTag(data.subCategory)}`);
  }
  if (data.isBestseller) tags.push('bestseller');
  if (data.isCrazyDeal) tags.push('crazy-deal');
  if (data.isNewArrival) tags.push('new-arrival');
  if (data.isHero) {
    tags.push(data.heroOrder ? `hero:${data.heroOrder}` : 'hero');
  }

  if (data.stock !== undefined) tags.push(`stock:${data.stock}`);
  if (data.discountBadge) tags.push(`badge:${sanitizeTag(data.discountBadge)}`);
  if (data.hsnCode) tags.push(`HSN:${sanitizeTag(data.hsnCode)}`);
  if (data.gstRate !== undefined) tags.push(`GST:${data.gstRate}%`);
  if (data.warrantyPeriod) tags.push(`warranty:${sanitizeTag(data.warrantyPeriod)}`);

  if (data.trustBadges && data.trustBadges.length > 0) {
    const valid = data.trustBadges.map(b => sanitizeTag(b)).filter(Boolean);
    if (valid.length > 0) tags.push(`trust:${valid.join(' | ')}`);
  }

  if (data.notesInSet && data.notesInSet.length > 0) {
    const valid = data.notesInSet.filter(n => n.name && n.name.trim()).map(n => `${sanitizeTag(n.name)} - ${sanitizeTag(n.desc || '')}`);
    if (valid.length > 0) tags.push(`notes:${valid.join(' | ')}`);
  }

  if (data.whereToFly && data.whereToFly.length > 0) {
    const valid = data.whereToFly.map(f => sanitizeTag(f)).filter(Boolean);
    if (valid.length > 0) tags.push(`fly:${valid.join(' | ')}`);
  }

  if (data.vibesText) tags.push(`vibes:${sanitizeTag(data.vibesText)}`);
  if (data.youtubeVideoId) tags.push(`yt:${sanitizeTag(data.youtubeVideoId)}`);

  if (data.faqList && data.faqList.length > 0) {
    const valid = data.faqList.filter(f => f.q && f.a).map(f => `Q: ${sanitizeTag(f.q)} A: ${sanitizeTag(f.a)}`);
    if (valid.length > 0) tags.push(`faq:${valid.join(' | ')}`);
  }

  if (data.materialText) tags.push(`material:${sanitizeTag(data.materialText)}`);
  if (data.howToUseText) tags.push(`howtouse:${sanitizeTag(data.howToUseText)}`);
  if (data.comboId) tags.push(`combo:${sanitizeTag(data.comboId)}`);

  if (data.specs) {
    for (const [k, v] of Object.entries(data.specs)) {
      if (k && v) {
        tags.push(`spec:${sanitizeTag(k)}=${sanitizeTag(String(v))}`);
      }
    }
  }

  return tags.join(', ');
}

export function parseProductTags(rawTags: string | string[]): {
  category: string;
  isBestseller: boolean;
  isCrazyDeal: boolean;
  isNewArrival: boolean;
  isHero: boolean;
  heroOrder: number;
  discountBadge: string;
  hsnCode: string;
  gstRate: number;
  stock?: number;
  warrantyPeriod: string;
  trustBadges: string[];
  notesInSet: Array<{ name: string; desc: string }>;
  whereToFly: string[];
  vibesText: string;
  youtubeVideoId: string;
  faqList: Array<{ q: string; a: string }>;
  materialText: string;
  howToUseText: string;
  comboId: string;
  subCategory?: string;
  specs: Record<string, string>;
} {
  const tagsList = Array.isArray(rawTags) 
    ? rawTags 
    : String(rawTags || '').split(',').map(t => t.trim()).filter(Boolean);

  let category = 'engine';
  let isBestseller = false;
  let isCrazyDeal = false;
  let isNewArrival = false;
  let isHero = false;
  let heroOrder = 1;
  let discountBadge = '';
  let hsnCode = '95030020';
  let gstRate = 18;
  let parsedStock: number | undefined = undefined;
  let warrantyPeriod = '1-Year Official Warranty';
  let trustBadges: string[] = [];
  let notesInSet: Array<{ name: string; desc: string }> = [];
  let whereToFly: string[] = [];
  let vibesText = '';
  let youtubeVideoId = '';
  let faqList: Array<{ q: string; a: string }> = [];
  let materialText = '';
  let howToUseText = '';
  let comboId = '';
  let subCategory = '';
  const specs: Record<string, string> = {};

  for (const t of tagsList) {
    const lower = t.toLowerCase().trim();
    if (lower === 'engine' || lower === 'aeromodels' || lower === 'radio-receiver' || lower === 'balsa-wood' || lower === 'accessories') {
      category = lower;
    } else if (lower.startsWith('cat:') || lower.startsWith('category:')) {
      category = lower.split(':')[1].trim();
    } else if (lower.startsWith('sub:') || lower.startsWith('subcategory:')) {
      subCategory = t.substring(t.indexOf(':') + 1).trim();
    } else if (lower === 'bestseller') {
      isBestseller = true;
    } else if (lower === 'crazy-deal') {
      isCrazyDeal = true;
    } else if (lower === 'new-arrival') {
      isNewArrival = true;
    } else if (lower === 'hero' || lower.startsWith('hero:')) {
      isHero = true;
      if (lower.startsWith('hero:')) heroOrder = parseInt(lower.split(':')[1] || '1', 10) || 1;
    } else if (lower.startsWith('stock:')) {
      const sVal = parseInt(lower.split(':')[1] || '0', 10);
      if (!isNaN(sVal)) parsedStock = sVal;
    } else if (lower.startsWith('badge:')) {
      discountBadge = t.substring(6).trim();
    } else if (lower.startsWith('hsn:')) {
      hsnCode = t.substring(4).trim();
    } else if (lower.startsWith('gst:')) {
      gstRate = parseInt(t.substring(4).replace(/[^0-9]/g, '') || '18', 10);
    } else if (lower.startsWith('warranty:')) {
      warrantyPeriod = t.substring(9).trim();
    } else if (lower.startsWith('trust:')) {
      trustBadges = t.substring(6).split(/[|/]/).map(b => b.trim()).filter(Boolean);
    } else if (lower.startsWith('notes:')) {
      notesInSet = t.substring(6).split('|').map(s => {
        const hyphenIdx = s.indexOf(' - ');
        if (hyphenIdx !== -1) {
          return { name: s.substring(0, hyphenIdx).trim(), desc: s.substring(hyphenIdx + 3).trim() };
        }
        const colonIdx = s.indexOf(':');
        if (colonIdx !== -1) {
          return { name: s.substring(0, colonIdx).trim(), desc: s.substring(colonIdx + 1).trim() };
        }
        return { name: s.trim(), desc: '' };
      }).filter(n => n.name);
    } else if (lower.startsWith('fly:')) {
      whereToFly = t.substring(4).split(/[|/]/).map(f => f.trim()).filter(Boolean);
    } else if (lower.startsWith('vibes:')) {
      vibesText = t.substring(6).trim();
    } else if (lower.startsWith('yt:')) {
      youtubeVideoId = t.substring(3).trim();
    } else if (lower.startsWith('video:')) {
      youtubeVideoId = t.substring(6).trim();
    } else if (lower.startsWith('material:')) {
      materialText = t.substring(9).trim();
    } else if (lower.startsWith('howtouse:') || lower.startsWith('use:')) {
      howToUseText = t.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('combo:')) {
      comboId = t.substring(6).trim();
    } else if (lower.startsWith('faq:')) {
      const parts = t.substring(4).split('|');
      faqList = parts.map(p => {
        const m = p.match(/Q:\s*(.*?)\s*A:\s*(.*)/i);
        if (m) return { q: m[1].trim(), a: m[2].trim() };
        return { q: 'FAQ', a: p.trim() };
      }).filter(f => f.q && f.a);
    } else if (lower.startsWith('spec:')) {
      const rest = t.substring(5).trim();
      const eqIdx = rest.indexOf('=') !== -1 ? rest.indexOf('=') : rest.indexOf(':');
      if (eqIdx !== -1) {
        const k = rest.substring(0, eqIdx).trim();
        const v = rest.substring(eqIdx + 1).trim();
        if (k && v) specs[k] = v;
      }
    }
  }

  return {
    category,
    isBestseller,
    isCrazyDeal,
    isNewArrival,
    isHero,
    heroOrder,
    discountBadge,
    hsnCode,
    gstRate,
    stock: parsedStock,
    warrantyPeriod,
    trustBadges: trustBadges.length > 0 ? trustBadges : ['Imported Quality', '100% Genuine', 'AMA Certified', 'Assured Delivery'],
    notesInSet,
    whereToFly,
    vibesText,
    youtubeVideoId,
    faqList,
    materialText,
    howToUseText,
    comboId,
    subCategory,
    specs
  };
}

export function parseProductDetails(bodyHtml: string = '', rawTags: string | string[] = ''): {
  category: string;
  subCategory?: string;
  isBestseller: boolean;
  isCrazyDeal: boolean;
  isNewArrival: boolean;
  isHero: boolean;
  heroOrder: number;
  discountBadge: string;
  hsnCode: string;
  gstRate: number;
  stock: number;
  warrantyPeriod: string;
  trustBadges: string[];
  notesInSet: Array<{ name: string; desc: string }>;
  whereToFly: string[];
  vibesText: string;
  youtubeVideoId: string;
  faqList: Array<{ q: string; a: string }>;
  materialText: string;
  howToUseText: string;
  comboId: string;
  specs: Record<string, string>;
} {
  const fallback = parseProductTags(rawTags);

  if (bodyHtml) {
    const match = bodyHtml.match(/<!-- SKYNODES_METADATA: ([\s\S]*?) -->/);
    if (match && match[1]) {
      try {
        const m = JSON.parse(match[1]);
        return {
          category: m.category || fallback.category,
          subCategory: m.subCategory || fallback.subCategory || '',
          isBestseller: m.isBestseller !== undefined ? !!m.isBestseller : fallback.isBestseller,
          isCrazyDeal: m.isCrazyDeal !== undefined ? !!m.isCrazyDeal : fallback.isCrazyDeal,
          isNewArrival: m.isNewArrival !== undefined ? !!m.isNewArrival : fallback.isNewArrival,
          isHero: m.isHero !== undefined ? !!m.isHero : fallback.isHero,
          heroOrder: m.heroOrder || fallback.heroOrder,
          discountBadge: m.discountBadge !== undefined ? m.discountBadge : fallback.discountBadge,
          hsnCode: m.hsnCode || fallback.hsnCode,
          gstRate: m.gstRate !== undefined ? m.gstRate : fallback.gstRate,
          stock: m.stock !== undefined ? m.stock : (fallback.stock !== undefined ? fallback.stock : 0),
          warrantyPeriod: m.warrantyPeriod || fallback.warrantyPeriod,
          trustBadges: Array.isArray(m.trustBadges) && m.trustBadges.length > 0 ? m.trustBadges : fallback.trustBadges,
          notesInSet: Array.isArray(m.notesInSet) && m.notesInSet.length > 0 ? m.notesInSet : fallback.notesInSet,
          whereToFly: Array.isArray(m.whereToFly) && m.whereToFly.length > 0 ? m.whereToFly : fallback.whereToFly,
          vibesText: m.vibesText !== undefined ? m.vibesText : fallback.vibesText,
          youtubeVideoId: m.youtubeVideoId !== undefined ? m.youtubeVideoId : fallback.youtubeVideoId,
          faqList: Array.isArray(m.faqList) && m.faqList.length > 0 ? m.faqList : fallback.faqList,
          materialText: m.materialText !== undefined ? m.materialText : fallback.materialText,
          howToUseText: m.howToUseText !== undefined ? m.howToUseText : fallback.howToUseText,
          comboId: m.comboId !== undefined ? m.comboId : fallback.comboId,
          specs: m.specs && Object.keys(m.specs).length > 0 ? m.specs : fallback.specs
        };
      } catch (err) {
        console.warn('[Failed to parse SKYNODES_METADATA JSON comment]', err);
      }
    }
  }

  return {
    ...fallback,
    stock: fallback.stock !== undefined ? fallback.stock : 0
  };
}

export async function getAllAdminProducts() {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(resData.products)) {
      console.error('[getAllAdminProducts Error]', resData);
      return { success: false, error: 'Failed to fetch products from Shopify', products: [] };
    }

    const products = resData.products.map((p: any) => {
      const variant = p.variants?.[0] || {};
      const parsedDetails = parseProductDetails(p.body_html || '', p.tags);
      const images = (p.images || []).map((img: any) => img.src).filter(Boolean);

      // Real-time live inventory calculation from actual Shopify variants
      const liveShopifyStock = Array.isArray(p.variants) && p.variants.length > 0
        ? p.variants.reduce((sum: number, v: any) => sum + (typeof v.inventory_quantity === 'number' ? v.inventory_quantity : 0), 0)
        : (typeof variant.inventory_quantity === 'number' ? variant.inventory_quantity : 0);

      return {
        id: p.id,
        handle: p.handle,
        title: p.title,
        description: (p.body_html || '').replace(/<!-- SKYNODES_METADATA: [\s\S]*? -->/g, '').trim(),
        rawBodyHtml: p.body_html || '',
        vendor: p.vendor || 'SKYNODES UAV',
        productType: p.product_type || parsedDetails.category,
        category: parsedDetails.category,
        subCategory: parsedDetails.subCategory || '',
        price: parseFloat(variant.price || '0'),
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : 0,
        sku: variant.sku || '',
        stock: liveShopifyStock,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800'],
        tags: p.tags,
        parsedDetails: {
          ...parsedDetails,
          stock: liveShopifyStock
        }
      };
    });

    return { success: true, products };
  } catch (err: any) {
    console.error('[getAllAdminProducts Exception]', err);
    return { success: false, error: err.message, products: [] };
  }
}

export async function createOrUpdateAdminProduct(payload: AdminProductPayload) {
  try {
    const cleanTags = buildProductTags(payload);
    const primaryImg = payload.images?.[0] || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800';

    const imagesPayload = (payload.images || []).filter(Boolean).map(url => ({ src: url }));
    if (imagesPayload.length === 0) {
      imagesPayload.push({ src: primaryImg });
    }

    const metadataObj = {
      category: payload.category || 'engine',
      subCategory: payload.subCategory || '',
      stock: payload.stock !== undefined ? payload.stock : 0,
      isBestseller: !!payload.isBestseller,
      isCrazyDeal: !!payload.isCrazyDeal,
      isNewArrival: !!payload.isNewArrival,
      isHero: !!payload.isHero,
      heroOrder: payload.heroOrder || 1,
      discountBadge: payload.discountBadge || '',
      hsnCode: payload.hsnCode || '95030020',
      gstRate: payload.gstRate !== undefined ? payload.gstRate : 18,
      warrantyPeriod: payload.warrantyPeriod || '1-Year Official Warranty',
      trustBadges: payload.trustBadges || [],
      notesInSet: payload.notesInSet || [],
      whereToFly: payload.whereToFly || [],
      vibesText: payload.vibesText || '',
      youtubeVideoId: payload.youtubeVideoId || '',
      faqList: payload.faqList || [],
      materialText: payload.materialText || '',
      howToUseText: payload.howToUseText || '',
      comboId: payload.comboId || '',
      specs: payload.specs || {}
    };

    const rawUserDesc = (payload.description || `<p>${payload.title} - Official SKYNODES UAV Equipment.</p>`)
      .replace(/<!-- SKYNODES_METADATA: [\s\S]*? -->/g, '')
      .trim();
    const finalBodyHtml = `${rawUserDesc}\n<!-- SKYNODES_METADATA: ${JSON.stringify(metadataObj)} -->`;

    const productPayload: any = {
      product: {
        title: payload.title,
        body_html: finalBodyHtml,
        vendor: payload.vendor || 'SKYNODES UAV',
        product_type: payload.category || 'Aeromodel',
        tags: cleanTags,
        status: 'active',
        published: true,
        published_scope: 'global'
      }
    };

    let targetProductId = payload.id ? String(payload.id).replace(/[^0-9]/g, '') : null;

    if (targetProductId) {
      // Update Existing Product
      const currentRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${targetProductId}.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN }
      });
      const currentData = await currentRes.json().catch(() => ({}));
      const existingVariant = currentData.product?.variants?.[0];

      if (existingVariant) {
        productPayload.product.variants = [
          {
            id: existingVariant.id,
            price: (payload.price || 0).toString(),
            compare_at_price: payload.compareAtPrice ? payload.compareAtPrice.toString() : undefined,
            sku: payload.sku || existingVariant.sku || '',
            inventory_policy: 'continue',
            inventory_management: null
          }
        ];
      }

      if (imagesPayload.length > 0) {
        productPayload.product.images = imagesPayload;
      }

      const updateRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${targetProductId}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
        },
        body: JSON.stringify(productPayload)
      });

      const updateData = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) {
        console.error('[Shopify Product Update Error]', updateData);
        return { success: false, error: updateData?.errors || 'Failed to update product in Shopify' };
      }

      // Also persist Metafield
      try {
        await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${targetProductId}/metafields.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
          },
          body: JSON.stringify({
            metafield: {
              namespace: 'skynodes',
              key: 'pdp_data',
              type: 'json',
              value: JSON.stringify(metadataObj)
            }
          })
        });
      } catch (e) {
        // Non-blocking
      }

      return {
        success: true,
        product: updateData.product,
        message: 'Product updated successfully in Shopify!'
      };

    } else {
      // Create New Product
      productPayload.product.variants = [
        {
          price: (payload.price || 0).toString(),
          compare_at_price: payload.compareAtPrice ? payload.compareAtPrice.toString() : undefined,
          sku: payload.sku || `SKY-${Date.now().toString().slice(-4)}`,
          inventory_policy: 'continue',
          inventory_management: null
        }
      ];
      productPayload.product.images = imagesPayload;

      const createRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
        },
        body: JSON.stringify(productPayload)
      });

      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        console.error('[Shopify Product Create Error]', createData);
        return { success: false, error: createData?.errors || 'Failed to create product in Shopify' };
      }

      const newId = createData.product?.id;
      if (newId) {
        try {
          await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${newId}/metafields.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
            },
            body: JSON.stringify({
              metafield: {
                namespace: 'skynodes',
                key: 'pdp_data',
                type: 'json',
                value: JSON.stringify(metadataObj)
              }
            })
          });
        } catch (e) {
          // Non-blocking
        }
      }

      return {
        success: true,
        product: createData.product,
        message: 'Product created and published successfully to Shopify!'
      };
    }
  } catch (err: any) {
    console.error('[createOrUpdateAdminProduct Exception]', err);
    return { success: false, error: err.message };
  }
}

export async function deleteAdminProduct(id: string | number) {
  try {
    const cleanId = String(id).replace(/[^0-9]/g, '');
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${cleanId}.json`, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
      }
    });

    if (!res.ok) {
      const resData = await res.json().catch(() => ({}));
      return { success: false, error: resData?.errors || 'Failed to delete product' };
    }

    return { success: true, message: 'Product deleted cleanly from Shopify!' };
  } catch (err: any) {
    console.error('[deleteAdminProduct Exception]', err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// DYNAMIC NAVIGATION MENU MANAGEMENT (SHOPIFY METAFIELDS)
// ----------------------------------------------------
export interface NavSubItem {
  label: string;
  href: string;
}

export interface StoreNavItem {
  id?: string;
  label: string;
  href: string;
  highlight?: boolean;
  subItems?: NavSubItem[];
}

export const DEFAULT_STORE_NAVIGATION: StoreNavItem[] = [
  { label: 'SHOP ALL', href: '/shop?category=all' },
  { label: 'CRAZY DEALS', href: '/shop?filter=crazy-deals', highlight: true },
  { label: 'BESTSELLERS', href: '/shop?filter=bestsellers' },
  { 
    label: 'ENGINES', 
    href: '/shop?category=engine',
    subItems: [
      { label: 'Nitro Glow Engines', href: '/shop?category=engine&q=nitro' },
      { label: 'Gasoline Engines', href: '/shop?category=engine&q=gas' },
      { label: 'Engine Mufflers & Mounts', href: '/shop?category=accessories' }
    ]
  },
  { 
    label: 'AEROMODELS', 
    href: '/shop?category=aeromodels',
    subItems: [
      { label: 'Trainer Airframes', href: '/shop?category=aeromodels&q=trainer' },
      { label: 'Scale Warbirds', href: '/shop?category=aeromodels&q=warbird' },
      { label: 'Aerobatic Planes', href: '/shop?category=aeromodels&q=aerobatic' }
    ]
  },
  { label: 'RADIOS & RECEIVERS', href: '/shop?category=radio-receiver' },
  { label: 'BALSA WOOD', href: '/shop?category=balsa-wood' },
  { label: 'ACCESSORIES', href: '/shop?category=accessories' }
];

export async function getStoreNavigation(): Promise<StoreNavItem[]> {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/metafields.json?namespace=skynodes_system`, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
    const data = await res.json();
    const found = data.metafields?.find((m: any) => m.key === 'main_navigation');
    if (found && found.value) {
      const parsed = JSON.parse(found.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Shopify Admin] Failed to fetch navigation metafield, using default:', err);
  }
  return DEFAULT_STORE_NAVIGATION;
}

export async function saveStoreNavigation(items: StoreNavItem[]): Promise<{ success: boolean; error?: string }> {
  try {
    const listRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/metafields.json?namespace=skynodes_system`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN }
    });
    const listData = await listRes.json();
    const existing = listData.metafields?.find((m: any) => m.key === 'main_navigation');

    if (existing && existing.id) {
      const putRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/metafields/${existing.id}.json`, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metafield: {
            id: existing.id,
            value: JSON.stringify(items)
          }
        })
      });
      if (!putRes.ok) throw new Error(`Shopify PUT error: ${putRes.status}`);
      return { success: true };
    } else {
      const postRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/metafields.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metafield: {
            namespace: 'skynodes_system',
            key: 'main_navigation',
            value: JSON.stringify(items),
            type: 'json'
          }
        })
      });
      if (!postRes.ok) throw new Error(`Shopify POST error: ${postRes.status}`);
      return { success: true };
    }
  } catch (err: any) {
    console.error('[saveStoreNavigation Exception]', err);
    return { success: false, error: err.message };
  }
}



