import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  Flame,
  Calculator,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Zap,
  Grid,
  Search,
  Filter,
  BarChart2,
  Award,
  ShieldCheck,
  Compass,
  Cpu,
  BrainCircuit,
  PieChart,
  Sliders,
  HelpCircle,
  Hash,
  ArrowUpDown,
  BookOpen,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DayMarketEntry,
  Currency,
  CURRENCIES,
  BelgiumSquareMLModelType,
  BelgiumSquareSourceMode,
  BelgiumSquareCandidatePrediction,
  BelgiumSquareMatrixCell,
  BelgiumSquareCommonDigitGroup,
} from '../types';
import {
  generateBelgiumSquareMatrixResult,
  format2DigitString,
  getReverseString,
} from '../utils/belgiumSquareMatrixEngine';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface BelgiumSquareMatrixSectionProps {
  records: DayMarketEntry[];
  currency?: Currency;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const BelgiumSquareMatrixSection: React.FC<BelgiumSquareMatrixSectionProps> = ({
  records,
  currency = 'USD',
  onSendPairsToSimulator,
}) => {
  // Sort chronological ascending & descending
  const sortedDesc = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  // Target Date selector (default to newest date in records)
  const defaultTargetDate = sortedDesc[0]?.date || '2026-08-28';
  const [selectedTargetDate, setSelectedTargetDate] = useState<string>(defaultTargetDate);
  const [sourceMode, setSourceMode] = useState<BelgiumSquareSourceMode>('all_markets');
  const [activeModel, setActiveModel] = useState<BelgiumSquareMLModelType>('calibrated_ensemble');
  const [selectedCommonDigit, setSelectedCommonDigit] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'matrix_predictions' | 'backtest_ledger' | 'model_arena' | 'pattern_discovery' | 'methodology'
  >('matrix_predictions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<BelgiumSquareMatrixCell | null>(null);

  // Generate result
  const engineResult = useMemo(() => {
    return generateBelgiumSquareMatrixResult({
      targetDate: selectedTargetDate,
      records,
      sourceMode,
      modelType: activeModel,
      selectedCommonDigit,
    });
  }, [selectedTargetDate, records, sourceMode, activeModel, selectedCommonDigit]);

  const standardizedBelgiumResult = useMemo(() => {
    const candidates = engineResult.rankedCandidates.map((item) => item.pair);
    const score = engineResult.top1Prediction?.mlScore ?? engineResult.walkForwardReport.top1HitRate;
    const confidence = engineResult.top1Prediction?.mlScore ? engineResult.top1Prediction.mlScore / 100 : 0.5;
    const evidence = engineResult.rankedCandidates.slice(0, 5).flatMap((item) => item.whySelectedReasons);

    return buildStandardizedEngineResult({
      engineId: 'BELGIUM_SQUARE',
      methodName: 'Belgium Square Matrix',
      date: selectedTargetDate,
      channel: 'live-engine-output',
      sourceValues: {
        sourceDate: engineResult.sourceDate,
        sourceMode,
        selectedCommonDigit,
      },
      normalizedValues: {
        commonDigitGroups: engineResult.commonDigitGroups.length,
        rankedCandidates: candidates.length,
      },
      rawResult: engineResult,
      score,
      confidence,
      historicalSupport: engineResult.walkForwardReport.totalOpportunities,
      risk: Math.max(0, 100 - engineResult.walkForwardReport.top5HitRate),
      evidence,
      steps: ['validate()', 'detectCommonDigits()', 'buildMatrix()', 'rankCandidates()', 'score()'],
    });
  }, [engineResult, selectedTargetDate, sourceMode, selectedCommonDigit]);

  const {
    sourceDate,
    sourceDraws,
    commonDigitGroups,
    selectedCommonDigitGroup,
    rankedCandidates,
    top1Prediction,
    top3Predictions,
    top5Predictions,
    top10Predictions,
    allCandidates,
    walkForwardReport,
    actualOutcomesForTargetDate,
    evaluatedHits,
  } = engineResult;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrevDay = () => {
    const idx = sortedDesc.findIndex((r) => r.date === selectedTargetDate);
    if (idx !== -1 && idx < sortedDesc.length - 1) {
      setSelectedTargetDate(sortedDesc[idx + 1].date);
      setSelectedCommonDigit(null);
      setSelectedCell(null);
    }
  };

  const handleNextDay = () => {
    const idx = sortedDesc.findIndex((r) => r.date === selectedTargetDate);
    if (idx > 0) {
      setSelectedTargetDate(sortedDesc[idx - 1].date);
      setSelectedCommonDigit(null);
      setSelectedCell(null);
    }
  };

  const exportBacktestCSV = () => {
    const headers = [
      'Step',
      'Target Date',
      'Source Date',
      'Common Digit',
      'Working Digits',
      'Candidate Count',
      'Top 1',
      'Top 3',
      'Top 5',
      'All Candidates',
      'Actual Results',
      'Is Hit',
      'Hit Type',
      'Winning Market',
      'Winning Number',
      'Winning Rank',
    ];

    const rows = walkForwardReport.steps.map((s) => [
      s.stepIndex,
      s.targetDate,
      s.sourceDate,
      s.commonDigit,
      s.workingDigits.join(' '),
      s.candidateCount,
      s.top1Pair,
      s.top3Pairs.join(' '),
      s.top5Pairs.join(' '),
      s.allCandidatePairs.join(' '),
      s.actualDraws.map((d) => `${d.market}:${d.number}`).join(' '),
      s.isHit ? 'HIT' : 'MISS',
      s.hitType || 'MISS',
      s.winningMarket || '',
      s.winningNumber || '',
      s.winningRank || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Belgium_Square_Matrix_Backtest_${selectedTargetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-slate-950/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="font-mono uppercase tracking-[0.18em] text-amber-300">Live Engine Standardization</div>
            <div className="font-mono text-emerald-300">{standardizedBelgiumResult.engineId}</div>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-4 text-sm text-slate-200">
            <div><span className="text-slate-400">Score:</span> <span className="font-mono text-white">{standardizedBelgiumResult.score.toFixed(1)}</span></div>
            <div><span className="text-slate-400">Confidence:</span> <span className="font-mono text-white">{standardizedBelgiumResult.confidence.toFixed(2)}</span></div>
            <div><span className="text-slate-400">Candidates:</span> <span className="font-mono text-white">{standardizedBelgiumResult.candidates.length}</span></div>
            <div><span className="text-slate-400">Risk:</span> <span className="font-mono text-white">{standardizedBelgiumResult.risk.toFixed(1)}</span></div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Boxes className="w-64 h-64 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                Belgium Square Matrix Method
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-mono px-2 py-0.5 rounded-md border border-indigo-500/30">
                Deterministic Matrix + ML Probability Ranking
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-mono px-2 py-0.5 rounded-md border border-emerald-500/30">
                Zero Lookahead Backtested
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              Belgium Square Matrix Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Detects shared common digits across historical draws, extracts unique participating digits, crosses the vertical/horizontal digit sets into an NxN square matrix, eliminates diagonal duplicate pairings, and ranks candidate predictions with machine learning.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {allCandidates.length > 0 && onSendPairsToSimulator && (
              <button
                type="button"
                onClick={() => onSendPairsToSimulator(allCandidates)}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                Stake in Simulator ({allCandidates.length})
              </button>
            )}
            <button
              type="button"
              onClick={exportBacktestCSV}
              className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-mono text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export Backtest CSV
            </button>
          </div>
        </div>

        {/* CONTROLS BAR: Date Selector, Source Mode, ML Model */}
        <div className="mt-5 pt-4 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Target Date Controller */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-400">Target Prediction Date</div>
                <div className="text-xs font-bold font-mono text-slate-200 truncate">{selectedTargetDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={selectedTargetDate}
                onChange={(e) => {
                  setSelectedTargetDate(e.target.value);
                  setSelectedCommonDigit(null);
                  setSelectedCell(null);
                }}
                className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {sortedDesc.map((r) => (
                  <option key={r.date} value={r.date}>
                    {r.date}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Source Market Mode */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-400">Historical Draw Group</div>
                <div className="text-xs font-bold font-mono text-slate-200 truncate">
                  {sourceMode === 'all_markets'
                    ? 'All 4 Houses (DS, FD, GZ, GAL)'
                    : sourceMode === 'gali_ghaziabad'
                    ? 'Evening Houses (Gali + GZ)'
                    : 'Morning Houses (DS + FD)'}
                </div>
              </div>
            </div>
            <select
              value={sourceMode}
              onChange={(e) => {
                setSourceMode(e.target.value as BelgiumSquareSourceMode);
                setSelectedCommonDigit(null);
                setSelectedCell(null);
              }}
              className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all_markets">All 4 Markets</option>
              <option value="gali_ghaziabad">Gali + Ghaziabad</option>
              <option value="deshawar_faridabad">Deshawar + Faridabad</option>
            </select>
          </div>

          {/* Machine Learning Model Selection */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <BrainCircuit className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-400">ML Ranking Engine</div>
                <div className="text-xs font-bold font-mono text-slate-200 truncate">
                  {activeModel === 'calibrated_ensemble'
                    ? 'Calibrated Multi-Signal Ensemble'
                    : activeModel === 'gradient_boosting'
                    ? 'Gradient Boosted Trees (GBDT)'
                    : activeModel === 'logistic_regression'
                    ? 'Walk-Forward Logistic Classifier'
                    : activeModel === 'random_forest'
                    ? 'Random Forest Ensemble'
                    : 'Adaptive Recency Weights'}
                </div>
              </div>
            </div>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value as BelgiumSquareMLModelType)}
              className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="calibrated_ensemble">Calibrated Ensemble</option>
              <option value="gradient_boosting">Gradient Boosted (GBDT)</option>
              <option value="logistic_regression">Logistic Classifier</option>
              <option value="random_forest">Random Forest</option>
              <option value="adaptive_recency">Adaptive Recency</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUICK KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Backtest Draws</div>
          <div className="text-lg font-black font-mono text-slate-100 mt-0.5">
            {walkForwardReport.totalOpportunities} Draws
          </div>
          <div className="text-[10px] text-slate-500">100% Out-Of-Sample</div>
        </div>

        <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3">
          <div className="text-[10px] font-mono text-emerald-400 uppercase">Total Hit Rate</div>
          <div className="text-lg font-black font-mono text-emerald-300 mt-0.5">
            {walkForwardReport.hitRate}%
          </div>
          <div className="text-[10px] text-emerald-500/80">{walkForwardReport.totalHits} Hits Recorded</div>
        </div>

        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3">
          <div className="text-[10px] font-mono text-amber-400 uppercase">Top 1 Hit Rate</div>
          <div className="text-lg font-black font-mono text-amber-300 mt-0.5">
            {walkForwardReport.top1HitRate}%
          </div>
          <div className="text-[10px] text-slate-500">{walkForwardReport.top1Hits} Exact Direct Hits</div>
        </div>

        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3">
          <div className="text-[10px] font-mono text-cyan-400 uppercase">Top 3 Hit Rate</div>
          <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">
            {walkForwardReport.top3HitRate}%
          </div>
          <div className="text-[10px] text-cyan-500/80">{walkForwardReport.top3Hits} Hits in Top 3</div>
        </div>

        <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-3">
          <div className="text-[10px] font-mono text-indigo-400 uppercase">Top 5 Hit Rate</div>
          <div className="text-lg font-black font-mono text-indigo-300 mt-0.5">
            {walkForwardReport.top5HitRate}%
          </div>
          <div className="text-[10px] text-indigo-500/80">{walkForwardReport.top5Hits} Hits in Top 5</div>
        </div>

        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3">
          <div className="text-[10px] font-mono text-purple-400 uppercase">Avg Candidate Count</div>
          <div className="text-lg font-black font-mono text-purple-300 mt-0.5">
            {walkForwardReport.avgCandidateCount} Pairs
          </div>
          <div className="text-[10px] text-purple-400/80">Avg Winning Rank: #{walkForwardReport.avgHitRank}</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Longest Hit Streak</div>
          <div className="text-lg font-black font-mono text-amber-300 mt-0.5 flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-400" />
            {walkForwardReport.longestHitStreak} Days
          </div>
          <div className="text-[10px] text-slate-500">Max Miss: {walkForwardReport.longestMissStreak}d</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedTab('matrix_predictions')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
            selectedTab === 'matrix_predictions'
              ? 'bg-slate-900 border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          1. Matrix & ML Predictions ({allCandidates.length} Pairs)
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('backtest_ledger')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
            selectedTab === 'backtest_ledger'
              ? 'bg-slate-900 border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          2. Walk-Forward Backtest Ledger ({walkForwardReport.steps.length} Steps)
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('model_arena')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
            selectedTab === 'model_arena'
              ? 'bg-slate-900 border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          3. ML Model Arena & Comparisons
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('pattern_discovery')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
            selectedTab === 'pattern_discovery'
              ? 'bg-slate-900 border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          4. Pattern Discovery & Market Alphas
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('methodology')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
            selectedTab === 'methodology'
              ? 'bg-slate-900 border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          5. Mathematical Formulation & Rules
        </button>
      </div>

      {/* TAB 1: MATRIX & ML PREDICTIONS */}
      {selectedTab === 'matrix_predictions' && (
        <div className="space-y-6">
          {/* STEP 1 & 2: HISTORICAL INPUTS & COMMON DIGIT DETECTION */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400" />
                  Historical Input Draws & Common-Digit Detection (Source Date: {sourceDate})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selected draw group from prior day ({sourceDate}) used strictly without future data leakage.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Detected Common Groups:{' '}
                <span className="font-bold text-amber-400">{commonDigitGroups.length}</span>
              </div>
            </div>

            {/* Display Historical Draws */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {sourceDraws.map((d) => (
                <div
                  key={d.market}
                  className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                    <span>{d.market}</span>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded">Draw</span>
                  </div>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-slate-100">{d.number}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      [Tens: <strong className="text-amber-400">{d.tens}</strong>, Ones:{' '}
                      <strong className="text-cyan-400">{d.ones}</strong>]
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Digits: {d.tens === d.ones ? `{${d.tens}}` : `{${d.tens}, ${d.ones}}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Detected Common Digit Selector Chips */}
            {commonDigitGroups.length > 0 ? (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5">
                <div className="text-xs font-bold font-mono text-amber-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Identified Common Digits (Present in ≥ 2 Houses):
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonDigitGroups.map((grp) => {
                    const isSelected =
                      selectedCommonDigitGroup?.commonDigit === grp.commonDigit;
                    return (
                      <button
                        key={grp.commonDigit}
                        type="button"
                        onClick={() => {
                          setSelectedCommonDigit(grp.commonDigit);
                          setSelectedCell(null);
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/60'
                        }`}
                      >
                        <span className="text-sm px-1.5 py-0.5 rounded bg-black/20">
                          Common Digit: {grp.commonDigit}
                        </span>
                        <span className="text-[10px] opacity-90">
                          ({grp.participatingMarkets.join(' + ')})
                        </span>
                        <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded">
                          {grp.candidatePairs.length} Pairs
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 text-center">
                <div className="text-xs font-bold font-mono text-rose-300">
                  No common digits detected across participating draws on {sourceDate}.
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Try selecting &quot;All 4 Markets&quot; or choosing another target date with overlapping digits.
                </div>
              </div>
            )}
          </div>

          {selectedCommonDigitGroup && (
            <>
              {/* STEP 3, 4, 5: DIGIT EXTRACTION & PROVENANCE BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Common Base Digit */}
                <div className="bg-slate-950 rounded-2xl border border-amber-500/30 p-4">
                  <div className="text-[10px] uppercase font-mono text-amber-400 font-bold">
                    1. Base Common Digit
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-black font-mono text-amber-300">
                      {selectedCommonDigitGroup.commonDigit}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Common Shared Digit
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Shared across {selectedCommonDigitGroup.participatingMarkets.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Extracted Unique Digits */}
                <div className="bg-slate-950 rounded-2xl border border-cyan-500/30 p-4">
                  <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">
                    2. Extracted Unique Digits
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {selectedCommonDigitGroup.uniqueDigits.map((ud) => (
                      <div
                        key={ud}
                        className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg font-black font-mono text-cyan-300"
                      >
                        {ud}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Remaining non-shared digits from participating numbers
                  </div>
                </div>

                {/* 3. Combined Working Digit Set */}
                <div className="bg-slate-950 rounded-2xl border border-emerald-500/30 p-4">
                  <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
                    3. Complete Working Digit Set
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {selectedCommonDigitGroup.workingDigitSet.map((d, idx) => (
                      <span
                        key={idx}
                        className={`w-9 h-9 rounded-lg font-mono font-black flex items-center justify-center text-base border ${
                          idx === 0
                            ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Horizontal & Vertical Set: [{selectedCommonDigitGroup.workingDigitSet.join(', ')}]
                  </div>
                </div>
              </div>

              {/* STEP 6 & 7: THE BELGIUM SQUARE MATRIX GRID (VISUALIZER) */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                      <Grid className="w-4 h-4 text-amber-400" />
                      Belgium Square Matrix ({selectedCommonDigitGroup.matrixSize} ×{' '}
                      {selectedCommonDigitGroup.matrixSize} ={' '}
                      {selectedCommonDigitGroup.totalPositions} Positions)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Crosses Vertical digits against Horizontal digits. Diagonal same-digit combinations (55, 66, 88) are strictly excluded (N/A).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Valid: {selectedCommonDigitGroup.validPositions}
                    </span>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      Diagonal N/A: {selectedCommonDigitGroup.excludedPositions}
                    </span>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 bg-slate-900 border border-slate-800 text-left font-mono text-[10px] text-slate-500 uppercase">
                          Vertical \ Horizontal
                        </th>
                        {selectedCommonDigitGroup.horizontalSet.map((h, cIdx) => (
                          <th
                            key={cIdx}
                            className="p-3 bg-slate-900 border border-slate-800 text-center font-mono"
                          >
                            <div className="text-xs font-black text-cyan-300">
                              Col {cIdx}: {h.digit}
                            </div>
                            <div className="text-[9px] text-slate-500 font-normal">
                              {cIdx === 0 ? 'Common' : 'Unique'}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCommonDigitGroup.matrix.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {/* Row Header */}
                          <td className="p-3 bg-slate-900 border border-slate-800 font-mono">
                            <div className="text-xs font-black text-amber-300">
                              Row {rIdx}: {selectedCommonDigitGroup.verticalSet[rIdx].digit}
                            </div>
                            <div className="text-[9px] text-slate-500 font-normal">
                              {rIdx === 0 ? 'Common' : 'Unique'}
                            </div>
                          </td>

                          {/* Matrix Cells */}
                          {row.map((cell, cIdx) => {
                            const isSelected =
                              selectedCell?.rowIndex === rIdx && selectedCell?.colIndex === cIdx;
                            const isWinning = cell.isWinningHit;

                            if (cell.isDiagonal) {
                              return (
                                <td
                                  key={cIdx}
                                  className="p-4 bg-slate-900/40 border border-slate-800/80 text-center font-mono opacity-50"
                                >
                                  <span className="text-xs font-bold text-slate-600">N/A</span>
                                  <div className="text-[9px] text-slate-600">
                                    Same-Digit ({cell.candidatePair})
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={cIdx}
                                onClick={() => setSelectedCell(cell)}
                                className={`p-3 border text-center font-mono transition cursor-pointer relative ${
                                  isWinning
                                    ? 'bg-emerald-950/60 border-emerald-500 shadow-lg'
                                    : isSelected
                                    ? 'bg-amber-950/50 border-amber-400'
                                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 hover:bg-slate-850'
                                }`}
                              >
                                {isWinning && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[9px] px-1 rounded-full shadow">
                                    WIN
                                  </span>
                                )}
                                <div className="text-xl font-black text-slate-100">
                                  {cell.candidatePair}
                                </div>
                                <div className="mt-1 flex items-center justify-center gap-1.5">
                                  {cell.mlRank && (
                                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                                      #{cell.mlRank}
                                    </span>
                                  )}
                                  {cell.mlScore && (
                                    <span className="text-[9px] text-slate-400">
                                      {cell.mlScore}% ML
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-500 mt-1">
                                  Rev: {cell.reverseCandidate}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Inspect Selected Cell */}
                {selectedCell && (
                  <div className="mt-4 p-3.5 bg-slate-900 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold font-mono text-amber-300 flex items-center gap-2">
                        <span>Selected Cell: {selectedCell.candidatePair}</span>
                        <span className="text-[10px] text-slate-400">
                          Coordinate: {selectedCell.cellCoordinate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        Row Digit ({selectedCell.rowDigit}) from{' '}
                        <strong>{selectedCell.rowProvenance.digitRole}</strong> × Col Digit (
                        {selectedCell.colDigit}) from{' '}
                        <strong>{selectedCell.colProvenance.digitRole}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedCell.candidatePair, 'cell-pair')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 cursor-pointer"
                      >
                        {copiedKey === 'cell-pair' ? 'Copied!' : 'Copy Pair'}
                      </button>
                      {onSendPairsToSimulator && (
                        <button
                          type="button"
                          onClick={() => onSendPairsToSimulator([selectedCell.candidatePair])}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono rounded-lg cursor-pointer"
                        >
                          Simulate Pair
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 18 to 23: MACHINE LEARNING RANKED PREDICTION CARDS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      ML Ranked Candidate Predictions ({rankedCandidates.length} Candidates)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Probabilistically ranked via {activeModel} with anti-leakage recency, velocity, position authority, and reverse parity features.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          rankedCandidates.map((c) => c.pair).join(', '),
                          'all-candidates'
                        )
                      }
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKey === 'all-candidates' ? 'Copied!' : 'Copy All Pairs'}
                    </button>
                  </div>
                </div>

                {/* Top 1, Top 3, Top 5 Highlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Top 1 Strongest Prediction */}
                  {top1Prediction && (
                    <div className="bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/40 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] font-mono px-2 py-0.5 rounded-full">
                          TOP 1 SELECTION
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {top1Prediction.mlScore}% ML Score
                        </span>
                      </div>
                      <div className="my-3 flex items-baseline gap-3">
                        <span className="text-4xl font-black font-mono text-slate-100 tracking-wider">
                          {top1Prediction.pair}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          (Rev: {top1Prediction.reversePair})
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Recent Velocity:</span>
                          <strong className="text-slate-200">
                            {top1Prediction.recentHitRate}%
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Common Authority:</span>
                          <strong className="text-amber-300">
                            {Math.round(
                              top1Prediction.featureBreakdown.commonDigitAuthority * 50
                            )}
                            %
                          </strong>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(top1Prediction.pair, 'top1')}
                          className="w-full text-center text-xs text-amber-400 hover:text-amber-300 font-mono font-semibold cursor-pointer"
                        >
                          {copiedKey === 'top1' ? 'Copied Top 1!' : 'Copy Top 1'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Top 3 High Conviction Set */}
                  <div className="bg-gradient-to-b from-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-cyan-500/20 text-cyan-300 font-bold text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                        TOP 3 HIGH CONVICTION
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {walkForwardReport.top3HitRate}% Backtested Hit
                      </span>
                    </div>
                    <div className="my-3 flex items-center gap-2">
                      {top3Predictions.map((p, idx) => (
                        <div
                          key={p.pair}
                          className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-xl p-2 text-center"
                        >
                          <div className="text-[9px] text-cyan-400 font-mono">#{idx + 1}</div>
                          <div className="text-xl font-black font-mono text-slate-100">{p.pair}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{p.mlScore}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            top3Predictions.map((p) => p.pair).join(', '),
                            'top3'
                          )
                        }
                        className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold cursor-pointer"
                      >
                        {copiedKey === 'top3' ? 'Copied Top 3!' : 'Copy Top 3 Set'}
                      </button>
                    </div>
                  </div>

                  {/* Top 5 Expanded Portfolio */}
                  <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-500/20 text-indigo-300 font-bold text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                        TOP 5 EXPANDED SET
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {walkForwardReport.top5HitRate}% Backtested Hit
                      </span>
                    </div>
                    <div className="my-3 flex items-center gap-1.5 flex-wrap">
                      {top5Predictions.map((p, idx) => (
                        <div
                          key={p.pair}
                          className="bg-slate-900 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-center font-mono"
                        >
                          <span className="text-[9px] text-indigo-400 mr-1">#{idx + 1}</span>
                          <strong className="text-sm font-black text-slate-100">{p.pair}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            top5Predictions.map((p) => p.pair).join(', '),
                            'top5'
                          )
                        }
                        className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-mono font-semibold cursor-pointer"
                      >
                        {copiedKey === 'top5' ? 'Copied Top 5!' : 'Copy Top 5 Set'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ranked Predictions Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                          <th className="p-3 text-center">Rank</th>
                          <th className="p-3">Candidate</th>
                          <th className="p-3">Reverse</th>
                          <th className="p-3">ML Score</th>
                          <th className="p-3">Confidence</th>
                          <th className="p-3">Coordinate</th>
                          <th className="p-3">Recency 7d</th>
                          <th className="p-3">Common Authority</th>
                          <th className="p-3">Position Efficacy</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {rankedCandidates.map((c) => {
                          const isWin =
                            evaluatedHits?.exactHits.includes(c.pair) ||
                            evaluatedHits?.reverseHits.includes(c.pair);
                          return (
                            <tr
                              key={c.pair}
                              className={`hover:bg-slate-900 transition ${
                                isWin ? 'bg-emerald-950/30' : ''
                              }`}
                            >
                              <td className="p-3 text-center font-bold text-amber-400">
                                #{c.rank}
                              </td>
                              <td className="p-3">
                                <span className="text-base font-black text-slate-100">
                                  {c.pair}
                                </span>
                                {isWin && (
                                  <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    HIT
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-400">{c.reversePair}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-amber-500 h-full rounded-full"
                                      style={{ width: `${Math.min(100, c.mlScore)}%` }}
                                    />
                                  </div>
                                  <span className="text-slate-200 font-bold">{c.mlScore}%</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                    c.confidenceTier === 'High'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : c.confidenceTier === 'Medium'
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {c.confidenceTier}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">{c.matrixPosition.coordinate}</td>
                              <td className="p-3 text-slate-300">
                                {Math.round(c.featureBreakdown.recency7d * 100) / 100}x
                              </td>
                              <td className="p-3 text-amber-300 font-semibold">
                                {Math.round(c.featureBreakdown.commonDigitAuthority * 100) / 100}x
                              </td>
                              <td className="p-3 text-slate-400">
                                {Math.round(c.featureBreakdown.positionEfficacy * 100) / 100}x
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(c.pair, `row-${c.pair}`)}
                                  className="text-[11px] text-amber-400 hover:text-amber-300 mr-2 cursor-pointer"
                                >
                                  {copiedKey === `row-${c.pair}` ? 'Copied' : 'Copy'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: WALK-FORWARD BACKTEST LEDGER */}
      {selectedTab === 'backtest_ledger' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Chronological Walk-Forward Backtest Ledger (Zero Lookahead Bias)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every step strictly takes prior historical records, extracts the Belgium Square Matrix, applies machine learning ranking, and evaluates against actual next-day outcomes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportBacktestCSV}
                  className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-mono rounded-xl border border-emerald-500/30 cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Market-Wise Backtest Performance Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {Object.entries(walkForwardReport.marketBreakdown).map(([mkt, rawData]) => {
                const data = rawData as { hits: number; opportunities: number; hitRate: number };
                return (
                  <div key={mkt} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-mono text-slate-400">{mkt} Market</div>
                    <div className="text-lg font-black font-mono text-slate-100 mt-0.5">
                      {data.hitRate}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {data.hits} Hits / {data.opportunities} Opportunities
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Target Date</th>
                    <th className="p-3">Common Digit</th>
                    <th className="p-3">Top 1</th>
                    <th className="p-3">Top 3 Candidates</th>
                    <th className="p-3">All Candidates</th>
                    <th className="p-3">Actual Draw Outcomes</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Hit Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {walkForwardReport.steps.map((step) => {
                    return (
                      <tr
                        key={step.targetDate}
                        className={`hover:bg-slate-900 transition ${
                          step.isHit ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-slate-200">{step.targetDate}</td>
                        <td className="p-3">
                          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                            Digit: {step.commonDigit}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-amber-400">{step.top1Pair}</td>
                        <td className="p-3 text-slate-300">{step.top3Pairs.join(', ')}</td>
                        <td className="p-3 text-slate-400 truncate max-w-xs">
                          {step.allCandidatePairs.join(', ')}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {step.actualDraws.map((ad) => (
                              <span
                                key={ad.market}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  step.winningNumber === ad.number
                                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {ad.market.slice(0, 2)}:{ad.number}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {step.isHit ? (
                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30 text-[10px]">
                              HIT ({step.hitType})
                            </span>
                          ) : (
                            <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[10px]">
                              MISS
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {step.winningRank ? (
                            <span className="text-amber-400">#{step.winningRank}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODEL ARENA */}
      {selectedTab === 'model_arena' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5">
            <div className="pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Machine Learning Model Comparison Arena (Out-Of-Sample Validation)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates which machine learning model provides superior rank calibration, precision, and top-tier hit rates on out-of-sample data.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Model Architecture</th>
                    <th className="p-3 text-center">Top 1 Rate</th>
                    <th className="p-3 text-center">Top 3 Rate</th>
                    <th className="p-3 text-center">Top 5 Rate</th>
                    <th className="p-3 text-center">Top 10 Rate</th>
                    <th className="p-3 text-center">Precision</th>
                    <th className="p-3 text-center">F1 Score</th>
                    <th className="p-3 text-center">ROC-AUC</th>
                    <th className="p-3 text-right">Avg Win Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {walkForwardReport.modelComparisons.map((m) => (
                    <tr
                      key={m.modelType}
                      className={`hover:bg-slate-900 transition ${
                        m.isBest ? 'bg-amber-950/20 font-bold' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200">{m.modelName}</span>
                          {m.isBest && (
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                              CHAMPION
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center text-amber-400 font-bold">{m.top1HitRate}%</td>
                      <td className="p-3 text-center text-cyan-300">{m.top3HitRate}%</td>
                      <td className="p-3 text-center text-indigo-300">{m.top5HitRate}%</td>
                      <td className="p-3 text-center text-slate-300">{m.top10HitRate}%</td>
                      <td className="p-3 text-center text-slate-400">{m.precision}</td>
                      <td className="p-3 text-center text-emerald-400">{m.f1Score}</td>
                      <td className="p-3 text-center text-slate-400">{m.rocAuc}</td>
                      <td className="p-3 text-right text-slate-200">#{m.avgHitRank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATTERN DISCOVERY */}
      {selectedTab === 'pattern_discovery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common-Digit Alphas */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
              <h4 className="text-xs font-bold font-mono text-amber-400 uppercase mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Best Performing Common Digits (Historical Lift)
              </h4>
              <div className="space-y-2">
                {walkForwardReport.patternDiscovery.bestCommonDigits.map((cd) => (
                  <div
                    key={cd.digit}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 font-black flex items-center justify-center">
                        {cd.digit}
                      </span>
                      <span className="text-slate-300 font-bold">{cd.hitRate}% Hit Rate</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {cd.hits} Hits / {cd.opportunities} Draws (Lift: {cd.liftRatio}x)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directional Asymmetry Analysis */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
              <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase mb-2 flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Direct vs Reverse Pair Directional Asymmetry
              </h4>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Direct Pairs (VH):</span>
                  <strong className="text-slate-100">
                    {walkForwardReport.patternDiscovery.directionalBias.directWinRate}% (
                    {walkForwardReport.patternDiscovery.directionalBias.directHits} Hits)
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reverse Pairs (HV):</span>
                  <strong className="text-slate-100">
                    {walkForwardReport.patternDiscovery.directionalBias.reverseWinRate}% (
                    {walkForwardReport.patternDiscovery.directionalBias.reverseHits} Hits)
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Statistical Bias:</span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-500/30 text-[10px]">
                    {walkForwardReport.patternDiscovery.directionalBias.preferredDirection}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: METHODOLOGY */}
      {selectedTab === 'methodology' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold font-mono text-amber-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Mathematical & Algorithmic Blueprint: Belgium Square Matrix Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-400 uppercase text-[11px]">
                  1. Common-Digit Detection & Unique Extraction
                </h4>
                <p>
                  From historical draws across configurable markets (DS, FD, GZ, GAL), all participating 2-digit numbers are decomposed into tens and ones digits.
                </p>
                <p>
                  Any digit shared across ≥ 2 distinct houses is identified as the <strong>Base Common Digit</strong> ($C$). The non-matching digits from the participating draws are extracted as <strong>Unique Digits</strong> ($U_1, U_2, \dots$).
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-cyan-400 uppercase text-[11px]">
                  2. Matrix Generation & Diagonal Exclusion Rule
                </h4>
                <p>
                  The working digit set $[C, U_1, U_2, \dots]$ forms both the Horizontal and Vertical axes. Every vertical digit $v$ is concatenated with horizontal digit $h$ ($vh$).
                </p>
                <p>
                  <strong>Diagonal Rule:</strong> Any same-digit pairing where $v == h$ (e.g. 55, 66, 88) is strictly removed as N/A. An $N \times N$ matrix produces exactly $N(N-1)$ valid pairs.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase text-[11px]">
                  3. Zero-Lookahead ML Probability Calibration
                </h4>
                <p>
                  Candidates are scored using anti-leakage historical feature vectors: 7-day/15-day/30-day velocity, historical authority of the common digit, market-specific hit rate, and position coordinates.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-purple-400 uppercase text-[11px]">
                  4. Reverse-Candidate Directional Parity
                </h4>
                <p>
                  For every generated candidate $vh$, its reverse pair $hv$ is registered and backtested to determine whether direct or reverse pairings possess statistically significant directional alpha.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
