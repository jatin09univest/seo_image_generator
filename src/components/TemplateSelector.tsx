"use client";
import { TEMPLATES } from "@/lib/templates";
import { TemplateType } from "@/lib/types";
import {
  TrendingUp, ClipboardList, Rocket, BookOpen, LayoutGrid, BarChart2,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  ClipboardList,
  Rocket,
  BookOpen,
  LayoutGrid,
  BarChart2,
};

interface Props {
  selected: TemplateType | null;
  onSelect: (id: TemplateType) => void;
}

export default function TemplateSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Choose Template
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TEMPLATES.map(template => {
          const Icon = ICON_MAP[template.icon] ?? TrendingUp;
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id as TemplateType)}
              className={`flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-all ${
                isSelected
                  ? "ring-2 ring-blue-500"
                  : "hover:border-[var(--border-bright)]"
              }`}
              style={{
                background: isSelected ? "var(--primary-soft)" : "var(--bg-card)",
                border: `1px solid ${isSelected ? "transparent" : "var(--border)"}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: isSelected ? "var(--primary)" : "var(--bg-elevated)",
                }}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className={`text-xs font-semibold leading-tight ${isSelected ? "text-blue-400" : ""}`}
                  style={!isSelected ? { color: "var(--text-primary)" } : undefined}>
                  {template.name}
                </p>
                <p className="text-[10px] mt-0.5 leading-tight line-clamp-2"
                  style={{ color: "var(--text-muted)" }}>
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
