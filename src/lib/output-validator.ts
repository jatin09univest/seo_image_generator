import { ValidationResult } from "./types";

export function validateImageData(base64Data: string): ValidationResult {
  const warnings: string[] = [];

  // Extract format
  let format = "unknown";
  if (base64Data.startsWith("data:image/png")) format = "PNG";
  else if (base64Data.startsWith("data:image/jpeg") || base64Data.startsWith("data:image/jpg")) format = "JPEG";
  else if (base64Data.startsWith("data:image/webp")) format = "WEBP";
  else if (base64Data.startsWith("data:image/")) {
    format = base64Data.split(";")[0].split("/")[1].toUpperCase();
  }

  // Estimate size from base64
  const base64 = base64Data.split(",")[1] || base64Data;
  const sizeBytes = Math.ceil((base64.length * 3) / 4);
  const sizeKB = Math.round(sizeBytes / 1024);

  if (sizeKB > 2048) {
    warnings.push(`Image is ${Math.round(sizeKB / 1024 * 10) / 10}MB — exceeds 2MB target`);
  }

  const valid = format !== "unknown";
  return {
    valid,
    format,
    sizeKB,
    aspectRatio: "16:9 (expected)",
    warnings,
  };
}

export async function loadImageDimensions(base64Data: string): Promise<{ w: number; h: number } | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = base64Data;
  });
}
