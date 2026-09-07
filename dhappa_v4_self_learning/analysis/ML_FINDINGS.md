# V3 Rational ML / Walk-Forward Findings

Dataset: 230 dated rows from 2026-01-01 through 2026-09-06 across Deshawar, Faridabad, Gali and Ghaziabad. Missing values are preserved and never imputed as ground truth.

## Validation protocol

The audit uses zero-lookahead, expanding-window candidate ranking. Calendar features are known in advance; all draw-derived features use only observations strictly before the target date. Initial history is used for training, then future blocks are predicted before those observations are learned. Candidate ranks are evaluated as Top-5, Top-10, Top-20 and Top-36 against the exact random baselines 5%, 10%, 20% and 36%.

## Pooled out-of-sample result

- 664 market-date predictions.
- Mean actual-number rank: 50.31 (random ranking expectation is about 50.5).
- Top-5: 32/664 = 4.82%; random baseline 5%; one-sided p = 0.610.
- Top-10: 63/664 = 9.49%; random baseline 10%; p = 0.688.
- Top-20: 136/664 = 20.48%; random baseline 20%; p = 0.393.
- Top-36: 245/664 = 36.90%; random baseline 36%; p = 0.328.

No pooled tier demonstrates statistically credible predictive advantage in this dataset. The app must therefore distinguish descriptive pattern fit from validated out-of-sample edge.

## Market observations

Deshawar is the only market with a suggestive directional lift in this particular run (Top-10 14.02% vs 10%, p≈0.061), but it does not cross a conventional 5% threshold and is weaker after accounting for multiple markets/tier tests. This is a hypothesis for more data, not a validated prediction rule.

The other markets are at or below random expectation in Top-5/Top-10. Learned coefficient signs also differ sharply by market (for example repeat/reverse effects), warning against a single universal numerology rule.

## Engineering decision

V3 should report empirical walk-forward hit rates, sample size, random baseline, calibration and significance alongside any prediction. Any engine that cannot beat its baseline out of sample should be down-weighted or marked `NO_DEMONSTRATED_EDGE`; it should never gain confidence merely because it explains historical outcomes after the fact.
