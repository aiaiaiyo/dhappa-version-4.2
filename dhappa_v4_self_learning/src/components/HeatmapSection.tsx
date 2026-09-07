import React, { useState, useMemo } from 'react';
import {
  Grid,
  Filter,
  Eye,
  Send,
  Award,
  Info,
  X,
  TrendingUp,
  Layers,
  Activity,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Market, MARKETS, DayMarketEntry, PairCellData } from '../types';
import { WalkForwardCoverageTable } from './WalkForwardCoverageTable';

interface HeatmapSectionProps {
  records: DayMarketEntry[];
  todayGeneratedPairs: string[];
  onSendPairToSimulator?: (pair: string) => void;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const HeatmapSection: React.FC<HeatmapSectionProps> = ({
  records,
  todayGeneratedPairs,
  onSendPairToSimulator,
  onSendPairsToSimulator,
}) => {
  // Active View Tab inside Coverage & Universe Matrix
  const [activeSubView, setActiveSubView] = useState<'matrix' | 'walk-forward' | 'deciles'>('matrix');
  const [selectedMarket, setSelectedMarket] = useState<Market | 'All'>('All');
  const [highlightTodayPairs, setHighlightTodayPairs] = useState<boolean>(true);
  const [inspectingPair, setInspectingPair] = useState<string | null>(null);

  // Compute 10x10 pair occurrence map (00 to 99)
  const matrixData = useMemo(() => {
    const map = new Map<string, PairCellData>();

    // Initialize all 100 cells
    for (let i = 0; i < 100; i++) {
      const pairStr = i.toString().padStart(2, '0');
      map.set(pairStr, {
        pair: pairStr,
        totalCount: 0,
        byMarket: {
          Gali: 0,
          Deshawar: 0,
          Faridabad: 0,
          Ghaziabad: 0,
        },
        dates: [],
        firstObservedDate: undefined,
        lastObservedDate: undefined,
      });
    }

    // Populate frequencies from DayMarketEntry records
    records.forEach((rec) => {
      const recordObservation = (pair: string | undefined, market: Market) => {
        if (pair && map.has(pair)) {
          const cell = map.get(pair)!;
          cell.totalCount += 1;
          cell.byMarket[market] = (cell.byMarket[market] || 0) + 1;
          if (!cell.dates.includes(rec.date)) {
            cell.dates.push(rec.date);
          }
          if (!cell.firstObservedDate || rec.date < cell.firstObservedDate) {
            cell.firstObservedDate = rec.date;
          }
          if (!cell.lastObservedDate || rec.date > cell.lastObservedDate) {
            cell.lastObservedDate = rec.date;
          }
        }
      };

      recordObservation(rec.deshawar, 'Deshawar');
      recordObservation(rec.faridabad, 'Faridabad');
      recordObservation(rec.gali, 'Gali');
      recordObservation(rec.ghaziabad || rec.gzb, 'Ghaziabad');
    });

    return map;
  }, [records]);

  const getCellDisplayCount = (cell: PairCellData): number => {
    if (selectedMarket === 'All') return cell.totalCount;
    return cell.byMarket[selectedMarket] || 0;
  };

  // KPI Calculations
  const kpiStats = useMemo(() => {
    let totalEntries = 0;
    let uniquePairsCount = 0;
    let maxFreq = 0;

    matrixData.forEach((cell) => {
      const count = getCellDisplayCount(cell);
      if (count > 0) {
        uniquePairsCount += 1;
        totalEntries += count;
        if (count > maxFreq) maxFreq = count;
      }
    });

    const overlapCount = todayGeneratedPairs.filter((p) => {
      const cell = matrixData.get(p);
      return cell && getCellDisplayCount(cell) > 0;
    }).length;

    return {
      totalEntries,
      uniquePairsCount,
      maxFreq,
      todayCount: todayGeneratedPairs.length,
      overlapCount,
    };
  }, [matrixData, selectedMarket, todayGeneratedPairs]);

  // Deciles Breakdown (00-09, 10-19, ..., 90-99)
  const decilesData = useMemo(() => {
    const deciles: Array<{
      decade: string;
      range: string;
      numbers: string[];
      seenCount: number;
      totalHits: number;
      coveragePct: number;
      topNumber: string;
      topHits: number;
    }> = [];

    for (let d = 0; d < 10; d++) {
      const numbers: string[] = [];
      let seenCount = 0;
      let totalHits = 0;
      let topNumber = `${d}0`;
      let topHits = -1;

      for (let u = 0; u < 10; u++) {
        const num = `${d}${u}`;
        numbers.push(num);
        const cell = matrixData.get(num);
        const count = cell ? getCellDisplayCount(cell) : 0;
        if (count > 0) {
          seenCount++;
          totalHits += count;
        }
        if (count > topHits) {
          topHits = count;
          topNumber = num;
        }
      }

      deciles.push({
        decade: `${d}X`,
        range: `${d}0–${d}9`,
        numbers,
        seenCount,
        totalHits,
        coveragePct: (seenCount / 10) * 100,
        topNumber,
        topHits: Math.max(0, topHits),
      });
    }

    return deciles;
  }, [matrixData, selectedMarket]);

  // Top 10 Most Frequent Pairs
  const top10Pairs = useMemo(() => {
    const allCells: PairCellData[] = Array.from(matrixData.values());
    return allCells
      .map((cell) => ({
        ...cell,
        effectiveCount: getCellDisplayCount(cell),
      }))
      .filter((c) => c.effectiveCount > 0)
      .sort((a, b) => b.effectiveCount - a.effectiveCount || a.pair.localeCompare(b.pair))
      .slice(0, 10);
  }, [matrixData, selectedMarket]);

  // Color intensity shading for heatmap
  const getIntensityClass = (count: number, isTodayPair: boolean): string => {
    let baseBg = 'bg-slate-950/60 text-slate-500 border-slate-800/80 hover:border-slate-700';
    if (count === 1) {
      baseBg = 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40 hover:border-emerald-700';
    } else if (count === 2) {
      baseBg = 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60 hover:border-emerald-500';
    } else if (count >= 3 && count <= 4) {
      baseBg = 'bg-emerald-700/70 text-emerald-100 border-emerald-500/70 hover:border-emerald-400 font-bold';
    } else if (count >= 5) {
      baseBg = 'bg-emerald-500 text-slate-950 border-emerald-300 font-extrabold shadow-sm';
    }

    if (highlightTodayPairs && isTodayPair) {
      return `${baseBg} ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 z-10`;
    }
    return baseBg;
  };

  const inspectedCellData = inspectingPair ? matrixData.get(inspectingPair) : null;

  return (
    <div id="section-10x10-heatmap" className="space-y-4">
      {/* Header & Sub-View Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Grid className="w-3 h-3 text-cyan-400" />
              <span>Coverage & Universe Matrix Analytics</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              Historical 00–99 Universe Coverage & Walk-Forward Engine
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Examine the historical 00–99 sample space distribution, verify sequential walk-forward universe expansion across all recorded draws, and track decile dispersion.
            </p>
          </div>

          {/* Sub-View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-mono self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubView('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubView === 'matrix'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>10×10 Universe Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('walk-forward')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubView === 'walk-forward'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Walk-Forward Backtesting Table</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubView === 'walk-forward'
                  ? 'bg-slate-950 text-cyan-300'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {records.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('deciles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubView === 'deciles'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deciles & Symmetry</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Bento Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Observations</div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">{kpiStats.totalEntries}</div>
            <div className="text-[9px] text-slate-400 font-mono">Market draw records</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Unique Pairs Seen</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {kpiStats.uniquePairsCount} <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">{(kpiStats.uniquePairsCount / 100 * 100).toFixed(0)}% Universe coverage</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Max Cell Frequency</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {kpiStats.maxFreq}×
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Highest observed cell</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Today's Generated</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">
              {kpiStats.todayCount}
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Deterministic pairs</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Historical Overlap</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {kpiStats.overlapCount} <span className="text-xs text-slate-400 font-normal">/ {kpiStats.todayCount || 12}</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Previously observed</div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Walk-Forward Backtesting Table */}
      {activeSubView === 'walk-forward' && (
        <WalkForwardCoverageTable
          records={records}
          onSendPairToSimulator={onSendPairToSimulator}
          onSendPairsToSimulator={onSendPairsToSimulator}
        />
      )}

      {/* VIEW 2: 10x10 Matrix & Inspector */}
      {activeSubView === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 10x10 Matrix Grid (col-span-8) */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest">
                  10×10 Grid (00–99)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Click cell to inspect</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Market Filter */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedMarket('All')}
                    className={`px-2 py-0.5 rounded transition ${
                      selectedMarket === 'All'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMarket(m)}
                      className={`px-2 py-0.5 rounded transition ${
                        selectedMarket === m
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Toggle Highlight Today's Generated Pairs */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <input
                    id="toggle-highlight-today-pairs"
                    type="checkbox"
                    checked={highlightTodayPairs}
                    onChange={(e) => setHighlightTodayPairs(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                  />
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Highlight Today's 12</span>
                  </span>
                </label>
              </div>
            </div>

            {/* 10x10 Heatmap Table */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[480px]">
                {/* Header row */}
                <div className="grid grid-cols-11 gap-1.5 text-center font-mono text-xs font-bold text-slate-400 mb-1.5">
                  <div className="py-1 text-[10px] text-slate-400">Row</div>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                    <div key={col} className="py-1 text-slate-400">
                      _{col}
                    </div>
                  ))}
                </div>

                {/* 10 Rows (00-09 to 90-99) */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rowDigit) => (
                  <div key={rowDigit} className="grid grid-cols-11 gap-1.5 text-center font-mono text-xs mb-1.5">
                    <div className="flex items-center justify-center font-bold text-slate-400 bg-slate-950/40 rounded border border-slate-800 py-2 text-[11px]">
                      {rowDigit}_
                    </div>

                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((colDigit) => {
                      const pairStr = `${rowDigit}${colDigit}`;
                      const cell = matrixData.get(pairStr)!;
                      const count = getCellDisplayCount(cell);
                      const isTodayPair = todayGeneratedPairs.includes(pairStr);
                      const isSelected = inspectingPair === pairStr;

                      return (
                        <button
                          key={pairStr}
                          id={`heatmap-cell-${pairStr}`}
                          type="button"
                          onClick={() => setInspectingPair(pairStr)}
                          className={`relative rounded-md py-2.5 px-1 border transition-all text-xs flex flex-col items-center justify-center gap-0.5 select-none ${getIntensityClass(
                            count,
                            isTodayPair
                          )} ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 font-bold z-20 scale-105' : ''}`}
                          title={`Pair ${pairStr}: ${count} historical occurrence(s)`}
                          aria-label={`Inspect pair ${pairStr}`}
                        >
                          <span className="font-mono leading-none">{pairStr}</span>
                          <span className="text-[9px] opacity-75 font-mono leading-none">
                            {count > 0 ? `${count}×` : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300 text-[11px]">Legend:</span>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="w-5 h-5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-400">0</span>
                  <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-900 text-emerald-400 flex items-center justify-center">1</span>
                  <span className="w-5 h-5 rounded bg-emerald-900/70 border border-emerald-700 text-emerald-200 flex items-center justify-center">2</span>
                  <span className="w-5 h-5 rounded bg-emerald-700 border border-emerald-500 text-white flex items-center justify-center">3-4</span>
                  <span className="w-5 h-5 rounded bg-emerald-500 border border-emerald-300 text-slate-950 font-bold flex items-center justify-center">5+</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <Info className="w-3 h-3 text-cyan-400" />
                <span>Empirical historical distribution across finite recorded sample.</span>
              </div>
            </div>
          </div>

          {/* Right Col: Pair Inspector & Leaderboard (col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Pair Inspector Panel */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>Pair Inspector</span>
                </span>
                {inspectedCellData && (
                  <button
                    type="button"
                    onClick={() => setInspectingPair(null)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {inspectedCellData ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Target Pair</span>
                      <div className="text-3xl font-mono font-bold text-slate-100">
                        {inspectedCellData.pair}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Observed</span>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {inspectedCellData.totalCount}×
                      </div>
                    </div>
                  </div>

                  {/* Market Breakdown */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-[10px] text-slate-400 uppercase font-mono tracking-wider">Market Counts:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                      {MARKETS.map((m) => (
                        <div
                          key={m}
                          className="bg-slate-950/60 p-2 rounded border border-slate-800 flex justify-between items-center"
                        >
                          <span className="text-slate-400 text-[11px]">{m}:</span>
                          <span className="font-bold text-slate-200">{inspectedCellData.byMarket[m]}×</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>First Seen:</span>
                      <span className="text-slate-200">{inspectedCellData.firstObservedDate || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Most Recent:</span>
                      <span className="text-slate-200">{inspectedCellData.lastObservedDate || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>In Today's 12:</span>
                      <span className={todayGeneratedPairs.includes(inspectedCellData.pair) ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {todayGeneratedPairs.includes(inspectedCellData.pair) ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>

                  {onSendPairToSimulator && (
                    <button
                      id="btn-inspector-send-to-sim"
                      type="button"
                      onClick={() => onSendPairToSimulator(inspectedCellData.pair)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send "{inspectedCellData.pair}" to Simulator</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs space-y-1">
                  <Grid className="w-6 h-6 mx-auto text-slate-700 mb-1" />
                  <p>Click any cell in the 10×10 heatmap to inspect.</p>
                </div>
              )}
            </div>

            {/* Historical Leaderboard */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest flex items-center gap-1.5">
                  <Award className="w-3 h-3 text-cyan-400" />
                  <span>Historical Leaderboard</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Top 10</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {top10Pairs.length > 0 ? (
                  top10Pairs.map((item, idx) => (
                    <div
                      key={`${item.pair}-${idx}`}
                      onClick={() => setInspectingPair(item.pair)}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-200 text-sm">{item.pair}</span>
                        {todayGeneratedPairs.includes(item.pair) && (
                          <span className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold border border-emerald-500/20">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold">{item.effectiveCount}×</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No historical records loaded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Deciles & Symmetry Breakdown */}
      {activeSubView === 'deciles' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest">
                Decade Range Coverage (10 Deciles)
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                00–99 Universe Decile Penetration & Symmetry
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Each decile contains exactly 10 pairs (e.g. 30–39)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {decilesData.map((dec) => (
              <div
                key={dec.decade}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/50">
                      {dec.range}
                    </span>
                    <span className="text-slate-400 text-[11px]">({dec.decade})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-sm">{dec.seenCount}/10</span>
                    <span className="text-slate-400 text-[10px] ml-1">({dec.coveragePct.toFixed(0)}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${dec.coveragePct}%` }}
                  />
                </div>

                {/* Pairs Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {dec.numbers.map((num) => {
                    const cell = matrixData.get(num);
                    const count = cell ? getCellDisplayCount(cell) : 0;
                    const isToday = todayGeneratedPairs.includes(num);

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setInspectingPair(num);
                          setActiveSubView('matrix');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[11px] border transition cursor-pointer ${
                          count > 0
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50 font-bold'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800'
                        } ${isToday ? 'ring-1 ring-amber-400' : ''}`}
                        title={`${num}: ${count} hits`}
                      >
                        {num}
                        {count > 0 && <span className="text-[9px] opacity-70 ml-0.5">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Total Decile Hits: <strong className="text-slate-200">{dec.totalHits}</strong></span>
                  <span>Top Pair: <strong className="text-cyan-300">{dec.topNumber} ({dec.topHits}×)</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

