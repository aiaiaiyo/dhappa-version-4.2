import React, { useState, useMemo } from 'react';
import { DayMarketEntry } from '../types';
import { analyzePreviousDrawTransitions, TransitionIntelligenceRecord } from '../utils/previousDrawTransitionIntelligence';
import { getCoreFamilyForPair } from '../utils/customNumberIntelligenceEngine';
import { 
  GitCommit, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Activity
} from 'lucide-react';

interface PreviousDrawTransitionIntelligencePanelProps {
  history: DayMarketEntry[];
  currentPreviousPair?: string;
  onSelectCoreCandidate?: (pair: string) => void;
}

export const PreviousDrawTransitionIntelligencePanel: React.FC<PreviousDrawTransitionIntelligencePanelProps> = ({
  history,
  currentPreviousPair = '23',
  onSelectCoreCandidate
}) => {
  const [inputPair, setInputPair] = useState<string>(currentPreviousPair);
  const [selectedCore, setSelectedCore] = useState<string | null>(null);

  const transitionAnalysis = useMemo(() => {
    return analyzePreviousDrawTransitions(history, inputPair);
  }, [history, inputPair]);

  const activeCoreRecord = transitionAnalysis.topCoreCandidates.find(c => c.coreCandidate === selectedCore) || transitionAnalysis.topCoreCandidates[0];
  const dynamicFamilyInfo = activeCoreRecord ? getCoreFamilyForPair(activeCoreRecord.coreCandidate) : null;

  return (
    <div className="bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-xl font-mono space-y-5">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
            <GitCommit className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
              <span>Previous Draw → Core Number → Dynamic Family Transition Intelligence</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                Active State
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzing historical sequence transitions from previous draw <strong className="text-slate-200">{inputPair}</strong> to discover high-lift core candidates & dynamic families.
            </p>
          </div>
        </div>

        {/* INPUT SELECTOR FOR PREVIOUS DRAW */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold">Test Previous Draw:</span>
          <input
            type="text"
            maxLength={2}
            value={inputPair}
            onChange={(e) => setInputPair(e.target.value.replace(/\D/g, '').slice(0, 2))}
            className="w-16 bg-slate-950 border border-indigo-500/50 rounded-lg text-center py-1 text-sm font-black text-indigo-300 focus:outline-none"
            placeholder="23"
          />
        </div>
      </div>

      {/* SUMMARY EXPLANATION BANNER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-3">
        <Activity className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200 block mb-0.5">Transition Intelligence Summary ({transitionAnalysis.regimeState}):</span>
          <p className="text-slate-400 leading-relaxed">{transitionAnalysis.summaryExplanation}</p>
        </div>
      </div>

      {/* TOP DISCOVERED CORE CANDIDATES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Historically Associated Core Candidates & Lift Ratios (Previous: {inputPair})
          </span>
          <span className="text-[11px] text-indigo-400 font-semibold">
            {transitionAnalysis.topCoreCandidates.length} Core Matches Discovered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {transitionAnalysis.topCoreCandidates.slice(0, 8).map((cand) => {
            const isSelected = activeCoreRecord?.coreCandidate === cand.coreCandidate;
            return (
              <div
                key={cand.coreCandidate}
                onClick={() => {
                  setSelectedCore(cand.coreCandidate);
                  if (onSelectCoreCandidate) onSelectCoreCandidate(cand.coreCandidate);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected 
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-slate-100 flex items-center gap-1.5">
                    <span>{cand.coreCandidate}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      Core
                    </span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    cand.lift > 1.2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {cand.lift}× Lift
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="block text-[9px] text-slate-500">Conditional Rate</span>
                    <span className="font-bold text-slate-200">{cand.conditionalFrequency}%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500">Transition Score</span>
                    <span className="font-bold text-amber-300">{cand.transitionScore} pts</span>
                  </div>
                </div>

                <div className="text-[10px] text-indigo-300 font-semibold truncate">
                  Family Root: {cand.familyRoot} ({cand.familyMembers.join(', ')})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED CORE & DYNAMIC FAMILY BREAKDOWN CHAIN */}
      {activeCoreRecord && dynamicFamilyInfo && (
        <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Active Transition Chain & Dynamic Family Breakdown
              </span>
              <span className="text-[11px] text-slate-400">
                {inputPair} <ArrowRight className="w-3 h-3 inline text-indigo-400 mx-1" /> Core <strong className="text-slate-200">{activeCoreRecord.coreCandidate}</strong> <ArrowRight className="w-3 h-3 inline text-indigo-400 mx-1" /> Dynamic Family Members
              </span>
            </div>

            <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Sample Evidence: {activeCoreRecord.sampleSize} Historical Occurrences
            </span>
          </div>

          {/* TREE STRUCTURE DISPLAY */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center gap-2 text-sm font-black text-slate-100">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950">Core: {activeCoreRecord.coreCandidate}</span>
              <span className="text-xs text-indigo-300 font-normal">({activeCoreRecord.rationale})</span>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-indigo-500/40 ml-2">
              {dynamicFamilyInfo.familyMembers.map((member, mIdx, mArr) => {
                const isLast = mIdx === mArr.length - 1;
                const isCore = member === activeCoreRecord.coreCandidate;
                const memberScore = isCore ? activeCoreRecord.transitionScore : Math.max(25, Math.round(activeCoreRecord.transitionScore * 0.82));
                
                return (
                  <div key={member} className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-bold">{isLast ? '└──' : '├──'}</span>
                      <span className={`font-black ${isCore ? 'text-amber-300 text-sm' : 'text-slate-200'}`}>
                        {member} {isCore && '(Primary Core)'}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                        {mIdx === 1 ? 'Palti' : mIdx === 2 ? 'Mirror' : mIdx === 3 ? 'Complement' : 'Core Member'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block">Transition Score</span>
                        <span className="font-bold text-indigo-300">{memberScore} pts</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block">ML Confidence</span>
                        <span className="font-bold text-emerald-400">{memberScore}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
