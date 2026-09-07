export const LOCAL_DATABASE_VERSION = '1.0.0';

export type LocalDatabaseCollectionName =
  | 'dailyData'
  | 'preferences'
  | 'patternDashboard'
  | 'patternDashboardHistory'
  | 'backtestReports'
  | 'engineReports'
  | 'auditLog';

export interface LocalDatabaseState {
  version: string;
  updatedAt: string;
  collections: Partial<Record<LocalDatabaseCollectionName, unknown>>;
}

export interface LocalDatabaseAdapter {
  getState(): LocalDatabaseState;
  getCollection<T>(name: LocalDatabaseCollectionName): T | null;
  setCollection<T>(name: LocalDatabaseCollectionName, value: T): void;
  removeCollection(name: LocalDatabaseCollectionName): void;
  clear(): void;
  getAllCollections(): Record<string, unknown>;
}

export interface LocalDatabaseStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

const DATABASE_KEY = 'pip:localDatabase:v1';

function createEmptyState(): LocalDatabaseState {
  return {
    version: LOCAL_DATABASE_VERSION,
    updatedAt: new Date().toISOString(),
    collections: {},
  };
}

function parseDatabaseState(raw: string | null): LocalDatabaseState {
  if (!raw) return createEmptyState();

  try {
    const parsed = JSON.parse(raw) as Partial<LocalDatabaseState>;
    if (!parsed || typeof parsed !== 'object') return createEmptyState();

    return {
      version: parsed.version || LOCAL_DATABASE_VERSION,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      collections: parsed.collections && typeof parsed.collections === 'object' ? parsed.collections : {},
    };
  } catch {
    return createEmptyState();
  }
}

export function createLocalDatabaseAdapter(storage: LocalDatabaseStorageLike): LocalDatabaseAdapter {
  const readState = (): LocalDatabaseState => parseDatabaseState(storage.getItem(DATABASE_KEY));

  const persistState = (state: LocalDatabaseState): void => {
    try {
      storage.setItem(DATABASE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist localDatabase adapter state to storage:', e);
    }
  };

  const commit = (next: LocalDatabaseState): LocalDatabaseState => {
    const updated = {
      ...next,
      version: LOCAL_DATABASE_VERSION,
      updatedAt: new Date().toISOString(),
    };
    persistState(updated);
    return updated;
  };

  return {
    getState() {
      return readState();
    },
    getCollection<T>(name: LocalDatabaseCollectionName): T | null {
      const state = readState();
      const value = state.collections[name];
      return value === undefined ? null : (value as T);
    },
    setCollection<T>(name: LocalDatabaseCollectionName, value: T): void {
      const state = readState();
      const collections = {
        ...state.collections,
        [name]: value,
      };
      commit({ ...state, collections });
    },
    removeCollection(name: LocalDatabaseCollectionName): void {
      const state = readState();
      const nextCollections = { ...state.collections };
      delete nextCollections[name];
      commit({ ...state, collections: nextCollections });
    },
    clear(): void {
      const nextState = createEmptyState();
      persistState(nextState);
    },
    getAllCollections() {
      return { ...readState().collections };
    },
  };
}

export const LocalDatabaseManager = {
  fromStorage(storage: LocalDatabaseStorageLike): LocalDatabaseAdapter {
    return createLocalDatabaseAdapter(storage);
  },
};

export function getBrowserLocalDatabase(): LocalDatabaseAdapter | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return createLocalDatabaseAdapter(window.localStorage);
}
