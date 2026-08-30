export interface CrazyDeal {
  id: string;
  name: string;
  tagSub: string;
  tagMain: string;
  tagOnly: string;
  image: string;
  price: number;
  originalPrice: number;
  savingsBadge: string;
  productId: string;
  linkUrl: string;
  description: string;
}

export const CRAZY_DEALS: CrazyDeal[] = [
  {
    id: 'deal-1',
    name: 'PILOT STARTER FLIGHT COMBO',
    tagSub: 'SPECIAL COMBO',
    tagMain: 'O.S. 46 + BOOMERANG V3',
    tagOnly: 'READY TO FLY',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=600&auto=format&fit=crop',
    price: 26999,
    originalPrice: 34999,
    savingsBadge: 'SAVE 23% OFF',
    productId: 'sea-4',
    linkUrl: '/product/sea-4',
    description: 'Complete high-wing flight trainer kit with O.S. Max 0.46 AX II Nitro Engine & Seagull Boomerang V3 Airframe.'
  },
  {
    id: 'deal-2',
    name: 'GIANT SCALE AEROBATIC PACK',
    tagSub: 'PRO COMBO',
    tagMain: 'DLE 65 + DECATHLON 122"',
    tagOnly: 'PRO PILOT',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=600&auto=format&fit=crop',
    price: 94999,
    originalPrice: 119999,
    savingsBadge: 'SAVE 21% OFF',
    productId: 'sea-1',
    linkUrl: '/product/sea-1',
    description: '122" Champion Xxtreme Decathlon paired with DLE 65cc Petrol Engine with standoffs and CDI ignition.'
  },
  {
    id: 'deal-3',
    name: 'FUTABA PRO TRANSMITTER PACK',
    tagSub: 'RADIO DEAL',
    tagMain: 'FUTABA 6K + R3008SB',
    tagOnly: 'TELEMETRY',
    image: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?q=80&w=600&auto=format&fit=crop',
    price: 19999,
    originalPrice: 26999,
    savingsBadge: 'SAVE 26% OFF',
    productId: 'rad-1',
    linkUrl: '/product/rad-1',
    description: 'Precision 6-Channel Futaba T-FHSS Transmitter with R3008SB S.BUS Telemetry Receiver.'
  },
  {
    id: 'deal-4',
    name: '3D AEROBATIC EDGE 540 COMBO',
    tagSub: 'FREESTYLE',
    tagMain: 'EDGE 540 77" + DLE 35',
    tagOnly: 'EXTREME 3D',
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4eff56024?q=80&w=600&auto=format&fit=crop',
    price: 58999,
    originalPrice: 72000,
    savingsBadge: 'SAVE 18% OFF',
    productId: 'sea-2',
    linkUrl: '/product/sea-2',
    description: '77.4" Edge 540 V2 3D aerobatic airframe equipped with carbon fiber wing tube and digital servos.'
  },
  {
    id: 'deal-5',
    name: 'CONTEST BALSA WOOD PACK (10 PKS)',
    tagSub: 'BUILDER BUNDLE',
    tagMain: '10 SIZES BALSA SHEETS',
    tagOnly: 'CONTEST GRADE',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=600&auto=format&fit=crop',
    price: 2999,
    originalPrice: 3999,
    savingsBadge: 'SAVE 25% OFF',
    productId: 'bal-1',
    linkUrl: '/product/bal-1',
    description: 'Complete 10-piece contest grade AAA balsa sheet pack ranging from 2mm to 15mm thickness.'
  }
];
