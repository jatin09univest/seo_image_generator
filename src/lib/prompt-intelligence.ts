import { IntelligenceResult } from "./types";

const INDUSTRY_MAP: Record<string, { industry: string; visuals: string[]; personAppearance: string }> = {
  // Technology / IT
  tech: {
    industry: "technology and software",
    visuals: ["server racks with glowing LEDs", "code on multiple monitors", "modern data center", "cloud computing infrastructure"],
    personAppearance: "software engineer / tech professional in casual smart attire",
  },
  software: {
    industry: "technology and software",
    visuals: ["laptop with code editor", "modern open-plan tech office", "cloud infrastructure diagrams"],
    personAppearance: "software developer in casual smart attire",
  },
  // Automotive / Electronics
  automotive: {
    industry: "automotive and manufacturing",
    visuals: ["car assembly line with robotic arms", "automobile manufacturing facility", "automotive ECU and electronics manufacturing"],
    personAppearance: "automotive engineer in factory uniform / hard hat",
  },
  mechatronics: {
    industry: "automotive electronics and mechatronics",
    visuals: ["advanced automotive electronics manufacturing lab", "engineers assembling ECU modules", "precision robotics assembling circuit boards", "automated PCB testing machines"],
    personAppearance: "electronics engineer in industrial lab coat or factory uniform",
  },
  electronics: {
    industry: "electronics manufacturing",
    visuals: ["PCB manufacturing line", "semiconductor fabrication", "electronic component assembly robots", "circuit board testing equipment"],
    personAppearance: "electronics engineer / technician in lab coat",
  },
  // Pharma / Healthcare
  pharma: {
    industry: "pharmaceutical and healthcare",
    visuals: ["pharmaceutical lab with scientists", "medical research equipment", "cleanroom manufacturing facility", "clinical trial environment"],
    personAppearance: "pharmaceutical scientist / doctor in white lab coat",
  },
  hospital: {
    industry: "healthcare",
    visuals: ["modern hospital corridor", "medical equipment", "healthcare professionals"],
    personAppearance: "doctor / healthcare professional in medical scrubs",
  },
  // Energy / Infrastructure
  energy: {
    industry: "energy and infrastructure",
    visuals: ["renewable energy plant with solar panels and wind turbines", "power grid infrastructure", "energy generation facility"],
    personAppearance: "engineer in safety helmet and high-visibility vest",
  },
  solar: {
    industry: "solar energy",
    visuals: ["large solar panel farm", "solar energy generation facility", "green energy infrastructure"],
    personAppearance: "solar engineer in safety gear",
  },
  // Real Estate / Construction
  construction: {
    industry: "construction and real estate",
    visuals: ["large construction site with cranes", "modern building under construction", "real estate development project"],
    personAppearance: "civil engineer in hard hat and safety vest",
  },
  realty: {
    industry: "real estate",
    visuals: ["luxury residential buildings", "commercial real estate", "property development"],
    personAppearance: "real estate professional in business attire",
  },
  // Finance / Banking
  finance: {
    industry: "finance and banking",
    visuals: ["modern bank interior", "stock trading terminal screens", "financial charts and graphs"],
    personAppearance: "financial analyst in business suit",
  },
  bank: {
    industry: "banking and financial services",
    visuals: ["bank branch interior", "financial data on screens", "corporate finance office"],
    personAppearance: "banker in formal business attire",
  },
  // E-commerce / Retail
  retail: {
    industry: "retail and e-commerce",
    visuals: ["modern retail store", "e-commerce warehouse with packages", "retail supply chain"],
    personAppearance: "retail manager / business executive",
  },
  // FMCG / Consumer
  fmcg: {
    industry: "FMCG and consumer goods",
    visuals: ["consumer goods manufacturing facility", "product packaging line", "FMCG distribution center"],
    personAppearance: "business executive / operations manager",
  },
  food: {
    industry: "food and beverages",
    visuals: ["modern food processing facility", "food production line", "quality control lab"],
    personAppearance: "food technologist in protective gear",
  },
  // General fallback
  default: {
    industry: "financial and business",
    visuals: ["modern corporate office", "stock market trading screens", "business professionals in meeting"],
    personAppearance: "business professional in smart attire",
  },
};

function detectIndustry(companyName: string, seoTitle: string): string {
  const text = `${companyName} ${seoTitle}`.toLowerCase();
  for (const keyword of Object.keys(INDUSTRY_MAP)) {
    if (text.includes(keyword)) return keyword;
  }
  // Common company name patterns
  if (text.includes("adani")) return "energy";
  if (text.includes("tata")) return "automotive";
  if (text.includes("reliance")) return "energy";
  if (text.includes("infosys") || text.includes("wipro") || text.includes("tcs")) return "tech";
  return "default";
}

export function analyzeContext(companyName: string, seoTitle: string): IntelligenceResult {
  const key = detectIndustry(companyName, seoTitle);
  const mapping = INDUSTRY_MAP[key] || INDUSTRY_MAP.default;

  const text = `${companyName} ${seoTitle}`.toLowerCase();
  let marketContext = "neutral market conditions";
  let colorTone: IntelligenceResult["colorTone"] = "neutral-blue";

  if (text.includes("listing") || text.includes("ipo") || text.includes("premium") || text.includes("gain")) {
    marketContext = "positive market momentum and IPO activity";
    colorTone = "bullish-green";
  } else if (text.includes("loss") || text.includes("crash") || text.includes("fall") || text.includes("decline")) {
    marketContext = "negative market sentiment";
    colorTone = "bearish-red";
  }

  return {
    detectedIndustry: mapping.industry,
    backgroundVisuals: mapping.visuals,
    personAppearance: mapping.personAppearance,
    marketContext,
    colorTone,
  };
}
