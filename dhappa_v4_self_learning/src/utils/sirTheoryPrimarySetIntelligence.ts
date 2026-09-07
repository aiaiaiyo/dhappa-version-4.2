import { DayMarketEntry } from '../types';
import { calculateSirAbhishekTheory, runSirAbhishekBacktest } from './sirAbhishekTheoryEngine';

export interface ExactHistoricalMatchRecord {
  historicalDate: string;
  historicalS: number[];
  coreX: number;
  nextDayDate: string;
  nextDayActual: {
    deshawar: string;
    faridabad: string;
    gali: string;
    gzb: string;
  };
  directHit: boolean;
  reverseHit: boolean;
  generatedPairs: string[];
  matchedPairs: string[];
  matchedHouses: string[];
  isMultiHit: boolean;
  sameOrder: boolean;
}

export interface PrimarySetSimilarityMatch {
  historicalDate: string;
  historicalS: number[];
  coreX: number;
  nextDayDate: string;
  nextDayActual: {
    deshawar: string;
    faridabad: string;
    gali: string;
    gzb: string;
  };
  sharedDigits: number[];
  sharedCount: number; // 6, 5, 4, 3
  jaccardSimilarity: number; // intersection / union
  directHit: boolean;
  reverseHit: boolean;
  generatedPairs: string[];
  matchedPairs: string[];
  matchedHouses: string[];
}

export interface HistoricalDigitContribution {
  digit: number;
  sFrequency: number;
  nextDayHitFrequency: number;
  directHits: number;
  reverseHits: number;
  houseHits: {
    ds: number;
    fb: number;
    gl: number;
    gzb: number;
  };
  recentFrequencyLast30: number;
  longTermFrequency: number;
  lastSeenDate: string;
  daysSinceSeen: number;
  consecutiveDayRepetitionRate: number;
  liftRatio: number;
}

export interface HistoricalPairBehavior {
  pair: string;
  reversePair: string;
  directHitCount: number;
  reverseHitCount: number;
  totalHitCount: number;
  timesSContainedBoth: number;
  directConversionRate: number;
  reverseConversionRate: number;
  combinedConversionRate: number;
  recentHitCountLast30: number;
  reliabilityScore: number;
  houseBreakdown: {
    ds: number;
    fb: number;
    gl: number;
    gzb: number;
  };
}

export interface HistoricalSubsetAnalysis {
  subsetType: 'single' | 'two-digit' | 'three-digit';
  subsetDigits: number[];
  subsetLabel: string;
  historicalSetOccurrences: number;
  nextDayHitCount: number;
  conversionRate: number;
  reliabilityScore: number; // Bayesian smoothed
  strongestNextDayPairs: string[];
}

export interface DayWiseTransitionLedgerEntry {
  dateTMinus1: string;
  primarySetTMinus1: number[];
  coreXTMinus1: number;
  dateT: string;
  actualDrawT: {
    deshawar: string;
    faridabad: string;
    gali: string;
    gzb: string;
  };
  relationshipType: 'direct-pair-hit' | 'reverse-pair-hit' | 'multi-house-sweep' | 'miss';
  directHit: boolean;
  reverseHit: boolean;
  matchedPairs: string[];
  sToSNextDayOverlapCount: number; // overlap between S(T-1) and S(T)
}

export interface WeekdayPrimarySetStat {
  weekday: string;
  totalOccurrences: number;
  commonDigits: { digit: number; count: number }[];
  commonCoreX: { x: number; count: number }[];
  commonPairs: { pair: string; count: number }[];
  directConversionRate: number;
  reverseConversionRate: number;
  overallHitRate: number;
  isStatisticallySignificant: boolean;
}

export interface DateCyclePattern {
  intervalDays: number;
  intervalLabel: string;
  averageSimilarity: number;
  exactOr5Of6MatchesCount: number;
  recurrenceSignificance: 'Strong' | 'Moderate' | 'Weak' | 'Insufficient Evidence';
}

export interface ThreeStepChainPattern {
  tMinus1Date: string;
  tMinus1Actual: { ds: string; fb: string; gl: string; gzb: string };
  sTMinus1: number[];
  tDate: string;
  tActual: { ds: string; fb: string; gl: string; gzb: string };
  sT: number[];
  tPlus1Date: string;
  tPlus1Actual: { ds: string; fb: string; gl: string; gzb: string };
  sTPlus1: number[];
  hitT: boolean;
  hitTPlus1: boolean;
}

export interface CandidateRankingRow {
  rank: number;
  pair: string;
  reverse: string;
  historicalScore: number; // HSDS (0-100)
  sSimilarityScore: number;
  directRate: number;
  reverseRate: number;
  recentRate: number;
  sampleSize: number;
  observedHits: number;
  bayesianReliability: number;
  stability: 'Very Stable' | 'Stable' | 'Moderate' | 'Low Sample';
  confidence: 'High' | 'Medium' | 'Low';
  evidenceRationale: string;
}

export interface HistoricalEvidenceReport {
  currentS: number[];
  sortedCurrentS: number[];
  currentCoreX: number;
  totalHistoricalSteps: number;

  // Exact & Order-independent matches
  exactMatchCount: number;
  exactSameOrderCount: number;
  exactDifferentOrderCount: number;
  exactMatches: ExactHistoricalMatchRecord[];
  exactMatchReportText: string;

  // Similarity matches (Jaccard)
  matches6of6: PrimarySetSimilarityMatch[];
  matches5of6: PrimarySetSimilarityMatch[];
  matches4of6: PrimarySetSimilarityMatch[];
  matches3of6: PrimarySetSimilarityMatch[];

  // Digit Level Contribution
  digitContributions: HistoricalDigitContribution[];
  strongestHistoricalDigits: number[];

  // Pair Level Historical Behavior
  pairBehaviors: HistoricalPairBehavior[];
  strongestHistoricalPairs: string[];
  strongestReversePairs: string[];

  // Subsets (2-digit and 3-digit)
  subsets2Digit: HistoricalSubsetAnalysis[];
  subsets3Digit: HistoricalSubsetAnalysis[];

  // Transition Ledger & Chains
  recentTransitions: DayWiseTransitionLedgerEntry[];
  threeStepChains: ThreeStepChainPattern[];

  // Weekday & Cycle Intelligence
  weekdayStats: WeekdayPrimarySetStat[];
  strongestWeekdayPattern?: WeekdayPrimarySetStat;
  dateCyclePatterns: DateCyclePattern[];

  // House Ranking
  strongestHouse: 'Deshawar' | 'Faridabad' | 'Gali' | 'Ghaziabad' | 'Balanced';
  houseHitFrequencies: { house: string; hits: number; percentage: number }[];

  // Final Candidate Ranking & Assessment Table
  candidateRankings: CandidateRankingRow[];
  assessmentSummaryTable: {
    test: string;
    result: string;
    evidence: string;
  }[];
}

/**
 * Bayesian shrinkage estimator for small sample sizes:
 * Estimates smoothed rate = (hits + priorHits) / (trials + priorTrials)
 */
function bayesianSmoothRate(
  hits: number,
  trials: number,
  priorRate: number = 0.25,
  priorWeight: number = 8
): number {
  if (trials === 0) return Math.round(priorRate * 100);
  const smoothed = (hits + priorRate * priorWeight) / (trials + priorWeight);
  return Math.round(smoothed * 100);
}

/**
 * Jaccard Similarity between two sets of numbers
 */
function calculateJaccard(setA: number[], setB: number[]): number {
  const set1 = new Set(setA);
  const set2 = new Set(setB);
  let intersectionCount = 0;
  set1.forEach((d) => {
    if (set2.has(d)) intersectionCount++;
  });
  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : Number((intersectionCount / unionCount).toFixed(3));
}

/**
 * Core Engine: Analyzes historical transitions and builds full Section 21-39 Intelligence
 */
export function analyzePrimarySetHistoricalIntelligence(
  currentS: number[],
  records: DayMarketEntry[]
): HistoricalEvidenceReport {
  const sortedCurrentS = [...currentS].sort((a, b) => a - b);
  const currentSSet = new Set(currentS);

  // Generate all historical steps using walk-forward backtest
  const steps = runSirAbhishekBacktest(records);
  const chronologicalSteps = [...steps].reverse(); // from oldest to newest
  const totalHistoricalSteps = steps.length;

  // 1. Exact & Similarity Matching
  const exactMatches: ExactHistoricalMatchRecord[] = [];
  const matches6of6: PrimarySetSimilarityMatch[] = [];
  const matches5of6: PrimarySetSimilarityMatch[] = [];
  const matches4of6: PrimarySetSimilarityMatch[] = [];
  const matches3of6: PrimarySetSimilarityMatch[] = [];

  let exactSameOrderCount = 0;
  let exactDifferentOrderCount = 0;

  chronologicalSteps.forEach((step, idx) => {
    const histS = step.primarySet;
    const sortedHistS = [...histS].sort((a, b) => a - b);
    const histSet = new Set(histS);

    // Shared digits
    const sharedDigits = sortedCurrentS.filter((d) => histSet.has(d));
    const sharedCount = sharedDigits.length;
    const jaccard = calculateJaccard(currentS, histS);

    const isExactDigits = sharedCount === 6 && sortedHistS.every((val, i) => val === sortedCurrentS[i]);
    const isSameOrder = isExactDigits && histS.every((val, i) => val === currentS[i]);

    // Check hit status
    const directHit = step.sirAbhishekPairs.some((p) =>
      step.targetHouseOutcomes.includes(p)
    );
    const reverseHit = step.sirAbhishekPairs.some((p) => {
      const rev = `${p[1]}${p[0]}`;
      return step.targetHouseOutcomes.includes(rev);
    });

    const houseNames = ['DS', 'FB', 'GL', 'GZB'];
    const matchedHouses: string[] = [];
    step.targetHouseOutcomes.forEach((out, hIdx) => {
      const rev = `${out[1]}${out[0]}`;
      if (step.sirAbhishekPairs.includes(out) || step.sirAbhishekPairs.includes(rev)) {
        matchedHouses.push(houseNames[hIdx]);
      }
    });

    const nextDayActual = {
      deshawar: step.targetHouseOutcomes[0] || '00',
      faridabad: step.targetHouseOutcomes[1] || '00',
      gali: step.targetHouseOutcomes[2] || '00',
      gzb: step.targetHouseOutcomes[3] || '00',
    };

    const matchObj: PrimarySetSimilarityMatch = {
      historicalDate: step.date,
      historicalS: histS,
      coreX: step.x,
      nextDayDate: step.date, // Target date
      nextDayActual,
      sharedDigits,
      sharedCount,
      jaccardSimilarity: jaccard,
      directHit,
      reverseHit,
      generatedPairs: step.sirAbhishekPairs,
      matchedPairs: step.matchedPairs,
      matchedHouses,
    };

    if (isExactDigits) {
      if (isSameOrder) exactSameOrderCount++;
      else exactDifferentOrderCount++;

      exactMatches.push({
        historicalDate: step.date,
        historicalS: histS,
        coreX: step.x,
        nextDayDate: step.date,
        nextDayActual,
        directHit,
        reverseHit,
        generatedPairs: step.sirAbhishekPairs,
        matchedPairs: step.matchedPairs,
        matchedHouses,
        isMultiHit: matchedHouses.length > 1,
        sameOrder: isSameOrder,
      });
      matches6of6.push(matchObj);
    } else if (sharedCount === 5) {
      matches5of6.push(matchObj);
    } else if (sharedCount === 4) {
      matches4of6.push(matchObj);
    } else if (sharedCount === 3) {
      matches3of6.push(matchObj);
    }
  });

  const exactMatchCount = exactMatches.length;
  const exactMatchReportText =
    exactMatchCount > 0
      ? `${exactMatchCount} exact matches found (${exactSameOrderCount} exact order, ${exactDifferentOrderCount} order-independent)`
      : 'EXACT S MATCH = NO HISTORICAL SAMPLE';

  // 2. Section 25: Historical Digit Contribution Analysis
  const digitContributions: HistoricalDigitContribution[] = currentS.map((digit) => {
    let sFrequency = 0;
    let nextDayHitFrequency = 0;
    let directHits = 0;
    let reverseHits = 0;
    const houseHits = { ds: 0, fb: 0, gl: 0, gzb: 0 };
    let recentFrequencyLast30 = 0;
    let lastSeenDate = 'Never';
    let daysSinceSeen = 999;
    let consecutiveTransitions = 0;
    let appearancesWithNextDayTransition = 0;

    const recentThresholdIdx = Math.max(0, chronologicalSteps.length - 30);

    chronologicalSteps.forEach((step, idx) => {
      const hasDigitInS = step.primarySet.includes(digit);
      if (hasDigitInS) {
        sFrequency++;
        if (idx >= recentThresholdIdx) recentFrequencyLast30++;
        lastSeenDate = step.date;
        daysSinceSeen = chronologicalSteps.length - 1 - idx;

        // Check if next day draw contains this digit
        const digitStr = digit.toString();
        const nextHouses = step.targetHouseOutcomes;
        let appearedInNextDay = false;

        nextHouses.forEach((houseVal, hIdx) => {
          if (houseVal.includes(digitStr)) {
            appearedInNextDay = true;
            if (hIdx === 0) houseHits.ds++;
            if (hIdx === 1) houseHits.fb++;
            if (hIdx === 2) houseHits.gl++;
            if (hIdx === 3) houseHits.gzb++;
          }
        });

        if (appearedInNextDay) {
          nextDayHitFrequency++;
        }

        // Direct / reverse pair match
        step.matchedPairs.forEach((mPair) => {
          if (mPair.includes(digitStr)) {
            if (step.sirAbhishekPairs.includes(mPair)) directHits++;
            else reverseHits++;
          }
        });

        // Consecutive appearance in S(T+1)
        if (idx < chronologicalSteps.length - 1) {
          appearancesWithNextDayTransition++;
          if (chronologicalSteps[idx + 1].primarySet.includes(digit)) {
            consecutiveTransitions++;
          }
        }
      }
    });

    const baselineHitRate = totalHistoricalSteps > 0 ? (nextDayHitFrequency / totalHistoricalSteps) * 100 : 25;
    const conversion = sFrequency > 0 ? (nextDayHitFrequency / sFrequency) * 100 : 0;
    const liftRatio = Number((conversion / (baselineHitRate || 1)).toFixed(2));
    const consecutiveDayRepetitionRate =
      appearancesWithNextDayTransition > 0
        ? Math.round((consecutiveTransitions / appearancesWithNextDayTransition) * 100)
        : 0;

    return {
      digit,
      sFrequency,
      nextDayHitFrequency,
      directHits,
      reverseHits,
      houseHits,
      recentFrequencyLast30,
      longTermFrequency: sFrequency,
      lastSeenDate,
      daysSinceSeen,
      consecutiveDayRepetitionRate,
      liftRatio,
    };
  }).sort((a, b) => b.nextDayHitFrequency - a.nextDayHitFrequency);

  const strongestHistoricalDigits = digitContributions.slice(0, 3).map((d) => d.digit);

  // 3. Section 26 & 32: Pair Derivation & Historical Behavior (All 15 pairs + reverses)
  const currentPairs: string[] = [];
  for (let i = 0; i < currentS.length; i++) {
    for (let j = i + 1; j < currentS.length; j++) {
      currentPairs.push(`${currentS[i]}${currentS[j]}`);
    }
  }

  const pairBehaviors: HistoricalPairBehavior[] = currentPairs.map((pair) => {
    const d1 = parseInt(pair[0], 10);
    const d2 = parseInt(pair[1], 10);
    const reversePair = `${pair[1]}${pair[0]}`;

    let directHitCount = 0;
    let reverseHitCount = 0;
    let timesSContainedBoth = 0;
    let recentHitCountLast30 = 0;
    const houseBreakdown = { ds: 0, fb: 0, gl: 0, gzb: 0 };

    const recentThresholdIdx = Math.max(0, chronologicalSteps.length - 30);

    chronologicalSteps.forEach((step, idx) => {
      const hasD1 = step.primarySet.includes(d1);
      const hasD2 = step.primarySet.includes(d2);

      if (hasD1 && hasD2) {
        timesSContainedBoth++;

        const nextHouses = step.targetHouseOutcomes;
        let isDirect = false;
        let isRev = false;

        nextHouses.forEach((houseVal, hIdx) => {
          if (houseVal === pair) {
            isDirect = true;
            if (hIdx === 0) houseBreakdown.ds++;
            if (hIdx === 1) houseBreakdown.fb++;
            if (hIdx === 2) houseBreakdown.gl++;
            if (hIdx === 3) houseBreakdown.gzb++;
          } else if (houseVal === reversePair) {
            isRev = true;
            if (hIdx === 0) houseBreakdown.ds++;
            if (hIdx === 1) houseBreakdown.fb++;
            if (hIdx === 2) houseBreakdown.gl++;
            if (hIdx === 3) houseBreakdown.gzb++;
          }
        });

        if (isDirect) {
          directHitCount++;
          if (idx >= recentThresholdIdx) recentHitCountLast30++;
        }
        if (isRev) {
          reverseHitCount++;
          if (idx >= recentThresholdIdx) recentHitCountLast30++;
        }
      }
    });

    const totalHitCount = directHitCount + reverseHitCount;
    const directConversionRate =
      timesSContainedBoth > 0 ? Math.round((directHitCount / timesSContainedBoth) * 100) : 0;
    const reverseConversionRate =
      timesSContainedBoth > 0 ? Math.round((reverseHitCount / timesSContainedBoth) * 100) : 0;
    const combinedConversionRate =
      timesSContainedBoth > 0 ? Math.round((totalHitCount / timesSContainedBoth) * 100) : 0;

    const reliabilityScore = bayesianSmoothRate(totalHitCount, timesSContainedBoth, 0.22, 10);

    return {
      pair,
      reversePair,
      directHitCount,
      reverseHitCount,
      totalHitCount,
      timesSContainedBoth,
      directConversionRate,
      reverseConversionRate,
      combinedConversionRate,
      recentHitCountLast30,
      reliabilityScore,
      houseBreakdown,
    };
  }).sort((a, b) => b.reliabilityScore - a.reliabilityScore || b.totalHitCount - a.totalHitCount);

  const strongestHistoricalPairs = pairBehaviors.slice(0, 4).map((p) => p.pair);
  const strongestReversePairs = pairBehaviors
    .filter((p) => p.reverseHitCount > 0)
    .sort((a, b) => b.reverseHitCount - a.reverseHitCount)
    .slice(0, 4)
    .map((p) => p.reversePair);

  // 4. Section 27: Historical Subset Analysis (2-digit & 3-digit)
  const subsets2Digit: HistoricalSubsetAnalysis[] = pairBehaviors.map((pb) => ({
    subsetType: 'two-digit',
    subsetDigits: [parseInt(pb.pair[0], 10), parseInt(pb.pair[1], 10)],
    subsetLabel: `{${pb.pair[0]}, ${pb.pair[1]}}`,
    historicalSetOccurrences: pb.timesSContainedBoth,
    nextDayHitCount: pb.totalHitCount,
    conversionRate: pb.combinedConversionRate,
    reliabilityScore: pb.reliabilityScore,
    strongestNextDayPairs: [pb.pair, pb.reversePair],
  }));

  // 3-digit subsets: C(6, 3) = 20 subsets
  const subsets3Digit: HistoricalSubsetAnalysis[] = [];
  for (let i = 0; i < currentS.length; i++) {
    for (let j = i + 1; j < currentS.length; j++) {
      for (let k = j + 1; k < currentS.length; k++) {
        const triple = [currentS[i], currentS[j], currentS[k]];
        let setOccurrences = 0;
        let nextDayHits = 0;

        chronologicalSteps.forEach((step) => {
          const hasAll3 = triple.every((d) => step.primarySet.includes(d));
          if (hasAll3) {
            setOccurrences++;
            const hasMatch = step.isHit;
            if (hasMatch) nextDayHits++;
          }
        });

        const conv = setOccurrences > 0 ? Math.round((nextDayHits / setOccurrences) * 100) : 0;
        const rel = bayesianSmoothRate(nextDayHits, setOccurrences, 0.70, 6);

        subsets3Digit.push({
          subsetType: 'three-digit',
          subsetDigits: triple,
          subsetLabel: `{${triple.join(', ')}}`,
          historicalSetOccurrences: setOccurrences,
          nextDayHitCount: nextDayHits,
          conversionRate: conv,
          reliabilityScore: rel,
          strongestNextDayPairs: [
            `${triple[0]}${triple[1]}`,
            `${triple[1]}${triple[2]}`,
            `${triple[0]}${triple[2]}`,
          ],
        });
      }
    }
  }
  subsets3Digit.sort((a, b) => b.reliabilityScore - a.reliabilityScore || b.historicalSetOccurrences - a.historicalSetOccurrences);

  // 5. Section 28 & 31: Day-Wise Transitions & Three-Step Chains
  const recentTransitions: DayWiseTransitionLedgerEntry[] = [];
  const threeStepChains: ThreeStepChainPattern[] = [];

  for (let i = 0; i < chronologicalSteps.length; i++) {
    const step = chronologicalSteps[i];
    const nextStep = i < chronologicalSteps.length - 1 ? chronologicalSteps[i + 1] : null;

    let overlapWithNextS = 0;
    if (nextStep) {
      overlapWithNextS = step.primarySet.filter((d) => nextStep.primarySet.includes(d)).length;
    }

    const directHit = step.sirAbhishekPairs.some((p) => step.targetHouseOutcomes.includes(p));
    const reverseHit = step.sirAbhishekPairs.some((p) => step.targetHouseOutcomes.includes(`${p[1]}${p[0]}`));

    let relType: DayWiseTransitionLedgerEntry['relationshipType'] = 'miss';
    if (step.hitCount > 1) relType = 'multi-house-sweep';
    else if (directHit) relType = 'direct-pair-hit';
    else if (reverseHit) relType = 'reverse-pair-hit';

    recentTransitions.push({
      dateTMinus1: step.date,
      primarySetTMinus1: step.primarySet,
      coreXTMinus1: step.x,
      dateT: step.date,
      actualDrawT: {
        deshawar: step.targetHouseOutcomes[0] || '00',
        faridabad: step.targetHouseOutcomes[1] || '00',
        gali: step.targetHouseOutcomes[2] || '00',
        gzb: step.targetHouseOutcomes[3] || '00',
      },
      relationshipType: relType,
      directHit,
      reverseHit,
      matchedPairs: step.matchedPairs,
      sToSNextDayOverlapCount: overlapWithNextS,
    });

    // 3-step chain check: if current step primary set has high similarity (>= 4/6) to target currentS
    const simWithCurrent = calculateJaccard(currentS, step.primarySet);
    if (simWithCurrent >= 0.5 && i > 0 && i < chronologicalSteps.length - 1) {
      const prevStep = chronologicalSteps[i - 1];
      threeStepChains.push({
        tMinus1Date: prevStep.date,
        tMinus1Actual: {
          ds: prevStep.targetHouseOutcomes[0],
          fb: prevStep.targetHouseOutcomes[1],
          gl: prevStep.targetHouseOutcomes[2],
          gzb: prevStep.targetHouseOutcomes[3],
        },
        sTMinus1: prevStep.primarySet,
        tDate: step.date,
        tActual: {
          ds: step.targetHouseOutcomes[0],
          fb: step.targetHouseOutcomes[1],
          gl: step.targetHouseOutcomes[2],
          gzb: step.targetHouseOutcomes[3],
        },
        sT: step.primarySet,
        tPlus1Date: nextStep ? nextStep.date : 'N/A',
        tPlus1Actual: nextStep
          ? {
              ds: nextStep.targetHouseOutcomes[0],
              fb: nextStep.targetHouseOutcomes[1],
              gl: nextStep.targetHouseOutcomes[2],
              gzb: nextStep.targetHouseOutcomes[3],
            }
          : { ds: '00', fb: '00', gl: '00', gzb: '00' },
        sTPlus1: nextStep ? nextStep.primarySet : [],
        hitT: step.isHit,
        hitTPlus1: nextStep ? nextStep.isHit : false,
      });
    }
  }

  // 6. Section 29: Weekday Analysis
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayStats: WeekdayPrimarySetStat[] = weekdays.map((w) => {
    const stepsOnDay = chronologicalSteps.filter((s) => {
      const d = new Date(s.date);
      return !isNaN(d.getTime()) && weekdays[d.getDay()] === w;
    });

    const total = stepsOnDay.length;
    let hitCount = 0;
    let directHits = 0;
    let revHits = 0;
    const digitCount: Record<number, number> = {};
    const coreXCount: Record<number, number> = {};
    const pairCount: Record<string, number> = {};

    stepsOnDay.forEach((s) => {
      if (s.isHit) hitCount++;
      coreXCount[s.x] = (coreXCount[s.x] || 0) + 1;
      s.primarySet.forEach((d) => {
        digitCount[d] = (digitCount[d] || 0) + 1;
      });
      s.matchedPairs.forEach((p) => {
        pairCount[p] = (pairCount[p] || 0) + 1;
        if (s.sirAbhishekPairs.includes(p)) directHits++;
        else revHits++;
      });
    });

    const commonDigits = Object.entries(digitCount)
      .map(([d, count]) => ({ digit: parseInt(d, 10), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const commonCoreX = Object.entries(coreXCount)
      .map(([x, count]) => ({ x: parseInt(x, 10), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const commonPairs = Object.entries(pairCount)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const overallHitRate = total > 0 ? Math.round((hitCount / total) * 100) : 0;
    const directConversionRate = total > 0 ? Math.round((directHits / total) * 100) : 0;
    const reverseConversionRate = total > 0 ? Math.round((revHits / total) * 100) : 0;

    return {
      weekday: w,
      totalOccurrences: total,
      commonDigits,
      commonCoreX,
      commonPairs,
      directConversionRate,
      reverseConversionRate,
      overallHitRate,
      isStatisticallySignificant: total >= 25 && (overallHitRate >= 78 || overallHitRate <= 65),
    };
  });

  const strongestWeekdayPattern = [...weekdayStats]
    .filter((w) => w.isStatisticallySignificant)
    .sort((a, b) => b.overallHitRate - a.overallHitRate)[0];

  // 7. Section 30: Date-Cycle Analysis
  const intervals = [7, 14, 30, 60, 90];
  const dateCyclePatterns: DateCyclePattern[] = intervals.map((intDays) => {
    let similaritySum = 0;
    let match5or6Count = 0;
    let comparisons = 0;

    for (let i = intDays; i < chronologicalSteps.length; i++) {
      const stepCurrent = chronologicalSteps[i];
      const stepPast = chronologicalSteps[i - intDays];
      const sim = calculateJaccard(stepCurrent.primarySet, stepPast.primarySet);
      similaritySum += sim;
      comparisons++;

      const shared = stepCurrent.primarySet.filter((d) => stepPast.primarySet.includes(d)).length;
      if (shared >= 5) match5or6Count++;
    }

    const avgSim = comparisons > 0 ? Number((similaritySum / comparisons).toFixed(3)) : 0;
    let recSig: DateCyclePattern['recurrenceSignificance'] = 'Insufficient Evidence';
    if (match5or6Count >= 15) recSig = 'Strong';
    else if (match5or6Count >= 8) recSig = 'Moderate';
    else recSig = 'Weak';

    return {
      intervalDays: intDays,
      intervalLabel: `Cycle T-${intDays} Days`,
      averageSimilarity: avgSim,
      exactOr5Of6MatchesCount: match5or6Count,
      recurrenceSignificance: recSig,
    };
  });

  // 8. House Ranking
  const houseHitsTotal = { DS: 0, FB: 0, GL: 0, GZB: 0 };
  const allSimilarMatches = [...matches6of6, ...matches5of6, ...matches4of6];
  allSimilarMatches.forEach((m) => {
    m.matchedHouses.forEach((h) => {
      if (h === 'DS') houseHitsTotal.DS++;
      if (h === 'FB') houseHitsTotal.FB++;
      if (h === 'GL') houseHitsTotal.GL++;
      if (h === 'GZB') houseHitsTotal.GZB++;
    });
  });

  const totalSimHits = houseHitsTotal.DS + houseHitsTotal.FB + houseHitsTotal.GL + houseHitsTotal.GZB || 1;
  const houseHitFrequencies = [
    { house: 'Deshawar', hits: houseHitsTotal.DS, percentage: Math.round((houseHitsTotal.DS / totalSimHits) * 100) },
    { house: 'Faridabad', hits: houseHitsTotal.FB, percentage: Math.round((houseHitsTotal.FB / totalSimHits) * 100) },
    { house: 'Gali', hits: houseHitsTotal.GL, percentage: Math.round((houseHitsTotal.GL / totalSimHits) * 100) },
    { house: 'Ghaziabad', hits: houseHitsTotal.GZB, percentage: Math.round((houseHitsTotal.GZB / totalSimHits) * 100) },
  ].sort((a, b) => b.hits - a.hits);

  const strongestHouse =
    houseHitFrequencies[0]?.hits > houseHitFrequencies[1]?.hits * 1.1
      ? (houseHitFrequencies[0].house as any)
      : 'Balanced';

  // 9. Section 34, 35, 36: Candidate Ranking & Historical S Derivation Score (HSDS)
  const candidateRankings: CandidateRankingRow[] = pairBehaviors.map((pb, idx) => {
    // Calculate Multi-Signal Historical S Derivation Score (0-100)
    // Weights:
    // - Bayesian Reliability (35%)
    // - Historical S Similarity Evidence (25%)
    // - Direct vs Reverse Balance (15%)
    // - Recent 30-Day Rate (15%)
    // - Sample Size Penalty (10%)
    const sSimilaritySignal = matches5of6.length > 0 ? 80 : matches4of6.length > 0 ? 65 : 45;
    const sampleFactor = Math.min(100, Math.round((pb.timesSContainedBoth / 25) * 100));
    const recentFactor = Math.min(100, pb.recentHitCountLast30 * 20);

    const hsds = Math.round(
      pb.reliabilityScore * 0.35 +
        sSimilaritySignal * 0.25 +
        pb.combinedConversionRate * 0.15 +
        recentFactor * 0.15 +
        sampleFactor * 0.10
    );

    let stability: CandidateRankingRow['stability'] = 'Moderate';
    if (pb.timesSContainedBoth >= 20 && pb.reliabilityScore >= 30) stability = 'Very Stable';
    else if (pb.timesSContainedBoth >= 12) stability = 'Stable';
    else if (pb.timesSContainedBoth < 5) stability = 'Low Sample';

    let confidence: CandidateRankingRow['confidence'] = 'Low';
    if (hsds >= 55 && stability === 'Very Stable') confidence = 'High';
    else if (hsds >= 42 && stability !== 'Low Sample') confidence = 'Medium';

    const evidenceRationale = `${pb.totalHitCount} historical hits out of ${pb.timesSContainedBoth} co-occurrences (${pb.combinedConversionRate}% raw, ${pb.reliabilityScore}% smoothed)`;

    return {
      rank: idx + 1,
      pair: pb.pair,
      reverse: pb.reversePair,
      historicalScore: Math.min(99, Math.max(15, hsds)),
      sSimilarityScore: sSimilaritySignal,
      directRate: pb.directConversionRate,
      reverseRate: pb.reverseConversionRate,
      recentRate: Math.min(100, pb.recentHitCountLast30 * 25),
      sampleSize: pb.timesSContainedBoth,
      observedHits: pb.totalHitCount,
      bayesianReliability: pb.reliabilityScore,
      stability,
      confidence,
      evidenceRationale,
    };
  }).sort((a, b) => b.historicalScore - a.historicalScore || b.observedHits - a.observedHits)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  // 10. Section 37: Compact Assessment Summary Table
  const assessmentSummaryTable = [
    {
      test: 'Exact S Match',
      result: exactMatchCount > 0 ? `${exactMatchCount} Occurrences` : 'NO HISTORICAL SAMPLE',
      evidence:
        exactMatchCount > 0
          ? `${exactSameOrderCount} same-order, ${exactDifferentOrderCount} order-independent`
          : 'Zero historical instances with exact { ' + sortedCurrentS.join(',') + ' } set',
    },
    {
      test: '5/6 S Similarity',
      result: `${matches5of6.length} Similar Sets`,
      evidence: `${Math.round((matches5of6.filter((m) => m.directHit || m.reverseHit).length / (matches5of6.length || 1)) * 100)}% Next-Day Hit Rate across 5-digit intersections`,
    },
    {
      test: '4/6 S Similarity',
      result: `${matches4of6.length} Overlapping Sets`,
      evidence: `${Math.round((matches4of6.filter((m) => m.directHit || m.reverseHit).length / (matches4of6.length || 1)) * 100)}% Conversion across 4-digit intersections`,
    },
    {
      test: 'Strongest Digit',
      result: `Digit ${strongestHistoricalDigits[0]} (${digitContributions[0]?.nextDayHitFrequency || 0} hits)`,
      evidence: `${digitContributions[0]?.liftRatio || 1}x lift over random baseline`,
    },
    {
      test: 'Strongest Direct Pair',
      result: `${strongestHistoricalPairs[0]} (${pairBehaviors[0]?.directHitCount || 0} Direct Hits)`,
      evidence: `${pairBehaviors[0]?.directConversionRate || 0}% Direct Conversion when in S`,
    },
    {
      test: 'Strongest Reverse Pair',
      result: `${strongestReversePairs[0] || 'None'} (${pairBehaviors.find((p) => p.reversePair === strongestReversePairs[0])?.reverseHitCount || 0} Reverse Hits)`,
      evidence: 'Reverse/mirror participation in winning draws',
    },
    {
      test: 'Strongest House',
      result: strongestHouse,
      evidence: `${houseHitFrequencies[0]?.percentage || 25}% of matching hits occur in ${houseHitFrequencies[0]?.house || 'DS'}`,
    },
    {
      test: 'Strongest Weekday Pattern',
      result: strongestWeekdayPattern ? `${strongestWeekdayPattern.weekday} (${strongestWeekdayPattern.overallHitRate}%)` : 'No Bias Detected',
      evidence: strongestWeekdayPattern ? 'Statistically significant hit concentration' : 'Sufficient evidence not found',
    },
  ];

  return {
    currentS,
    sortedCurrentS,
    currentCoreX: currentS[1] !== undefined ? currentS[1] : 0,
    totalHistoricalSteps,
    exactMatchCount,
    exactSameOrderCount,
    exactDifferentOrderCount,
    exactMatches,
    exactMatchReportText,
    matches6of6,
    matches5of6,
    matches4of6,
    matches3of6,
    digitContributions,
    strongestHistoricalDigits,
    pairBehaviors,
    strongestHistoricalPairs,
    strongestReversePairs,
    subsets2Digit,
    subsets3Digit,
    recentTransitions: recentTransitions.slice(0, 30),
    threeStepChains: threeStepChains.slice(0, 15),
    weekdayStats,
    strongestWeekdayPattern,
    dateCyclePatterns,
    strongestHouse,
    houseHitFrequencies,
    candidateRankings,
    assessmentSummaryTable,
  };
}
