import { TemplateDefinition, PersonConfig, PERSON_DEFAULTS } from "./types";
import { analyzeContext, resolvePersonDescription } from "./prompt-intelligence";
import { injectBranding, injectPhoneText } from "./logo-injector";

// ─── Shared footer strip used across IPO templates ────────────────────────────
const FOOTER_COMMON = (
  line1: string, line1Color: string,
  line2: string, line2Color: string,
  subtitle?: string
) => `
BOTTOM SECTION — White Footer Strip (bottom 45% of canvas)

Render a clean, solid white (#FFFFFF) rectangular strip covering the bottom 45–48% of the image.
No gradient. No texture. Pure white.

Text Layout inside footer (vertically centered, horizontally centered):
${subtitle
  ? `Subtitle line (topmost, smaller): "${subtitle}"  — Inter SemiBold, 18–20px equivalent, color #475569 (slate-600)`
  : ""}
Line 1 (main company / subject): "${line1}"
  → Font: Inter Black or Inter ExtraBold
  → Color: ${line1Color === "black" ? "#0f172a (near-black)" : line1Color}
  → Size: VERY LARGE — dominant, fills ~60% of footer width
  → Letter spacing: tight

Line 2 (template label / action): "${line2}"
  → Font: Inter Bold
  → Color: ${line2Color === "green" ? "#16a34a (emerald green)" : line2Color === "blue" ? "#2563eb" : line2Color}
  → Size: LARGE — roughly 80% the size of Line 1

Typography rules:
- All text must be anti-aliased, sharp, no blur
- Minimum contrast ratio 7:1 against white background
- No text overlap with upper image section
- Footer strip has a subtle 1px top shadow line (#e2e8f0) to separate it from the dark top section`;

export const TEMPLATES: TemplateDefinition[] = [

  // ── 1. IPO GMP ──────────────────────────────────────────────────────────────
  {
    id: "ipo-gmp",
    name: "IPO GMP",
    description: "Grey Market Premium data with confused person holding phone",
    icon: "TrendingUp",
    hasPerson: true,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", placeholder: "e.g. Novus Loyalty", required: true },
      { name: "gmpPrice", label: "GMP Price (₹)", type: "number", placeholder: "e.g. 42", required: true },
      { name: "ipoPrice", label: "IPO Price (₹)", type: "number", placeholder: "e.g. 140", required: true },
      { name: "estListingPrice", label: "Est. Listing Price (₹)", type: "number", placeholder: "e.g. 182", required: true },
      { name: "seoTitle", label: "SEO Title", type: "text", placeholder: "e.g. Novus Loyalty IPO GMP Today", required: false, defaultValue: "" },
    ],
    buildPrompt: (v, personConfig) => {
      const intel = analyzeContext(v.companyName, v.seoTitle || `${v.companyName} IPO GMP`);
      const person = resolvePersonDescription(
        personConfig || PERSON_DEFAULTS,
        v.companyName,
        v.seoTitle || `${v.companyName} IPO GMP`,
        "confused / worried"
      );
      const raw = `TASK: Generate a high-CTR 16:9 YouTube finance thumbnail for "${v.companyName} IPO GMP".

CANVAS: 1280×720px, 16:9 aspect ratio.

━━━ TOP SECTION (upper 52% of canvas) ━━━

Background: Very dark navy (#0a0f1e) with a subtle radial glow of deep blue-purple in the center. Add faint glowing candlestick chart lines across the background at 8% opacity — barely visible, atmospheric only. DO NOT make chart lines prominent or readable.

Layout: Three-zone horizontal split in the top section.

ZONE A — LEFT DATA PANEL (leftmost 28% of canvas width):
Render a dark glass-morphism card (background: rgba(15,23,42,0.85), border: 1px solid rgba(99,179,237,0.3), rounded corners 12px, subtle glow):
  Header: "IPO GMP DATA" — Inter Bold, uppercase, 13px, color #93c5fd (light blue), letter-spacing 2px
  Divider line: #1e3a5f
  Row 1: Label "GMP"         → Value "₹${v.gmpPrice}"          (green #22c55e, bold, large)
  Row 2: Label "IPO Price"   → Value "₹${v.ipoPrice}"          (white, bold)
  Row 3: Label "Est. Listing"→ Value "₹${v.estListingPrice}"   (amber #fbbf24, bold)
  Each label: Inter Regular, 11px, color #94a3b8. Each value: Inter Bold, 16px.

ZONE B — CENTER (middle 44% of canvas width):
Person: A single Indian ${person.gender ? person.gender : "person"}, age ${person.age}, ${person.profession}${person.attire ? ", wearing " + person.attire : ""}.
Expression: VISIBLY ${person.emotion.toUpperCase()} — eyebrows raised, mouth slightly open, eyes wide. Expression must be unmistakable and authentic.
Pose: Slight turn toward camera, holding a modern smartphone at chest height with the screen facing the viewer.
Smartphone screen: Display "${v.companyName}" in bold white text on a dark app screen. Text must be legible.
Lighting: Strong key light from top-left (cool blue-white), subtle fill light on right. Face fully lit. No silhouette.
Position: Centered horizontally, occupying 70–80% of the zone height. No cropping of face.

ZONE C — RIGHT DATA PANEL (rightmost 28% of canvas width):
Render another dark glass-morphism card (same styling as Zone A):
  Header: "MARKET STATUS" — same style as Zone A header
  Divider line: #1e3a5f
  Row 1: Label "Nifty 50"    → Value "+0.48%" (green #22c55e)
  Row 2: Label "Sensex"      → Value "+142 pts" (green #22c55e)
  Row 3: Label "GMP Signal"  → Value "POSITIVE" (bold, green, with ✓ prefix)

BRANDING:
Top-right corner: Univest logo badge — white rounded-rectangle (padding 6px 10px), contains "UNIVEST" text in bold dark navy + a blue checkmark icon. Size: roughly 90×30px. Placed 12px from top, 12px from right. DO NOT overlap person's face.

━━━ BOTTOM SECTION (lower 48% of canvas) ━━━
${FOOTER_COMMON(
  `${v.companyName} IPO`, "black",
  "GMP Today", "green"
)}

━━━ GLOBAL RULES ━━━
- All text in image must be SHARP, anti-aliased, no blur or distortion
- Financial numbers (₹${v.gmpPrice}, ₹${v.ipoPrice}, ₹${v.estListingPrice}) must be clearly readable
- Person must NOT overlap the data panels — keep them in their respective zones
- No watermarks, no stock photo logos, no extra text beyond what is specified
- The top dark section and white footer must have a clean hard edge — no feathering
- Overall composition: thumbnail must communicate "IPO data available" at a glance even at 320×180px preview size

STRICT OUTPUT: 16:9 · under 2MB`;
      return injectPhoneText(raw, v.companyName);
    },
  },

  // ── 2. IPO Allotment Status ──────────────────────────────────────────────────
  {
    id: "ipo-allotment",
    name: "IPO Allotment",
    description: "Allotment status with shocked person holding phone",
    icon: "ClipboardList",
    hasPerson: true,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", placeholder: "e.g. Novus Loyalty", required: true },
      { name: "allotmentStatus", label: "Allotment Status", type: "select", options: ["NOT ALLOTTED", "ALLOTTED"], required: true, defaultValue: "NOT ALLOTTED" },
      { name: "sharesApplied", label: "Shares Applied", type: "number", placeholder: "e.g. 200", required: true },
      { name: "sharesAllotted", label: "Shares Allotted", type: "number", placeholder: "e.g. 0", required: true },
      { name: "investorId", label: "Investor ID (masked)", type: "text", placeholder: "e.g. ******", required: false, defaultValue: "******" },
    ],
    buildPrompt: (v, personConfig) => {
      const isAllotted = v.allotmentStatus === "ALLOTTED";
      const statusColor = isAllotted ? "#16a34a" : "#dc2626";
      const statusBg = isAllotted ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)";
      const statusBadge = isAllotted ? "✓  ALLOTTED" : "✗  NOT ALLOTTED";
      const defaultEmotion = isAllotted ? "excited / happy" : "shocked / surprised";
      const person = resolvePersonDescription(
        personConfig || PERSON_DEFAULTS,
        v.companyName,
        `${v.companyName} IPO allotment`,
        defaultEmotion,
        "business professional or investor"
      );
      const raw = `TASK: Generate a high-CTR 16:9 YouTube finance thumbnail for "${v.companyName} IPO Allotment Status".

CANVAS: 1280×720px, 16:9 aspect ratio.

━━━ TOP SECTION (upper 52% of canvas) ━━━

Background: Deep dark slate (#080d1a) with atmospheric candlestick chart lines at 6% opacity. Faint ${isAllotted ? "green" : "red"} radial glow behind the status badge area.

Layout: Three-zone split.

ZONE A — LEFT (leftmost 30%):
Dark glass card (background: rgba(15,23,42,0.9), border: 1px rgba(148,163,184,0.2), radius 12px):
  Header: "ALLOTMENT RESULT" — Inter Bold, uppercase, 11px, #93c5fd, tracking 2px
  Divider: #1e3a5f
  Row 1: "Status"            → "${v.allotmentStatus}" in ${statusColor}, bold, 15px
  Row 2: "Shares Applied"    → "${v.sharesApplied}" in white, bold
  Row 3: "Shares Allotted"   → "${v.sharesAllotted}" in ${isAllotted ? "#22c55e" : "#f87171"}, bold
  Row 4: "Investor ID"       → "${v.investorId || "******"}" in #94a3b8, monospace

ZONE B — CENTER (middle 40%):
Person: Single Indian ${person.gender ? person.gender : "person"}, age ${person.age}, ${person.profession}${person.attire ? ", " + person.attire : ""}.
Expression: Extremely ${person.emotion.toUpperCase()} — this must be the most expressive element of the image. ${isAllotted ? "Big genuine smile, raised fist or thumbs up." : "Wide eyes, hand on face/head, jaw dropped."}
Pose: Holding smartphone at chest level, screen facing viewer.
Smartphone screen: Shows "${v.companyName}" app with a clear "${isAllotted ? "✓ ALLOTTED" : "✗ REJECTED"}" indicator.
Lighting: ${isAllotted ? "Warm golden key light from above, celebratory feel." : "Cool blue-white key light, dramatic shadows."}
Position: Fills 75% of zone height. No face cropping.

ZONE C — RIGHT (rightmost 30%):
Dark glass card (same styling):
  Header: "IPO ALLOCATION" — same style
  Divider: #1e3a5f
  CENTER BADGE (prominent, must dominate this panel):
    Rounded rectangle badge, background: ${statusBg}, border: 2px solid ${statusColor}
    Text: "${statusBadge}"
    Font: Inter ExtraBold, 18px, color ${statusColor}
    Padding: 12px 20px
  Below badge:
  Row 1: "Applied"    → "${v.sharesApplied} Shares" in white
  Row 2: "Allotted"  → "${v.sharesAllotted} Shares" in ${isAllotted ? "#22c55e" : "#f87171"}

BRANDING:
Top-right: Univest badge (white bg, "UNIVEST" + checkmark, ~90×30px), 12px margins. Must not overlap person's face.

━━━ BOTTOM SECTION (lower 48% of canvas) ━━━
${FOOTER_COMMON(
  v.companyName, "black",
  `IPO Allotment — ${v.allotmentStatus}`, isAllotted ? "green" : "#dc2626"
)}

━━━ GLOBAL RULES ━━━
- Status "${v.allotmentStatus}" must be the most visually prominent text in the top section
- Person's emotional expression must be extreme and unmistakable
- All financial numbers legible at thumbnail preview size (320×180px)
- No extra decorative text, no stock watermarks
- Hard clean edge between dark top and white footer

STRICT OUTPUT: 16:9 · under 2MB`;
      return injectPhoneText(raw, v.companyName);
    },
  },

  // ── 3. IPO Listing ───────────────────────────────────────────────────────────
  {
    id: "ipo-listing",
    name: "IPO Listing",
    description: "Listing day with industry visuals and shocked person",
    icon: "Rocket",
    hasPerson: true,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", placeholder: "e.g. SEDEMAC Mechatronics", required: true },
      { name: "industry", label: "Industry (auto-detected if blank)", type: "text", placeholder: "e.g. automotive electronics", required: false, defaultValue: "" },
      { name: "listingPrice", label: "Listing Price (₹)", type: "number", placeholder: "e.g. 1535", required: true },
      { name: "listingPremium", label: "Listing Premium (%)", type: "number", placeholder: "e.g. 13.54", required: true },
      { name: "ipoPrice", label: "IPO Issue Price (₹)", type: "number", placeholder: "e.g. 1352", required: false },
    ],
    buildPrompt: (v, personConfig) => {
      const intel = analyzeContext(v.companyName, `${v.companyName} IPO listing`);
      const industry = v.industry || intel.detectedIndustry;
      const premiumPositive = !String(v.listingPremium).startsWith("-");
      const premiumColor = premiumPositive ? "#22c55e" : "#ef4444";
      const person = resolvePersonDescription(
        personConfig || PERSON_DEFAULTS,
        v.companyName,
        `${v.companyName} IPO listing`,
        "shocked / surprised"
      );
      const subtitle = `Listed at ₹${v.listingPrice} · ${premiumPositive ? "+" : ""}${v.listingPremium}% Premium`;
      const raw = `TASK: Generate a high-CTR 16:9 YouTube finance thumbnail for "${v.companyName} IPO Listing Day".

CANVAS: 1280×720px, 16:9 aspect ratio.

━━━ TOP SECTION (upper 52% of canvas) ━━━

Background: Industry-authentic environment for "${industry}" — show real-world visuals:
${intel.backgroundVisuals.map(b => `  • ${b}`).join("\n")}
  • Subtle stock-market ticker overlay at 12% opacity (green/red numbers scrolling)
Apply a dark cinematic vignette (0.65 opacity dark layer) over the background so text and person remain highly readable.
DO NOT let background visuals compete with the person or data — they are atmospheric only.

Layout: Two-zone split.

ZONE A — LEFT SIDE (leftmost 35%):
Dark semi-transparent panel (rgba(8,13,26,0.88), radius 12px, border 1px rgba(99,179,237,0.2)):
  Header: "IPO LISTING" — Inter Black, 22px, white, uppercase
  Sub-header: "${v.companyName}" — Inter Bold, 16px, #93c5fd

  PREMIUM BADGE (most prominent element in this panel):
    Large rounded badge:
    Background: ${premiumPositive ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}
    Border: 2px solid ${premiumColor}
    Text: "${premiumPositive ? "↑" : "↓"} ${premiumPositive ? "+" : ""}${v.listingPremium}% PREMIUM"
    Font: Inter ExtraBold, 28px, color ${premiumColor}
    This badge must be the largest, most eye-catching element in the panel.

  Below badge:
  Row: "Listing Price"  → "₹${v.listingPrice} / share" — Inter Bold, 16px, white
  ${v.ipoPrice ? `Row: "Issue Price"   → "₹${v.ipoPrice}" — Inter Regular, 13px, #94a3b8` : ""}

ZONE B — RIGHT SIDE (rightmost 65%):
Person: Single Indian ${person.gender ? person.gender : "person"}, age ${person.age}, clearly from ${industry} industry background (${person.attire ? person.attire : "appropriate professional attire"}).
Expression: VISIBLY SHOCKED / SURPRISED — wide eyes, open mouth, eyebrows raised dramatically. The shock must read instantly.
Pose: Holding smartphone, slight lean-forward toward camera. Screen shows "${v.companyName}".
Lighting: Warm dramatic key light from upper-left, rim light on opposite side. No flat lighting.
Position: Right-center aligned, occupying 80% of zone height. Face fully visible, no cropping.

BRANDING:
Top-right corner: Univest badge (white, "UNIVEST" + checkmark), ~90×30px, 12px margins.

━━━ BOTTOM SECTION (lower 48% of canvas) ━━━
${FOOTER_COMMON(
  `${v.companyName} IPO`, "black",
  "Listing Today", "green",
  subtitle
)}

━━━ GLOBAL RULES ━━━
- The premium percentage (${v.listingPremium}%) must be the most prominent number in the entire image
- Person emotion must be instantly readable at thumbnail size
- Industry background must NOT obscure person or data panel
- Hard clean edge between dark top and white footer strip
- No stock watermarks, no extra decorative text

STRICT OUTPUT: 16:9 · under 2MB`;
      return injectPhoneText(raw, v.companyName);
    },
  },

  // ── 4. Stock Investment Guide ─────────────────────────────────────────────────
  {
    id: "stock-guide",
    name: "Stock Guide",
    description: "Blue gradient with financial graphics and investment question",
    icon: "BookOpen",
    fields: [
      { name: "stockName", label: "Stock / Company Name", type: "text", placeholder: "e.g. Adani Group", required: true },
      { name: "questionText", label: "Headline Question", type: "text", placeholder: "e.g. How to Invest in Adani Group Stocks in India?", required: true },
      { name: "subtext", label: "Sub-text (optional)", type: "text", placeholder: "e.g. Best Stocks for 2026", required: false },
    ],
    buildPrompt: (v) => {
      const raw = `TASK: Generate a high-CTR 16:9 YouTube finance thumbnail for a stock investment guide about "${v.stockName}".

CANVAS: 1280×720px, 16:9 aspect ratio.
NO PERSON. Text-dominant, clean editorial design.

━━━ BACKGROUND ━━━
Full-canvas vibrant blue gradient: left edge #1A73E8 (Google Blue) → right edge #0ea5e9 (sky blue).
Direction: left-to-right linear gradient.
Add very subtle "UNIVEST" repeated diagonal watermark text at 5% white opacity — barely perceptible texture.
NO dark background. NO black. Pure bright blue throughout.

━━━ LEFT ZONE — TEXT HERO (leftmost 60% of canvas) ━━━
Vertically centered block of text:

Main headline:
"${v.questionText}"
  → Font: Inter Black (900 weight) or equivalent heavy sans-serif
  → Color: #FFFFFF (pure white)
  → Size: As large as possible while fitting within the left 60% zone with 40px padding
  → Line height: 1.2
  → Max 3 lines — if text wraps, break at natural phrase boundaries
  → Text must be RAZOR SHARP. No glow, no blur, no drop shadow (white on blue has sufficient contrast)
  → Letter spacing: -0.5px (tight)

${v.subtext ? `Sub-text line (below main headline, 20px gap):
"${v.subtext}"
  → Font: Inter SemiBold, roughly 60% the size of headline
  → Color: #e0f2fe (very light blue-white)
  → Same left alignment` : ""}

━━━ RIGHT ZONE — VISUAL ELEMENT (rightmost 40% of canvas) ━━━
Render ONE large, clean 3D financial illustration:
  • THREE stacked gold coin towers with Indian Rupee (₹) symbols embossed
  • A bold green upward-trending arrow chart launching from bottom-right to top-right, thick stroke
  • Coins: warm gold (#f59e0b to #d97706 gradient), high specular highlight
  • Arrow: bright #22c55e, thick (8–10px equivalent), no outline
  • 3D perspective: slight front-angle isometric view
  • Clean shadows beneath coins on invisible ground plane
  • NO text on the financial illustration itself
  • Elements fill the right zone without bleeding into left text zone

BRANDING:
Top-right corner: Univest badge (white rounded rectangle, "UNIVEST" + blue checkmark, ~90×30px), 16px from top and right edges. Placed ABOVE the 3D illustration.

━━━ GLOBAL RULES ━━━
- Entire background is BRIGHT BLUE — no dark sections, no footer strip for this template
- Headline text must be the dominant element: viewer reads it first
- No human figures, no stock photo elements
- Clean, minimalist, editorial — inspired by Forbes / CNBC thumbnail style
- Legible at 320×180px preview: headline must still be readable at small size

STRICT OUTPUT: 16:9 · under 2MB`;
      return raw;
    },
  },

  // ── 5. Stock Overview / List ──────────────────────────────────────────────────
  {
    id: "stock-overview",
    name: "Stock Overview",
    description: "Blue gradient with company logo and subsidiary pills",
    icon: "LayoutGrid",
    fields: [
      { name: "companyName", label: "Company / Group Name", type: "text", placeholder: "e.g. Adani Group", required: true },
      { name: "headlineText", label: "Headline Text", type: "text", placeholder: "e.g. Adani Group Stocks in India for 2026", required: true },
      { name: "subsidiaries", label: "Subsidiaries / Related Companies (comma-separated)", type: "textarea", placeholder: "e.g. Adani Enterprises Ltd, Adani Green Energy, Adani Ports, Adani Power Ltd, Adani Wilmar Ltd, Adani Total Gas Ltd, ACC Ltd", required: true },
    ],
    buildPrompt: (v) => {
      const subs = v.subsidiaries.split(",").map(s => s.trim()).filter(Boolean);
      const leftSubs = subs.slice(0, Math.ceil(subs.length / 2));
      const rightSubs = subs.slice(Math.ceil(subs.length / 2));
      const raw = `TASK: Generate a high-CTR 16:9 YouTube finance thumbnail showing all ${v.companyName} group companies.

CANVAS: 1280×720px, 16:9 aspect ratio.
NO PERSON. Infographic / mind-map layout.

━━━ BACKGROUND ━━━
Full-canvas vibrant blue gradient: left edge #1e40af (royal blue) → right edge #0284c7 (sky blue).
Add very subtle "UNIVEST" diagonal watermark text at 4% white opacity for texture.
Pure bright blue throughout — no dark sections.

━━━ TOP ZONE — HEADLINE (top 18% of canvas) ━━━
Headline text, horizontally centered:
"${v.headlineText}"
  → Font: Inter Black, as large as possible in one line (or max 2 lines)
  → Primary words: dark navy #0f172a (creates strong contrast on blue)
  → Accent: highlight "${v.companyName}" in orange #f97316 or white — make it pop
  → No background behind text. Text directly on gradient.

━━━ CENTER ZONE — LOGO CARD + MIND MAP (middle 64% of canvas) ━━━

CENTER LOGO CARD:
  White rounded rectangle card, exactly centered on canvas:
  Width: ~22% of canvas width. Height: proportional (~20% of canvas height).
  Corner radius: 16px. Drop shadow: 0 8px 32px rgba(0,0,0,0.25).
  Inside: Display "${v.companyName}" as a text logo in its brand colors — Inter Black, centered.
  White card background ensures brand colors display correctly.

SUBSIDIARY PILLS — arranged as a mind-map / spoke pattern around the center card:
Each pill: white (#ffffff) rounded rectangle, Inter Bold, dark navy text (#0f172a), corner radius 20px, horizontal padding 14px, vertical padding 8px, subtle drop shadow.
Pill text must be fully readable — font size minimum 11px equivalent. No truncation.

LEFT COLUMN (${leftSubs.length} pills, vertically stacked, left of center card, connected by thin lines to card):
${leftSubs.map((s, i) => `  Pill ${i + 1}: "${s}"`).join("\n")}

RIGHT COLUMN (${rightSubs.length} pills, vertically stacked, right of center card, connected by thin lines to card):
${rightSubs.map((s, i) => `  Pill ${i + 1}: "${s}"`).join("\n")}

Connector lines: thin white lines (1.5px, 30% opacity) from each pill to center card edges — gives mind-map feel.
Spacing: pills evenly distributed vertically. No overlapping.

━━━ BOTTOM ZONE (bottom 18% of canvas) ━━━
Light blue semi-transparent bar (rgba(255,255,255,0.12)) spanning full width.
Center text: "Complete Group Overview · Powered by Univest"
Font: Inter SemiBold, 13px, white, letter-spacing 1px.

BRANDING:
Top-right: Univest badge (white bg, "UNIVEST" + checkmark, ~90×30px), 14px margins.

━━━ GLOBAL RULES ━━━
- All pill text must be sharp and readable
- Headline must be the first thing the eye lands on
- Mind-map layout must feel organized, not cluttered
- No human figures. Pure infographic editorial style.
- Legible at 320×180px preview size

STRICT OUTPUT: 16:9 · under 2MB`;
      return raw;
    },
  },

  // ── 6. Quarterly Results ─────────────────────────────────────────────────────
  {
    id: "quarterly-results",
    name: "Quarterly Results",
    description: "Financial results with revenue, profit, and YoY growth data",
    icon: "BarChart2",
    hasPerson: false,
    fields: [
      { name: "companyName", label: "Company Name", type: "text", placeholder: "e.g. Infosys", required: true },
      { name: "quarter", label: "Quarter", type: "text", placeholder: "e.g. Q3 FY 2025-26", required: true },
      { name: "revenue", label: "Revenue (₹ Cr)", type: "number", placeholder: "e.g. 41764", required: true },
      { name: "netProfit", label: "Net Profit (₹ Cr)", type: "number", placeholder: "e.g. 6806", required: true },
      { name: "revenueYoY", label: "Revenue YoY %", type: "text", placeholder: "e.g. +12% or -5%", required: true },
      { name: "profitYoY", label: "Net Profit YoY %", type: "text", placeholder: "e.g. +8% or -3%", required: true },
      { name: "headline", label: "Headline Override (optional)", type: "text", placeholder: "e.g. Record Quarter!", required: false, defaultValue: "" },
    ],
    buildPrompt: (v) => {
      const revenuePositive = !v.revenueYoY.startsWith("-");
      const profitPositive = !v.profitYoY.startsWith("-");
      const revenueColor = revenuePositive ? "#16a34a" : "#dc2626";
      const profitColor = profitPositive ? "#16a34a" : "#dc2626";
      const revBg = revenuePositive ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)";
      const profBg = profitPositive ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)";
      const headline = v.headline || `${v.companyName} Q Results`;
      return `TASK: Generate a high-CTR 16:9 YouTube finance thumbnail for "${v.companyName} ${v.quarter} Quarterly Results".

CANVAS: 1280×720px, 16:9 aspect ratio.
NO PERSON. Data-driven, clean financial news design.

━━━ BACKGROUND ━━━
Full-canvas deep navy gradient: #0f172a (left) → #1e3a5f (right), with very subtle diagonal grid lines at 4% white opacity.
The grid adds depth without clutter. No other background elements.

━━━ TOP STRIP — COMPANY + QUARTER TAG (top 15% of canvas) ━━━
Two elements horizontally aligned:

Left-center: Company name "${v.companyName}"
  → Font: Inter Black, very large (50–60px equivalent)
  → Color: #FFFFFF
  → No background

Right side: Quarter tag "${v.quarter}"
  → Rounded pill badge: background #1e40af (blue), border: 1px solid #3b82f6
  → Font: Inter Bold, 18px, color #bfdbfe (light blue)
  → Padding: 8px 16px

━━━ CENTER HERO — HEADLINE STRIP (next 12% of canvas) ━━━
Full-width semi-transparent strip (rgba(255,255,255,0.06), 1px top + bottom border at rgba(255,255,255,0.1)):
Centered text: "${headline}"
  → Font: Inter SemiBold, 22px, color #e2e8f0 (light gray-white)
  → Letter spacing: 0.5px

━━━ MAIN DATA SECTION (middle 45% of canvas) ━━━
Two side-by-side data cards, centered horizontally with 24px gap between them. Each card ~42% of canvas width.

LEFT CARD — Revenue:
  White (#FFFFFF) rounded rectangle, radius 16px, drop shadow: 0 12px 40px rgba(0,0,0,0.35)
  INSIDE (top-to-bottom layout):
    Row 1: Label "REVENUE" — Inter Bold, 13px, #64748b (gray), uppercase, letter-spacing 2px
    Divider line: #e2e8f0
    Row 2: Value "₹${v.revenue} Cr"
      → Font: Inter Black, 36px equivalent, color #0f172a (near black)
      → This is the DOMINANT text in this card
    Row 3: YoY Badge:
      Rounded pill, background: ${revBg}, border: 1.5px solid ${revenueColor}
      Text: "${v.revenueYoY} YoY"
      Font: Inter ExtraBold, 20px, color ${revenueColor}
      Icon prefix: ${revenuePositive ? "▲" : "▼"} symbol in same color
    Card padding: 24px all sides

RIGHT CARD — Net Profit:
  Same card styling as Left Card
  INSIDE:
    Row 1: Label "NET PROFIT" — same label style
    Divider line: #e2e8f0
    Row 2: Value "₹${v.netProfit} Cr"
      → Same dominant text style, color #0f172a
    Row 3: YoY Badge:
      Rounded pill, background: ${profBg}, border: 1.5px solid ${profitColor}
      Text: "${v.profitYoY} YoY"
      Font: Inter ExtraBold, 20px, color ${profitColor}
      Icon prefix: ${profitPositive ? "▲" : "▼"} symbol
    Card padding: 24px all sides

━━━ BOTTOM STRIP (bottom 15% of canvas) ━━━
Dark strip (rgba(0,0,0,0.3)) spanning full width, height ~15% canvas.
Three elements centered horizontally:
  Left: Small "Q Results" label in #64748b, Inter Regular, 12px
  Center: "Powered by UNIVEST" with Univest logo icon — white text, Inter Bold, 14px
  Right: Quarter tag "${v.quarter}" in #93c5fd, Inter SemiBold, 12px
Separator dots between elements.

BRANDING:
Top-right: Univest badge (white bg, "UNIVEST" + checkmark, ~90×30px), 14px margins.

━━━ GLOBAL RULES ━━━
- Revenue and Net Profit numbers (₹${v.revenue} Cr, ₹${v.netProfit} Cr) must be the largest, most readable text
- YoY badges (${v.revenueYoY}, ${v.profitYoY}) must pop with color — green or red, no ambiguity
- White cards must be bright white, not off-white or gray
- All text anti-aliased, sharp, legible at 320×180px preview
- No human figures, no stock photo elements, no extra decorative icons

STRICT OUTPUT: 16:9 · under 2MB`;
    },
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find(t => t.id === id);
}
