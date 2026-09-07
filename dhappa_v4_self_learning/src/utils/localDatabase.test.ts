import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLocalDatabaseAdapter, LOCAL_DATABASE_VERSION } from './localDatabase';

test('database adapter keeps separate collections isolated', () => {
  const storage = new Map<string, string>();
  const db = createLocalDatabaseAdapter({
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  } as Storage);

  const dailyData = [{ id: 'rec-1', date: '2026-08-30' }] as Array<{ id: string; date: string }>;
  const preferences = { defaultCurrency: 'USD' } as { defaultCurrency: string };

  db.setCollection('dailyData', dailyData);
  db.setCollection('preferences', preferences);

  assert.equal((db.getCollection<Array<{ id: string; date: string }>>('dailyData') ?? []).length, 1);
  assert.equal((db.getCollection<{ defaultCurrency: string }>('preferences') ?? { defaultCurrency: '' }).defaultCurrency, 'USD');
  assert.equal(db.getState().version, LOCAL_DATABASE_VERSION);
  assert.equal(db.getCollection('patternDashboard'), null);
});
