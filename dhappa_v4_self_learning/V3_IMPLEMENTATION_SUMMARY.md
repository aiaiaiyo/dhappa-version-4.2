# DHAPPA V3 Implementation Summary

## Delivered in this source build

- Startup performance patch: O(n) historical merge using `Map`.
- Startup performance patch: removed unconditional full historical encrypted rewrite.
- Startup performance patch: removed eager import/preload of all large analytical modules.
- New `Rational ML Audit` navigation section with strict out-of-sample metrics.
- Supplied 230-row CSV bundled under `public/data/`.
- Exact walk-forward JSON report bundled for the UI and under `analysis/`.
- Reproducible ML training/audit code under `ml/`.
- Tauri 2 + Rust project foundation under `src-tauri/` for progressive migration from Electron.
- SQLite plugin foundation declared for the native shell.

## Scientific result from the supplied history

Across 664 out-of-sample market/date predictions, the candidate-ranking model produced Top-5 = 4.82%, Top-10 = 9.49%, Top-20 = 20.48%, and Top-36 = 36.90%. These are statistically indistinguishable from random 5%, 10%, 20%, and 36% baselines. The current data therefore does not justify claiming a reliable pooled predictive edge.

Deshawar showed the most interesting exploratory result (Top-10 14.02% vs 10%, one-sided p≈0.061) but it is not conventionally significant and is weaker after accounting for multiple comparisons. Treat it as a hypothesis requiring substantially more forward data.

## Migration status

The Rust/Tauri source foundation is included, but this execution environment does not contain `cargo`/`rustc`, so a native Tauri executable could not be compiled here. The existing React application remains the runnable frontend architecture while engines can be migrated one by one to Rust without changing their mathematical outputs.

A dependency/build validation was also attempted, but package installation did not complete within the execution window; no successful production build is claimed here.
