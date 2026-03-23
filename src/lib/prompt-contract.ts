import { ContractResult, TemplateType } from "./types";

const REQUIRED_ELEMENTS = [
  { check: (p: string) => p.includes("16:9"), violation: "Missing dimension spec (16:9)" },
  { check: (p: string) => p.toLowerCase().includes("univest"), violation: "Missing Univest branding" },
  { check: (p: string) => p.toLowerCase().includes("footer") || p.toLowerCase().includes("bottom section"), violation: "Missing footer section" },
  { check: (p: string) => p.toLowerCase().includes("inter") || p.toLowerCase().includes("font"), violation: "Missing font specification" },
  { check: (p: string) => p.includes("2MB") || p.includes("file size"), violation: "Missing file size constraint" },
];

const FORBIDDEN_PATTERNS = [
  { pattern: /\b(zerodha|groww|upstox|paytm money)\b/i, violation: "Contains competitor brand name" },
  { pattern: /\b(nude|explicit|violent)\b/i, violation: "Contains inappropriate content" },
];

export function validatePrompt(prompt: string, templateType: TemplateType): ContractResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Check required elements
  for (const req of REQUIRED_ELEMENTS) {
    if (!req.check(prompt)) violations.push(req.violation);
  }

  // Check forbidden patterns
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(prompt)) violations.push(forbidden.violation);
  }

  // Warnings (non-blocking)
  if (prompt.length < 200) warnings.push("Prompt is very short — may produce inconsistent results");
  if (prompt.length > 3000) warnings.push("Prompt is very long — may cause confusion");
  if (!prompt.toLowerCase().includes("indian")) warnings.push("Consider specifying Indian person for brand consistency");

  return { valid: violations.length === 0, violations, warnings };
}
