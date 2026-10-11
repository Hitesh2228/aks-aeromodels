/**
 * SKYNODES UAV - Official Navigation Menu Configuration
 * 
 * 📌 HOW TO EDIT OR ADD MENU ITEMS:
 * 1. To add a new menu item: Simply add a new object to `MAIN_NAV_ITEMS` or `MOBILE_NAV_ITEMS`.
 *    Example:
 *    { label: 'DRONES', href: '/shop?category=drones' },
 * 
 * 2. To change an existing menu name or URL:
 *    Edit `label` (Display Name) or `href` (Target URL).
 *    Example: Change 'RADIOS & RECEIVERS' to 'TRANSMITTERS'.
 * 
 * 3. To highlight a menu item with special styling:
 *    Set `highlight: true`.
 * 
 * 4. To remove a menu item:
 *    Simply delete or comment out the line.
 */

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
}

export interface MobileNavItem extends NavItem {
  iconType?: 'grid' | 'deal' | 'engine' | 'plane' | 'radio' | 'wood' | 'tool' | 'blog' | 'info' | 'contact' | 'profile';
}

// 🖥️ Desktop Header Navigation Strip
export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'SHOP ALL', href: '/shop?category=all' },
  { label: 'CRAZY DEALS', href: '/shop?filter=crazy-deals', highlight: true },
  { label: 'BESTSELLERS', href: '/shop?filter=bestsellers' },
  { label: 'ENGINES', href: '/shop?category=engine' },
  { label: 'AEROMODELS', href: '/shop?category=aeromodels' },
  { label: 'RADIOS & RECEIVERS', href: '/shop?category=radio-receiver' },
  { label: 'BALSA WOOD', href: '/shop?category=balsa-wood' },
  { label: 'ACCESSORIES', href: '/shop?category=accessories' }
];

// 📱 Mobile Slide-Out Drawer Navigation Links
export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'SHOP ALL PRODUCTS', href: '/shop', iconType: 'grid' },
  { label: 'CRAZY DEALS', href: '/shop?filter=crazy-deals', highlight: true, iconType: 'deal' },
  { label: 'ENGINES & POWERPLANTS', href: '/shop?category=engine', iconType: 'engine' },
  { label: 'SEAGULL AEROMODELS', href: '/shop?category=aeromodels', iconType: 'plane' },
  { label: 'RADIOS & RECEIVERS', href: '/shop?category=radio-receiver', iconType: 'radio' },
  { label: 'BALSA WOOD SHEETS', href: '/shop?category=balsa-wood', iconType: 'wood' },
  { label: 'FLIGHT ACCESSORIES', href: '/shop?category=accessories', iconType: 'tool' },
  { label: 'RC FLIGHT BLOG', href: '/blog', iconType: 'blog' },
  { label: 'ABOUT SKYNODESUAV', href: '/about', iconType: 'info' },
  { label: 'CONTACT US & FAQ', href: '/contact', iconType: 'contact' },
  { label: 'MY PILOT PROFILE', href: '/profile', iconType: 'profile' }
];
