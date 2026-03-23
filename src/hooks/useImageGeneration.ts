"use client";
import { useState, useCallback, useRef } from "react";
import { GenerationState } from "@/lib/types";
import { imageCache } from "@/lib/cache";
import { validateImageData } from "@/lib/output-validator";

interface GenerateOptions {
  prompt: string;
  simplifiedPrompt?: string;
  onRetry?: (attempt: number) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 7000];

export function useImageGeneration() {
  const [state, setState] = useState<GenerationState>({
    loading: false,
    error: null,
    imageData: null,
    retryCount: 0,
    fromCache: false,
    validation: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async ({ prompt, simplifiedPrompt, onRetry }: GenerateOptions) => {
    // Cancel any in-progress request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ loading: true, error: null, imageData: null, retryCount: 0, fromCache: false, validation: null });

    // Check cache first
    const cached = await imageCache.get(prompt);
    if (cached) {
      const validation = validateImageData(cached.imageData);
      setState({ loading: false, error: null, imageData: cached.imageData, retryCount: 0, fromCache: true, validation });
      return cached.imageData;
    }

    let lastError = "Generation failed";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (abortRef.current.signal.aborted) break;

      try {
        setState(prev => ({ ...prev, retryCount: attempt - 1 }));

        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, simplifiedPrompt }),
          signal: abortRef.current.signal,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const imageData: string = data.imageData;
        const validation = validateImageData(imageData);

        // Cache the result
        await imageCache.set(prompt, imageData);

        setState({ loading: false, error: null, imageData, retryCount: attempt - 1, fromCache: false, validation });
        return imageData;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") break;

        lastError = err instanceof Error ? err.message : "Generation failed";

        // Non-retryable
        if (lastError.includes("401") || lastError.includes("403") || lastError.includes("400")) {
          break;
        }

        if (attempt < MAX_RETRIES) {
          onRetry?.(attempt);
          setState(prev => ({ ...prev, retryCount: attempt }));
          await new Promise(res => setTimeout(res, RETRY_DELAYS[attempt - 1]));
        }
      }
    }

    setState(prev => ({ ...prev, loading: false, error: lastError }));
    return null;
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, error: null, imageData: null, retryCount: 0, fromCache: false, validation: null });
  }, []);

  return { ...state, generate, reset };
}
