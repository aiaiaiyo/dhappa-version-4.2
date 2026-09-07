import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  History,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  ArrowRight,
  Filter,
  Copy,
  Check,
  Download,
  Send,
  Calendar,
  BarChart3,
  Sliders,
  Table as TableIcon,
  ShieldAlert,
  Search,
  RefreshCw,
  Info,
  ChevronRight,
  PieChart,
  Target,
  Grid,
  Zap,
  ListOrdered,
  Eye,
} from 'lucide-react';
import {
  DayMarketEntry,
  FullArithmeticPatternAnalysis,
  RankedArithmeticCandidate,
  CandidateSignalFamily,
  HistoricalObservationItem,
  BacktestRecordStep,
} from '../types';
import {
  runFullArithmeticPatternAssessment,
  extractObservationsFromRecords,
  computeHistoricalFrequencyAnalysis,
  computeRecencyWindows,
  computeTransitionAnalysis,
  runWalkForwardBacktesting,
  padZero2,
} from '../utils/arithmeticPatternEngine';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';
import {
  formatDateBanner,
  formatDateISO,
  getTodayDateISO,
  getPreviousDateISO,
  getOutcomesForDate,
  computePreviousDayRepeatedDigitMethod,
} from '../utils/mathEngine';

interface ArithmeticPatternAnalysisSectionProps {
  records: DayMarketEntry[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export type EngineSectionTab =
  | 'all-sections'
  | '1-actual-results'
  | '2-digit-frequency'
  | '3-arithmetic-patterns'
  | '4-repeated-digit-method'
  | '5-transition-analysis'
  | '6-candidate-pool'
  | '7-ranked-candidates'
  | '8-strongest-candidates'
  | '9-backtesting'
  | '10-method-comparison';

export const ArithmeticPatternAnalysisSection: React.FC<ArithmeticPatternAnalysisSectionProps> = ({
  records,
  onSendPairsToSimulator,
}) => {
  // Target Date & Source Outcome Controls
  const [targetDate, setTargetDate] = useState<string>(() => getTodayDateISO());
  const [prevMode, setPrevMode] = useState<'auto-archive' | 'custom'>('auto-archive');
  const [customPrevDate, setCustomPrevDate] = useState<string>(() => getPreviousDateISO());
  const [customPrevOutcomes, setCustomPrevOutcomes] = useState<string>(() => {
    const prevDate = getPreviousDateISO();
    const list = getOutcomesForDate(records, prevDate);
    return list.length > 0 ? list.join(', ') : '49, 58, 71, 40';
  });

  // Active Main Navigation Section (1-10 or All)
  const [activeSection, setActiveSection] = useState<EngineSectionTab>('7-ranked-candidates');

  // Interactive Inspector state for Section 3
  const [inspectedNumber, setInspectedNumber] = useState<string>('38');

  // Filters for Section 7 & 6
  const [tierFilter, setTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Calculate Reference Previous Date
  const calculatedPrevDateISO = useMemo(() => {
    return getPreviousDateISO(targetDate);
  }, [targetDate]);

  // Synchronize custom outcomes on targetDate / records change
  React.useEffect(() => {
    const list = getOutcomesForDate(records, calculatedPrevDateISO);
    if (list.length > 0) {
      setCustomPrevOutcomes(list.join(', '));
      setCustomPrevDate(calculatedPrevDateISO);
    }
  }, [records, targetDate, calculatedPrevDateISO]);

  // Resolve previous day outcomes
  const resolvedPrevOutcomes = useMemo(() => {
    if (prevMode === 'auto-archive') {
      const match = getOutcomesForDate(records, calculatedPrevDateISO);
      if (match.length > 0) {
        return match;
      }
      if (records.length > 0) {
        for (const r of records) {
          const out = getOutcomesForDate(records, r.date);
          if (out.length > 0) return out;
        }
      }
      return ['49', '58', '71', '40'];
    }
    return customPrevOutcomes
      .split(/[, ]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{2}$/.test(s));
  }, [prevMode, targetDate, calculatedPrevDateISO, records, customPrevOutcomes]);

  const effectivePrevDate = prevMode === 'auto-archive' ? calculatedPrevDateISO : customPrevDate;

  // Master Assessment Execution
  const assessment: FullArithmeticPatternAnalysis = useMemo(() => {
    return runFullArithmeticPatternAssessment(
      records,
      targetDate,
      resolvedPrevOutcomes,
      effectivePrevDate
    );
  }, [records, targetDate, resolvedPrevOutcomes, effectivePrevDate]);

  // Standardized Engine Result for Consensus Layer
  const standardizedArithmeticResult = useMemo(() => {
    const candidates = assessment.tier1Candidates.map((c) => c.pair);
    const topScore = assessment.tier1Candidates[0]?.normalizedScore ?? 0;
    const evidence = assessment.tier1Candidates.slice(0, 5).flatMap((c) => c.explanation.topSignalReasons);

    return buildStandardizedEngineResult({
      engineId: 'ARITHMETIC_PATTERN',
      methodName: 'Arithmetic Pattern Analysis',
      date: targetDate,
      channel: 'live-engine-output',
      sourceValues: { prevOutcomes: resolvedPrevOutcomes },
      normalizedValues: { tier1Length: assessment.tier1Candidates.length, tier2Length: assessment.tier2Candidates.length },
      rawResult: assessment as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: assessment.backtestReport?.totalTestedOutcomes ?? 0,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractDigitPatterns()', 'rankArithmetically()', 'backtest()', 'score()'],
    });
  }, [assessment, targetDate, resolvedPrevOutcomes]);

  // Detailed Step-by-Step Previous Day Method Calculation
  const detailedPrevMethod = useMemo(() => {
    return computePreviousDayRepeatedDigitMethod(
      resolvedPrevOutcomes,
      effectivePrevDate,
      prevMode === 'custom' ? 'custom-input' : 'auto-recorded'
    );
  }, [resolvedPrevOutcomes, effectivePrevDate, prevMode]);

  // Quick Presets
  const handlePreset = (preset: 'aug15' | 'aug25' | 'boundary0' | 'high-freq') => {
    if (preset === 'aug15') {
      setTargetDate('2026-08-15');
      setPrevMode('custom');
      setCustomPrevDate('2026-08-14');
      setCustomPrevOutcomes('12, 49, 38, 71');
    } else if (preset === 'aug25') {
      setTargetDate('2026-08-25');
      setPrevMode('custom');
      setCustomPrevDate('2026-08-24');
      setCustomPrevOutcomes('21, 23, 72, 85');
    } else if (preset === 'boundary0') {
      setTargetDate('2026-08-10');
      setPrevMode('custom');
      setCustomPrevDate('2026-08-09');
      setCustomPrevOutcomes('00, 12, 34, 56');
    } else if (preset === 'high-freq') {
      setTargetDate('2026-08-12');
      setPrevMode('auto-archive');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(assessment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `arithmetic-pattern-analysis-${targetDate}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered Candidates Table
  const filteredCandidates = useMemo(() => {
    return assessment.candidatePool.filter((c) => {
      if (tierFilter === 'TIER_1' && c.tier !== 'TIER_1_STRONG') return false;
      if (tierFilter === 'TIER_2' && c.tier !== 'TIER_2_MODERATE') return false;
      if (tierFilter === 'TIER_3' && c.tier !== 'TIER_3_EXPLORATORY') return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchesPair = c.pair.includes(q);
        const matchesSignals = c.supportingSignals.some((s) =>
          s.name.toLowerCase().includes(q)
        );
        const matchesSum = String(c.digitSum) === q;
        const matchesDiff = String(c.digitDiff) === q;
        if (!matchesPair && !matchesSignals && !matchesSum && !matchesDiff)
          return false;
      }
      return true;
    });
  }, [assessment.candidatePool, tierFilter, searchQuery]);

  // Number Inspector breakdown for Section 3
  const inspectedData = useMemo(() => {
    const p = padZero2(parseInt(inspectedNumber || '0', 10) % 100);
    const tens = Math.floor(parseInt(p, 10) / 10);
    const ones = parseInt(p, 10) % 10;
    const digitSum = tens + ones;
    const digitDiff = Math.abs(tens - ones);
    const reversePair = `${ones}${tens}`;
    const minus1 = padZero2((parseInt(p, 10) - 1 + 100) % 100);
    const plus1 = padZero2((parseInt(p, 10) + 1) % 100);

    const tensGrid = [tens - 1, tens, tens + 1].filter((d) => d >= 0 && d <= 9);
    const onesGrid = [ones - 1, ones, ones + 1].filter((d) => d >= 0 && d <= 9);
    const matrixNeighbours: string[] = [];
    for (const t of tensGrid) {
      for (const o of onesGrid) {
        matrixNeighbours.push(`${t}${o}`);
      }
    }

    const candidateMatch = assessment.candidatePool.find((c) => c.pair === p);
    const occurrences = assessment.observations.filter((obs) => obs.pair === p);

    return {
      pair: p,
      tens,
      ones,
      digitSum,
      digitDiff,
      reversePair,
      minus1,
      plus1,
      tensGrid,
      onesGrid,
      matrixNeighbours,
      candidateMatch,
      occurrencesCount: occurrences.length,
      isEvenTens: tens % 2 === 0,
      isEvenOnes: ones % 2 === 0,
      isHighTens: tens >= 5,
      isHighOnes: ones >= 5,
    };
  }, [inspectedNumber, assessment.candidatePool, assessment.observations]);

  // Section visibility helper (either matching single tab or "all-sections")
  const isSectionVisible = (sectionKey: EngineSectionTab) => {
    if (activeSection === 'all-sections') return true;
    return activeSection === sectionKey;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Perspective Control Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" /> ACTUAL RESULTS + ARITHMETIC ENGINE
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Walk-Forward Zero Lookahead
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> 10-Section Mathematical Synthesis
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Actual Results + Arithmetic Pattern Analysis Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Synthesizes empirical historical outcomes with multi-dimensional arithmetic transformations (digit sums $X+Y$, differences $|X-Y|$, reversals $YX$, $\pm 1$ and digit-grid neighbours, sequential transitions, recency windows, and previous-day repeated digit peak generators). Ranks all 100 sample candidates with anti-double-counting signal caps and rolling walk-forward backtesting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Assessment JSON</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Target Date */}
          <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Target Evaluation Date:
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {assessment.observations.length} Observations Analyzed
              </span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{formatDateBanner(targetDate)}</span>
              <span className="font-mono text-indigo-400">
                {assessment.candidatePool.length} Scored Candidates
              </span>
            </div>
          </div>

          {/* Previous Day Method Input */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Previous Day Reference Outcomes (Method Component):
              </label>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPrevMode('custom')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    prevMode === 'custom'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manual Custom
                </button>
                <button
                  type="button"
                  onClick={() => setPrevMode('auto-archive')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    prevMode === 'auto-archive'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auto-Archive ({calculatedPrevDateISO})
                </button>
              </div>
            </div>

            {prevMode === 'custom' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPrevOutcomes}
                  onChange={(e) => setCustomPrevOutcomes(e.target.value)}
                  placeholder="e.g. 12, 49, 38, 71"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <input
                  type="date"
                  value={customPrevDate}
                  onChange={(e) => setCustomPrevDate(e.target.value)}
                  className="w-auto bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
                <span className="text-slate-400">
                  Target - 1d ({calculatedPrevDateISO}):
                </span>
                <span className="text-emerald-400 font-bold">
                  {resolvedPrevOutcomes.join(' | ') || 'No recorded draws found'}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-500">
                Peak Digit X:{' '}
                <strong className="text-emerald-400 font-mono">
                  [{assessment.prevDayMethodSummary.xValues.join(', ') || 'N/A'}]
                </strong>
              </span>
              <span className="text-slate-500">
                Prev Method Pairs:{' '}
                <strong className="text-slate-300 font-mono">
                  {assessment.prevDayMethodSummary.generatedPairs.length}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">
            Analytical Presets:
          </span>
          <button
            type="button"
            onClick={() => handlePreset('aug15')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Multi-Signal Aug 15
          </button>
          <button
            type="button"
            onClick={() => handlePreset('aug25')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Aug 25 High-Convergence
          </button>
          <button
            type="button"
            onClick={() => handlePreset('boundary0')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Boundary Wrap X=0
          </button>
          <button
            type="button"
            onClick={() => handlePreset('high-freq')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Auto-Archive Live Mode
          </button>
        </div>
      </div>

      {/* 5 Core Top Analytical KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Tier 1 Candidates */}
        <div className="bg-slate-900/80 border border-indigo-500/40 rounded-xl p-4 space-y-1 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-indigo-400" /> Tier 1 Strong
            </span>
            <span className="text-[10px] font-mono text-slate-500">Score &ge; 68</span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {assessment.tier1Candidates.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Strongest multi-signal support
          </div>
        </div>

        {/* Metric 2: Tier 2 Candidates */}
        <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Tier 2 Moderate
            </span>
            <span className="text-[10px] font-mono text-slate-500">Moderate</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {assessment.tier2Candidates.length}
          </div>
          <div className="text-[10px] text-slate-400">
            2+ independent signal families
          </div>
        </div>

        {/* Metric 3: Backtested Top-10 Hit Rate */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Top-10 Hit Rate
            </span>
            <span className="text-[10px] font-mono text-slate-500">Backtested</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {assessment.backtestReport.top10HitRate}%
          </div>
          <div className="text-[10px] text-slate-400">
            vs 10% random benchmark
          </div>
        </div>

        {/* Metric 4: Total Observations Analyzed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-blue-400" /> Historical Sample
            </span>
            <span className="text-[10px] font-mono text-slate-500">Outcomes</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {assessment.observations.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Across {assessment.totalHistoricalEntries} market days
          </div>
        </div>

        {/* Metric 5: Top Contributing Signal Family */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Top Signal
            </span>
            <span className="text-[10px] font-mono text-slate-500">Accuracy</span>
          </div>
          <div className="text-base font-bold font-mono text-purple-300 truncate">
            {assessment.backtestReport.methodEffectiveness[0]?.name?.split(' ')[0] ||
              'Frequency'}
          </div>
          <div className="text-[10px] text-slate-400">
            {assessment.backtestReport.methodEffectiveness[0]?.hitRate || 0}% backtest rate
          </div>
        </div>
      </div>

      {/* Comprehensive 10-Section Navigation Bar */}
      <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-md space-y-1.5">
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-indigo-400" /> 10-Section Output Structure:
          </span>
          <button
            type="button"
            onClick={() => setActiveSection('all-sections')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeSection === 'all-sections'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" /> View All 10 Sections (Master Executive View)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('1-actual-results')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '1-actual-results'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Actual Results
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('2-digit-frequency')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '2-digit-frequency'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Digit Frequency
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('3-arithmetic-patterns')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '3-arithmetic-patterns'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Arithmetic Patterns
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('4-repeated-digit-method')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '4-repeated-digit-method'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Repeated Digit Method
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('5-transition-analysis')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '5-transition-analysis'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Transitions
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('6-candidate-pool')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '6-candidate-pool'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            6. Candidate Pool (00-99)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('7-ranked-candidates')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '7-ranked-candidates'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            7. Ranked Table
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('8-strongest-candidates')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '8-strongest-candidates'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            8. Strongest Candidates
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('9-backtesting')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '9-backtesting'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            9. Backtesting
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('10-method-comparison')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeSection === '10-method-comparison'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            10. Method Comparison
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ACTUAL RESULTS ANALYSIS */}
      {/* ========================================================================= */}
      {isSectionVisible('1-actual-results') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-blue-400" />
                1. Actual Historical Results Analysis
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every recorded historical outcome decomposed into Tens, Ones, Digit Sums ($X+Y$), Differences ($|X-Y|$), Reverse ($YX$), $\pm 1$ integer neighbours, digit-grid neighbours, parity, magnitude, and gap intervals.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {assessment.observations.length} Total Outcomes Analyzed
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="sticky top-0 bg-slate-950 shadow z-10">
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Date &amp; Market</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Tens / Ones</th>
                  <th className="py-2.5 px-3">Sum (X+Y)</th>
                  <th className="py-2.5 px-3">Diff (|X-Y|)</th>
                  <th className="py-2.5 px-3">Reverse (YX)</th>
                  <th className="py-2.5 px-3">&plusmn;1 Neighbours</th>
                  <th className="py-2.5 px-3">Tens Grid</th>
                  <th className="py-2.5 px-3">Ones Grid</th>
                  <th className="py-2.5 px-3">Parity</th>
                  <th className="py-2.5 px-3">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assessment.observations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-300">
                      <span className="font-bold">{obs.date}</span> &bull;{' '}
                      <span className="text-slate-400">{obs.market}</span>
                    </td>
                    <td className="py-2 px-3 font-bold text-amber-300 text-sm">
                      {obs.pair}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      T=<strong className="text-slate-200">{obs.tens}</strong>, O=
                      <strong className="text-slate-200">{obs.ones}</strong>
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">
                      {obs.digitSum}
                    </td>
                    <td className="py-2 px-3 text-sky-400 font-bold">
                      {obs.digitDiff}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {obs.reversePair}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {obs.minus1Neighbour} &bull; {obs.plus1Neighbour}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      [{obs.tensNeighbours.join(', ')}]
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      [{obs.onesNeighbours.join(', ')}]
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {obs.isEvenTens ? 'E' : 'O'}-{obs.isEvenOnes ? 'E' : 'O'}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {obs.gapSinceLastSeen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DIGIT FREQUENCY ANALYSIS */}
      {/* ========================================================================= */}
      {isSectionVisible('2-digit-frequency') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              2. Digit &amp; Number Frequency Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical frequency of individual digits (0–9), Tens-digit frequency, Ones-digit frequency, parity combinations, and magnitude clusters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tens vs Ones Digit Frequency */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tens vs Ones Digit Frequency (0 to 9):
              </h3>
              <div className="space-y-1.5 font-mono text-xs">
                {Array.from({ length: 10 }, (_, d) => {
                  const tensCount =
                    assessment.frequencyAnalysis.tensFrequency[d] || 0;
                  const onesCount =
                    assessment.frequencyAnalysis.onesFrequency[d] || 0;
                  return (
                    <div key={d} className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 w-6 font-bold">Digit {d}:</span>
                      <div className="flex-1 flex items-center gap-1">
                        <div
                          className="bg-blue-500/80 h-3 rounded-sm"
                          style={{ width: `${Math.max(4, tensCount * 12)}px` }}
                          title={`Tens: ${tensCount}`}
                        />
                        <span className="text-[10px] text-blue-300">T:{tensCount}</span>
                        <div
                          className="bg-emerald-500/80 h-3 rounded-sm ml-2"
                          style={{ width: `${Math.max(4, onesCount * 12)}px` }}
                          title={`Ones: ${onesCount}`}
                        />
                        <span className="text-[10px] text-emerald-300">O:{onesCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Digit Sum Frequency */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Digit Sum Frequencies (X + Y = 0 to 18):
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs max-h-64 overflow-y-auto">
                {Object.entries(assessment.frequencyAnalysis.digitSumFrequency)
                  .filter(([_, count]) => count > 0)
                  .map(([sum, count]) => (
                    <div
                      key={sum}
                      className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-400">Sum {sum}:</span>
                      <span className="text-emerald-400 font-bold">{count} draws</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Parity & Magnitude Distribution */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Parity &amp; Magnitude Distribution:
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Parity Split:</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className="text-slate-300">Even-Even: <strong className="text-blue-400">{assessment.frequencyAnalysis.parityDistribution.evenEven}</strong></div>
                    <div className="text-slate-300">Even-Odd: <strong className="text-emerald-400">{assessment.frequencyAnalysis.parityDistribution.evenOdd}</strong></div>
                    <div className="text-slate-300">Odd-Even: <strong className="text-amber-400">{assessment.frequencyAnalysis.parityDistribution.oddEven}</strong></div>
                    <div className="text-slate-300">Odd-Odd: <strong className="text-purple-400">{assessment.frequencyAnalysis.parityDistribution.oddOdd}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Magnitude Split:</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className="text-slate-300">Low-Low (&lt;5): <strong className="text-blue-400">{assessment.frequencyAnalysis.magnitudeDistribution.lowLow}</strong></div>
                    <div className="text-slate-300">Low-High: <strong className="text-emerald-400">{assessment.frequencyAnalysis.magnitudeDistribution.lowHigh}</strong></div>
                    <div className="text-slate-300">High-Low: <strong className="text-amber-400">{assessment.frequencyAnalysis.magnitudeDistribution.highLow}</strong></div>
                    <div className="text-slate-300">High-High (&ge;5): <strong className="text-purple-400">{assessment.frequencyAnalysis.magnitudeDistribution.highHigh}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ARITHMETIC PATTERN ANALYSIS & INTERACTIVE CALCULATOR */}
      {/* ========================================================================= */}
      {isSectionVisible('3-arithmetic-patterns') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              3. Arithmetic Pattern Analysis &amp; Interactive Calculator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Applies exact mathematical operations to any two-digit number: Digit Sum ($X+Y$), Digit Difference ($|X-Y|$), Reverse ($XY \to YX$), Direct $\pm 1$ Neighbours, and Digit Coordinate Neighbours matrix.
            </p>
          </div>

          {/* Interactive Number Selector */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" /> Inspect Number Arithmetic:
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={inspectedNumber}
                  onChange={(e) => setInspectedNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="38"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm font-mono font-bold text-amber-300 w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 font-mono">
                  (Type 00-99 or click quick presets)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-[10px] text-slate-500 uppercase">Quick Test:</span>
              {['38', '49', '12', '71', '05', '83', '94'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setInspectedNumber(num)}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    inspectedData.pair === num
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Arithmetic Inspector Card */}
          <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-black text-white bg-indigo-600 px-4 py-1.5 rounded-xl border border-indigo-400 shadow-md">
                  {inspectedData.pair}
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-200">
                    Arithmetic Decomposition for Outcome {inspectedData.pair}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Tens = <strong className="text-blue-400">{inspectedData.tens}</strong>, Ones ={' '}
                    <strong className="text-emerald-400">{inspectedData.ones}</strong> &bull; Seen in{' '}
                    <strong className="text-amber-400">{inspectedData.occurrencesCount}</strong> historical draws
                  </div>
                </div>
              </div>

              {inspectedData.candidateMatch && (
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400">Score Rank:</span>
                  <div className="text-lg font-bold text-indigo-300">
                    #{inspectedData.candidateMatch.rank} ({inspectedData.candidateMatch.normalizedScore}/100)
                  </div>
                </div>
              )}
            </div>

            {/* Arithmetic Formula Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">1. Digit Sum ($X+Y$)</span>
                <div className="text-base font-bold text-emerald-400">
                  {inspectedData.tens} + {inspectedData.ones} = {inspectedData.digitSum}
                </div>
                <span className="text-[10px] text-slate-500">Range: 0 to 18</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">2. Digit Difference ($|X-Y|$)</span>
                <div className="text-base font-bold text-sky-400">
                  |{inspectedData.tens} - {inspectedData.ones}| = {inspectedData.digitDiff}
                </div>
                <span className="text-[10px] text-slate-500">Range: 0 to 9</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">3. Reverse ($YX$)</span>
                <div className="text-base font-bold text-amber-400">
                  {inspectedData.reversePair}
                </div>
                <span className="text-[10px] text-slate-500">Palindromic Mirror</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">4. &plusmn;1 Integer Neighbours</span>
                <div className="text-base font-bold text-purple-400">
                  {inspectedData.minus1}, {inspectedData.plus1}
                </div>
                <span className="text-[10px] text-slate-500">Direct Adjacency</span>
              </div>
            </div>

            {/* Digit Coordinate Neighbours Matrix */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>5. Digit Matrix Coordinate Neighbours (Tens &plusmn;1 &times; Ones &plusmn;1):</span>
                <span className="text-indigo-400">{inspectedData.matrixNeighbours.length} Coordinates</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {inspectedData.matrixNeighbours.map((nb) => (
                  <span
                    key={nb}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                      nb === inspectedData.pair
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {nb} {nb === inspectedData.pair && '(Target)'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PREVIOUS DAY REPEATED DIGIT METHOD */}
      {/* ========================================================================= */}
      {isSectionVisible('4-repeated-digit-method') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              4. Previous Day Repeated Digit Method (8-Step Traceable Pipeline)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies the peak repeated digit(s) $X$ from previous day outcomes, derives base triad $[X-1, X, X+1]$, computes $+4, +5, +6$ transformations, excludes ones-place digits from [0..9], and generates ordered candidate pairs.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
            {/* Step 1 & 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-slate-800/80">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-400 uppercase">
                  Step 1: Previous Day Actual Draws &amp; Digit Pool
                </span>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-300">
                    Draws: <strong className="text-amber-300">{resolvedPrevOutcomes.join(', ')}</strong>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Individual Digits: [{detailedPrevMethod.combinedDigitPool.join(', ')}] ({detailedPrevMethod.combinedDigitPool.length} digits)
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase">
                  Step 2 &amp; 3: Digit Frequency Table &amp; Peak Repeated Digit X
                </span>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(detailedPrevMethod.frequencyTable).map(([d, rawCount]) => {
                      const count = Number(rawCount);
                      return (
                        <span
                          key={d}
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            count === detailedPrevMethod.maxFrequency && count > 1
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                              : 'bg-slate-950 text-slate-400'
                          }`}
                        >
                          {d}:{count}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-slate-300 pt-1">
                    Peak Digit(s) $X$: <strong className="text-emerald-400 text-sm">[{detailedPrevMethod.xValues.join(', ') || 'None'}]</strong> (Repeated {detailedPrevMethod.maxFrequency}x)
                  </div>
                </div>
              </div>
            </div>

            {/* Branches (Step 4 to 8) */}
            {detailedPrevMethod.branches.map((branch, bIdx) => (
              <div key={bIdx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase">
                    Branch {bIdx + 1}: Generator for Peak Digit X = {branch.x}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {branch.finalPairs.length} Generated Pairs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Step 4: Base Triad</span>
                    <div className="text-blue-300 font-bold">[{branch.validTriad.join(', ')}]</div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Step 5-6: +4,+5,+6 &amp; Ones</span>
                    <div className="text-purple-300 font-bold">[{branch.rawOnesPlaceDigits.join(', ')}]</div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Step 7: Excluded Digits</span>
                    <div className="text-rose-400 font-bold">[{branch.uniqueExcludedDigits.join(', ')}]</div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Step 8: Remaining Active</span>
                    <div className="text-emerald-400 font-bold">[{branch.remainingDigits.join(', ')}]</div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Generated Pairs $P(K, 2)$:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {branch.finalPairs.map((p, pIdx) => (
                      <span
                        key={`${p}-${pIdx}`}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold text-xs"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: TRANSITION ANALYSIS */}
      {/* ========================================================================= */}
      {isSectionVisible('5-transition-analysis') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              5. Outcome Transitions &amp; Sequential Relationships ($Prev \to Next$)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzes recurring arithmetic transformations between consecutive historical results: tens shifts, ones shifts, reverse transitions, $\pm 1$ shifts, and $\pm 5$ harmonic symmetries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            {assessment.topTransitions.map((rule, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-300">
                    {rule.fromPair} &rarr; {rule.toPair}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                    {rule.frequency}x observed
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Tens Shift:{' '}
                  <strong className="text-slate-200">
                    {rule.tensShift > 0 ? `+${rule.tensShift}` : rule.tensShift}
                  </strong>{' '}
                  &bull; Ones Shift:{' '}
                  <strong className="text-slate-200">
                    {rule.onesShift > 0 ? `+${rule.onesShift}` : rule.onesShift}
                  </strong>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px]">
                  {rule.isReverse && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      Reverse
                    </span>
                  )}
                  {rule.isPlus1 && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      +1
                    </span>
                  )}
                  {rule.isMinus1 && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                      -1
                    </span>
                  )}
                  {rule.isPlus5Tens && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      &plusmn;5 Tens
                    </span>
                  )}
                  {rule.isSameTens && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                      Same Tens
                    </span>
                  )}
                  {rule.isSameOnes && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      Same Ones
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: CANDIDATE POOL (ALL 100 NUMBERS 00 TO 99 MATRIX) */}
      {/* ========================================================================= */}
      {isSectionVisible('6-candidate-pool') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-400" />
                6. Complete Candidate Pool (100-Number Universe Matrix)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every number from 00 to 99 evaluated across independent mathematical criteria. Click any number to inspect its exact arithmetic profile.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1 text-indigo-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Tier 1 Strong
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tier 2 Moderate
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Tier 3
              </span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-1.5 font-mono text-xs">
            {assessment.candidatePool
              .slice()
              .sort((a, b) => parseInt(a.pair, 10) - parseInt(b.pair, 10))
              .map((cand, idx) => {
                const isTier1 = cand.tier === 'TIER_1_STRONG';
                const isTier2 = cand.tier === 'TIER_2_MODERATE';

                return (
                  <button
                    key={`${cand.pair}-${idx}`}
                    type="button"
                    onClick={() => {
                      setInspectedNumber(cand.pair);
                      setActiveSection('3-arithmetic-patterns');
                    }}
                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                      isTier1
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 hover:bg-indigo-600 hover:text-white'
                        : isTier2
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-600 hover:text-white'
                        : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title={`${cand.pair} - Score: ${cand.normalizedScore} - Rank #${cand.rank}`}
                  >
                    <div className="font-bold text-xs">{cand.pair}</div>
                    <div className="text-[9px] opacity-75">{cand.normalizedScore}</div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: RANKED CANDIDATES TABLE */}
      {/* ========================================================================= */}
      {isSectionVisible('7-ranked-candidates') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-indigo-400" />
                7. Ranked Candidates &amp; Multi-Signal Scoring Table
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every candidate is evaluated on historical frequencies, recency windows, arithmetic sums ($X+Y$), differences ($|X-Y|$), reverses, and previous-day repeated digit peak methods with anti-double-counting caps.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter pair, signal, or sum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTierFilter('ALL')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    tierFilter === 'ALL'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  All ({assessment.candidatePool.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('TIER_1')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    tierFilter === 'TIER_1'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-indigo-400'
                  }`}
                >
                  Tier 1 ({assessment.tier1Candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('TIER_2')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    tierFilter === 'TIER_2'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-400'
                  }`}
                >
                  Tier 2 ({assessment.tier2Candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('TIER_3')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    tierFilter === 'TIER_3'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Tier 3 ({assessment.tier3Candidates.length})
                </button>
              </div>

              {onSendPairsToSimulator && (
                <button
                  type="button"
                  onClick={() =>
                    onSendPairsToSimulator(
                      assessment.tier1Candidates.slice(0, 10).map((c) => c.pair)
                    )
                  }
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Stake Top 10 in Simulator</span>
                </button>
              )}
            </div>
          </div>

          {/* Candidates Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/60 uppercase">
                  <th className="py-2.5 px-3">Rank &amp; Candidate</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Score (0-100)</th>
                  <th className="py-2.5 px-3">Arithmetic (Sum / Diff)</th>
                  <th className="py-2.5 px-3">Reverse</th>
                  <th className="py-2.5 px-3">Independent Signals</th>
                  <th className="py-2.5 px-3">Signal Families</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCandidates.map((c, idx) => {
                  const isTier1 = c.tier === 'TIER_1_STRONG';
                  const isTier2 = c.tier === 'TIER_2_MODERATE';

                  return (
                    <tr
                      key={`${c.pair}-${idx}`}
                      className={`hover:bg-slate-800/40 transition ${
                        isTier1
                          ? 'bg-indigo-500/10'
                          : isTier2
                          ? 'bg-amber-500/5'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px] w-6">
                            #{c.rank}
                          </span>
                          <span
                            className={`text-base font-bold px-2.5 py-0.5 rounded-lg border ${
                              isTier1
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                                : isTier2
                                ? 'bg-slate-900 text-amber-300 border-amber-500/50'
                                : 'bg-slate-950 text-slate-300 border-slate-800'
                            }`}
                          >
                            {c.pair}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {isTier1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 w-max">
                            <Flame className="w-3 h-3 fill-indigo-400" /> TIER 1 (STRONG)
                          </span>
                        )}
                        {isTier2 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 w-max block">
                            TIER 2 (MODERATE)
                          </span>
                        )}
                        {!isTier1 && !isTier2 && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 w-max block">
                            TIER 3 (EXPLORATORY)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                isTier1
                                  ? 'bg-indigo-400'
                                  : isTier2
                                  ? 'bg-amber-400'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${c.normalizedScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-200">
                            {c.normalizedScore}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-slate-300">
                          Sum ={' '}
                          <strong className="text-emerald-400">{c.digitSum}</strong>{' '}
                          &bull; Diff ={' '}
                          <strong className="text-sky-400">{c.digitDiff}</strong>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400">{c.reversePair}</td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                          {c.independentFamilyCount} Families ({c.supportingSignals.length} Signals)
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs text-[11px] text-slate-400">
                        <div className="flex flex-wrap gap-1">
                          {c.supportingSignals.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-300"
                            >
                              {s.name} (+{s.points})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(c.pair, `copy-${c.pair}`)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="Copy candidate"
                          >
                            {copiedKey === `copy-${c.pair}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {onSendPairsToSimulator && (
                            <button
                              type="button"
                              onClick={() => onSendPairsToSimulator([c.pair])}
                              className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-300 text-[10px] font-bold transition cursor-pointer"
                            >
                              Simulate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: STRONGEST CANDIDATES & EXPLANATIONS */}
      {/* ========================================================================= */}
      {isSectionVisible('8-strongest-candidates') && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              8. Strongest Mathematical Candidates &amp; Auditable Explanations
            </h2>
            <p className="text-xs text-slate-400">
              Each top-ranked candidate displays its exact arithmetic breakdown, independent supporting signals checklist ($\checkmark$), and mathematical selection reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessment.candidatePool.slice(0, 9).map((cand, idx) => {
              const isTier1 = cand.tier === 'TIER_1_STRONG';

              return (
                <div
                  key={`${cand.pair}-${idx}`}
                  className={`bg-slate-950 border-2 rounded-2xl p-5 space-y-4 shadow-xl transition-all relative overflow-hidden ${
                    isTier1
                      ? 'border-indigo-500/50 hover:border-indigo-400'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Rank #{cand.rank}
                      </span>
                      <span
                        className={`text-2xl font-mono font-black px-3 py-1 rounded-xl border ${
                          isTier1
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-900 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {cand.pair}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-mono font-bold text-indigo-300">
                        {cand.normalizedScore}{' '}
                        <span className="text-xs text-slate-500 font-sans">/ 100</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {cand.independentFamilyCount} Signal Families
                      </span>
                    </div>
                  </div>

                  {/* Arithmetic Box */}
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs font-mono space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Arithmetic Breakdown:
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center pt-1">
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                        <div className="text-[9px] text-slate-500">Digit Sum</div>
                        <div className="text-emerald-400 font-bold">
                          {cand.tens} + {cand.ones} = {cand.digitSum}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                        <div className="text-[9px] text-slate-500">Difference</div>
                        <div className="text-sky-400 font-bold">
                          |{cand.tens} - {cand.ones}| = {cand.digitDiff}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                        <div className="text-[9px] text-slate-500">Reverse (YX)</div>
                        <div className="text-amber-400 font-bold">{cand.reversePair}</div>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Signals Checklist */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                      <span>Supporting Signals Checklist:</span>
                      <span className="text-emerald-400 font-mono">
                        {cand.supportingSignals.length} Active
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {cand.supportingSignals.map((sig, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 flex items-start gap-2 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-[11px] truncate">
                                {sig.name}
                              </span>
                              <span className="font-mono text-emerald-400 font-bold text-[10px]">
                                +{sig.points} pts
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {sig.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(cand.pair, `card-${cand.pair}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === `card-${cand.pair}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedKey === `card-${cand.pair}` ? 'Copied' : 'Copy'}
                      </span>
                    </button>

                    {onSendPairsToSimulator && (
                      <button
                        type="button"
                        onClick={() => onSendPairsToSimulator([cand.pair])}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Simulate in Lab</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: BACKTESTING PERFORMANCE */}
      {/* ========================================================================= */}
      {isSectionVisible('9-backtesting') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                9. Walk-Forward / Out-of-Sample Backtesting Performance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict sequential zero-lookahead backtest: on every historical date, candidates are generated using <strong>only data available prior to that date</strong> and verified against actual outcomes.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {assessment.backtestReport.totalTestedDays} Sequential Market Days Tested
            </span>
          </div>

          {/* 4 Performance Metric Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Top 1 Hit Rate
              </span>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {assessment.backtestReport.top1HitRate}%
              </div>
              <div className="text-[10px] text-slate-500">Benchmark: 1%</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Top 5 Hit Rate
              </span>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {assessment.backtestReport.top5HitRate}%
              </div>
              <div className="text-[10px] text-slate-500">Benchmark: 5%</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">
                Top 10 Hit Rate
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {assessment.backtestReport.top10HitRate}%
              </div>
              <div className="text-[10px] text-slate-500">Benchmark: 10% (Random)</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-indigo-400 uppercase">
                Top 20 Hit Rate
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-300">
                {assessment.backtestReport.top20HitRate}%
              </div>
              <div className="text-[10px] text-slate-500">Benchmark: 20%</div>
            </div>
          </div>

          {/* Historical Step Logs Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Sequential Walk-Forward Audit Logs:
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/80 uppercase">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Training Sample</th>
                    <th className="py-2 px-3">Actual Draw Outcomes</th>
                    <th className="py-2 px-3">Top 5 Candidates</th>
                    <th className="py-2 px-3">Top 10 Candidates</th>
                    <th className="py-2 px-3">Top 10 Hit</th>
                    <th className="py-2 px-3">Matched Pairs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assessment.backtestReport.historySteps.map((step) => (
                    <tr key={step.date} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-bold text-slate-200">
                        {step.date}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {step.historicalSampleSize} obs
                      </td>
                      <td className="py-2 px-3 font-bold text-amber-300">
                        [{step.targetDrawPairs.join(', ')}]
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        [{step.top5Candidates.join(', ')}]
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        [{step.top10Candidates.join(', ')}]
                      </td>
                      <td className="py-2 px-3">
                        {step.hitTop10 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" /> HIT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 w-max block">
                            MISS
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-emerald-400">
                        {step.matchedPairs.length > 0
                          ? `[${step.matchedPairs.join(', ')}]`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 10: METHOD COMPARISON MATRIX */}
      {/* ========================================================================= */}
      {isSectionVisible('10-method-comparison') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              10. Method Comparison &amp; Standalone Signal Attribution Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compares the standalone backtested performance of each individual mathematical signal family against the combined multi-signal synthesis engine.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/80 uppercase">
                  <th className="py-2.5 px-3">Signal Family / Method</th>
                  <th className="py-2.5 px-3">Evaluations / Activations</th>
                  <th className="py-2.5 px-3">Matched Hits</th>
                  <th className="py-2.5 px-3">Individual Hit Rate</th>
                  <th className="py-2.5 px-3">Performance vs Combined Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Combined Synthesis Master Row */}
                <tr className="bg-indigo-500/10 font-bold">
                  <td className="py-2.5 px-3 text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Combined Multi-Signal Synthesis Model
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    {assessment.backtestReport.totalTestedDays * 10}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">
                    {assessment.backtestReport.top10HitCount}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">
                    {assessment.backtestReport.top10HitRate}% (Top-10)
                  </td>
                  <td className="py-2.5 px-3 text-indigo-300">
                    MASTER SYNTHESIS BENCHMARK
                  </td>
                </tr>

                {assessment.backtestReport.methodEffectiveness.map((m) => (
                  <tr key={m.family} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">
                      {m.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{m.activationCount}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.hitCount}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200">
                      {m.hitRate}%
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full"
                          style={{ width: `${Math.min(100, m.hitRate * 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 13: RESPONSIBLE STATISTICAL INTEGRITY NOTICE */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 space-y-1">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Statistical Integrity &amp; Responsible Mathematical Disclaimer</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          This system produces a <strong>relative pattern-strength ranking</strong> based on empirical historical observations, arithmetic decompositions, and backtested frequencies. In truly independent stochastic processes, past outcomes do not alter future probability distributions. No mathematical model can provide certainty or guaranteed predictions.
        </p>
      </div>
    </div>
  );
};
