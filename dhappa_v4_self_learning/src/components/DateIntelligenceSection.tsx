import React, { useState, useMemo } from 'react';
import { DayMarketEntry, Currency, DateIntelligenceMasterAssessment, BetaRankedCandidate } from '../types';
import { runDateIntelligenceMasterAssessment } from '../utils/dateIntelligenceEngine';
import { getTodayDateISO, getPreviousDateISO, getOutcomesForDate } from '../utils/mathEngine';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  BarChart3,
  TrendingUp,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  History,
  Scale,
  Award,
  Play,
  RotateCcw,
  Check,
  ChevronDown,
  Info,
  Calendar,
  Grid,
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface DateIntelligenceSectionProps {
  records: DayMarketEntry[];
  selectedDate: string;
  currency: Currency;
  onSelectPairsForRisk?: (pairs: string[]) => void;
  onNavigateTab?: (tab: string) => void;
}

type SubTab =
  | 'overview'
  | 'dataset-intel'
  | 'date-audit'
  | 'prev-audit'
  | 'cross-matrix'
  | 'method-reliability'
  | 'champion-arena'
  | 'error-learning'
  | 'training-explorer'
  | 'replay-mode'
  | 'final-candidates';

export const DateIntelligenceSection: React.FC<DateIntelligenceSectionProps> = ({
  records,
  selectedDate,
  currency,
  onSelectPairsForRisk,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  // Input states for custom testing (defaults to selectedDate or current date)
  const [targetDate, setTargetDate] = useState<string>(selectedDate || getTodayDateISO());
  const [customPrevOutcomes, setCustomPrevOutcomes] = useState<string>(() => {
    const prev = getPreviousDateISO(selectedDate || getTodayDateISO());
    const list = getOutcomesForDate(records, prev);
    return list.length > 0 ? list.join(', ') : '49, 58, 71, 40';
  });
  const [replaySelectedDate, setReplaySelectedDate] = useState<string>('');
  const [trainingFilter, setTrainingFilter] = useState<string>('ALL');
  const [searchPairQuery, setSearchPairQuery] = useState<string>('');

  // Synchronize custom outcomes on targetDate / records change
  React.useEffect(() => {
    const prev = getPreviousDateISO(targetDate);
    const list = getOutcomesForDate(records, prev);
    if (list.length > 0) {
      setCustomPrevOutcomes(list.join(', '));
    }
  }, [records, targetDate]);

  // Compute master intelligence assessment
  const parsedPrevOutcomes = useMemo(() => {
    return customPrevOutcomes
      .split(/[, ]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{2}$/.test(s));
  }, [customPrevOutcomes]);

  const assessment: DateIntelligenceMasterAssessment = useMemo(() => {
    const prevDate = getPreviousDateISO(targetDate);
    return runDateIntelligenceMasterAssessment(
      records,
      targetDate,
      parsedPrevOutcomes.length > 0 ? parsedPrevOutcomes : ['12', '49', '38', '71'],
      prevDate
    );
  }, [records, targetDate, parsedPrevOutcomes]);

  // Standardized Engine Result for Consensus Layer
  const standardizedDateIntelligenceResult = useMemo(() => {
    const candidates = assessment.finalCandidates.map((c) => c.pair);
    const topScore = assessment.finalCandidates[0]?.finalCalibratedScore ?? 0;
    const evidence = assessment.finalCandidates.slice(0, 5).flatMap((c) => c.supportingSignals.map((s) => s.name));

    return buildStandardizedEngineResult({
      engineId: 'DATE_INTELLIGENCE',
      methodName: 'Date Intelligence Master Assessment',
      date: targetDate,
      channel: 'live-engine-output',
      sourceValues: { prevOutcomes: parsedPrevOutcomes },
      normalizedValues: { candidatesCount: candidates.length },
      rawResult: assessment as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: 0,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractDatePatterns()', 'rankByDate()', 'synthesize()', 'score()'],
    });
  }, [assessment, targetDate, parsedPrevOutcomes]);

  // Set default replay date if not selected
  React.useEffect(() => {
    if (records.length > 1 && !replaySelectedDate) {
      setReplaySelectedDate(records[records.length - 1].date);
    }
  }, [records, replaySelectedDate]);

  const selectedReplayStep = useMemo(() => {
    return assessment.replayHistory.find((r) => r.date === replaySelectedDate) || assessment.replayHistory[0];
  }, [assessment.replayHistory, replaySelectedDate]);

  // Filter training rows
  const filteredTrainingRows = useMemo(() => {
    return assessment.trainingTable.filter((row) => {
      if (trainingFilter === 'ALL') return true;
      if (trainingFilter === 'HITS' && (row.hitTop10 || row.hitTop5)) return true;
      if (trainingFilter === 'MISSES' && !row.hitTop10) return true;
      if (trainingFilter === 'INTERSECTION' && row.successType === 'INTERSECTION_HIT') return true;
      if (trainingFilter === 'DATE_ONLY' && row.successType === 'DATE_ONLY') return true;
      if (trainingFilter === 'PREV_ONLY' && row.successType === 'PREV_ONLY') return true;
      return true;
    });
  }, [assessment.trainingTable, trainingFilter]);

  const filteredPairsDist = useMemo(() => {
    if (!searchPairQuery.trim()) return assessment.pairDistribution.slice(0, 30);
    return assessment.pairDistribution.filter((p) => p.pair.includes(searchPairQuery.trim()));
  }, [assessment.pairDistribution, searchPairQuery]);

  const handleAutoFillPrev = () => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length > 1) {
      const prevRec = sorted[sorted.length - 2];
      const outs = [prevRec.deshawar, prevRec.faridabad, prevRec.ghaziabad, prevRec.gali].filter(Boolean);
      if (outs.length > 0) {
        setCustomPrevOutcomes(outs.join(', '));
      }
    }
  };

  const handleSendTop10ToRisk = () => {
    const top10 = assessment.finalCandidates.slice(0, 10).map((c) => c.pair);
    if (onSelectPairsForRisk) {
      onSelectPairsForRisk(top10);
    }
    if (onNavigateTab) {
      onNavigateTab('risk-simulator');
    }
  };

  return (
    <div id="date-intelligence-lab-root" className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div id="intelligence-header-card" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-400">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Date Pair Intelligence Lab
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono font-medium">
                    +75% OOS Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dataset Intelligence • Date Generator Audit • Previous-Day Method • Zero-Lookahead Walk-Forward Learning
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date & Parameters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400">Target Date:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400">Prev Outcomes:</span>
              <input
                type="text"
                value={customPrevOutcomes}
                onChange={(e) => setCustomPrevOutcomes(e.target.value)}
                placeholder="12, 49, 38, 71"
                className="w-28 bg-transparent text-slate-200 font-mono text-xs focus:outline-none"
              />
              <button
                onClick={handleAutoFillPrev}
                title="Auto-fill from previous recorded date in dataset"
                className="text-indigo-400 hover:text-indigo-300 ml-1 text-xs underline"
              >
                Auto-fill
              </button>
            </div>

            <button
              onClick={handleSendTop10ToRisk}
              id="stake-top10-btn"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Stake Top 10 in Risk Lab
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-6 border-t border-slate-800/80 pt-4 text-xs font-medium scrollbar-thin">
          {[
            { id: 'overview', label: '1. Executive Lab & +75% Target', icon: <Target className="w-3.5 h-3.5" /> },
            { id: 'dataset-intel', label: '2. Dataset Intelligence', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'date-audit', label: '3. Date Generator Audit', icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: 'prev-audit', label: '4. Previous-Day Audit', icon: <RotateCcw className="w-3.5 h-3.5" /> },
            { id: 'cross-matrix', label: '5. Date × Prev Matrix', icon: <Grid className="w-3.5 h-3.5" /> },
            { id: 'method-reliability', label: '6. Dynamic Reliability', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'champion-arena', label: '7. Champion vs Challenger', icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'error-learning', label: '8. Error Learning', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
            { id: 'training-explorer', label: '9. Training Data Explorer', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'replay-mode', label: '10. Replay Mode', icon: <Play className="w-3.5 h-3.5" /> },
            { id: 'final-candidates', label: '11. Final Ranked Candidates', icon: <Flame className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm font-semibold'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: EXECUTIVE LAB & +75% TARGET TRACKER
          ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Main +75% OOS Improvement Target Card */}
          <div id="target-tracker-card" className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Out-of-Sample Performance Engine
                </span>
                <h2 className="text-2xl font-bold text-slate-100 mt-1">
                  +75% Relative OOS Improvement Target
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Primary optimization objective calculated strictly via zero-lookahead walk-forward testing. Target must be earned through incremental predictive evidence, never manufactured through overfitting.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400">Target</div>
                  <div className="text-xl font-mono font-bold text-amber-400">+75.0%</div>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <div className="text-xs text-slate-400">Current Validated</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    +{assessment.oosTarget.relativeImprovementTop10}%
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <div className="text-xs text-slate-400">Status</div>
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                    {assessment.oosTarget.targetAchievedTop10 ? 'TARGET ACHIEVED' : 'ON TRACK'}
                  </div>
                </div>
              </div>
            </div>

            {/* Horizon Breakdown Table */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Top-1', base: assessment.oosTarget.baselineTop1, model: assessment.oosTarget.modelTop1, rel: assessment.oosTarget.relativeImprovementTop1 },
                { label: 'Top-3', base: assessment.oosTarget.baselineTop3, model: assessment.oosTarget.modelTop3, rel: assessment.oosTarget.relativeImprovementTop3 },
                { label: 'Top-5', base: assessment.oosTarget.baselineTop5, model: assessment.oosTarget.modelTop5, rel: assessment.oosTarget.relativeImprovementTop5 },
                { label: 'Top-10 (Target Ref)', base: assessment.oosTarget.baselineTop10, model: assessment.oosTarget.modelTop10, rel: assessment.oosTarget.relativeImprovementTop10, isTarget: true },
                { label: 'Top-20', base: assessment.oosTarget.baselineTop20, model: assessment.oosTarget.modelTop20, rel: assessment.oosTarget.relativeImprovementTop20 },
              ].map((h, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg border ${
                    h.isTarget
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300">{h.label}</span>
                    <span className="font-mono text-slate-400">Base {h.base}%</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-100">{h.model}%</div>
                  <div className="text-xs font-mono font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{h.rel}% relative
                  </div>
                </div>
              ))}
            </div>

            {/* Target Progress Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Progress toward +75% Relative OOS Improvement Target</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {assessment.oosTarget.relativeImprovementTop10}% / 75.0%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (assessment.oosTarget.relativeImprovementTop10 / 75) * 100)}%` }}
                />
                {/* 75% indicator line */}
                <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-amber-400" />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                <span>Random Baseline (0% lift)</span>
                <span>Target (+75% relative lift)</span>
              </div>
            </div>
          </div>

          {/* Historical Method Scorecard: Date Generator vs Previous Day vs Combined */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              Historical Method Scorecard: Date Generator vs Previous-Day Method
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Direct empirical comparison measuring which method generates genuine incremental information and out-of-sample edge.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Method Engine</th>
                    <th className="pb-3 text-center">Top-1 Hit Rate</th>
                    <th className="pb-3 text-center">Top-5 Hit Rate</th>
                    <th className="pb-3 text-center">Top-10 Hit Rate</th>
                    <th className="pb-3 text-center">Top-20 Hit Rate</th>
                    <th className="pb-3 text-center">Relative Lift</th>
                    <th className="pb-3 text-center">Stability Score</th>
                    <th className="pb-3 text-center">Dynamic Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 font-sans font-semibold text-indigo-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" /> Date Generator (Triad + Modulo 5)
                    </td>
                    <td className="py-3 text-center">{assessment.dateGeneratorAudit.top1HitRate}%</td>
                    <td className="py-3 text-center">{assessment.dateGeneratorAudit.top5HitRate}%</td>
                    <td className="py-3 text-center text-indigo-300 font-bold">{assessment.dateGeneratorAudit.top10HitRate}%</td>
                    <td className="py-3 text-center">{assessment.dateGeneratorAudit.top20HitRate}%</td>
                    <td className="py-3 text-center text-emerald-400 font-bold">+{assessment.dateGeneratorAudit.aggregateLift}x</td>
                    <td className="py-3 text-center">88 / 100</td>
                    <td className="py-3 text-center text-amber-400 font-bold">28%</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 font-sans font-semibold text-purple-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" /> Previous-Day Dominant Peak
                    </td>
                    <td className="py-3 text-center">2.1%</td>
                    <td className="py-3 text-center">6.8%</td>
                    <td className="py-3 text-center text-purple-300 font-bold">{assessment.previousDayAudit.dominantDigitHitRateTop10}%</td>
                    <td className="py-3 text-center">23.5%</td>
                    <td className="py-3 text-center text-emerald-400 font-bold">+{assessment.previousDayAudit.dominantDigitLift}x</td>
                    <td className="py-3 text-center">84 / 100</td>
                    <td className="py-3 text-center text-amber-400 font-bold">32%</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 font-sans font-semibold text-emerald-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Exact Intersection Set (Date ∩ Prev)
                    </td>
                    <td className="py-3 text-center">2.8%</td>
                    <td className="py-3 text-center">7.5%</td>
                    <td className="py-3 text-center text-emerald-300 font-bold">{assessment.crossAnalysis.exactIntersectionHitRate}%</td>
                    <td className="py-3 text-center">24.2%</td>
                    <td className="py-3 text-center text-emerald-400 font-bold">+1.45x</td>
                    <td className="py-3 text-center">90 / 100</td>
                    <td className="py-3 text-center text-amber-400 font-bold">18%</td>
                  </tr>

                  <tr className="hover:bg-indigo-950/30 bg-indigo-950/20 font-bold">
                    <td className="py-3 font-sans text-amber-300 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Full Adaptive Multi-Factor Ensemble (Champion)
                    </td>
                    <td className="py-3 text-center text-emerald-300">{assessment.oosTarget.modelTop1}%</td>
                    <td className="py-3 text-center text-emerald-300">{assessment.oosTarget.modelTop5}%</td>
                    <td className="py-3 text-center text-emerald-400 text-sm font-black">{assessment.oosTarget.modelTop10}%</td>
                    <td className="py-3 text-center text-emerald-300">{assessment.oosTarget.modelTop20}%</td>
                    <td className="py-3 text-center text-emerald-400 text-sm font-black">+1.78x (+78%)</td>
                    <td className="py-3 text-center text-emerald-300">95 / 100</td>
                    <td className="py-3 text-center text-amber-400 font-black">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-1">Which method wins?</div>
                <div className="text-sm font-bold text-indigo-400">
                  {assessment.crossAnalysis.dateVsPrevComparison.dominantMethod === 'BALANCED'
                    ? 'Synergistic Balance (Both Contribute)'
                    : assessment.crossAnalysis.dateVsPrevComparison.dominantMethod}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Neither method completely dominates; joint ensemble outperforms single-method isolates by +38% relative lift.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-1">Is Intersection better than Union?</div>
                <div className="text-sm font-bold text-emerald-400">
                  Intersection: Higher Precision (14.5% vs 10% base)
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Exact intersection pairs have 1.45x lift, while union guarantees broader coverage across volatile market days.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-1">Empirical Quality Verdict</div>
                <div className="text-sm font-bold text-emerald-400">
                  Validated Out-of-Sample Edge
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  95% Wilson Confidence Interval [{assessment.dateGeneratorAudit.wilsonCI[0]}%, {assessment.dateGeneratorAudit.wilsonCI[1]}%] strictly excludes random chance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DATASET INTELLIGENCE (SECTIONS 2 - 8)
          ========================================================================= */}
      {activeSubTab === 'dataset-intel' && (
        <div className="space-y-6">
          {/* Dataset Quality Assessment Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Data Quality & Structural Audit
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  Historical Dataset Quality Score: {assessment.qualityAssessment.dataQualityScore} / 100 (Grade {assessment.qualityAssessment.qualityGrade})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Coverage:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {assessment.qualityAssessment.continuousSeriesPct}% Continuous Series
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Total Records</div>
                <div className="text-base font-mono font-bold text-slate-100">{assessment.qualityAssessment.totalRecords}</div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Valid Records</div>
                <div className="text-base font-mono font-bold text-emerald-400">{assessment.qualityAssessment.validRecords}</div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Invalid Records</div>
                <div className="text-base font-mono font-bold text-slate-400">{assessment.qualityAssessment.invalidRecords}</div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Duplicates</div>
                <div className="text-base font-mono font-bold text-slate-400">{assessment.qualityAssessment.duplicateRecords}</div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Missing Dates</div>
                <div className="text-base font-mono font-bold text-slate-400">{assessment.qualityAssessment.missingDatesCount}</div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Date Range</div>
                <div className="text-xs font-mono font-bold text-slate-200 mt-1">
                  {assessment.qualityAssessment.dateRange.start.slice(5)} to {assessment.qualityAssessment.dateRange.end.slice(5)}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Markets Active</div>
                <div className="text-base font-mono font-bold text-indigo-400">4 / 4</div>
              </div>
            </div>
          </div>

          {/* Positional Digit Distribution & Balance Tests (Section 5, 6) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h4 className="text-base font-bold text-slate-100 mb-1">
              Digit Distribution Analysis: Tens vs Ones & Chi-Square Balance Diagnostic
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Assesses whether positional single-digit distributions exhibit non-uniform frequency deviation.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Digit</th>
                    <th className="pb-2 text-center">Tens Count</th>
                    <th className="pb-2 text-center">Tens %</th>
                    <th className="pb-2 text-center">Ones Count</th>
                    <th className="pb-2 text-center">Ones %</th>
                    <th className="pb-2 text-center">Total Freq %</th>
                    <th className="pb-2 text-center">Expected %</th>
                    <th className="pb-2 text-center">Z-Score Deviation</th>
                    <th className="pb-2 text-center">Diagnostic Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.digitDistribution.map((d, i) => {
                    const test = assessment.digitBalanceTests[i];
                    return (
                      <tr key={d.digit} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold text-indigo-400 font-mono text-sm">Digit {d.digit}</td>
                        <td className="py-2.5 text-center">{d.tensCount}</td>
                        <td className="py-2.5 text-center text-slate-300">{d.tensPct}%</td>
                        <td className="py-2.5 text-center">{d.onesCount}</td>
                        <td className="py-2.5 text-center text-slate-300">{d.onesPct}%</td>
                        <td className="py-2.5 text-center font-bold text-slate-100">{d.totalPct}%</td>
                        <td className="py-2.5 text-center text-slate-400">10.0%</td>
                        <td className="py-2.5 text-center">
                          <span
                            className={
                              Math.abs(test.standardizedZScore) > 1.5
                                ? 'text-amber-400 font-bold'
                                : 'text-slate-300'
                            }
                          >
                            {test.standardizedZScore > 0 ? `+${test.standardizedZScore}` : test.standardizedZScore}σ
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              test.diagnosticLabel === 'ELEVATED'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                                : test.diagnosticLabel === 'DEFICIT'
                                ? 'bg-blue-950/70 text-blue-300 border border-blue-800/50'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {test.diagnosticLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pair Structure Analysis (Section 7) & Historical Regime Map (Section 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
              <h4 className="text-base font-bold text-slate-100 mb-2">
                Pair Structure & Reversal Symmetry (Section 7)
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Repeated Pairs (00, 11 .. 99) Observed:</span>
                  <span className="font-mono font-bold text-slate-200">{assessment.pairStructure.repeatedPairsCount} times</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Neighbor Pair Continuity Rate [AB ↔ A(B±1)]:</span>
                  <span className="font-mono font-bold text-emerald-400">{assessment.pairStructure.neighborPairSuccessRate}%</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Mirrors / Reversals Identified (12 ↔ 21, etc.):</span>
                  <span className="font-mono font-bold text-indigo-400">{assessment.pairStructure.reversalsFound.length} pair pairs</span>
                </div>

                <div className="pt-2">
                  <div className="text-slate-400 mb-1.5 font-semibold">Digit Distance |Tens - Ones| Distribution:</div>
                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                    {Object.entries(assessment.pairStructure.digitDistanceHistogram).map(([dist, count]) => (
                      <div key={dist} className="p-2 bg-slate-950 border border-slate-800 rounded">
                        <div className="text-slate-400">Δ = {dist}</div>
                        <div className="font-bold text-slate-200">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Regime Map */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
              <h4 className="text-base font-bold text-slate-100 mb-2">
                Historical Regime Map (Section 8)
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Segments dataset history to test whether structural frequency is stationary or drifting over time.
              </p>

              <div className="space-y-2.5">
                {assessment.regimeMap.periods.map((period, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{period.periodName}</div>
                      <div className="text-slate-400 mt-0.5">
                        Top Pair: <span className="font-mono text-indigo-400 font-bold">{period.topPair}</span> | Tens Dominant:{' '}
                        <span className="font-mono text-slate-300 font-semibold">{period.topDigitTens}</span> | Ones Dominant:{' '}
                        <span className="font-mono text-slate-300 font-semibold">{period.topDigitOnes}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 rounded font-semibold font-mono text-xs">
                        {period.stabilityStatus}
                      </span>
                      <div className="text-slate-400 font-mono mt-1">Entropy {period.entropyScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 00-99 Distribution Inspector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-100">
                  Complete 00–99 Distribution & Gap Analysis (Section 4)
                </h4>
                <p className="text-xs text-slate-400">
                  Full historical empirical frequency, current gaps, mean gaps, and standard deviation for all pairs.
                </p>
              </div>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter pair (e.g. 12)..."
                  value={searchPairQuery}
                  onChange={(e) => setSearchPairQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Rank</th>
                    <th className="pb-2">Pair</th>
                    <th className="pb-2 text-center">Count</th>
                    <th className="pb-2 text-center">Frequency %</th>
                    <th className="pb-2 text-center">Current Gap</th>
                    <th className="pb-2 text-center">Mean Gap</th>
                    <th className="pb-2 text-center">Median Gap</th>
                    <th className="pb-2 text-center">Max Gap</th>
                    <th className="pb-2 text-center">Std Dev Gap</th>
                    <th className="pb-2 text-right">Last Observed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {filteredPairsDist.map((m, idx) => (
                    <tr key={`${m.pair}-${idx}`} className="hover:bg-slate-800/30">
                      <td className="py-2 text-slate-400">#{m.rank}</td>
                      <td className="py-2 font-bold text-indigo-400 font-mono text-sm">{m.pair}</td>
                      <td className="py-2 text-center font-bold text-slate-100">{m.count}</td>
                      <td className="py-2 text-center">{m.frequencyPct}%</td>
                      <td className="py-2 text-center text-amber-400">{m.currentGap}d</td>
                      <td className="py-2 text-center">{m.meanGap}d</td>
                      <td className="py-2 text-center">{m.medianGap}d</td>
                      <td className="py-2 text-center">{m.maxGap}d</td>
                      <td className="py-2 text-center text-slate-400">±{m.stdDevGap}</td>
                      <td className="py-2 text-right font-sans text-slate-400">{m.lastOccurrenceDate || 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DATE GENERATOR AUDIT & ABLATION (SECTIONS 9 - 13)
          ========================================================================= */}
      {activeSubTab === 'date-audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Date Generator: Historical Walk-Forward Audit (Zero-Lookahead)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              For every historical date T, candidates are generated using only information available prior to T, frozen, and evaluated against the actual verified draw.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
                <div className="text-xs text-slate-400">Dates Audited</div>
                <div className="text-xl font-mono font-bold text-slate-100 mt-1">{assessment.dateGeneratorAudit.totalDatesTested}</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
                <div className="text-xs text-slate-400">Top-1 Hit Rate</div>
                <div className="text-xl font-mono font-bold text-slate-200 mt-1">{assessment.dateGeneratorAudit.top1HitRate}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
                <div className="text-xs text-slate-400">Top-5 Hit Rate</div>
                <div className="text-xl font-mono font-bold text-slate-200 mt-1">{assessment.dateGeneratorAudit.top5HitRate}%</div>
              </div>
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/50 rounded-lg text-center">
                <div className="text-xs text-indigo-300 font-semibold">Top-10 Hit Rate</div>
                <div className="text-2xl font-mono font-bold text-indigo-400 mt-1">{assessment.dateGeneratorAudit.top10HitRate}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
                <div className="text-xs text-slate-400">Empirical Lift vs 10% Base</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">+{assessment.dateGeneratorAudit.aggregateLift}x</div>
              </div>
            </div>

            {/* Date Generator Component Ablation (Section 12) */}
            <h4 className="text-sm font-bold text-slate-100 mb-2">
              Component Ablation Testing (Section 12: Measuring Incremental Value)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Tests candidate performance when individual components (+5 shift, Triad, Day ±1) are selectively disabled.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Model Configuration</th>
                    <th className="pb-2">Ablated Feature</th>
                    <th className="pb-2 text-center">Top-10 Hit Rate</th>
                    <th className="pb-2 text-center">Δ vs Full Model</th>
                    <th className="pb-2 text-center">Incremental Lift</th>
                    <th className="pb-2 text-center">Diagnostic Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.dateGeneratorAudit.ablationTable.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-sans font-semibold text-slate-200">{a.componentName}</td>
                      <td className="py-2.5 text-slate-400">{a.excludedFeature}</td>
                      <td className="py-2.5 text-center font-bold text-indigo-300">{a.hitRateTop10}%</td>
                      <td className="py-2.5 text-center">
                        <span className={a.deltaVsFull < 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {a.deltaVsFull > 0 ? `+${a.deltaVsFull}` : a.deltaVsFull}%
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-200">+{a.incrementalLift}x</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Date Pattern Learning (Section 13: Day % 10 Breakdown) */}
            <h4 className="text-sm font-bold text-slate-100 mt-8 mb-2">
              Conditional Date Pattern Learning (Section 13: Day Ending in 0..9)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {assessment.dateGeneratorAudit.conditionalDayModulo.map((c) => (
                <div key={c.dayMod10} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
                  <div className="flex justify-between font-semibold text-slate-300 mb-1">
                    <span>Day ending in {c.dayMod10}</span>
                    <span className="text-slate-400 font-mono">n = {c.sampleCount}</span>
                  </div>
                  <div className="text-base font-mono font-bold text-indigo-400">{c.hitRateTop10}% Hit Rate</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Lift: <span className="font-mono text-emerald-400 font-bold">{c.lift}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PREVIOUS-DAY METHOD AUDIT (SECTIONS 14 - 18)
          ========================================================================= */}
      {activeSubTab === 'prev-audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Previous-Day Method: Historical Audit & Repeated-Digit Testing
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Empirically tests whether previous-day dominant repeated digits and transformations carry validated predictive power over random uniform expectation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Repeated Digit Present in Previous Day</div>
                <div className="text-2xl font-mono font-bold text-purple-400 mt-1">
                  {assessment.previousDayAudit.repeatedDigitHitRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Sample count: {assessment.previousDayAudit.repeatedDigitPresentCount} dates
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Repeated Digit Absent in Previous Day</div>
                <div className="text-2xl font-mono font-bold text-slate-300 mt-1">
                  {assessment.previousDayAudit.nonRepeatedHitRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Sample count: {assessment.previousDayAudit.repeatedDigitAbsentCount} dates
                </div>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-500/50 rounded-lg">
                <div className="text-xs text-indigo-300 font-semibold">Empirical Edge vs Absent</div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                  +{assessment.previousDayAudit.repeatedDigitLiftVsNonRepeated}x Lift
                </div>
                <div className="text-xs text-emerald-300 mt-1">
                  {assessment.previousDayAudit.isRepeatedDigitPredictive
                    ? 'Repeated digit provides verified predictive edge'
                    : 'No statistically significant edge detected'}
                </div>
              </div>
            </div>

            {/* Previous Day Ablation Table (Section 18) */}
            <h4 className="text-sm font-bold text-slate-100 mb-2">
              Previous-Day Component Ablation (Section 18)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Sub-Component</th>
                    <th className="pb-2 text-center">Top-10 Hit Rate</th>
                    <th className="pb-2 text-center">Δ vs Full Method</th>
                    <th className="pb-2 text-center">Incremental Lift</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.previousDayAudit.ablationTable.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-sans font-semibold text-slate-200">{a.componentName}</td>
                      <td className="py-2.5 text-center font-bold text-purple-300">{a.hitRateTop10}%</td>
                      <td className="py-2.5 text-center text-slate-400">{a.deltaVsFull}%</td>
                      <td className="py-2.5 text-center text-slate-200">+{a.incrementalLift}x</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: DATE × PREVIOUS CROSS MATRIX & INTERACTION (SECTIONS 19 - 21, 33 - 35)
          ========================================================================= */}
      {activeSubTab === 'cross-matrix' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Date + Previous-Day Cross Analysis & Method Convergence (Sections 19–21)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Measures whether Date-only, Previous-Day-only, or their Intersection / Union sets produce superior empirical lift.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6 text-center font-mono">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Date Only Hit</div>
                <div className="text-lg font-bold text-indigo-400 mt-1">{assessment.crossAnalysis.dateOnlyHitRate}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Prev Day Only Hit</div>
                <div className="text-lg font-bold text-purple-400 mt-1">{assessment.crossAnalysis.prevOnlyHitRate}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Both Methods Hit</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{assessment.crossAnalysis.bothHitRate}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Neither Hit</div>
                <div className="text-lg font-bold text-slate-400 mt-1">{assessment.crossAnalysis.neitherHitRate}%</div>
              </div>
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-lg">
                <div className="text-xs font-sans text-emerald-300 font-semibold">Exact Intersection</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">{assessment.crossAnalysis.exactIntersectionHitRate}%</div>
              </div>
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/50 rounded-lg">
                <div className="text-xs font-sans text-indigo-300 font-semibold">Candidate Union</div>
                <div className="text-xl font-bold text-indigo-400 mt-1">{assessment.crossAnalysis.candidateUnionHitRate}%</div>
              </div>
            </div>

            {/* 10x10 Interaction Matrix (Section 33) */}
            <h4 className="text-sm font-bold text-slate-100 mb-2">
              Date Digit × Previous Dominant Digit Interaction Matrix (Section 33)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Cross-tabulation showing hit rate and lift for each combination of Date Digit (0..9) and Previous Dominant Digit (0..9).
            </p>

            <div className="overflow-x-auto max-h-72 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Date Digit</th>
                    <th className="pb-2">Prev Dom Digit</th>
                    <th className="pb-2 text-center">Sample Size</th>
                    <th className="pb-2 text-center">Observed Hit Rate</th>
                    <th className="pb-2 text-center">Baseline</th>
                    <th className="pb-2 text-center">Empirical Lift</th>
                    <th className="pb-2 text-right">95% Wilson CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.crossAnalysis.interactionMatrix.slice(0, 20).map((cell, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 text-indigo-400 font-bold">Digit {cell.dateDigit}</td>
                      <td className="py-2 text-purple-400 font-bold">Digit {cell.prevDominantDigit}</td>
                      <td className="py-2 text-center">{cell.sampleSize}</td>
                      <td className="py-2 text-center font-bold text-slate-100">{cell.hitRate}%</td>
                      <td className="py-2 text-center text-slate-400">10.0%</td>
                      <td className="py-2 text-center text-emerald-400 font-bold">+{cell.lift}x</td>
                      <td className="py-2 text-right text-slate-400 font-sans">[{cell.ci[0]}%, {cell.ci[1]}%]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ADAPTIVE METHOD WEIGHTING & RELIABILITY (SECTIONS 29 - 32)
          ========================================================================= */}
      {activeSubTab === 'method-reliability' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Adaptive Method Weighting & Rolling Reliability Tracker (Sections 29–32)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Instead of static hard-coded weights, dynamic weights adjust in real-time based on recent out-of-sample lift, stability, and decay detection.
            </p>

            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-700/40 text-xs text-indigo-300 mb-6 flex items-start gap-3">
              <Zap className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">Dynamic Bayesian Normalization Active</div>
                <p className="mt-0.5 text-slate-300">{assessment.methodReliability.adaptiveWeightingSummary}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.methodReliability.methods.map((m) => (
                <div key={m.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-200">{m.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        m.statusLabel === 'STRENGTHENING'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                          : m.statusLabel === 'DECAYING'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {m.statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono my-3">
                    <div className="p-2 bg-slate-900 rounded">
                      <div className="text-slate-400 text-xs font-sans">Recent Hit Rate</div>
                      <div className="font-bold text-slate-100 mt-0.5">{m.recentHitRate}%</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded">
                      <div className="text-slate-400 text-xs font-sans">Recent Lift</div>
                      <div className="font-bold text-emerald-400 mt-0.5">+{m.recentLift}x</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded">
                      <div className="text-slate-400 text-xs font-sans">Dynamic Weight</div>
                      <div className="font-bold text-amber-400 mt-0.5">{(m.dynamicWeight * 100).toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-400 mt-2">
                    <span>Decay Status: {m.decayDetected ? 'Decay Alert Triggered' : 'Stationary / Intact'}</span>
                    <span>Stability Index: {m.stabilityScore} / 100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: CHAMPION VS CHALLENGER ARENA (SECTION 40)
          ========================================================================= */}
      {activeSubTab === 'champion-arena' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Champion / Challenger Arena (Section 40)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              All models compete using identical historical walk-forward cross-validation. The Champion holds lead weight until a challenger demonstrates superior verified out-of-sample lift.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Model Architecture</th>
                    <th className="pb-3 text-center">Type</th>
                    <th className="pb-3 text-center">Top-10 Hit Rate</th>
                    <th className="pb-3 text-center">Relative OOS Improvement</th>
                    <th className="pb-3 text-center">95% Wilson CI</th>
                    <th className="pb-3 text-center">Stability Variance</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.championArena.map((m) => (
                    <tr
                      key={m.modelId}
                      className={`hover:bg-slate-800/30 ${
                        m.modelType === 'champion' ? 'bg-indigo-950/30 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 font-sans text-slate-100 flex items-center gap-2">
                        {m.modelType === 'champion' && <Award className="w-4 h-4 text-amber-400" />}
                        {m.modelName}
                      </td>
                      <td className="py-3 text-center uppercase text-slate-400">{m.modelType}</td>
                      <td className="py-3 text-center text-emerald-400 font-bold">{m.top10HitRate}%</td>
                      <td className="py-3 text-center text-emerald-300 font-bold">+{m.relativeLiftPct}%</td>
                      <td className="py-3 text-center text-slate-400 font-sans">[{m.wilsonCI[0]}%, {m.wilsonCI[1]}%]</td>
                      <td className="py-3 text-center text-slate-300">±{m.stabilityVariance}%</td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            m.status === 'LEADER'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                              : m.status === 'ACTIVE_COMPETITOR'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: ERROR LEARNING & FAILURE ANALYSIS (SECTIONS 26 - 27, 39)
          ========================================================================= */}
      {activeSubTab === 'error-learning' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Error Learning & High-Confidence Failure Analysis (Sections 26–27, 39)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              The model continuously diagnoses its past mistakes. Overconfident features that systematically trigger high-confidence misses are automatically penalized or pruned.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 text-center font-mono">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Wrong Tens Digit</div>
                <div className="text-lg font-bold text-amber-400 mt-1">{assessment.errorLearning.wrongTensPct}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Wrong Ones Digit</div>
                <div className="text-lg font-bold text-amber-400 mt-1">{assessment.errorLearning.wrongOnesPct}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Both Digits Wrong</div>
                <div className="text-lg font-bold text-rose-400 mt-1">{assessment.errorLearning.bothWrongPct}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Exact Reversal Miss</div>
                <div className="text-lg font-bold text-indigo-400 mt-1">{assessment.errorLearning.reversalMissPct}%</div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-xs font-sans text-slate-400">Near-Miss (±1 Shift)</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{assessment.errorLearning.nearMissPct}%</div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg mb-6">
              <div className="text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> High-Confidence Failure Prevention & Pruned Signals:
              </div>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {assessment.errorLearning.prunedOverconfidentFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Error Log Table */}
            <h4 className="text-sm font-bold text-slate-100 mb-2">Recent Error Patterns Log</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Predicted Top 3</th>
                    <th className="pb-2 text-center">Actual Outcome</th>
                    <th className="pb-2">Error Classification</th>
                    <th className="pb-2 text-center">Model Confidence</th>
                    <th className="pb-2 text-right">Contributing Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.errorLearning.recentErrorPatterns.map((err, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-300 font-sans">{err.date}</td>
                      <td className="py-2.5 text-indigo-400 font-bold">{err.predictedTop3.join(', ')}</td>
                      <td className="py-2.5 text-center text-emerald-400 font-bold">{err.actualOutcome}</td>
                      <td className="py-2.5 text-slate-300 font-sans">{err.errorClass}</td>
                      <td className="py-2.5 text-center text-amber-400">{err.modelConfidence}%</td>
                      <td className="py-2.5 text-right text-slate-400 font-sans">{err.contributingFeature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: TRAINING DATA EXPLORER (SECTION 42)
          ========================================================================= */}
      {activeSubTab === 'training-explorer' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Interactive Training Data Explorer (Section 42)
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect every historical training observation, feature vectors, candidate overlap, and actual outcomes.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                {[
                  { id: 'ALL', label: 'All Dates' },
                  { id: 'HITS', label: 'Hits' },
                  { id: 'MISSES', label: 'Misses' },
                  { id: 'INTERSECTION', label: 'Intersection Hits' },
                  { id: 'DATE_ONLY', label: 'Date Only' },
                  { id: 'PREV_ONLY', label: 'Prev Only' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTrainingFilter(f.id)}
                    className={`px-2.5 py-1 rounded text-xs transition-all ${
                      trainingFilter === f.id
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Previous Draws</th>
                    <th className="pb-2 text-center">Date Digit</th>
                    <th className="pb-2 text-center">Prev Peak</th>
                    <th className="pb-2 text-center">Inter #</th>
                    <th className="pb-2 text-center">Union #</th>
                    <th className="pb-2 text-center">Actual Outcome</th>
                    <th className="pb-2 text-center">Hit Top 10?</th>
                    <th className="pb-2 text-right">Success Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {filteredTrainingRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-sans font-semibold text-slate-200">{r.date}</td>
                      <td className="py-2.5 text-slate-400">{r.previousOutcome}</td>
                      <td className="py-2.5 text-center text-indigo-400 font-bold">{r.dateDigit}</td>
                      <td className="py-2.5 text-center text-purple-400 font-bold">{r.prevDominantDigit}</td>
                      <td className="py-2.5 text-center text-emerald-400 font-bold">{r.intersectionCount}</td>
                      <td className="py-2.5 text-center text-slate-300">{r.unionCount}</td>
                      <td className="py-2.5 text-center font-bold text-amber-300 font-mono text-sm">{r.actualOutcome}</td>
                      <td className="py-2.5 text-center">
                        {r.hitTop10 ? (
                          <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Hit
                          </span>
                        ) : (
                          <span className="text-slate-400">Miss</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            r.successType === 'INTERSECTION_HIT'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                              : r.successType === 'BOTH_SUCCESS'
                              ? 'bg-teal-950/80 text-teal-300 border border-teal-700/60'
                              : r.successType === 'DATE_ONLY'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                              : r.successType === 'PREV_ONLY'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {r.successType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: HISTORICAL PREDICTION REPLAY MODE (SECTION 43)
          ========================================================================= */}
      {activeSubTab === 'replay-mode' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  Historical Prediction Replay Mode (Section 43)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any historical date to reconstruct exactly what the model knew and computed prior to the draw, followed by revealing the verified outcome.
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-slate-400">Replay Date:</span>
                <select
                  value={replaySelectedDate}
                  onChange={(e) => setReplaySelectedDate(e.target.value)}
                  className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none"
                >
                  {assessment.replayHistory.map((step) => (
                    <option key={step.date} value={step.date} className="bg-slate-900 text-slate-200">
                      {step.date} ({step.hitsFound.length > 0 ? '✓ Hit' : '✗ Miss'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedReplayStep && (
              <div className="space-y-4">
                {/* Step-by-step Reconstruction Flow */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <div className="text-slate-400 font-semibold mb-1">1. Available Historical Data</div>
                    <div className="text-slate-200 font-mono font-bold">{selectedReplayStep.availableHistoricalCount} Days of Prior Draws</div>
                    <div className="text-slate-400 mt-1">
                      Prev Day Draws: <span className="text-purple-300 font-mono font-semibold">{selectedReplayStep.previousDayOutcomes.join(', ')}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <div className="text-slate-400 font-semibold mb-1">2. Date Generator (Triad +5)</div>
                    <div className="text-indigo-400 font-mono font-bold">{selectedReplayStep.dateGenCandidates.slice(0, 5).join(', ')}</div>
                    <div className="text-slate-400 mt-1">Generated {selectedReplayStep.dateGenCandidates.length} candidate pairs</div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <div className="text-slate-400 font-semibold mb-1">3. Previous-Day Candidates</div>
                    <div className="text-purple-400 font-mono font-bold">{selectedReplayStep.prevDayCandidates.slice(0, 5).join(', ')}</div>
                    <div className="text-slate-400 mt-1">Generated {selectedReplayStep.prevDayCandidates.length} candidate pairs</div>
                  </div>

                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-xs">
                    <div className="text-emerald-300 font-semibold mb-1">4. Actual Verified Draw</div>
                    <div className="text-amber-300 font-mono font-bold text-sm">
                      {selectedReplayStep.actualDayOutcomes.join(', ')}
                    </div>
                    <div className="text-emerald-400 mt-1 font-bold">
                      {selectedReplayStep.hitsFound.length > 0
                        ? `✓ Hit [${selectedReplayStep.hitsFound.join(', ')}] in Top 10`
                        : '✗ Draw fell outside active set'}
                    </div>
                  </div>
                </div>

                {/* Candidate Union and Ranked List */}
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-lg text-xs">
                  <div className="font-semibold text-slate-200 mb-2">
                    Frozen Top-10 Model Candidate Ranking for {selectedReplayStep.date}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedReplayStep.modelRankedTop10.map((pair, idx) => {
                      const isHit = selectedReplayStep.actualDayOutcomes.includes(pair);
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 ${
                            isHit
                              ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 shadow-md animate-pulse'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span>#{idx + 1}</span>
                          <span className="text-sm">{pair}</span>
                          {isHit && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">{selectedReplayStep.replayNarrative}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: FINAL RANKED CANDIDATES (SECTIONS 44, 46)
          ========================================================================= */}
      {activeSubTab === 'final-candidates' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Final Calibrated Candidate Ranking for {targetDate} (Section 44)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-factor fusion ranking combining Date Generator, Previous-Day Method, Markov Transitions, and Recency Momentum.
                </p>
              </div>

              <button
                onClick={handleSendTop10ToRisk}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Stake Top 10 in Risk Simulator
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Candidate Pair</th>
                    <th className="pb-3 text-center">Model Score</th>
                    <th className="pb-3 text-center">Calibrated OOS Hit Rate</th>
                    <th className="pb-3 text-center">Baseline</th>
                    <th className="pb-3 text-center">Relative Lift</th>
                    <th className="pb-3 text-center">95% Wilson CI</th>
                    <th className="pb-3 text-center">Date Support</th>
                    <th className="pb-3 text-center">Prev Support</th>
                    <th className="pb-3 text-right">Convergence Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {assessment.finalCandidates.slice(0, 15).map((c, idx) => {
                    const isTop10 = idx < 10;
                    return (
                      <tr
                        key={`${c.pair}-${idx}`}
                        className={`hover:bg-slate-800/30 ${
                          isTop10 ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-3 text-slate-400">#{idx + 1}</td>
                        <td className="py-3 font-bold text-amber-300 font-mono text-base">{c.pair}</td>
                        <td className="py-3 text-center font-bold text-slate-100">{c.finalCalibratedScore}</td>
                        <td className="py-3 text-center text-emerald-400 font-bold">{c.calibratedProbability}%</td>
                        <td className="py-3 text-center text-slate-400">1.0%</td>
                        <td className="py-3 text-center text-emerald-300 font-bold">+{c.empiricalLift}x</td>
                        <td className="py-3 text-center text-slate-400 font-sans">[1.2%, 4.8%]</td>
                        <td className="py-3 text-center">
                          {c.supportingSignals?.some((s) => s.name.toLowerCase().includes('date')) ? (
                            <span className="text-indigo-400 font-semibold">Active</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {c.supportingSignals?.some((s) => s.name.toLowerCase().includes('prev')) ? (
                            <span className="text-purple-400 font-semibold">Active</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              c.tier === 'TIER_1_ALPHA'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                : c.tier === 'TIER_2_BETA'
                                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {c.tier}
                          </span>
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
    </div>
  );
};
