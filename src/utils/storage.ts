export interface GalleryItem {
  id: string;
  image: string;
  targetWord: string;
  guess: string;
  score: number;
  critique: string;
  date: number;
}

export interface LLMApiPreset {
  id: string;
  name: string;
  provider: "openrouter" | "custom";
  apiUrl: string;
  apiKey: string;
  selectedModel: string;
  models: string[];
}

export interface LLMSettings {
  provider: "openrouter" | "custom";
  apiUrl: string;
  apiKey: string;
  selectedModel: string;
  models: string[];
  wordBank?: "all" | "animals" | "food" | "vehicles" | "daily" | "fantasy" | "custom";
  critiqueStyle?: "arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random";
  customTheme?: string;
  customWords?: string[];
  customStats?: Record<string, { height: string; weight: string }>;
  durationLimit?: number;
  username?: string;
  apiPresets?: LLMApiPreset[];
  activePresetId?: string;
  // Display Properties / 个性设置
  wallpaper?: string; // filename, e.g. "clouds_win95.png" or "" for solid color
  wallpaperFit?: "center" | "stretch" | "tile";
  crtFilter?: "none" | "light" | "medium" | "heavy";
}

const DB_NAME = "AI_Art_Critic_DB";
const DB_VERSION = 1;
const GALLERY_STORE = "gallery";
const SETTINGS_STORE = "settings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GALLERY_STORE)) {
        db.createObjectStore(GALLERY_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToGallery(item: Omit<GalleryItem, "id" | "date">): Promise<GalleryItem> {
  const db = await openDB();
  const newItem: GalleryItem = {
    ...item,
    id: typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    date: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, "readwrite");
    const store = tx.objectStore(GALLERY_STORE);
    const req = store.put(newItem);

    req.onsuccess = () => resolve(newItem);
    req.onerror = () => reject(req.error);
  });
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, "readonly");
    const store = tx.objectStore(GALLERY_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = req.result as GalleryItem[];
      items.sort((a, b) => b.date - a.date);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearGallery(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, "readwrite");
    const store = tx.objectStore(GALLERY_STORE);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSettings(): Promise<LLMSettings | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const req = store.get("current");

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSettings(settings: LLMSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const req = store.put(settings, "current");

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GALLERY_STORE, "readwrite");
    const store = tx.objectStore(GALLERY_STORE);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
