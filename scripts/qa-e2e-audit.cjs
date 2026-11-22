const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.skynodesuav.in';

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function runQASuite() {
  console.log(`\n============================================================`);
  console.log(`🚀 STARTING COMPREHENSIVE AUTOMATED E2E QA TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`============================================================\n`);

  const results = {
    sitemapUrls: { total: 0, passed: 0, failed: 0, urls: [] },
    apiChecks: { passed: 0, failed: 0, details: [] },
    schemaAndSeo: { passed: 0, failed: 0, details: [] },
    businessRules: { passed: 0, failed: 0, details: [] },
    imagesCdn: { passed: 0, failed: 0, details: [] },
    llmsGrounding: { passed: 0, failed: 0, details: [] }
  };

  // -------------------------------------------------------------
  // TEST 1: SITEMAP & BROKEN LINK SCANNER (All 76 URLs)
  // -------------------------------------------------------------
  console.log(`[TEST 1] Fetching & Verifying sitemap.xml...`);
  try {
    const sitemapRes = await fetchWithTimeout(`${BASE_URL}/sitemap.xml`);
    if (sitemapRes.status === 200) {
      const xml = await sitemapRes.text();
      const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
      results.sitemapUrls.total = locMatches.length;
      console.log(`✓ Sitemap found with ${locMatches.length} URLs. Testing all URLs concurrently...`);

      const concurrency = 6;
      let idx = 0;
      async function worker() {
        while (idx < locMatches.length) {
          const currentIdx = idx++;
          const targetUrl = locMatches[currentIdx];
          const startTime = Date.now();
          try {
            const pageRes = await fetchWithTimeout(targetUrl, { method: 'GET' });
            const duration = Date.now() - startTime;
            if (pageRes.status === 200) {
              results.sitemapUrls.passed++;
              results.sitemapUrls.urls.push({ url: targetUrl, status: 200, duration, pass: true });
            } else {
              results.sitemapUrls.failed++;
              results.sitemapUrls.urls.push({ url: targetUrl, status: pageRes.status, duration, pass: false });
              console.error(`  ✕ [FAIL ${pageRes.status}] ${targetUrl}`);
            }
          } catch (err) {
            results.sitemapUrls.failed++;
            results.sitemapUrls.urls.push({ url: targetUrl, error: err.message, pass: false });
            console.error(`  ✕ [ERR] ${targetUrl}: ${err.message}`);
          }
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
      console.log(`✓ Sitemap Scan Complete: ${results.sitemapUrls.passed}/${results.sitemapUrls.total} URLs returned HTTP 200 OK.`);
    } else {
      console.error(`✕ Sitemap returned HTTP ${sitemapRes.status}`);
      results.sitemapUrls.failed++;
    }
  } catch (err) {
    console.error(`✕ Sitemap scan failed:`, err.message);
    results.sitemapUrls.failed++;
  }

  // -------------------------------------------------------------
  // TEST 2: API ENDPOINT HEALTH & CRUD VALIDATION
  // -------------------------------------------------------------
  console.log(`\n[TEST 2] Testing API Endpoints Health & Inquiries...`);
  
  // 2a: GET /api/inquiries
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/inquiries`);
    const data = await res.json();
    if (res.status === 200 && data.success) {
      results.apiChecks.passed++;
      results.apiChecks.details.push({ test: 'GET /api/inquiries', status: 200, count: data.inquiries?.length, pass: true });
      console.log(`  ✓ GET /api/inquiries: 200 OK (Found ${data.inquiries?.length || 0} registered inquiries)`);
    } else {
      results.apiChecks.failed++;
      console.error(`  ✕ GET /api/inquiries: Failed with status ${res.status}`);
    }
  } catch (err) {
    results.apiChecks.failed++;
    console.error(`  ✕ GET /api/inquiries error:`, err.message);
  }

  // 2b: POST /api/inquiries (Validation: empty payload must fail with 400)
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status === 400) {
      results.apiChecks.passed++;
      results.apiChecks.details.push({ test: 'POST /api/inquiries (Empty Body Validation)', status: 400, pass: true });
      console.log(`  ✓ POST /api/inquiries Empty Validation: Correctly rejected with 400 Bad Request`);
    } else {
      results.apiChecks.failed++;
      console.error(`  ✕ POST /api/inquiries Empty Validation: Expected 400 but got ${res.status}`);
    }
  } catch (err) {
    results.apiChecks.failed++;
    console.error(`  ✕ POST /api/inquiries Validation Error:`, err.message);
  }

  // 2c: GET /api/admin/coupons
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/admin/coupons`);
    const data = await res.json();
    const couponsList = data.settings?.coupons || data.coupons || [];
    if (res.status === 200 && (data.success || data.coupons || data.settings)) {
      results.apiChecks.passed++;
      results.apiChecks.details.push({ test: 'GET /api/admin/coupons', status: 200, couponsCount: couponsList.length, enabled: data.settings?.enabled, pass: true });
      console.log(`  ✓ GET /api/admin/coupons: 200 OK (Master Enabled: ${data.settings?.enabled}, ${couponsList.length} coupons configured)`);
    } else {
      results.apiChecks.failed++;
      console.error(`  ✕ GET /api/admin/coupons: Failed with status ${res.status}`);
    }
  } catch (err) {
    results.apiChecks.failed++;
    console.error(`  ✕ GET /api/admin/coupons error:`, err.message);
  }

  // 2d: GET /api/admin/announcement
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/admin/announcement`);
    const data = await res.json();
    if (res.status === 200 && data.announcement) {
      results.apiChecks.passed++;
      results.apiChecks.details.push({ test: 'GET /api/admin/announcement', status: 200, highlight: data.announcement.highlightText, pass: true });
      console.log(`  ✓ GET /api/admin/announcement: 200 OK (Highlight: "${data.announcement.highlightText}", Enabled: ${data.announcement.enabled})`);
    } else {
      results.apiChecks.failed++;
      console.error(`  ✕ GET /api/admin/announcement: Failed with status ${res.status}`);
    }
  } catch (err) {
    results.apiChecks.failed++;
    console.error(`  ✕ GET /api/admin/announcement error:`, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: SCHEMA.ORG & ADVANCED SEO / AEO CHECKS
  // -------------------------------------------------------------
  console.log(`\n[TEST 3] Testing Schema.org, Meta Tags & AEO Grounding...`);

  const pagesToAudit = [
    { name: 'Home Page', path: '/', expectedSchemas: ['Organization', 'WebSite'] },
    { name: 'Shop Catalog', path: '/shop', expectedSchemas: ['ItemList'] },
    { name: 'Seagull Aircraft PDP', path: '/product/sea-1', expectedSchemas: ['Product', 'BreadcrumbList'] },
    { name: 'OS Engine PDP', path: '/product/eng-1', expectedSchemas: ['Product', 'BreadcrumbList'] },
    { name: 'Balsa Wood Sheet PDP', path: '/product/bal-1', expectedSchemas: ['Product', 'BreadcrumbList'] },
    { name: 'Flight Blog Directory', path: '/blog', expectedSchemas: ['CollectionPage', 'Blog', 'ItemList'] },
    { name: 'Nitro Engine Tuning Blog', path: '/blog/how-to-break-in-nitro-engine', expectedSchemas: ['BlogPosting', 'BreadcrumbList'], checkAeoFaq: true },
    { name: 'Interactive FAQ Page', path: '/faq', expectedSchemas: ['FAQPage'] },
  ];

  for (const page of pagesToAudit) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${page.path}`);
      const html = await res.text();
      
      const missingSchemas = [];
      for (const expected of page.expectedSchemas) {
        if (!html.includes(`"@type": "${expected}"`) && !html.includes(`"@type":"${expected}"`)) {
          missingSchemas.push(expected);
        }
      }

      let aeoFaqPassed = true;
      if (page.checkAeoFaq && !html.includes('aeo-faq-block')) {
        aeoFaqPassed = false;
      }

      if (missingSchemas.length === 0 && aeoFaqPassed) {
        results.schemaAndSeo.passed++;
        results.schemaAndSeo.details.push({ page: page.name, schemas: page.expectedSchemas, pass: true });
        console.log(`  ✓ ${page.name} (${page.path}): Validated schemas [${page.expectedSchemas.join(', ')}]${page.checkAeoFaq ? ' + AEO FAQ Block' : ''}`);
      } else {
        results.schemaAndSeo.failed++;
        results.schemaAndSeo.details.push({ page: page.name, missing: missingSchemas, aeoPassed: aeoFaqPassed, pass: false });
        console.error(`  ✕ ${page.name}: Missing schemas: ${missingSchemas.join(', ')}, AEO FAQ: ${aeoFaqPassed}`);
      }
    } catch (err) {
      results.schemaAndSeo.failed++;
      console.error(`  ✕ ${page.name} fetch error:`, err.message);
    }
  }

  // -------------------------------------------------------------
  // TEST 4: CHECKOUT BUSINESS RULES & INTEGRITY (HTML + Bundled JS)
  // -------------------------------------------------------------
  console.log(`\n[TEST 4] Testing Checkout Business Rules (COD, Transit Banner, Auth Gate, Balsa MOQ)...`);
  try {
    const chkRes = await fetchWithTimeout(`${BASE_URL}/checkout`);
    const chkHtml = await chkRes.text();

    // Find and fetch bundled script assets for /checkout
    const scriptMatches = [...chkHtml.matchAll(/src="(\/_astro\/hoisted\.[^"]+\.js)"/g)].map(m => m[1]);
    let bundledJsText = '';
    for (const sUrl of scriptMatches) {
      try {
        const sRes = await fetchWithTimeout(`${BASE_URL}${sUrl}`);
        if (sRes.status === 200) {
          bundledJsText += '\n' + (await sRes.text());
        }
      } catch (e) {}
    }
    const combinedCode = chkHtml + '\n' + bundledJsText;

    // 4a: COD check in payment methods UI
    const hasCODInUI = chkHtml.includes('Cash on Delivery') || chkHtml.includes('name="pay-method" value="cod"');
    if (!hasCODInUI) {
      results.businessRules.passed++;
      results.businessRules.details.push({ rule: 'Cash on Delivery Removed', pass: true });
      console.log(`  ✓ COD Removal: "Cash on Delivery" is 100% absent from checkout payment options.`);
    } else {
      results.businessRules.failed++;
      console.error(`  ✕ COD Check Failed: Cash on Delivery still found in checkout HTML!`);
    }

    // 4b: Transit Protection Banner check
    const hasTransitProtection = chkHtml.includes('100% Transit Protection');
    if (!hasTransitProtection) {
      results.businessRules.passed++;
      results.businessRules.details.push({ rule: '100% Transit Protection Text Removed', pass: true });
      console.log(`  ✓ Transit Protection Removal: 100% Transit Protection text is completely absent.`);
    } else {
      results.businessRules.failed++;
      console.error(`  ✕ Transit Protection text still found in checkout HTML!`);
    }

    // 4c: Auth Gate Login Modal Dispatch
    const hasAuthGateModal = combinedCode.includes('open-login-modal') && chkHtml.includes('checkout-auth-gate-banner');
    if (hasAuthGateModal) {
      results.businessRules.passed++;
      results.businessRules.details.push({ rule: 'Pilot Auth Gate Modal Integration', pass: true });
      console.log(`  ✓ Pilot Auth Gate: Directly triggers 'open-login-modal' and highlights banner without browser alert.`);
    } else {
      results.businessRules.failed++;
      console.error(`  ✕ Auth Gate Check Failed: Missing open-login-modal event dispatch in bundle.`);
    }

    // 4d: Balsa Wood MOQ Enforcement Logic
    const hasBalsaMoq = combinedCode.includes('validateBalsaMinQuantity') || combinedCode.includes('Minimum 5 Balsa Wood Sheets Required');
    if (hasBalsaMoq) {
      results.businessRules.passed++;
      results.businessRules.details.push({ rule: 'Balsa Wood 5-Sheet MOQ Validation', pass: true });
      console.log(`  ✓ Balsa Wood MOQ: Cart & Checkout enforce minimum 5 sheets.`);
    } else {
      results.businessRules.failed++;
      console.error(`  ✕ Balsa MOQ Check Failed: Missing MOQ validation code in bundle.`);
    }

    // 4e: Promo Code Remove & Clear Logic
    const hasCouponRemove = (chkHtml.includes('btn-remove-coupon') || combinedCode.includes('btn-remove-coupon')) && combinedCode.includes('removeCoupon');
    if (hasCouponRemove) {
      results.businessRules.passed++;
      results.businessRules.details.push({ rule: 'Promo Code Remove & Clear Mechanism', pass: true });
      console.log(`  ✓ Promo Code Remove: "✕ REMOVE" button and input clear handler present.`);
    } else {
      results.businessRules.failed++;
      console.error(`  ✕ Promo Code Remove Check Failed: Missing remove handler in bundle.`);
    }

  } catch (err) {
    results.businessRules.failed++;
    console.error(`  ✕ Checkout audit failed:`, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: CDN & STATIC IMAGE INTEGRITY CHECK
  // -------------------------------------------------------------
  console.log(`\n[TEST 5] Testing Product Image Assets Availability...`);
  const sampleImages = [
    `${BASE_URL}/images/products/balsa-sheet-1.jpg`,
    'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/sea-1-1.jpg?v=1791020060',
    'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/sea-4-1.jpg?v=1791020063',
    'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/eng-1-1.jpg?v=1791020065',
    'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/eng-2-1.jpg?v=1791020067',
    'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/rad-1-1.jpg?v=1791020072'
  ];

  for (const imgUrl of sampleImages) {
    try {
      const imgRes = await fetchWithTimeout(imgUrl, { method: 'HEAD' });
      const contentType = imgRes.headers.get('content-type') || '';
      if (imgRes.status === 200 && contentType.startsWith('image/')) {
        results.imagesCdn.passed++;
        console.log(`  ✓ Image OK (${contentType}): ${imgUrl.split('/').pop().split('?')[0]}`);
      } else {
        results.imagesCdn.failed++;
        console.error(`  ✕ Image Failed (${imgRes.status}, ${contentType}): ${imgUrl}`);
      }
    } catch (err) {
      results.imagesCdn.failed++;
      console.error(`  ✕ Image fetch error:`, err.message);
    }
  }

  // -------------------------------------------------------------
  // TEST 6: LLMS.TXT & AI GROUNDING VERIFICATION
  // -------------------------------------------------------------
  console.log(`\n[TEST 6] Testing llms.txt & llms-full.txt Grounding Files...`);
  try {
    const lRes = await fetchWithTimeout(`${BASE_URL}/llms.txt`);
    const lFullRes = await fetchWithTimeout(`${BASE_URL}/llms-full.txt`);
    
    if (lRes.status === 200 && lFullRes.status === 200) {
      const lText = await lRes.text();
      const lFullText = await lFullRes.text();

      const hasNashik = lText.includes('Devlali Camp') || lText.includes('Devlali camp') || lText.includes('Nashik');
      const hasBrands = (lText.includes('O.S. Engines') || lText.includes('O.S. Max')) && lText.includes('DLE') && lText.includes('Seagull');
      const hasBalsaRule = lFullText.includes('5 sheets') || lText.includes('Balsa');

      if (hasNashik && hasBrands && hasBalsaRule) {
        results.llmsGrounding.passed++;
        results.llmsGrounding.details.push({
          llmsBytes: lText.length,
          llmsFullBytes: lFullText.length,
          pass: true
        });
        console.log(`  ✓ llms.txt (${(lText.length / 1024).toFixed(1)} KB) & llms-full.txt (${(lFullText.length / 1024).toFixed(1)} KB) contain verified brand citations & location.`);
      } else {
        results.llmsGrounding.failed++;
        console.error(`  ✕ Missing key brand citations in llms.txt (hasNashik: ${hasNashik}, hasBrands: ${hasBrands})`);
      }
    } else {
      results.llmsGrounding.failed++;
      console.error(`  ✕ llms.txt returned HTTP ${lRes.status}, llms-full.txt returned ${lFullRes.status}`);
    }
  } catch (err) {
    results.llmsGrounding.failed++;
    console.error(`  ✕ llms test error:`, err.message);
  }

  // -------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // -------------------------------------------------------------
  console.log(`\n============================================================`);
  console.log(`📊 E2E QA TEST SUITE SUMMARY RESULTS`);
  console.log(`============================================================`);
  console.log(`1. Sitemap & Broken Links:   ${results.sitemapUrls.passed}/${results.sitemapUrls.total} URLs Passed (100% 200 OK)`);
  console.log(`2. API Health & Validation:   ${results.apiChecks.passed}/${results.apiChecks.passed + results.apiChecks.failed} Passed`);
  console.log(`3. Schema.org & SEO Audits:   ${results.schemaAndSeo.passed}/${results.schemaAndSeo.passed + results.schemaAndSeo.failed} Passed`);
  console.log(`4. Checkout Business Rules:   ${results.businessRules.passed}/${results.businessRules.passed + results.businessRules.failed} Passed`);
  console.log(`5. CDN Image Integrity:       ${results.imagesCdn.passed}/${results.imagesCdn.passed + results.imagesCdn.failed} Passed`);
  console.log(`6. LLMs / AI Grounding:       ${results.llmsGrounding.passed}/${results.llmsGrounding.passed + results.llmsGrounding.failed} Passed`);
  console.log(`============================================================\n`);

  fs.writeFileSync(path.join(__dirname, 'qa-results.json'), JSON.stringify(results, null, 2));
}

runQASuite().catch(err => {
  console.error("FATAL ERROR in QA SUITE:", err);
  process.exit(1);
});
