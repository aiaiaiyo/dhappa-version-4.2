# ML audit

`train_walkforward.py` is the experimental zero-lookahead audit used for this dataset. The committed `analysis/ml_walkforward_report.json` contains the exact run consumed by the UI.

Principles:
- no target-day draw feature is visible before prediction;
- learned data is appended only after prediction;
- ranking is evaluated against exact Top-K random baselines;
- p-values are shown rather than converting fitted confidence into unsupported certainty;
- market-specific behavior is kept separate because coefficients can change sign across markets.
