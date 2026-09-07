# V4 Implementation Summary

Added `src/v4/selfLearningCore.ts` with a strict chronological self-learning core and `src/components/SelfLearningV4Section.tsx` with a front-end Champion–Challenger lab.

The V4 model learns market-specific feature weights from completed draws. It evaluates four challenger strategies on a protected final 20% chronological holdout and promotes the best objective score. All historical prediction features are generated from rows strictly earlier than the target date.

The framework is deliberately conservative: a model can be the current champion without being labeled as a demonstrated predictive edge. That distinction prevents a best-among-challengers model from being misrepresented as statistically proven.
