"use client";
import { useState, useEffect, useCallback } from "react";
import { GenerationRecord, TemplateType } from "@/lib/types";
import {
  loadHistory, addRecord, toggleFavorite, deleteRecord,
  clearHistory, searchHistory, filterHistory, exportHistory
} from "@/lib/storage";

export function useGenerationHistory() {
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TemplateType | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const add = useCallback((record: GenerationRecord) => {
    const updated = addRecord(record);
    setHistory(updated);
  }, []);

  const toggleFav = useCallback((id: string) => {
    const updated = toggleFavorite(id);
    setHistory(updated);
  }, []);

  const remove = useCallback((id: string) => {
    const updated = deleteRecord(id);
    setHistory(updated);
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const doExport = useCallback(() => {
    exportHistory(history);
  }, [history]);

  const filteredHistory = (() => {
    let result = history;
    if (searchQuery) result = searchHistory(result, searchQuery);
    if (filterType !== "all") result = filterHistory(result, filterType as TemplateType);
    if (favoritesOnly) result = filterHistory(result, undefined, true);
    return result;
  })();

  return {
    history: filteredHistory,
    totalCount: history.length,
    add, toggleFav, remove, clear, doExport,
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    favoritesOnly, setFavoritesOnly,
  };
}
