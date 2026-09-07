import { DayMarketEntry, MARKETS } from '../types';

export interface RationalPatternRuleProfile {
  fiveDayMomentum: {
    active: boolean;
    opportunityCount: number;
    hitRatePct: number;
    baselinePct: number;
    lift: number;
  };
  tripleEngineConvergence: {
    active: boolean;
    minimumEngines: number;
  };
  dualHarufAlignment: {
    active: boolean;
    activeDigits: string[];
  };
}

function outcomesForRecord(record: DayMarketEntry): string[] {
  return MARKETS.flatMap((market) => {
    const key = (market === 'Ghaziabad' ? 'ghaziabad' : market.toLowerCase()) as keyof DayMarketEntry;
    const value = record[key];
    return value && typeof value === 'string' && /^\d{2}$/.test(value.trim())
      ? [value.trim().padStart(2, '0')]
      : [];
  });
}

function rollingMomentumStats(records: DayMarketEntry[]): { opportunities: number; hits: number; baseline: number } {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  let opportunities = 0;
  let hits = 0;
  let baseline = 0;

  for (let index = 5; index < sorted.length; index++) {
    const priorWindow = sorted.slice(Math.max(0, index - 5), index).flatMap(outcomesForRecord);
    const priorPairs = new Set(priorWindow);
    if (priorPairs.size === 0) continue;

    opportunities++;
    baseline += Math.min(priorPairs.size, 100) / 100;
    if (outcomesForRecord(sorted[index]).some((pair) => priorPairs.has(pair))) hits++;
  }

  return { opportunities, hits, baseline };
}

/**
 * Derive only past-dependent rules. A rule is promoted when it has at least
 * twelve chronological opportunities and beats the 10% single-pair baseline.
 */
export function deriveRationalPatternRules(records: DayMarketEntry[], targetDate: string): RationalPatternRuleProfile {
  const priorRecords = records
    .filter((record) => record.date < targetDate)
    .sort((a, b) => a.date.localeCompare(b.date));
  const momentum = rollingMomentumStats(priorRecords);
  const hitRate = momentum.opportunities > 0 ? (momentum.hits / momentum.opportunities) * 100 : 0;
  const baselinePct = momentum.opportunities > 0 ? (momentum.baseline / momentum.opportunities) * 100 : 0;
  const lift = baselinePct > 0 ? hitRate / baselinePct : 0;
  const recentOutcomes = priorRecords.slice(-5).flatMap(outcomesForRecord);
  const activeDigits = [...new Set(recentOutcomes.flatMap((pair) => pair.split('')))].sort();

  return {
    fiveDayMomentum: {
      active: momentum.opportunities >= 20 && lift >= 1.05,
      opportunityCount: momentum.opportunities,
      hitRatePct: Math.round(hitRate * 10) / 10,
      baselinePct: Math.round(baselinePct * 10) / 10,
      lift: Math.round(lift * 100) / 100,
    },
    tripleEngineConvergence: {
      active: false,
      minimumEngines: 3,
    },
    dualHarufAlignment: {
      active: false,
      activeDigits,
    },
  };
}
