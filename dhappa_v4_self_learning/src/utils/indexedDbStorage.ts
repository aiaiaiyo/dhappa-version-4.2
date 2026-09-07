/**
 * IndexedDB Async Storage Engine for Large Datasets
 * Handles high-throughput reading & writing of thousands of historical draw records
 * without blocking the main UI thread or hitting browser localStorage 5MB quota limits.
 */

import { DayMarketEntry } from '../types';

const DB_NAME = 'datePairSimulator_DB_v2';
const DB_VERSION = 2;
const STORE_RECORDS = 'records';
const STORE_SNAPSHOTS = 'snapshots';
const STORE_SUMMARIES = 'summaries';
const OPEN_TIMEOUT_MS = 1500;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('IndexedDB open timed out; using local storage fallback.'));
    }, OPEN_TIMEOUT_MS);

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      reject(error instanceof Error ? error : new Error('IndexedDB open failed.'));
    };

    request.onerror = () => fail(request.error);

    request.onblocked = () => {
      fail(new Error('IndexedDB upgrade is blocked by another open tab.'));
    };

    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        const recordStore = db.createObjectStore(STORE_RECORDS, { keyPath: 'date' });
        recordStore.createIndex('by_date', 'date', { unique: true });
        recordStore.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_SUMMARIES)) {
        db.createObjectStore(STORE_SUMMARIES, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Save records array asynchronously into IndexedDB using high-performance transactions
 */
export async function saveRecordsToIndexedDB(records: DayMarketEntry[]): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDS);

    // Clear existing records in single transaction
    store.clear();

    // Batch add all records
    for (let i = 0; i < records.length; i++) {
      store.put(records[i]);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn('IndexedDB write transaction error:', tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('IndexedDB save failed, fallback active:', err);
    return false;
  }
}

/**
 * Load all records asynchronously from IndexedDB
 */
export async function loadRecordsFromIndexedDB(): Promise<DayMarketEntry[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, 'readonly');
    const store = tx.objectStore(STORE_RECORDS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const items: DayMarketEntry[] = request.result || [];
        items.sort((a, b) => b.date.localeCompare(a.date));
        resolve(items);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return [];
  }
}

/**
 * Append or upsert a batch of new records without clearing existing store
 */
export async function bulkUpsertRecordsToIndexedDB(newRecords: DayMarketEntry[]): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDS);

    for (let i = 0; i < newRecords.length; i++) {
      store.put(newRecords[i]);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('IndexedDB bulk upsert failed:', err);
    return false;
  }
}

/**
 * Clear all stored IndexedDB records
 */
export async function clearIndexedDBRecords(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDS);
    store.clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Save arbitrary structured summary/analytics object into IndexedDB
 */
export async function saveSummaryToIndexedDB<T>(key: string, data: T): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUMMARIES, 'readwrite');
    const store = tx.objectStore(STORE_SUMMARIES);
    store.put({ key, data, updatedAt: new Date().toISOString() });

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`IndexedDB saveSummary failed for key ${key}:`, err);
    return false;
  }
}

/**
 * Load structured summary/analytics object from IndexedDB
 */
export async function loadSummaryFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUMMARIES, 'readonly');
    const store = tx.objectStore(STORE_SUMMARIES);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.data !== undefined) {
          resolve(request.result.data as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`IndexedDB loadSummary failed for key ${key}:`, err);
    return null;
  }
}

/**
 * Delete structured summary from IndexedDB
 */
export async function deleteSummaryFromIndexedDB(key: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUMMARIES, 'readwrite');
    const store = tx.objectStore(STORE_SUMMARIES);
    store.delete(key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Save complete Restore Point snapshot into IndexedDB STORE_SNAPSHOTS
 */
export async function saveSnapshotToIndexedDB<T extends Record<string, any>>(snapshot: T): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORE_SNAPSHOTS);
    
    // Ensure object has key 'id' matching keyPath
    const recordToSave = {
      ...(snapshot as any),
      id: (snapshot as any).id || (snapshot as any).metadata?.id || `snap-${Date.now()}`,
    };
    store.put(recordToSave);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('IndexedDB saveSnapshot failed:', err);
    return false;
  }
}

/**
 * Load single Restore Point snapshot by ID from IndexedDB
 */
export async function loadSnapshotFromIndexedDB<T = any>(id: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORE_SNAPSHOTS);
    const request = store.get(id);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`IndexedDB loadSnapshot failed for id ${id}:`, err);
    return null;
  }
}

/**
 * Load all stored Restore Point snapshots from IndexedDB
 */
export async function loadAllSnapshotsFromIndexedDB<T = any>(): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORE_SNAPSHOTS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const items: T[] = request.result || [];
        items.sort((a, b) => {
          const timeA = (a as any)?.createdAt || (a as any)?.metadata?.createdAt || '';
          const timeB = (b as any)?.createdAt || (b as any)?.metadata?.createdAt || '';
          return timeB.localeCompare(timeA);
        });
        resolve(items);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB loadAllSnapshots failed:', err);
    return [];
  }
}

/**
 * Delete a Restore Point snapshot by ID from IndexedDB
 */
export async function deleteSnapshotFromIndexedDB(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORE_SNAPSHOTS);
    store.delete(id);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`IndexedDB deleteSnapshot failed for id ${id}:`, err);
    return false;
  }
}


