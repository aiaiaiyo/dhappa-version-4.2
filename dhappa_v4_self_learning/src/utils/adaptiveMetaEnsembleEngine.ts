import { DayMarketEntry } from '../types';
import {
  generateAllOutcomes,
  runFrequencyEngine,
  runMarkovTransitionEngine,
  runDigitClusterEngine,
  runHarmonicMirrorEngine,
  runDeltaDistributionEngine,
  runEntropyRankerEngine,
  ModelScoreMap,
} from './quantitativeEngine';
import { generatePairsForDate, computePreviousDayRepeatedDigitMethod } from './mathEngine';
import { calculateSirAbhishekTheory } from './sirAbhishekTheoryEngine';

export type AdaptiveMetaMarket = 'deshawar' | 'faridabad' | 'gali' | 'ghaziabad';

export interface AdaptiveMetaCandidate {
  pair: string;
  score: number;
  rank: number;
  contributions: Record<string, number>;
}

export interface AdaptiveMetaResult {
  targetDate: string;
  market: AdaptiveMetaMarket;
  candidates: AdaptiveMetaCandidate[];
  top5: string[];
  top10: string[];
  top20: string[];
  top36: string[];
  weights: Record<string, number>;
  evidenceStatus: 'NO_DEMONSTRATED_EDGE' | 'EXPLORATORY_SIGNAL';
  note: string;
}

const ENGINE_NAMES = [
  'frequency', 'markov', 'digit', 'harmonic', 'delta', 'entropy',
  'dateGenerator', 'previousDay', 'sirTheory', 'sirDelta'
] as const;

type EngineName = typeof ENGINE_NAMES[number];

function normalizeRankMap(scores: ModelScoreMap): Record<string, number> {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const result: Record<string, number> = {};
  entries.forEach(([pair], idx) => { result[pair] = 1 - idx / 99; });
  return result;
}

function listRankMap(list: string[]): Record<string, number> {
  const uniq = Array.from(new Set(list.map(p => String(p).padStart(2, '0').slice(-2))));
  const result: Record<string, number> = {};
  uniq.forEach((pair, idx) => { result[pair] = 1 - idx / Math.max(1, uniq.length); });
  return result;
}

function makeSignalMaps(history: DayMarketEntry[], targetDate: string, market: AdaptiveMetaMarket) {
  const maps: Record<EngineName, Record<string, number>> = {
    frequency: normalizeRankMap(runFrequencyEngine(history, market)),
    markov: normalizeRankMap(runMarkovTransitionEngine(history, market)),
    digit: normalizeRankMap(runDigitClusterEngine(history, market)),
    harmonic: normalizeRankMap(runHarmonicMirrorEngine(history, market)),
    delta: normalizeRankMap(runDeltaDistributionEngine(history, market)),
    entropy: normalizeRankMap(runEntropyRankerEngine(history, market)),
    dateGenerator: listRankMap(generatePairsForDate(targetDate).pairs || []),
    previousDay: {},
    sirTheory: {},
    sirDelta: {},
  };

  const sorted = [...history].sort((a,b) => a.date.localeCompare(b.date));
  const prev = sorted[sorted.length - 1];
  if (prev) {
    const prevOutcomes = [prev.deshawar, prev.faridabad, prev.gali, prev.ghaziabad || prev.gzb]
      .filter((v): v is string => Boolean(v));
    try {
      const p = computePreviousDayRepeatedDigitMethod(prevOutcomes, prev.date);
      maps.previousDay = listRankMap(p.isNoResult ? [] : p.branches.flatMap(b => b.finalPairs));
    } catch { /* leave empty */ }
    try {
      const s = calculateSirAbhishekTheory({
        sourceDate: prev.date,
        deshawar: prev.deshawar || '',
        faridabad: prev.faridabad || '',
        gali: prev.gali || '',
        gzb: prev.ghaziabad || prev.gzb || '',
      });
      maps.sirTheory = listRankMap(s.pairSet || []);
      maps.sirDelta = listRankMap(s.faridabadDelta?.fullDeltaSeries || []);
    } catch { /* leave empty */ }
  }
  return maps;
}

/**
 * Online evidence weighting.  Each historical target is predicted before its result
 * is exposed. Engine weights are updated only afterwards, preventing target leakage.
 */
function learnWeights(records: DayMarketEntry[], market: AdaptiveMetaMarket, eta = 2, minHistory = 30) {
  const sorted = [...records].sort((a,b) => a.date.localeCompare(b.date));
  const weights: Record<EngineName, number> = Object.fromEntries(ENGINE_NAMES.map(n => [n, 1])) as Record<EngineName, number>;
  const decay = 0.98;

  for (let i = minHistory; i < sorted.length; i++) {
    const actualRaw = sorted[i][market];
    if (!actualRaw || typeof actualRaw !== 'string') continue;
    const actual = actualRaw.padStart(2, '0').slice(-2);
    const maps = makeSignalMaps(sorted.slice(0, i), sorted[i].date, market);

    for (const name of ENGINE_NAMES) {
      const signal = maps[name][actual] || 0;
      // Reward only strong/top-decile evidence; subtract random 10% expectation.
      const reward = (signal >= 0.90 ? 1 : 0) - 0.10;
      weights[name] = Math.pow(Math.max(weights[name], 1e-6), decay) * Math.exp(eta * reward);
      weights[name] = Math.min(1e6, Math.max(1e-6, weights[name]));
    }
  }
  const total = ENGINE_NAMES.reduce((s,n) => s + weights[n], 0) || 1;
  ENGINE_NAMES.forEach(n => { weights[n] /= total; });
  return weights;
}

export function computeAdaptiveMetaEnsemble(
  records: DayMarketEntry[],
  targetDate: string,
  market: AdaptiveMetaMarket,
  eta = 2
): AdaptiveMetaResult {
  // Hard cutoff: this engine refuses to see the target/future records.
  const history = records.filter(r => r.date < targetDate).sort((a,b) => a.date.localeCompare(b.date));
  const weights = learnWeights(history, market, eta);
  const maps = makeSignalMaps(history, targetDate, market);

  const candidates = generateAllOutcomes().map(pair => {
    const contributions: Record<string, number> = {};
    let score = 0;
    for (const name of ENGINE_NAMES) {
      const contribution = weights[name] * (maps[name][pair] || 0);
      contributions[name] = contribution;
      score += contribution;
    }
    return { pair, score, rank: 0, contributions };
  }).sort((a,b) => b.score - a.score || a.pair.localeCompare(b.pair));

  candidates.forEach((c, idx) => { c.rank = idx + 1; });
  return {
    targetDate,
    market,
    candidates,
    top5: candidates.slice(0,5).map(c => c.pair),
    top10: candidates.slice(0,10).map(c => c.pair),
    top20: candidates.slice(0,20).map(c => c.pair),
    top36: candidates.slice(0,36).map(c => c.pair),
    weights,
    evidenceStatus: 'NO_DEMONSTRATED_EDGE',
    note: 'Strict past-only online ensemble. Historical testing on the supplied 230-row dataset did not establish pooled performance above random; use as a ranked research signal, not a guarantee.',
  };
}
