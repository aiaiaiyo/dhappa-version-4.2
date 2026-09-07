import React, { useState } from 'react';
import {
  CustomNumberAssessment,
  RASHI_COMPLEMENT_MAP,
} from '../utils/customNumberIntelligenceEngine';
import { Currency } from '../types';
import {
  X,
  ShieldCheck,
  Zap,
  TrendingUp,
  History,
  Target,
  BarChart3,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Check,
  Send,
  Copy,
  Info,
  Calendar,
  Activity,
  ArrowRight,
  Search,
  Scale,
  Flame,
  Clock,
  Award,
} from 'lucide-react';

interface CustomNumberDetailModalProps {
  assessment: CustomNumberAssessment | null;
  isOpen: boolean;
  onClose: () => void;
  onSendToSimulator?: (pairs: string[]) => void;
  currency?: Currency;
}

export const CustomNumberDetailModal: React.FC<CustomNumberDetailModalProps> = ({
  assessment,
  isOpen,
  onClose,
  onSendToSimulator,
  currency = 'INR',
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'engines' | 'core_x' | 'markets' | 'similarity'>('evidence');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !assessment) return null;

  const {
    pair,
    rank,
    historicalEvidenceScore,
    currentPatternMatchScore,
    unifiedResearchScore,
    evidenceLevel,
    calibratedOosTop10HitRate,
    sampleSize,
    engineSupport,
    coreX,
    patternMatch,
    marketAssessment,
    similaritySearch,
    whyRankedHighReasons,
    cautionRiskFactors,
  } = assessment;

  const copyAssessment = () => {
    const text = `Numerix Intelligence Assessment for #${pair}
Rank: #${rank} | Evidence: ${evidenceLevel}
Unified Research Score: ${unifiedResearchScore}/100 (Historical: ${historicalEvidenceScore}, Pattern: ${currentPatternMatchScore})
Engine Agreement: ${engineSupport.agreementCount}/${engineSupport.totalDimensions}
OOS Top-10 Hit Rate: ${calibratedOosTop10HitRate}%
Core-X Derivation: ${coreX.coreXRelation.derivationText}
Mirror: ${coreX.mirrorPair} | Vedic Rashi: ${coreX.rashiPair}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierColor = (level: string) => {
    switch (level) {
      case 'STRONG':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-emerald-500/30';
      case 'MODERATE':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 ring-indigo-500/30';
      case 'SPECIALIZED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      id="custom-number-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="custom-number-detail-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/20 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800/80 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <span className="font-mono text-3xl sm:text-4xl font-black text-cyan-300 tracking-wider">
                  {pair}
                </span>
              </div>
              <span className="absolute -top-2 -left-2 bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                #{rank}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                  Custom Number #{pair} Intelligence
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border ring-1 ${getTierColor(evidenceLevel)}`}>
                  {evidenceLevel} EVIDENCE
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-400 flex-wrap">
                <span>
                  Digits: <strong className="text-slate-200">[{coreX.tens}, {coreX.ones}]</strong>
                </span>
                <span>•</span>
                <span>
                  Sum: <strong className="text-slate-200">{coreX.tens + coreX.ones} (&Sigma;={coreX.digitSum})</strong>
                </span>
                <span>•</span>
                <span>
                  Delta: <strong className="text-slate-200">&Delta;={coreX.digitDiff}</strong>
                </span>
                <span>•</span>
                <span>
                  Mirror: <strong className="text-amber-300">{coreX.mirrorPair}</strong>
                </span>
                <span>•</span>
                <span>
                  Rashi: <strong className="text-purple-300">{coreX.rashiPair}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-assessment-btn"
              type="button"
              onClick={copyAssessment}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
              title="Copy Assessment Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              id="close-custom-number-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRIMARY SCORES STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/40 border-b border-slate-800 text-xs font-mono">
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Unified Research</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-1">
              {unifiedResearchScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              45% Hist + 55% Pattern
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Hist. Evidence</span>
              <History className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-200 mt-1">
              {historicalEvidenceScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Frequency & Stability
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Pattern Match</span>
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {currentPatternMatchScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Pre-Draw Zero-Leakage
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Engine Agreement</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              {engineSupport.agreementCount} <span className="text-xs text-slate-500 font-normal">/ {engineSupport.totalDimensions}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              OOS Hit Rate: <strong className="text-emerald-400">{calibratedOosTop10HitRate}%</strong>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-1 text-xs font-mono overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3.5 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Why Ranked? & Cautions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engines')}
            className={`py-3 px-3.5 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'engines'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>6-Engine Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('core_x')}
            className={`py-3 px-3.5 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'core_x'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Historical Core-X</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('markets')}
            className={`py-3 px-3.5 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'markets'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>4-Market Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('similarity')}
            className={`py-3 px-3.5 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'similarity'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Similarity Search</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: WHY RANKED & CAUTIONS */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Positives */}
                <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Why It Ranked High ({whyRankedHighReasons.length} Supporting Factors)</span>
                  </div>
                  {whyRankedHighReasons.length > 0 ? (
                    <ul className="space-y-2 text-xs font-mono text-slate-300">
                      {whyRankedHighReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs font-mono text-slate-500 italic">
                      No systematic positive signals triggered for this candidate.
                    </div>
                  )}
                </div>

                {/* Cautions */}
                <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-amber-500/20 text-amber-400 text-xs font-mono font-bold uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Caution & Risk Factors ({cautionRiskFactors.length})</span>
                  </div>
                  {cautionRiskFactors.length > 0 ? (
                    <ul className="space-y-2 text-xs font-mono text-slate-300">
                      {cautionRiskFactors.map((caution, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold mt-0.5">△</span>
                          <span>{caution}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs font-mono text-slate-400">
                      No critical risk anomalies detected; historical skip and stability are within normal bounds.
                    </div>
                  )}
                </div>
              </div>

              {/* Scoring Math Transparency */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300 font-bold uppercase text-[11px] mb-2">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Transparent Scoring Math & Weighting</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1.5 text-slate-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>Historical Evidence Contribution (45% Weight):</span>
                    <strong className="text-slate-200">
                      {historicalEvidenceScore} &times; 0.45 = {(historicalEvidenceScore * 0.45).toFixed(1)} pts
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pre-Draw Pattern Match Contribution (55% Weight):</span>
                    <strong className="text-slate-200">
                      {currentPatternMatchScore} &times; 0.55 = {(currentPatternMatchScore * 0.55).toFixed(1)} pts
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-800 font-bold text-cyan-300">
                    <span>Unified Research Score:</span>
                    <span>{unifiedResearchScore} / 100</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  * Note: Model scores reflect empirical evidence convergence and are calibrated against out-of-sample walk-forward test logs, not simple random chance.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 6-ENGINE SUPPORT MATRIX */}
          {activeTab === 'engines' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                {/* E1 */}
                <div className={`p-3.5 rounded-xl border ${engineSupport.engine1DateGen.active ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">1. Date Generator Triad</span>
                    {engineSupport.engine1DateGen.active ? (
                      <span className="text-[10px] bg-cyan-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">INACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{engineSupport.engine1DateGen.detail}</div>
                </div>

                {/* E2 */}
                <div className={`p-3.5 rounded-xl border ${engineSupport.engine2PrevDay.active ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">2. Previous-Day Repeated</span>
                    {engineSupport.engine2PrevDay.active ? (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">INACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{engineSupport.engine2PrevDay.detail}</div>
                </div>

                {/* E3 */}
                <div className={`p-3.5 rounded-xl border ${engineSupport.engine3SirAbhishek.active ? 'bg-amber-950/30 border-amber-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">3. 15-Pair Matrix (S-Set)</span>
                    {engineSupport.engine3SirAbhishek.active ? (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">INACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{engineSupport.engine3SirAbhishek.detail}</div>
                </div>

                {/* E4 */}
                <div className={`p-3.5 rounded-xl border ${engineSupport.engine4FaridabadDelta.active ? 'bg-fuchsia-950/30 border-fuchsia-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">4. Faridabad Delta</span>
                    {engineSupport.engine4FaridabadDelta.active ? (
                      <span className="text-[10px] bg-fuchsia-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">INACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{engineSupport.engine4FaridabadDelta.detail}</div>
                </div>

                {/* E5 */}
                <div className={`p-3.5 rounded-xl border ${engineSupport.engine5MultiSignal.active ? 'bg-blue-950/30 border-blue-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">5. Multi-Signal Engine</span>
                    {engineSupport.engine5MultiSignal.active ? (
                      <span className="text-[10px] bg-blue-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">INACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{engineSupport.engine5MultiSignal.detail}</div>
                </div>

                {/* E6 */}
                <div className={`p-3.5 rounded-xl border ${engineSupport.engine6MarkovTransition.active ? 'bg-indigo-950/30 border-indigo-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">6. Markov & Transitions</span>
                    {engineSupport.engine6MarkovTransition.active ? (
                      <span className="text-[10px] bg-indigo-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">INACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{engineSupport.engine6MarkovTransition.detail}</div>
                </div>
              </div>

              {/* Positional Haruf & Mathematical Complements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Haruf Inside ({coreX.tens})</span>
                  <div className="text-slate-200 font-bold mt-1">{engineSupport.harufInsideSupport.detail}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Haruf Outside ({coreX.ones})</span>
                  <div className="text-slate-200 font-bold mt-1">{engineSupport.harufOutsideSupport.detail}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Mirror / Palti ({coreX.mirrorPair})</span>
                  <div className="text-amber-300 font-bold mt-1">{engineSupport.mirrorSupport.detail}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Vedic Rashi ({coreX.rashiPair})</span>
                  <div className="text-purple-300 font-bold mt-1">{engineSupport.rashiSupport.detail}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORICAL CORE-X & RECURRENCE */}
          {activeTab === 'core_x' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px] mb-2">
                  <Target className="w-4 h-4" />
                  <span>Mathematical Core-X Derivation</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {coreX.coreXRelation.derivationText}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400">Root Triad X:</span> <strong className="text-cyan-300">X={coreX.coreXRelation.targetDateX}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Direct Root Match:</span> <strong className="text-slate-200">{coreX.coreXRelation.isRootDirect ? 'YES' : 'NO'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Sum Equals X:</span> <strong className="text-slate-200">{coreX.coreXRelation.isSumEqualToX ? 'YES' : 'NO'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Delta Equals X:</span> <strong className="text-slate-200">{coreX.coreXRelation.isDiffEqualToX ? 'YES' : 'NO'}</strong>
                  </div>
                </div>
              </div>

              {/* Historical Frequencies & Skip Intervals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Total Hits</div>
                  <div className="text-xl font-black text-slate-200 mt-1">
                    {coreX.totalHistoricalOccurrences} <span className="text-xs text-slate-400">({coreX.historicalHitFrequencyPct}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">in {coreX.totalEvaluatedDraws} house draws</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Rolling Frequency</div>
                  <div className="text-sm font-bold text-slate-200 mt-1 space-y-0.5">
                    <div>30d: <strong className="text-cyan-300">{coreX.rolling30DayHits}</strong></div>
                    <div>60d: <strong className="text-slate-300">{coreX.rolling60DayHits}</strong> | 90d: <strong className="text-slate-300">{coreX.rolling90DayHits}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Skip Behavior</div>
                  <div className="text-sm font-bold text-slate-200 mt-1 space-y-0.5">
                    <div>Current: <strong className={coreX.currentSkipDraws > coreX.averageSkipDraws * 1.5 ? 'text-amber-400' : 'text-emerald-400'}>{coreX.currentSkipDraws} draws</strong></div>
                    <div>Avg: <strong className="text-slate-300">{coreX.averageSkipDraws}</strong> | Max: <strong className="text-slate-300">{coreX.maxSkipDraws}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Stability Index</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      coreX.stabilityIndex === 'STABLE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : coreX.stabilityIndex === 'MODERATE'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {coreX.stabilityIndex}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5">Recurrence variance</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 4-MARKET BREAKDOWN */}
          {activeTab === 'markets' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(['Deshawar', 'Faridabad', 'Gali', 'Ghaziabad'] as const).map((mkt) => {
                  const mktData = marketAssessment[mkt];
                  return (
                    <div
                      key={mkt}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                          <span className="font-bold text-slate-200">{mkt}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                            mktData.level === 'STRONG'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : mktData.level === 'MODERATE'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {mktData.level}
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Hits:</span>
                            <strong className="text-cyan-300">{mktData.hits}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">House Hit Rate:</span>
                            <strong className="text-slate-200">{mktData.hitRate}%</strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                        {mktData.insight}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SIMILARITY SEARCH */}
          {activeTab === 'similarity' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px] mb-2">
                  <Search className="w-4 h-4" />
                  <span>Historical Regime Similarity Match</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Matched Historical States</div>
                    <div className="text-xl font-black text-slate-200 mt-1">
                      {similaritySearch.matchedSituationsCount} <span className="text-xs text-slate-400">draws</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Hits Under Similar Regimes</div>
                    <div className="text-xl font-black text-emerald-300 mt-1">
                      {similaritySearch.historicalHitCount} <span className="text-xs text-slate-400">times</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Conditional Hit Rate</div>
                    <div className="text-xl font-black text-cyan-300 mt-1">
                      {similaritySearch.conditionalHitRatePct}%{' '}
                      <span className="text-xs text-emerald-400 font-normal">
                        ({similaritySearch.liftVsBaseline}&times; lift)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                  <div className="font-bold text-slate-300 uppercase text-[10px]">Matching Criteria:</div>
                  {similaritySearch.similarityCriteria.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-indigo-400">•</span>
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Zero-Lookahead Validated &bull; Discrete 00-99 Intelligence
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            {onSendToSimulator && (
              <button
                type="button"
                onClick={() => {
                  onSendToSimulator([pair]);
                  onClose();
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate #{pair} &rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
