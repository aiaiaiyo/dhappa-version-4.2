# DHAPPA computation runtime

Rules enforced by the V4.3 runtime:

1. React renders UI; it does not own expensive analytical work.
2. Every reusable calculation gets a deterministic cache key containing dataset fingerprint + target + model/engine options.
3. Repeated requests share one in-flight Promise (`computeOnce`) rather than launching duplicate jobs.
4. Medium calculations are scheduled after paint and are cancellable (`scheduleComputation`).
5. Historical replay, ML training and other long CPU jobs belong in Web Workers.
6. Adding/editing a draw changes the dataset fingerprint, so cached calculations become naturally unreachable without clearing the whole application.
7. Navigation never waits for model training or walk-forward replay.
