import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizePatternDashboardSnapshot,
  PATTERN_DASHBOARD_SCHEMA_VERSION,
} from './patternDashboardSchema';

test('normalizes a dashboard snapshot into a stable storage schema', () => {
  const snapshot = normalizePatternDashboardSnapshot({
    targetDate: '2026-08-30',
    candidates: [
      {
        pair: '23',
        possibilityScore: 88,
        occurrenceCount: 3,
        distinctEngineCount: 2,
        reversePair: '32',
        engineBadges: [
          {
            engineId: 'DATE_GEN',
            engineName: 'Date Generator',
            engineShort: 'DATE',
            badgeColor: 'bg-cyan-500/20 text-cyan-300',
            detail: 'Triad Pair #1',
          },
        ],
      },
    ],
  });

  assert.equal(snapshot.schemaVersion, PATTERN_DASHBOARD_SCHEMA_VERSION);
  assert.equal(snapshot.targetDate, '2026-08-30');
  assert.equal(snapshot.candidates.length, 1);
  assert.equal(snapshot.candidates[0].pair, '23');
  assert.equal(snapshot.metrics.totalCandidates, 1);
  assert.equal(snapshot.metrics.primaryCandidate, '23');
  assert.ok(snapshot.updatedAt.length > 0);
});
