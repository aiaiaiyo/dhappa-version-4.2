import React, { useState, useMemo } from 'react';
import { DayMarketEntry } from '../types';
import { analyzeContextualFamilyMembers, ContextualFamilyGroup, MemberStatus } from '../utils/contextualFamilyIntelligence';
import { analyzePreviousDrawTransitions } from '../utils/previousDrawTransitionIntelligence';
import {
  GitBranch,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Cpu,
  Search,
  CheckCircle2,
  HelpCircle,
  SlidersHorizontal,
  Workflow
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface ContextualFamilyMatrixSectionProps {
  history: DayMarketEntry[];
  currentPreviousPair?: string;
}

export const ContextualFamilyMatrixSection: React.FC<ContextualFamilyMatrixSectionProps> = ({
  history,
  currentPreviousPair = '23'
}) => {
  const [testPrevPair, setTestPrevPair] = useState<string>(currentPreviousPair);
  const [testActualPair, setTestActualPair] = useState<string>('62');
  const [activeViewTab, setActiveViewTab] = useState<'matrix' | 'waterfall' | 'engines' | 'audit'>('matrix');

  const transitionData = useMemo(() => {
    return analyzePreviousDrawTransitions(history, testPrevPair);
  }, [history, testPrevPair]);

  const topCore = transitionData.topCoreCandidates[0]?.coreCandidate || '21';

  const contextualGroup: ContextualFamilyGroup = useMemo(() => {
    return analyzeContextualFamilyMembers(history, testPrevPair, topCore, testActualPair);
  }, [history, testPrevPair, topCore, testActualPair]);

  // Standardized Engine Result for Consensus Layer
  const standardizedContextualFamilyResult = useMemo(() => {
    const candidates = contextualGroup.members.map((m) => m.pair);
    const topScore = contextualGroup.members[0]?.mlScore ?? 0;
    const evidence = contextualGroup.members.slice(0, 5).map((m) => `status:${m.status}`);

    return buildStandardizedEngineResult({
      engineId: 'CONTEXTUAL_FAMILY',
      methodName: 'Contextual Family Intelligence',
      date: history[history.length - 1]?.date,
      channel: 'live-engine-output',
      sourceValues: { prevPair: testPrevPair, coreCandidate: topCore },
      normalizedValues: { membersCount: candidates.length },
      rawResult: contextualGroup as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: history.length,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractFamily()', 'analyzeTransitions()', 'rankMembers()', 'score()'],
    });
  }, [contextualGroup, history, testPrevPair, topCore]);

  const statusColors: Record<MemberStatus, string> = {
    'CORE': 'bg-amber-500 text-slate-950 font-black border border-amber-400',
    'PRIMARY': 'bg-purple-600 text-white font-bold',
    'ACTIVE': 'bg-emerald-600 text-white font-semibold',
    'SECONDARY': 'bg-cyan-600 text-white font-semibold',
    'FALLBACK': 'bg-slate-700 text-slate-200',
    'SHIELD': 'bg-indigo-900 text-indigo-200',
    'LOW CONFIDENCE': 'bg-slate-900 text-slate-400 border border-slate-800',
    'EXCLUDED': 'bg-rose-950 text-rose-300 border border-rose-900'
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-xl font-mono space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <GitBranch className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
              <span>Dynamic Core/Family Discovery & Individual Member Ranking</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                Zero-Bias ML Pipeline
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Task A (Family Discovery) separated from Task B (Independent Member Scoring). Zero structural distance bias.
            </p>
          </div>
        </div>

        {/* INPUT CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-bold">Prev Draw:</span>
            <input
              type="text"
              maxLength={2}
              value={testPrevPair}
              onChange={(e) => setTestPrevPair(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-14 bg-slate-950 border border-indigo-500/50 rounded-lg text-center py-1 text-xs font-black text-indigo-300 focus:outline-none"
              placeholder="23"
            />
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-amber-400 font-bold">Actual Outcome:</span>
            <input
              type="text"
              maxLength={2}
              value={testActualPair}
              onChange={(e) => setTestActualPair(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-14 bg-slate-950 border border-amber-500/50 rounded-lg text-center py-1 text-xs font-black text-amber-300 focus:outline-none"
              placeholder="62"
            />
          </div>
        </div>
      </div>

      {/* THREE SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Contextual Previous State</span>
            <span className="text-3xl font-black text-slate-100 mt-1 block">{testPrevPair}</span>
          </div>
          <span className="text-[11px] text-indigo-400 mt-3 block">
            Transition Regime: {transitionData.regimeState}
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Discovered Core & Family Root</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-300">{topCore}</span>
              <span className="text-xs text-slate-400 font-bold">({contextualGroup.familyRoot})</span>
            </div>
          </div>
          <span className="text-[11px] text-amber-400/80 mt-3 block">
            Cluster Score: {contextualGroup.groupScore} pts ({contextualGroup.members.length} members)
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Ranked Member</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-400">{contextualGroup.topRankedMember.pair}</span>
              <span className="text-xs text-indigo-300">({contextualGroup.topRankedMember.relationType})</span>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-3 block">
            Score: {contextualGroup.topRankedMember.finalMemberScore} pts • Lift: {contextualGroup.topRankedMember.conditionalLift}×
          </span>
        </div>
      </div>

      {/* STRUCTURAL DEFINITION & RULE BANNER */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-200 flex items-start gap-3">
        <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200 block mb-0.5">Structural Relationship Layer (Task A vs Task B):</span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {contextualGroup.structuralDefinition} The Core Number ({topCore}) does not automatically outrank its cluster. Each member is evaluated independently using its specific historical conditional transition lift, 6 distinct reasoning engine votes, member-specific regime alignment, ML score, and uncertainty penalty.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveViewTab('matrix')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeViewTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Independent Member Matrix</span>
        </button>

        <button
          onClick={() => setActiveViewTab('waterfall')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeViewTab === 'waterfall'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Rank-Change Waterfall Progression</span>
        </button>

        <button
          onClick={() => setActiveViewTab('engines')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeViewTab === 'engines'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>6-Engine Votes & Promotion Score</span>
        </button>

        <button
          onClick={() => setActiveViewTab('audit')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeViewTab === 'audit'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Post-Draw Forensic Audit ({testActualPair || 'N/A'})</span>
        </button>
      </div>

      {/* VIEW 1: INDEPENDENT MEMBER MATRIX */}
      {activeViewTab === 'matrix' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Independent Family-Member Ranking & Evidence (Root: {contextualGroup.familyRoot})
            </span>
            <span className="text-[11px] text-indigo-400 font-semibold">
              Zero-Bias Architecture
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Member Jodi</th>
                  <th className="p-3">Relation</th>
                  <th className="p-3">Generation Rule</th>
                  <th className="p-3">Cond. Lift</th>
                  <th className="p-3">Sample Count</th>
                  <th className="p-3">6-Engine Vote</th>
                  <th className="p-3">ML Score</th>
                  <th className="p-3">Regime</th>
                  <th className="p-3">Uncertainty</th>
                  <th className="p-3">Final Score</th>
                  <th className="p-3">Dynamic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contextualGroup.members.map((member, idx) => (
                  <tr key={member.pair} className="hover:bg-slate-900/60 transition">
                    <td className="p-3 font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-3 text-base font-black text-slate-100 flex items-center gap-1.5">
                      <span>{member.pair}</span>
                      {member.pair === topCore && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Core Anchor
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-indigo-300">{member.relationType}</td>
                    <td className="p-3 text-[10px] text-slate-400 font-mono">{member.generationRule}</td>
                    <td className="p-3 font-bold text-cyan-300">{member.conditionalLift}×</td>
                    <td className="p-3 text-slate-300 font-semibold">{member.sampleCount} hits</td>
                    <td className="p-3 text-emerald-400 font-semibold">{member.engineAgreementCount} / 6 Engines</td>
                    <td className="p-3 text-purple-300 font-semibold">{member.mlScore}%</td>
                    <td className="p-3 text-cyan-300 font-semibold">{member.regimeScore} pts</td>
                    <td className="p-3 text-rose-400 font-semibold">{member.uncertainty}%</td>
                    <td className="p-3 text-amber-300 font-black text-sm">{member.finalMemberScore} pts</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[member.status]}`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: RANK WATERFALL PROGRESSION */}
      {activeViewTab === 'waterfall' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Step-by-Step Rank Progression (No Hidden Overrides)
            </span>
            <span className="text-[11px] text-slate-400">
              Shows how evidence dynamically lifts or repositions each candidate
            </span>
          </div>

          <div className="space-y-3">
            {contextualGroup.members.map((member) => (
              <div key={member.pair} className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 w-44 shrink-0">
                  <span className="text-base font-black text-slate-100">{member.pair}</span>
                  <span className="text-[10px] text-indigo-300">({member.relationType})</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[member.status]}`}>
                    {member.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
                  <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 block">Initial</span>
                    <span className="font-bold text-slate-400">#{member.rankWaterfall.initialRank}</span>
                  </div>
                  <span className="text-slate-600">→</span>
                  <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 block">+ Historical</span>
                    <span className="font-bold text-slate-300">#{member.rankWaterfall.afterHistorical}</span>
                  </div>
                  <span className="text-slate-600">→</span>
                  <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 block">+ Prev Draw</span>
                    <span className="font-bold text-cyan-300">#{member.rankWaterfall.afterPrevDraw}</span>
                  </div>
                  <span className="text-slate-600">→</span>
                  <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 block">+ 6 Engines</span>
                    <span className="font-bold text-emerald-300">#{member.rankWaterfall.afterEngines}</span>
                  </div>
                  <span className="text-slate-600">→</span>
                  <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 block">+ ML Score</span>
                    <span className="font-bold text-purple-300">#{member.rankWaterfall.afterML}</span>
                  </div>
                  <span className="text-slate-600">→</span>
                  <div className="bg-slate-950 px-2.5 py-1 rounded border border-indigo-500/40 text-center bg-indigo-950/40">
                    <span className="text-[9px] text-indigo-300 block">Final Rank</span>
                    <span className="font-black text-amber-300">#{member.rankWaterfall.finalRank}</span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 w-32 shrink-0">
                  <span>Score: <strong className="text-slate-200">{member.finalMemberScore} pts</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: 6-ENGINE SIGNALS & FALLBACK PROMOTION SCORE */}
      {activeViewTab === 'engines' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Six-Engine Agreement Matrix & Dynamic Fallback Promotion
            </span>
            <span className="text-[11px] text-slate-400">
              Evaluated across Date Gen, Prev Day, Sir Abhishek, Delta, G-Square, Belgium Sq
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {contextualGroup.members.map((member) => (
              <div key={member.pair} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-100">{member.pair}</span>
                    <span className="text-[10px] text-indigo-300">({member.relationType})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[member.status]}`}>
                    {member.status}
                  </span>
                </div>

                {/* Fallback Promotion Meter */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Promotion Opp. Score:</span>
                    <strong className="text-amber-300">{member.fallbackPromotionScore} / 100</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        member.fallbackPromotionScore >= 75
                          ? 'bg-purple-500'
                          : member.fallbackPromotionScore >= 60
                          ? 'bg-emerald-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${member.fallbackPromotionScore}%` }}
                    />
                  </div>
                </div>

                {/* Engine Flags */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className={`p-1 rounded border text-center ${member.engineDetails.dateGen ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                    Date Gen
                  </div>
                  <div className={`p-1 rounded border text-center ${member.engineDetails.prevDay ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                    Prev Day
                  </div>
                  <div className={`p-1 rounded border text-center ${member.engineDetails.sirAbhishek ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                    Abhishek
                  </div>
                  <div className={`p-1 rounded border text-center ${member.engineDetails.delta ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                    Delta
                  </div>
                  <div className={`p-1 rounded border text-center ${member.engineDetails.gSquare ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                    G-Square
                  </div>
                  <div className={`p-1 rounded border text-center ${member.engineDetails.belgiumSquare ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                    Belgium Sq
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: POST-DRAW FORENSIC AUDIT */}
      {activeViewTab === 'audit' && (
        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Post-Draw State Reconstruction & Diagnostic Auditor</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Evaluates Pre-Draw State ({testPrevPair}) vs Result ({testActualPair})
            </span>
          </div>

          {contextualGroup.auditDiagnostic && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Family Cluster Capture</span>
                  <span className={`text-base font-black mt-1 block ${contextualGroup.auditDiagnostic.wasFamilyCaptured ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {contextualGroup.auditDiagnostic.wasFamilyCaptured ? '✓ Family Successfully Captured' : '✗ Family Missed'}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Pre-Draw Rank of Winner</span>
                  <span className="text-base font-black text-amber-300 mt-1 block">
                    {contextualGroup.auditDiagnostic.winningMemberRank ? `#${contextualGroup.auditDiagnostic.winningMemberRank} (${contextualGroup.auditDiagnostic.winningMemberStatus})` : 'Unranked'}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Pre-Draw Signal Sufficiency</span>
                  <span className="text-base font-black text-cyan-300 mt-1 block">
                    {contextualGroup.auditDiagnostic.preDrawEvidenceSufficiency} SIGNAL
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Formal Forensic Classification:</span>
                <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 font-bold text-sm">
                  {contextualGroup.auditDiagnostic.classification}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  {contextualGroup.auditDiagnostic.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
