const LOGO_CLAUSE = `Branding Requirement\n\nPlace the Univest logo clearly at the top-right corner of the image.\n\nLogo should be small but visible, clean white background or transparent style.\n\nIt should look like a financial platform watermark similar to stock market media brands.\n\nAdd subtle "UNIVEST" watermark text repeated across the background at low opacity.`;

const FOOTER_CLAUSE = `STRICT OUTPUT:\nDimension: 16:9\nFile size: less than 2MB`;

const BLEND_CLAUSE = `Blend Requirement\n\nThe upper image section and the lower white footer must blend smoothly using a soft gradient fade, creating a fog-style transition so the top and bottom merge naturally with no visible dividing line.`;

export function injectBranding(prompt: string): string {
  let result = prompt;
  if (!result.includes("Univest logo")) {
    result = result + `\n\n${LOGO_CLAUSE}`;
  }
  if (!result.includes("fog-style transition") && !result.includes("gradient fade")) {
    result = result + `\n\n${BLEND_CLAUSE}`;
  }
  if (!result.includes("STRICT OUTPUT")) {
    result = result + `\n\n${FOOTER_CLAUSE}`;
  }
  return result;
}

export function injectPhoneText(prompt: string, companyName: string): string {
  if (!prompt.includes("smartphone") && !prompt.includes("phone screen")) return prompt;
  if (!prompt.includes(companyName)) {
    return prompt + `\n\nPhone screen must display "${companyName}" in clean bold letters.`;
  }
  return prompt;
}
