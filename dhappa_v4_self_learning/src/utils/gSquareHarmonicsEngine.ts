import { DayMarketEntry, Market } from '../types';

export interface GSquareHarmonicDigit {
  key: string;
  value: number;
  formula: string;
  explanation: string;
}

export interface GSquareHarmonicCell {
  rowKey: string;
  colKey: string;
  pair: string;
  reversePair: string;
  tens: number;
  ones: number;
  rowIndex: number;
  colIndex: number;
}

export interface GSquareHarmonicGridResult {
  sourceNumber: string;
  x: number;
  verticalDigits: GSquareHarmonicDigit[];
  horizontalDigits: GSquareHarmonicDigit[];
  cells: GSquareHarmonicCell[];
  pairs: string[];
  reversePairs: string[];
}

export type GSquareHarmonicSourceMode = 'auto' | 'gali' | 'ghaziabad' | 'faridabad' | 'deshawar';

export interface GSquareHarmonicWalkForwardHit {
  market: Market;
  pair: string;
  matchType: 'STRAIGHT' | 'PALAT';
  cellKey: string;
  rowKey: string;
  colKey: string;
}

export interface GSquareHarmonicWalkForwardStep {
  stepIndex: number;
  targetDate: string;
  sourceDate: string;
  sourceMarket: string;
  sourceNumber: string;
  x: number;
  verticalDigits: number[];
  horizontalDigits: number[];
  straightPairs: string[];
  palatPairs: string[];
  targetOutcomes: { market: Market; pair: string }[];
  hits: GSquareHarmonicWalkForwardHit[];
  straightHit: boolean;
  palatHit: boolean;
  isHit: boolean;
  winningMarkets: Market[];
  winningPairs: string[];
  dailyStake: number;
  dailyPayout: number;
  dailyNetProfit: number;
}

export interface GSquareHarmonicCellEfficacy {
  rowKey: string;
  colKey: string;
  cellKey: string;
  pairFormula: string;
  straightHits: number;
  palatHits: number;
  totalHits: number;
  hitRate: number;
}

export interface GSquareHarmonicWalkForwardReport {
  totalSteps: number;
  evaluatedDays: number;
  straightHitDays: number;
  straightHitRate: number;
  palatHitDays: number;
  anyHitDays: number;
  anyHitRate: number;
  totalTargetDraws: number;
  totalStraightHits: number;
  totalPalatHits: number;
  drawHitRate: number;
  marketBreakdown: Record<
    Market,
    {
      drawCount: number;
      straightHits: number;
      palatHits: number;
      totalHits: number;
      hitRate: number;
    }
  >;
  currentStreak: { type: 'WIN' | 'LOSS'; count: number };
  maxWinningStreak: number;
  maxLosingStreak: number;
  cellEfficacy: GSquareHarmonicCellEfficacy[];
  steps: GSquareHarmonicWalkForwardStep[];
  roiSimulation: {
    stakePerPair: number;
    payoutMultiplier: number;
    totalStake: number;
    totalPayout: number;
    netProfit: number;
    roiPercentage: number;
  };
}

export interface GSquareHarmonicsWalkForwardOptions {
  records: DayMarketEntry[];
  sourceMode?: GSquareHarmonicSourceMode;
  targetMarket?: Market | 'ALL';
  testWindowDays?: number;
  includePalat?: boolean;
  stakePerPair?: number;
  payoutMultiplier?: number;
}

export function mod10(value: number): number {
  return ((value % 10) + 10) % 10;
}

export function toOnesDigit(value: string | number): number {
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 0;
    return mod10(parsed);
  }
  return mod10(value);
}

export function generateGSquareHarmonicGrid(options: {
  sourceNumber: string | number;
}): GSquareHarmonicGridResult {
  const sourceNumber = String(options.sourceNumber ?? '0').trim();
  const x = toOnesDigit(sourceNumber);

  const verticalDigits: GSquareHarmonicDigit[] = [
    { key: 'A', value: mod10(x - 1), formula: '(x - 1) mod 10', explanation: 'A row' },
    { key: 'B', value: mod10(x), formula: 'x', explanation: 'B row' },
    { key: 'C', value: mod10(x + 1), formula: '(x + 1) mod 10', explanation: 'C row' },
    { key: 'D', value: mod10(x + 4), formula: '(x + 4) mod 10', explanation: 'D row' },
    { key: 'E', value: mod10(x + 5), formula: '(x + 5) mod 10', explanation: 'E row' },
    { key: 'F', value: mod10(x + 6), formula: '(x + 6) mod 10', explanation: 'F row' },
  ];

  const horizontalDigits: GSquareHarmonicDigit[] = [
    { key: 'G', value: mod10(x - 2), formula: '(x - 2) mod 10', explanation: 'G column' },
    { key: 'H', value: mod10(x - 3), formula: '(x - 3) mod 10', explanation: 'H column' },
    { key: 'I', value: mod10(x + 2), formula: '(x + 2) mod 10', explanation: 'I column' },
    { key: 'J', value: mod10(x + 3), formula: '(x + 3) mod 10', explanation: 'J column' },
  ];

  const cells: GSquareHarmonicCell[] = [];
  const pairs: string[] = [];
  const reversePairs: string[] = [];

  verticalDigits.forEach((vertical, rowIndex) => {
    horizontalDigits.forEach((horizontal, colIndex) => {
      const pair = `${vertical.value}${horizontal.value}`.padStart(2, '0');
      const reversePair = `${horizontal.value}${vertical.value}`.padStart(2, '0');
      const cell: GSquareHarmonicCell = {
        rowKey: vertical.key,
        colKey: horizontal.key,
        pair,
        reversePair,
        tens: vertical.value,
        ones: horizontal.value,
        rowIndex,
        colIndex,
      };
      cells.push(cell);
      pairs.push(pair);
      reversePairs.push(reversePair);
    });
  });

  return {
    sourceNumber,
    x,
    verticalDigits,
    horizontalDigits,
    cells,
    pairs,
    reversePairs,
  };
}

export function generateGSquareHarmonicField(options: { sourceNumber: string | number }): string[] {
  return generateGSquareHarmonicGrid(options).pairs;
}

export function generateGSquareHarmonicMatrix(options: { sourceNumber: string | number }) {
  const grid = generateGSquareHarmonicGrid(options);
  return {
    rows: grid.verticalDigits.map((vertical) => ({
      rowKey: vertical.key,
      values: grid.horizontalDigits.map((horizontal) => {
        const match = grid.cells.find(
          (cell) => cell.rowKey === vertical.key && cell.colKey === horizontal.key
        );
        return match ? match.pair : '00';
      }),
    })),
    grid,
  };
}

/**
 * Extracts candidate source draw from a DayMarketEntry based on user preference
 */
export function extractHarmonicSourceFromEntry(
  entry: DayMarketEntry,
  preference: GSquareHarmonicSourceMode = 'auto'
): { number: string; market: string } | null {
  const norm = (v?: string) => (v ? String(v).trim().padStart(2, '0') : '');

  if (preference === 'gali' && entry.gali) {
    return { number: norm(entry.gali), market: 'Gali' };
  }
  if (preference === 'ghaziabad' && (entry.ghaziabad || entry.gzb)) {
    return { number: norm(entry.ghaziabad || entry.gzb), market: 'Ghaziabad' };
  }
  if (preference === 'faridabad' && entry.faridabad) {
    return { number: norm(entry.faridabad), market: 'Faridabad' };
  }
  if (preference === 'deshawar' && entry.deshawar) {
    return { number: norm(entry.deshawar), market: 'Deshawar' };
  }

  // Auto mode: prioritize Gali, then Ghaziabad, then Faridabad, then Deshawar
  if (entry.gali) return { number: norm(entry.gali), market: 'Gali' };
  if (entry.ghaziabad || entry.gzb) return { number: norm(entry.ghaziabad || entry.gzb), market: 'Ghaziabad' };
  if (entry.faridabad) return { number: norm(entry.faridabad), market: 'Faridabad' };
  if (entry.deshawar) return { number: norm(entry.deshawar), market: 'Deshawar' };

  return null;
}

/**
 * Executes a Walk-Forward Sequential Empirical Test for G Square Harmonics
 */
export function runGSquareHarmonicsWalkForwardTest(
  options: GSquareHarmonicsWalkForwardOptions
): GSquareHarmonicWalkForwardReport {
  const {
    records,
    sourceMode = 'auto',
    targetMarket = 'ALL',
    testWindowDays = 0,
    includePalat = true,
    stakePerPair = 10,
    payoutMultiplier = 90,
  } = options;

  const emptyMarketBreakdown: Record<
    Market,
    { drawCount: number; straightHits: number; palatHits: number; totalHits: number; hitRate: number }
  > = {
    Faridabad: { drawCount: 0, straightHits: 0, palatHits: 0, totalHits: 0, hitRate: 0 },
    Ghaziabad: { drawCount: 0, straightHits: 0, palatHits: 0, totalHits: 0, hitRate: 0 },
    Gali: { drawCount: 0, straightHits: 0, palatHits: 0, totalHits: 0, hitRate: 0 },
    Deshawar: { drawCount: 0, straightHits: 0, palatHits: 0, totalHits: 0, hitRate: 0 },
  };

  const initialCellEfficacy: Record<string, GSquareHarmonicCellEfficacy> = {};
  const rowKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
  const colKeys = ['G', 'H', 'I', 'J'];
  rowKeys.forEach((r) => {
    colKeys.forEach((c) => {
      const cellKey = `${r}-${c}`;
      initialCellEfficacy[cellKey] = {
        rowKey: r,
        colKey: c,
        cellKey,
        pairFormula: `V(${r}) × H(${c})`,
        straightHits: 0,
        palatHits: 0,
        totalHits: 0,
        hitRate: 0,
      };
    });
  });

  if (!records || records.length < 2) {
    return {
      totalSteps: 0,
      evaluatedDays: 0,
      straightHitDays: 0,
      straightHitRate: 0,
      palatHitDays: 0,
      anyHitDays: 0,
      anyHitRate: 0,
      totalTargetDraws: 0,
      totalStraightHits: 0,
      totalPalatHits: 0,
      drawHitRate: 0,
      marketBreakdown: emptyMarketBreakdown,
      currentStreak: { type: 'WIN', count: 0 },
      maxWinningStreak: 0,
      maxLosingStreak: 0,
      cellEfficacy: Object.values(initialCellEfficacy),
      steps: [],
      roiSimulation: {
        stakePerPair,
        payoutMultiplier,
        totalStake: 0,
        totalPayout: 0,
        netProfit: 0,
        roiPercentage: 0,
      },
    };
  }

  // Deduplicate by date and sort chronologically (oldest to newest)
  const dateMap = new Map<string, DayMarketEntry>();
  records.forEach((r) => {
    if (r.date) dateMap.set(r.date, r);
  });
  const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Determine slice based on testWindowDays
  let startIndex = 1;
  if (testWindowDays > 0 && sorted.length > testWindowDays + 1) {
    startIndex = sorted.length - testWindowDays;
  }

  const steps: GSquareHarmonicWalkForwardStep[] = [];
  const marketStats = { ...emptyMarketBreakdown };
  (Object.keys(marketStats) as Market[]).forEach((m) => {
    marketStats[m] = { drawCount: 0, straightHits: 0, palatHits: 0, totalHits: 0, hitRate: 0 };
  });

  let straightHitDays = 0;
  let palatHitDays = 0;
  let anyHitDays = 0;
  let totalTargetDraws = 0;
  let totalStraightHits = 0;
  let totalPalatHits = 0;

  let currentStreakType: 'WIN' | 'LOSS' = 'WIN';
  let currentStreakCount = 0;
  let maxWinningStreak = 0;
  let maxLosingStreak = 0;

  let totalSimulationStake = 0;
  let totalSimulationPayout = 0;

  for (let i = startIndex; i < sorted.length; i++) {
    const priorDay = sorted[i - 1];
    const targetDay = sorted[i];

    const sourceData = extractHarmonicSourceFromEntry(priorDay, sourceMode);
    if (!sourceData) continue;

    const harmonicGrid = generateGSquareHarmonicGrid({ sourceNumber: sourceData.number });
    const straightPairs = harmonicGrid.pairs;
    const palatPairs = harmonicGrid.reversePairs;

    // Collect target day draw results
    const rawOutcomes: { market: Market; pair: string }[] = [];
    const pushOutcome = (m: Market, val?: string) => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        rawOutcomes.push({ market: m, pair: String(val).trim().padStart(2, '0') });
      }
    };

    pushOutcome('Faridabad', targetDay.faridabad);
    pushOutcome('Ghaziabad', targetDay.ghaziabad || targetDay.gzb);
    pushOutcome('Gali', targetDay.gali);
    pushOutcome('Deshawar', targetDay.deshawar);

    const targetOutcomes =
      targetMarket === 'ALL' ? rawOutcomes : rawOutcomes.filter((o) => o.market === targetMarket);

    if (targetOutcomes.length === 0) continue;

    const hits: GSquareHarmonicWalkForwardHit[] = [];
    let hasStraightHit = false;
    let hasPalatHit = false;

    for (const outcome of targetOutcomes) {
      marketStats[outcome.market].drawCount += 1;
      totalTargetDraws += 1;

      // Check straight match
      const matchingStraightCell = harmonicGrid.cells.find((c) => c.pair === outcome.pair);
      if (matchingStraightCell) {
        hasStraightHit = true;
        totalStraightHits += 1;
        marketStats[outcome.market].straightHits += 1;
        marketStats[outcome.market].totalHits += 1;
        const cellKey = `${matchingStraightCell.rowKey}-${matchingStraightCell.colKey}`;
        if (initialCellEfficacy[cellKey]) {
          initialCellEfficacy[cellKey].straightHits += 1;
          initialCellEfficacy[cellKey].totalHits += 1;
        }

        hits.push({
          market: outcome.market,
          pair: outcome.pair,
          matchType: 'STRAIGHT',
          cellKey,
          rowKey: matchingStraightCell.rowKey,
          colKey: matchingStraightCell.colKey,
        });
      } else if (includePalat) {
        // Check reverse / palat match
        const matchingPalatCell = harmonicGrid.cells.find((c) => c.reversePair === outcome.pair);
        if (matchingPalatCell) {
          hasPalatHit = true;
          totalPalatHits += 1;
          marketStats[outcome.market].palatHits += 1;
          marketStats[outcome.market].totalHits += 1;
          const cellKey = `${matchingPalatCell.rowKey}-${matchingPalatCell.colKey}`;
          if (initialCellEfficacy[cellKey]) {
            initialCellEfficacy[cellKey].palatHits += 1;
            initialCellEfficacy[cellKey].totalHits += 1;
          }

          hits.push({
            market: outcome.market,
            pair: outcome.pair,
            matchType: 'PALAT',
            cellKey,
            rowKey: matchingPalatCell.rowKey,
            colKey: matchingPalatCell.colKey,
          });
        }
      }
    }

    if (hasStraightHit) straightHitDays += 1;
    if (hasPalatHit) palatHitDays += 1;
    const isDayHit = includePalat ? (hasStraightHit || hasPalatHit) : hasStraightHit;
    if (isDayHit) anyHitDays += 1;

    // Streak accounting
    if (isDayHit) {
      if (currentStreakType === 'WIN') {
        currentStreakCount += 1;
      } else {
        currentStreakType = 'WIN';
        currentStreakCount = 1;
      }
      if (currentStreakCount > maxWinningStreak) {
        maxWinningStreak = currentStreakCount;
      }
    } else {
      if (currentStreakType === 'LOSS') {
        currentStreakCount += 1;
      } else {
        currentStreakType = 'LOSS';
        currentStreakCount = 1;
      }
      if (currentStreakCount > maxLosingStreak) {
        maxLosingStreak = currentStreakCount;
      }
    }

    // ROI accounting: pairs staked per target draw
    const pairsCount = includePalat ? 48 : 24;
    const dailyStake = targetOutcomes.length * pairsCount * stakePerPair;
    const dailyPayout = hits.length * (stakePerPair * payoutMultiplier);
    const dailyNetProfit = dailyPayout - dailyStake;

    totalSimulationStake += dailyStake;
    totalSimulationPayout += dailyPayout;

    steps.push({
      stepIndex: steps.length + 1,
      targetDate: targetDay.date,
      sourceDate: priorDay.date,
      sourceMarket: sourceData.market,
      sourceNumber: sourceData.number,
      x: harmonicGrid.x,
      verticalDigits: harmonicGrid.verticalDigits.map((v) => v.value),
      horizontalDigits: harmonicGrid.horizontalDigits.map((h) => h.value),
      straightPairs,
      palatPairs,
      targetOutcomes,
      hits,
      straightHit: hasStraightHit,
      palatHit: hasPalatHit,
      isHit: isDayHit,
      winningMarkets: Array.from(new Set(hits.map((h) => h.market))),
      winningPairs: hits.map((h) => h.pair),
      dailyStake,
      dailyPayout,
      dailyNetProfit,
    });
  }

  // Calculate percentages
  const evaluatedDays = steps.length;
  const straightHitRate = evaluatedDays > 0 ? Math.round((straightHitDays / evaluatedDays) * 1000) / 10 : 0;
  const anyHitRate = evaluatedDays > 0 ? Math.round((anyHitDays / evaluatedDays) * 1000) / 10 : 0;
  const drawHitRate =
    totalTargetDraws > 0
      ? Math.round(((totalStraightHits + (includePalat ? totalPalatHits : 0)) / totalTargetDraws) * 1000) / 10
      : 0;

  (Object.keys(marketStats) as Market[]).forEach((m) => {
    const item = marketStats[m];
    const totalWins = includePalat ? item.totalHits : item.straightHits;
    item.hitRate = item.drawCount > 0 ? Math.round((totalWins / item.drawCount) * 1000) / 10 : 0;
  });

  const cellEfficacyList = Object.values(initialCellEfficacy).map((c) => {
    const wins = includePalat ? c.totalHits : c.straightHits;
    return {
      ...c,
      hitRate: evaluatedDays > 0 ? Math.round((wins / evaluatedDays) * 1000) / 10 : 0,
    };
  });
  cellEfficacyList.sort((a, b) => b.totalHits - a.totalHits);

  const netProfit = totalSimulationPayout - totalSimulationStake;
  const roiPercentage =
    totalSimulationStake > 0 ? Math.round((netProfit / totalSimulationStake) * 1000) / 10 : 0;

  return {
    totalSteps: steps.length,
    evaluatedDays,
    straightHitDays,
    straightHitRate,
    palatHitDays,
    anyHitDays,
    anyHitRate,
    totalTargetDraws,
    totalStraightHits,
    totalPalatHits,
    drawHitRate,
    marketBreakdown: marketStats,
    currentStreak: { type: currentStreakType, count: currentStreakCount },
    maxWinningStreak,
    maxLosingStreak,
    cellEfficacy: cellEfficacyList,
    // Step list sorted newest first for convenient audit reading
    steps: [...steps].reverse(),
    roiSimulation: {
      stakePerPair,
      payoutMultiplier,
      totalStake: totalSimulationStake,
      totalPayout: totalSimulationPayout,
      netProfit,
      roiPercentage,
    },
  };
}

