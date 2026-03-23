"use client";
import { useState, useCallback } from "react";

interface VariantResult {
  id: number;
  imageData: string | null;
  loading: boolean;
  error: string | null;
}

export function useParallelGeneration() {
  const [variants, setVariants] = useState<VariantResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVariants = useCallback(async (prompt: string, count = 3) => {
    setIsGenerating(true);
    const initial: VariantResult[] = Array.from({ length: count }, (_, i) => ({
      id: i, imageData: null, loading: true, error: null
    }));
    setVariants(initial);

    const promises = initial.map(async (v) => {
      // Slightly vary prompt for each variant
      const variantPrompt = v.id === 0 ? prompt
        : v.id === 1 ? prompt + "\n\nVariation: different person angle, slightly different composition"
        : prompt + "\n\nVariation: alternative lighting and background composition";

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: variantPrompt }),
        });
        const data = await res.json();
        setVariants(prev => prev.map(pv => pv.id === v.id
          ? { ...pv, imageData: data.success ? data.imageData : null, loading: false, error: data.success ? null : data.error }
          : pv
        ));
      } catch (err) {
        setVariants(prev => prev.map(pv => pv.id === v.id
          ? { ...pv, loading: false, error: err instanceof Error ? err.message : "Failed" }
          : pv
        ));
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setVariants([]);
    setIsGenerating(false);
  }, []);

  return { variants, isGenerating, generateVariants, reset };
}
