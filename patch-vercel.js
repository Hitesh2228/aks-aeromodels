import fs from 'node:fs';
import path from 'node:path';

const adapterPath = path.resolve('node_modules/@astrojs/vercel/dist/serverless/adapter.js');

if (fs.existsSync(adapterPath)) {
  let content = fs.readFileSync(adapterPath, 'utf8');
  let modified = false;

  if (content.includes("20: { status: 'default' },") && !content.includes("22: { status: 'default' }")) {
    content = content.replace(
      "20: { status: 'default' },",
      "20: { status: 'default' },\n    22: { status: 'default' },\n    24: { status: 'default' },"
    );
    modified = true;
  }

  if (content.includes("return 'nodejs18.x';")) {
    content = content.replaceAll("return 'nodejs18.x';", "return 'nodejs20.x';");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(adapterPath, content, 'utf8');
    console.log('[patch-vercel] Successfully patched @astrojs/vercel adapter to support Node 20/22/24 runtimes.');
  } else {
    console.log('[patch-vercel] @astrojs/vercel adapter already patched or up to date.');
  }
} else {
  console.log('[patch-vercel] @astrojs/vercel adapter file not found, skipping.');
}
