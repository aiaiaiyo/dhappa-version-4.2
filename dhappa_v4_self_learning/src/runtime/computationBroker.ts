export type ComputePriority = 'interactive' | 'normal' | 'background';

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccess: number;
}

/**
 * Small bounded LRU used by expensive analytical calculations.
 * It deliberately lives outside React so toggles/re-renders never invalidate it.
 */
export class ComputationCache {
  private store = new Map<string, CacheEntry<unknown>>();
  constructor(private readonly maxEntries = 160) {}

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    hit.lastAccess = Date.now();
    // Refresh insertion order for LRU eviction.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value as T;
  }

  set<T>(key: string, value: T): void {
    const now = Date.now();
    this.store.delete(key);
    this.store.set(key, { value, createdAt: now, lastAccess: now });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value as string | undefined;
      if (!oldest) break;
      this.store.delete(oldest);
    }
  }

  clearPrefix(prefix: string): void {
    for (const key of this.store.keys()) if (key.startsWith(prefix)) this.store.delete(key);
  }

  clear(): void { this.store.clear(); }
  get size(): number { return this.store.size; }
}

export const analyticsCache = new ComputationCache(200);

export function datasetFingerprint(records: Array<{ date?: string; deshawar?: string; faridabad?: string; ghaziabad?: string; gali?: string }>): string {
  if (!records.length) return '0';
  // O(1) signature: callers already replace/update the data array on mutations.
  // Include both ends and the latest values to avoid stale cache hits after edits.
  const first = records[0];
  const last = records[records.length - 1];
  return [
    records.length,
    first?.date || '', first?.deshawar || '', first?.faridabad || '', first?.ghaziabad || '', first?.gali || '',
    last?.date || '', last?.deshawar || '', last?.faridabad || '', last?.ghaziabad || '', last?.gali || '',
  ].join('|');
}

export interface ScheduledJob<T> {
  promise: Promise<T>;
  cancel: () => void;
}

/**
 * Runs non-urgent work after the browser has painted. Stale jobs are cancellable.
 * This is for medium calculations; CPU-heavy historical replays should use a Worker.
 */
export function scheduleComputation<T>(task: () => T | Promise<T>, priority: ComputePriority = 'normal'): ScheduledJob<T> {
  let cancelled = false;
  let timeoutId: number | undefined;
  let idleId: number | undefined;
  let rejectRef: ((reason?: unknown) => void) | undefined;

  const promise = new Promise<T>((resolve, reject) => {
    rejectRef = reject;
    const run = async () => {
      if (cancelled) return;
      try { resolve(await task()); } catch (error) { reject(error); }
    };

    if (priority === 'interactive') {
      timeoutId = window.setTimeout(run, 0);
      return;
    }

    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout?: number }) => number);
    if (ric) idleId = ric(run, { timeout: priority === 'background' ? 1200 : 300 });
    else timeoutId = window.setTimeout(run, priority === 'background' ? 180 : 40);
  });

  return {
    promise,
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const cic = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
      if (idleId !== undefined && cic) cic(idleId);
      rejectRef?.(new DOMException('Computation cancelled', 'AbortError'));
    },
  };
}

/** Prevent duplicate concurrent work for the exact same cache key. */
const inFlight = new Map<string, Promise<unknown>>();
export async function computeOnce<T>(key: string, producer: () => Promise<T> | T): Promise<T> {
  const cached = analyticsCache.get<T>(key);
  if (cached !== undefined) return cached;
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const work = Promise.resolve().then(producer).then((value) => {
    analyticsCache.set(key, value);
    return value;
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, work);
  return work;
}
