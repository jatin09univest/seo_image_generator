"use client";
import { useState } from "react";
import { ContractResult } from "@/lib/types";
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  prompt: string;
  onPromptChange: (p: string) => void;
  contract: ContractResult | null;
  isOpen?: boolean;
}

export default function PromptPreview({ prompt, onPromptChange, contract, isOpen: defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-bright)", background: "var(--bg-card)" }}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={open}
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Prompt Preview
          </span>
          {contract && (
            <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              contract.valid ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}>
              {contract.valid
                ? <><CheckCircle className="w-3 h-3" /> Valid</>
                : <><AlertCircle className="w-3 h-3" /> {contract.violations.length} issue{contract.violations.length > 1 ? "s" : ""}</>
              }
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {prompt && (
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md transition-colors hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Copy prompt"
            >
              {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle prompt preview"
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                   : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4">
          {/* Violations */}
          {contract && contract.violations.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400 mb-1.5">Contract Violations</p>
              <ul className="space-y-1">
                {contract.violations.map((v, i) => (
                  <li key={i} className="text-[11px] text-red-300 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Warnings */}
          {contract && contract.warnings.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 mb-1.5">Warnings</p>
              <ul className="space-y-1">
                {contract.warnings.map((w, i) => (
                  <li key={i} className="text-[11px] text-amber-300">{w}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Editable textarea */}
          <textarea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            rows={8}
            className="w-full text-xs rounded-lg p-3 resize-none font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            placeholder="Prompt will appear here once you fill in the form fields..."
          />
          <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
            {prompt.length} chars · You can edit this prompt before generating
          </p>
        </div>
      )}
    </div>
  );
}
