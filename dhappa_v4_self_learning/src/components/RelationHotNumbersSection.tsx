import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  GitCompare,
  ArrowRight,
  Info,
  Check,
  Copy,
  Download,
  Send,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Share2,
  Sliders,
  Filter,
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';
import { DayMarketEntry, CrossMethodConvergence, RankedHotPair } from '../types';
import {
  computeCrossMethodConvergence,
  formatDateISO,
  formatDateBanner,
  getTodayDateISO,
  getPreviousDateISO,
  getOutcomesForDate,
} from '../utils/mathEngine';

interface RelationHotNumbersSectionProps {
  records: DayMarketEntry[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const RelationHotNumbersSection: React.FC<RelationHotNumbersSectionProps> = ({
  records,
  onSendPairsToSimulator,
}) => {
  // Target Date Selection (Date Generator defaults to current date)
  const [targetDate, setTargetDate] = useState<string>(() => getTodayDateISO());
  
  // Previous Day Mode: Default to 'auto-archive'
  const [prevInputMode, setPrevInputMode] = useState<'auto-archive' | 'custom'>('auto-archive');
  const [customPrevDate, setCustomPrevDate] = useState<string>(() => getPreviousDateISO());
  const [customPrevOutcomes, setCustomPrevOutcomes] = useState<string>(() => {
    const prevDate = getPreviousDateISO();
    const list = getOutcomesForDate(records, prevDate);
    return list.length > 0 ? list.join(', ') : '49, 58, 71, 40';
  });

  // Filter for the ranked pairs table
  const [activeTierFilter, setActiveTierFilter] = useState<'ALL' | 'HOT' | 'MIRROR' | 'CORE' | 'EXCLUSIVE'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sorted records by date descending
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  // Compute previous date relative to target date (YYYY-MM-DD minus 1 day)
  const calculatedPrevDateISO = useMemo(() => {
    return getPreviousDateISO(targetDate);
  }, [targetDate]);

  // Auto sync customPrevOutcomes on targetDate or records change
  React.useEffect(() => {
    const list = getOutcomesForDate(records, calculatedPrevDateISO);
    if (list.length > 0) {
      setCustomPrevOutcomes(list.join(', '));
      setCustomPrevDate(calculatedPrevDateISO);
    }
  }, [records, targetDate, calculatedPrevDateISO]);

  // Auto-lookup outcomes from records if auto-archive mode is selected
  const resolvedPrevOutcomes = useMemo(() => {
    if (prevInputMode === 'auto-archive') {
      const matchOutcomes = getOutcomesForDate(records, calculatedPrevDateISO);
      if (matchOutcomes.length > 0) {
        return matchOutcomes;
      }
      // fallback to first available record if direct match not found
      if (records.length > 0) {
        for (const r of sortedRecords) {
          const out = getOutcomesForDate(records, r.date);
          if (out.length > 0) return out;
        }
      }
      return ['49', '58', '71', '40'];
    }
    return customPrevOutcomes;
  }, [prevInputMode, targetDate, calculatedPrevDateISO, records, sortedRecords, customPrevOutcomes]);

  const effectivePrevDate = prevInputMode === 'auto-archive' ? calculatedPrevDateISO : customPrevDate;

  // Compute Cross-Method Convergence
  const convergence: CrossMethodConvergence = useMemo(() => {
    return computeCrossMethodConvergence(targetDate, resolvedPrevOutcomes, effectivePrevDate);
  }, [targetDate, resolvedPrevOutcomes, effectivePrevDate]);

  // Standardized Engine Result for Consensus Layer
  const standardizedRelationHotResult = useMemo(() => {
    const candidates = convergence.rankedHotPairs.map((p) => p.pair);
    const topScore = convergence.rankedHotPairs[0]?.score ?? 0;
    const evidence = convergence.rankedHotPairs.slice(0, 5).map((p) => `convergence:${p.tier}`);

    return buildStandardizedEngineResult({
      engineId: 'RELATION_HOT_NUMBERS',
      methodName: 'Cross-Method Convergence Analysis',
      date: targetDate,
      channel: 'live-engine-output',
      sourceValues: { prevOutcomes: resolvedPrevOutcomes },
      normalizedValues: { totalHotPairs: candidates.length },
      rawResult: convergence as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: 0,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'mergeMethodOutputs()', 'computeConvergence()', 'rankByAgreement()', 'score()'],
    });
  }, [convergence, targetDate, resolvedPrevOutcomes]);

  // Preset Handlers
  const handlePreset = (preset: 'benchmark' | 'boundary0' | 'high-overlap' | 'tie-relation') => {
    if (preset === 'benchmark') {
      setTargetDate('2026-08-15');
      setPrevInputMode('custom');
      setCustomPrevDate('2026-08-14');
      setCustomPrevOutcomes('12, 49, 38, 71');
    } else if (preset === 'boundary0') {
      setTargetDate('2026-08-10'); // Day 10 -> X=0
      setPrevInputMode('custom');
      setCustomPrevDate('2026-08-09');
      setCustomPrevOutcomes('00, 12, 34, 56');
    } else if (preset === 'high-overlap') {
      setTargetDate('2026-08-25'); // Day 25 -> X=5 (Active: 1,2,3,7)
      setPrevInputMode('custom');
      setCustomPrevDate('2026-08-24');
      setCustomPrevOutcomes('21, 23, 72, 85');
    } else if (preset === 'tie-relation') {
      setTargetDate('2026-08-18'); // Day 18 -> X=8
      setPrevInputMode('custom');
      setCustomPrevDate('2026-08-17');
      setCustomPrevOutcomes('12, 21, 48, 79');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(convergence, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `relation-hot-numbers-${targetDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered ranked pairs
  const filteredRankedPairs = useMemo(() => {
    if (activeTierFilter === 'ALL') return convergence.rankedHotPairs;
    if (activeTierFilter === 'HOT') return convergence.rankedHotPairs.filter((p) => p.tier === 'HOT_EXACT');
    if (activeTierFilter === 'MIRROR') return convergence.rankedHotPairs.filter((p) => p.tier === 'MIRROR_MATCH');
    if (activeTierFilter === 'CORE') return convergence.rankedHotPairs.filter((p) => p.tier === 'CORE_DIGIT_PAIR');
    if (activeTierFilter === 'EXCLUSIVE') return convergence.rankedHotPairs.filter((p) => p.tier === 'METHOD_EXCLUSIVE');
    return convergence.rankedHotPairs;
  }, [convergence.rankedHotPairs, activeTierFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> HOT NUMBERS & CONVERGENCE
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-emerald-400" /> Cross-Method Relation Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Relation & Hot Number Discovery
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Synthesizes the <strong className="text-slate-200">Date Generator Method</strong> (day-of-month algebraic triad) with the <strong className="text-slate-200">Previous Day Repeated Digit Method</strong> (historical frequency peaks). Identifies high-confidence intersection pairs, shared active core digits, and palindrome mirror symmetries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Convergence JSON</span>
            </button>
          </div>
        </div>

        {/* Input Configuration Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Target Date (Date Generator) */}
          <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Date Generator Target Date:
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                X = {convergence.dateMethod.x}
              </span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{formatDateBanner(targetDate)}</span>
              <span className="font-mono text-emerald-400">12 Date Pairs</span>
            </div>
          </div>

          {/* Previous Day Method Input */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Previous Day Source Outcomes:
              </label>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPrevInputMode('custom')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    prevInputMode === 'custom'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manual Custom
                </button>
                <button
                  type="button"
                  onClick={() => setPrevInputMode('auto-archive')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    prevInputMode === 'auto-archive'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auto-Archive ({calculatedPrevDateISO})
                </button>
              </div>
            </div>

            {prevInputMode === 'custom' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPrevOutcomes}
                  onChange={(e) => setCustomPrevOutcomes(e.target.value)}
                  placeholder="e.g. 12, 49, 38, 71"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <input
                  type="date"
                  value={customPrevDate}
                  onChange={(e) => setCustomPrevDate(e.target.value)}
                  className="w-auto bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300"
                  title="Reference previous date"
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
                Peak X: <strong className="text-emerald-400 font-mono">{convergence.prevDayMethod.xValues.join(', ') || 'N/A'}</strong>
              </span>
              <span className="text-slate-500">
                Prev Method Pairs: <strong className="text-slate-300 font-mono">{convergence.prevDayMethod.allPrevPairs.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Demo Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Convergence Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset('benchmark')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Spec Benchmark (Aug 15 + Aug 14)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('high-overlap')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            High Overlap Day (Aug 25)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('boundary0')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Boundary X=0 (Aug 10)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('tie-relation')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
          >
            Tie Symmetry (Aug 18)
          </button>
        </div>
      </div>

      {/* Top 5 Key Analytical Convergence Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Exact Hot Numbers */}
        <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl p-4 space-y-1 relative overflow-hidden shadow-lg group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Hot Pairs
            </span>
            <span className="text-[10px] font-mono text-slate-500">Intersection</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {convergence.hotPairs.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Dual-method exact matches
          </div>
        </div>

        {/* Metric 2: Hot Core Digits */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Core Digits
            </span>
            <span className="text-[10px] font-mono text-slate-500">Active in Both</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {convergence.hotCoreDigits.length > 0 ? `[${convergence.hotCoreDigits.join(', ')}]` : 'None'}
          </div>
          <div className="text-[10px] text-slate-400">
            Shared active single digits
          </div>
        </div>

        {/* Metric 3: Palindrome / Mirror Pairs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <GitCompare className="w-3.5 h-3.5" /> Mirror Symmetries
            </span>
            <span className="text-[10px] font-mono text-slate-500">AB ↔ BA</span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {convergence.mirrorPairs.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Reverse pair bridges
          </div>
        </div>

        {/* Metric 4: Dual Excluded Digits */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Dual-Excluded
            </span>
            <span className="text-[10px] font-mono text-slate-500">Filtered Out</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {convergence.dualExcludedDigits.length > 0 ? `[${convergence.dualExcludedDigits.join(', ')}]` : 'None'}
          </div>
          <div className="text-[10px] text-slate-400">
            Ruled out by both formulas
          </div>
        </div>

        {/* Metric 5: Convergence Overlap Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Similarity
            </span>
            <span className="text-[10px] font-mono text-slate-500">Jaccard</span>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {convergence.jaccardSimilarity.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">
            {convergence.hotPairs.length} of {convergence.totalUnionPairsCount} total union pairs
          </div>
        </div>
      </div>

      {/* SECTION 1: 🌟 THE HOT NUMBERS SHOWCASE (PRIMARY CONVERGENCE FOCUS) */}
      <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 fill-slate-950" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Confirmed Hot Numbers (Dual-Method Intersection)
              </h2>
            </div>
            <p className="text-xs text-amber-300/80 mt-1">
              These numbers were independently selected by <strong>both</strong> the Date-Based Triad Formula AND the Previous Day Repeated Frequency Peak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(convergence.hotPairs.join(', '), 'hot-all')}
              disabled={convergence.hotPairs.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {copiedKey === 'hot-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'hot-all' ? 'Copied' : `Copy (${convergence.hotPairs.length}) Hot Pairs`}</span>
            </button>

            {onSendPairsToSimulator && (
              <button
                type="button"
                onClick={() => onSendPairsToSimulator(convergence.hotPairs)}
                disabled={convergence.hotPairs.length === 0}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Hot Pairs ({convergence.hotPairs.length})</span>
              </button>
            )}
          </div>
        </div>

        {convergence.hotPairs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-slate-300">
              No Exact Intersection Pairs Found for This Date Combination
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The active digit pool of the Date Generator ({convergence.dateMethod.activeDigits.join(',')}) does not overlap enough with the Previous Day Method ({convergence.prevDayMethod.allPrevActiveDigits.join(',')}) to produce exact matching pairs. Inspect mirror symmetries or core digit combinations below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {convergence.hotPairs.map((pair, idx) => {
              const d1 = pair[0];
              const d2 = pair[1];
              const isCopied = copiedKey === `hot-${pair}`;

              return (
                <div
                  key={`${pair}-${idx}`}
                  className="bg-slate-950 border-2 border-amber-500/50 hover:border-amber-400 rounded-xl p-3 text-center space-y-2 relative group transition-all transform hover:-translate-y-0.5 shadow-lg"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/80">
                    <span className="font-bold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-amber-400" /> HOT #{idx + 1}
                    </span>
                    <span className="bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">
                      100%
                    </span>
                  </div>

                  <div className="text-3xl font-mono font-black text-amber-300 tracking-wider">
                    {pair}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 bg-slate-900/90 py-1 rounded border border-slate-800">
                    Digits: <span className="text-emerald-400 font-bold">{d1}</span> &amp; <span className="text-emerald-400 font-bold">{d2}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(pair, `hot-${pair}`)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                      title="Copy pair"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {onSendPairsToSimulator && (
                      <button
                        type="button"
                        onClick={() => onSendPairsToSimulator([pair])}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-bold transition cursor-pointer"
                      >
                        Stake
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hot Numbers Analytical Confirmation Notice */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Shared Active Core Digits: <strong className="text-emerald-400">[{convergence.hotCoreDigits.join(', ')}]</strong> &bull; Forms <strong className="text-amber-400">{convergence.hotPairs.length}</strong> confirmed Hot Pairs out of 100 possible outcomes.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 shrink-0">
            Sample space filtered down by {((1 - (convergence.hotPairs.length / 100)) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* SECTION 2: SIDE-BY-SIDE METHOD RELATION ARCHITECTURE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Method Comparison &amp; Structural Relationship
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side comparative analysis of algebraic inputs, digit filters, and resulting permutation spaces.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Method A: Date Generator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Method A: Date Generator
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                Deterministic
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Target Date:</span>
                <span className="text-slate-200 font-bold">{convergence.targetDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Core Digit (X):</span>
                <span className="text-blue-400 font-bold">X = {convergence.dateMethod.x}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Base Triad:</span>
                <span className="text-slate-300">[{convergence.dateMethod.baseTriad.join(', ')}]</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Excluded (6):</span>
                <span className="text-rose-400">[{convergence.dateMethod.excludedDigits.join(', ')}]</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Active Pool (4):</span>
                <span className="text-emerald-400 font-bold">[{convergence.dateMethod.activeDigits.join(', ')}]</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Pairs:</span>
                <span className="text-slate-200 font-bold">{convergence.dateMethod.pairs.length} pairs (P(4,2))</span>
              </div>
            </div>

            {/* Compact Pairs Grid */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">All 12 Date Pairs:</div>
              <div className="flex flex-wrap gap-1">
                {convergence.dateMethod.pairs.map((p, idx) => {
                  const isHot = convergence.hotPairs.includes(p);
                  return (
                    <span
                      key={`${p}-${idx}`}
                      className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                        isHot
                          ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400 shadow'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Convergence Overlap Hub */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5" /> Relation &amp; Overlap Hub
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
                  Intersection
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Hot Core Digits (Active ∩ Active):</div>
                  <div className="text-emerald-400 font-bold text-sm">
                    {convergence.hotCoreDigits.length > 0 ? `[${convergence.hotCoreDigits.join(', ')}]` : 'None'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {convergence.hotCoreDigits.length} active digits agreed upon
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Dual Excluded (Excluded ∩ Excluded):</div>
                  <div className="text-rose-400 font-bold text-sm">
                    {convergence.dualExcludedDigits.length > 0 ? `[${convergence.dualExcludedDigits.join(', ')}]` : 'None'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Strongest filter: rejected by both formulas
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Palindromic / Mirror Pairs:</div>
                  <div className="text-indigo-400 font-bold text-xs">
                    {convergence.mirrorPairs.length > 0
                      ? convergence.mirrorPairs.map((m) => `${m.datePair} ↔ ${m.prevPair}`).join(', ')
                      : 'None'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Overlap Density:</span>
              <strong className="text-amber-400">{convergence.jaccardSimilarity.toFixed(1)}% Jaccard Index</strong>
            </div>
          </div>

          {/* Method B: Previous Day Method */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Method B: Previous Day Method
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                Historical Peak
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Previous Date:</span>
                <span className="text-slate-200 font-bold">{convergence.prevDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Peak Digit(s) X:</span>
                <span className="text-emerald-400 font-bold">X = {convergence.prevDayMethod.xValues.join(', ') || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Raw Outcomes:</span>
                <span className="text-slate-300">[{convergence.prevDayMethod.outcomes.join(', ')}]</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Excluded Digits:</span>
                <span className="text-rose-400">[{convergence.prevDayMethod.allPrevExcludedDigits.join(', ')}]</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Active Pool:</span>
                <span className="text-emerald-400 font-bold">[{convergence.prevDayMethod.allPrevActiveDigits.join(', ')}]</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Pairs:</span>
                <span className="text-slate-200 font-bold">{convergence.prevDayMethod.allPrevPairs.length} pairs</span>
              </div>
            </div>

            {/* Compact Pairs Grid */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">All Previous Day Pairs:</div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {convergence.prevDayMethod.allPrevPairs.map((p, pIdx) => {
                  const isHot = convergence.hotPairs.includes(p);
                  return (
                    <span
                      key={`${p}-${pIdx}`}
                      className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                        isHot
                          ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400 shadow'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: COMPREHENSIVE RANKED CONVERGENCE TABLE (TIERS 1-4) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Ranked Convergence Spectrum &amp; Candidate Classification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete catalog of active pairs evaluated across both mathematical frameworks, sorted by convergence score.
            </p>
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTierFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeTierFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({convergence.rankedHotPairs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierFilter('HOT')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeTierFilter === 'HOT'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              Hot Exact ({convergence.hotPairs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierFilter('MIRROR')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeTierFilter === 'MIRROR'
                  ? 'bg-indigo-500 text-white font-bold shadow'
                  : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              Mirror ({convergence.mirrorPairs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierFilter('CORE')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeTierFilter === 'CORE'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Core Digits
            </button>
            <button
              type="button"
              onClick={() => setActiveTierFilter('EXCLUSIVE')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeTierFilter === 'EXCLUSIVE'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single-Method
            </button>
          </div>
        </div>

        {/* Table / Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/60 uppercase">
                <th className="py-2.5 px-3">Rank &amp; Pair</th>
                <th className="py-2.5 px-3">Classification Tier</th>
                <th className="py-2.5 px-3">Convergence Score</th>
                <th className="py-2.5 px-3">Date Generator</th>
                <th className="py-2.5 px-3">Previous Day Method</th>
                <th className="py-2.5 px-3">Analytical Reason</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRankedPairs.map((item, idx) => {
                const isHot = item.tier === 'HOT_EXACT';
                const isMirror = item.tier === 'MIRROR_MATCH';
                const isCore = item.tier === 'CORE_DIGIT_PAIR';

                return (
                  <tr
                    key={`${item.pair}-${idx}`}
                    className={`hover:bg-slate-800/40 transition ${
                      isHot
                        ? 'bg-amber-500/10'
                        : isMirror
                        ? 'bg-indigo-500/5'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px] w-5">#{idx + 1}</span>
                        <span
                          className={`text-base font-bold px-2 py-0.5 rounded-lg border ${
                            isHot
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : isMirror
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                              : 'bg-slate-950 text-slate-200 border-slate-800'
                          }`}
                        >
                          {item.pair}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {isHot && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 w-max">
                          <Flame className="w-3 h-3 fill-amber-400" /> HOT (DUAL EXACT)
                        </span>
                      )}
                      {isMirror && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 w-max">
                          <GitCompare className="w-3 h-3" /> MIRROR SYMMETRY
                        </span>
                      )}
                      {isCore && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 w-max">
                          <Sparkles className="w-3 h-3" /> CORE DIGIT PAIR
                        </span>
                      )}
                      {!isHot && !isMirror && !isCore && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 w-max">
                          METHOD EXCLUSIVE
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              isHot
                                ? 'bg-amber-400'
                                : isMirror
                                ? 'bg-indigo-400'
                                : isCore
                                ? 'bg-emerald-400'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-200">{item.score}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {item.inDateMethod ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      {item.inPrevDayMethod ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 max-w-xs text-[11px] text-slate-300 font-sans">
                      {item.reasons.join(' • ')}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.pair, `row-${item.pair}`)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Copy pair"
                        >
                          {copiedKey === `row-${item.pair}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        {onSendPairsToSimulator && (
                          <button
                            type="button"
                            onClick={() => onSendPairsToSimulator([item.pair])}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[10px] font-bold transition cursor-pointer"
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
    </div>
  );
};
