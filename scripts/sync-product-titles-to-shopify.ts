import fs from 'node:fs';
import path from 'node:path';

// Helper to load .env manually if not set
if (!process.env.SHOPIFY_ADMIN_TOKEN) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key]) process.env[key] = value;
        }
      });
    }
  } catch (e) {}
}

const SHOPIFY_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN || 'skynodesuav.myshopify.com';
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';
const API_VERSION = '2024-04';

if (!SHOPIFY_ADMIN_TOKEN) {
  console.error('❌ Error: SHOPIFY_ADMIN_TOKEN is missing in environment variables or .env file.');
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 45 Shopify Product IDs mapped to their professional Capitalized / Title Case names
const PRODUCT_TITLE_UPDATES: Record<string, string> = {
  // 1. Engines
  '10368112591124': 'O.S. Max 0.46 AX II Nitro Engine',
  '10368112623892': 'O.S. MAX-65AX (E-4050)',
  '10368112656660': 'O.S. MAX-65AX (E-4010A)',
  '10368112722196': 'DLE 65cc Gas Engine',
  '10368112754964': 'DLE 20cc Gas Engine',
  '10386103664916': 'O.S. MAX-75AX ABL 2-Stroke Aircraft Nitro Engine',

  // 2. Radio & Receiver
  '10368112787732': 'Futaba Radio 6K (8 Channel) With Receiver',
  '10368112820500': 'Futaba TM 18-R9001SB (Transmitter and Receiver Set)',
  '10368112886036': 'Futaba Receiver R3008SB 2.4GHz Telemetry',

  // 3. Seagull Aeromodels
  '10368112951572': 'Champion Xtreme Decathlon 122" V2 ARF 60-80 (Red Version)',
  '10368112984340': 'Edge 540 V2 77.4" Wingspan ARF 35-40cc',
  '10368113017108': 'UK-Air Force Pilatus PC-9 60.6" ARF 10CC',
  '10368113049876': 'Boomerang V3 Trainer 61" ARF .46 2-Stroke',
  '10368113115412': 'Seagull LW Sport V2 60" ARF 46 2-Stroke 10cc',
  '10368113148180': 'Yak 54 3D ARF 64" 20-26cc',
  '10368113180948': 'Arising Star V2 Trainer 63" ARF .46 2-Stroke',
  '10368113213716': 'Ultimate Bi-Plane 54.3" ARF 20cc',
  '10368113246484': 'Extra 330 LX 3D 82.1" ARF 50-60cc (Blue/Red)',
  '10368113279252': 'Extra 330 LX 3D 82.1" ARF 50-60cc (Yellow)',
  '10368113312020': 'Zivko Edge 540 V3 92" ARF 60cc',
  '10368113344788': 'Yak 54 73" ARF 35-40cc 3D',

  // 4. Balsa Wood
  '10368113410324': 'Balsa Sheet 2 mm',
  '10368113475860': 'Balsa Sheet 3 mm',
  '10368113508628': 'Balsa Sheet 4 mm',
  '10368113574164': 'Balsa Sheet 5 mm',
  '10368113606932': 'Balsa Sheet 6 mm',
  '10368113672468': 'Balsa Sheet 8 mm',
  '10368113738004': 'Balsa Sheet 10 mm',
  '10368113770772': 'Balsa Sheet 12 mm',
  '10368113803540': 'Balsa Sheet 15 mm',

  // 5. Aeromodel Accessories
  '10368113836308': 'Futaba Servo S-U300',
  '10368113869076': 'Futaba Trainer Cord M-M Top',
  '10368113934612': 'Hand Fuel Pump',
  '10368113967380': 'High Torque 12V Starter',
  '10368114000148': 'Glow Starter C-Size With Charger',
  '10368114032916': 'LiPo Glow Starter Ignitor With LED & Adaptor',
  '10368114098452': 'Glow Plug Starter Ignitor',
  '10368114163988': 'Drill Guide 30-55',
  '10368114196756': 'Drill Guide 110 to 150',
  '10368114229524': '12V Electric Fuel Pump',
  '10368114262292': "DU-BRO Tygon Gas Tubing (Large 30' Spool)",
  '10368114327828': 'RealFlight Evolution RC Flight Simulator with InterLink DX Controller',
  '10368114360596': 'O.S. Glow Plug No. 8',
  '10368114393364': 'Futaba BR-4000 Battery/Servo/Receiver Checker',
  '10368114426132': 'Futaba BR-3000 Battery Checker',
};

async function syncProductTitles() {
  console.log('🚀 Starting Shopify Product Titles Sync for SKYNODES UAV...');
  console.log(`📡 Store Domain: ${SHOPIFY_DOMAIN}`);

  // Check scopes first
  try {
    const scopeRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_scopes.json`, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    const scopeData = await scopeRes.json();
    const scopes = (scopeData.access_scopes || []).map((s: any) => s.handle);
    const hasWriteProducts = scopes.includes('write_products');

    if (!hasWriteProducts) {
      console.error('\n⚠️ NOTICE: The Custom App does not currently have "write_products" scope.');
      console.error('👉 To enable Shopify Admin to accept product title updates:');
      console.error('   1. Go to Shopify Admin -> Settings -> Apps and sales channels -> Develop apps');
      console.error('   2. Select your app -> Configuration -> Admin API integration');
      console.error('   3. Under Products, check "write_products" and "read_products"');
      console.error('   4. Click Save');
      console.error('\nℹ️ Once saved, re-run this script to automatically update all titles in Shopify Admin!\n');
      return { success: false, reason: 'missing_scope' };
    }
  } catch (err) {
    console.warn('Scope check warning:', err);
  }

  const entries = Object.entries(PRODUCT_TITLE_UPDATES);
  console.log(`\n⏳ Updating ${entries.length} products with capitalized titles in Shopify Admin...\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const [productId, newTitle] = entries[i];
    const prefix = `[${i + 1}/${entries.length}]`;

    try {
      const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/products/${productId}.json`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product: {
            id: Number(productId),
            title: newTitle
          }
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        console.error(`${prefix} ❌ Failed ID ${productId}: ${JSON.stringify(resData.errors || resData)}`);
        errorCount++;
      } else {
        console.log(`${prefix} ✅ Updated ID ${productId} ➔ "${newTitle}"`);
        updatedCount++;
      }
    } catch (err: any) {
      console.error(`${prefix} ❌ Error ID ${productId}: ${err.message}`);
      errorCount++;
    }

    await sleep(500); // Prevent API rate limit
  }

  console.log('\n========================================');
  console.log('🎉 SHOPIFY PRODUCT TITLES SYNC FINISHED!');
  console.log(`✅ Updated: ${updatedCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
  console.log('========================================\n');
  return { success: true, updatedCount, errorCount };
}

syncProductTitles();
