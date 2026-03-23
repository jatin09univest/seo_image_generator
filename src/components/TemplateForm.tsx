"use client";
import { useEffect, useState } from "react";
import { TemplateDefinition } from "@/lib/types";
import { analyzeContext } from "@/lib/prompt-intelligence";
import { Lightbulb } from "lucide-react";

interface Props {
  template: TemplateDefinition;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export default function TemplateForm({ template, values, onChange }: Props) {
  const [detectedIndustry, setDetectedIndustry] = useState<string | null>(null);

  // Run industry detection for templates that use it (IPO templates)
  useEffect(() => {
    const hasIndustryDetection = ["ipo-listing", "ipo-gmp", "ipo-allotment"].includes(template.id);
    if (!hasIndustryDetection) {
      setDetectedIndustry(null);
      return;
    }
    const companyName = values.companyName || "";
    const seoTitle = values.seoTitle || values.headlineText || companyName;
    if (companyName.trim()) {
      const intel = analyzeContext(companyName, seoTitle);
      setDetectedIndustry(intel.detectedIndustry);
    } else {
      setDetectedIndustry(null);
    }
  }, [template.id, values.companyName, values.seoTitle, values.headlineText]);

  // Prefill defaults on template change
  useEffect(() => {
    for (const field of template.fields) {
      if (field.defaultValue !== undefined && !values[field.name]) {
        onChange(field.name, field.defaultValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  return (
    <div className="space-y-3">
      {/* Industry badge */}
      {detectedIndustry && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)" }}>
          <Lightbulb className="w-3.5 h-3.5 shrink-0" style={{ color: "#60a5fa" }} />
          <p className="text-[11px]" style={{ color: "#93c5fd" }}>
            Auto-detected industry: <span className="font-semibold">{detectedIndustry}</span>
          </p>
        </div>
      )}

      {/* Fields */}
      {template.fields.map(field => (
        <div key={field.name}>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {field.label}
            {field.required && <span className="ml-1 text-red-400">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              value={values[field.name] || ""}
              onChange={e => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          ) : field.type === "select" ? (
            <select
              value={values[field.name] || field.defaultValue || ""}
              onChange={e => onChange(field.name, e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "number" ? "number" : "text"}
              value={values[field.name] || ""}
              onChange={e => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          )}

          {field.helperText && (
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{field.helperText}</p>
          )}
        </div>
      ))}
    </div>
  );
}
