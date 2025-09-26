import type { EditorHandle, SerializedEditorState } from "../editor.js";

const DB_NAME = "photoshop-clone";
const STORE_NAME = "sessions";
const SESSION_KEY = "latest";
const CONFIG_STORAGE_KEY = "autosave-config";

interface AutosaveConfig {
  intervalSeconds: number;
  quotaWarningMB: number;
}

interface StoredSession {
  timestamp: number;
  state: SerializedEditorState;
}

interface AutosaveManagerOptions {
  intervalInput?: HTMLInputElement | null;
  quotaWarningInput?: HTMLInputElement | null;
  statusElement?: HTMLElement | null;
}

const defaultConfig: AutosaveConfig = {
  intervalSeconds: 60,
  quotaWarningMB: 50,
};

function loadConfig(): AutosaveConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) return { ...defaultConfig };
    const parsed = JSON.parse(stored) as Partial<AutosaveConfig> | null;
    return {
      intervalSeconds:
        typeof parsed?.intervalSeconds === "number" && parsed.intervalSeconds > 0
          ? parsed.intervalSeconds
          : defaultConfig.intervalSeconds,
      quotaWarningMB:
        typeof parsed?.quotaWarningMB === "number" && parsed.quotaWarningMB > 0
          ? parsed.quotaWarningMB
          : defaultConfig.quotaWarningMB,
    };
  } catch {
    return { ...defaultConfig };
  }
}

function saveConfig(config: AutosaveConfig) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore storage failures */
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  }).catch(() => null);
}

async function withStore<T>(
  dbPromise: Promise<IDBDatabase | null>,
  mode: IDBTransactionMode,
  cb: (store: IDBObjectStore) => void,
): Promise<T | null> {
  const db = await dbPromise;
  if (!db) return null;
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    cb(store);
    tx.oncomplete = () => resolve(null);
    tx.onerror = () => reject(tx.error ?? new Error("Transaction failed"));
  }).catch(() => null);
}

async function getSession(
  dbPromise: Promise<IDBDatabase | null>,
): Promise<StoredSession | null> {
  const db = await dbPromise;
  if (!db) return null;
  return new Promise<StoredSession | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(SESSION_KEY);
    request.onsuccess = () => {
      resolve((request.result as StoredSession | undefined) ?? null);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to read session"));
    };
  }).catch(() => null);
}

async function putSession(
  dbPromise: Promise<IDBDatabase | null>,
  session: StoredSession,
): Promise<void> {
  await withStore<void>(dbPromise, "readwrite", (store) => {
    store.put(session, SESSION_KEY);
  });
}

async function deleteSession(dbPromise: Promise<IDBDatabase | null>): Promise<void> {
  await withStore<void>(dbPromise, "readwrite", (store) => {
    store.delete(SESSION_KEY);
  });
}

export class AutosaveManager {
  private readonly handle: EditorHandle;
  private readonly intervalInput?: HTMLInputElement | null;
  private readonly quotaWarningInput?: HTMLInputElement | null;
  private readonly statusElement?: HTMLElement | null;
  private readonly dbPromise: Promise<IDBDatabase | null>;
  private timer: number | null = null;
  private lastSaveText = "";
  private quotaWarningText = "";
  private config: AutosaveConfig;
  readonly supported: boolean;

  constructor(handle: EditorHandle, options: AutosaveManagerOptions = {}) {
    this.handle = handle;
    this.intervalInput = options.intervalInput ?? null;
    this.quotaWarningInput = options.quotaWarningInput ?? null;
    this.statusElement = options.statusElement ?? null;
    this.dbPromise = openDatabase();
    this.supported = typeof indexedDB !== "undefined";
    this.config = loadConfig();

    if (this.intervalInput && !this.intervalInput.value) {
      this.intervalInput.value = String(this.config.intervalSeconds);
    }
    if (this.quotaWarningInput && !this.quotaWarningInput.value) {
      this.quotaWarningInput.value = String(this.config.quotaWarningMB);
    }

    this.intervalInput?.addEventListener("change", this.handleConfigChange);
    this.quotaWarningInput?.addEventListener("change", this.handleConfigChange);
    this.renderStatus();
  }

  private get intervalMs(): number {
    const raw = this.intervalInput?.value;
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (!parsed || parsed < 5) {
      return this.config.intervalSeconds * 1000;
    }
    return parsed * 1000;
  }

  private get quotaWarningBytes(): number {
    const raw = this.quotaWarningInput?.value;
    const parsed = raw ? parseInt(raw, 10) : NaN;
    const mb = !parsed || parsed <= 0 ? this.config.quotaWarningMB : parsed;
    return mb * 1024 * 1024;
  }

  private renderStatus() {
    if (!this.statusElement) return;
    const parts = [];
    if (this.lastSaveText) parts.push(this.lastSaveText);
    if (this.quotaWarningText) parts.push(this.quotaWarningText);
    this.statusElement.textContent = parts.join(" · ");
  }

  private handleConfigChange = () => {
    const intervalSeconds = (() => {
      const raw = this.intervalInput?.value;
      const parsed = raw ? parseInt(raw, 10) : NaN;
      return !parsed || parsed < 5 ? defaultConfig.intervalSeconds : parsed;
    })();
    const quotaWarningMB = (() => {
      const raw = this.quotaWarningInput?.value;
      const parsed = raw ? parseInt(raw, 10) : NaN;
      return !parsed || parsed <= 0 ? defaultConfig.quotaWarningMB : parsed;
    })();
    this.config = { intervalSeconds, quotaWarningMB };
    saveConfig(this.config);
    if (this.timer !== null) {
      this.start();
    }
  };

  async start(): Promise<void> {
    if (!this.supported) {
      this.lastSaveText = "Autosave unavailable";
      this.renderStatus();
      return;
    }
    this.stop();
    await this.performSave();
    this.timer = window.setInterval(() => {
      void this.performSave();
    }, this.intervalMs);
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  async performSave(): Promise<void> {
    if (!this.supported) return;
    try {
      const state = await this.handle.serializeState();
      await putSession(this.dbPromise, {
        timestamp: Date.now(),
        state,
      });
      this.lastSaveText = `Autosaved at ${new Date().toLocaleTimeString()}`;
      this.renderStatus();
      await this.updateQuotaWarning();
    } catch (error) {
      console.warn("Autosave failed", error);
      this.lastSaveText = "Autosave failed";
      this.renderStatus();
    }
  }

  async getLatestSession(): Promise<StoredSession | null> {
    if (!this.supported) return null;
    return getSession(this.dbPromise);
  }

  async clearLatestSession(): Promise<void> {
    if (!this.supported) return;
    await deleteSession(this.dbPromise);
  }

  private async updateQuotaWarning(): Promise<void> {
    if (!navigator.storage?.estimate) {
      this.quotaWarningText = "";
      this.renderStatus();
      return;
    }
    try {
      const { usage = 0, quota } = await navigator.storage.estimate();
      if (!usage) {
        this.quotaWarningText = "";
        this.renderStatus();
        return;
      }
      const usageMB = usage / (1024 * 1024);
      const quotaMB = quota ? quota / (1024 * 1024) : undefined;
      const shouldWarn =
        usage >= this.quotaWarningBytes ||
        (quota && usage / quota > 0.9);
      this.quotaWarningText = shouldWarn
        ? `Storage usage ${usageMB.toFixed(1)}MB${
            quotaMB ? ` of ${quotaMB.toFixed(1)}MB` : ""
          }`
        : "";
      this.renderStatus();
    } catch {
      this.quotaWarningText = "";
      this.renderStatus();
    }
  }

  destroy() {
    this.stop();
    this.intervalInput?.removeEventListener("change", this.handleConfigChange);
    this.quotaWarningInput?.removeEventListener("change", this.handleConfigChange);
  }
}

export type { StoredSession };
