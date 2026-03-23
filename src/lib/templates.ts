import { TemplateDefinition, PersonConfig, PERSON_DEFAULTS } from "./types";
import { analyzeContext, resolvePersonDescription } from "./prompt-intelligence";
import { injectBranding, injectPhoneText } from "./logo-injector";

const FOOTER_COMMON = (line1: string, line1Color: string, line2: string, line2Color: string, subtitle?: string) => `
Bottom Section (Footer Strip)

Create a clean white footer strip covering the bottom 45–50% of the image.

Footer Text (Centered)

Font: Inter Bold
Alignment: center

${subtitle ? `Additional Highlight Text\n"${subtitle}"\nSmaller financial-news style subtitle above the main footer text.\n\n` : ""}Line 1
${line1}

Line 2
${line2}

Typography Styling

${line1} → ${line1Color}
${line2} → ${line2Color}

Large bold headline with center alignment.`;

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
      const raw = `16:9 YouTube finance thumbnail, premium financial-news editorial style.

Top Section (Top 50–55%)

Dark cinematic background with financial market data panels on both sides showing:
- Left panel: "IPO GMP Data" with bullets: GMP: ₹${v.gmpPrice}, IPO Price: ₹${v.ipoPrice}, Est. Listing Price: ₹${v.estListingPrice}
- Right panel: "MARKET STATUS" showing INDEX and STOCK percentages
- Subtle candlestick stock charts in background

Branding Requirement

Place the Univest logo clearly at the top-right corner of the image.
Logo should be small but visible, clean white background or transparent style.
Add subtle "UNIVEST" watermark text repeated across the background at low opacity.

Person Requirement

Show one ${person.emotion} Indian ${person.gender ? person.gender + " " : ""}${person.profession}${person.attire ? " " + person.attire : ""} reacting to IPO GMP data.
Expression: ${person.emotion} while thinking
Age: ${person.age}
Position: center aligned, holding smartphone
The person should be unique and different-looking with a unique expression.

Phone Requirement

The person should hold a smartphone facing the viewer.
The mobile phone screen must display the text "${v.companyName}" in clean bold letters.

Lighting: dramatic dark studio lighting, high contrast, glowing data panels.

${FOOTER_COMMON(
  `${v.companyName} IPO`, "black",
  "GMP", "green"
)}

✅ Ensures: dark financial background, GMP data panels visible, confused person center-aligned, Univest branding, smooth top-to-bottom blend.

STRICT OUTPUT:
Dimension: 16:9
File size: less than 2MB`;
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
      const defaultEmotion = isAllotted ? "excited / happy" : "shocked / surprised";
      const person = resolvePersonDescription(
        personConfig || PERSON_DEFAULTS,
        v.companyName,
        `${v.companyName} IPO allotment`,
        defaultEmotion,
        "business professional or investor"
      );
      const raw = `16:9 YouTube finance thumbnail, premium financial-news editorial style.

Top Section (Top 50–55%)

Dark cinematic background with two IPO allotment data panels:
- Left panel: "IPO ALLOTMENT RESULTS" showing Status: ${v.allotmentStatus} (in ${isAllotted ? "green" : "red/orange"}), Shares Applied: ${v.sharesApplied}, Shares Allotted: ${v.sharesAllotted}
- Right panel: "IPO ALLOCATION STATUS" showing Investor ID: ${v.investorId || "******"}, Applied: ${v.sharesApplied} Shares, Allotted: ${v.sharesAllotted} Shares, badge: "${isAllotted ? "✓ ALLOTTED" : "⚠ NO ALLOTMENT"}" in ${isAllotted ? "green" : "yellow/amber"}
- Background: dark stock market charts and candlestick graphs

Branding Requirement

Place the Univest logo clearly at the top-right corner of the image.
Logo should be small but visible, clean white background or transparent style.
Add subtle "UNIVEST" watermark text repeated across the background at low opacity.

Person Requirement

Show one ${person.emotion} Indian ${person.gender ? person.gender + " " : ""}${person.profession}${person.attire ? " " + person.attire : ""}.
Expression: ${person.emotion}
Age: ${person.age}
Position: center, holding smartphone facing viewer
The person should be unique with a unique expression.

Phone Requirement

The person should hold a smartphone facing the viewer with "${v.companyName}" logo displayed on screen.

Lighting: cinematic dark environment, dramatic shadows, glowing screen light.

${FOOTER_COMMON(
  v.companyName, "black",
  `IPO Allotment Status`, isAllotted ? "green" : "blue"
)}

STRICT OUTPUT:
Dimension: 16:9
File size: less than 2MB`;
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
      const person = resolvePersonDescription(
        personConfig || PERSON_DEFAULTS,
        v.companyName,
        `${v.companyName} IPO listing`,
        "shocked / surprised"
      );
      const subtitle = `IPO Listing at ${v.listingPremium}% Premium at ₹${v.listingPrice} Per Share`;
      const raw = `16:9 YouTube finance thumbnail, premium financial-news editorial style.

Top Section (Top 50–55%)

Show ${v.companyName} company operations related to ${industry}:

${intel.backgroundVisuals.map(v => "- " + v).join("\n")}
- subtle stock-market charts and candlestick graphs representing IPO listing performance

This section should clearly represent ${industry} industry.

Branding Requirement

Place the Univest logo clearly at the top-right corner of the image.
Logo should be small but visible, clean white background or transparent style.
Add subtle "UNIVEST" watermark text repeated across the background at low opacity.

Person Requirement

Show one ${person.emotion} Indian ${person.gender ? person.gender + " " : ""}${person.profession}${person.attire ? " " + person.attire : ""} reacting to IPO listing news.
Expression: ${person.emotion} while checking smartphone
Age: ${person.age}
Position: center aligned

⚠️ Important rules:
Person must be unique with unique shocked facial expression.
Person should clearly look like they work in ${industry} industry.

Phone Requirement

The person should hold a smartphone facing the viewer.
The mobile phone screen must display the text "${v.companyName}" in clean bold letters.

Lighting: cinematic, high contrast, ${industry} environment.

${FOOTER_COMMON(
  `${v.companyName} IPO`, "black",
  "Listing Today", "green",
  subtitle
)}

✅ Ensures: ${industry} visuals, shocked engineer reaction, center-aligned IPO headline, Univest logo branding, smooth blend, clear phone display.

STRICT OUTPUT:
Dimension: 16:9
File size: less than 2MB`;
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
      const raw = `16:9 YouTube finance thumbnail, clean editorial financial style.

Background

Vibrant blue gradient background (from bright royal blue #1A73E8 on left to lighter sky blue on right).
Add subtle "UNIVEST" watermark text repeated across the background at low opacity, white color.
No person, no human figure.

Visual Elements (Right Side, 40% width)

Large 3D financial graphics on the right side:
- Three gold coin stacks with Indian Rupee (₹) symbols
- Green upward trending arrow chart shooting up and to the right
- Clean, professional 3D rendering style
- Warm gold color tones against the blue background

Branding Requirement

Place the Univest logo clearly at the top-right corner of the image.
Logo: white background box with "UNIVEST" text and checkmark logo.

Text Overlay (Left Side, 60% width)

Display the following text prominently:
"${v.questionText}"

Font: Inter Bold or similar heavy sans-serif
Color: white (high contrast against blue background)
Size: Very large, dominant text
Alignment: left-aligned, vertically centered
${v.subtext ? `Sub-text below: "${v.subtext}" in slightly smaller white text` : ""}

Style: clean, minimalist, no dark backgrounds, no person, bright editorial look.

STRICT OUTPUT:
Dimension: 16:9
File size: less than 2MB`;
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
      const raw = `16:9 YouTube finance thumbnail, clean infographic editorial style.

Background

Vibrant blue gradient background (from bright royal blue on left to lighter sky/teal blue on right).
Add subtle "UNIVEST" watermark text repeated across the background at low opacity, white color.

Branding Requirement

Place the Univest logo clearly at the top-right corner of the image.
Logo: white background box with "UNIVEST" text and checkmark logo.

Headline Text (Top Center)

Display prominently at the top:
"${v.headlineText}"

Font: Inter Bold, very large
Color: dark navy / black for main words, one or two accent words in orange or blue
Alignment: center, top section

Center Logo Card

In the center of the image, place a white rounded rectangle card.
Inside it, show the "${v.companyName}" logo in its brand colors (center aligned).

Subsidiary Company Pills

Arrange white rounded pill/badge shapes around the center logo card like a mind-map:
Left side (3 pills stacked): ${subs.slice(0, Math.ceil(subs.length / 2)).map(s => `"${s}"`).join(", ")}
Right side (3 pills stacked): ${subs.slice(Math.ceil(subs.length / 2)).map(s => `"${s}"`).join(", ")}
Bottom center (if needed): remaining pills

Each pill: white background, dark text, rounded corners (pill shape), Inter Bold font, centered text.

Style: clean, bright, infographic, no persons, professional financial overview.

STRICT OUTPUT:
Dimension: 16:9
File size: less than 2MB`;
      return raw;
    },
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find(t => t.id === id);
}
