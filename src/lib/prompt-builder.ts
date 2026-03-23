import { TemplateType, ContractResult } from "./types";
import { getTemplate } from "./templates";
import { enhancePrompt } from "./prompt-enhancer";
import { injectBranding } from "./logo-injector";
import { validatePrompt } from "./prompt-contract";

export interface BuildResult {
  prompt: string;
  contract: ContractResult;
  enhanced: boolean;
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
  let prompt = template.buildPrompt(values);

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
