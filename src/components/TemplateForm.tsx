"use client";
import { useEffect, useState } from "react";
import { TemplateDefinition } from "@/lib/types";
import { analyzeContext } from "@/lib/prompt-intelligence";
import { ChevronDown, ChevronUp, Lightbulb, User } from "lucide-react";

interface Props {
  template: TemplateDefinition;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

const PERSON_FIELDS = [
  {
    key: "person_gender",
    label: "Gender",
    options: ["Auto", "Male", "Female"],
    hint: "Auto = not specified",
  },
  {
    key: "person_ageRange",
    label: "Age Range",
    options: ["Auto", "Young (20-30)", "Middle-aged (30-45)", "Senior (45+)"],
    hint: "Auto = 25–40",
  },
  {
    key: "person_emotion",
    label: "Expression",
    options: ["Auto", "Confused", "Shocked", "Happy", "Excited", "Worried", "Neutral", "Angry", "Thinking"],
    hint: "Auto = template default",
  },
  {
    key: "person_profession",
    label: "Profession",
    options: ["Auto", "Doctor", "Engineer", "Business Executive", "Investor", "Scientist", "Banker", "Student", "Casual"],
    hint: "Auto = detect from industry",
  },
  {
    key: "person_attire",
    label: "Attire",
    options: ["Auto", "Formal Suit", "Business Casual", "Lab Coat", "Hard Hat + Safety Vest", "Traditional Indian", "Casual"],
    hint: "Auto = from profession",
  },
] as const;

export default function TemplateForm({ template, values, onChange }: Props) {
  const [detectedIndustry, setDetectedIndustry] = useState<string | null>(null);
  const [personExpanded, setPersonExpanded] = useState(false);

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

  // Prefill defaults on template change; reset person fields
  useEffect(() => {
    for (const field of template.fields) {
      if (field.defaultValue !== undefined && !values[field.name]) {
        onChange(field.name, field.defaultValue);
      }
    }
    // Reset person fields on template switch
    for (const f of PERSON_FIELDS) {
      onChange(f.key, "Auto");
    }
    setPersonExpanded(false);
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

      {/* Person Appearance — only for IPO templates with a person */}
      {template.hasPerson && (
        <div
          className="rounded-lg overflow-hidden transition-all"
          style={{
            background: "rgba(37,99,235,0.05)",
            border: "1px solid rgba(37,99,235,0.18)",
          }}
        >
          {/* Header / Toggle */}
          <button
            type="button"
            onClick={() => setPersonExpanded(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-blue-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 shrink-0" style={{ color: "#60a5fa" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#93c5fd" }}>
                Person Appearance
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(37,99,235,0.15)",
                  color: "#60a5fa",
                  letterSpacing: "0.02em",
                }}
              >
                optional
              </span>
            </div>
            {personExpanded
              ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "#60a5fa" }} />
              : <ChevronDown className="w-3.5 h-3.5" style={{ color: "#60a5fa" }} />
            }
          </button>

          {/* Collapsible content */}
          {personExpanded && (
            <div className="px-3 pb-3 pt-1 space-y-2.5">
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Customize the person shown in the thumbnail. All fields default to auto-detected values.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PERSON_FIELDS.map(field => (
                  <div key={field.key} className={field.key === "person_attire" ? "col-span-2" : ""}>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      {field.label}
                    </label>
                    <select
                      value={values[field.key] || "Auto"}
                      onChange={e => onChange(field.key, e.target.value)}
                      className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{field.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
