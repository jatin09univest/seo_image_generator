import { GenerationRecord, TemplateType } from "./types";

const HISTORY_KEY = "seo-img-gen-history";
const MAX_ENTRIES = 100;

export function loadHistory(): GenerationRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(records: GenerationRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {
    // Storage full — remove non-favorites to make room
    const trimmed = records.filter(r => r.favorite).slice(-20);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed)); } catch {}
  }
}

export function addRecord(record: GenerationRecord): GenerationRecord[] {
  const history = loadHistory();
  history.unshift(record); // newest first
  // Evict oldest non-favorites if over limit
  let result = history;
  if (result.length > MAX_ENTRIES) {
    const favorites = result.filter(r => r.favorite);
    const nonFavorites = result.filter(r => !r.favorite).slice(0, MAX_ENTRIES - favorites.length);
    result = [...favorites, ...nonFavorites].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  saveHistory(result);
  return result;
}

export function toggleFavorite(id: string): GenerationRecord[] {
  const history = loadHistory();
  const updated = history.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r);
  saveHistory(updated);
  return updated;
}

export function deleteRecord(id: string): GenerationRecord[] {
  const history = loadHistory().filter(r => r.id !== id);
  saveHistory(history);
  return history;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function searchHistory(records: GenerationRecord[], query: string): GenerationRecord[] {
  const q = query.toLowerCase();
  return records.filter(r =>
    r.companyName.toLowerCase().includes(q) ||
    r.templateType.includes(q) ||
    r.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function filterHistory(records: GenerationRecord[], templateType?: TemplateType, favoritesOnly?: boolean): GenerationRecord[] {
  return records.filter(r => {
    if (templateType && r.templateType !== templateType) return false;
    if (favoritesOnly && !r.favorite) return false;
    return true;
  });
}

export function exportHistory(records: GenerationRecord[]): void {
  const data = records.map(({ id, templateType, companyName, prompt, createdAt, favorite, tags }) => ({
    id, templateType, companyName, prompt, createdAt, favorite, tags
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `univest-image-history-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function compressImageForStorage(base64Data: string, maxWidth = 200): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch {
        resolve(base64Data);
      }
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
}
