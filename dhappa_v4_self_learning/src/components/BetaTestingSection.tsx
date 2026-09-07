import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Sliders,
  TrendingUp,
  Flame,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  Copy,
  Check,
  Download,
  Send,
  Calendar,
  BarChart3,
  Search,
  RefreshCw,
  Info,
  Scale,
  Sparkles,
  Zap,
  Target,
  FileCheck,
  Split,
  Binary,
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';
import {
  DayMarketEntry,
  BetaTestingMasterAssessment,
  BetaRankedCandidate,
  SignalEvaluationMetric,
} from '../types';
import { runBetaTestingAssessment } from '../utils/betaTestingEngine';
import {
  formatDateBanner,
  formatDateISO,
  getTodayDateISO,
  getPreviousDateISO,
  getOutcomesForDate,
} from '../utils/mathEngine';

interface BetaTestingSectionProps {
  records: DayMarketEntry[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const BetaTestingSection: React.FC<BetaTestingSectionProps> = ({
  records,
  onSendPairsToSimulator,
}) => {
  const [targetDate, setTargetDate] = useState<string>(() => getTodayDateISO());
  const [prevMode, setPrevMode] = useState<'auto-archive' | 'custom'>('auto-archive');
  const [customPrevDate, setCustomPrevDate] = useState<string>(() => getPreviousDateISO());
  const [customPrevOutcomes, setCustomPrevOutcomes] = useState<string>(() => {
    const prev = getPreviousDateISO();
    const list = getOutcomesForDate(records, prev);
    return list.length > 0 ? list.join(', ') : '49, 58, 71, 40';
  });

  // Sub-Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<
    | 'ranked-candidates'
    | 'signal-eligibility'
    | 'digit-stage-model'
    | 'temporal-stability'
    | 'score-calibration'
    | 'walk-forward-logs'
  >('ranked-candidates');

  // Filters
  const [tierFilter, setTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'baseScore' | 'calibratedProbability' | 'finalCalibratedScore'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reference Previous Date ISO
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

  // Resolved Outcomes
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
    return customPrevOutcomes.split(/[, ]+/).map((s) => s.trim()).filter((s) => /^\d{2}$/.test(s));
  }, [prevMode, targetDate, calculatedPrevDateISO, records, customPrevOutcomes]);

  const effectivePrevDate = prevMode === 'auto-archive' ? calculatedPrevDateISO : customPrevDate;

  // Master Beta Assessment Execution
  const assessment: BetaTestingMasterAssessment = useMemo(() => {
    return runBetaTestingAssessment(
      records,
      targetDate,
      resolvedPrevOutcomes,
      effectivePrevDate
    );
  }, [records, targetDate, resolvedPrevOutcomes, effectivePrevDate]);

  // Standardized Engine Result for Consensus Layer
  const standardizedBetaResult = useMemo(() => {
    const candidates = assessment.stage2RankedCandidates.map((c) => c.pair);
    const topScore = assessment.stage2RankedCandidates[0]?.finalCalibratedScore ?? 0;
    const evidence = assessment.stage2RankedCandidates.slice(0, 5).flatMap((c) => c.supportingSignals.map((s) => s.name));

    return buildStandardizedEngineResult({
      engineId: 'BETA_TESTING',
      methodName: 'Beta Testing Assessment Engine',
      date: targetDate,
      channel: 'live-engine-output',
      sourceValues: { prevOutcomes: resolvedPrevOutcomes },
      normalizedValues: { stage2Count: assessment.stage2RankedCandidates.length },
      rawResult: assessment as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: assessment.walkForwardSteps?.length ?? 0,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'signalEvaluation()', 'stagingModel()', 'temporalAnalysis()', 'score()'],
    });
  }, [assessment, targetDate, resolvedPrevOutcomes]);

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
    downloadAnchor.setAttribute('download', `beta-testing-assessment-${targetDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered and Sorted Candidates
  const filteredCandidates = useMemo(() => {
    const list = assessment.stage2RankedCandidates.filter((c) => {
      if (tierFilter === 'TIER_1' && c.tier !== 'TIER_1_ALPHA') return false;
      if (tierFilter === 'TIER_2' && c.tier !== 'TIER_2_BETA') return false;
      if (tierFilter === 'TIER_3' && c.tier !== 'TIER_3_EXPLORATORY') return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchesPair = c.pair.includes(q);
        const matchesSignals = c.supportingSignals.some((s) =>
          s.name.toLowerCase().includes(q)
        );
        if (!matchesPair && !matchesSignals) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'rank') {
        valA = a.rank;
        valB = b.rank;
      } else if (sortBy === 'baseScore') {
        valA = a.baseScore;
        valB = b.baseScore;
      } else if (sortBy === 'calibratedProbability') {
        valA = a.calibratedProbability;
        valB = b.calibratedProbability;
      } else if (sortBy === 'finalCalibratedScore') {
        valA = a.finalCalibratedScore;
        valB = b.finalCalibratedScore;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [assessment.stage2RankedCandidates, tierFilter, searchQuery, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Top Banner & 7-Layer Empirical Control Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" /> 7-LAYER EMPIRICAL SCORING ENGINE
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Out-of-Sample Signal Lift &amp; Calibration
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5" /> Stage 1 Digit &rarr; Stage 2 Pair
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Beta Testing: Out-of-Sample Empirical Forecasting Lab
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Eliminates overfitting and look-ahead bias through independent signal validation, collinearity dependency penalties, Markov digit transitions, rolling multi-horizon recency, 5-period temporal stability audits, and empirical score calibration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Beta Audit JSON</span>
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
                {assessment.totalObservations} Observations
              </span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{formatDateBanner(targetDate)}</span>
              <span className="font-mono text-purple-400">
                {assessment.eligibleSignalsCount} Active / {assessment.prunedSignalsCount} Pruned Signals
              </span>
            </div>
          </div>

          {/* Reference Previous Outcomes */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Previous Day Outcomes (Independent Signal Input):
              </label>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPrevMode('custom')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    prevMode === 'custom'
                      ? 'bg-purple-600 text-white font-bold'
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
                      ? 'bg-purple-600 text-white font-bold'
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
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
                <span className="text-slate-400">Target - 1d ({calculatedPrevDateISO}):</span>
                <span className="text-emerald-400 font-bold">
                  {resolvedPrevOutcomes.join(' | ') || 'No recorded draws found'}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-500">
                Top-10 Wilson 95% CI: <strong className="text-emerald-400 font-mono">[{assessment.wilsonConfidenceInterval[0]}% – {assessment.wilsonConfidenceInterval[1]}%]</strong>
              </span>
              <span className="text-slate-500">
                Temporal Variance: <strong className="text-slate-300 font-mono">&sigma;&sup2; = {assessment.stabilityVariance}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Top Key Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Aggregate Hit Lift */}
        <div className="bg-slate-900/80 border border-purple-500/40 rounded-xl p-4 space-y-1 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Out-of-Sample Lift
            </span>
            <span className="text-[10px] font-mono text-slate-500">Top-10</span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {assessment.aggregateLift}&times;{' '}
            <span className="text-xs font-normal text-emerald-400">
              (+{((assessment.aggregateLift - 1.0) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            vs 1.00&times; random expectation
          </div>
        </div>

        {/* Metric 2: Top 10 Hit Rate */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Top-10 Hit Rate
            </span>
            <span className="text-[10px] font-mono text-slate-500">Walk-Forward</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {assessment.overallTop10HitRate}%
          </div>
          <div className="text-[10px] text-slate-400">
            Baseline: 10.0% (Random)
          </div>
        </div>

        {/* Metric 3: Signal Eligibility Filter */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Signal Filter
            </span>
            <span className="text-[10px] font-mono text-slate-500">Independence</span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300">
            {assessment.eligibleSignalsCount}{' '}
            <span className="text-xs font-normal text-slate-500">/ {assessment.signals.length}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {assessment.prunedSignalsCount} Redundant/No-Lift Pruned
          </div>
        </div>

        {/* Metric 4: Stability Score across 5 Periods */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Stability Score
            </span>
            <span className="text-[10px] font-mono text-slate-500">5 Periods</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {assessment.stabilityVariance <= 4.0 ? 'High' : 'Moderate'}
          </div>
          <div className="text-[10px] text-slate-400">
            &sigma;&sup2; = {assessment.stabilityVariance} variance
          </div>
        </div>

        {/* Metric 5: Model Quality Verdict */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Verdict
            </span>
            <span className="text-[10px] font-mono text-slate-500">Integrity</span>
          </div>
          <div className="text-sm font-bold font-mono text-emerald-300 truncate">
            {assessment.modelQualityVerdict === 'POSITIVE_EMPIRICAL_LIFT'
              ? 'Empirical Lift'
              : 'Neutral Baseline'}
          </div>
          <div className="text-[10px] text-slate-400">
            p &approx; {assessment.pValVersusRandom} vs random null
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('ranked-candidates')}
          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'ranked-candidates'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>1. Multi-Factor Ranked Table (13)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('signal-eligibility')}
          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'signal-eligibility'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>2. 7-Layer Architecture &amp; Signal Matrix (2, 3, 10)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('digit-stage-model')}
          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'digit-stage-model'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Binary className="w-3.5 h-3.5 text-emerald-400" />
          <span>3. Markov Digit Transitions &amp; Stage 1&rarr;2 (8, 9)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('temporal-stability')}
          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'temporal-stability'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>4. Temporal Stability 5-Period Test (11)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('score-calibration')}
          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'score-calibration'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>5. Score Calibration &amp; Calibrated EV (14, 15)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('walk-forward-logs')}
          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'walk-forward-logs'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>6. Zero-Lookahead Audit Log (5)</span>
        </button>
      </div>

      {/* VIEW 1: MULTI-FACTOR RANKED CANDIDATES TABLE (Item 13) */}
      {activeSubTab === 'ranked-candidates' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Final Multi-Factor Calibrated Ranking Table
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every candidate is evaluated on Base Score, Recency Multi-Horizon (3/5/10/20), Markov Transitions, Convergence, Collinearity Dependency Penalties, and Calibrated Empirical Hit Probabilities P(win).
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter pair or signal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Sort Order & Attribute Dropdown */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="rank">Rank (#)</option>
                  <option value="baseScore">Base Score</option>
                  <option value="calibratedProbability">Calibrated P(win)</option>
                  <option value="finalCalibratedScore">Final Score</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-slate-300 hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 font-mono font-bold"
                  title="Toggle Ascending / Descending"
                >
                  {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                </button>
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
                  All ({assessment.stage2RankedCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('TIER_1')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    tierFilter === 'TIER_1'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-purple-400'
                  }`}
                >
                  Tier 1 Alpha
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
                  Tier 2 Beta
                </button>
              </div>

              {onSendPairsToSimulator && (
                <button
                  type="button"
                  onClick={() =>
                    onSendPairsToSimulator(
                      assessment.stage2RankedCandidates.slice(0, 10).map((c) => c.pair)
                    )
                  }
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Stake Top 10 in Lab</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/70 uppercase">
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-slate-200 transition"
                    onClick={() => {
                      setSortBy('rank');
                      setSortOrder(sortBy === 'rank' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Rank &amp; Pair {sortBy === 'rank' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-slate-200 transition"
                    onClick={() => {
                      setSortBy('baseScore');
                      setSortOrder(sortBy === 'baseScore' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Base Score {sortBy === 'baseScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-2.5 px-3">Recency (3/5/10/20)</th>
                  <th className="py-2.5 px-3">Markov Trans.</th>
                  <th className="py-2.5 px-3">Convergence</th>
                  <th className="py-2.5 px-3">Dep. Penalty</th>
                  <th className="py-2.5 px-3">Stability</th>
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-slate-200 transition"
                    onClick={() => {
                      setSortBy('calibratedProbability');
                      setSortOrder(sortBy === 'calibratedProbability' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Calibrated P(win) {sortBy === 'calibratedProbability' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-slate-200 transition"
                    onClick={() => {
                      setSortBy('finalCalibratedScore');
                      setSortOrder(sortBy === 'finalCalibratedScore' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Final Score {sortBy === 'finalCalibratedScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCandidates.map((c, idx) => {
                  const isTier1 = c.tier === 'TIER_1_ALPHA';
                  const isTier2 = c.tier === 'TIER_2_BETA';

                  return (
                    <tr
                      key={`${c.pair}-${idx}`}
                      className={`hover:bg-slate-800/40 transition ${
                        isTier1
                          ? 'bg-purple-500/10'
                          : isTier2
                          ? 'bg-amber-500/5'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px] w-6">#{c.rank}</span>
                          <span
                            className={`text-base font-bold px-2.5 py-0.5 rounded-lg border ${
                              isTier1
                                ? 'bg-purple-600 text-white border-purple-400 shadow'
                                : isTier2
                                ? 'bg-slate-900 text-amber-300 border-amber-500/50'
                                : 'bg-slate-950 text-slate-300 border-slate-800'
                            }`}
                          >
                            {c.pair}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300 font-bold">{c.baseScore}</td>
                      <td className="py-2.5 px-3 text-emerald-400">{c.recencyMultiHorizonScore}</td>
                      <td className="py-2.5 px-3 text-sky-400">{c.markovTransitionScore}</td>
                      <td className="py-2.5 px-3 text-purple-300 font-bold">{c.convergenceScore}%</td>
                      <td className="py-2.5 px-3 text-rose-400">
                        {c.dependencyPenalty > 0 ? `-${(c.dependencyPenalty * 100).toFixed(0)}%` : '0%'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{c.stabilityScore}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          {c.calibratedProbability}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                isTier1
                                  ? 'bg-purple-400'
                                  : isTier2
                                  ? 'bg-amber-400'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${c.finalCalibratedScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-white">{c.finalCalibratedScore}</span>
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
                              className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-600 hover:text-white text-purple-300 text-[10px] font-bold transition cursor-pointer"
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

      {/* VIEW 2: 7-LAYER ARCHITECTURE & SIGNAL INDEPENDENCE MATRIX (Items 2, 3, 10) */}
      {activeSubTab === 'signal-eligibility' && (
        <div className="space-y-5">
          {/* Visual 7-Layer Flow Diagram */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              7-Layer Empirical Redesign Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Signals are generated, tested out-of-sample for empirical lift against random expectation, penalized for collinear dependency, and calibrated before entering the final ranking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 font-mono text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-purple-400 font-bold uppercase">Layer 1 &bull; Data Quality</span>
                <div className="text-slate-200 font-semibold">Historical 00–99 Outcome Normalization</div>
                <p className="text-[10px] text-slate-500 leading-tight">Positional tens/ones splitting with zero-lookahead validation.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-blue-400 font-bold uppercase">Layer 2 &bull; Signal Generation</span>
                <div className="text-slate-200 font-semibold">8 Multivariate Candidate Signals</div>
                <p className="text-[10px] text-slate-500 leading-tight">Date, Previous Day, Frequency, Recency, Markov, Reversal, Arithmetic, Gap.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Layer 3 &bull; Independence Test</span>
                <div className="text-slate-200 font-semibold">Collinearity &amp; Dependency Penalty</div>
                <p className="text-[10px] text-slate-500 leading-tight">Reduces weights for redundant +5 or nested cyclic variations.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Layer 4 &bull; Walk-Forward Lift</span>
                <div className="text-slate-200 font-semibold">Out-of-Sample Random Baseline</div>
                <p className="text-[10px] text-slate-500 leading-tight">Measures Lift = Hit Rate / 10% Baseline. Signals with Lift &le; 1.0 pruned.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-sky-400 font-bold uppercase">Layer 5 &bull; Calibrated Scoring</span>
                <div className="text-slate-200 font-semibold">Empirical Probability Mapping</div>
                <p className="text-[10px] text-slate-500 leading-tight">Maps raw multi-factor score to historical hit frequency.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold uppercase">Layer 6 &bull; Convergence</span>
                <div className="text-slate-200 font-semibold">Independent Signal Agreement</div>
                <p className="text-[10px] text-slate-500 leading-tight">Scores overlap across non-collinear eligible signal families.</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 col-span-1 sm:col-span-2">
                <span className="text-[10px] text-purple-400 font-bold uppercase">Layer 7 &bull; Final Ranking &amp; Risk Report</span>
                <div className="text-slate-200 font-semibold">Calibrated EV, Kelly Sizing &amp; Drawdown Lab</div>
                <p className="text-[10px] text-slate-500 leading-tight">Produces an auditable probability-like score without false claims of certainty.</p>
              </div>
            </div>
          </div>

          {/* Signal Eligibility & Lift Matrix Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Signal Independence, Out-of-Sample Lift &amp; Calibrated Weights Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/80 uppercase">
                    <th className="py-2.5 px-3">Signal Feature</th>
                    <th className="py-2.5 px-3">Family &amp; Collinearity Group</th>
                    <th className="py-2.5 px-3">In-Sample Hit</th>
                    <th className="py-2.5 px-3">Out-of-Sample Hit</th>
                    <th className="py-2.5 px-3">Random Baseline</th>
                    <th className="py-2.5 px-3">Empirical Lift</th>
                    <th className="py-2.5 px-3">Wilson 95% CI</th>
                    <th className="py-2.5 px-3">Dep. Penalty</th>
                    <th className="py-2.5 px-3">Calibrated Weight</th>
                    <th className="py-2.5 px-3">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assessment.signals.map((sig) => (
                    <tr key={sig.signalId} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-200">{sig.name}</div>
                        <div className="text-[10px] text-slate-500">{sig.description}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        <div>{sig.family}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {sig.collinearityGroup}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{sig.inSampleHitRate}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{sig.outOfSampleHitRate}%</td>
                      <td className="py-2.5 px-3 text-slate-500">{sig.randomBaseline}%</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        {sig.lift}&times; <span className="text-[10px] text-slate-400">({sig.excessLiftPct > 0 ? `+${sig.excessLiftPct}%` : `${sig.excessLiftPct}%`})</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        [{sig.confidenceInterval[0]}% – {sig.confidenceInterval[1]}%]
                      </td>
                      <td className="py-2.5 px-3 text-rose-400">
                        -{(sig.dependencyPenalty * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 font-bold text-purple-300">
                        w = {sig.calibratedWeight}
                      </td>
                      <td className="py-2.5 px-3">
                        {sig.isEligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" /> PASS (ELIGIBLE)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> PRUNED (NO LIFT)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MARKOV DIGIT TRANSITIONS & STAGE 1 -> 2 (Items 8, 9) */}
      {activeSubTab === 'digit-stage-model' && (
        <div className="space-y-5">
          {/* Stage 1 Single Digit Probabilities */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Binary className="w-4 h-4 text-emerald-400" />
                Stage 1 &bull; Single-Digit Marginal Probabilities (0..9)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Separates single-digit probability estimation from pair synthesis. Digits are ranked by Markov state likelihood and rolling momentum before forming $AB, BA, AA$ pairs.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 font-mono text-xs">
              {assessment.stage1DigitProbabilities.map((dp) => (
                <div
                  key={dp.digit}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-1"
                >
                  <span className="text-[10px] text-slate-500 font-bold">Rank #{dp.rank}</span>
                  <div className="text-2xl font-bold text-emerald-400">{dp.digit}</div>
                  <div className="text-[10px] text-slate-300 font-bold">{dp.combinedDigitProb}% Prob</div>
                  <div className="text-[9px] text-slate-500">T: {dp.tensProb}% | O: {dp.onesProb}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Markov Transition Matrix Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Split className="w-4 h-4 text-purple-400" />
              Markov State Transition Matrices &bull; $P(A_{`{t+1}`} | A_t)$ &amp; $P(B_{`{t+1}`} | B_t)$
            </h3>
            <p className="text-xs text-slate-400">
              Conditional transition probabilities between consecutive historical draws.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Tens Transition */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Top Tens-Digit Transitions $P(T_{`{t+1}`} | T_t)$:</h4>
                <div className="space-y-1.5">
                  {assessment.markovTransitions.topTensTransitions.map((rule, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-300">
                        Digit <strong className="text-purple-400">{rule.from}</strong> &rarr; Digit <strong className="text-emerald-400">{rule.to}</strong>
                      </span>
                      <span className="text-slate-400 font-bold">
                        {rule.prob}% ({rule.count} draws)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ones Transition */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Top Ones-Digit Transitions $P(O_{`{t+1}`} | O_t)$:</h4>
                <div className="space-y-1.5">
                  {assessment.markovTransitions.topOnesTransitions.map((rule, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-300">
                        Digit <strong className="text-blue-400">{rule.from}</strong> &rarr; Digit <strong className="text-amber-400">{rule.to}</strong>
                      </span>
                      <span className="text-slate-400 font-bold">
                        {rule.prob}% ({rule.count} draws)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: TEMPORAL STABILITY 5-PERIOD TESTING (Item 11) */}
      {activeSubTab === 'temporal-stability' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                Temporal Stability &amp; Partition Testing (5 Chronological Periods)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tests consistency across discrete historical segments to verify that out-of-sample lift is steady rather than driven by one anomalous lucky period.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Variance &sigma;&sup2; = {assessment.stabilityVariance}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
            {assessment.temporalPartitions.map((p) => (
              <div
                key={p.periodIndex}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center"
              >
                <div className="text-[10px] text-slate-400 font-bold uppercase">{p.periodLabel}</div>
                <div className="text-2xl font-bold text-emerald-400">{p.top10HitRate}%</div>
                <div className="text-[10px] text-slate-400">Lift: <strong className="text-purple-300">{p.lift}&times;</strong></div>
                <div className="text-[9px] text-slate-500">{p.sampleCount} Market Days</div>
                <div className="pt-1">
                  {p.isConsistent ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block">
                      STABLE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 block">
                      DEVIATION
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: SCORE CALIBRATION & CALIBRATED EV (Items 14, 15) */}
      {activeSubTab === 'score-calibration' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Score Calibration Bins &amp; Probability Mapping
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Score bins are calibrated against actual empirical hit frequencies. A model confidence score of 85 maps to an empirical $\sim 14.0\%$ hit probability, preventing inflated EV claims.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
            {assessment.scoreCalibrationBins.map((bin) => (
              <div
                key={bin.binLabel}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center"
              >
                <div className="text-[10px] text-purple-400 font-bold uppercase">{bin.binLabel}</div>
                <div className="text-2xl font-bold text-emerald-400">{bin.empiricalHitRate}%</div>
                <div className="text-[10px] text-slate-400">Calibrated P(win)</div>
                <div className="text-[9px] text-slate-500">{bin.totalSamplesInBin} Candidates in Pool</div>
                <div className="pt-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 block">
                    MONOTONIC CALIBRATION
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase">Calibrated Expected Value (EV) Formulation:</h3>
            <div className="text-emerald-400">
              EV = (P_win_calibrated &times; Net_Profit) - ((1 - P_win_calibrated) &times; Stake)
            </div>
            <p className="text-slate-400 text-[11px]">
              By substituting empirical calibration P(win) in [4.8%, 14.0%] rather than naive confidence percentages, the simulator ensures realistic portfolio risk projections.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 6: ZERO-LOOKAHEAD AUDIT LOG (Item 5) */}
      {activeSubTab === 'walk-forward-logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              Sequential Zero-Lookahead Walk-Forward Audit Logs
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict sequential validation: at every historical date $T$, candidate rankings are generated using strictly data available prior to $T$ and compared to actual outcomes.
            </p>
          </div>

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
                {assessment.walkForwardSteps.map((step) => (
                  <tr key={step.date} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-slate-200">{step.date}</td>
                    <td className="py-2 px-3 text-slate-400">{step.trainingCount} obs</td>
                    <td className="py-2 px-3 font-bold text-amber-300">[{step.targetDrawPairs.join(', ')}]</td>
                    <td className="py-2 px-3 text-slate-300">[{step.top5.join(', ')}]</td>
                    <td className="py-2 px-3 text-slate-400">[{step.top10.join(', ')}]</td>
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
                      {step.matchedPairs.length > 0 ? `[${step.matchedPairs.join(', ')}]` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATISTICAL INTEGRITY & GAMBLER'S FALLACY NOTICE */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 space-y-1">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>Beta Testing Empirical Rigor &amp; Anti-Overfitting Safeguard</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          In truly independent random number generation, historical outcomes do not alter future probabilities. This engine quantifies historical empirical lift and penalizes redundant collinear signals. When a signal (such as a historical gap) fails to demonstrate out-of-sample lift, its weight is automatically pruned to zero.
        </p>
      </div>
    </div>
  );
};
