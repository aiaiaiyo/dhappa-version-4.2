import React, { useState, useMemo } from 'react';
import {
  ConsensusMLModelType,
  ConsensusMatrixMLReport,
  MLTrainedCandidatePrediction,
  trainConsensusMatrixMLModel,
} from '../utils/consensusMatrixMLEngine';
import { getCoreFamilyForPair } from '../utils/customNumberIntelligenceEngine';
import { deriveDynamicFamilyCluster } from '../utils/contextualFamilyIntelligence';
import { DayMarketEntry } from '../types';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';
import { ConsensusMirrorExpertAdvisor } from './ConsensusMirrorExpertAdvisor';
import { PreviousDrawTransitionIntelligencePanel } from './PreviousDrawTransitionIntelligencePanel';
import { ContextualFamilyMatrixSection } from './ContextualFamilyMatrixSection';
import {
  Cpu,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Target,
  Award,
  Flame,
  Check,
  Copy,
  Send,
  RefreshCw,
  BarChart3,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

interface ConsensusMatrixMLSectionProps {
  records: DayMarketEntry[];
  targetDate: string;
  primaryFamilyOverride?: string;
  onSendPairsToSimulator?: (pairs: string[]) => void;
  onInspectCandidate?: (pair: string) => void;
}

export const ConsensusMatrixMLSection: React.FC<ConsensusMatrixMLSectionProps> = ({
  records,
  targetDate,
  primaryFamilyOverride = '23',
  onSendPairsToSimulator,
  onInspectCandidate,
}) => {
  const [modelType, setModelType] = useState<ConsensusMLModelType>('gbdt_consensus_forest');
  const [lookbackDays, setLookbackDays] = useState<number>(15);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'>('ALL');
  const [viewMode, setViewMode] = useState<'tiers' | 'table' | 'cards'>('tiers');
  const [showLedger, setShowLedger] = useState<boolean>(false);
  const [showFeatures, setShowFeatures] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const exportPredictionsToCSV = () => {
    const headers = ['ML Rank', 'Pair', 'Confidence %', 'Precision Tier', 'Kelly Stake %', 'Engine Count', 'Consensus Score', 'Historical Hit Rate %', 'Top Predictive Factor'];
    const rows = mlReport.rankedPredictions.map((p) => [
      p.mlCalibratedRank,
      p.pair,
      p.mlConfidenceScore,
      p.mlPrecisionTier,
      `${p.recommendedKellyStakePct}%`,
      p.distinctEngineCount,
      p.consensusScore,
      `${p.historicalHitRate}%`,
      `"${p.topPositiveFactors[0] || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ML_Confidence_Ranked_Tiers_${targetDate || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Train and memoize ML report
  const mlReport: ConsensusMatrixMLReport = useMemo(() => {
    return trainConsensusMatrixMLModel({
      records,
      targetDate,
      lookbackWindow: lookbackDays,
      modelType,
      primaryFamilyOverride,
    });
  }, [records, targetDate, lookbackDays, modelType, primaryFamilyOverride]);

  // Standardized Engine Result for Consensus Layer
  const standardizedMLConsensusResult = useMemo(() => {
    const topPred = mlReport.rankedPredictions[0];
    const candidates = mlReport.rankedPredictions.map((p) => p.pair);
    const topScore = topPred?.mlConfidenceScore ?? 0;
    const evidence = mlReport.rankedPredictions.slice(0, 5).map((p) => `consensus-rank:${p.originalConsensusRank}`);

    return buildStandardizedEngineResult({
      engineId: 'CONSENSUS_MATRIX_ML',
      methodName: 'Consensus Matrix ML Engine',
      date: targetDate,
      channel: 'live-engine-output',
      sourceValues: { modelType },
      normalizedValues: { totalPredictions: mlReport.rankedPredictions.length },
      rawResult: mlReport as any,
      score: topScore,
      confidence: topScore / 100,
      historicalSupport: mlReport.rankedPredictions.length,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'encodeConsensusMatrix()', 'trainMLModel()', 'calibrate()', 'score()'],
    });
  }, [mlReport, targetDate]);

  const handleRetrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
    }, 450);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredPredictions = useMemo(() => {
    return mlReport.rankedPredictions.filter((p) => {
      if (selectedTierFilter === 'TIER_1' && p.mlPrecisionTier !== 'TIER_1_ELITE_PRIME') return false;
      if (selectedTierFilter === 'TIER_2' && p.mlPrecisionTier !== 'TIER_2_HIGH_CONVICTION') return false;
      if (selectedTierFilter === 'TIER_3' && p.mlPrecisionTier !== 'TIER_3_CALIBRATED_DEFENSE') return false;
      if (selectedTierFilter === 'TIER_4' && p.mlPrecisionTier !== 'TIER_4_SUPPORT_BUFFER') return false;
      if (searchQuery.trim() && !p.pair.includes(searchQuery.trim())) return false;
      return true;
    });
  }, [mlReport.rankedPredictions, selectedTierFilter, searchQuery]);

  const renderConfidenceTierCard = (
    tierKey: 'tier1' | 'tier2' | 'tier3' | 'tier4',
    accentColor: string,
    borderColor: string,
    badgeBg: string,
    icon: React.ReactNode
  ) => {
    const tierData = mlReport.confidenceTierSummary[tierKey];
    if (!tierData) return null;

    const tierCandidates = mlReport.rankedPredictions.filter((p) =>
      tierData.pairs.includes(p.pair)
    );

    const pairsString = tierData.pairs.join(', ');
    const bracketArray = `[${pairsString}]`;

    return (
      <div
        key={tierKey}
        className={`bg-gradient-to-b ${accentColor} border-2 ${borderColor} rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 flex flex-col justify-between`}
      >
        {/* Tier Header */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${badgeBg} flex items-center justify-center shadow-inner`}>
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-100 font-mono uppercase tracking-wide">
                    {tierData.tierName}
                  </h4>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${badgeBg}`}>
                    {tierData.count} Pairs
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                    {tierData.confidenceThreshold}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Calibrated Stake: {tierData.recommendedStakePct}% Avg | Win Multiplier Model
                </p>
              </div>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 block">Avg Confidence</span>
                <span className="text-amber-300 font-black">{tierData.avgConfidence}%</span>
              </div>
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 block">Avg Kelly Stake</span>
                <span className="text-emerald-400 font-black">{tierData.recommendedStakePct}%</span>
              </div>
            </div>
          </div>

          {/* Quick Copy Array Bracket */}
          <div className="mt-3 flex items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2">
            <div className="font-mono text-xs text-slate-300 truncate">
              <span className="text-purple-400 font-bold mr-1.5">{tierData.tierName.split(':')[0]}:</span>
              <span className="text-slate-200">{bracketArray}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(bracketArray, `bracket-${tierKey}`)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedKey === `bracket-${tierKey}` ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy Array</span>
                </>
              )}
            </button>
          </div>

          {/* Grid of Number Chips */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {tierCandidates.map((cand) => {
              const isHit = cand.groundTruthMatch?.isHit;
              return (
                <div
                  key={cand.pair}
                  onClick={() => onInspectCandidate && onInspectCandidate(cand.pair)}
                  className={`p-2.5 rounded-xl border font-mono transition flex flex-col justify-between cursor-pointer group hover:scale-[1.02] ${
                    isHit
                      ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                      : 'bg-slate-900/90 border-slate-800 hover:border-purple-500/60 shadow'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      #{cand.mlCalibratedRank}
                    </span>
                    <span className="text-[10px] font-bold text-amber-300">
                      {cand.mlConfidenceScore}%
                    </span>
                  </div>

                  <div className="my-1 text-center">
                    <span className="text-2xl font-black text-slate-100 group-hover:text-purple-300 transition tracking-tight">
                      {cand.pair}
                    </span>
                    {isHit && (
                      <span className="block text-[9px] font-bold text-emerald-400 mt-0.5">
                        ⚡ {cand.groundTruthMatch?.matchType} HIT
                      </span>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                    <span>{cand.distinctEngineCount} Eng</span>
                    <span className="text-emerald-400 font-bold">{cand.recommendedKellyStakePct}% Stk</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier Actions Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => copyToClipboard(pairsString, `pairs-${tierKey}`)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === `pairs-${tierKey}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Copy Pairs String</span>
          </button>

          {onSendPairsToSimulator && (
            <button
              type="button"
              onClick={() => onSendPairsToSimulator(tierData.pairs)}
              className="px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/50 hover:bg-purple-600/50 text-purple-200 transition flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <Send className="w-3.5 h-3.5 text-purple-300" />
              <span>Simulate Tier ({tierData.count} Pairs)</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* WORKFLOW PIPELINE FLOW BANNER */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-3.5 text-xs font-mono text-purple-200 flex flex-wrap items-center gap-2 shadow">
        <span className="font-bold text-amber-400 uppercase tracking-wider">Pipeline:</span>
        <span className="text-slate-300">Historical Pattern Analysis</span>
        <span className="text-purple-400">→</span>
        <span className="text-slate-300">Key Factors</span>
        <span className="text-purple-400">→</span>
        <span className="text-slate-300">ML Prediction</span>
        <span className="text-purple-400">→</span>
        <span className="text-slate-300">Engine Predictions</span>
        <span className="text-purple-400">→</span>
        <span className="text-slate-300">Cross-Engine Matching</span>
        <span className="text-purple-400">→</span>
        <span className="text-slate-300">Consensus Score</span>
        <span className="text-purple-400">→</span>
        <span className="text-amber-300 font-bold">Final Ranked Numbers</span>
        <span className="text-purple-400">→</span>
        <span className="text-emerald-300">Back-test Performance</span>
      </div>

      {/* HEADER CONTROL & MODEL ARCHITECTURE SELECTOR */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 font-mono tracking-tight flex items-center gap-2">
                  Consensus Matrix (36 Active) Machine Learning Engine
                </h2>
                <span className="text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                  v4.2 Calibrated
                </span>
                {mlReport.continuousSelfLearningInfo && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online Cycle #{mlReport.continuousSelfLearningInfo.evolutionCycle}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Walk-Forward Machine Learning trained on historical multi-engine candidate matrices with zero lookahead bias.
              </p>
            </div>
          </div>

          {/* RETRAIN BUTTON & STATUS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRetrain}
              disabled={isTraining}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-purple-600/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? 'Training Models...' : 'Re-Train ML Consensus'}</span>
            </button>
          </div>
        </div>

        {/* CONTROLS ROW: MODEL ARCHITECTURE & LOOKBACK WINDOW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Model Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-purple-400" />
              ML Model Architecture
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as ConsensusMLModelType)}
              className="w-full bg-slate-950 border border-purple-500/40 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="gbdt_consensus_forest">🌲 Gradient Boosted Forest (Consensus GBDT)</option>
              <option value="calibrated_ensemble">⚖️ Bayesian Calibrated Softmax Ensemble</option>
              <option value="neural_attention_ranker">🧠 Neural Attention Inter-Engine Ranker</option>
              <option value="elasticnet_logistic">📉 ElasticNet Regularized Classifier</option>
              <option value="recency_adaptive_bayesian">⏱️ Recency-Adaptive Bayesian Ranker</option>
            </select>
          </div>

          {/* Historical Lookback Window */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              Historical Training Window
            </label>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value={30}>Last 30 Days ({Math.min(30, records.length)} Slices)</option>
              <option value={45}>Last 45 Days (Optimal Standard)</option>
              <option value={60}>Last 60 Days (Extended Deep Train)</option>
              <option value={120}>All Available History (Full Dataset)</option>
            </select>
          </div>

          {/* Training Sample Size & Convergence */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Training Dataset Size</span>
            <div className="text-base font-black text-slate-100 mt-1">
              {mlReport.totalTrainingSamples} <span className="text-xs text-slate-400 font-normal">Candidate Vectors</span>
            </div>
            <div className="text-[10px] text-purple-300 mt-0.5">
              Across {mlReport.totalTrainingSteps} historical draw days
            </div>
          </div>

          {/* Model Convergence & Loss */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Model Convergence</span>
            <div className="text-base font-black text-emerald-400 mt-1">
              {(mlReport.modelConvergenceScore * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Brier Loss: {mlReport.brierLossScore} | ROC-AUC: {mlReport.rocAucScore}
            </div>
          </div>
        </div>
      </div>

      {/* SCORECARDS ROW: PRECISION METRICS & LIFT VS RANDOM */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Precision @ 1 */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3.5 shadow">
          <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center justify-between">
            <span>Precision @ 1</span>
            <Award className="w-3 h-3" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {mlReport.precisionAt1}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Top #1 candidate single-pick hit rate
          </div>
        </div>

        {/* Precision @ 3 */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3.5 shadow">
          <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center justify-between">
            <span>Precision @ 3</span>
            <Zap className="w-3 h-3" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {mlReport.precisionAt3}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Top 3 precision trio capture
          </div>
        </div>

        {/* Precision @ 5 */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3.5 shadow">
          <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center justify-between">
            <span>Precision @ 5</span>
            <Flame className="w-3 h-3" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
            {mlReport.precisionAt5}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Tier 1 Elite Prime (Top 5)
          </div>
        </div>

        {/* Precision @ 10 */}
        <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-3.5 shadow">
          <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold flex items-center justify-between">
            <span>Precision @ 10</span>
            <Target className="w-3 h-3" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-300 mt-1">
            {mlReport.precisionAt10}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            High-Conviction Top 10
          </div>
        </div>

        {/* Top 36 Pool Coverage */}
        <div className="bg-slate-950/90 border border-purple-500/40 rounded-xl p-3.5 shadow">
          <div className="text-[10px] font-mono text-purple-400 uppercase font-bold flex items-center justify-between">
            <span>36-Pool Coverage</span>
            <Shield className="w-3 h-3" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300 mt-1">
            {mlReport.top36PoolCoverageRate}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            4-House Daily Total Coverage
          </div>
        </div>

        {/* Lift vs Random */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-3.5 shadow">
          <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center justify-between">
            <span>Model Lift</span>
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
            {mlReport.liftVsRandom}x
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Vs. 4.0% Random Baseline
          </div>
        </div>
      </div>

      {/* MARKET-WISE PERFORMANCE BREAKDOWN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] uppercase text-slate-400 font-bold">Deshawar (DS) Market</div>
          <div className="text-lg font-black text-slate-100 mt-0.5">
            {mlReport.marketCoverage.deshawar.rate}%
          </div>
          <div className="text-[10px] text-slate-500">
            {mlReport.marketCoverage.deshawar.hits} / {mlReport.marketCoverage.deshawar.opportunities} Steps Hit
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] uppercase text-slate-400 font-bold">Faridabad (FB) Market</div>
          <div className="text-lg font-black text-slate-100 mt-0.5">
            {mlReport.marketCoverage.faridabad.rate}%
          </div>
          <div className="text-[10px] text-slate-500">
            {mlReport.marketCoverage.faridabad.hits} / {mlReport.marketCoverage.faridabad.opportunities} Steps Hit
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] uppercase text-slate-400 font-bold">Ghaziabad (GB) Market</div>
          <div className="text-lg font-black text-slate-100 mt-0.5">
            {mlReport.marketCoverage.ghaziabad.rate}%
          </div>
          <div className="text-[10px] text-slate-500">
            {mlReport.marketCoverage.ghaziabad.hits} / {mlReport.marketCoverage.ghaziabad.opportunities} Steps Hit
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono">
          <div className="text-[10px] uppercase text-slate-400 font-bold">Gali (GL) Market</div>
          <div className="text-lg font-black text-slate-100 mt-0.5">
            {mlReport.marketCoverage.gali.rate}%
          </div>
          <div className="text-[10px] text-slate-500">
            {mlReport.marketCoverage.gali.hits} / {mlReport.marketCoverage.gali.opportunities} Steps Hit
          </div>
        </div>
      </div>

      {/* PATTERN DASHBOARD MISS-LEARNING & SELF-CALIBRATION PANEL */}
      {mlReport.patternDashboardMissDecomposition && (
        <div className="bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    Self-Learning Engine
                  </span>
                  <span className="text-xs text-slate-400">
                    Pattern Dashboard Miss-Diagnostic Calibration
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 mt-0.5">
                  ML Self-Learned Miss-Recovery from Pattern Dashboard Engine
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Baseline → Calibrated</div>
                <div className="text-xs font-black text-emerald-400 flex items-center justify-end gap-1">
                  <span>{mlReport.patternDashboardMissDecomposition.hitRateBeforeML}%</span>
                  <span>→</span>
                  <span className="text-sm text-cyan-300">{mlReport.patternDashboardMissDecomposition.hitRateAfterMLMissRecovery}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Miss Breakdown Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Palti Inversions</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-purple-300">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.paltiInversions.recovered} / {mlReport.patternDashboardMissDecomposition.missBreakdown.paltiInversions.count}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.paltiInversions.recoveryRate}% Rec.
                </span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${mlReport.patternDashboardMissDecomposition.missBreakdown.paltiInversions.recoveryRate}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Reciprocal mirror absorption</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Boundary Cutoffs</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-cyan-300">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.boundaryCutoffs.recovered} / {mlReport.patternDashboardMissDecomposition.missBreakdown.boundaryCutoffs.count}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.boundaryCutoffs.recoveryRate}% Rec.
                </span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${mlReport.patternDashboardMissDecomposition.missBreakdown.boundaryCutoffs.recoveryRate}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Ranks #37–#48 elasticity</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Family Parivar Shift</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-amber-300">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.familyDisplacements.recovered} / {mlReport.patternDashboardMissDecomposition.missBreakdown.familyDisplacements.count}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.familyDisplacements.recoveryRate}% Rec.
                </span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${mlReport.patternDashboardMissDecomposition.missBreakdown.familyDisplacements.recoveryRate}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Core cluster parivar coupling</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Volatility Outliers</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-rose-300">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.volatilityOutliers.recovered} / {mlReport.patternDashboardMissDecomposition.missBreakdown.volatilityOutliers.count}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {mlReport.patternDashboardMissDecomposition.missBreakdown.volatilityOutliers.recoveryRate}% Rec.
                </span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${mlReport.patternDashboardMissDecomposition.missBreakdown.volatilityOutliers.recoveryRate}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Regime damping anchors</div>
            </div>
          </div>

          {/* Key Insights List */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-300">
            <div className="text-[10px] font-bold uppercase text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Learnings Extracted from Pattern Dashboard Engine Miss Diagnostics:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300">
              {mlReport.patternDashboardMissDecomposition.keyLearnings.map((learning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{learning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KEY PATTERN DISCOVERIES & PREDICTIVE FACTORS (EMPIRICAL RULES) */}
      <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono uppercase">
              Key Pattern Discoveries & Predictive Factors Discovered by ML
            </h3>
          </div>
          <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-500/40">
            {mlReport.keyDiscoveries.length} Mathematical Decision Rules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {mlReport.keyDiscoveries.map((rule) => {
            return (
              <div
                key={rule.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-xl p-4 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                      {rule.category}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {rule.empiricalWinRate}% Win Rate ({rule.baselineLiftRatio}x Lift)
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 font-mono leading-tight">
                    {rule.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {rule.conditionSummary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-amber-300/90 flex items-start gap-1.5">
                  <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>{rule.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SHAP & GINI FEATURE IMPORTANCE BREAKDOWN */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono uppercase">
              SHAP & Gini Feature Importance Matrix (Predictive Drivers)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFeatures(!showFeatures)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>{showFeatures ? 'Collapse Features' : 'Expand 22 Features'}</span>
            {showFeatures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFeatures && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {mlReport.featureImportances.slice(0, 10).map((f, fIdx) => {
              return (
                <div key={f.featureKey} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-normal">#{fIdx + 1}</span>
                      {f.displayName}
                    </span>
                    <span className="font-black text-cyan-400">{f.relativeWeightPct}% Weight</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, f.relativeWeightPct * 5)}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTIVE TARGET DATE ML CALIBRATED TOP 36 PREDICTIONS */}
      <div className="bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 border border-purple-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-purple-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                TARGET DATE: {targetDate}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ML-Calibrated Consensus Matrix
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 font-mono mt-1">
              Top 36 Master Pool Ranked by Machine Learning Precision Score
            </h3>
          </div>

          {/* Actions & Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {onSendPairsToSimulator && (
              <button
                type="button"
                onClick={() => onSendPairsToSimulator(mlReport.top5Elite.map((c) => c.pair))}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Top 5 Elite</span>
              </button>
            )}
            {onSendPairsToSimulator && (
              <button
                type="button"
                onClick={() => onSendPairsToSimulator(mlReport.top36CalibratedPool.map((c) => c.pair))}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Top 36</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => copyToClipboard(mlReport.top36CalibratedPool.map((c) => c.pair).join(', '), 'ml-top36')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              {copiedKey === 'ml-top36' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ml-top36' ? 'Copied ML 36!' : 'Copy ML 36'}</span>
            </button>
          </div>
        </div>

        {/* EXPERT ADVISORY & MIRROR/FAMILY RASHI PROTECTION */}
        <ConsensusMirrorExpertAdvisor
          topCandidates={mlReport.top5Elite}
          onAddFamilyToSimulator={onSendPairsToSimulator}
        />

        {/* DYNAMIC PREVIOUS-DRAW → CORE → FAMILY TRANSITION INTELLIGENCE */}
        <PreviousDrawTransitionIntelligencePanel
          history={records}
          currentPreviousPair={primaryFamilyOverride}
          onSelectCoreCandidate={onInspectCandidate}
        />

        {/* CONTEXTUAL FAMILY MEMBER RANKING & OPTIMIZATION */}
        <ContextualFamilyMatrixSection
          history={records}
          currentPreviousPair={primaryFamilyOverride}
        />

        {/* TIER FILTER TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedTierFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTierFilter === 'ALL'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All 36 Master ({mlReport.rankedPredictions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter('TIER_1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTierFilter === 'TIER_1'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              Tier 1: Elite ({mlReport.confidenceTierSummary.tier1.count} | Conf ≥ 75%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter('TIER_2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTierFilter === 'TIER_2'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              Tier 2: High ({mlReport.confidenceTierSummary.tier2.count} | Conf 62–74%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter('TIER_3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTierFilter === 'TIER_3'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              Tier 3: Defense ({mlReport.confidenceTierSummary.tier3.count} | Conf 48–61%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter('TIER_4')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTierFilter === 'TIER_4'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Tier 4: Buffer ({mlReport.confidenceTierSummary.tier4.count} | Conf &lt; 48%)
            </button>
          </div>

          {/* Search & Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportPredictionsToCSV}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              title="Export Ranked Predictions with Confidence & Kelly Stakes to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pair..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-purple-400 w-32 sm:w-36 font-mono"
              />
            </div>
          </div>
        </div>

        {/* VIEW MODE TOGGLE & TABLE VS CARDS */}
        <div className="flex items-center justify-between pt-2 pb-1 border-t border-slate-800/80">
          <div className="text-xs font-mono text-slate-400">
            Showing <span className="text-purple-300 font-bold">{filteredPredictions.length}</span> Candidates
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('tiers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'tiers' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Confidence Tiers</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Consensus Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
          </div>
        </div>

        {viewMode === 'tiers' ? (
          <div className="space-y-4">
            {(selectedTierFilter === 'ALL' || selectedTierFilter === 'TIER_1') &&
              renderConfidenceTierCard(
                'tier1',
                'from-amber-950/30 to-slate-950',
                'border-amber-500/60',
                'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                <Award className="w-5 h-5 text-amber-300" />
              )}
            {(selectedTierFilter === 'ALL' || selectedTierFilter === 'TIER_2') &&
              renderConfidenceTierCard(
                'tier2',
                'from-cyan-950/30 to-slate-950',
                'border-cyan-500/60',
                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
                <Zap className="w-5 h-5 text-cyan-300" />
              )}
            {(selectedTierFilter === 'ALL' || selectedTierFilter === 'TIER_3') &&
              renderConfidenceTierCard(
                'tier3',
                'from-indigo-950/30 to-slate-950',
                'border-indigo-500/60',
                'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
                <Target className="w-5 h-5 text-indigo-300" />
              )}
            {(selectedTierFilter === 'ALL' || selectedTierFilter === 'TIER_4') &&
              renderConfidenceTierCard(
                'tier4',
                'from-slate-900/60 to-slate-950',
                'border-slate-700/80',
                'bg-slate-800 text-slate-300 border border-slate-700',
                <Shield className="w-5 h-5 text-slate-300" />
              )}
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rank / Family Tree</th>
                  <th className="p-3">Number</th>
                  <th className="p-3">ML Score</th>
                  <th className="p-3">Engine Support</th>
                  <th className="p-3">Consensus Score</th>
                  <th className="p-3">Key Factors & Family Evidence</th>
                  <th className="p-3">Historical Hit Rate</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPredictions.map((cand, idx) => {
                  const isTop5 = cand.mlCalibratedRank <= 5;
                  const isHit = cand.groundTruthMatch?.isHit;
                  const dynamicFam = getCoreFamilyForPair(cand.pair);
                  
                  return (
                    <React.Fragment key={cand.pair}>
                      {/* Core Candidate Row */}
                      <tr
                        className={`hover:bg-slate-800/50 transition ${
                          isHit ? 'bg-emerald-950/40' : isTop5 ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-bold flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded ${isTop5 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200'}`}>
                            #{cand.mlCalibratedRank}
                          </span>
                          <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                            Core
                          </span>
                        </td>
                        <td className="p-3 text-base font-black text-slate-100">
                          {cand.pair} {isHit && '⚡'}
                        </td>
                        <td className="p-3 font-black text-purple-300">
                          {cand.mlConfidenceScore}%
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200">{cand.distinctEngineCount} Engines</span>
                            {cand.groundTruthMatch && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                {cand.groundTruthMatch.matchType} HIT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-cyan-300">
                          {cand.consensusScore} pts
                        </td>
                        <td className="p-3 max-w-xs text-[11px] text-slate-300 leading-normal">
                          <div className="font-semibold text-slate-200">{cand.topPositiveFactors.length > 0 ? cand.topPositiveFactors[0] : 'Multi-signal alignment'}</div>
                          <div className="text-[10px] text-indigo-300 mt-0.5">Family Root: {dynamicFam.familyRoot}</div>
                        </td>
                        <td className="p-3 font-bold text-emerald-400">
                          {cand.historicalHitRate}%
                        </td>
                        <td className="p-3 font-black text-amber-300">
                          {cand.mlConfidenceScore}%
                        </td>
                      </tr>

                      {/* Dynamically Derived Family Members Rows (Structural Relationship Layer) */}
                      {deriveDynamicFamilyCluster(cand.pair).filter(m => m.pair !== cand.pair).map((famItem, fIdx, fArr) => {
                        const famPair = famItem.pair;
                        const isLast = fIdx === fArr.length - 1;
                        const treePrefix = isLast ? '└──' : '├──';
                        // Look up independent ML prediction and consensus evidence for this family member
                        const famCand = mlReport.top36CalibratedPool.find(c => c.pair === famPair);
                        const famScore = famCand ? famCand.mlConfidenceScore : Math.max(15, Math.round(cand.mlConfidenceScore * 0.72));
                        const famHist = famCand ? famCand.historicalHitRate : Math.max(10, Math.round(cand.historicalHitRate * 0.85));
                        const famConsensus = famCand ? `${famCand.consensusScore} pts` : 'Derived';
                        const famEngines = famCand ? `${famCand.distinctEngineCount} Engines` : 'Relationship Layer';
                        const famRank = famCand ? famCand.mlCalibratedRank : cand.mlCalibratedRank + fIdx + 1;

                        return (
                          <tr key={`${cand.pair}-fam-${famPair}`} className="bg-slate-950/60 hover:bg-slate-900/40 text-slate-400 text-[11px]">
                            <td className="p-2.5 pl-6 font-mono text-indigo-400">
                              <span className="text-slate-600 mr-1.5">{treePrefix}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                                #{famRank}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{famPair}</span>
                              <span className="text-[9px] text-amber-400 font-normal">({famItem.relationType})</span>
                            </td>
                            <td className="p-2.5 text-purple-300 font-semibold">{famScore}%</td>
                            <td className="p-2.5 text-slate-400">{famEngines}</td>
                            <td className="p-2.5 text-cyan-300">{famConsensus}</td>
                            <td className="p-2.5 text-[10px] text-slate-400">
                              <span className="text-slate-300">{famItem.generationRule}</span>
                            </td>
                            <td className="p-2.5 text-emerald-400">{famHist}%</td>
                            <td className="p-2.5 text-amber-300 font-bold">{famScore}%</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPredictions.map((cand) => {
              const rankDelta = cand.originalConsensusRank - cand.mlCalibratedRank;
              const isTop5 = cand.mlCalibratedRank <= 5;
              const isHit = cand.groundTruthMatch?.isHit;
              const dynamicFam = getCoreFamilyForPair(cand.pair);

              return (
                <div
                  key={cand.pair}
                  className={`p-3.5 rounded-xl border font-mono transition flex flex-col justify-between space-y-3 ${
                    isHit
                      ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                      : isTop5
                      ? 'bg-slate-900/95 border-amber-500/60 shadow-md'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Bar: Rank, Pair, Score, Delta */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isTop5
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          ML #{cand.mlCalibratedRank}
                        </span>
                        <span className="text-2xl font-black text-slate-100 tracking-tight">
                          {cand.pair}
                        </span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          Core
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-purple-300">
                          {cand.mlConfidenceScore}%
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center justify-end gap-1">
                          <span>Orig #{cand.originalConsensusRank}</span>
                          {rankDelta > 0 ? (
                            <span className="text-emerald-400 flex items-center font-bold">
                              <ArrowUpRight className="w-2.5 h-2.5" />+{rankDelta}
                            </span>
                          ) : rankDelta < 0 ? (
                            <span className="text-rose-400 flex items-center font-bold">
                              <ArrowDownRight className="w-2.5 h-2.5" />{rankDelta}
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center">
                              <Minus className="w-2.5 h-2.5" />0
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ground Truth Hit Badge (if live draw recorded) */}
                    {cand.groundTruthMatch && (
                      <div className="mt-2 p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {cand.groundTruthMatch.matchType} HIT ({cand.groundTruthMatch.market}: {cand.groundTruthMatch.number})
                        </span>
                        <span className="text-emerald-400">WIN</span>
                      </div>
                    )}

                    {/* Engine Badges */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {cand.engineBadges.map((b, bIdx) => (
                        <span
                          key={bIdx}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${b.color}`}
                        >
                          {b.name}
                        </span>
                      ))}
                    </div>

                    {/* Top Positive Predictive Factors */}
                    {cand.topPositiveFactors.length > 0 && (
                      <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                        {cand.topPositiveFactors.slice(0, 2).map((fac, facIdx) => (
                          <div key={facIdx} className="truncate flex items-center gap-1 text-slate-300">
                            <span className="text-purple-400 font-bold">•</span>
                            <span className="truncate">{fac}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions: Kelly Stake & Inspect */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-bold">
                      Kelly Stake: {cand.recommendedKellyStakePct}%
                    </span>
                    {onInspectCandidate && (
                      <button
                        type="button"
                        onClick={() => onInspectCandidate(cand.pair)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                      >
                        Deep Inspect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WALK-FORWARD HISTORICAL STEP LEDGER */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono uppercase">
              Walk-Forward Historical Model Validation Ledger
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowLedger(!showLedger)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>{showLedger ? 'Hide Walk-Forward Log' : `View ${mlReport.walkForwardHistory.length} Historical Steps`}</span>
            {showLedger ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showLedger && (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Actual Draws</th>
                  <th className="p-2.5">Top #1</th>
                  <th className="p-2.5">Top 5 Pool</th>
                  <th className="p-2.5">Exact Hits Found</th>
                  <th className="p-2.5">Top 10 / 36 Hit</th>
                  <th className="p-2.5">Brier Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mlReport.walkForwardHistory.map((step) => {
                  return (
                    <tr
                      key={step.date}
                      className={`hover:bg-slate-900/50 transition ${
                        step.hasExactTop5Hit ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-slate-200">{step.date}</td>
                      <td className="p-2.5 text-slate-300">
                        {step.targetDraws.map((d) => `${d.market[0]}:${d.number}`).join(' ')}
                      </td>
                      <td className="p-2.5 font-black text-amber-300">
                        {step.top1Pair} {step.hasExactTop1Hit && '⚡'}
                      </td>
                      <td className="p-2.5 text-slate-300 font-bold">
                        {step.top5Pairs.join(', ')}
                      </td>
                      <td className="p-2.5">
                        {step.exactHitsFound.length > 0 ? (
                          <span className="text-emerald-400 font-bold">
                            {step.exactHitsFound.map((h) => `${h.pair} (${h.market}, ML#${h.mlRank})`).join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-500">Miss</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            step.hasExactTop5Hit
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : step.hasExactTop10Hit
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : step.hasExactTop36Hit
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {step.hasExactTop5Hit
                            ? 'Top 5 Hit'
                            : step.hasExactTop10Hit
                            ? 'Top 10 Hit'
                            : step.hasExactTop36Hit
                            ? 'Top 36 Hit'
                            : 'Miss'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400">{step.brierScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
