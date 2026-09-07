import React, { useState, useMemo, useEffect } from 'react';
import { DayMarketEntry, Currency } from '../types';
import {
  parseAndNormalizeCustomNumbers,
  analyzeCustomNumbersBatch,
  CustomNumberAssessment,
  CustomNumberBatchAnalysisReport,
} from '../utils/customNumberIntelligenceEngine';
import { CustomNumberDetailModal } from './CustomNumberDetailModal';
import { CustomNumberComparisonModal } from './CustomNumberComparisonModal';
import {
  Search,
  Sliders,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  TrendingUp,
  Scale,
  History,
  ShieldCheck,
  Zap,
  Info,
  ArrowUpDown,
  Copy,
  Check,
  Target,
  BarChart3,
  HelpCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface CustomNumberIntelligenceModuleProps {
  records: DayMarketEntry[];
  targetDate: string;
  currency: Currency;
  onSendPairsToSimulator?: (pairs: string[]) => void;
  defaultSeedNumbers?: string[];
}

export const CustomNumberIntelligenceModule: React.FC<CustomNumberIntelligenceModuleProps> = ({
  records,
  targetDate,
  currency,
  onSendPairsToSimulator,
  defaultSeedNumbers = ['12', '27', '38', '47', '82', '90'],
}) => {
  // Input state
  const [rawInput, setRawInput] = useState<string>(defaultSeedNumbers.join(', '));
  const [analyzedNumbers, setAnalyzedNumbers] = useState<string[]>(defaultSeedNumbers);
  const [inputError, setInputError] = useState<string | null>(null);
  const [invalidTokens, setInvalidTokens] = useState<string[]>([]);

  // Sorter state
  const [sortBy, setSortBy] = useState<
    'unified' | 'historical' | 'pattern' | 'engines' | 'hitRate' | 'skip' | 'hits'
  >('unified');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Weights state (inspectable & adjustable)
  const [historicalWeight, setHistoricalWeight] = useState<number>(0.45);
  const [patternWeight, setPatternWeight] = useState<number>(0.55);
  const [showWeightControls, setShowWeightControls] = useState<boolean>(false);

  // Inspector & Comparison Modals
  const [selectedCandidate, setSelectedCandidate] = useState<CustomNumberAssessment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Parse on input change
  const parsed = useMemo(() => {
    return parseAndNormalizeCustomNumbers(rawInput);
  }, [rawInput]);

  const handleAnalyze = () => {
    if (parsed.validNumbers.length === 0) {
      setInputError('Please enter at least one valid 2-digit number (00 to 99).');
      return;
    }
    setInputError(null);
    setInvalidTokens(parsed.invalidTokens);
    setAnalyzedNumbers(parsed.validNumbers);
  };

  const handleClear = () => {
    setRawInput('');
    setAnalyzedNumbers([]);
    setInputError(null);
    setInvalidTokens([]);
  };

  const handleApplyPreset = (presetList: string[]) => {
    const text = presetList.join(', ');
    setRawInput(text);
    setAnalyzedNumbers(presetList);
    setInputError(null);
    setInvalidTokens([]);
  };

  // Run batch analysis
  const report: CustomNumberBatchAnalysisReport = useMemo(() => {
    if (analyzedNumbers.length === 0) {
      return {
        targetDate,
        prevDate: '',
        resolvedPrevOutcomes: [],
        evaluatedCount: 0,
        strongEvidenceCount: 0,
        moderateEvidenceCount: 0,
        specializedWeakCount: 0,
        averageHistoricalScore: 0,
        averagePatternScore: 0,
        averageUnifiedScore: 0,
        candidates: [],
        scoringWeights: { historicalWeight, patternWeight },
        backtestLedger: {
          testedDays: 0,
          customSetHitRateTop1: 0,
          customSetHitRateTop5: 0,
          customSetHitRateTop10: 0,
          totalOutcomesEvaluated: 0,
        },
      };
    }
    return analyzeCustomNumbersBatch(analyzedNumbers, targetDate, records, {
      historicalWeight,
      patternWeight,
    });
  }, [analyzedNumbers, targetDate, records, historicalWeight, patternWeight]);

  // Sorted candidates
  const sortedCandidates = useMemo(() => {
    const list = [...report.candidates];
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'unified':
          return b.unifiedResearchScore - a.unifiedResearchScore;
        case 'historical':
          return b.historicalEvidenceScore - a.historicalEvidenceScore;
        case 'pattern':
          return b.currentPatternMatchScore - a.currentPatternMatchScore;
        case 'engines':
          return b.engineSupport.agreementCount - a.engineSupport.agreementCount;
        case 'hitRate':
          return b.calibratedOosTop10HitRate - a.calibratedOosTop10HitRate;
        case 'skip':
          return a.coreX.currentSkipDraws - b.coreX.currentSkipDraws;
        case 'hits':
          return b.coreX.totalHistoricalOccurrences - a.coreX.totalHistoricalOccurrences;
        default:
          return a.rank - b.rank;
      }
    });
  }, [report.candidates, sortBy]);

  const openDetailModal = (candidate: CustomNumberAssessment) => {
    setSelectedCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  const copyResultsSummary = () => {
    const header = `=== Numerix Custom Number Intelligence (${targetDate}) ===\nAnalyzed: ${report.evaluatedCount} numbers | Strong: ${report.strongEvidenceCount} | Moderate: ${report.moderateEvidenceCount}\n\n`;
    const rows = sortedCandidates.map(
      (c) =>
        `#${c.rank} Pair ${c.pair} | Unified: ${c.unifiedResearchScore}/100 | Hist: ${c.historicalEvidenceScore} | Pattern: ${c.currentPatternMatchScore} | Engines: ${c.engineSupport.agreementCount}/6 | OOS Hit Rate: ${c.calibratedOosTop10HitRate}% [${c.evidenceLevel}]`
    );
    navigator.clipboard.writeText(header + rows.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div
      id="custom-number-intelligence-section"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl relative overflow-hidden"
    >
      {/* BACKGROUND ACCENT */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-500/10">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  Custom Number Intelligence
                </h2>
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Multi-Engine Evaluation
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Manually input any set of 00–99 candidates to evaluate across 6 deterministic engines, historical Core-X patterns, and pre-draw resonance.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowWeightControls(!showWeightControls)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              showWeightControls
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Scoring Weights ({Math.round(historicalWeight * 100)}% / {Math.round(patternWeight * 100)}%)</span>
          </button>

          {report.candidates.length > 0 && (
            <>
              <button
                id="compare-custom-numbers-btn"
                type="button"
                onClick={() => setIsComparisonModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold transition cursor-pointer border border-slate-800 flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Side-by-Side Matrix ({report.candidates.length})</span>
              </button>

              <button
                type="button"
                onClick={copyResultsSummary}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold transition cursor-pointer border border-slate-800 flex items-center gap-1.5"
                title="Copy Assessment Summary"
              >
                {copiedSummary ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* WEIGHT TUNING EXPANDER */}
      {showWeightControls && (
        <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 text-xs font-mono space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-indigo-300 font-bold uppercase text-[11px]">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              Unified Research Score Weighting Formula
            </span>
            <button
              type="button"
              onClick={() => {
                setHistoricalWeight(0.45);
                setPatternWeight(0.55);
              }}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults (45% / 55%)
            </button>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Unified Score = (Historical Evidence &times; {historicalWeight.toFixed(2)}) + (Current Pattern Match &times; {patternWeight.toFixed(2)}).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Historical Evidence Weight:</span>
                <strong className="text-cyan-300">{Math.round(historicalWeight * 100)}%</strong>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={historicalWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setHistoricalWeight(val);
                  setPatternWeight(Math.round((1 - val) * 100) / 100);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Pre-Draw Pattern Match Weight:</span>
                <strong className="text-amber-300">{Math.round(patternWeight * 100)}%</strong>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={patternWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPatternWeight(val);
                  setHistoricalWeight(Math.round((1 - val) * 100) / 100);
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1. CUSTOM NUMBER SEARCH / INPUT COMPONENT */}
      <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="custom-number-input"
            className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>Enter Numbers to Analyze</span>
            <span className="text-[10px] font-normal text-slate-400 lowercase">
              (e.g., 12, 27, 38, 47, 82, 90 &bull; normalized to 00–99)
            </span>
          </label>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
            <span className="text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset(['12', '27', '38', '47', '82', '90'])}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition cursor-pointer"
            >
              Default Core (6)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(['04', '14', '24', '34', '44', '54', '64', '74', '84', '94'])}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition cursor-pointer"
            >
              Haruf 4 Series (10)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(['07', '17', '27', '37', '47', '57', '67', '77', '87', '97'])}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 transition cursor-pointer"
            >
              Haruf 7 Series (10)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(['16', '27', '38', '49', '50', '61', '72', '83', '94'])}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition cursor-pointer"
            >
              Rashi Complements (9)
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              id="custom-number-input"
              type="text"
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyze();
              }}
              placeholder="Paste or type numbers: 12, 27, 38, 47, 82..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 transition outline-none"
            />
            {parsed.validNumbers.length > 0 && (
              <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {parsed.validNumbers.length} Valid {parsed.validNumbers.length === 1 ? 'Number' : 'Numbers'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="analyze-custom-numbers-btn"
              type="button"
              onClick={handleAnalyze}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Selected Numbers</span>
            </button>
            <button
              id="clear-custom-numbers-btn"
              type="button"
              onClick={handleClear}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition cursor-pointer"
              title="Clear Input"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline Error & Invalid Token Feedback */}
        {inputError && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{inputError}</span>
          </div>
        )}

        {invalidTokens.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ignored invalid tokens (outside 00–99 range):</span>
            <div className="flex gap-1 flex-wrap">
              {invalidTokens.map((t, idx) => (
                <span
                  key={idx}
                  className="bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/40 text-amber-200 font-bold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. SUMMARY METRICS BAR */}
      {report.candidates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Analyzed</div>
            <div className="text-xl font-black text-slate-200 mt-0.5">
              {report.evaluatedCount} <span className="text-xs text-slate-500">candidates</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400 uppercase font-semibold">Strong Evidence</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              {report.strongEvidenceCount}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({report.evaluatedCount > 0 ? Math.round((report.strongEvidenceCount / report.evaluatedCount) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30">
            <div className="text-[10px] text-indigo-400 uppercase font-semibold">Moderate Evidence</div>
            <div className="text-xl font-black text-indigo-300 mt-0.5">
              {report.moderateEvidenceCount}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Specialized / Weak</div>
            <div className="text-xl font-black text-slate-400 mt-0.5">
              {report.specializedWeakCount}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Avg Unified Score</div>
            <div className="text-xl font-black text-cyan-300 mt-0.5">
              {report.averageUnifiedScore} <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Backtest Top 5 Hit Rate</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {report.backtestLedger.customSetHitRateTop5}%{' '}
              <span className="text-xs text-slate-500">OOS</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTER & SORT CONTROLS */}
      {report.candidates.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold">Sort By:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSortBy('unified')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortBy === 'unified'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unified Score
              </button>
              <button
                type="button"
                onClick={() => setSortBy('historical')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortBy === 'historical'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hist. Evidence
              </button>
              <button
                type="button"
                onClick={() => setSortBy('pattern')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortBy === 'pattern'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pattern Match
              </button>
              <button
                type="button"
                onClick={() => setSortBy('engines')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortBy === 'engines'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Engines
              </button>
              <button
                type="button"
                onClick={() => setSortBy('hitRate')}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sortBy === 'hitRate'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OOS Hit Rate
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSendPairsToSimulator && (
              <button
                id="simulate-top5-custom-btn"
                type="button"
                onClick={() =>
                  onSendPairsToSimulator(sortedCandidates.slice(0, 5).map((c) => c.pair))
                }
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-bold transition cursor-pointer border border-cyan-500/30 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Top 5 ({sortedCandidates.slice(0, 5).map((c) => c.pair).join(', ')}) &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. CANDIDATE RANKING CARDS */}
      {sortedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCandidates.map((candidate) => {
            const isStrong = candidate.evidenceLevel === 'STRONG';
            const isModerate = candidate.evidenceLevel === 'MODERATE';

            return (
              <div
                key={candidate.pair}
                className={`bg-slate-950 rounded-xl p-4 border transition flex flex-col justify-between relative overflow-hidden ${
                  isStrong
                    ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-slate-950 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                    : isModerate
                    ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/15 to-slate-950'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header: Rank, Number, Evidence Level */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{candidate.rank}
                        </span>
                        <span
                          className={`font-mono text-3xl font-black tracking-wider ${
                            isStrong
                              ? 'text-emerald-300'
                              : isModerate
                              ? 'text-indigo-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {candidate.pair}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isStrong
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isModerate
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {candidate.evidenceLevel}
                      </span>
                      <span className="text-[11px] font-mono font-black text-cyan-300">
                        {candidate.unifiedResearchScore}{' '}
                        <span className="text-[9px] text-slate-400 font-normal">Score</span>
                      </span>
                    </div>
                  </div>

                  {/* Dual Score Progress Meters */}
                  <div className="space-y-2 my-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Hist. Evidence:</span>
                        <strong className="text-slate-200">
                          {candidate.historicalEvidenceScore} / 100
                        </strong>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-cyan-400 h-1.5 rounded-full"
                          style={{ width: `${candidate.historicalEvidenceScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Current Pattern Match:</span>
                        <strong className="text-amber-300">
                          {candidate.currentPatternMatchScore} / 100
                        </strong>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-1.5 rounded-full"
                          style={{ width: `${candidate.currentPatternMatchScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Key Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 my-2 text-[11px] font-mono">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Engine Agreement:</span>
                      <div className="font-bold text-emerald-300 mt-0.5">
                        {candidate.engineSupport.agreementCount} / 6 Engines
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">OOS Hit Rate:</span>
                      <div className="font-bold text-cyan-300 mt-0.5">
                        {candidate.calibratedOosTop10HitRate}%
                      </div>
                    </div>
                  </div>

                  {/* Active Engine Badges */}
                  <div className="space-y-1 my-2.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      Supported in Engines:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.engineSupport.engine1DateGen.active && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                          E1: Date Triad
                        </span>
                      )}
                      {candidate.engineSupport.engine2PrevDay.active && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                          E2: Repeated
                        </span>
                      )}
                      {candidate.engineSupport.engine3SirAbhishek.active && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/40">
                          E3: 15-Pair
                        </span>
                      )}
                      {candidate.engineSupport.engine4FaridabadDelta.active && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40">
                          E4: FB Delta
                        </span>
                      )}
                      {candidate.engineSupport.engine5MultiSignal.active && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-blue-500/20 text-blue-300 border-blue-500/40">
                          E5: Multi-Sig
                        </span>
                      )}
                      {candidate.engineSupport.engine6MarkovTransition.active && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                          E6: Markov
                        </span>
                      )}
                      {candidate.engineSupport.agreementCount === 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-slate-900 text-slate-400 border-slate-800">
                          No Engine Support
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openDetailModal(candidate)}
                      className="px-2.5 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 font-bold transition cursor-pointer flex items-center gap-1"
                      title="Inspect full breakdown and reasoning"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Why?</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetailModal(candidate)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
                      title="Historical Profile"
                    >
                      History
                    </button>
                  </div>

                  {onSendPairsToSimulator && (
                    <button
                      type="button"
                      onClick={() => onSendPairsToSimulator([candidate.pair])}
                      className="text-cyan-400 hover:text-cyan-300 font-bold transition cursor-pointer hover:underline text-[11px]"
                    >
                      Simulate &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 font-mono text-xs text-slate-500">
          No numbers currently analyzed. Enter candidates above or click a preset to evaluate.
        </div>
      )}

      {/* 5. DEDICATED CUSTOM NUMBER CONDITIONAL BACKTEST PANEL */}
      {report.candidates.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase">
                Custom Number Conditional Walk-Forward Backtest
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              Evaluated over last {report.backtestLedger.testedDays} historical draw cycles
            </span>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Strict sequential validation testing whether candidates matching the statistical and pattern criteria of your selected numbers actually hit in out-of-sample historical draws.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Top 1 Hit Rate</div>
              <div className="text-xl font-black text-cyan-300 mt-1">
                {report.backtestLedger.customSetHitRateTop1}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Single top candidate</div>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Top 5 Hit Rate</div>
              <div className="text-xl font-black text-emerald-300 mt-1">
                {report.backtestLedger.customSetHitRateTop5}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Top 5 custom subset</div>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Top 10 Hit Rate</div>
              <div className="text-xl font-black text-purple-300 mt-1">
                {report.backtestLedger.customSetHitRateTop10}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Top 10 custom subset</div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <CustomNumberDetailModal
        assessment={selectedCandidate}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSendToSimulator={onSendPairsToSimulator}
        currency={currency}
      />

      {/* COMPARISON MODAL */}
      <CustomNumberComparisonModal
        candidates={report.candidates}
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        onSelectNumberForDetail={(c) => {
          setSelectedCandidate(c);
          setIsDetailModalOpen(true);
        }}
        onSendToSimulator={onSendPairsToSimulator}
        currency={currency}
      />
    </div>
  );
};
