const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ultra-clean, high-visibility aerodynamic icon designed for maximum clarity from 16px to 512px
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient (Deep Aerospace Obsidian) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C16" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Metallic Gold / Amber Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="45%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>

    <!-- Supersonic Cyan Glow Gradient -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="60%" stop-color="#0EA5E9" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <!-- Titanium Wing Gradient (Left Wing Light) -->
    <linearGradient id="wingGrad" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="40%" stop-color="#F8FAFC" />
      <stop offset="75%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <!-- Wing Shadow Gradient (Right Wing 3D Depth) -->
    <linearGradient id="wingShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#94A3B8" />
      <stop offset="60%" stop-color="#64748B" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <!-- Outer Border Metallic Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="35%" stop-color="#F59E0B" />
      <stop offset="70%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <!-- Radial Jet Engine Energy Glow -->
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284C7" stop-opacity="0.45" />
      <stop offset="55%" stop-color="#0EA5E9" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Base Rounded Squircle -->
  <rect x="20" y="20" width="472" height="472" rx="112" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="16" />

  <!-- Radial Aviation Core Glow -->
  <circle cx="256" cy="256" r="190" fill="url(#centerGlow)" />

  <!-- Dual Vector Speed Streams Behind Jet (Afterburners) -->
  <path d="M 230 380 L 210 445 L 224 445 L 240 385 Z" fill="url(#cyanGrad)" />
  <path d="M 282 380 L 302 445 L 288 445 L 272 385 Z" fill="url(#cyanGrad)" />
  <polygon points="256,385 248,455 264,455" fill="url(#goldGrad)" />

  <!-- Main Left Aerodynamic Wing -->
  <path d="M 256 90 L 256 380 L 80 370 L 130 280 L 232 160 Z" fill="url(#wingGrad)" />

  <!-- Main Right Aerodynamic Wing (Shaded 3D) -->
  <path d="M 256 90 L 256 380 L 432 370 L 382 280 L 280 160 Z" fill="url(#wingShadow)" />

  <!-- Left Leading Edge Titanium Highlight -->
  <polygon points="256,90 232,160 130,280 80,370 102,366 148,276 244,152" fill="#FFFFFF" />

  <!-- Right Leading Edge Shadow Trim -->
  <polygon points="256,90 280,160 382,280 432,370 410,366 364,276 268,152" fill="#CBD5E1" />

  <!-- Center Fuselage Cockpit / Telemetry Ridge -->
  <polygon points="256,70 268,170 266,365 256,390 246,365 244,170" fill="#FFFFFF" />

  <!-- Golden Telemetry Flight Sensor (Cockpit Canopy) -->
  <polygon points="256,140 265,225 256,245 247,225" fill="url(#goldGrad)" />
  <polygon points="256,150 261,220 256,232 251,220" fill="#FEF08A" />

  <!-- Wingtip Aerodynamic Winglets (Vibrant Cyan Accents) -->
  <polygon points="80,370 115,385 138,373 108,366" fill="url(#cyanGrad)" />
  <polygon points="432,370 397,385 374,373 404,366" fill="url(#cyanGrad)" />

  <!-- Supersonic Apex Navigation Diamond / Beacon Star (SKYNODES Symbol) -->
  <circle cx="256" cy="70" r="14" fill="#FDE047" opacity="0.3" />
  <path d="M 256 46 L 261 64 L 280 70 L 261 76 L 256 94 L 251 76 L 232 70 L 251 64 Z" fill="#FFFFFF" />
  <circle cx="256" cy="70" r="4.5" fill="#FDE047" />
</svg>`;

// Function to create standard Windows ICO containing multiple PNG frames
function createIco(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + (16 * pngBuffers.length);
  const directoryEntries = [];

  for (const { buffer, size } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);

    directoryEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([
    header,
    ...directoryEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVG Favicon
  const svgPath = path.join(publicDir, 'favicon.svg');
  fs.writeFileSync(svgPath, svgFavicon, 'utf8');
  console.log('✓ Created:', svgPath);

  // 2. Generate PNG sizes
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },     // Google Search Favicon standard
    { size: 96, name: 'favicon-96x96.png' },
    { size: 180, name: 'apple-touch-icon.png' }, // iOS Apple Touch Icon
    { size: 192, name: 'favicon-192x192.png' }, // Android / Chrome PWA
    { size: 512, name: 'favicon-512x512.png' }, // Splash Screen
  ];

  const icoFrames = [];

  for (const s of sizes) {
    const pngBuf = await sharp(Buffer.from(svgFavicon))
      .resize(s.size, s.size)
      .png()
      .toBuffer();

    const targetFile = path.join(publicDir, s.name);
    fs.writeFileSync(targetFile, pngBuf);
    console.log(`✓ Created: ${s.name} (${s.size}x${s.size})`);

    // For multi-layer ICO, include 16, 32, 48
    if ([16, 32, 48].includes(s.size)) {
      icoFrames.push({ buffer: pngBuf, size: s.size });
    }
  }

  // 3. Generate multi-layer favicon.ico
  const icoBuffer = createIco(icoFrames);
  const icoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✓ Created:', icoPath, `(${icoBuffer.length} bytes)`);

  // 4. Generate site.webmanifest
  const manifest = {
    name: "SKYNODES UAV India",
    short_name: "SKYNODES UAV",
    description: "India's premier high-performance scale aeromodelling, RC aviation hardware, and UAV technology specialist store.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png"
      },
      {
        src: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png"
      },
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };

  const manifestPath = path.join(publicDir, 'site.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Created:', manifestPath);
}

main().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
