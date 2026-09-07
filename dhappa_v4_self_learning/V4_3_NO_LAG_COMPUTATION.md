# DHAPPA V4.3 — No-Lag Computation Runtime

## Core rule
The UI thread is reserved for navigation, input and rendering. Heavy analytics must be cached, deferred, cancelled, or executed in workers.

## Implemented in V4.3

- Heavy tabs are **load-once / keep-alive**. Pattern Dashboard, Daily Generator and V4 Lab preserve component state and memoized calculations when hidden.
- Daily Generator now has a **bounded persistent consensus cache** keyed by dataset fingerprint, target date, model, house, budget and active rule configuration.
- Duplicate historical benchmark and walk-forward requests reuse cached consensus outputs instead of recalculating them.
- Daily auto-generation is scheduled with `requestIdleCallback` (timeout fallback) and stale jobs are cancelled on parameter changes.
- Default benchmark work is reduced to the recent 5 days; the full 15-day multi-model benchmark is run only when the user explicitly enables it.
- ML rule generation during historical replay now receives `priorRecords` rather than the entire dataset. This is both faster and zero-lookahead safe.
- `src/runtime/computationBroker.ts` provides a reusable application-wide LRU cache, deterministic dataset fingerprint, idle scheduler, cancellation, and in-flight request deduplication.
- V4 model training remains in a Web Worker from V4.2.

## Required computation tiers

### Interactive (<50 ms target)
Tab changes, filters, dropdowns, sidebar, opening cached results. Never run historical loops here.

### Prediction (<500 ms target)
Use normalized features and cached engine snapshots. Reuse results for identical dataset/date/model keys.

### Background
ML retraining, walk-forward replay, engine tournaments, historical analogue search, correlation matrices. These belong in Web Workers/backend tasks.

## Cache invalidation
No global cache flush is needed for normal data edits. Every expensive key includes a dataset fingerprint. When records change, new keys are generated automatically. Cache size is bounded to prevent memory growth.

## Next worker migration
The remaining largest first-open cost is inside Pattern Dashboard and Daily Generator's legacy monolithic calculation functions. They should be extracted into pure `src/compute/*` modules and exposed through a worker protocol. V4.3 establishes the cache/scheduling contract needed for that migration without changing analytical outputs.
