import { CachedImage } from "./types";

const CACHE_KEY = "seo-img-gen-cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_ENTRIES = 20;

async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

type CacheStore = Record<string, CachedImage>;

function loadCache(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(store: CacheStore) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Storage quota exceeded - clear and retry
    localStorage.removeItem(CACHE_KEY);
  }
}

export class ImageCache {
  private memStore: Map<string, CachedImage> = new Map();

  async get(prompt: string): Promise<CachedImage | null> {
    const hash = await hashPrompt(prompt);
    // Check memory first
    const mem = this.memStore.get(hash);
    if (mem && Date.now() - mem.createdAt < CACHE_TTL_MS) return mem;
    // Check localStorage
    const store = loadCache();
    const entry = store[hash];
    if (entry && Date.now() - entry.createdAt < CACHE_TTL_MS) {
      this.memStore.set(hash, entry);
      return entry;
    }
    return null;
  }

  async set(prompt: string, imageData: string): Promise<void> {
    const hash = await hashPrompt(prompt);
    const entry: CachedImage = { imageData, prompt, createdAt: Date.now() };
    this.memStore.set(hash, entry);
    const store = loadCache();
    store[hash] = entry;
    // Evict oldest if over limit
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      const oldest = keys.sort((a, b) => store[a].createdAt - store[b].createdAt)[0];
      delete store[oldest];
    }
    saveCache(store);
  }

  async clear(): Promise<void> {
    this.memStore.clear();
    localStorage.removeItem(CACHE_KEY);
  }
}

export const imageCache = new ImageCache();
