# DHAPPA V4 — Self-Learning Architecture

## Objective
Maximize verified forward Top-K hit rate while enforcing 100% chronological integrity. Exact 100% outcome prediction is not a valid engineering guarantee; 100% coverage is trivially possible only by returning all 100 outcomes.

## Layers
1. Data ledger: immutable dated draw observations; invalid placeholders excluded.
2. Feature store: past-only frequency, recency, empirical gap hazard, 10/60 acceleration, digit-state, calendar context, delta transitions, family, palti/mirror, cross-market prior state.
3. Market learners: independent DS/FB/Gali/Ghaziabad adaptive weights.
4. Candidate ranker: scores all 00–99; bounded consensus breadth bonus.
5. Champion–challenger registry: balanced, recency/delta, hierarchical digit, relation-context challengers.
6. Protected evaluation: final 20% chronological holdout; Top-5/10/20/36 + mean rank + market stability.
7. Promotion gate: only a challenger with better protected objective and non-regressing Top-10 can become champion.
8. Post-draw learning: actual outcome is ingested only after the prediction is frozen.

## Self-learning loop
INGEST COMPLETED DRAW → VALIDATE → APPEND LEDGER → REPLAY CHALLENGERS → SCORE HOLDOUT → PROMOTE/REJECT → VERSION MODEL → PREDICT NEXT DATE.

## Future extension adapters
The existing Pattern Dashboard, Belgium Square, G-Square, Date Intelligence and other engines should enter the V4 feature store as ranked signals. Each adapter must accept only `records.filter(r => r.date < targetDate)` and expose candidate ranks, not synthetic probabilities.

## Non-negotiable safeguards
- No target-day/current-result anchoring.
- No full-history rule training during historical replay.
- No hard-coded 90%+ confidence labels without empirical calibration.
- No model promotion from training-set fit.
- No Top-36/any-market headline used as a substitute for per-market Top-10 accuracy.
