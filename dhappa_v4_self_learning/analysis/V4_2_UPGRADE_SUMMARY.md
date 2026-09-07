# V4.2 Upgrade Summary

This release prioritizes responsiveness and model quality before adding new prediction formulas.

## Runtime changes
- Dedicated V4 ML Web Worker.
- Idle/deferred mounting for the three heaviest primary workflows.
- Pending heavy mounts are cancelled when navigation changes quickly.
- Performance policy defines FAST / STANDARD / DEEP analytical modes and explicit UI budgets.

## Model-quality policy
- Existing zero-lookahead boundary retained.
- Champion/challenger promotion remains mandatory.
- Recommended next adapter layer should score engines by market-specific forward lift, unique-hit contribution, stability and redundancy.
- Correlated engines must not be treated as independent votes.
- Weak engines should remain available in Lab but be excluded from production consensus.

## Current known bottlenecks
- PatternDashboardSection ~216 KB TSX.
- DailyGeneratorWorkflow ~185 KB TSX.
- Multiple historical/audit calculations are still synchronous inside these components.
- Full migration requires extracting pure calculation requests into workers and caching by datasetVersion + date + market + engineVersion.

## Validation status
The V4.2 JSX structure was syntax-checked after patching. A full dependency-backed TypeScript/build validation could not be completed because dependency installation exceeded the execution window; the package intentionally does not include node_modules.
