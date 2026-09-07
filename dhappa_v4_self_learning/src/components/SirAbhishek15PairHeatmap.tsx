import React, { useState, useMemo } from 'react';
import {
  DayMarketEntry,
  SirAbhishekTheoryResult,
  Market,
  MARKETS,
} from '../types';
import {
  Flame,
  Grid,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Filter,
  Check,
  Copy,
  Send,
  Info,
  ChevronRight,
  Zap,
  Activity,
  Maximize2,
} from 'lucide-react';

interface SirAbhishek15PairHeatmapProps {
  theoryResult: SirAbhishekTheoryResult;
  records: DayMarketEntry[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

type HeatmapViewMode = 'branches' | 'matrix' | 'leaderboard';
type TimeframeOption = 'all' | '30d' | '15d';

export interface PairRepetitionStat {
  pair: string;
  formula: string;
  primaryLabel: string;
  primaryDigit: number;
  targetLabel: string;
  targetDigit: number;
  branchIndex: number;
  totalCount: number;
  byMarket: Record<Market, number>;
  occurrenceDates: Array<{ date: string; market: Market }>;
  lastSeenDate?: string;
  daysSinceLastSeen?: number;
  heatScore: number; // 0 to 100
  heatTier: 'EXTREME' | 'HIGH' | 'WARM' | 'MILD' | 'DORMANT';
}

export const SirAbhishek15PairHeatmap: React.FC<SirAbhishek15PairHeatmapProps> = ({
  theoryResult,
  records,
  onSendPairsToSimulator,
}) => {
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('branches');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');
  const [selectedMarket, setSelectedMarket] = useState<Market | 'All'>('All');
  const [inspectingPair, setInspectingPair] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter records based on timeframe
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    if (timeframe === '15d') return sorted.slice(-15);
    if (timeframe === '30d') return sorted.slice(-30);
    return sorted;
  }, [records, timeframe]);

  // Compute full repetition data for each of the 15 pairs
  const pairStatsMap = useMemo(() => {
    const map = new Map<string, PairRepetitionStat>();

    // Flatten all 15 target pairs across branches
    const allBranchPairs: Array<{
      pair: string;
      formula: string;
      primaryLabel: string;
      primaryDigit: number;
      targetLabel: string;
      targetDigit: number;
      branchIndex: number;
    }> = [];

    theoryResult.branches.forEach((branch, bIdx) => {
      branch.targetPairs.forEach((tp) => {
        const parts = tp.formula.split('→')[0].trim();
        const prim = parts[0] || branch.primaryLabel;
        const targ = parts[1] || '';
        allBranchPairs.push({
          pair: tp.pair,
          formula: tp.formula,
          primaryLabel: branch.primaryLabel,
          primaryDigit: branch.primaryDigit,
          targetLabel: targ,
          targetDigit: parseInt(tp.pair[1], 10),
          branchIndex: bIdx,
        });
      });
    });

    // Initialize stats
    allBranchPairs.forEach((bp) => {
      map.set(bp.pair, {
        ...bp,
        totalCount: 0,
        byMarket: {
          Deshawar: 0,
          Faridabad: 0,
          Gali: 0,
          Ghaziabad: 0,
        },
        occurrenceDates: [],
        lastSeenDate: undefined,
        daysSinceLastSeen: undefined,
        heatScore: 0,
        heatTier: 'DORMANT',
      });
    });

    // Scan through filtered historical records
    filteredRecords.forEach((rec) => {
      const checkObservation = (val: string | undefined, market: Market) => {
        if (val && map.has(val)) {
          const stat = map.get(val)!;
          stat.totalCount += 1;
          stat.byMarket[market] = (stat.byMarket[market] || 0) + 1;
          stat.occurrenceDates.push({ date: rec.date, market });
          if (!stat.lastSeenDate || rec.date > stat.lastSeenDate) {
            stat.lastSeenDate = rec.date;
          }
        }
      };

      checkObservation(rec.deshawar, 'Deshawar');
      checkObservation(rec.faridabad, 'Faridabad');
      checkObservation(rec.gali, 'Gali');
      checkObservation(rec.ghaziabad, 'Ghaziabad');
      if (rec.gzb && !rec.ghaziabad) checkObservation(rec.gzb, 'Ghaziabad');
    });

    // Determine max frequency to calibrate 0-100 heat score
    let maxCount = 0;
    map.forEach((stat) => {
      const effectiveCount =
        selectedMarket === 'All' ? stat.totalCount : stat.byMarket[selectedMarket] || 0;
      if (effectiveCount > maxCount) maxCount = effectiveCount;
    });

    const latestDateISO = filteredRecords[filteredRecords.length - 1]?.date;

    // Classify heat tiers
    map.forEach((stat) => {
      const effectiveCount =
        selectedMarket === 'All' ? stat.totalCount : stat.byMarket[selectedMarket] || 0;

      const ratio = maxCount > 0 ? effectiveCount / maxCount : 0;
      stat.heatScore = Math.round(ratio * 100);

      if (effectiveCount >= 5 || ratio >= 0.8) {
        stat.heatTier = 'EXTREME';
      } else if (effectiveCount >= 3 || ratio >= 0.5) {
        stat.heatTier = 'HIGH';
      } else if (effectiveCount >= 2 || ratio >= 0.3) {
        stat.heatTier = 'WARM';
      } else if (effectiveCount >= 1) {
        stat.heatTier = 'MILD';
      } else {
        stat.heatTier = 'DORMANT';
      }

      if (stat.lastSeenDate && latestDateISO) {
        const d1 = new Date(stat.lastSeenDate);
        const d2 = new Date(latestDateISO);
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
        stat.daysSinceLastSeen = Math.max(0, diffDays);
      }
    });

    return map;
  }, [theoryResult, filteredRecords, selectedMarket]);

  // Ranked 15 Pairs list
  const ranked15Pairs = useMemo(() => {
    const list: PairRepetitionStat[] = Array.from(pairStatsMap.values());
    return list.sort((a, b) => {
      const countA = selectedMarket === 'All' ? a.totalCount : a.byMarket[selectedMarket] || 0;
      const countB = selectedMarket === 'All' ? b.totalCount : b.byMarket[selectedMarket] || 0;
      if (countB !== countA) return countB - countA;
      return a.pair.localeCompare(b.pair);
    });
  }, [pairStatsMap, selectedMarket]);

  // Aggregate metrics for summary
  const summaryMetrics = useMemo(() => {
    let totalReps = 0;
    let nonZeroPairsCount = 0;
    let hottestPair = ranked15Pairs[0];
    const marketTotals: Record<Market, number> = {
      Deshawar: 0,
      Faridabad: 0,
      Gali: 0,
      Ghaziabad: 0,
    };

    pairStatsMap.forEach((stat) => {
      const count = selectedMarket === 'All' ? stat.totalCount : stat.byMarket[selectedMarket] || 0;
      totalReps += count;
      if (count > 0) nonZeroPairsCount++;
      (Object.keys(stat.byMarket) as Market[]).forEach((m) => {
        marketTotals[m] += stat.byMarket[m];
      });
    });

    const avgPerPair = Number((totalReps / 15).toFixed(1));
    const activeRate = Number(((nonZeroPairsCount / 15) * 100).toFixed(0));

    // Find dominant house for these 15 pairs
    let dominantMarket: Market = 'Deshawar';
    let maxMarketCount = 0;
    (Object.keys(marketTotals) as Market[]).forEach((m) => {
      if (marketTotals[m] > maxMarketCount) {
        maxMarketCount = marketTotals[m];
        dominantMarket = m;
      }
    });

    return {
      totalReps,
      nonZeroPairsCount,
      activeRate,
      avgPerPair,
      hottestPair,
      dominantMarket,
      maxMarketCount,
      totalHistoricalDays: filteredRecords.length,
    };
  }, [pairStatsMap, ranked15Pairs, selectedMarket, filteredRecords]);

  // Active inspected pair details
  const activeInspectedStat = inspectingPair
    ? pairStatsMap.get(inspectingPair) || null
    : ranked15Pairs[0] || null;

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Helper for thermal style class based on heat tier
  const getHeatCardStyles = (stat?: PairRepetitionStat) => {
    if (!stat) return 'bg-slate-950 border-slate-800 text-slate-400';
    const count = selectedMarket === 'All' ? stat.totalCount : stat.byMarket[selectedMarket] || 0;

    if (count === 0) {
      return 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700';
    }
    if (stat.heatTier === 'EXTREME') {
      return 'bg-gradient-to-br from-amber-950/70 via-rose-950/50 to-slate-950 border-amber-500/80 text-amber-200 shadow-md shadow-amber-500/10 hover:border-amber-400';
    }
    if (stat.heatTier === 'HIGH') {
      return 'bg-gradient-to-br from-emerald-950/70 via-cyan-950/40 to-slate-950 border-emerald-500/70 text-emerald-200 shadow-md shadow-emerald-500/10 hover:border-emerald-400';
    }
    if (stat.heatTier === 'WARM') {
      return 'bg-gradient-to-br from-cyan-950/60 via-purple-950/40 to-slate-950 border-cyan-500/60 text-cyan-200 hover:border-cyan-400';
    }
    return 'bg-purple-950/40 border-purple-500/40 text-purple-200 hover:border-purple-300';
  };

  const getHeatBadgeStyles = (stat?: PairRepetitionStat) => {
    if (!stat) return 'bg-slate-800 text-slate-400';
    const count = selectedMarket === 'All' ? stat.totalCount : stat.byMarket[selectedMarket] || 0;
    if (count === 0) return 'bg-slate-900 text-slate-500 border border-slate-800';

    if (stat.heatTier === 'EXTREME') {
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black';
    }
    if (stat.heatTier === 'HIGH') {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
    }
    if (stat.heatTier === 'WARM') {
      return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold';
    }
    return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
  };

  return (
    <div className="space-y-5">
      {/* HEADER & CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                15-Pair Historical Repetition Heatmap & Occurrence Matrix
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {summaryMetrics.totalReps} Total Occurrences
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Thermal frequency mapping matching every pairwise combination from Step 5 against recorded draw history
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS: VIEW MODE, TIMEFRAME, MARKET FILTER */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('branches')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'branches'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5-Branch Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>6×6 Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('leaderboard')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Frequency Ranking</span>
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({filteredRecords.length}d)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30d
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('15d')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeframe === '15d'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              15d
            </button>
          </div>

          {/* Market Dropdown Filter */}
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value as Market | 'All')}
            className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-purple-500"
          >
            <option value="All">All 4 Houses</option>
            <option value="Deshawar">Deshawar Only</option>
            <option value="Faridabad">Faridabad Only</option>
            <option value="Gali">Gali Only</option>
            <option value="Ghaziabad">Ghaziabad Only</option>
          </select>
        </div>
      </div>

      {/* QUICK SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[10px] text-slate-500 uppercase">15-Pair Combined Frequency</div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 flex items-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4 text-amber-400" />
            {summaryMetrics.totalReps} Hits
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Avg {summaryMetrics.avgPerPair} occurrences / pair
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[10px] text-slate-500 uppercase">Hottest Repetition Pair</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 flex items-center gap-1.5 mt-0.5">
            <span>{summaryMetrics.hottestPair?.pair || '--'}</span>
            <span className="text-xs font-normal text-emerald-400/80">
              ({selectedMarket === 'All' ? summaryMetrics.hottestPair?.totalCount : summaryMetrics.hottestPair?.byMarket[selectedMarket]}x)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Formula: {summaryMetrics.hottestPair?.formula.split('→')[0] || '--'}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[10px] text-slate-500 uppercase">Historical Breadth</div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
            {summaryMetrics.nonZeroPairsCount} / 15
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {summaryMetrics.activeRate}% of pairs observed
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[10px] text-slate-500 uppercase">Top Market Concentration</div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 mt-0.5">
            {summaryMetrics.dominantMarket}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {summaryMetrics.maxMarketCount} hits across history
          </div>
        </div>
      </div>

      {/* VIEW 1: 5-BRANCH EXPANSION HEATMAP CARDS */}
      {viewMode === 'branches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {theoryResult.branches.map((branch) => {
              const branchCount = branch.targetPairs.length;
              return (
                <div
                  key={branch.primaryLabel}
                  className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-lg hover:border-purple-500/40 transition"
                >
                  <div>
                    {/* Branch Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-purple-300">
                        <span className="uppercase">{branch.primaryLabel}</span>
                        <span className="text-slate-500">=</span>
                        <span className="text-cyan-300 font-extrabold text-base">
                          {branch.primaryDigit}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                        {branchCount} {branchCount === 1 ? 'Pair' : 'Pairs'}
                      </span>
                    </div>

                    {/* Pair Items with Thermal Color Intensity */}
                    <div className="space-y-2 font-mono">
                      {branch.targetPairs.map((tp, tpIdx) => {
                        const stat = pairStatsMap.get(tp.pair);
                        const count = stat
                          ? selectedMarket === 'All'
                            ? stat.totalCount
                            : stat.byMarket[selectedMarket] || 0
                          : 0;
                        const isInspecting = inspectingPair === tp.pair;

                        return (
                          <button
                            key={`${tp.pair}-${tpIdx}`}
                            type="button"
                            onClick={() => setInspectingPair(tp.pair)}
                            className={`w-full p-2.5 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${getHeatCardStyles(
                              stat
                            )} ${isInspecting ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950 scale-[1.02]' : ''}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] text-slate-400 font-semibold">
                                {tp.formula.split('→')[0]}
                              </span>
                              <span className="font-mono text-base font-black text-slate-100">
                                {tp.pair}
                              </span>
                            </div>

                            {/* Repetition indicator pill & mini bar */}
                            <div className="flex items-center justify-between w-full mt-2 pt-1.5 border-t border-slate-800/60 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded ${getHeatBadgeStyles(stat)}`}>
                                {count > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Flame className="w-2.5 h-2.5 text-amber-400" />
                                    {count}x Reps
                                  </span>
                                ) : (
                                  '0x Drawn'
                                )}
                              </span>

                              {stat?.lastSeenDate ? (
                                <span className="text-slate-400 text-[9px]">
                                  {stat.daysSinceLastSeen === 0
                                    ? 'Today'
                                    : `${stat.daysSinceLastSeen}d ago`}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[9px]">No Record</span>
                              )}
                            </div>

                            {/* Market Mini-Distribution Badges */}
                            {stat && count > 0 && (
                              <div className="grid grid-cols-4 gap-1 mt-1.5 pt-1 text-[8px] text-slate-400 text-center">
                                <span title={`Deshawar: ${stat.byMarket.Deshawar}x`} className={stat.byMarket.Deshawar ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                                  DS:{stat.byMarket.Deshawar}
                                </span>
                                <span title={`Faridabad: ${stat.byMarket.Faridabad}x`} className={stat.byMarket.Faridabad ? 'text-emerald-300 font-bold' : 'text-slate-600'}>
                                  FB:{stat.byMarket.Faridabad}
                                </span>
                                <span title={`Gali: ${stat.byMarket.Gali}x`} className={stat.byMarket.Gali ? 'text-cyan-300 font-bold' : 'text-slate-600'}>
                                  GL:{stat.byMarket.Gali}
                                </span>
                                <span title={`Ghaziabad: ${stat.byMarket.Ghaziabad}x`} className={stat.byMarket.Ghaziabad ? 'text-purple-300 font-bold' : 'text-slate-600'}>
                                  GZ:{stat.byMarket.Ghaziabad}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 text-[10px] text-slate-500 text-center font-mono border-t border-slate-800/60">
                    Branch {branch.primaryLabel.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 6×6 COMBINATORIC MODULO HEATMAP MATRIX */}
      {viewMode === 'matrix' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-400" />
                6×6 Modulo-10 Basis Pairwise Occurrence Matrix S = {'{a, x, b, y, z, e}'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The upper-triangular 15 combinations represent the exact Sir Abhishek pair set.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> 5+ Extreme Heat
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> 3-4 High
              </span>
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" /> 1-2 Warm
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-800 bg-slate-900 text-slate-400 text-[10px]">
                    Row \ Col
                  </th>
                  {theoryResult.primarySet.map((colItem) => (
                    <th
                      key={`col-${colItem.label}`}
                      className="p-2 border border-slate-800 bg-slate-900 text-slate-200"
                    >
                      <div className="text-[10px] text-purple-400 uppercase">{colItem.label}</div>
                      <div className="font-black text-sm text-cyan-300">{colItem.digit}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {theoryResult.primarySet.map((rowItem, rowIdx) => (
                  <tr key={`row-${rowItem.label}`}>
                    <th className="p-2 border border-slate-800 bg-slate-900 text-slate-200">
                      <div className="text-[10px] text-purple-400 uppercase">{rowItem.label}</div>
                      <div className="font-black text-sm text-cyan-300">{rowItem.digit}</div>
                    </th>
                    {theoryResult.primarySet.map((colItem, colIdx) => {
                      if (rowIdx >= colIdx) {
                        // Diagonal / Lower triangle: not in the vertical expansion
                        return (
                          <td
                            key={`cell-${rowIdx}-${colIdx}`}
                            className="p-2 border border-slate-800/60 bg-slate-950/40 text-slate-700 text-[10px]"
                          >
                            {rowIdx === colIdx ? 'Identity' : '—'}
                          </td>
                        );
                      }

                      // Upper triangle: Exact 15 pairs
                      const pairStr = `${rowItem.digit}${colItem.digit}`;
                      const stat = pairStatsMap.get(pairStr);
                      const count = stat
                        ? selectedMarket === 'All'
                          ? stat.totalCount
                          : stat.byMarket[selectedMarket] || 0
                        : 0;
                      const isInspecting = inspectingPair === pairStr;

                      return (
                        <td
                          key={`cell-${rowIdx}-${colIdx}`}
                          className={`p-2 border border-slate-800 transition cursor-pointer ${getHeatCardStyles(
                            stat
                          )} ${isInspecting ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950' : ''}`}
                          onClick={() => setInspectingPair(pairStr)}
                        >
                          <div className="font-extrabold text-sm text-slate-100">{pairStr}</div>
                          <div className="text-[10px] mt-0.5">
                            <span className={`px-1 rounded ${getHeatBadgeStyles(stat)}`}>
                              {count}x
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: HISTORICAL REPETITION LEADERBOARD */}
      {viewMode === 'leaderboard' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h4 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                15-Pair Historical Repetition Frequency Leaderboard
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sorted by total historical hits across {summaryMetrics.totalHistoricalDays} recorded days
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Filter: <strong className="text-cyan-300">{selectedMarket}</strong> | Window:{' '}
              <strong className="text-purple-300">{timeframe.toUpperCase()}</strong>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {ranked15Pairs.map((stat, idx) => {
              const count =
                selectedMarket === 'All' ? stat.totalCount : stat.byMarket[selectedMarket] || 0;
              const maxCount =
                selectedMarket === 'All'
                  ? ranked15Pairs[0]?.totalCount || 1
                  : ranked15Pairs[0]?.byMarket[selectedMarket] || 1;
              const barWidth = maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 8;
              const isInspecting = inspectingPair === stat.pair;

              return (
                <div
                  key={`${stat.pair}-${idx}`}
                  onClick={() => setInspectingPair(stat.pair)}
                  className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${getHeatCardStyles(
                    stat
                  )} ${isInspecting ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-slate-400 text-[10px] font-bold flex items-center justify-center border border-slate-800">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-mono text-lg font-black text-slate-100 flex items-center gap-2">
                        {stat.pair}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({stat.formula.split('→')[0]})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relative Repetition Frequency Progress Bar */}
                  <div className="flex-1 max-w-md hidden sm:block">
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className={`h-full transition-all duration-500 ${
                          stat.heatTier === 'EXTREME'
                            ? 'bg-amber-400'
                            : stat.heatTier === 'HIGH'
                            ? 'bg-emerald-400'
                            : stat.heatTier === 'WARM'
                            ? 'bg-cyan-400'
                            : 'bg-purple-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Market Breakdown & Last Seen */}
                  <div className="flex items-center gap-3 text-right">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">
                        DS:{stat.byMarket.Deshawar}
                      </span>
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300">
                        FB:{stat.byMarket.Faridabad}
                      </span>
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300">
                        GL:{stat.byMarket.Gali}
                      </span>
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-purple-300">
                        GZ:{stat.byMarket.Ghaziabad}
                      </span>
                    </div>

                    <div className="min-w-[70px] text-right">
                      <span className={`px-2 py-1 rounded text-xs ${getHeatBadgeStyles(stat)}`}>
                        {count} Hits
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECTION CARD FOR SELECTED PAIR */}
      {activeInspectedStat && (
        <div className="bg-slate-950 rounded-xl border border-purple-500/40 p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-2xl font-black text-amber-300 bg-slate-900 px-3 py-1 rounded-xl border border-amber-500/40">
                {activeInspectedStat.pair}
              </span>
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-200 uppercase">
                  Historical Repetition Audit: Branch {activeInspectedStat.primaryLabel.toUpperCase()} ({activeInspectedStat.formula})
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Total Historical Occurrences:{' '}
                  <strong className="text-emerald-300">{activeInspectedStat.totalCount} times</strong>{' '}
                  across {filteredRecords.length} evaluated draw days
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(activeInspectedStat.pair, 'inspected')}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'inspected' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span>Copy Pair</span>
                  </>
                )}
              </button>

              {onSendPairsToSimulator && (
                <button
                  type="button"
                  onClick={() => onSendPairsToSimulator([activeInspectedStat.pair])}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Simulator</span>
                </button>
              )}
            </div>
          </div>

          {/* Market breakdown grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">DESHAWAR HITS</span>
              <span className="text-base font-bold text-amber-300">
                {activeInspectedStat.byMarket.Deshawar} Times
              </span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">FARIDABAD HITS</span>
              <span className="text-base font-bold text-emerald-300">
                {activeInspectedStat.byMarket.Faridabad} Times
              </span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">GALI HITS</span>
              <span className="text-base font-bold text-cyan-300">
                {activeInspectedStat.byMarket.Gali} Times
              </span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">GHAZIABAD HITS</span>
              <span className="text-base font-bold text-purple-300">
                {activeInspectedStat.byMarket.Ghaziabad} Times
              </span>
            </div>
          </div>

          {/* Recent occurrences history list */}
          {activeInspectedStat.occurrenceDates.length > 0 ? (
            <div className="pt-2">
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                Recorded Draw History for Pair {activeInspectedStat.pair} (Recent First):
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {activeInspectedStat.occurrenceDates
                  .slice(-10)
                  .reverse()
                  .map((item, idx) => (
                    <span
                      key={`${item.date}-${item.market}-${idx}`}
                      className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded flex items-center gap-1.5"
                    >
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <strong className="text-slate-100">{item.date}</strong>
                      <span className="text-cyan-400">({item.market})</span>
                    </span>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-500 py-1">
              Pair {activeInspectedStat.pair} has not been drawn within the selected {timeframe.toUpperCase()} timeframe window.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
