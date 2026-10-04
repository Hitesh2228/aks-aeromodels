// Helper to clean and properly capitalize product titles for SKYNODES UAV
export const PRODUCT_EXACT_TITLE_MAP: Record<string, string> = {
  'futaba servo S-U300': 'Futaba Servo S-U300',
  'hand fuel pump': 'Hand Fuel Pump',
  'futaba Radio 6k (8 Channel) With Reciver': 'Futaba Radio 6K (8 Channel) With Receiver',
  'futaba TM 18-R9001SB (Transmitter and Receiver set)': 'Futaba TM 18-R9001SB (Transmitter and Receiver Set)',
  'RECEIVER R3008 SB 2.4G': 'Futaba Receiver R3008SB 2.4GHz Telemetry',
  'Futaba trainer coard m-m top': 'Futaba Trainer Cord M-M Top',
  'high torque 12v starter': 'High Torque 12V Starter',
  'Glow starter c size with charger': 'Glow Starter C-Size With Charger',
  'LIPO GLOW STARTER IGNITOR WITH LED & ADAPTOR': 'LiPo Glow Starter Ignitor With LED & Adaptor',
  'Glow plug starter ignitor': 'Glow Plug Starter Ignitor',
  'Drill guid 30-55': 'Drill Guide 30-55',
  'Drill guide 110 to 150': 'Drill Guide 110 to 150',
  '12 v electric fuel pump': '12V Electric Fuel Pump',
  "DU-BRO Tygon gas tubing, large 30' spool": "DU-BRO Tygon Gas Tubing (Large 30' Spool)",
  'O.S. Glow Plug no .8': 'O.S. Glow Plug No. 8',
  'BR-4000 Battery/Servo/Receiver Checker': 'Futaba BR-4000 Battery/Servo/Receiver Checker',
  'BR-3000 Battery Checker': 'Futaba BR-3000 Battery Checker',
  'DLE 65 cc Gas engine': 'DLE 65cc Gas Engine',
  'DLE 20 cc gas engine': 'DLE 20cc Gas Engine',
  'Edge 540 V2 77.4" Wing Span 35-40 CC': 'Edge 540 V2 77.4" Wingspan ARF 35-40cc',
  'Boomerang V3 Trainer 61" ARF .46 2 Stroke': 'Boomerang V3 Trainer 61" ARF .46 2-Stroke',
  'YAK 54 3D ARF 64" ARF 20-26CC': 'Yak 54 3D ARF 64" 20-26cc',
  'Arising Star V2 Trainer 63" ARF .46 2 Stroke': 'Arising Star V2 Trainer 63" ARF .46 2-Stroke',
  'Ultimate Bi-Plane 54.3" ARF 20CC': 'Ultimate Bi-Plane 54.3" ARF 20cc',
  'Extra 330 LX 3D 82.1" ARF 50-60 CC " B /R': 'Extra 330 LX 3D 82.1" ARF 50-60cc (Blue/Red)',
  'EXTRA 330 LX 3D 82.1" ARF 50-60CC YELLOW': 'Extra 330 LX 3D 82.1" ARF 50-60cc (Yellow)',
  'Zivko Edge 540 V3 92" ARF 60CC': 'Zivko Edge 540 V3 92" ARF 60cc',
  'YAK 54 73" ARF 35 -40cc 3D': 'Yak 54 73" ARF 35-40cc 3D',
};

export function formatCleanProductTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let title = rawTitle.trim();

  // 1. Direct match
  if (PRODUCT_EXACT_TITLE_MAP[title]) {
    return PRODUCT_EXACT_TITLE_MAP[title];
  }

  // 2. Case-insensitive dictionary match
  const lower = title.toLowerCase();
  for (const [k, v] of Object.entries(PRODUCT_EXACT_TITLE_MAP)) {
    if (k.toLowerCase() === lower) return v;
  }

  // 3. Brand & common aeromodelling keyword corrections
  title = title
    .replace(/^futaba\b/i, 'Futaba')
    .replace(/\bfutaba\b/gi, 'Futaba')
    .replace(/\bReciver\b/gi, 'Receiver')
    .replace(/\bcoard\b/gi, 'Cord')
    .replace(/\bguid\b/gi, 'Guide')
    .replace(/\bno \.8\b/gi, 'No. 8')
    .replace(/\b12 v\b/gi, '12V')
    .replace(/\b6k\b/g, '6K')
    .replace(/\b(\d+)\s*cc\b/gi, '$1cc')
    .replace(/\b2 stroke\b/gi, '2-Stroke')
    .replace(/\b4 stroke\b/gi, '4-Stroke');

  // 4. Ensure first character is always uppercase
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title;
}
