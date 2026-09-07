# DHAPPA V3 Performance Migration

## Implemented immediately

1. Removed eager background loading of all large lazy modules. Analytical sections now stay cold until opened.
2. Replaced startup historical merge based on repeated `findIndex` with a Map-based O(n) merge.
3. Removed the unconditional full encrypted historical-data rewrite during every startup.
4. Added a reproducible ML audit and its exact out-of-sample report under `ml/` and `analysis/`.
5. Added a Tauri/Rust foundation under `src-tauri/` for progressive migration away from Electron.

## Target architecture

React/TypeScript remains the UI. Expensive analytics migrate behind Tauri commands to Rust. SQLite becomes the durable historical/cache store. Long-running engine replays should run off the React render thread and return immutable result payloads. Results should be cached by dataset hash + engine version + target date + parameters.

## Important scientific rule

Historical pattern discovery and prediction validation must be separated. A rule may be interesting descriptively but receives predictive weight only from zero-lookahead walk-forward evidence. The included 230-row audit currently finds no statistically credible pooled edge over random ranking.
