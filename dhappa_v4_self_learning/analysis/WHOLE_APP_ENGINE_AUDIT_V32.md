# DHAPPA V3.2 Whole-Application Engine / Endpoint Audit

## Scope
The application exposes two HTTP endpoints (`POST /api/scrape`, `GET /api/health`) plus the SPA fallback. Prediction intelligence is primarily local TypeScript engines rather than server endpoints. The source contains more than 30 analytical/ML engine modules and over 70 UI components.

## Predictive engine families assessed
- Quantitative: frequency, Markov transition, digit cluster, harmonic/mirror, delta distribution, entropy ranker, adaptive ensemble.
- Mathematical: Date Generator, Previous-Day repeated digit method, arithmetic pattern engine.
- Matrix: G-Square, G-Square harmonics, Belgium Square.
- Rule/family: Sir Abhishek, family/palti/rashi, doubles, contextual-family, previous-draw transitions.
- ML/ensemble: Multi-Head prediction, Consensus Matrix ML, learned rules, Beta Testing, Unified Walk-Forward, Pattern Dashboard.
- Diagnostic/non-predictive modules (coverage, missing-draw diagnostics, PDF/reporting, storage, risk allocation, UI) were not treated as independent predictors.

## Strict findings on supplied 230-row history
1. The prior 100% Pattern Dashboard Faridabad result was target leakage, not forecasting. The V3.1 hard cutoff (`record.date < targetDate`) remains mandatory.
2. Quantitative single engines on the 40% OOS block were mostly around random baselines. Best observed narrow results included Deshawar ensemble Top-10 15.9%, Faridabad delta/Markov Top-10 15.6%, but these are exploratory and multiple comparisons matter.
3. G-Square full walk-forward: Deshawar Top-10 10.9%, Faridabad 7.6%, Gali 8.4%, Ghaziabad 10.2% — approximately baseline.
4. Belgium Square reported Top-5 12.9% / Top-10 20.6% across 209 *opportunities*, but its candidate pool averages only ~6.4 and opportunities are conditional. It should be used as a gated sparse signal, not compared directly with an unconditional 100-number Top-10 forecast.
5. Sir Abhishek showed 75.1% “any-day” capture with an average 15-pair pool, but the implementation also accepts reverse-pair matches. Effective coverage is therefore much larger; the headline percentage is not evidence of a 75% per-market predictive probability.
6. Unified engine over the latest 30 days produced high day-level any-market percentages, while per-house Top-10 was much lower (DS 3.4%, FB 6.9%, GZB 0%, Gali 17.2%). Day-level and per-market metrics must never be mixed.

## ML experiments
A market-specific supervised meta-classifier was trained on earlier history and evaluated on an untouched final block. It failed: pooled final Top-10 ≈6.29%, Top-36 ≈35.43%. It is rejected.

An online Hedge-style adaptive ensemble was then evaluated. Hyperparameter eta=2 was selected on a separate validation block. On the untouched final block it produced pooled Top-5 ≈5.11%, Top-10 ≈7.39%, Top-20 ≈18.18%, Top-36 ≈34.66%. Deshawar alone reached Top-10 ≈13.64%, but pooled performance remained below baseline. This model is therefore retained only as an evidence-gated research ranker, not promoted as a validated predictor.

## Production rule
No engine may receive a production-confidence label unless its walk-forward confidence interval clears the appropriate random baseline on an untouched period. High historical percentages caused by pool width, any-of-four scoring, reverse matching, conditional opportunities, or target leakage must not be presented as predictive accuracy.
