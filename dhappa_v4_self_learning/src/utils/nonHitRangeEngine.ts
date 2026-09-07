import { SirAbhishekBacktestStep } from '../types';

export type NonHitPeriodPreset = '7d' | '15d' | '30d' | '50d' | '100d' | 'custom' | 'all';

export type NonHitStatus =
  | 'Persistent Non-Hit'
  | 'Frequent Non-Hit'
  | 'Mixed'
  | 'Reverse-Only'
  | 'Frequent Hit';

export interface NonHitOccurrenceStep {
  date: string;
  sourceDate: string;
  targetHouses: string[];
  isDirectHit: boolean;
  isReverseHit: boolean;
  hitHouses: string[];
}

export interface NonHitNumberItem {
  rank: number;
  number: string; // 2-digit "AB"
  reverseNumber: string; // 2-digit "BA"
  isSameDigitDouble: boolean; // e.g. "00", "11", "22"
  generatedDays: number;
  actualHits: number; // Direct hits (AB in actual draw)
  nonHitDays: number; // generatedDays - actualHits
  nonHitPercentage: number; // (nonHitDays / generatedDays) * 100
  hitPercentage: number; // (actualHits / generatedDays) * 100
  reverseHits: number; // Reverse hits (BA in actual draw when AB predicted)
  pureMissDays: number; // Days neither AB nor BA hit
  currentNonHitStreak: number;
  longestNonHitStreak: number;
  status: NonHitStatus;
  occurrences: NonHitOccurrenceStep[];
  consecutiveMissConversions: number; // Miss streak >= 2 immediately followed by direct hit
  reboundOpportunityScore: number; // Mathematical index based on streak vs historical mean
}

export interface NonHitPeriodReport {
  preset: NonHitPeriodPreset;
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalCycles: number;
  totalUniqueGeneratedNumbers: number;
  numbers: NonHitNumberItem[];
  persistentNonHits: NonHitNumberItem[]; // 0 direct hits
  frequentNonHits: NonHitNumberItem[]; // >= 65% miss rate with >= 3 generated days
  reverseWinners: NonHitNumberItem[]; // reverse hits > direct hits
  longestStreakNumbers: NonHitNumberItem[]; // max miss streak >= 3
  frequentHits: NonHitNumberItem[];
  summaryStats: {
    totalPredictionsCount: number;
    totalDirectHitsCount: number;
    totalReverseHitsCount: number;
    averageNonHitRate: number;
    highestMissStreakNumber: string;
    highestMissStreakValue: number;
    activePersistentNonHitCount: number;
  };
  learningEngineInsights: {
    divergenceRating: 'High' | 'Moderate' | 'Low';
    topDivergentCandidates: string[];
    reversalDominantPairs: string[];
    persistentNonHitSignal: string;
    walkForwardObservation: string;
  };
}

/**
 * Filter backtest steps based on period preset or custom start/end dates.
 */
export function filterBacktestStepsByPeriod(
  allSteps: SirAbhishekBacktestStep[],
  preset: NonHitPeriodPreset,
  customStartDate?: string,
  customEndDate?: string
): { steps: SirAbhishekBacktestStep[]; label: string; startDate: string; endDate: string } {
  if (!allSteps || allSteps.length === 0) {
    return { steps: [], label: 'No Data', startDate: '', endDate: '' };
  }

  // Sort chronological ascending
  const chronological = [...allSteps].sort((a, b) => a.date.localeCompare(b.date));

  if (preset === 'all') {
    return {
      steps: chronological,
      label: `All Available History (${chronological.length} Cycles)`,
      startDate: chronological[0].date,
      endDate: chronological[chronological.length - 1].date,
    };
  }

  if (preset === 'custom') {
    const start = customStartDate || chronological[0].date;
    const end = customEndDate || chronological[chronological.length - 1].date;
    const filtered = chronological.filter(
      (s) => s.date >= start && s.date <= end
    );
    return {
      steps: filtered,
      label: `Custom Range (${start} to ${end})`,
      startDate: start,
      endDate: end,
    };
  }

  const daysCountMap: Record<NonHitPeriodPreset, number> = {
    '7d': 7,
    '15d': 15,
    '30d': 30,
    '50d': 50,
    '100d': 100,
    'all': chronological.length,
    'custom': chronological.length,
  };

  const count = daysCountMap[preset] || 30;
  const sliced = chronological.slice(-count);
  const start = sliced.length > 0 ? sliced[0].date : '';
  const end = sliced.length > 0 ? sliced[sliced.length - 1].date : '';

  const labelMap: Record<NonHitPeriodPreset, string> = {
    '7d': 'Last 7 Days (Rapid Window)',
    '15d': 'Last 15 Days (Bi-Weekly)',
    '30d': 'Last 30 Days (Monthly)',
    '50d': 'Last 50 Days (Mid-Range)',
    '100d': 'Last 100 Days (Quarterly)',
    'all': 'All History',
    'custom': 'Custom Period',
  };

  return {
    steps: sliced,
    label: labelMap[preset] || `Last ${count} Days`,
    startDate: start,
    endDate: end,
  };
}

/**
 * Execute Common Non-Hit Number Range Analysis
 */
export function analyzeCommonNonHitRange(
  allSteps: SirAbhishekBacktestStep[],
  preset: NonHitPeriodPreset,
  customStartDate?: string,
  customEndDate?: string
): NonHitPeriodReport {
  const { steps, label, startDate, endDate } = filterBacktestStepsByPeriod(
    allSteps,
    preset,
    customStartDate,
    customEndDate
  );

  if (steps.length === 0) {
    return {
      preset,
      periodLabel: label,
      startDate: '',
      endDate: '',
      totalCycles: 0,
      totalUniqueGeneratedNumbers: 0,
      numbers: [],
      persistentNonHits: [],
      frequentNonHits: [],
      reverseWinners: [],
      longestStreakNumbers: [],
      frequentHits: [],
      summaryStats: {
        totalPredictionsCount: 0,
        totalDirectHitsCount: 0,
        totalReverseHitsCount: 0,
        averageNonHitRate: 0,
        highestMissStreakNumber: '--',
        highestMissStreakValue: 0,
        activePersistentNonHitCount: 0,
      },
      learningEngineInsights: {
        divergenceRating: 'Low',
        topDivergentCandidates: [],
        reversalDominantPairs: [],
        persistentNonHitSignal: 'Insufficient cycle data for the selected range.',
        walkForwardObservation: 'No cycles available.',
      },
    };
  }

  // Map of 2-digit numbers to their tracking metrics
  const numberStatsMap = new Map<
    string,
    {
      number: string;
      reverse: string;
      isSameDigitDouble: boolean;
      occurrences: NonHitOccurrenceStep[];
    }
  >();

  // Collect all generated pairs per step and track against target draw
  steps.forEach((step) => {
    const targetHouses = step.targetHouseOutcomes.map((v) => (v || '').padStart(2, '0').slice(-2));
    const generatedPairs = Array.from(
      new Set(step.sirAbhishekPairs.map((p) => (p || '').padStart(2, '0').slice(-2)))
    );

    generatedPairs.forEach((num) => {
      if (!numberStatsMap.has(num)) {
        const reverse = `${num[1]}${num[0]}`;
        numberStatsMap.set(num, {
          number: num,
          reverse,
          isSameDigitDouble: num[0] === num[1],
          occurrences: [],
        });
      }

      const item = numberStatsMap.get(num)!;
      const isDirectHit = targetHouses.includes(num);
      const isReverseHit = targetHouses.includes(item.reverse) && !isDirectHit;
      
      const hitHouses: string[] = [];
      const houseNames = ['Deshawar', 'Faridabad', 'Gali', 'Ghaziabad'];
      targetHouses.forEach((th, idx) => {
        if (th === num) {
          hitHouses.push(`${houseNames[idx]} (Direct)`);
        } else if (th === item.reverse) {
          hitHouses.push(`${houseNames[idx]} (Reverse)`);
        }
      });

      item.occurrences.push({
        date: step.date,
        sourceDate: step.sourceDate,
        targetHouses,
        isDirectHit,
        isReverseHit,
        hitHouses,
      });
    });
  });

  // Calculate detailed streak and metrics for each generated number
  const calculatedItems: NonHitNumberItem[] = [];

  let totalPredictionsCount = 0;
  let totalDirectHitsCount = 0;
  let totalReverseHitsCount = 0;

  numberStatsMap.forEach((entry) => {
    const generatedDays = entry.occurrences.length;
    totalPredictionsCount += generatedDays;

    let directHits = 0;
    let reverseHits = 0;
    let pureMissDays = 0;

    // Track streaks across chronological occurrences
    let currentMissStreak = 0;
    let maxMissStreak = 0;
    let tempMissStreak = 0;
    let consecutiveMissConversions = 0;
    let wasInMultiMissStreak = false;

    entry.occurrences.forEach((occ) => {
      if (occ.isDirectHit) {
        directHits++;
        if (wasInMultiMissStreak) {
          consecutiveMissConversions++;
          wasInMultiMissStreak = false;
        }
        tempMissStreak = 0;
      } else {
        if (occ.isReverseHit) {
          reverseHits++;
        } else {
          pureMissDays++;
        }
        tempMissStreak++;
        if (tempMissStreak >= 2) {
          wasInMultiMissStreak = true;
        }
        if (tempMissStreak > maxMissStreak) {
          maxMissStreak = tempMissStreak;
        }
      }
    });

    totalDirectHitsCount += directHits;
    totalReverseHitsCount += reverseHits;

    // Current non-hit streak from the latest occurrences backwards
    let activeStreak = 0;
    for (let i = entry.occurrences.length - 1; i >= 0; i--) {
      if (!entry.occurrences[i].isDirectHit) {
        activeStreak++;
      } else {
        break;
      }
    }
    currentMissStreak = activeStreak;

    const nonHitDays = generatedDays - directHits;
    const nonHitPercentage = generatedDays > 0 ? (nonHitDays / generatedDays) * 100 : 0;
    const hitPercentage = generatedDays > 0 ? (directHits / generatedDays) * 100 : 0;

    // Classify Status
    let status: NonHitStatus = 'Mixed';
    if (directHits === 0 && generatedDays >= 2) {
      if (reverseHits >= 2 && !entry.isSameDigitDouble) {
        status = 'Reverse-Only';
      } else {
        status = 'Persistent Non-Hit';
      }
    } else if (generatedDays >= 3 && nonHitPercentage >= 65) {
      status = 'Frequent Non-Hit';
    } else if (hitPercentage >= 40 && generatedDays >= 2) {
      status = 'Frequent Hit';
    } else if (reverseHits > directHits && !entry.isSameDigitDouble) {
      status = 'Reverse-Only';
    }

    // Rebound opportunity score: high streak + high generated commonality
    const reboundOpportunityScore = Number(
      ((currentMissStreak * 1.5 + generatedDays * 0.8) * (1 - hitPercentage / 100)).toFixed(2)
    );

    calculatedItems.push({
      rank: 0, // Will be set after sorting
      number: entry.number,
      reverseNumber: entry.reverse,
      isSameDigitDouble: entry.isSameDigitDouble,
      generatedDays,
      actualHits: directHits,
      nonHitDays,
      nonHitPercentage: Number(nonHitPercentage.toFixed(1)),
      hitPercentage: Number(hitPercentage.toFixed(1)),
      reverseHits,
      pureMissDays,
      currentNonHitStreak: currentMissStreak,
      longestNonHitStreak: maxMissStreak,
      status,
      occurrences: entry.occurrences,
      consecutiveMissConversions,
      reboundOpportunityScore,
    });
  });

  // Sort by Common Non-Hit Frequency:
  // Primary: Non-Hit Days descending
  // Secondary: Non-Hit % descending
  // Tertiary: Longest Miss Streak descending
  calculatedItems.sort((a, b) => {
    if (b.nonHitDays !== a.nonHitDays) return b.nonHitDays - a.nonHitDays;
    if (b.nonHitPercentage !== a.nonHitPercentage) return b.nonHitPercentage - a.nonHitPercentage;
    if (b.longestNonHitStreak !== a.longestNonHitStreak) return b.longestNonHitStreak - a.longestNonHitStreak;
    return b.generatedDays - a.generatedDays;
  });

  // Assign ranks
  calculatedItems.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const persistentNonHits = calculatedItems.filter((item) => item.status === 'Persistent Non-Hit');
  const frequentNonHits = calculatedItems.filter((item) => item.status === 'Frequent Non-Hit');
  const reverseWinners = calculatedItems.filter(
    (item) => item.reverseHits > item.actualHits || item.status === 'Reverse-Only'
  );
  const longestStreakNumbers = calculatedItems.filter((item) => item.longestNonHitStreak >= 3);
  const frequentHits = calculatedItems.filter((item) => item.status === 'Frequent Hit');

  // Highest miss streak info
  let highestMissStreakValue = 0;
  let highestMissStreakNumber = '--';
  calculatedItems.forEach((item) => {
    if (item.longestNonHitStreak > highestMissStreakValue) {
      highestMissStreakValue = item.longestNonHitStreak;
      highestMissStreakNumber = item.number;
    }
  });

  const averageNonHitRate =
    totalPredictionsCount > 0
      ? Number((((totalPredictionsCount - totalDirectHitsCount) / totalPredictionsCount) * 100).toFixed(1))
      : 0;

  // Walk-forward learning engine insights
  const divergenceRating: 'High' | 'Moderate' | 'Low' =
    persistentNonHits.length >= 8 ? 'High' : persistentNonHits.length >= 4 ? 'Moderate' : 'Low';

  const topDivergentCandidates = persistentNonHits.slice(0, 6).map((n) => n.number);
  const reversalDominantPairs = reverseWinners.slice(0, 6).map((n) => `${n.number} ➔ ${n.reverseNumber}`);

  const persistentNonHitSignal =
    persistentNonHits.length > 0
      ? `${persistentNonHits.length} pairs were generated in ≥2 backtest cycles without a single direct hit in this ${steps.length}-day window.`
      : 'No strictly persistent (0-hit) non-hits found in this window.';

  const walkForwardObservation =
    'This number was repeatedly generated during the selected period but was not observed in the corresponding actual draws. Prediction-vs-draw divergence is a statistical observation and does not imply an imminent due hit.';

  return {
    preset,
    periodLabel: label,
    startDate,
    endDate,
    totalCycles: steps.length,
    totalUniqueGeneratedNumbers: calculatedItems.length,
    numbers: calculatedItems,
    persistentNonHits,
    frequentNonHits,
    reverseWinners,
    longestStreakNumbers,
    frequentHits,
    summaryStats: {
      totalPredictionsCount,
      totalDirectHitsCount,
      totalReverseHitsCount,
      averageNonHitRate,
      highestMissStreakNumber,
      highestMissStreakValue,
      activePersistentNonHitCount: persistentNonHits.length,
    },
    learningEngineInsights: {
      divergenceRating,
      topDivergentCandidates,
      reversalDominantPairs,
      persistentNonHitSignal,
      walkForwardObservation,
    },
  };
}
