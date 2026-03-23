"use client";
import { useState } from "react";
import { GenerationRecord, TemplateType } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { Search, Star, Trash2, Download, X, Clock } from "lucide-react";

const TEMPLATE_LABELS: Record<string, string> = Object.fromEntries(
  TEMPLATES.map(t => [t.id, t.name])
);

interface Props {
  history: GenerationRecord[];
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: TemplateType | "all";
  setFilterType: (t: TemplateType | "all") => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onExport: () => void;
  onSelect: (record: GenerationRecord) => void;
}

export default function GenerationHistory({
  history, totalCount, searchQuery, setSearchQuery,
  filterType, setFilterType, favoritesOnly, setFavoritesOnly,
  onToggleFavorite, onDelete, onClear, onExport, onSelect
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            History
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onExport} title="Export history"
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}>
            <Download className="w-3.5 h-3.5" />
          </button>
          {confirmClear ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onClear(); setConfirmClear(false); }}
                className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirmClear(false)}
                className="text-[10px] px-2 py-1 rounded transition-colors hover:bg-white/10"
                style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} title="Clear all history"
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="w-full text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors ${
            favoritesOnly ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/10"
          }`}
          style={!favoritesOnly ? { color: "var(--text-muted)", border: "1px solid var(--border)" } : { border: "1px solid transparent" }}
        >
          <Star className="w-3 h-3" /> Favorites
        </button>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as TemplateType | "all")}
          className="text-[10px] px-2 py-1 rounded-full focus:outline-none"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <option value="all">All types</option>
          {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Clock className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              {totalCount === 0 ? "No images generated yet" : "No results match your filters"}
            </p>
          </div>
        ) : (
          history.map(record => (
            <div
              key={record.id}
              className="group relative flex gap-2.5 p-2 rounded-xl transition-colors hover:bg-white/5 cursor-pointer"
              style={{ border: "1px solid var(--border)" }}
              onClick={() => onSelect(record)}
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-16 h-9 rounded-lg overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}>
                {record.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={record.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {record.companyName}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {TEMPLATE_LABELS[record.templateType] || record.templateType}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {formatTime(record.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); onToggleFavorite(record.id); }}
                  className="p-1 rounded-md hover:bg-white/10"
                  aria-label={record.favorite ? "Unfavorite" : "Favorite"}
                >
                  <Star className={`w-3 h-3 ${record.favorite ? "fill-amber-400 text-amber-400" : "text-gray-500"}`} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(record.id); }}
                  className="p-1 rounded-md hover:bg-red-500/20"
                  aria-label="Delete record"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
