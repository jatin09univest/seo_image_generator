import { TemplateType, ContractResult, PersonConfig } from "./types";
import { getTemplate } from "./templates";
import { enhancePrompt } from "./prompt-enhancer";
import { injectBranding } from "./logo-injector";
import { validatePrompt } from "./prompt-contract";

export interface BuildResult {
  prompt: string;
  contract: ContractResult;
  enhanced: boolean;
}

function extractPersonConfig(values: Record<string, string>): PersonConfig {
  return {
    gender: (values.person_gender as PersonConfig["gender"]) || "Auto",
    ageRange: (values.person_ageRange as PersonConfig["ageRange"]) || "Auto",
    emotion: (values.person_emotion as PersonConfig["emotion"]) || "Auto",
    profession: (values.person_profession as PersonConfig["profession"]) || "Auto",
    attire: (values.person_attire as PersonConfig["attire"]) || "Auto",
  };
}

export function buildPrompt(
  templateId: TemplateType,
  values: Record<string, string>,
  options: { enhance?: boolean } = { enhance: true }
): BuildResult {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Template "${templateId}" not found`);

  // Validate required fields
  const missing = template.fields
    .filter(f => f.required && !values[f.name]?.trim())
    .map(f => f.label);
  if (missing.length > 0) throw new Error(`Missing required fields: ${missing.join(", ")}`);

  // Build raw prompt
  const personConfig = template.hasPerson ? extractPersonConfig(values) : undefined;
  let prompt = template.buildPrompt(values, personConfig);

  // Inject branding
  prompt = injectBranding(prompt);

  // Optionally enhance
  if (options.enhance !== false) {
    prompt = enhancePrompt(prompt, templateId);
  }

  // Validate against contract
  const contract = validatePrompt(prompt, templateId);

  return { prompt, contract, enhanced: options.enhance !== false };
}
