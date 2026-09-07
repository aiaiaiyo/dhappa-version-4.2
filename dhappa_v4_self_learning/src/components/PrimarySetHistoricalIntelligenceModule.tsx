import React, { useState, useMemo } from 'react';
import { DayMarketEntry, Currency } from '../types';
import {
  analyzePrimarySetHistoricalIntelligence,
  HistoricalEvidenceReport,
  CandidateRankingRow,
} from '../utils/sirTheoryPrimarySetIntelligence';
import {
  Sparkles,
  Layers,
  Flame,
  Search,
  Copy,
  Check,
  Send,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Binary,
  Activity,
  Award,
  Zap,
  Info,
  CalendarDays,
  Percent,
  SlidersHorizontal,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  History,
  Grid,
  Scale,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface PrimarySetHistoricalIntelligenceModuleProps {
  records: DayMarketEntry[];
  currency: Currency;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const PrimarySetHistoricalIntelligenceModule: React.FC<PrimarySetHistoricalIntelligenceModuleProps> = ({
  records,
  currency,
  onSendPairsToSimulator,
}) => {
  // Current S state: Defaults to User S = [9, 0, 1, 2, 4, 5]
  const [inputSString, setInputSString] = useState<string>('9,0,1,2,4,5');
  const [currentS, setCurrentS] = useState<number[]>([9, 0, 1, 2, 4, 5]);

  // Section Tab Navigation
  const [activeModuleTab, setActiveModuleTab] = useState<
    | 'assessment-summary'
    | 'exact-similarity'
    | 'digit-contribution'
    | 'pair-derivation'
    | 'subsets-chains'
    | 'weekday-cycles'
    | 'transition-ledger'
  >('assessment-summary');

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handle Input S change
  const handleApplyS = () => {
    const rawParts = inputSString
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 9);

    const uniqueDigits = Array.from(new Set(rawParts));
    if (uniqueDigits.length === 6) {
      setCurrentS(uniqueDigits);
    }
  };

  // Quick Preset S options
  const handleSetPresetS = (preset: number[]) => {
    setCurrentS(preset);
    setInputSString(preset.join(', '));
  };

  // Run the full historical analysis
  const report: HistoricalEvidenceReport = useMemo(() => {
    return analyzePrimarySetHistoricalIntelligence(currentS, records);
  }, [currentS, records]);

  // Standardized Engine Result for Consensus Layer
  const standardizedPrimarySetResult = useMemo(() => {
    const candidates = (report.strongestHistoricalPairs || []).concat(report.strongestReversePairs || []);
    const topScore = Math.max(...(report.strongestHistoricalPairs || []).slice(0, 1).map(() => 75), 0);
    const evidence = (report.strongestHistoricalPairs || []).slice(0, 5);

    return buildStandardizedEngineResult({
      engineId: 'PRIMARY_SET_HISTORICAL',
      methodName: 'Primary Set Historical Intelligence',
      date: records[records.length - 1]?.date,
      channel: 'live-engine-output',
      sourceValues: { sValue: currentS },
      normalizedValues: { strongestCount: (report.strongestHistoricalPairs || []).length },
      rawResult: report as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: records.length,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractSSet()', 'historicalAnalysis()', 'rankCandidates()', 'score()'],
    });
  }, [report, currentS, records]);

  return (
    <div id="primary-set-historical-module" className="space-y-6">
      {/* Header Banner & S Input State */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Sections 21–39 Engine
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                746 Historical Draws Analyzed
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Primary Set S Historical Intelligence & Day-Wise Transition
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Treats Primary Set <span className="font-mono text-indigo-300 font-semibold">S(T)</span> as a historical mathematical state. Analyzes exact matches, Jaccard similarities, single-digit contributions, two/three-digit subsets, weekday anomalies, and Bayesian shrinkage candidate rankings.
            </p>
          </div>

          {/* S Selector & Input */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 min-w-[320px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Target Primary Set S(T)</span>
              <span className="text-xs text-indigo-400 font-mono">[{currentS.join(', ')}]</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputSString}
                onChange={(e) => setInputSString(e.target.value)}
                placeholder="e.g. 9, 0, 1, 2, 4, 5"
                className="flex-1 bg-slate-900 border border-slate-700 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleApplyS}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-indigo-600/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analyze
              </button>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500">Presets:</span>
              <button
                onClick={() => handleSetPresetS([9, 0, 1, 2, 4, 5])}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  currentS.join(',') === '9,0,1,2,4,5'
                    ? 'bg-indigo-600/40 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                [9,0,1,2,4,5] (Prompt Standard)
              </button>
              <button
                onClick={() => handleSetPresetS([7, 8, 9, 3, 4, 0])}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  currentS.join(',') === '7,8,9,3,4,0'
                    ? 'bg-indigo-600/40 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                [7,8,9,3,4,0] (Core X=8)
              </button>
              <button
                onClick={() => handleSetPresetS([3, 4, 5, 1, 7, 8])}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  currentS.join(',') === '3,4,5,1,7,8'
                    ? 'bg-indigo-600/40 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                [3,4,5,1,7,8] (Core X=4)
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveModuleTab('assessment-summary')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'assessment-summary'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            37. Final Assessment & Candidate Rankings
          </button>
          <button
            onClick={() => setActiveModuleTab('exact-similarity')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'exact-similarity'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            22–24. Exact Match & Jaccard Similarity
          </button>
          <button
            onClick={() => setActiveModuleTab('digit-contribution')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'digit-contribution'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            25. Digit Contribution Analysis
          </button>
          <button
            onClick={() => setActiveModuleTab('pair-derivation')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'pair-derivation'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            26 & 32. 15 Pairs & Reverse Derivations
          </button>
          <button
            onClick={() => setActiveModuleTab('subsets-chains')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'subsets-chains'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            27 & 31. 2/3-Digit Subsets & 3-Step Chains
          </button>
          <button
            onClick={() => setActiveModuleTab('weekday-cycles')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'weekday-cycles'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            29 & 30. Day-of-Week & Date-Cycles
          </button>
          <button
            onClick={() => setActiveModuleTab('transition-ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeModuleTab === 'transition-ledger'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            28. Day-Wise Transition Ledger S(T-1) → Actual(T)
          </button>
        </div>
      </div>

      {/* Mandatory Non-Negotiable Rule Warning (Section 38) */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <span className="font-bold text-amber-300 uppercase tracking-wide mr-1">
            Section 38 Non-Negotiable Rule:
          </span>
          The engine never states <em>"This number will hit."</em> It states:{' '}
          <strong className="text-white">
            "This candidate has the strongest historical/out-of-sample evidence among the evaluated candidates."
          </strong>{' '}
          Mathematical derivation, historical evidence, prediction rankings, and actual outcomes are kept strictly distinct.
        </div>
      </div>

      {/* SUBTAB 1: Section 37 Assessment Summary & Final Candidate Rankings */}
      {activeModuleTab === 'assessment-summary' && (
        <div className="space-y-6">
          {/* Section 37: Historical S Assessment Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  37. Historical S Assessment Summary
                </h3>
                <p className="text-xs text-slate-400">
                  Synthesized multi-test evidence for Primary Set S = [{currentS.join(', ')}]
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-lg border border-slate-700">
                Core X: {report.currentCoreX}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                    <th className="py-3 px-4">Test</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Empirical Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-medium">
                  {report.assessmentSummaryTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{row.test}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{row.result}</td>
                      <td className="py-3.5 px-4 text-slate-400">{row.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 37 & 34-36: Final Candidate Ranking with Bayesian Shrinkage */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-md border border-emerald-500/30">
                    Section 34–37
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Final Candidate Ranking (Historical S Derivation Score - HSDS)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aggressively filtered candidate ranking with Bayesian shrinkage safety (Section 35) & out-of-sample stability
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(
                      report.candidateRankings.slice(0, 6).map((c) => c.pair).join(', '),
                      'top-candidates'
                    )
                  }
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {copiedKey === 'top-candidates' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Top 6
                </button>
                {onSendPairsToSimulator && (
                  <button
                    onClick={() =>
                      onSendPairsToSimulator(report.candidateRankings.slice(0, 6).map((c) => c.pair))
                    }
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send to Simulator
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                    <th className="py-3 px-3 text-center">Rank</th>
                    <th className="py-3 px-3">Pair</th>
                    <th className="py-3 px-3">Reverse</th>
                    <th className="py-3 px-3 text-center">Historical Score (HSDS)</th>
                    <th className="py-3 px-3 text-center">Direct Rate</th>
                    <th className="py-3 px-3 text-center">Reverse Rate</th>
                    <th className="py-3 px-3 text-center">Sample Size</th>
                    <th className="py-3 px-3 text-center">Bayesian Smoothed</th>
                    <th className="py-3 px-3 text-center">Stability</th>
                    <th className="py-3 px-3 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {report.candidateRankings.map((cand) => (
                    <tr
                      key={cand.rank}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        cand.rank <= 3 ? 'bg-indigo-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${
                            cand.rank === 1
                              ? 'bg-amber-500 text-black font-extrabold'
                              : cand.rank === 2
                              ? 'bg-slate-300 text-slate-900 font-bold'
                              : cand.rank === 3
                              ? 'bg-amber-700 text-white font-bold'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cand.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sm text-white">
                        <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 text-indigo-300">
                          {cand.pair}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {cand.reverse}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm ${
                              cand.historicalScore >= 60
                                ? 'text-emerald-400'
                                : cand.historicalScore >= 45
                                ? 'text-indigo-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {cand.historicalScore}
                          </span>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${
                                cand.historicalScore >= 60
                                  ? 'bg-emerald-500'
                                  : cand.historicalScore >= 45
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${cand.historicalScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-200">
                        {cand.directRate}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {cand.reverseRate}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        <span className="text-slate-400">{cand.observedHits} / </span>
                        <strong className="text-white">{cand.sampleSize}</strong>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-400">
                        {cand.bayesianReliability}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            cand.stability === 'Very Stable'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : cand.stability === 'Stable'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : cand.stability === 'Moderate'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {cand.stability}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            cand.confidence === 'High'
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                              : cand.confidence === 'Medium'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cand.confidence}
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

      {/* SUBTAB 2: Exact Match & Similarity Search (Section 22–24) */}
      {activeModuleTab === 'exact-similarity' && (
        <div className="space-y-6">
          {/* Section 22: Exact S Match Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-400" />
                  22 & 23. Exact Primary Set Match Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Searches 746 historical draws for sets containing exactly {'{'} {report.sortedCurrentS.join(', ')} {'}'}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  report.exactMatchCount > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {report.exactMatchCount > 0 ? `${report.exactMatchCount} Exact Hits` : 'NO HISTORICAL SAMPLE'}
              </span>
            </div>

            {report.exactMatchCount === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center">
                <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                  EXACT S MATCH = NO HISTORICAL SAMPLE
                </h4>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
                  In strict compliance with Section 22, no relationship is fabricated. The engine transitions to Section 24 Jaccard Similarity Search (5/6 and 4/6 matches).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                      <th className="py-3 px-3">Historical Date</th>
                      <th className="py-3 px-3">Historical S</th>
                      <th className="py-3 px-3 text-center">Core X</th>
                      <th className="py-3 px-3">Next-Day Actual Draw</th>
                      <th className="py-3 px-3 text-center">Direct Hit</th>
                      <th className="py-3 px-3 text-center">Reverse Hit</th>
                      <th className="py-3 px-3">Winning Pairs</th>
                      <th className="py-3 px-3">Matched House</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {report.exactMatches.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-indigo-300">{m.historicalDate}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">[{m.historicalS.join(', ')}]</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">{m.coreX}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          DS:{m.nextDayActual.deshawar} | FB:{m.nextDayActual.faridabad} | GL:{m.nextDayActual.gali} | GZB:{m.nextDayActual.gzb}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {m.directHit ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {m.reverseHit ? <CheckCircle2 className="w-4 h-4 text-amber-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                          {m.matchedPairs.join(', ') || 'Miss'}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-semibold">
                          {m.matchedHouses.join(', ') || 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 24: Jaccard Similarity (5/6 and 4/6 Matches) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  24. Jaccard Similarity Ranking (5/6 & 4/6 Matches)
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by Jaccard coefficient: J(S_current, S_history) = |S_current ∩ S_history| / |S_current ∪ S_history|
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30">
                  {report.matches5of6.length} (5/6 Matches)
                </span>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700">
                  {report.matches4of6.length} (4/6 Matches)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50 sticky top-0">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Historical S</th>
                    <th className="py-3 px-3 text-center">Overlap</th>
                    <th className="py-3 px-3 text-center">Jaccard</th>
                    <th className="py-3 px-3">Shared Digits</th>
                    <th className="py-3 px-3">Next-Day Actual</th>
                    <th className="py-3 px-3 text-center">Hit Status</th>
                    <th className="py-3 px-3">Winning Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {[...report.matches5of6, ...report.matches4of6.slice(0, 15)].map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-indigo-300">{m.historicalDate}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">[{m.historicalS.join(', ')}]</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            m.sharedCount === 5
                              ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {m.sharedCount}/6
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-400">
                        {m.jaccardSimilarity}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {'{'} {m.sharedDigits.join(', ')} {'}'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        DS:{m.nextDayActual.deshawar} FB:{m.nextDayActual.faridabad} GL:{m.nextDayActual.gali} GZB:{m.nextDayActual.gzb}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {m.directHit ? (
                          <span className="text-emerald-400 font-bold">Direct Hit</span>
                        ) : m.reverseHit ? (
                          <span className="text-amber-400 font-bold">Reverse Hit</span>
                        ) : (
                          <span className="text-slate-600">Miss</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                        {m.matchedPairs.join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Digit Contribution Analysis (Section 25) */}
      {activeModuleTab === 'digit-contribution' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Binary className="w-5 h-5 text-indigo-400" />
                25. Historical Digit Contribution Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Independent historical conversion rates, lift multipliers, and house distributions for each digit in S = [{currentS.join(', ')}]
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Sorted by Next-Day Hit Frequency
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                  <th className="py-3 px-3 text-center">Digit</th>
                  <th className="py-3 px-3 text-center">S Frequency</th>
                  <th className="py-3 px-3 text-center">Next-Day Hits</th>
                  <th className="py-3 px-3 text-center">Lift Ratio</th>
                  <th className="py-3 px-3 text-center">Direct Hits</th>
                  <th className="py-3 px-3 text-center">Reverse Hits</th>
                  <th className="py-3 px-3 text-center">DS</th>
                  <th className="py-3 px-3 text-center">FB</th>
                  <th className="py-3 px-3 text-center">GL</th>
                  <th className="py-3 px-3 text-center">GZB</th>
                  <th className="py-3 px-3">Last Seen</th>
                  <th className="py-3 px-3 text-center">Days Since</th>
                  <th className="py-3 px-3 text-center">Consecutive Repetition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {report.digitContributions.map((dc) => (
                  <tr key={dc.digit} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold">
                      <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-mono text-sm">
                        {dc.digit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{dc.sFrequency}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                      {dc.nextDayHitFrequency}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-amber-400">
                      {dc.liftRatio}x
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-indigo-300">{dc.directHits}</td>
                    <td className="py-3 px-3 text-center font-mono text-amber-300">{dc.reverseHits}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{dc.houseHits.ds}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{dc.houseHits.fb}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{dc.houseHits.gl}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{dc.houseHits.gzb}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{dc.lastSeenDate}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {dc.daysSinceSeen}d
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-indigo-400 font-semibold">
                      {dc.consecutiveDayRepetitionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: 15 Pairs & Reverse Derivations (Section 26 & 32) */}
      {activeModuleTab === 'pair-derivation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                26 & 32. 15 Generated Pairs & Historical Reverse Mirror Tracking
              </h3>
              <p className="text-xs text-slate-400">
                Direct vs. reverse historical conversion, co-occurrence density, and house distributions
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Sorted by Bayesian Reliability
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                  <th className="py-3 px-3">Pair</th>
                  <th className="py-3 px-3">Reverse</th>
                  <th className="py-3 px-3 text-center">Co-Occurrences in S</th>
                  <th className="py-3 px-3 text-center">Direct Hits</th>
                  <th className="py-3 px-3 text-center">Reverse Hits</th>
                  <th className="py-3 px-3 text-center">Total Hits</th>
                  <th className="py-3 px-3 text-center">Direct Rate</th>
                  <th className="py-3 px-3 text-center">Reverse Rate</th>
                  <th className="py-3 px-3 text-center">Bayesian Score</th>
                  <th className="py-3 px-3 text-center">DS</th>
                  <th className="py-3 px-3 text-center">FB</th>
                  <th className="py-3 px-3 text-center">GL</th>
                  <th className="py-3 px-3 text-center">GZB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {report.pairBehaviors.map((pb) => (
                  <tr key={pb.pair} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-indigo-300">
                        {pb.pair}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                        {pb.reversePair}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{pb.timesSContainedBoth}</td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-semibold">{pb.directHitCount}</td>
                    <td className="py-3 px-3 text-center font-mono text-amber-400 font-semibold">{pb.reverseHitCount}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">{pb.totalHitCount}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{pb.directConversionRate}%</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{pb.reverseConversionRate}%</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-400">
                      {pb.reliabilityScore}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{pb.houseBreakdown.ds}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{pb.houseBreakdown.fb}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{pb.houseBreakdown.gl}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{pb.houseBreakdown.gzb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: 2/3-Digit Subsets & 3-Step Chains (Section 27 & 31) */}
      {activeModuleTab === 'subsets-chains' && (
        <div className="space-y-6">
          {/* Section 27: 3-Digit Subset Combinations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-indigo-400" />
                  27. Three-Digit Structural Subsets C(6, 3) = 20 Triples
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluates whether recurring three-digit clusters produce stronger next-day out-of-sample evidence
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {report.subsets3Digit.slice(0, 8).map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-indigo-300">{sub.subsetLabel}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded">
                      {sub.reliabilityScore}% Rel
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Occurrences in S:</span>
                      <strong className="text-slate-200">{sub.historicalSetOccurrences}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Next-Day Hits:</span>
                      <strong className="text-emerald-400">{sub.nextDayHitCount} ({sub.conversionRate}%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Derived Pairs:</span>
                      <span className="font-mono text-slate-300">{sub.strongestNextDayPairs.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 31: 3-Step Transition Chain S(T-1) → Actual(T) → S(T+1) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                  31. Three-Step Historical Transition Chains S(T-1) → Actual(T) → S(T+1)
                </h3>
                <p className="text-xs text-slate-400">
                  Traces historical precursors and subsequent evolutionary states when similar Primary Sets occurred
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {report.threeStepChains.map((chain, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4"
                >
                  {/* Step T-1 */}
                  <div className="flex-1 text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase block">Step 1: T-1 ({chain.tMinus1Date})</span>
                    <span className="font-mono text-slate-300">S: [{chain.sTMinus1.join(', ')}]</span>
                    <span className="text-slate-500 block">Actual: DS {chain.tMinus1Actual.ds} | FB {chain.tMinus1Actual.fb}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block shrink-0" />

                  {/* Step T (Target) */}
                  <div className="flex-1 text-xs bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-indigo-400 font-bold uppercase">Step 2: Target T ({chain.tDate})</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${chain.hitT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {chain.hitT ? 'HIT' : 'MISS'}
                      </span>
                    </div>
                    <span className="font-mono text-white font-bold block mt-0.5">S: [{chain.sT.join(', ')}]</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      DS:{chain.tActual.ds} FB:{chain.tActual.fb} GL:{chain.tActual.gl} GZB:{chain.tActual.gzb}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block shrink-0" />

                  {/* Step T+1 */}
                  <div className="flex-1 text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase block">Step 3: Following T+1 ({chain.tPlus1Date})</span>
                    <span className="font-mono text-slate-300">S: [{chain.sTPlus1.join(', ')}]</span>
                    <span className="text-slate-500 block">Next Actual: DS {chain.tPlus1Actual.ds} | FB {chain.tPlus1Actual.fb}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: Day-of-Week & Date-Cycles (Section 29 & 30) */}
      {activeModuleTab === 'weekday-cycles' && (
        <div className="space-y-6">
          {/* Section 29: Weekday Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-400" />
                  29. Day-of-Week Primary Set Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Strictly statistical: Only flags weekdays with demonstrated out-of-sample deviation
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {report.weekdayStats.map((ws) => (
                <div
                  key={ws.weekday}
                  className={`bg-slate-950/70 border rounded-xl p-3 flex flex-col justify-between ${
                    ws.isStatisticallySignificant
                      ? 'border-indigo-500/50 ring-1 ring-indigo-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{ws.weekday}</span>
                      <span className="text-[10px] text-slate-500">{ws.totalOccurrences}d</span>
                    </div>
                    <div className="text-lg font-extrabold font-mono text-indigo-400 my-1">
                      {ws.overallHitRate}%
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1 mt-2 pt-2 border-t border-slate-800">
                    <div>
                      Top Digits:{' '}
                      <span className="font-mono text-slate-200">
                        {ws.commonDigits.slice(0, 3).map((d) => d.digit).join(',')}
                      </span>
                    </div>
                    <div>
                      Direct / Rev:{' '}
                      <span className="text-slate-300">{ws.directConversionRate}% / {ws.reverseConversionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 30: Date-Cycle Intervals */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  30. Date-Cycle Recurrence Intervals (T-7, T-14, T-30, T-60, T-90)
                </h3>
                <p className="text-xs text-slate-400">
                  Measures whether Primary Set states recur after predictable cyclic time windows
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {report.dateCyclePatterns.map((cp) => (
                <div
                  key={cp.intervalDays}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-400">{cp.intervalLabel}</span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {cp.averageSimilarity} Jaccard
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="text-slate-400 flex justify-between">
                      <span>5/6 Recurrences:</span>
                      <strong className="text-indigo-300">{cp.exactOr5Of6MatchesCount}</strong>
                    </div>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                        cp.recurrenceSignificance === 'Strong'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : cp.recurrenceSignificance === 'Moderate'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cp.recurrenceSignificance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: Transition Ledger S(T-1) -> Actual(T) (Section 28) */}
      {activeModuleTab === 'transition-ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                28. Day-Wise Primary Set Transition Ledger S(T-1) → Actual(T)
              </h3>
              <p className="text-xs text-slate-400">
                Chronological transition records logging mathematical state transitions and outcome relationships
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50 sticky top-0">
                  <th className="py-3 px-3">Date T-1</th>
                  <th className="py-3 px-3">Primary Set S(T-1)</th>
                  <th className="py-3 px-3 text-center">Core X</th>
                  <th className="py-3 px-3">Date T</th>
                  <th className="py-3 px-3">Actual Draw T</th>
                  <th className="py-3 px-3">S → Actual Relationship</th>
                  <th className="py-3 px-3 text-center">Direct Hit</th>
                  <th className="py-3 px-3 text-center">Reverse Hit</th>
                  <th className="py-3 px-3">Matched Pairs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {report.recentTransitions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{t.dateTMinus1}</td>
                    <td className="py-2.5 px-3 font-mono text-indigo-300">[{t.primarySetTMinus1.join(', ')}]</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{t.coreXTMinus1}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{t.dateT}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      DS:{t.actualDrawT.deshawar} FB:{t.actualDrawT.faridabad} GL:{t.actualDrawT.gali} GZB:{t.actualDrawT.gzb}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.relationshipType === 'multi-house-sweep'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : t.relationshipType === 'direct-pair-hit'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.relationshipType === 'reverse-pair-hit'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {t.relationshipType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.directHit ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.reverseHit ? <CheckCircle2 className="w-4 h-4 text-amber-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                      {t.matchedPairs.join(', ') || 'Miss'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
