import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createPrecisionIntelligenceEngineRegistry,
  normalizeEngineResult,
} from './precisionIntelligenceRegistry';

test('creates a canonical engine registry for the precision intelligence pipeline', () => {
  const registry = createPrecisionIntelligenceEngineRegistry();

  assert.ok(registry.length >= 8);
  assert.ok(registry.some((engine) => engine.engineId === 'BELGIUM_SQUARE'));
  assert.ok(registry.some((engine) => engine.engineId === 'G_SQUARE'));
  assert.ok(registry.some((engine) => engine.engineId === 'CONSENSUS'));
});

test('normalizes engine outputs to the standardized EngineResult shape', () => {
  const result = normalizeEngineResult({
    engineId: 'G_SQUARE_HARMONIC',
    methodName: 'G-Square Harmonic',
    candidates: ['27', '38'],
    rawScore: 82.5,
    confidence: 0.81,
    historicalSupport: 14,
    riskScore: 32,
    version: '1.0.0',
  });

  assert.equal(result.engineId, 'G_SQUARE_HARMONIC');
  assert.deepEqual(result.candidates, ['27', '38']);
  assert.equal(result.score, 82.5);
  assert.equal(result.confidence, 0.81);
  assert.equal(result.historicalSupport, 14);
  assert.equal(result.risk, 32);
  assert.ok(result.timestamp.length > 0);
});
