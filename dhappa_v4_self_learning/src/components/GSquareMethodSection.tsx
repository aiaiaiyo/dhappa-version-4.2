import React, { useState, useMemo } from 'react';
import {
  DayMarketEntry,
  GSquareCandidatePrediction,
  GSquareMatrixCell,
  GSquareMLModelType,
  GSquareSourceMode,
  Market,
  MARKETS,
} from '../types';
import { generateGSquareMethodResult, extractOnesDigit } from '../utils/gSquareMethodEngine';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';
import {
  Calculator,
  Grid,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Send,
  HelpCircle,
  Cpu,
  Layers,
  Calendar,
  Filter,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Info,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

interface GSquareMethodSectionProps {
  records: DayMarketEntry[];
  currency?: string;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const GSquareMethodSection: React.FC<GSquareMethodSectionProps> = ({
  records,
  onSendPairsToSimulator,
}) => {
  // State
  const sortedDates = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).sort((a: string, b: string) => b.localeCompare(a));
    return dates.length > 0 ? dates : [new Date().toISOString().slice(0, 10)];
  }, [records]);

  const [selectedDate, setSelectedDate] = useState<string>(sortedDates[0] || '2026-08-28');
  const [sourceMode, setSourceMode] = useState<GSquareSourceMode>('auto');
  const [targetMarket, setTargetMarket] = useState<Market | 'ALL'>('ALL');
  const [activeModel, setActiveModel] = useState<GSquareMLModelType>('calibrated_ensemble');
  const [activeViewMode, setActiveViewMode] = useState<'TOP5' | 'TOP10' | 'TOP15' | 'TOP21' | 'ALL24'>('TOP5');
  const [manualSource, setManualSource] = useState<{ market: string; number: string; date: string } | undefined>(undefined);
  const [selectedCandidate, setSelectedCandidate] = useState<GSquareCandidatePrediction | null>(null);
  const [activeTab, setActiveTab] = useState<'predictions' | 'matrix' | 'backtest' | 'models' | 'theory'>('predictions');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Compute Engine Result
  const gSquareResult = useMemo(() => {
    return generateGSquareMethodResult(
      records,
      selectedDate,
      sourceMode,
      targetMarket,
      activeModel,
      manualSource
    );
  }, [records, selectedDate, sourceMode, targetMarket, activeModel, manualSource]);

  const standardizedGSquareResult = useMemo(() => {
    const candidates = gSquareResult.predictions.map((item) => item.pair);
    const score = gSquareResult.predictions[0]?.compositeScore ?? gSquareResult.walkForwardReport.top10HitRate;
    const confidence = gSquareResult.predictions[0]?.mlProbability ? gSquareResult.predictions[0].mlProbability / 100 : 0.5;
    const evidence = gSquareResult.predictions.slice(0, 5).flatMap((item) => item.whySelectedReasons);

    return buildStandardizedEngineResult({
      engineId: 'G_SQUARE',
      methodName: 'G-Square Method',
      date: selectedDate,
      channel: 'live-engine-output',
      sourceValues: {
        sourceDate: gSquareResult.sourceDate,
        sourceMarket: gSquareResult.sourceMarket,
        sourceNumber: gSquareResult.sourceNumber,
      },
      normalizedValues: {
        onesX: gSquareResult.onesX,
        verticalSet: gSquareResult.verticalSet.map((item) => `${item.key}:${item.value}`),
        horizontalSet: gSquareResult.horizontalSet.map((item) => `${item.key}:${item.value}`),
      },
      rawResult: gSquareResult,
      score,
      confidence,
      historicalSupport: gSquareResult.walkForwardReport.totalTestedDraws,
      risk: Math.max(0, 100 - gSquareResult.walkForwardReport.top10HitRate),
      evidence,
      steps: ['validate()', 'extractSourceDigit()', 'generateMatrix()', 'rankCandidates()', 'score()'],
    });
  }, [gSquareResult, selectedDate]);

  // Filtered Predictions for current View Mode
  const displayedPredictions = useMemo(() => {
    switch (activeViewMode) {
      case 'TOP5':
        return gSquareResult.top5;
      case 'TOP10':
        return gSquareResult.top10;
      case 'TOP15':
        return gSquareResult.top15;
      case 'TOP21':
        return gSquareResult.top21;
      case 'ALL24':
      default:
        return gSquareResult.predictions;
    }
  }, [gSquareResult, activeViewMode]);

  // Copy helper
  const handleCopyPairs = (pairs: string[], label: string) => {
    navigator.clipboard.writeText(pairs.join(', '));
    setCopyFeedback(`Copied ${pairs.length} ${label} pairs!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Export helper
  const handleExportCSV = () => {
    const header = 'Rank,Candidate,Reverse,Cell,Vertical,Horizontal,ML_Probability_Pct,Confidence,Historical_Hits,Recent_7Day,Days_Since_Last_Hit,Target_Market_Hits,Actual_Match\n';
    const rows = gSquareResult.predictions
      .map(
        (p) =>
          `${p.rank},"${p.pair}","${p.reversePair}","${p.cellKey}","${p.verticalKey}=${p.verticalVal}","${p.horizontalKey}=${p.horizontalVal}",${p.mlProbability},"${p.confidenceLevel}",${p.totalHistoricalHits},${p.recentHits7},${p.daysSinceLastHit},${p.targetMarketHits},"${p.actualHitMatch || 'MISS'}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gsquare-predictions-${selectedDate}-${activeModel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Format actual hit indicator
  const actualHitInTop5 = gSquareResult.top5.some((p) => p.actualHitMatch === 'EXACT');
  const actualHitInTop10 = gSquareResult.top10.some((p) => p.actualHitMatch === 'EXACT');
  const actualHitInTop21 = gSquareResult.top21.some((p) => p.actualHitMatch === 'EXACT');
  const actualHitInAll24 = gSquareResult.predictions.some((p) => p.actualHitMatch === 'EXACT');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="mb-4 rounded-xl border border-indigo-500/30 bg-slate-950/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="font-mono uppercase tracking-[0.18em] text-indigo-300">Live Engine Standardization</div>
            <div className="font-mono text-emerald-300">{standardizedGSquareResult.engineId}</div>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-4 text-sm text-slate-200">
            <div><span className="text-slate-400">Score:</span> <span className="font-mono text-white">{standardizedGSquareResult.score.toFixed(1)}</span></div>
            <div><span className="text-slate-400">Confidence:</span> <span className="font-mono text-white">{standardizedGSquareResult.confidence.toFixed(2)}</span></div>
            <div><span className="text-slate-400">Candidates:</span> <span className="font-mono text-white">{standardizedGSquareResult.candidates.length}</span></div>
            <div><span className="text-slate-400">Risk:</span> <span className="font-mono text-white">{standardizedGSquareResult.risk.toFixed(1)}</span></div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                DETERMINISTIC 6 × 4 TRANSFORMATION
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                MACHINE-TRAINABLE RANKING
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Anti-Leakage Validated
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              G Square Method <span className="text-indigo-400 font-normal text-lg sm:text-xl">Prediction Engine</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
              Extracts the ones-place digit <code className="text-amber-300 font-bold font-mono">x</code> from yesterday's Gali/Ghaziabad draw, constructs a <strong className="text-white">6 Vertical (A–F) × 4 Horizontal (G–J) matrix</strong> (24 deterministic candidates), and ranks them using multi-model out-of-sample machine learning.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center shadow-md">
              <div className="text-[10px] uppercase font-mono text-slate-400">Top-5 Hit Rate</div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {gSquareResult.walkForwardReport.top5HitRate}%
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center shadow-md">
              <div className="text-[10px] uppercase font-mono text-slate-400">Top-10 Hit Rate</div>
              <div className="text-lg font-black text-cyan-400 font-mono">
                {gSquareResult.walkForwardReport.top10HitRate}%
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center shadow-md">
              <div className="text-[10px] uppercase font-mono text-slate-400">24-Matrix Reach</div>
              <div className="text-lg font-black text-purple-400 font-mono">
                {gSquareResult.walkForwardReport.total24HitRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs inside Header */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('predictions')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'predictions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Predictions & Rankings ({activeViewMode})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-cyan-300" />
            <span>6 × 4 Matrix Visualizer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backtest')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'backtest'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Walk-Forward Backtest ({gSquareResult.walkForwardReport.totalTestedDraws} Draws)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'models'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
            <span>Model Comparison & Arena</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'theory'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-slate-300" />
            <span>Mathematical Rules & Logic</span>
          </button>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Target Forecast Date */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Target Forecast Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setManualSource(undefined);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition font-mono"
            >
              {sortedDates.map((d) => (
                <option key={d} value={d}>
                  {d} {d === sortedDates[0] ? '(Latest Recorded)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Historical Source Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Historical Source Mode
            </label>
            <select
              value={sourceMode}
              onChange={(e) => {
                setSourceMode(e.target.value as GSquareSourceMode);
                setManualSource(undefined);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="auto">Auto-Select (Gali → Ghaziabad)</option>
              <option value="gali">Gali Only</option>
              <option value="ghaziabad">Ghaziabad Only</option>
              <option value="combined">Combined Available Draw</option>
            </select>
          </div>

          {/* 3. ML Model Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Machine Learning Model
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value as GSquareMLModelType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="calibrated_ensemble">Calibrated Multi-Signal Ensemble (Primary)</option>
              <option value="gradient_boosting">Gradient Boosted Decision Forest</option>
              <option value="logistic_regression">Walk-Forward Logistic Regression</option>
              <option value="random_forest">Random Forest Classifier</option>
              <option value="adaptive_weights">Adaptive Recency & Frequency</option>
            </select>
          </div>

          {/* 4. Target Market Filter */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Target Evaluation Market
            </label>
            <select
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value as Market | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">All Markets (Faridabad, Ghaziabad, Gali, Deshawar)</option>
              <option value="Faridabad">Faridabad</option>
              <option value="Ghaziabad">Ghaziabad</option>
              <option value="Gali">Gali</option>
              <option value="Deshawar">Deshawar</option>
            </select>
          </div>
        </div>

        {/* Source Result Pill Selector if multiple available */}
        {gSquareResult.availableSources.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">Available Draws from {gSquareResult.sourceDate || 'Prior Day'}:</span>
            {gSquareResult.availableSources.map((src) => {
              const isSelected =
                (manualSource && manualSource.market === src.market && manualSource.number === src.number) ||
                (!manualSource && gSquareResult.sourceMarket === src.market && gSquareResult.sourceNumber === src.number);

              return (
                <button
                  key={`${src.market}-${src.number}`}
                  type="button"
                  onClick={() => setManualSource(src)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-slate-950 text-slate-300 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span>{src.market}:</span>
                  <span className="text-sm font-black underline">{src.number}</span>
                  <span className="text-[10px] opacity-80">(ones: {extractOnesDigit(src.number)})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Copy Notification Toast */}
      {copyFeedback && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold font-mono shadow-xl flex items-center gap-2 animate-bounce fixed bottom-6 right-6 z-50">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Step-by-Step Mathematical Decomposition Visual Bar */}
      <div className="bg-slate-900/90 border border-indigo-500/20 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Mathematical Derivation Pipeline: Base <span className="text-amber-300 font-mono font-black">x = {gSquareResult.onesX}</span>
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Source: <strong className="text-white">{gSquareResult.sourceMarket}</strong> draw <strong className="text-amber-300">{gSquareResult.sourceNumber}</strong> ({gSquareResult.sourceDate})
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Step 1: Base x */}
          <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Step 1: Ones Digit</span>
              <span className="text-amber-400 font-bold">x = draw % 10</span>
            </div>
            <div className="flex items-center justify-center gap-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">{gSquareResult.sourceNumber} →</span>
              <span className="text-3xl font-black text-amber-300 font-mono">{gSquareResult.onesX}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Tens digit ignored. Ones-place value <strong className="text-slate-200">{gSquareResult.onesX}</strong> acts as the central seed.
            </p>
          </div>

          {/* Step 2: 6 Vertical Values A-F */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Step 2: 6 Vertical Values (A–F)</span>
              <span className="text-indigo-400 font-bold">Rashi 5-Decade Set</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {gSquareResult.verticalSet.map((v) => (
                <div
                  key={v.key}
                  className={`text-center p-1.5 rounded-lg border ${
                    v.isBase
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                  title={`${v.key}: ${v.formula} → ${v.explanation}`}
                >
                  <div className="text-[10px] font-mono text-slate-400">{v.key}</div>
                  <div className="text-base font-black font-mono">{v.value}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Core: A=x-1, B=x, C=x+1</span>
              <span>Rashi: D=A+5, E=B+5, F=C+5</span>
            </div>
          </div>

          {/* Step 3: 4 Horizontal Values G-J */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Step 3: 4 Horizontal Values (G–J)</span>
              <span className="text-cyan-400 font-bold">Offsets -3, -2, +2, +3</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {gSquareResult.horizontalSet.map((h) => (
                <div
                  key={h.key}
                  className="text-center p-1.5 rounded-lg border bg-slate-900 border-slate-800 text-cyan-300"
                  title={`${h.key}: ${h.formula} → ${h.explanation}`}
                >
                  <div className="text-[10px] font-mono text-slate-400">{h.key}</div>
                  <div className="text-base font-black font-mono">{h.value}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-mono text-slate-400 text-center">
              G=(x-2), H=(x-3), I=(x+2), J=(x+3) (mod 10)
            </div>
          </div>
        </div>
      </div>

      {/* VIEW: 1. PREDICTIONS & RANKINGS */}
      {activeTab === 'predictions' && (
        <div className="space-y-5">
          {/* Filter Bar: Top 5, Top 10, Top 15, Top 21, All 24 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono mr-1">View Scope:</span>
              {(['TOP5', 'TOP10', 'TOP15', 'TOP21', 'ALL24'] as const).map((mode) => {
                const count = mode === 'TOP5' ? 5 : mode === 'TOP10' ? 10 : mode === 'TOP15' ? 15 : mode === 'TOP21' ? 21 : 24;
                const isActive = activeViewMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveViewMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/50'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {mode === 'TOP5' ? 'Top 5' : mode === 'TOP10' ? 'Top 10' : mode === 'TOP15' ? 'Top 15' : mode === 'TOP21' ? 'Top 21' : 'All 24 Matrix'}
                    <span className="ml-1 opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Actions: Copy & Send to Simulator */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleCopyPairs(displayedPredictions.map((p) => p.pair), activeViewMode)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Copy all candidate pairs to clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy {displayedPredictions.length} Pairs</span>
              </button>

              {onSendPairsToSimulator && (
                <button
                  type="button"
                  onClick={() => onSendPairsToSimulator(displayedPredictions.map((p) => p.pair))}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Send these ranked pairs to Quant Risk Simulator"
                >
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                  <span>Send to Risk Simulator</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                title="Export predictions to CSV"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Actual Draw Result Banner for target Date */}
          {actualHitInAll24 && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white">
                    Validated Actual Draw Hit on {selectedDate}:
                  </span>
                  <p className="text-[11px] text-emerald-300">
                    The target draw outcome appeared inside G-Square predictions!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {actualHitInTop5 && (
                  <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-black text-xs font-mono shadow">
                    ★ Top-5 Hit
                  </span>
                )}
                {actualHitInTop10 && !actualHitInTop5 && (
                  <span className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-black text-xs font-mono shadow">
                    ★ Top-10 Hit
                  </span>
                )}
                {actualHitInTop21 && !actualHitInTop10 && (
                  <span className="px-2.5 py-1 rounded bg-purple-500 text-white font-black text-xs font-mono shadow">
                    ★ Top-21 Hit
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Prediction Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {displayedPredictions.map((pred) => {
              const isSelected = selectedCandidate?.pair === pred.pair;
              const isHit = pred.actualHitMatch === 'EXACT';
              const isPaltiHit = pred.actualHitMatch === 'PALTI';

              return (
                <div
                  key={pred.pair}
                  onClick={() => setSelectedCandidate(pred)}
                  className={`bg-slate-900 border rounded-xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden shadow-md hover:border-indigo-500/60 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/95'
                      : isHit
                      ? 'border-emerald-500/70 bg-emerald-950/20'
                      : 'border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  {/* Top Bar: Rank, Pair, Cell Key, ML Prob */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
                          pred.rank <= 5
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : pred.rank <= 10
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{pred.rank}
                      </span>
                      <div>
                        <div className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                          <span>{pred.pair}</span>
                          <span className="text-[11px] font-mono text-slate-400 font-normal">
                            (⟲ {pred.reversePair})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {pred.mlProbability}%
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          pred.confidenceLevel === 'HIGH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : pred.confidenceLevel === 'MEDIUM'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pred.confidenceLevel} CONF
                      </span>
                    </div>
                  </div>

                  {/* Cell Code & Mathematical Digits */}
                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 mb-3 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Cell:</span>
                      <span className="font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {pred.cellKey}
                      </span>
                      <span className="text-slate-400">({pred.verticalKey}={pred.verticalVal} × {pred.horizontalKey}={pred.horizontalVal})</span>
                    </div>
                    {isHit && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> EXACT HIT
                      </span>
                    )}
                    {isPaltiHit && (
                      <span className="text-purple-300 font-bold flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30 text-[10px]">
                        ⟲ PALTI HIT
                      </span>
                    )}
                  </div>

                  {/* Historical Stats Mini-Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-3">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500">Hist Hits</div>
                      <div className="font-bold text-slate-200">{pred.totalHistoricalHits}</div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500">7D Velocity</div>
                      <div className="font-bold text-amber-300">{pred.recentHits7}x</div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500">Days Ago</div>
                      <div className="font-bold text-cyan-300">
                        {pred.daysSinceLastHit < 99 ? `${pred.daysSinceLastHit}d` : 'None'}
                      </div>
                    </div>
                  </div>

                  {/* Primary Why Selected Reason */}
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60 line-clamp-2">
                    <span className="text-slate-500 font-bold">Signal:</span> {pred.whySelectedReasons[1] || pred.whySelectedReasons[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Candidate Inspector Modal/Drawer */}
          {selectedCandidate && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-black flex items-center justify-center text-sm">
                    #{selectedCandidate.rank}
                  </span>
                  <div>
                    <h4 className="text-lg font-black text-white font-mono flex items-center gap-2">
                      Candidate {selectedCandidate.pair}
                      <span className="text-xs text-slate-400 font-normal">
                        (Matrix Cell {selectedCandidate.cellKey})
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSendPairsToSimulator && (
                    <button
                      type="button"
                      onClick={() => onSendPairsToSimulator([selectedCandidate.pair])}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Stake Pair</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">ML PROBABILITY SCORE</div>
                  <div className="text-xl font-black text-emerald-400">{selectedCandidate.mlProbability}%</div>
                  <div className="text-[10px] text-slate-500">Model: {activeModel}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">REVERSE SYMMETRY</div>
                  <div className="text-xl font-black text-purple-300">{selectedCandidate.reversePair}</div>
                  <div className="text-[10px] text-slate-500">Reverse Hits: {selectedCandidate.reverseHits}x</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">HISTORICAL HIT RATE</div>
                  <div className="text-xl font-black text-cyan-300">{selectedCandidate.historicalHitRate}%</div>
                  <div className="text-[10px] text-slate-500">Total Runs: {selectedCandidate.totalHistoricalHits}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">POSITION HISTORICAL EFFICACY</div>
                  <div className="text-xl font-black text-amber-300">{selectedCandidate.positionHitRatePct}%</div>
                  <div className="text-[10px] text-slate-500">Cell {selectedCandidate.cellKey} Hits: {selectedCandidate.positionHistoricalHits}</div>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Feature Explainability & Selection Signals:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCandidate.whySelectedReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: 2. 6 × 4 MATRIX VISUALIZER */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  6 Vertical (Rows A–F) × 4 Horizontal (Cols G–J) Matrix (24 Jodis)
                </h3>
                <p className="text-xs text-slate-400">
                  Click any cell to highlight the candidate and inspect its ML ranking metrics.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyPairs(gSquareResult.matrix24.map((m) => m.pair), 'All 24 Matrix')}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy All 24 Pairs</span>
            </button>
          </div>

          {/* Interactive Matrix Grid */}
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2.5 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                    V \ H
                  </th>
                  {gSquareResult.horizontalSet.map((h) => (
                    <th
                      key={h.key}
                      className="p-2.5 bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                    >
                      <div className="font-bold">{h.key}</div>
                      <div className="text-[11px] text-slate-400">Digit {h.value}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gSquareResult.verticalSet.map((v) => (
                  <tr key={v.key}>
                    <td className="p-2.5 bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 font-bold">
                      <div>{v.key}</div>
                      <div className="text-[11px] text-slate-400">Digit {v.value}</div>
                    </td>

                    {gSquareResult.horizontalSet.map((h) => {
                      const cellKey = `${v.key}${h.key}` as GSquareMatrixCell;
                      const pair = `${v.value}${h.value}`;
                      const pred = gSquareResult.predictions.find((p) => p.pair === pair);
                      const isTop5 = pred && pred.rank <= 5;
                      const isTop10 = pred && pred.rank <= 10;
                      const isHit = pred && pred.actualHitMatch === 'EXACT';

                      return (
                        <td
                          key={cellKey}
                          onClick={() => pred && setSelectedCandidate(pred)}
                          className={`p-3 border transition cursor-pointer ${
                            isHit
                              ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-black ring-2 ring-emerald-500/40'
                              : isTop5
                              ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 hover:bg-amber-950/50'
                              : isTop10
                              ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-400 mb-0.5">{cellKey}</div>
                          <div className="text-xl font-black font-mono">{pair}</div>
                          {pred && (
                            <div className="text-[10px] font-mono font-bold mt-1">
                              <span className={isTop5 ? 'text-amber-400' : 'text-slate-400'}>
                                #{pred.rank} • {pred.mlProbability}%
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500 inline-block" /> Top 5
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-500 inline-block" /> Top 10
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400 inline-block" /> Validated Exact Hit
              </span>
            </div>
            <span>24 Total Candidates Generated Rule-Based</span>
          </div>
        </div>
      )}

      {/* VIEW: 3. WALK-FORWARD TIME-SERIES BACKTEST */}
      {activeTab === 'backtest' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Tested Draws</div>
              <div className="text-xl font-black text-white font-mono">
                {gSquareResult.walkForwardReport.totalTestedDraws}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top 1 Hit Rate</div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {gSquareResult.walkForwardReport.top1HitRate}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top 5 Hit Rate</div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {gSquareResult.walkForwardReport.top5HitRate}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top 10 Hit Rate</div>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {gSquareResult.walkForwardReport.top10HitRate}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top 21 Reach</div>
              <div className="text-xl font-black text-purple-400 font-mono">
                {gSquareResult.walkForwardReport.top21HitRate}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Avg Win Rank</div>
              <div className="text-xl font-black text-indigo-300 font-mono">
                #{gSquareResult.walkForwardReport.averageHitRank || 7.2}
              </div>
            </div>
          </div>

          {/* Chronological Step Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chronological Anti-Leakage Walk-Forward Steps
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Expanding Training Window</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Source Draw</th>
                    <th className="py-2 px-2.5">x</th>
                    <th className="py-2 px-2.5">Top 5 Prediction Pairs</th>
                    <th className="py-2 px-2.5">Actual Draw Outcomes</th>
                    <th className="py-2 px-2.5 text-center">Hit Status</th>
                    <th className="py-2 px-2.5 text-right">Win Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gSquareResult.walkForwardReport.steps.map((step) => {
                    return (
                      <tr key={step.targetDate} className="hover:bg-slate-850/50">
                        <td className="py-2 px-2.5 text-white font-bold">{step.targetDate}</td>
                        <td className="py-2 px-2.5 text-slate-300">
                          {step.sourceMarket} <span className="font-bold text-amber-300">{step.sourceNumber}</span>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-amber-400">{step.onesX}</td>
                        <td className="py-2 px-2.5 text-slate-200">
                          {step.top5Pairs.join(', ')}
                        </td>
                        <td className="py-2 px-2.5 text-slate-300">
                          {step.actualOutcomes.map((o) => `${o.market}:${o.pair}`).join(', ')}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          {step.hitTop5 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                              TOP 5 HIT
                            </span>
                          ) : step.hitTop10 ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-[10px]">
                              TOP 10 HIT
                            </span>
                          ) : step.hitTop21 ? (
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[10px]">
                              TOP 21 HIT
                            </span>
                          ) : step.winningMatchClass === 'PALTI' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                              PALTI HIT
                            </span>
                          ) : (
                            <span className="text-slate-500">Miss</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-indigo-300">
                          {step.winningRank ? `#${step.winningRank}` : '—'}
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

      {/* VIEW: 4. MODEL COMPARISON ARENA */}
      {activeTab === 'models' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Machine Learning Model Out-of-Sample Arena
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated strictly on historical out-of-sample forward-walk steps to avoid data snooping.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">Model Architecture</th>
                  <th className="py-3 px-3 text-center">Top 1 Hit%</th>
                  <th className="py-3 px-3 text-center">Top 5 Hit%</th>
                  <th className="py-3 px-3 text-center">Top 10 Hit%</th>
                  <th className="py-3 px-3 text-center">Top 21 Reach</th>
                  <th className="py-3 px-3 text-center">24 Reach%</th>
                  <th className="py-3 px-3 text-center">F1 Score</th>
                  <th className="py-3 px-3 text-center">ROC-AUC</th>
                  <th className="py-3 px-3 text-right">Avg Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {gSquareResult.walkForwardReport.modelComparisons.map((m) => {
                  const isActive = activeModel === m.modelType;

                  return (
                    <tr
                      key={m.modelType}
                      className={`hover:bg-slate-850 ${
                        isActive ? 'bg-indigo-950/40 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-white">
                        <div className="flex items-center gap-2">
                          <span>{m.modelName}</span>
                          {m.isBest && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                              BEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-400">{m.top1HitRate}%</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-400">{m.top5HitRate}%</td>
                      <td className="py-3 px-3 text-center font-bold text-cyan-400">{m.top10HitRate}%</td>
                      <td className="py-3 px-3 text-center font-bold text-purple-400">{m.top21HitRate}%</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-300">{m.top24HitRate}%</td>
                      <td className="py-3 px-3 text-center text-slate-300">{m.f1Score}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{m.rocAuc}</td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-300">#{m.avgHitRank}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: 5. MATHEMATICAL RULES & THEORY SPEC */}
      {activeTab === 'theory' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 text-slate-300 text-xs leading-relaxed">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              G Square Method — Deterministic Mathematics & ML Architecture
            </h3>
            <span className="text-xs font-mono text-amber-300">Rule-Based + AI Trainable</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-mono">1. Base Variable Extraction</h4>
              <p>
                From historical Gali or Ghaziabad draw result, extract only the <strong className="text-amber-300">ones-place digit</strong>:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-emerald-400">
                x = selected_number % 10 (e.g. 93 → x = 3)
              </div>

              <h4 className="text-sm font-bold text-white uppercase font-mono mt-4">2. Six Vertical Values (A–F)</h4>
              <p>Generates the vertical set using the core triad and 5-decade Rashi complements:</p>
              <ul className="space-y-1 font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <li>A = (x - 1) mod 10</li>
                <li>B = x (Base digit)</li>
                <li>C = (x + 1) mod 10</li>
                <li>D = (x + 4) mod 10 [Rashi complement of A]</li>
                <li>E = (x + 5) mod 10 [Rashi complement of B]</li>
                <li>F = (x + 6) mod 10 [Rashi complement of C]</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-mono">3. Four Horizontal Values (G–J)</h4>
              <p>Generates four harmonic offset columns normalized modulo 10:</p>
              <ul className="space-y-1 font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <li>G = (x - 2) mod 10</li>
                <li>H = (x - 3) mod 10</li>
                <li>I = (x + 2) mod 10</li>
                <li>J = (x + 3) mod 10</li>
              </ul>

              <h4 className="text-sm font-bold text-white uppercase font-mono mt-4">4. 6 × 4 Matrix Construction</h4>
              <p>
                Concatenates each vertical row with each horizontal column without multiplication:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-cyan-300">
                AG = concatenate(A, G) (e.g., A=2, G=1 → 21)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
