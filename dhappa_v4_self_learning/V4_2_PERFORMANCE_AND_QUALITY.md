# DHAPPA V4.2 — Performance + Quality Upgrade

## Implemented

- V4 training moved off the browser main thread with a dedicated Web Worker.
- Automatic V4 retraining after data mutations now uses the same off-main-thread worker.
- Heavy Daily Generator, Pattern Dashboard and V4 Lab mounts are deferred and cancellable; rapid tab switching no longer starts analytical work for abandoned tabs.
- Existing lazy loading remains intact, so heavy modules stay cold until requested.
- Strict zero-lookahead and champion–challenger evaluation remain unchanged.

## Why this improves responsiveness

The largest analytical screens contain hundreds of KB of TSX and many expensive memoized calculations. Before V4.2 they were instantiated immediately when a tab became active. V4.2 first lets navigation paint, waits for idle/calm time, cancels the pending mount if the user switches again, and performs V4 model training in a Worker.

## Next performance migration

1. Extract Pattern Dashboard calculation into a worker-safe pure engine request.
2. Cache engine results by datasetVersion + targetDate + market + engineVersion.
3. Split PatternDashboardSection and DailyGeneratorWorkflow into memoized subpanels.
4. Virtualize long historical/audit tables.
5. Introduce a central normalized Feature Store with incremental updates.

## Quality architecture

Do not add more engines directly to final consensus. Treat engines as sensors and promote them only when they add unique forward hits after correlation/redundancy penalties. Keep four market-specific champion models and a protected chronological holdout.
