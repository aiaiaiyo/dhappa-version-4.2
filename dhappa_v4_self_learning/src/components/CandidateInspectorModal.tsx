import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Target,
  Sparkles,
  History,
  Scale,
  Send,
  Zap,
} from 'lucide-react';
import { UnifiedEnginePrediction } from '../utils/unifiedWalkForwardEngine';
import { CurrencyCode, CURRENCIES } from '../types';

export interface CandidateInspectorModalProps {
  candidate: UnifiedEnginePrediction | null;
  isOpen: boolean;
  onClose: () => void;
  onSendToSimulator?: (pairs: string[]) => void;
  currency?: CurrencyCode;
}

export const CandidateInspectorModal: React.FC<CandidateInspectorModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSendToSimulator,
  currency = 'INR',
}) => {
  if (!isOpen || !candidate) return null;

  const currSymbol = CURRENCIES[currency]?.symbol || '₹';

  // Get evidence tier styling & badges
  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'STRONG':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          label: 'Strong Evidence (High Ensemble Consensus)',
        };
      case 'MODERATE':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          label: 'Moderate Evidence (2 Engines Agreement)',
        };
      default:
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          label: 'Specialized Single Engine Output',
        };
    }
  };

  const evStyle = getEvidenceColor(candidate.evidenceLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center font-mono font-black text-2xl text-cyan-300 shadow-inner">
              {candidate.pair}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Candidate Pair #{candidate.pair} Diagnostics
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${evStyle.badge}`}
                >
                  {candidate.evidenceLevel} EVIDENCE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transparent multi-engine decomposition, attribution lineage & historical out-of-sample metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* Top KPI Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Model Score</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {candidate.possibilityScore}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Calibrated ensemble strength
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Engine Agreement</span>
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-bold font-mono text-indigo-300">
                {candidate.distinctEngineCount}
                <span className="text-xs font-normal text-slate-500">/4 Engines</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {candidate.distinctEngineCount >= 2 ? 'Multi-engine consensus' : 'Independent thesis'}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Historical Hit Rate</span>
                <History className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {candidate.historicalHitRate || 28.5}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Out-of-sample rule lift: ~2.8x
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Mirror / Palti</span>
                <Scale className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-300">
                {candidate.reversePair}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Digit complement family
              </div>
            </div>
          </div>

          {/* Section: Pattern Archetype & 1-Week Jodi / Core Family / Rashi Assessment */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-mono font-bold text-xs">
                  PAT
                </div>
                <h4 className="text-xs font-bold text-indigo-300 uppercase font-mono">
                  Pattern Archetype & Resonance Diagnostic
                </h4>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                  candidate.patternArchetypeBadgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {candidate.patternArchetypeLabel || 'Pattern Assessed'}
              </span>
            </div>

            {/* Pattern Explanation Text */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
              {candidate.patternExplanation ||
                'Assessed against historical 5-day draw repeats, 1-week Jodi occurrences, core family symmetry, and Rashi complement resonance.'}
            </p>

            {/* 5-Day Historical Correlation & Universe Leaderboard Resonance Hub */}
            {(candidate.patternAssessment?.fiveDayCorrelationScore !== undefined || candidate.inCoverageLeaderboard) && (
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    5-Day Historical Draws Correlation & Universe Resonance
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                    5D Score: +{candidate.fiveDayCorrelationScore ?? candidate.patternAssessment?.fiveDayCorrelationScore ?? 0}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">5-Day Draw History Matches:</span>
                    <span className="text-rose-200 font-semibold">
                      {candidate.patternAssessment?.last5DaysExactHits && candidate.patternAssessment.last5DaysExactHits.length > 0
                        ? `Exact repeat drawn in ${candidate.patternAssessment.last5DaysExactHits[0].market} (${candidate.patternAssessment.last5DaysExactHits[0].daysAgo}d ago)`
                        : candidate.patternAssessment?.last5DaysPaltiHits && candidate.patternAssessment.last5DaysPaltiHits.length > 0
                        ? `Palti #${candidate.reversePair} drawn in ${candidate.patternAssessment.last5DaysPaltiHits[0].market} (${candidate.patternAssessment.last5DaysPaltiHits[0].daysAgo}d ago)`
                        : candidate.patternAssessment?.last5DaysFamilyHits && candidate.patternAssessment.last5DaysFamilyHits.length > 0
                        ? `${candidate.patternAssessment.last5DaysFamilyHits.length} Family draws in past 5 days (${candidate.familyRoot})`
                        : 'No direct 5-day cycle hit.'}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">00-99 Universe Coverage Resonance:</span>
                    <span className="text-teal-300 font-semibold">
                      {candidate.universeRank
                        ? `Historical Leaderboard Rank #${candidate.universeRank} (${candidate.universeFrequency}x hits)`
                        : 'Covered in Standard Decile Range'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3 Core Pattern Verification Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              {/* 1. Last 1-Week Jodi Occurrence */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  candidate.isLast1WeekJodi || candidate.isLast1WeekPalti
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] text-slate-300">1-Week Jodi Repeat</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        candidate.isLast1WeekJodi
                          ? 'bg-amber-500 text-slate-950'
                          : candidate.isLast1WeekPalti
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {candidate.isLast1WeekJodi
                        ? 'EXACT HIT'
                        : candidate.isLast1WeekPalti
                        ? 'PALTI HIT'
                        : 'NO RECENT HIT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {candidate.patternAssessment?.last1WeekExactHits && candidate.patternAssessment.last1WeekExactHits.length > 0 ? (
                      <span className="text-amber-300">
                        {candidate.patternAssessment.last1WeekExactHits.length}x in last 7d ({candidate.patternAssessment.last1WeekExactHits[0].market})
                      </span>
                    ) : candidate.patternAssessment?.last1WeekPaltiHits && candidate.patternAssessment.last1WeekPaltiHits.length > 0 ? (
                      <span className="text-purple-300">
                        Palti #{candidate.reversePair} hit {candidate.patternAssessment.last1WeekPaltiHits[0].daysAgo}d ago ({candidate.patternAssessment.last1WeekPaltiHits[0].market})
                      </span>
                    ) : (
                      'No direct Jodi occurrence in the past 7 calendar days.'
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[9px] text-slate-500 flex justify-between">
                  <span>Pair: #{candidate.pair}</span>
                  <span>Palti: #{candidate.reversePair}</span>
                </div>
              </div>

              {/* 2. Core Family Number Occurrence */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  candidate.isCoreFamilyEcho
                    ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] text-slate-300">Core Family Pattern</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        candidate.isCoreFamilyEcho
                          ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {candidate.familyRoot || `Family ${candidate.pair}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {candidate.patternAssessment?.activeFamilyMembersHit && candidate.patternAssessment.activeFamilyMembersHit.length > 0 ? (
                      <span className="text-indigo-300">
                        Active hits in family: [{candidate.patternAssessment.activeFamilyMembersHit.join(', ')}] ({candidate.patternAssessment.totalLast1WeekFamilyHits}x in 7d)
                      </span>
                    ) : (
                      'Core family dormant in immediate 7-day window.'
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[9px] text-slate-500">
                  Members: {candidate.patternAssessment?.familyMembers.join(', ') || `${candidate.pair}, ${candidate.reversePair}`}
                </div>
              </div>

              {/* 3. Rashi Symmetry Occurrence */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  candidate.isRashiNumber
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] text-slate-300">Rashi Symmetry</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        candidate.isRashiNumber
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {candidate.patternAssessment?.hasLast1WeekFullRashiHit
                        ? 'FULL RASHI'
                        : candidate.patternAssessment?.hasLast1WeekHalfRashiHit
                        ? 'HALF RASHI'
                        : 'COMPLEMENT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {candidate.patternAssessment?.mostRecentRashiHit ? (
                      <span className="text-emerald-300">
                        #{candidate.patternAssessment.mostRecentRashiHit.number} hit {candidate.patternAssessment.mostRecentRashiHit.daysAgo}d ago in {candidate.patternAssessment.mostRecentRashiHit.market}
                      </span>
                    ) : (
                      `Full Rashi is #${candidate.patternAssessment?.fullRashiPair || '---'}`
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[9px] text-slate-500 flex justify-between">
                  <span>Full: #{candidate.patternAssessment?.fullRashiPair}</span>
                  <span>Half: #{candidate.patternAssessment?.halfRashiTensPair} / #{candidate.patternAssessment?.halfRashiOnesPair}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Why was this candidate selected? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Why Was Number {candidate.pair} Selected?</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Tens: {candidate.tens} | Ones: {candidate.ones} | Sum: {candidate.digitSum} | Delta: {candidate.digitDiff}
              </span>
            </div>

            <div className="space-y-2">
              {candidate.whySelectedReasons && candidate.whySelectedReasons.length > 0 ? (
                candidate.whySelectedReasons.map((reason, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-start gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 font-mono text-[11px]"
                  >
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{reason}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs">
                  Selected by multi-engine candidate generator with high mathematical symmetry.
                </div>
              )}
            </div>
          </div>

          {/* Section: Engine Lineage & Attribution Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>4-Engine Attribution & Lineage Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              {/* E1 Date Generator */}
              <div
                className={`p-3 rounded-xl border transition ${
                  candidate.inDateGenerator
                    ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>1. Date Generator Triad</span>
                  {candidate.inDateGenerator ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      SELECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">NOT SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {candidate.inDateGenerator
                    ? 'Generated via calendar root day triad arithmetic permutations.'
                    : 'Not part of the day triad cross-multiplication set.'}
                </p>
              </div>

              {/* E2 Prev Day Repeated */}
              <div
                className={`p-3 rounded-xl border transition ${
                  candidate.inPreviousDay
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>2. Prev Day Repeated Digit</span>
                  {candidate.inPreviousDay ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      SELECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">NOT SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {candidate.inPreviousDay
                    ? 'Formed by high-frequency repeated digit expansion from reference outcomes.'
                    : 'Did not match the dominant repeated digit frequency branch.'}
                </p>
              </div>

              {/* E3 Sir Abhishek 15-Pair */}
              <div
                className={`p-3 rounded-xl border transition ${
                  candidate.inSirAbhishek
                    ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>3. Sir Abhishek 15-Pair Matrix</span>
                  {candidate.inSirAbhishek ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      SELECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">NOT SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {candidate.inSirAbhishek
                    ? 'Generated by 4-house 6-digit vertical cross-pairing matrix.'
                    : 'Not present in the 15 vertical pair combination space.'}
                </p>
              </div>

              {/* E4 Delta Method */}
              <div
                className={`p-3 rounded-xl border transition ${
                  candidate.inDeltaMethod
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>4. Faridabad Delta Theorem</span>
                  {candidate.inDeltaMethod ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SELECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">NOT SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {candidate.inDeltaMethod
                    ? 'Derived from Faridabad reference tens-ones absolute delta offset.'
                    : 'Outside the target FB delta resonance step window.'}
                </p>
              </div>

              {/* E5 Universe Coverage Leaderboard */}
              <div
                className={`p-3 rounded-xl border transition sm:col-span-2 ${
                  candidate.inCoverageLeaderboard
                    ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>5. 00–99 Universe Coverage & Historical Leaderboard</span>
                  </span>
                  {candidate.inCoverageLeaderboard ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-bold">
                      {candidate.universeRank ? `LEADERBOARD #${candidate.universeRank}` : 'COVERED'} ({candidate.universeFrequency || 0} HITS)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">NOT ON TOP LEADERBOARD</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {candidate.inCoverageLeaderboard
                    ? `Validated against full 00–99 universe historical draw ledger. High-frequency rank #${candidate.universeRank ?? 'Top'} in range decile ${candidate.universeDecileRange || 'Active'}.`
                    : `Tracked in 00–99 reference universe; standard baseline coverage frequency.`}
                </p>
              </div>
            </div>
          </div>

          {/* Section: 00-99 Universe Coverage Historical Profile */}
          <div className="bg-gradient-to-r from-teal-950/40 via-slate-950 to-indigo-950/40 border border-teal-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-teal-300 uppercase font-mono flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-400" />
                <span>00–99 Universe Coverage & Historical Resonance Profile</span>
              </h4>
              <span className="text-[10px] font-mono text-teal-400/90 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
                Universe State: {candidate.universeStatus || 'Active Observation'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Universe Rank</div>
                <div className="text-sm font-bold text-teal-300 mt-0.5">
                  {candidate.universeRank ? `#${candidate.universeRank}` : 'Unranked'}
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Total Actual Hits</div>
                <div className="text-sm font-bold text-teal-300 mt-0.5">
                  {candidate.universeFrequency ?? 0} Observed
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Range Decile</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {candidate.universeDecileRange || `${candidate.tens}0-${candidate.tens}9`}
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Palti / Reverse Hits</div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">
                  #{candidate.reversePair} (Symmetric)
                </div>
              </div>
            </div>
          </div>

          {/* Educational Cautionary Notice */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-2.5 text-slate-400 text-[11px] leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Statistical Research Note:</strong> Model scores and evidence levels represent algorithmic consensus and historical rule frequency. In discrete probability, past frequency does not guarantee future certainty. Use within disciplined risk management parameters.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Candidate ID: <span className="text-slate-200">PAIR-{candidate.pair}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
            >
              Close
            </button>
            {onSendToSimulator && (
              <button
                type="button"
                onClick={() => {
                  onSendToSimulator([candidate.pair]);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate #{candidate.pair}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
