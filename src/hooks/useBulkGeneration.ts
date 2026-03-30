"use client";
import { useState, useCallback } from "react";
import { BulkVariantResult } from "@/lib/types";

const VARIATION_HINTS = [
  "",
  "Alternative composition, slightly different person pose and angle.",
  "Warmer lighting, different depth of field and shadow direction.",
  "Wider framing, different background bokeh effect.",
  "Cinematic close-up, alternate person expression and head tilt.",
  "High-contrast dramatic lighting, cooler color tone.",
  "Alternate perspective angle, different person stance.",
];

function buildVariationPrompt(base: string, index: number): string {
  const hint = VARIATION_HINTS[index] ?? "";
  if (!hint) return base;
  const split = base.indexOf("\n\nSTRICT OUTPUT:");
  return split === -1
    ? base + `\n\nVariation: ${hint}`
    : base.slice(0, split) + `\n\nVariation: ${hint}` + base.slice(split);
}

async function generateOne(prompt: string, id: number): Promise<BulkVariantResult> {
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (data.success && data.imageData) {
      return { id, url: data.imageData, loading: false, error: null };
    }
    return { id, url: null, loading: false, error: data.error || "No image returned" };
  } catch (err) {
    return { id, url: null, loading: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

export function useBulkGeneration() {
  const [variants, setVariants] = useState<BulkVariantResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBulk = useCallback(async (basePrompt: string, count: number) => {
    const n = Math.max(1, Math.min(7, count));
    setIsGenerating(true);
    setVariants(
      Array.from({ length: n }, (_, i) => ({
        id: i,
        url: null,
        loading: true,
        error: null,
      }))
    );

    // Fire all N requests in parallel — each resolves independently
    const promises = Array.from({ length: n }, (_, i) =>
      generateOne(buildVariationPrompt(basePrompt, i), i).then(result => {
        setVariants(prev =>
          prev.map(v => (v.id === result.id ? result : v))
        );
        return result;
      })
    );

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setVariants([]);
    setIsGenerating(false);
  }, []);

  return { variants, isGenerating, generateBulk, reset };
}
