"use client";
import { useState, useEffect } from "react";
import { ValidationResult } from "@/lib/types";
import { Download, RefreshCw, CheckCircle, AlertTriangle, Zap, ImageIcon } from "lucide-react";
import { loadImageDimensions } from "@/lib/output-validator";

interface Props {
  imageData: string | null;
  loading: boolean;
  retryCount: number;
  fromCache: boolean;
  validation: ValidationResult | null;
  error: string | null;
  onRetry: () => void;
  companyName?: string;
  templateType?: string;
}

export default function ImagePreview({
  imageData, loading, retryCount, fromCache, validation, error, onRetry,
  companyName = "image", templateType = "seo"
}: Props) {
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (imageData) {
      loadImageDimensions(imageData).then(setDimensions);
    } else {
      setDimensions(null);
    }
  }, [imageData]);

  const download = () => {
    if (!imageData) return;
    const a = document.createElement("a");
    a.href = imageData;
    a.download = `${companyName.replace(/\s+/g, "-").toLowerCase()}-${templateType}-${Date.now()}.png`;
    a.click();
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "var(--bg-elevated)" }}>
          {/* Shimmer */}
          <div className="absolute inset-0 animate-pulse" style={{ background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.05), transparent)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <div>
              <p className="text-sm font-medium text-center" style={{ color: "var(--text-secondary)" }}>
                Generating image{retryCount > 0 ? ` (retry ${retryCount}/3)` : "..."}
              </p>
              <p className="text-[11px] text-center mt-1" style={{ color: "var(--text-muted)" }}>This may take up to 60 seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !imageData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl p-8"
        style={{ aspectRatio: "16/9", background: "var(--bg-elevated)", border: "1px solid var(--border-bright)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm text-red-400">Generation Failed</p>
          <p className="text-[11px] mt-1 max-w-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{error}</p>
        </div>
        <button onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--primary)", color: "#fff" }}>
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl"
        style={{ aspectRatio: "16/9", background: "var(--bg-elevated)", border: "1px dashed var(--border-bright)" }}>
        <ImageIcon className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Generated image will appear here
        </p>
      </div>
    );
  }

  // Image result
  return (
    <div className="flex flex-col gap-3">
      {/* Image */}
      <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-bright)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageData} alt="Generated thumbnail" className="w-full" style={{ aspectRatio: "16/9", objectFit: "contain", background: "#000" }} />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {fromCache && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/80 text-purple-100 backdrop-blur-sm">
              <Zap className="w-2.5 h-2.5" /> Cached
            </span>
          )}
          {validation?.valid && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/80 text-emerald-100 backdrop-blur-sm">
              <CheckCircle className="w-2.5 h-2.5" /> Valid
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {validation && <span>{validation.format} · {validation.sizeKB}KB</span>}
          {dimensions && <span>{dimensions.w}×{dimensions.h}px</span>}
          {validation?.warnings?.map((w, i) => (
            <span key={i} className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{w}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-bright)" }}>
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
          <button onClick={download}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
