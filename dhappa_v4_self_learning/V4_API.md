# DHAPPA V4 API

## GET /api/v4/status
Returns objective, safeguards, and guarantee policy.

## POST /api/v4/train
Body: `{ "records": DayMarketEntry[] }`
Runs protected chronological champion–challenger training and returns the model registry.

## POST /api/v4/predict
Body: `{ "records": DayMarketEntry[], "targetDate": "YYYY-MM-DD", "market": "deshawar|faridabad|gali|ghaziabad" }`
Trains/selects a champion, hard-cuts all rows on/after targetDate, and returns ranked 00–99 candidates.

## POST /api/v4/learn
Body: `{ "records": DayMarketEntry[], "completedDraw": DayMarketEntry }`
Adds/merges a completed draw and reruns the champion–challenger evaluation. Learning occurs only after the completed result is supplied.
