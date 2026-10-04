export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  date: string;
  publishedAt?: string;
  author: string;
  category: string;
  readTime: string;
  image: string;
  tags: string[];
  relatedCategory?: 'engine' | 'aeromodels' | 'radio-receiver' | 'balsa-wood';
}

export const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    slug: 'how-to-break-in-nitro-engine',
    title: 'Complete Guide: How to Break-in an O.S. Max Nitro Engine for Maximum Lifespan',
    excerpt: 'Step-by-step needle valve adjustment, heat-cycling process, and fuel oil ratios for your new .46 or .65 nitro engine.',
    date: 'Oct 02, 2026',
    publishedAt: '2026-10-02T10:00:00Z',
    author: 'Chief Flight Engineer K. Sharma',
    category: 'ENGINE TUNING',
    readTime: '6 min read',
    image: 'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/eng-1-1.jpg?v=1791020055',
    tags: ['Engine Tuning', 'O.S. Max', 'Nitro', 'Maintenance'],
    relatedCategory: 'engine',
    contentHtml: `
      <p class="lead">Proper break-in is the single most critical phase in the life of a two-stroke glow engine. Taking the time to properly seat the piston ring or ABC sleeve guarantees peak compression, reliable idle transitions, and hundreds of flight hours without flameouts.</p>

      <h2>Phase 1: Bench Mounting & Safe Fuel Setup</h2>
      <p>Never break in a brand new nitro engine while mounted inside an expensive fiberglass cowl or lightweight balsa airframe. Vibration during initial rich cycles can weaken motor mounts and fatigue airframe joints.</p>
      <ul>
        <li>Securely clamp the engine onto a rigid wooden test bench or specialized aluminum engine stand.</li>
        <li>Use <strong>10% to 15% nitro fuel</strong> containing at least 18% to 20% total oil lubricant (preferably a castor/synthetic blend for thermal protection).</li>
        <li>Install a standard #8 or medium glow plug and balance an appropriate break-in propeller (e.g. 11x6 for a .46 AX II).</li>
      </ul>

      <h2>Phase 2: Initial Rich Needle Setting (The "4-Cycle Burble")</h2>
      <p>Before connecting the glow starter, screw the high-speed needle valve clockwise until gently seated, then back it out <strong>2.5 to 3.0 full turns counter-clockwise</strong>. This guarantees a heavily rich fuel mixture that floods the crankcase with cooling oil.</p>
      <p>Start the engine using an electric starter. When the engine fires, remove the glow driver and listen to the exhaust note. The engine should emit a smoky, sputtering sound known as a "four-cycle burble" running at around 4,500 to 5,500 RPM.</p>

      <h2>Phase 3: Thermal Heat-Cycling Protocol</h2>
      <p>Modern ABC (Aluminum piston, Brass cylinder, Chrome plated) engines require thermal expansion to properly match the piston taper to the sleeve bore:</p>
      <ol>
        <li><strong>Run 1:</strong> Run rich for 2 minutes at 4,000 RPM. Shut off fuel supply and allow cylinder head to cool to ambient temperature.</li>
        <li><strong>Run 2:</strong> Lean the needle valve 2 clicks clockwise. Run for 3 minutes, then shut down for complete cooling.</li>
        <li><strong>Run 3 & 4:</strong> Repeat for 4 minutes with slight throttle pulses, always allowing complete cool-down between runs.</li>
      </ol>

      <h2>Phase 4: Peak Tuning & Safe Flight Setting</h2>
      <p>On your 5th tank, advance throttle to full and slowly turn the high-speed needle clockwise until maximum RPM is achieved on a tachometer. Once you find peak RPM, <strong>richen the needle by turning it counter-clockwise 200-300 RPM (about 2 to 3 clicks)</strong>.</p>
      <p>This slight rich margin prevents engine leaning when the aircraft climbs vertically and experiences fuel head-pressure drops during flight.</p>
    `
  },
  {
    id: 'blog-2',
    slug: 'choosing-first-seagull-trainer',
    title: 'Seagull Boomerang V3 vs. Arising Star V2: Which ARF Trainer Is Right For You?',
    excerpt: 'Comparing wing loading, dihedral self-leveling stability, tricycle vs. taildragger gear, and crash repairability.',
    date: 'Sep 25, 2026',
    publishedAt: '2026-09-25T10:00:00Z',
    author: 'Captain R. Verma (Lead Flight Instructor)',
    category: 'AIRFRAME COMPARISON',
    readTime: '8 min read',
    image: 'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/sea-4-1.jpg?v=1791020061',
    tags: ['Seagull Models', 'Trainer', 'ARF', 'Beginner Guide'],
    relatedCategory: 'aeromodels',
    contentHtml: `
      <p class="lead">Stepping into scale RC aviation requires an airframe that forgives orientation mistakes while teaching genuine aerodynamic discipline. Seagull Models offers two undisputed legends in the 40-size trainer segment: the <strong>Boomerang V3</strong> and the <strong>Arising Star V2</strong>.</p>

      <h2>1. Wing Geometry and Inherent Stability</h2>
      <p>The <strong>Boomerang V3</strong> features a semi-symmetrical airfoil with moderate dihedral. This gives novice pilots an automatic self-leveling tendency: if you release the aileron stick in a gentle bank, the airframe naturally tends to roll wings level.</p>
      <p>The <strong>Arising Star V2</strong>, with its slightly flatter 63" span and higher aspect ratio, offers improved glide ratios and slower stall speeds, making deadstick landing approaches remarkably stress-free.</p>

      <h2>2. Landing Gear Configurations</h2>
      <p>Tricycle landing gear (steerable nose gear + main gear) is standard on both models, keeping the propeller well clear of tarmac and grass runways during high-power takeoff rolls. The Boomerang V3 incorporates heavy-duty wire struts that absorb hard, bounce-prone beginner touchdowns without cracking fuselage bulkhead formers.</p>

      <h2>3. Engine Matching Recommendations</h2>
      <ul>
        <li><strong>Nitro 2-Stroke:</strong> An O.S. Max .46 AX II or Evolution .46 provides ample reserve thrust to pull out of low-altitude stalls.</li>
        <li><strong>Gas 2-Stroke:</strong> For pilots wanting fuel economy, a DLE 20cc provides tremendous authority with virtually zero glow-plug maintenance.</li>
      </ul>

      <h2>Verdict</h2>
      <p>If you fly on uneven grass club strips, choose the <strong>Boomerang V3</strong> for its robust gear and rugged balsa framing. If you prioritize slow, photogenic scale approaches on paved strips, the <strong>Arising Star V2</strong> is the undisputed champion.</p>
    `
  },
  {
    id: 'blog-3',
    slug: 'balsa-wood-density-guide',
    title: 'Understanding Balsa Sheet Densities: Light, Medium, and Hard Wood Selection',
    excerpt: 'How to pick between 6 lb contest grade balsa for wing ribs vs 12 lb structural balsa for fuselage formers and spar shear webs.',
    date: 'Sep 18, 2026',
    publishedAt: '2026-09-18T10:00:00Z',
    author: 'Build Specialist A. Deshmukh',
    category: 'BUILDING TECHNIQUES',
    readTime: '5 min read',
    image: 'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/balsa-sheet-1.jpg?v=1791020064',
    tags: ['Balsa Wood', 'Scratch Building', 'Airframe Tech', 'Laser Cutting'],
    relatedCategory: 'balsa-wood',
    contentHtml: `
      <p class="lead">Balsa wood is the miracle material of aeronautical engineering. Possessing one of the highest strength-to-weight ratios in nature, balsa varies dramatically in density—from 4 pounds per cubic foot (feather light) to over 16 pounds per cubic foot (hard as rock).</p>

      <h2>Why Grain and Density Matter</h2>
      <p>When selecting balsa sheets (typically 100mm wide by 1000mm long), using the wrong grain orientation or density can either add useless dead weight or cause structural flutter under high-G aerobatic maneuvers.</p>

      <h2>1. A-Grain (Tangent Cut)</h2>
      <p>Characterized by long, distinct grain lines across the sheet face. A-grain is exceptionally flexible across the width and is ideal for wrapping curved wing leading edges, fuselage turtledecks, and rounded cowl cheeks.</p>

      <h2>2. B-Grain (Intermediate Cut)</h2>
      <p>Possesses qualities of both A and C grains. Used for general utility purposes: trailing edges, wing ribs, fuselage sides, and empennage sheeting.</p>

      <h2>3. C-Grain (Quarter Sawn)</h2>
      <p>Identifiable by distinctive speckled or mottled patterns across the wood. C-grain resists bending across its width and has maximum stiffness. It is strictly recommended for wing ribs, control surface spars, and fin surfaces where torsional rigidity is essential to prevent aerodynamic flutter.</p>

      <h2>Quick Density Guide:</h2>
      <ul>
        <li><strong>Contest Density (6 - 8 lbs/cu ft):</strong> Indoor micro-flyers, trailing edge cap strips, free-flight models.</li>
        <li><strong>Medium Density (9 - 11 lbs/cu ft):</strong> Standard sport ARF construction, fuselage doublers, wing ribs.</li>
        <li><strong>Structural Hard (12 - 16 lbs/cu ft):</strong> Landing gear blocks, firewall formers, spar caps.</li>
      </ul>
    `
  },
  {
    id: 'blog-4',
    slug: 'futaba-telemetry-setup-guide',
    title: 'Mastering Futaba 2.4GHz Telemetry: Voltage Alarms and RSSI Signal Monitoring',
    excerpt: 'How to configure your Futaba 6K or 16IZ transmitter for real-time receiver battery monitoring to eliminate mid-air power loss.',
    date: 'Sep 10, 2026',
    publishedAt: '2026-09-10T10:00:00Z',
    author: 'Chief Electronics Specialist P. Joshi',
    category: 'RADIO & TELEMETRY',
    readTime: '7 min read',
    image: 'https://cdn.shopify.com/s/files/1/1026/5726/1844/files/rad-1-1.jpg?v=1791020058',
    tags: ['Futaba', 'Telemetry', 'Radio Systems', 'Safety'],
    relatedCategory: 'radio-receiver',
    contentHtml: `
      <p class="lead">Radio failsafes have come a long way. With T-FHSS bidirectional telemetry built into receivers like the Futaba R3006SB and R3008SB, your transmitter communicates constantly with your aircraft, feeding real-time receiver pack voltage and link quality straight to your hands.</p>

      <h2>The Danger of Brownouts</h2>
      <p>High-torque digital servos driving large 30cc-60cc control surfaces draw heavy instantaneous current spikes. If your onboard receiver battery voltage drops below 3.8V for even 50 milliseconds, the receiver can enter a reboot cycle, resulting in complete signal blackout.</p>

      <h2>Step 1: Binding in T-FHSS Bidirectional Mode</h2>
      <p>Ensure your Futaba transmitter's system type is set to <strong>T-FHSS Air</strong> rather than S-FHSS or FASST. Power on the receiver while holding the link switch until the LED blinks red, then turns solid green indicating a confirmed bidirectional handshake.</p>

      <h2>Step 2: Configuring Audible Receiver Battery Warnings</h2>
      <p>Navigate to the Telemetry menu on your 6K or 16IZ:</p>
      <ul>
        <li>Select <strong>Receiver Voltage</strong> sensor slot #1.</li>
        <li>For a 6.0V NiMH pack, set the critical threshold alarm to <strong>5.0V</strong>.</li>
        <li>For a 6.6V 2S LiFe pack, set the critical threshold alarm to <strong>6.0V</strong>.</li>
        <li>Configure the alarm output to <em>Vibrate + Continuous Tone</em> so it can easily be heard over screaming two-stroke gas engines on the flight line.</li>
      </ul>

      <h2>Step 3: External Voltage Monitoring (Flight Pack)</h2>
      <p>Using the CA-RVIN-700 external voltage cable, you can tap directly into your main flight pack (up to 70V / 14S LiPo) and monitor main motor battery drain in real time, bidding farewell to inaccurate flight timers forever.</p>
    `
  }
];
