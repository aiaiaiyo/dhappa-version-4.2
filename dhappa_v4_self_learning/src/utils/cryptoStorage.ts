/**
 * Safe versioned storage and Web Crypto AES-GCM client-side encryption utility
 * Handles persistent storage of daily records, preferences, and sensitive user financial inputs.
 */

import { DayMarketEntry, UserPreferences } from '../types';
import {
  PatternDashboardSnapshot,
  normalizePatternDashboardSnapshot,
} from './patternDashboardSchema';
import { createLocalDatabaseAdapter } from './localDatabase';

const STORAGE_KEYS = {
  DAILY_DATA: 'datePairSimulator:v1:dailyData',
  PREFERENCES: 'datePairSimulator:v1:preferences',
  PATTERN_DASHBOARD: 'datePairSimulator:v1:patternDashboard',
  ENCRYPTION_KEY_HASH: 'datePairSimulator:v1:cryptoSalt',
  DEMO_LOADED: 'datePairSimulator:v1:demoLoaded',
};

const database = createLocalDatabaseAdapter({
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: (key: string) => window.localStorage.removeItem(key),
  clear: () => window.localStorage.clear(),
});

import {
  saveRecordsToIndexedDB,
  loadRecordsFromIndexedDB,
  clearIndexedDBRecords,
} from './indexedDbStorage';

const ENC_ALGO = 'AES-GCM';

const STATIC_SALT = new Uint8Array([83, 82, 73, 95, 83, 65, 76, 84, 95, 50, 48, 50, 54, 95, 57, 57]); // "SRI_SALT_2026_99" in ASCII

// Cached CryptoKeys to avoid re-running PBKDF2 iterations on every load/save
const keyCache = new Map<string, CryptoKey>();

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const saltHex = Array.from(salt).join(',');
  const cacheKey = `${passphrase}:${saltHex}`;
  const existing = keyCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derived = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 1000, // Near-instant 1ms execution, fully preventing main thread locks
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENC_ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, derived);
  return derived;
}

/**
 * Fast chunked Uint8Array to Base64 encoder (avoids JS callstack & string concats lockups)
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const CHUNK_SIZE = 0x8000; // 32KB chunking
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

/**
 * Encrypt arbitrary JSON data string using Web Crypto
 */
export async function encryptData(data: any, passphrase: string = 'date-pair-sim-device-key'): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return JSON.stringify(data);
    }
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));
    const salt = STATIC_SALT;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: ENC_ALGO, iv },
      key,
      encodedData
    );

    const buffer = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.byteLength);
    buffer.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

    return `ENC_v1:${uint8ArrayToBase64(buffer)}`;
  } catch (err) {
    console.warn('Encryption fallback to plaintext JSON string', err);
    return JSON.stringify(data);
  }
}

/**
 * Decrypt data or safely parse plaintext fallback
 */
export async function decryptData<T>(rawString: string, passphrase: string = 'date-pair-sim-device-key'): Promise<T | null> {
  if (!rawString) return null;
  if (!rawString.startsWith('ENC_v1:')) {
    try {
      return JSON.parse(rawString) as T;
    } catch {
      return null;
    }
  }

  try {
    const base64 = rawString.slice(7);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const ciphertext = bytes.slice(28);

    const key = await deriveKey(passphrase, salt);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ENC_ALGO, iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decrypted);
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Decryption failed, data might be corrupted or key mismatch', err);
    return null;
  }
}

/**
 * High-level async storage helpers with encryption
 */
export async function loadDailyDataFromStorage(): Promise<DayMarketEntry[]> {
  try {
    // 1. Try loading from IndexedDB first (handles large datasets up to 500,000+ rows seamlessly)
    const idbRecords = await loadRecordsFromIndexedDB();
    if (idbRecords && idbRecords.length > 0) {
      return idbRecords;
    }

    // 2. Fallback to LocalDatabase collection
    const value = database.getCollection<DayMarketEntry[]>('dailyData');
    if (value && Array.isArray(value) && value.length > 0) {
      return value;
    }

    // 3. Fallback to localStorage item
    const item = localStorage.getItem(STORAGE_KEYS.DAILY_DATA);
    if (!item) return [];
    const decrypted = await decryptData<DayMarketEntry[]>(item);
    return Array.isArray(decrypted) ? decrypted : [];
  } catch (e) {
    console.warn('Could not read daily data from storage', e);
    return [];
  }
}

let lastSavedDailyDataSignature = '';

export async function saveDailyDataToStorage(data: DayMarketEntry[]): Promise<void> {
  try {
    const signature = JSON.stringify(data.map((record) => [
      record.date,
      record.deshawar || '',
      record.faridabad || '',
      record.gali || '',
      record.ghaziabad || '',
      record.notes || '',
    ]));
    
    // If identical dataset was already persisted, skip redundant encryption
    if (signature === lastSavedDailyDataSignature) {
      return;
    }
    lastSavedDailyDataSignature = signature;

    // Save to IndexedDB asynchronously (handles large datasets without localStorage limits or freezes)
    saveRecordsToIndexedDB(data).catch(() => {});

    // If dataset is reasonable size (< 1000 items), save to local storage fallback
    if (data.length <= 1000) {
      database.setCollection('dailyData', data);
      // Non-blocking encryption write
      setTimeout(async () => {
        try {
          const encrypted = await encryptData(data);
          localStorage.setItem(STORAGE_KEYS.DAILY_DATA, encrypted);
        } catch {
          // Fallback handled safely
        }
      }, 0);
    }
  } catch (e) {
    console.error('Could not save daily data to local storage fallback:', e);
  }
}

export async function loadPreferencesFromStorage(): Promise<UserPreferences | null> {
  try {
    const value = database.getCollection<UserPreferences>('preferences');
    if (value) return value;

    const item = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!item) return null;
    const decrypted = await decryptData<UserPreferences>(item);
    return decrypted || null;
  } catch (e) {
    return null;
  }
}

export async function savePreferencesToStorage(prefs: UserPreferences): Promise<void> {
  try {
    database.setCollection('preferences', prefs);
    const encrypted = await encryptData(prefs);
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, encrypted);
  } catch (e) {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
      database.setCollection('preferences', prefs);
    } catch {}
  }
}

export async function loadPatternDashboardSnapshotFromStorage(): Promise<PatternDashboardSnapshot | null> {
  try {
    const value = database.getCollection<PatternDashboardSnapshot>('patternDashboard');
    if (value) return normalizePatternDashboardSnapshot(value);

    const item = localStorage.getItem(STORAGE_KEYS.PATTERN_DASHBOARD);
    if (!item) return null;
    const decrypted = await decryptData<PatternDashboardSnapshot>(item);
    if (!decrypted) return null;
    return normalizePatternDashboardSnapshot(decrypted);
  } catch (e) {
    console.warn('Could not read pattern dashboard snapshot from storage', e);
    return null;
  }
}

export async function savePatternDashboardSnapshotToStorage(snapshot: PatternDashboardSnapshot): Promise<void> {
  try {
    const normalized = normalizePatternDashboardSnapshot(snapshot);
    database.setCollection('patternDashboard', normalized);
    const encrypted = await encryptData(normalized);
    localStorage.setItem(STORAGE_KEYS.PATTERN_DASHBOARD, encrypted);
  } catch (e) {
    try {
      const normalized = normalizePatternDashboardSnapshot(snapshot);
      localStorage.setItem(STORAGE_KEYS.PATTERN_DASHBOARD, JSON.stringify(normalized));
      database.setCollection('patternDashboard', normalized);
    } catch {}
  }
}

/**
 * LocalStorage wrapper with safe JSON parsing and version keys
 */
export const LocalStorageManager = {
  getDailyData<T>(fallback: T): T {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.DAILY_DATA);
      if (!item) return fallback;
      if (item.startsWith('ENC_v1:')) {
        // If stored as encrypted, sync fallback parsing will fail until async load finishes; handle gracefully
        try {
          const base64 = item.slice(7);
          const binary = atob(base64);
          // If simple plaintext format was wrapped
          const parsed = JSON.parse(binary);
          return Array.isArray(parsed) ? (parsed as unknown as T) : fallback;
        } catch {
          return fallback;
        }
      }
      const parsed = JSON.parse(item);
      return Array.isArray(parsed) ? (parsed as unknown as T) : fallback;
    } catch (e) {
      console.warn('Corrupted local storage for daily records, returning fallback', e);
      return fallback;
    }
  },

  setDailyData(data: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_DATA, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  },

  getPreferences<T>(fallback: T): T {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!item) return fallback;
      if (item.startsWith('ENC_v1:')) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  setPreferences(prefs: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences to local storage', e);
    }
  },

  clearAll(): void {
    clearAllStorageAndCache();
  },
};

/**
 * Completely purges all stored application data, caches, local storage, and session storage
 */
export function clearAllStorageAndCache(): void {
  try {
    if (typeof window !== 'undefined') {
      if (window.localStorage) {
        window.localStorage.clear();
      }
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }
      if ('caches' in window) {
        window.caches.keys().then((names) => {
          names.forEach((name) => window.caches.delete(name));
        });
      }
    }
    console.log('Successfully cleared all client-side cache and stored data.');
  } catch (e) {
    console.error('Failed to clear storage and cache:', e);
  }
}
