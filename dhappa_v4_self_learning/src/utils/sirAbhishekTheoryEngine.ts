import {
  DayMarketEntry,
  FaridabadDeltaResult,
  SirAbhishekDigitCount,
  SirAbhishekPairBranch,
  SirAbhishekTheoryResult,
  SirAbhishekBacktestStep,
} from '../types';

/**
 * Perform cyclic modulo 10 arithmetic (0-1 = 9, 9+1 = 0)
 */
export function mod10(n: number): number {
  return ((n % 10) + 10) % 10;
}

/**
 * Calculate Delta = |A - B| for any 2-digit number AB (e.g. 58 -> |5-8| = 3, 54 -> |5-4| = 1)
 * and generate the complete 00-99 Delta Series (all pairs where |tens - ones| === Delta).
 */
export function calculateDeltaSeries(
  twoDigitNumber: string,
  sirAbhishek15Pairs: string[] = [],
  fourHouses: { name: string; val: string }[] = []
): FaridabadDeltaResult {
  const clean = (twoDigitNumber || '00').padStart(2, '0').slice(-2);
  const digitA = parseInt(clean[0], 10) || 0;
  const digitB = parseInt(clean[1], 10) || 0;
  const delta = Math.abs(digitA - digitB);

  // Generate all pairs in 00-99 with exact same Delta
  // Delta series consists of:
  // 1) Ascending: A < B (tens < ones), e.g. for Delta 3: 03, 14, 25, 36, 47, 58, 69
  // 2) Descending: A > B (tens > ones), e.g. for Delta 3: 30, 41, 52, 63, 74, 85, 96
  // 3) When Delta = 0: 00, 11, 22, 33, 44, 55, 66, 77, 88, 99 (10 pairs)
  const deltaSeriesAscending: string[] = [];
  const deltaSeriesDescending: string[] = [];

  for (let tens = 0; tens <= 9; tens++) {
    for (let ones = 0; ones <= 9; ones++) {
      if (Math.abs(tens - ones) === delta) {
        const pairStr = `${tens}${ones}`;
        if (delta === 0) {
          deltaSeriesAscending.push(pairStr);
        } else if (tens < ones) {
          deltaSeriesAscending.push(pairStr);
        } else {
          deltaSeriesDescending.push(pairStr);
        }
      }
    }
  }

  const fullDeltaSeries = [...deltaSeriesAscending, ...deltaSeriesDescending];

  // Compare with Sir Abhishek 15-Pair set and 4 houses
  const convergingPairs = fullDeltaSeries.map((pair) => {
    const inSirAbhishek15 =
      sirAbhishek15Pairs.includes(pair) ||
      sirAbhishek15Pairs.includes(`${pair[1]}${pair[0]}`);

    const appearedInHouses: string[] = [];
    fourHouses.forEach((h) => {
      const hVal = (h.val || '').padStart(2, '0').slice(-2);
      if (hVal === pair || hVal === `${pair[1]}${pair[0]}`) {
        appearedInHouses.push(h.name);
      }
    });

    return {
      pair,
      inSirAbhishek15,
      inFourHousesToday: appearedInHouses.length > 0,
      inFourHousesYesterday: false,
      appearedInHouses,
    };
  });

  const fourHousesComparison = fourHouses.map((h) => {
    const outcomeNumber = (h.val || '').padStart(2, '0').slice(-2);
    const t = parseInt(outcomeNumber[0], 10) || 0;
    const o = parseInt(outcomeNumber[1], 10) || 0;
    const outcomeDelta = Math.abs(t - o);
    const hasSameDelta = outcomeDelta === delta;
    const matchesAnyDeltaSeriesNumber = fullDeltaSeries.includes(outcomeNumber);

    return {
      houseName: h.name,
      outcomeNumber,
      outcomeDelta,
      hasSameDelta,
      matchesAnyDeltaSeriesNumber,
    };
  });

  return {
    sourceNumber: clean,
    digitA,
    digitB,
    delta,
    deltaSeriesAscending,
    deltaSeriesDescending,
    fullDeltaSeries,
    sirAbhishek15Pairs,
    convergingPairs,
    fourHousesComparison,
  };
}

export interface CalculateSirAbhishekParams {
  sourceDate: string;
  deshawar: string;
  faridabad: string;
  gali: string;
  gzb: string;
  manualOverrides?: {
    x?: number;
    y?: number;
    z?: number;
    e?: number;
  };
}

/**
 * Sir Abhishek Theory: Four-House Recurring Single-Digit Convergence & Pair-Expansion Theorem
 * 
 * S = {a, x, b, y, z, e} (mod 10)
 * where:
 *   x = most recurring single digit across the 4 houses
 *   a = (x - 1) mod 10
 *   b = (x + 1) mod 10
 *   y, z, e = secondary associated single digits
 * 
 * Pair Expansion:
 *   P(S) = {(di, dj) : 1 <= i < j <= 6}
 *   Produces exactly C(6, 2) = 15 unique pairs.
 */
export function calculateSirAbhishekTheory(
  params: CalculateSirAbhishekParams
): SirAbhishekTheoryResult {
  const { sourceDate, deshawar, faridabad, gali, gzb, manualOverrides } = params;

  const cleanHouseVal = (v: string | undefined): { val: string; displayVal: string; isValid: boolean } => {
    const trimmed = (v || '').trim();
    if (!trimmed || trimmed === '--') {
      return { val: '', displayVal: '--', isValid: false };
    }
    const clean2 = trimmed.padStart(2, '0').slice(-2);
    return { val: clean2, displayVal: clean2, isValid: /^\d{2}$/.test(clean2) };
  };

  const dsData = cleanHouseVal(deshawar);
  const fbData = cleanHouseVal(faridabad);
  const glData = cleanHouseVal(gali);
  const gzData = cleanHouseVal(gzb);

  const houses = [
    { name: 'Deshawar', ...dsData },
    { name: 'Faridabad', ...fbData },
    { name: 'Gali', ...glData },
    { name: 'GZB', ...gzData },
  ];

  // 1. Analyze single-digit occurrences across valid houses (up to 8 digits)
  const digitCounts: Record<number, { count: number; houses: string[] }> = {};
  for (let d = 0; d <= 9; d++) {
    digitCounts[d] = { count: 0, houses: [] };
  }

  // Direct co-occurrence tracking: which digits appeared together with which in the 2-digit numbers
  const directPartnersOfDigit: Record<number, Record<number, number>> = {};
  for (let d = 0; d <= 9; d++) {
    directPartnersOfDigit[d] = {};
  }

  houses.forEach((h) => {
    if (!h.isValid) return; // Skip houses that have not yet drawn or have no result

    const tens = parseInt(h.val[0], 10);
    const ones = parseInt(h.val[1], 10);

    if (!isNaN(tens)) {
      digitCounts[tens].count += 1;
      digitCounts[tens].houses.push(`${h.name} (T: ${h.val})`);
    }
    if (!isNaN(ones)) {
      digitCounts[ones].count += 1;
      digitCounts[ones].houses.push(`${h.name} (O: ${h.val})`);
    }

    if (!isNaN(tens) && !isNaN(ones)) {
      directPartnersOfDigit[tens][ones] = (directPartnersOfDigit[tens][ones] || 0) + 1;
      directPartnersOfDigit[ones][tens] = (directPartnersOfDigit[ones][tens] || 0) + 1;
    }
  });

  const digitFrequencies: SirAbhishekDigitCount[] = Object.entries(digitCounts)
    .map(([dStr, data]) => ({
      digit: parseInt(dStr, 10),
      count: data.count,
      houses: data.houses,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.digit - b.digit;
    });

  // 2. Identify the most recurring single digit X
  let x: number;
  if (manualOverrides?.x !== undefined && manualOverrides.x >= 0 && manualOverrides.x <= 9) {
    x = manualOverrides.x;
  } else {
    // Top recurring digit
    x = digitFrequencies[0]?.digit ?? 4;
  }

  const xCount = digitCounts[x]?.count ?? 0;

  // 3. Cyclic neighbors Modulo 10
  const a = mod10(x - 1);
  const b = mod10(x + 1);

  // Set of occupied primary core digits: {a, x, b}
  const coreSet = new Set<number>([a, x, b]);

  // 4. Identify secondary digits Y, Z, E
  // Strategy:
  // (a) First inspect direct 2-digit partner digits of X from the 4-house outcomes (not in {a, x, b})
  // (b) Then inspect remaining highest frequency digits from the 4 houses (not in {a, x, b})
  // (c) Then fallback to highest global complementary digits to ensure 6 distinct digits
  const secondaryCandidates: { digit: number; reason: string; priority: number }[] = [];

  // (a) Direct partners of X
  const directPartnerEntries = Object.entries(directPartnersOfDigit[x] || {})
    .map(([pStr, count]) => ({ digit: parseInt(pStr, 10), count }))
    .sort((p1, p2) => p2.count - p1.count);

  directPartnerEntries.forEach((dp) => {
    if (!coreSet.has(dp.digit)) {
      secondaryCandidates.push({
        digit: dp.digit,
        reason: `Direct 2-digit partner of recurring digit ${x} (appeared ${dp.count}x in house pairs)`,
        priority: 100 + dp.count * 10,
      });
    }
  });

  // (b) Highest frequency digits among the remaining
  digitFrequencies.forEach((df) => {
    if (!coreSet.has(df.digit) && !secondaryCandidates.some((sc) => sc.digit === df.digit)) {
      if (df.count > 0) {
        secondaryCandidates.push({
          digit: df.digit,
          reason: `High recurring frequency in 4 houses (${df.count}x appearance)`,
          priority: 50 + df.count * 5,
        });
      }
    }
  });

  // (c) Fallback digits to ensure 6 distinct values
  for (let d = 0; d <= 9; d++) {
    if (!coreSet.has(d) && !secondaryCandidates.some((sc) => sc.digit === d)) {
      secondaryCandidates.push({
        digit: d,
        reason: `Complementary single digit for full 6-digit basis`,
        priority: 10 - d,
      });
    }
  }

  // Pick y, z, e
  let y: number;
  let z: number;
  let e: number;
  let yReason = '';
  let zReason = '';
  let eReason = '';

  if (manualOverrides?.y !== undefined && manualOverrides.y >= 0 && manualOverrides.y <= 9) {
    y = manualOverrides.y;
    yReason = 'Manual User Override';
  } else {
    const pick = secondaryCandidates.shift();
    y = pick ? pick.digit : 7;
    yReason = pick ? pick.reason : 'Empirical association';
  }

  if (manualOverrides?.z !== undefined && manualOverrides.z >= 0 && manualOverrides.z <= 9) {
    z = manualOverrides.z;
    zReason = 'Manual User Override';
  } else {
    // Avoid picking duplicate of y
    const pick = secondaryCandidates.find((c) => c.digit !== y) || secondaryCandidates[0];
    if (pick) {
      const idx = secondaryCandidates.indexOf(pick);
      secondaryCandidates.splice(idx, 1);
    }
    z = pick ? pick.digit : 2;
    zReason = pick ? pick.reason : 'Empirical association';
  }

  if (manualOverrides?.e !== undefined && manualOverrides.e >= 0 && manualOverrides.e <= 9) {
    e = manualOverrides.e;
    eReason = 'Manual User Override';
  } else {
    // Avoid duplicate of y or z
    const pick = secondaryCandidates.find((c) => c.digit !== y && c.digit !== z) || secondaryCandidates[0];
    e = pick ? pick.digit : 9;
    eReason = pick ? pick.reason : 'Empirical association';
  }

  // 5. Complete Sir Abhishek Primary Set: S = {a, x, b, y, z, e} in vertical order
  const primarySet: {
    label: 'a' | 'x' | 'b' | 'y' | 'z' | 'e';
    digit: number;
    role: string;
  }[] = [
    { label: 'a', digit: a, role: `Cyclic Predecessor (X - 1 mod 10)` },
    { label: 'x', digit: x, role: `Most Recurring Single Digit` },
    { label: 'b', digit: b, role: `Cyclic Successor (X + 1 mod 10)` },
    { label: 'y', digit: y, role: `Secondary Partner 1` },
    { label: 'z', digit: z, role: `Secondary Partner 2` },
    { label: 'e', digit: e, role: `Secondary Partner 3` },
  ];

  // 6. Vertical Pair-Expansion Rule:
  // a -> x, b, y, z, e (5 pairs)
  // x -> b, y, z, e    (4 pairs)
  // b -> y, z, e       (3 pairs)
  // y -> z, e          (2 pairs)
  // z -> e             (1 pair)
  // e -> (none)
  // Total: 5 + 4 + 3 + 2 + 1 = 15 pairs
  const branches: SirAbhishekPairBranch[] = [];
  const pairSet: string[] = [];

  for (let i = 0; i < primarySet.length - 1; i++) {
    const parent = primarySet[i];
    const targetPairs: SirAbhishekPairBranch['targetPairs'] = [];

    for (let j = i + 1; j < primarySet.length; j++) {
      const child = primarySet[j];
      const pairStr = `${parent.digit}${child.digit}`;
      const formulaStr = `${parent.label.toUpperCase()}${child.label.toUpperCase()} → ${pairStr}`;
      
      targetPairs.push({
        partnerLabel: child.label,
        partnerDigit: child.digit,
        pair: pairStr,
        formula: formulaStr,
      });

      pairSet.push(pairStr);
    }

    branches.push({
      primaryLabel: parent.label,
      primaryDigit: parent.digit,
      targetPairs,
    });
  }

  const bracketNotation = `[${pairSet.join(', ')}]`;
  const csvNotation = pairSet.join(', ');

  // 7. Calculate Faridabad Delta Series and Cross-House Convergence
  const faridabadDelta = calculateDeltaSeries(
    houses[1].val, // Faridabad outcome
    pairSet, // Sir Abhishek 15-pair set
    houses // 4 houses
  );

  return {
    sourceDate,
    sourceHouseValues: {
      deshawar: houses[0].val,
      faridabad: houses[1].val,
      gali: houses[2].val,
      gzb: houses[3].val,
    },
    digitFrequencies,
    x,
    xCount,
    a,
    b,
    y,
    z,
    e,
    secondaryReasoning: {
      y: yReason,
      z: zReason,
      e: eReason,
    },
    primarySet,
    branches,
    pairSet,
    bracketNotation,
    csvNotation,
    faridabadDelta,
  };
}

/**
 * Helper to run Sir Abhishek Theory Walk-Forward Backtesting across historical dataset.
 * Evaluates each day T-1 model predicting day T outcomes across all 4 houses.
 */
export function runSirAbhishekBacktest(
  records: DayMarketEntry[]
): SirAbhishekBacktestStep[] {
  if (!records || records.length < 2) return [];

  // Sort chronological ascending for walk-forward simulation
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const steps: SirAbhishekBacktestStep[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevRecord = sorted[i - 1];
    const currentRecord = sorted[i];

    const prevResult = calculateSirAbhishekTheory({
      sourceDate: prevRecord.date,
      deshawar: prevRecord.deshawar || '',
      faridabad: prevRecord.faridabad || '',
      gali: prevRecord.gali || '',
      gzb: prevRecord.gzb || prevRecord.ghaziabad || '',
    });

    const targetOutcomes = [
      currentRecord.deshawar || '',
      currentRecord.faridabad || '',
      currentRecord.gali || '',
      currentRecord.gzb || currentRecord.ghaziabad || '',
    ].map((v) => (v || '').padStart(2, '0').slice(-2));

    const sourceOutcomes = [
      prevRecord.deshawar || '',
      prevRecord.faridabad || '',
      prevRecord.gali || '',
      prevRecord.gzb || prevRecord.ghaziabad || '',
    ].map((v) => (v || '').padStart(2, '0').slice(-2));

    const matchedPairs: string[] = [];
    const hitHouseNames: string[] = [];

    const houseNames = ['Deshawar', 'Faridabad', 'Gali', 'GZB'];
    targetOutcomes.forEach((outcome, idx) => {
      // Check direct pair hit or mirror/reverse hit
      const reverseOutcome = `${outcome[1]}${outcome[0]}`;
      if (prevResult.pairSet.includes(outcome) || prevResult.pairSet.includes(reverseOutcome)) {
        if (!matchedPairs.includes(outcome)) {
          matchedPairs.push(outcome);
        }
        hitHouseNames.push(houseNames[idx]);
      }
    });

    steps.push({
      date: currentRecord.date,
      sourceDate: prevRecord.date,
      sourceHouseOutcomes: sourceOutcomes,
      targetHouseOutcomes: targetOutcomes,
      x: prevResult.x,
      primarySet: prevResult.primarySet.map((s) => s.digit),
      sirAbhishekPairs: prevResult.pairSet,
      matchedPairs,
      hitCount: matchedPairs.length,
      hitHouseNames,
      isHit: matchedPairs.length > 0,
    });
  }

  return steps.reverse(); // Return descending for recent-first UI
}
