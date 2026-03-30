import { TemplateType } from "./types";

const QUALITY_SUFFIX = `\n\nImage Quality Requirements:\n- Ultra-detailed, photorealistic or high-quality illustration\n- Cinematic lighting with dramatic shadows\n- Professional editorial photography style\n- Sharp focus, high contrast\n- Premium financial news channel thumbnail aesthetic`;

const TEMPLATE_LIGHTING: Record<TemplateType, string> = {
  "ipo-gmp": "dramatic dark studio lighting, high contrast, market data panels glowing in background",
  "ipo-allotment": "cinematic dark environment, suspenseful moody lighting, digital screens glowing",
  "ipo-listing": "cinematic high-contrast lighting, industry-specific environment",
  "stock-guide": "bright blue gradient, clean editorial lighting, professional financial backdrop",
  "stock-overview": "clean bright gradient blue, soft professional lighting, infographic style",
  "quarterly-results": "clean blue gradient studio lighting, professional financial news aesthetic, high contrast financial figures",
};

export function enhancePrompt(rawPrompt: string, templateType: TemplateType): string {
  let enhanced = rawPrompt.trim();

  // Add template-specific lighting if not present
  if (!enhanced.toLowerCase().includes("lighting")) {
    enhanced += `\n\nLighting: ${TEMPLATE_LIGHTING[templateType]}`;
  }

  // Add quality markers
  enhanced += QUALITY_SUFFIX;

  // Deduplicate consecutive whitespace
  enhanced = enhanced.replace(/\n{3,}/g, "\n\n").trim();

  // Ensure prompt isn't too long (cap at 3000 chars)
  if (enhanced.length > 3000) {
    enhanced = enhanced.substring(0, 2997) + "...";
  }

  return enhanced;
}
