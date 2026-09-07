import React, { useState, useMemo } from 'react';
import {
  Layers,
  Target,
  Bot,
  Zap,
  TrendingUp,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  Coins,
  Calculator,
  Sliders,
  AlertCircle,
  BarChart3,
  Award,
  ArrowRight,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  BookOpen,
} from 'lucide-react';
import { Market, MARKETS } from '../types';
import { ConsensusMLModelType, ConsensusMatrixMLReport } from '../utils/consensusMatrixMLEngine';

export interface MatchedMLRuleInfo {
  ruleCode: string;
  title: string;
  category: string;
  boostMultiplier: number;
  reason: string;
}

export interface ConsensusPoolItem {
  pair: string;
  score: number;
  engines: string[];
  tier: 'PRIME' | 'CONSENSUS' | 'DEFENSIVE' | 'LONGTAIL';
  suggestedBet: number;
  is1WeekEcho?: boolean;
  isCoreFamily?: boolean;
  isRashiMirror?: boolean;
  isBreakoutGap?: boolean;
  digitSum?: number;
  parity?: string;
  kellyStakePct?: number;
  mlPredictedProbability?: number;
  topFactors?: string[];
  matchedMLRules?: MatchedMLRuleInfo[];
  mlBoostMultiplier?: number;
  originalRank?: number;
  promotedByMLRules?: boolean;
  isImmuneToPruning?: boolean;
  arbitrationAction?: string;
  matchedHouses?: string[];
  houseAgreement?: string;
  houseRank?: number | null;
}

interface ConsensusDecisionMatrixHubProps {
  targetDate: string;
  consensusPool: ConsensusPoolItem[];
  actualResult: string;
  confidenceScore: number;
  confidenceLabel: string;
  confidenceReasoning: string[];
  totalCost: number;
  totalWinnings: number;
  netProfit: number;
  investmentCapital: number;
  onUpdateCapital: (amount: number) => void;
  activeModel: 'ensemble' | 'briquette_engine' | 'pattern_dashboard' | 'multi_head_ml' | ConsensusMLModelType;
  onSelectModel?: (model: 'ensemble' | 'briquette_engine' | 'pattern_dashboard' | 'multi_head_ml' | ConsensusMLModelType) => void;
  onModelChange?: (model: 'ensemble' | 'briquette_engine' | 'pattern_dashboard' | 'multi_head_ml' | ConsensusMLModelType) => void;
  onTrainML: (model: ConsensusMLModelType) => void;
  isTrainingML: boolean;
  mlReport: ConsensusMatrixMLReport | null;
  selectedHouse?: Market | 'ALL';
  runWalkForwardBacktest?: boolean;
  onToggleWalkForwardBacktest?: () => void;
  walkForwardHitRate?: number;
  walkForwardRoi?: number;
  bankrollCapital?: number;
  onRunWalkForward?: () => void;
  walkForwardStats?: { hitRate: number; roi: number };
  spotlightPair?: string;
}

export const ConsensusDecisionMatrixHub: React.FC<ConsensusDecisionMatrixHubProps> = ({
  targetDate,
  consensusPool,
  actualResult,
  confidenceScore,
  confidenceLabel,
  confidenceReasoning,
  totalCost,
  totalWinnings,
  netProfit,
  investmentCapital,
  onUpdateCapital,
  activeModel,
  onSelectModel,
  onModelChange,
  onTrainML,
  isTrainingML,
  mlReport,
  onRunWalkForward,
  walkForwardStats,
  spotlightPair,
}) => {
  const handleModelSelect = (model: any) => {
    if (onSelectModel) onSelectModel(model);
    if (onModelChange) onModelChange(model);
  };
  const [viewMode, setViewMode] = useState<'four_tier_executive' | 'grid_6x6'>('four_tier_executive');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [showMLConfig, setShowMLConfig] = useState<boolean>(false);
  const [showMLRulesLogAudit, setShowMLRulesLogAudit] = useState<boolean>(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<ConsensusPoolItem | null>(null);

  const actualWinsList = useMemo(() => {
    return actualResult.split(', ').map((s) => s.trim()).filter(Boolean);
  }, [actualResult]);

  // Aggregate ML Rules Log Execution Audit
  const mlRulesAuditSummary = useMemo(() => {
    const rulesTriggeredMap = new Map<
      string,
      { code: string; title: string; category: string; count: number; boost: number; pairs: string[]; reason: string }
    >();
    let promotedCount = 0;
    let boostedCount = 0;

    consensusPool.forEach((item) => {
      if (item.promotedByMLRules) promotedCount++;
      if (item.mlBoostMultiplier && item.mlBoostMultiplier > 1.0) boostedCount++;

      item.matchedMLRules?.forEach((rule) => {
        const existing = rulesTriggeredMap.get(rule.ruleCode);
        if (existing) {
          existing.count++;
          if (!existing.pairs.includes(item.pair)) existing.pairs.push(item.pair);
        } else {
          rulesTriggeredMap.set(rule.ruleCode, {
            code: rule.ruleCode,
            title: rule.title,
            category: rule.category,
            count: 1,
            boost: rule.boostMultiplier,
            pairs: [item.pair],
            reason: rule.reason,
          });
        }
      });
    });

    return {
      activeRules: Array.from(rulesTriggeredMap.values()).sort((a, b) => b.count - a.count),
      promotedCount,
      boostedCount,
      totalRulesFired: Array.from(rulesTriggeredMap.values()).reduce((acc, r) => acc + r.count, 0),
    };
  }, [consensusPool]);

  // Segregate consensus pool into the 4 precision tiers
  const tier1Items = useMemo(() => consensusPool.slice(0, 5), [consensusPool]);
  const tier2Items = useMemo(() => consensusPool.slice(5, 12), [consensusPool]);
  const tier3Items = useMemo(() => consensusPool.slice(12, 24), [consensusPool]);
  const tier4Items = useMemo(() => consensusPool.slice(24, 36), [consensusPool]);

  // Filtered pool for 6x6 grid or customized views
  const filteredPool = useMemo(() => {
    if (activeFilter === 'all') return consensusPool;
    if (activeFilter === 'tier1') return tier1Items;
    if (activeFilter === 'tier2') return tier2Items;
    if (activeFilter === 'tier3') return tier3Items;
    if (activeFilter === 'tier4') return tier4Items;
    if (activeFilter === 'ml_improvised') {
      return consensusPool.filter(
        (c) => (c.matchedMLRules && c.matchedMLRules.length > 0) || c.promotedByMLRules || (c.mlBoostMultiplier && c.mlBoostMultiplier > 1.0)
      );
    }
    if (activeFilter === 'ml_promoted') return consensusPool.filter((c) => c.promotedByMLRules);
    if (activeFilter === 'palti_symmetry') {
      return consensusPool.filter(
        (c) =>
          c.isRashiMirror ||
          (c.matchedMLRules &&
            c.matchedMLRules.some(
              (r) =>
                r.ruleCode === 'ML-RULE-102' ||
                r.ruleCode === 'ML-RULE-201' ||
                r.ruleCode === 'ML-RULE-301'
            ))
      );
    }
    if (activeFilter === 'multi_engine') return consensusPool.filter((c) => c.engines.length >= 2);
    if (activeFilter === '1w_echo') return consensusPool.filter((c) => c.is1WeekEcho);
    if (activeFilter === 'core_family') return consensusPool.filter((c) => c.isCoreFamily);
    if (activeFilter === 'rashi_mirror') return consensusPool.filter((c) => c.isRashiMirror);
    if (activeFilter === 'breakout_gap') return consensusPool.filter((c) => c.isBreakoutGap);
    return consensusPool;
  }, [activeFilter, consensusPool, tier1Items, tier2Items, tier3Items, tier4Items]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const handleExportCSV = () => {
    const headers = 'Rank,Pair,Tier,Score,SuggestedBet,Engines,1WeekEcho,CoreFamily,RashiMirror,BreakoutGap\n';
    const rows = consensusPool
      .map((c, i) => `${i + 1},${c.pair},${c.tier},${c.score},${c.suggestedBet},"${c.engines.join('; ')}",${!!c.is1WeekEcho},${!!c.isCoreFamily},${!!c.isRashiMirror},${!!c.isBreakoutGap}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Consensus_Matrix_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Consensus Matrix CSV downloaded successfully');
  };

  // Tactical verdict computation for executive decision making
  const tacticalVerdict = useMemo(() => {
    const highConfidence = confidenceScore >= 80;
    const moderateConfidence = confidenceScore >= 65;
    const tier1Winners = tier1Items.filter((c) => actualWinsList.includes(c.pair));

    if (highConfidence) {
      return {
        badge: 'ELITE HIGH CONVICTION',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        summary: 'Dense multi-engine resonance detected across Tier 1. Prioritize primary stakes on top anchors.',
        action: 'Deploy full Tier 1 stake with disciplined symmetric defense.',
      };
    } else if (moderateConfidence) {
      return {
        badge: 'BALANCED ENSEMBLE POSTURE',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        summary: 'Symmetrical distribution across top 12 pairs. Core families and harmonic mirrors active.',
        action: 'Maintain balanced 45/30/18/7 allocation across risk tiers.',
      };
    } else {
      return {
        badge: 'DEFENSIVE VOLATILITY HEDGE',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        summary: 'High dispersion across generation sources. Activate Rashi mirrors and defensive buffers.',
        action: 'Cap unit bet sizes and protect against double-digit or parity reversals.',
      };
    }
  }, [confidenceScore, tier1Items, actualWinsList]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Toast notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold font-mono text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-100 font-mono tracking-tight">
                Consensus Matrix & Quantitative Decision Hub
              </h3>
              <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                36 Pool
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-engine aggregation with zero lookahead bias, 4-tier risk segregation, and machine learning calibration.
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {walkForwardStats ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
              <span>Hit Rate: {walkForwardStats.hitRate.toFixed(1)}%</span>
              <span className="text-slate-600">|</span>
              <span>ROI: {walkForwardStats.roi.toFixed(1)}%</span>
            </div>
          ) : onRunWalkForward ? (
            <button
              type="button"
              onClick={onRunWalkForward}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-xl text-xs border border-purple-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Walk-Forward Audit</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setShowMLConfig(!showMLConfig)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border ${
              showMLConfig
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>ML Engine Settings</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Download CSV of 36-candidate matrix"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE DECISION TACTICAL CENTER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-wider">
                  Tactical Decision Verdict
                </span>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border ${tacticalVerdict.color}`}>
                  {tacticalVerdict.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {tacticalVerdict.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Ensemble Confidence</div>
              <div className="text-base font-black font-mono text-emerald-400">{confidenceScore}%</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Target Houses</div>
              <div className="text-xs font-bold font-mono text-cyan-300">Deshawar / Gali / FB / GZB</div>
            </div>
          </div>
        </div>

        {/* Top 5 Prime Anchors Quick-Action Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Tier 1 Elite Anchors (Top 5 Jodi - 45% Bankroll Allocation):
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    tier1Items.map((c) => `${c.pair} (₹${c.suggestedBet})`).join(', '),
                    'Top 5 Elite Jodi'
                  )
                }
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 cursor-pointer underline"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Top 5</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {tier1Items.map((item, idx) => {
                const isWin = actualWinsList.includes(item.pair);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono transition ${
                      isWin
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-100 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                    <span className="text-lg font-black tracking-wider text-emerald-400">{item.pair}</span>
                    <span className="text-[10px] font-bold bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                      ₹{item.suggestedBet}
                    </span>
                    {isWin && (
                      <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded">
                        WIN
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Copy All 36 & Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  consensusPool.map((c) => c.pair).join(' '),
                  'All 36 Jodi'
                )
              }
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy All 36 Jodi</span>
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  consensusPool.map((c) => `${c.pair}: ₹${c.suggestedBet}`).join('\n'),
                  'Full Stake Distribution'
                )
              }
              className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Copy Stakes</span>
            </button>
          </div>
        </div>
      </div>

      {/* MACHINE LEARNING TRAINING & CALIBRATION PANEL */}
      {showMLConfig && (
        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 font-mono">
                  Machine Learning Engine & Online Feature Training
                </h4>
                <p className="text-[11px] text-slate-400">
                  Trained on multi-engine agreement, 7-day recency echo, cross-market family coherence Z-scores, and Palti symmetry elasticity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeModel}
                onChange={(e) => handleModelSelect(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="calibrated_ensemble">Calibrated Ensemble (Multi-Engine)</option>
                <option value="pattern_dashboard">Pattern Dashboard Engine (Unified 4-Method)</option>
                <option value="multi_head_ml">Multi-Head ML Engine (Model F - 4 Houses)</option>
                <option value="gbdt_consensus_forest">GBDT Consensus Forest</option>
                <option value="neural_attention_ranker">Neural Attention Weight Ranker</option>
                <option value="recency_adaptive_bayesian">Recency Adaptive Bayesian Walk-Forward</option>
                <option value="briquette_engine">Briquette Coordinates Engine</option>
                <option value="ensemble">Standard Deterministic Ensemble</option>
              </select>

              <button
                type="button"
                disabled={isTrainingML}
                onClick={() => {
                  const targetModel =
                    activeModel === 'ensemble' || activeModel === 'briquette_engine' || activeModel === 'pattern_dashboard' || activeModel === 'multi_head_ml'
                      ? 'calibrated_ensemble'
                      : (activeModel as ConsensusMLModelType);
                  onTrainML(targetModel);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-950/40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTrainingML ? 'animate-spin' : ''}`} />
                <span>{isTrainingML ? 'Training Model...' : 'Train ML & Calibrate Matrix'}</span>
              </button>
            </div>
          </div>

          {/* Model Metrics Display */}
          {mlReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Convergence</span>
                <span className="text-sm font-black font-mono text-emerald-400">{mlReport.modelConvergenceScore}%</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Precision@5</span>
                <span className="text-sm font-black font-mono text-cyan-400">{mlReport.precisionAt5}%</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Precision@10</span>
                <span className="text-sm font-black font-mono text-indigo-400">{mlReport.precisionAt10}%</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Pool Coverage</span>
                <span className="text-sm font-black font-mono text-purple-400">{mlReport.top36PoolCoverageRate}%</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Brier Loss</span>
                <span className="text-sm font-black font-mono text-amber-400">{mlReport.brierLossScore.toFixed(3)}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Lift vs Random</span>
                <span className="text-sm font-black font-mono text-emerald-400">{mlReport.liftVsRandom.toFixed(1)}x</span>
              </div>
            </div>
          )}

          {/* Feature Importances */}
          {mlReport?.featureImportances && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Trained Feature Importance Weights
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {mlReport.featureImportances.slice(0, 4).map((f, i) => (
                  <div key={i} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-xs">
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-slate-300 truncate font-semibold">{f.displayName}</span>
                      <span className="text-cyan-400 font-bold">{f.relativeWeightPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                        style={{ width: `${Math.min(100, f.relativeWeightPct)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ML RULES OPTIMIZATION & LOG IMPROVISED AUDIT BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black font-mono text-indigo-200 uppercase tracking-wider">
                  Consensus Matrix Improvised via Machine Learning Log of Rules
                </h3>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  Autonomous Rules Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every candidate score, tier allocation, boundary cutoff, and reciprocal symmetry lock is calibrated per empirical rules ML-101 to ML-308.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMLRulesLogAudit(!showMLRulesLogAudit)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showMLRulesLogAudit ? 'Hide Rules Log Ledger' : 'Inspect ML Rules Log Ledger'}</span>
            {showMLRulesLogAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 4 Quantitative ML Impact Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Rules Executed</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-indigo-400">{mlRulesAuditSummary.totalRulesFired}</span>
              <span className="text-[11px] font-mono text-slate-500">triggers fired</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Across 20 codified rules</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Numbers Improvised</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-cyan-400">{mlRulesAuditSummary.boostedCount}</span>
              <span className="text-[11px] font-mono text-slate-500">/ 36 matrix pairs</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Score multiplier enhanced</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Boundary Cutoff Promotions</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-amber-400">{mlRulesAuditSummary.promotedCount}</span>
              <span className="text-[11px] font-mono text-slate-500">pairs rescued</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Ranks #37+ lifted into top 36</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Reciprocal Symmetry Locks</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-emerald-400">
                {consensusPool.filter(c => c.isRashiMirror || (c.matchedMLRules && c.matchedMLRules.some(r => r.ruleCode === 'ML-RULE-301' || r.ruleCode === 'ML-RULE-102'))).length}
              </span>
              <span className="text-[11px] font-mono text-slate-500">Palti safeguards</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Prevents 1-way mirror miss</span>
          </div>
        </div>

        {/* EXPANDABLE MACHINE LEARNING RULES LEDGER */}
        {showMLRulesLogAudit && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold text-slate-200">Active Rule Modulations on Selected Target Draw</span>
              <span>{mlRulesAuditSummary.activeRules.length} Unique Rules Active</span>
            </div>

            {mlRulesAuditSummary.activeRules.length === 0 ? (
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-xs font-mono text-slate-400">
                Standard baseline distribution active. ML rules are ready for trigger conditions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {mlRulesAuditSummary.activeRules.map((rule, rIdx) => (
                  <div
                    key={rIdx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3 space-y-2 transition font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 text-[10px]">
                          {rule.code}
                        </span>
                        <span className="font-bold text-slate-200">{rule.title}</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-[11px]">+{rule.boost}x Boost</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{rule.reason}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold">Affected Numbers ({rule.pairs.length}):</span>
                      {rule.pairs.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const c = consensusPool.find((x) => x.pair === p);
                            if (c) setSelectedCandidateDetail(c);
                          }}
                          className="px-1.5 py-0.2 rounded bg-slate-950 hover:bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold cursor-pointer transition"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW CONTROLS & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-y border-slate-800/80 py-3">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('four_tier_executive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'four_tier_executive'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4-Tier Segregation (Decision View)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid_6x6')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid_6x6'
                ? 'bg-slate-800 text-cyan-300 shadow border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>6×6 Spatial Grid View</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 text-[10px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {[
            { id: 'all', label: `All (${consensusPool.length})` },
            {
              id: 'ml_improvised',
              label: `✦ ML Improvised (${consensusPool.filter(c => (c.matchedMLRules && c.matchedMLRules.length > 0) || c.promotedByMLRules).length})`,
            },
            {
              id: 'ml_promoted',
              label: `↑ Promoted to 36 (${consensusPool.filter(c => c.promotedByMLRules).length})`,
            },
            { id: 'palti_symmetry', label: 'Palti Symmetry' },
            { id: 'tier1', label: `Tier 1 Elite (${tier1Items.length})` },
            { id: 'tier2', label: `Tier 2 (${tier2Items.length})` },
            { id: 'tier3', label: `Tier 3 (${tier3Items.length})` },
            { id: 'tier4', label: `Tier 4 (${tier4Items.length})` },
            { id: 'multi_engine', label: 'Multi-Engine (≥2)' },
            { id: '1w_echo', label: '1W Echo' },
            { id: 'core_family', label: 'Core Family' },
            { id: 'rashi_mirror', label: 'Rashi Mirror' },
            { id: 'breakout_gap', label: 'Breakouts' },
          ].map((flt) => (
            <button
              key={flt.id}
              type="button"
              onClick={() => setActiveFilter(flt.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                activeFilter === flt.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: FOUR-TIER PRECISION SEGREGATION (EXECUTIVE DECISION VIEW) */}
      {viewMode === 'four_tier_executive' && (
        <div className="space-y-6">
          {/* TIER 1: ELITE PRIME (#1 - #5) */}
          <div className="bg-slate-950/80 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl shadow-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-500/20 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black font-mono text-emerald-300 uppercase tracking-wider">
                      Tier 1: Elite Prime Core (Rank #1–#5)
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      45% Bankroll Allocation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Highest-conviction anchors supported by multi-engine intersections. Primary capital target.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">
                  Tier Capital: <strong className="text-emerald-400">₹{tier1Items.reduce((acc, c) => acc + c.suggestedBet, 0)}</strong> (~₹{tier1Items[0]?.suggestedBet || 0}/item)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      tier1Items.map((c) => c.pair).join(', '),
                      'Tier 1 pairs'
                    )
                  }
                  className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Tier 1</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              {tier1Items.map((item, idx) => (
                <CandidateCard
                  key={item.pair}
                  candidate={item}
                  rank={idx + 1}
                  isWinner={actualWinsList.includes(item.pair)}
                  tierColor="emerald"
                  onInspect={setSelectedCandidateDetail}
                  spotlightPair={spotlightPair}
                />
              ))}
            </div>
          </div>

          {/* TIER 2: HIGH CONVICTION (#6 - #12) */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black font-mono text-cyan-300 uppercase tracking-wider">
                      Tier 2: High Conviction (Rank #6–#12)
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      30% Bankroll Allocation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Strong multi-signal resonance, validated by recency echo and day-of-week alignment.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">
                  Tier Capital: <strong className="text-cyan-400">₹{tier2Items.reduce((acc, c) => acc + c.suggestedBet, 0)}</strong> (~₹{tier2Items[0]?.suggestedBet || 0}/item)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      tier2Items.map((c) => c.pair).join(', '),
                      'Tier 2 pairs'
                    )
                  }
                  className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Tier 2</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
              {tier2Items.map((item, idx) => (
                <CandidateCard
                  key={item.pair}
                  candidate={item}
                  rank={idx + 6}
                  isWinner={actualWinsList.includes(item.pair)}
                  tierColor="cyan"
                  onInspect={setSelectedCandidateDetail}
                  spotlightPair={spotlightPair}
                />
              ))}
            </div>
          </div>

          {/* TIER 3: CALIBRATED DEFENSE (#13 - #24) */}
          <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black font-mono text-purple-300 uppercase tracking-wider">
                      Tier 3: Calibrated Defense (Rank #13–#24)
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                      18% Bankroll Allocation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Systematic coverage pairs, family hedge protection, and Rashi mirror absorption.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">
                  Tier Capital: <strong className="text-purple-400">₹{tier3Items.reduce((acc, c) => acc + c.suggestedBet, 0)}</strong> (~₹{tier3Items[0]?.suggestedBet || 0}/item)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      tier3Items.map((c) => c.pair).join(', '),
                      'Tier 3 pairs'
                    )
                  }
                  className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Tier 3</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {tier3Items.map((item, idx) => (
                <CandidateCard
                  key={item.pair}
                  candidate={item}
                  rank={idx + 13}
                  isWinner={actualWinsList.includes(item.pair)}
                  tierColor="purple"
                  onInspect={setSelectedCandidateDetail}
                  spotlightPair={spotlightPair}
                />
              ))}
            </div>
          </div>

          {/* TIER 4: SUPPORT BUFFER (#25 - #36) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black font-mono text-slate-300 uppercase tracking-wider">
                      Tier 4: Support Buffer (Rank #25–#36)
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      7% Bankroll Allocation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Low-weight safety buffer, boundary dispersion absorption, and breakout shock absorbers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">
                  Tier Capital: <strong className="text-slate-300">₹{tier4Items.reduce((acc, c) => acc + c.suggestedBet, 0)}</strong> (~₹{tier4Items[0]?.suggestedBet || 0}/item)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      tier4Items.map((c) => c.pair).join(', '),
                      'Tier 4 pairs'
                    )
                  }
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Tier 4</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {tier4Items.map((item, idx) => (
                <CandidateCard
                  key={item.pair}
                  candidate={item}
                  rank={idx + 25}
                  isWinner={actualWinsList.includes(item.pair)}
                  tierColor="slate"
                  onInspect={setSelectedCandidateDetail}
                  spotlightPair={spotlightPair}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 6x6 SPATIAL GRID VIEW */}
      {viewMode === 'grid_6x6' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Displaying {filteredPool.length} candidates in 6×6 spatial layout</span>
            <span>Sorted by consensus score & engine weights</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {filteredPool.map((c, idx) => (
              <CandidateCard
                key={c.pair}
                candidate={c}
                rank={consensusPool.indexOf(c) + 1}
                isWinner={actualWinsList.includes(c.pair)}
                tierColor={
                  c.tier === 'PRIME'
                    ? 'emerald'
                    : c.tier === 'CONSENSUS'
                    ? 'cyan'
                    : c.tier === 'DEFENSIVE'
                    ? 'purple'
                    : 'slate'
                }
                onInspect={setSelectedCandidateDetail}
                spotlightPair={spotlightPair}
              />
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC KELLY & CAPITAL ALLOCATOR SPREADSHEET */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-mono">
                Consensus Investment Allocator & Risk Modeler
              </h4>
              <p className="text-[11px] text-slate-400">
                Dynamic bankroll distribution across precision tiers with 90x return estimation.
              </p>
            </div>
          </div>

          {/* Quick Capital Sliders / Input */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Investment Budget:</span>
            <div className="flex items-center gap-1">
              {[1000, 2000, 3000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onUpdateCapital(amt)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                    investmentCapital === amt
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Tier Risk Matrix Table */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
          {[
            {
              tier: 'TIER 1 ELITE PRIME',
              share: '45%',
              count: 5,
              items: tier1Items,
              color: 'text-emerald-400 border-emerald-500/30',
            },
            {
              tier: 'TIER 2 HIGH CONVICTION',
              share: '30%',
              count: 7,
              items: tier2Items,
              color: 'text-cyan-400 border-cyan-500/30',
            },
            {
              tier: 'TIER 3 DEFENSE HEDGE',
              share: '18%',
              count: 12,
              items: tier3Items,
              color: 'text-purple-400 border-purple-500/30',
            },
            {
              tier: 'TIER 4 SUPPORT BUFFER',
              share: '7%',
              count: 12,
              items: tier4Items,
              color: 'text-slate-400 border-slate-700',
            },
          ].map((row, rIdx) => {
            const spend = row.items.reduce((acc, c) => acc + c.suggestedBet, 0);
            const hits = row.items.filter((c) => actualWinsList.includes(c.pair));
            const hitWinnings = hits.reduce((acc, c) => acc + c.suggestedBet * 90, 0);

            return (
              <div key={rIdx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${row.color}`}>{row.tier}</span>
                  <span className="text-[10px] font-bold bg-slate-950 px-1.5 py-0.5 rounded text-slate-400">
                    {row.share}
                  </span>
                </div>

                <div className="text-xl font-black text-slate-100">
                  ₹{spend} <span className="text-xs text-slate-500 font-normal">({row.count} items)</span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Per Jodi unit:</span>
                    <span className="text-slate-200 font-bold">₹{row.items[0]?.suggestedBet || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1 Hit Return (90x):</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{(row.items[0]?.suggestedBet || 0) * 90}
                    </span>
                  </div>
                  {actualResult !== 'PENDING' && (
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span>Draw Outcome:</span>
                      <span className={hits.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {hits.length} hit (₹{hitWinnings})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Consolidated Portfolio Banner */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">Consolidated Play Metrics</div>
              <div className="text-[11px] text-slate-400">36 Jodi balanced coverage across all 4 houses.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-center md:text-right">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Total Portfolio Capital</div>
              <div className="text-base font-black text-slate-100">₹{totalCost}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Draw Winnings</div>
              <div className="text-base font-black text-emerald-400">₹{totalWinnings}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Net Day Balance</div>
              <div className={`text-base font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{netProfit >= 0 ? '+' : ''}{netProfit}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CANDIDATE ML RULES DETAILED AUDIT MODAL */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-mono font-black text-2xl text-indigo-300">
                  {selectedCandidateDetail.pair}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono font-bold text-slate-100 text-base">
                      Candidate #{consensusPool.indexOf(selectedCandidateDetail) + 1} — Jodi {selectedCandidateDetail.pair}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      {selectedCandidateDetail.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Consensus Score: <strong className="text-cyan-400">{selectedCandidateDetail.score} pts</strong> | Suggested Bet: <strong className="text-emerald-400">₹{selectedCandidateDetail.suggestedBet}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidateDetail(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Promotion and Multiplier Banner */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">PRE-ML ORIGINAL RANK</span>
                <span className="text-slate-200 font-bold">
                  {selectedCandidateDetail.originalRank ? `Rank #${selectedCandidateDetail.originalRank}` : 'Top 36 Seed'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-slate-500 text-[10px] block">FINAL MATRIX RANK</span>
                <span className="text-emerald-400 font-bold">
                  Rank #{consensusPool.indexOf(selectedCandidateDetail) + 1} ({selectedCandidateDetail.tier})
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">ML BOOST FACTOR</span>
                <span className="text-indigo-300 font-black">
                  +{selectedCandidateDetail.mlBoostMultiplier || 1.0}x
                </span>
              </div>
            </div>

            {/* Matched ML Rules List */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                Active Machine Learning Rules Matched ({selectedCandidateDetail.matchedMLRules?.length || 0})
              </span>

              {!selectedCandidateDetail.matchedMLRules || selectedCandidateDetail.matchedMLRules.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs font-mono text-slate-400">
                  No explicit bonus rules triggered; position driven by multi-engine foundation consensus.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedCandidateDetail.matchedMLRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-1 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                            {rule.ruleCode}
                          </span>
                          <span className="font-bold text-slate-200 text-xs">{rule.title}</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-[11px]">+{rule.boostMultiplier}x</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{rule.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic Tags & Supporting Engines */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Supporting Engines:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCandidateDetail.engines.map((e, ei) => (
                    <span key={ei} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCandidateDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CandidateCardProps {
  candidate: ConsensusPoolItem;
  rank: number;
  isWinner: boolean;
  tierColor: 'emerald' | 'cyan' | 'purple' | 'slate';
  onInspect?: (candidate: ConsensusPoolItem) => void;
  spotlightPair?: string;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, rank, isWinner, tierColor, onInspect, spotlightPair }) => {
  const isSpotlighted = Boolean(spotlightPair && spotlightPair === candidate.pair);
  let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-950';
  let badgeColor = 'bg-slate-900 text-slate-400';

  if (isSpotlighted) {
    borderStyle = 'bg-amber-950/60 border-amber-400 ring-4 ring-amber-400/80 shadow-2xl shadow-amber-500/30 scale-[1.03] z-10';
    badgeColor = 'bg-amber-500 text-slate-950 font-black';
  } else if (isWinner) {
    borderStyle = 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/30';
  } else if (tierColor === 'emerald') {
    borderStyle = 'bg-slate-950 border-emerald-500/30 hover:border-emerald-500/60';
    badgeColor = 'bg-emerald-500/20 text-emerald-300';
  } else if (tierColor === 'cyan') {
    borderStyle = 'bg-slate-950 border-cyan-500/30 hover:border-cyan-500/60';
    badgeColor = 'bg-cyan-500/20 text-cyan-300';
  } else if (tierColor === 'purple') {
    borderStyle = 'bg-slate-950 border-purple-500/30 hover:border-purple-500/60';
    badgeColor = 'bg-purple-500/20 text-purple-300';
  }

  return (
    <div
      onClick={() => onInspect?.(candidate)}
      className={`border rounded-xl p-3 flex flex-col justify-between space-y-2 transition relative group hover:scale-[1.02] cursor-pointer ${borderStyle}`}
    >
      <div className="flex items-center justify-between font-mono">
        <span className="text-[10px] font-bold text-slate-500">Rank #{rank}</span>
        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${badgeColor}`}>
          {candidate.tier}
        </span>
      </div>

      {/* Spotlight badge */}
      {isSpotlighted && (
        <div className="text-center">
          <span className="text-[7.5px] font-mono font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2 py-0.5 rounded-full shadow-md animate-pulse">
            🎯 ACTIVE SPOTLIGHT
          </span>
        </div>
      )}

      {/* Pruning Protection / House Gem indicator */}
      {candidate.isImmuneToPruning && (
        <div className="text-center">
          <span
            title="Pruning Protection: Safeguarded by Multi-Head Cross-Arbitration Layer to retain house specialist gems."
            className="text-[7.5px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 inline-flex items-center gap-0.5"
          >
            🛡️ Prune Immune
          </span>
        </div>
      )}

      {/* Promotion indicator if lifted from #37+ by ML rules */}
      {candidate.promotedByMLRules && (
        <div className="text-center">
          <span
            title={`Originally ranked #${candidate.originalRank || '37+'} prior to ML rule calibrations. Promoted into Top 36 Consensus Matrix.`}
            className="text-[7.5px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 inline-flex items-center gap-0.5"
          >
            ↑ ML Promoted (#{candidate.originalRank || '37+'})
          </span>
        </div>
      )}

      {/* Matched House Gems tags */}
      {candidate.matchedHouses && candidate.matchedHouses.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {candidate.matchedHouses.map((h, hi) => (
            <span
              key={hi}
              className="text-[7px] font-mono font-bold bg-emerald-950/90 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30 uppercase"
            >
              {h.slice(0, 3)} #{candidate.houseRank || 'Gem'}
            </span>
          ))}
        </div>
      )}

      <div className="text-center py-0.5">
        <div className="font-mono text-3xl font-black text-slate-100 tracking-wider">
          {candidate.pair}
        </div>
        <div className="flex items-center justify-center gap-1 mt-0.5 font-mono">
          <span className="text-[10px] text-cyan-400 font-bold">
            {candidate.score} pts
          </span>
          {candidate.mlBoostMultiplier && candidate.mlBoostMultiplier > 1.0 && (
            <span
              title="Autonomous ML multiplier boost applied based on empirical rules log"
              className="text-[8px] font-black text-indigo-300 bg-indigo-950/90 px-1 py-0.2 rounded border border-indigo-500/30"
            >
              +{candidate.mlBoostMultiplier}x ML
            </span>
          )}
        </div>
      </div>

      {/* Active Matched ML Rules Code Badges */}
      {candidate.matchedMLRules && candidate.matchedMLRules.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center pt-1 border-t border-slate-900/80">
          {candidate.matchedMLRules.slice(0, 3).map((r, rIdx) => (
            <span
              key={rIdx}
              title={`${r.ruleCode}: ${r.title} (+${r.boostMultiplier}x) — ${r.reason}`}
              className="text-[7.5px] font-mono font-bold bg-indigo-950/80 text-indigo-300 px-1 py-0.2 rounded border border-indigo-500/30 hover:border-indigo-400 cursor-help"
            >
              {r.ruleCode.replace('ML-RULE-', 'ML-')}
            </span>
          ))}
          {candidate.matchedMLRules.length > 3 && (
            <span
              title={candidate.matchedMLRules.slice(3).map((r) => `${r.ruleCode}: ${r.title}`).join('\n')}
              className="text-[7.5px] font-mono font-bold bg-slate-800 text-slate-400 px-1 py-0.2 rounded cursor-help"
            >
              +{candidate.matchedMLRules.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Diagnostic indicator badges */}
      <div className="flex flex-wrap gap-1 justify-center">
        {candidate.is1WeekEcho && (
          <span
            title="Appeared in recent 7-day draws (Recency Echo)"
            className="text-[8px] font-mono font-bold bg-teal-500/20 text-teal-300 px-1 py-0.2 rounded border border-teal-500/30 cursor-help"
          >
            1W Echo
          </span>
        )}
        {candidate.isCoreFamily && (
          <span
            title="Belongs to dominant core family root"
            className="text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded border border-cyan-500/30 cursor-help"
          >
            Core Fam
          </span>
        )}
        {candidate.isRashiMirror && (
          <span
            title="5-difference Rashi harmonic twin active"
            className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30 cursor-help"
          >
            Rashi Twin
          </span>
        )}
        {candidate.isBreakoutGap && (
          <span
            title="Unseen in past 7+ days (Breakout candidate)"
            className="text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 cursor-help"
          >
            Breakout
          </span>
        )}
      </div>

      {/* Engine tags */}
      <div className="flex flex-wrap justify-center gap-1 pt-1 border-t border-slate-900">
        {candidate.engines.map((eng, eIdx) => {
          const short = eng.length > 8 ? eng.slice(0, 3) : eng;
          return (
            <span
              key={eIdx}
              title={eng}
              className="text-[8px] font-mono font-bold bg-slate-900 text-slate-400 px-1 rounded border border-slate-800 cursor-help"
            >
              {short}
            </span>
          );
        })}
      </div>

      {/* Unit Bet Suggestion */}
      <div className="text-center pt-1 bg-slate-950/80 rounded border border-slate-800/40 text-[10px] font-mono text-emerald-400 font-bold">
        Play: ₹{candidate.suggestedBet}
      </div>

      {isWinner && (
        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border border-emerald-400">
          MATCHED WIN
        </span>
      )}
    </div>
  );
};
