"use client";
import { useState, useCallback, useEffect } from "react";
import { TemplateType, GenerationRecord, BulkVariantResult } from "@/lib/types";
import { sanitizeFileName } from "@/lib/zip";
import { buildPrompt } from "@/lib/prompt-builder";
import { imageCache } from "@/lib/cache";
import { compressImageForStorage } from "@/lib/storage";
import { getTemplate } from "@/lib/templates";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { useBulkGeneration } from "@/hooks/useBulkGeneration";
import TemplateSelector from "./TemplateSelector";
import TemplateForm from "./TemplateForm";
import PromptPreview from "./PromptPreview";
import ImagePreview from "./ImagePreview";
import GenerationHistory from "./GenerationHistory";
import { Sparkles, Layers, Trash2, ChevronDown, ChevronUp, RefreshCw, X, Zap, Download } from "lucide-react";
import AutomationPanel from "./AutomationPanel";

function getCompanyName(values: Record<string, string>): string {
  return values.companyName || values.stockName || values.headlineText || "Unknown";
}

export default function GeneratorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState("");
  const [contract, setContract] = useState<import("@/lib/types").ContractResult | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [variantCount, setVariantCount] = useState(3);
  const [activeTab, setActiveTab] = useState<"generator" | "automation">("generator");
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  const genHook = useImageGeneration();
  const historyHook = useGenerationHistory();
  const bulkHook = useBulkGeneration();

  // Rebuild prompt whenever template or values change
  useEffect(() => {
    if (!selectedTemplate) {
      setPrompt("");
      setContract(null);
      setBuildError(null);
      return;
    }
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    // Check required fields are filled
    const requiredFields = template.fields.filter(f => f.required);
    const allFilled = requiredFields.every(f => fieldValues[f.name]?.trim());
    if (!allFilled) {
      setPrompt("");
      setContract(null);
      setBuildError(null);
      return;
    }

    try {
      const result = buildPrompt(selectedTemplate, fieldValues);
      setPrompt(result.prompt);
      setContract(result.contract);
      setBuildError(null);
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Failed to build prompt");
      setPrompt("");
      setContract(null);
    }
  }, [selectedTemplate, fieldValues]);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTemplateSelect = useCallback((id: TemplateType) => {
    setSelectedTemplate(id);
    setFieldValues({});
    setPrompt("");
    setContract(null);
    setBuildError(null);
    genHook.reset();
    bulkHook.reset();
    setShowVariants(false);
    setSelectedVariant(null);
  }, [genHook, bulkHook]);

  // Save to history after successful generation
  const saveToHistory = useCallback(async (imageSource: string, usedPrompt: string) => {
    if (!selectedTemplate) return;
    const companyName = fieldValues.companyName || fieldValues.stockName || fieldValues.headlineText || "Unknown";
    const isUrl = imageSource.startsWith("http");
    const imageUrl = isUrl ? imageSource : await compressImageForStorage(imageSource);
    const record: GenerationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      templateType: selectedTemplate,
      companyName,
      prompt: usedPrompt,
      imageUrl,
      fullImageUrl: imageSource,
      createdAt: new Date().toISOString(),
      favorite: false,
      tags: [selectedTemplate],
    };
    historyHook.add(record);
  }, [selectedTemplate, fieldValues, historyHook]);

  const handleGenerate = useCallback(async () => {
    if (!prompt) return;
    setShowVariants(false);
    setSelectedVariant(null);
    const result = await genHook.generate({ prompt });
    if (result) {
      await saveToHistory(result, prompt);
    }
  }, [prompt, genHook, saveToHistory]);

  const handleGenerateVariants = useCallback(async () => {
    if (!prompt) return;
    setShowVariants(true);
    setSelectedVariant(null);
    await bulkHook.generateBulk(prompt, variantCount);
  }, [prompt, bulkHook, variantCount]);

  const handleSelectVariant = useCallback(async (imageSource: string) => {
    setSelectedVariant(imageSource);
    await saveToHistory(imageSource, prompt);
  }, [saveToHistory, prompt]);

  const handleClearCache = useCallback(async () => {
    await imageCache.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  }, []);

  const handleDownloadAllZip = useCallback(async () => {
    const readyVariants = bulkHook.variants.filter((variant): variant is BulkVariantResult & { url: string } => !!variant.url);
    if (readyVariants.length === 0) return;

    setDownloadingZip(true);
    try {
      const companyName = sanitizeFileName(getCompanyName(fieldValues));
      const response = await fetch("/api/download-variants-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          urls: readyVariants.map((variant) => variant.url),
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to build ZIP (${response.status})`);
      }
      const zipBlob = await response.blob();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${companyName}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download ZIP", err);
      alert(err instanceof Error ? err.message : "Failed to build ZIP file");
    } finally {
      setDownloadingZip(false);
    }
  }, [bulkHook.variants, fieldValues]);

  const handleUploadZipToDrive = useCallback(async () => {
    const readyVariants = bulkHook.variants.filter((variant): variant is BulkVariantResult & { url: string } => !!variant.url);
    if (readyVariants.length === 0) return;

    setUploadingZip(true);
    try {
      const companyName = sanitizeFileName(getCompanyName(fieldValues));
      const response = await fetch("/api/upload-variants-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          urls: readyVariants.map((variant) => variant.url),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to upload ZIP (${response.status})`);
      }

      if (data.webViewLink) {
        window.open(data.webViewLink, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to upload ZIP", err);
      alert(err instanceof Error ? err.message : "Failed to upload ZIP file");
    } finally {
      setUploadingZip(false);
    }
  }, [bulkHook.variants, fieldValues]);

  const handleSelectHistoryRecord = useCallback((record: GenerationRecord) => {
    if (record.fullImageUrl || record.imageUrl) {
      // Restore template selection and values for re-generation
      setSelectedTemplate(record.templateType);
    }
  }, []);

  const template = selectedTemplate ? getTemplate(selectedTemplate) : null;
  const companyName = getCompanyName(fieldValues);

  const canGenerate = !!prompt && !genHook.loading && !buildError;
  const activeImageData = selectedVariant || genHook.imageData;

  function getGridCols(n: number): string {
    if (n === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (n === 2) return "grid-cols-2";
    if (n <= 4) return "grid-cols-2 sm:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ background: "rgba(13,17,23,0.9)", borderColor: "var(--border)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Univest
              </span>
              <span className="text-sm ml-1.5 font-normal" style={{ color: "var(--text-muted)" }}>
                SEO Image Generator
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setActiveTab("generator")}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md font-medium transition-all"
                style={{
                  background: activeTab === "generator" ? "var(--bg-card)" : "transparent",
                  color: activeTab === "generator" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: activeTab === "generator" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                }}
              >
                <Sparkles className="w-3 h-3" />
                Generate
              </button>
              <button
                onClick={() => setActiveTab("automation")}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md font-medium transition-all"
                style={{
                  background: activeTab === "automation" ? "var(--bg-card)" : "transparent",
                  color: activeTab === "automation" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: activeTab === "automation" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                }}
              >
                <Zap className="w-3 h-3" />
                Automation
              </button>
            </div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: cacheCleared ? "#34d399" : "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {cacheCleared ? "Cache cleared!" : "Clear cache"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Automation tab */}
        {activeTab === "automation" && <AutomationPanel />}

        {activeTab === "generator" && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT PANEL: Form ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Template selector */}
            <section className="rounded-2xl p-4 sm:p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <TemplateSelector selected={selectedTemplate} onSelect={handleTemplateSelect} />
            </section>

            {/* Form */}
            {template && (
              <section className="rounded-2xl p-4 sm:p-5 animate-fade-in"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}>
                  {template.name} Details
                </p>
                <TemplateForm
                  template={template}
                  values={fieldValues}
                  onChange={handleFieldChange}
                />
              </section>
            )}

            {/* Build error */}
            {buildError && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {buildError}
              </div>
            )}

            {/* Prompt preview */}
            {template && (
              <PromptPreview
                prompt={prompt}
                onPromptChange={setPrompt}
                contract={contract}
              />
            )}

            {/* Generate buttons */}
            {template && (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Generate single image button (unchanged) */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                  style={{ background: canGenerate ? "var(--primary)" : "var(--bg-elevated)", color: "#fff" }}
                >
                  <Sparkles className="w-4 h-4" />
                  {genHook.loading ? `Generating${genHook.retryCount > 0 ? ` (retry ${genHook.retryCount}/3)` : "..."}` : "Generate Image"}
                </button>
                {/* Count selector + Generate Variants */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Divider */}
                  <div className="w-px h-6 self-center" style={{ background: "var(--border)" }} />
                  {/* Pill group */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] mr-1" style={{ color: "var(--text-muted)" }}>Variants:</span>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVariantCount(n)}
                        className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: variantCount === n ? "rgba(37,99,235,0.2)" : "var(--bg-elevated)",
                          border: variantCount === n ? "1px solid rgba(37,99,235,0.5)" : "1px solid var(--border)",
                          color: variantCount === n ? "#60a5fa" : "var(--text-secondary)",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateVariants}
                    disabled={!canGenerate || bulkHook.isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-bright)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Layers className="w-4 h-4" />
                    {bulkHook.isGenerating ? "Generating..." : `Generate ${variantCount} Variant${variantCount > 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            )}

            {/* No template selected hint */}
            {!template && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Select a template above to get started
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Preview + History ── */}
          <div className="space-y-5">

            {/* Image preview */}
            <section className="rounded-2xl p-4 sm:p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: "var(--text-muted)" }}>
                Preview
              </p>
              <ImagePreview
                imageData={activeImageData}
                loading={genHook.loading}
                retryCount={genHook.retryCount}
                fromCache={genHook.fromCache}
                validation={genHook.validation}
                error={genHook.error}
                onRetry={handleGenerate}
                companyName={fieldValues.companyName || fieldValues.stockName || "image"}
                templateType={selectedTemplate || "seo"}
              />
            </section>

            {/* History panel */}
            <section className="rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setShowHistory(v => !v)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}>
                    History
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                    {historyHook.totalCount}
                  </span>
                </div>
                {showHistory
                  ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
              </button>
              {showHistory && (
                <div className="px-4 sm:px-5 pb-4 max-h-[500px] overflow-y-auto animate-fade-in">
                  <GenerationHistory
                    history={historyHook.history}
                    totalCount={historyHook.totalCount}
                    searchQuery={historyHook.searchQuery}
                    setSearchQuery={historyHook.setSearchQuery}
                    filterType={historyHook.filterType}
                    setFilterType={historyHook.setFilterType}
                    favoritesOnly={historyHook.favoritesOnly}
                    setFavoritesOnly={historyHook.setFavoritesOnly}
                    onToggleFavorite={historyHook.toggleFav}
                    onDelete={historyHook.remove}
                    onClear={historyHook.clear}
                    onExport={historyHook.doExport}
                    onSelect={handleSelectHistoryRecord}
                  />
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── VARIANTS GRID ── */}
        {showVariants && bulkHook.variants.length > 0 && (
          <section className="mt-6 rounded-2xl p-4 sm:p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}>
                Variants — Click to select
              </p>
              <div className="flex items-center gap-2">
                {/* Download All */}
                {bulkHook.variants.some(v => v.url) && !bulkHook.isGenerating && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDownloadAllZip}
                      disabled={downloadingZip}
                      className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(37,99,235,0.18)",
                        border: "1px solid rgba(37,99,235,0.35)",
                        color: "#93c5fd",
                      }}
                    >
                      <Download className="w-3 h-3" />
                      {downloadingZip ? "Preparing ZIP..." : `ZIP: ${companyName}`}
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadZipToDrive}
                      disabled={uploadingZip}
                      className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(34,197,94,0.14)",
                        border: "1px solid rgba(34,197,94,0.28)",
                        color: "#86efac",
                      }}
                    >
                      <Zap className="w-3 h-3" />
                      {uploadingZip ? "Uploading ZIP..." : "Upload ZIP to Drive"}
                    </button>
                    {bulkHook.variants.filter(v => v.url).map(v => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a
                        key={v.id}
                        href={v.url!}
                        download={`variant-${v.id + 1}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ↓ {v.id + 1}
                      </a>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { bulkHook.reset(); setShowVariants(false); setSelectedVariant(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className={`grid gap-4 ${getGridCols(bulkHook.variants.length)}`}>
              {bulkHook.variants.map((v: BulkVariantResult) => (
                <div key={v.id} className="space-y-2">
                  <div
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedVariant === v.url && v.url ? "ring-2 ring-blue-500" : "hover:opacity-90"
                    }`}
                    onClick={() => v.url && handleSelectVariant(v.url)}
                    style={{ aspectRatio: "16/9", background: "var(--bg-elevated)" }}
                  >
                    {v.loading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          Variant {v.id + 1}
                        </span>
                      </div>
                    ) : v.error ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3">
                        <span className="text-[11px] text-red-400 text-center">{v.error}</span>
                        <button
                          onClick={e => { e.stopPropagation(); handleGenerateVariants(); }}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md mt-1"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      </div>
                    ) : v.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.url} alt={`Variant ${v.id + 1}`}
                        className="w-full h-full object-contain" style={{ background: "#000" }} />
                    ) : null}
                    {selectedVariant === v.url && v.url && (
                      <div className="absolute top-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium">
                        Selected
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
                    Variant {v.id + 1}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        </>
        )}
      </main>
    </div>
  );
}
