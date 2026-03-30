export type TemplateType =
  | "ipo-gmp"
  | "ipo-allotment"
  | "ipo-listing"
  | "stock-guide"
  | "stock-overview"
  | "quarterly-results";

export interface PersonConfig {
  gender: "Auto" | "Male" | "Female";
  ageRange: "Auto" | "Young (20-30)" | "Middle-aged (30-45)" | "Senior (45+)";
  emotion: "Auto" | "Confused" | "Shocked" | "Happy" | "Excited" | "Worried" | "Neutral" | "Angry" | "Thinking";
  profession: "Auto" | "Doctor" | "Engineer" | "Business Executive" | "Investor" | "Scientist" | "Banker" | "Student" | "Casual";
  attire: "Auto" | "Formal Suit" | "Business Casual" | "Lab Coat" | "Hard Hat + Safety Vest" | "Traditional Indian" | "Casual";
}

export const PERSON_DEFAULTS: PersonConfig = {
  gender: "Auto",
  ageRange: "Auto",
  emotion: "Auto",
  profession: "Auto",
  attire: "Auto",
};

export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  helperText?: string;
}

export interface TemplateDefinition {
  id: TemplateType;
  name: string;
  description: string;
  icon: string; // lucide icon name
  hasPerson?: boolean;
  fields: TemplateField[];
  buildPrompt: (values: Record<string, string>, personConfig?: PersonConfig) => string;
}

export interface ResolvedPerson {
  gender: string;
  age: string;
  emotion: string;
  profession: string;
  attire: string;
}

export interface ContractResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
}

export interface IntelligenceResult {
  detectedIndustry: string;
  backgroundVisuals: string[];
  personAppearance: string;
  marketContext: string;
  colorTone: "bullish-green" | "bearish-red" | "neutral-blue";
}

export interface ValidationResult {
  valid: boolean;
  format: string;
  sizeKB: number;
  dimensions?: { w: number; h: number };
  aspectRatio: string;
  warnings: string[];
}

export interface CachedImage {
  imageData: string; // base64 data URL
  prompt: string;
  createdAt: number; // timestamp
}

export interface GenerationRecord {
  id: string;
  templateType: TemplateType;
  companyName: string;
  prompt: string;
  imageUrl: string; // base64 data URL (compressed thumbnail)
  fullImageUrl?: string; // full quality, session-only
  createdAt: string; // ISO timestamp
  favorite: boolean;
  tags: string[];
}

export interface GenerationState {
  loading: boolean;
  error: string | null;
  imageData: string | null;
  retryCount: number;
  fromCache: boolean;
  validation: ValidationResult | null;
}

export interface BulkVariantResult {
  id: number;
  url: string | null;
  loading: boolean;
  error: string | null;
}
