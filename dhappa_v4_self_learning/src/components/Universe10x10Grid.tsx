import React, { useState, useMemo } from 'react';
import { Target, Sparkles, Filter, Crown, Check, Layers, Zap } from 'lucide-react';
import { UnifiedEnginePrediction } from '../utils/unifiedWalkForwardEngine';

interface Universe10x10GridProps {
  candidates: UnifiedEnginePrediction[];
  onInspectCandidate: (candidate: UnifiedEnginePrediction) => void;
  onSendPairsToSimulator?: (pairs: string[]) => void;
  actualRecordedDraws?: Array<{ market: string; number: string; marketKey: string }>;
}

export const Universe10x10Grid: React.FC<Universe10x10GridProps> = ({
  candidates,
  onInspectCandidate,
  onSendPairsToSimulator,
  actualRecordedDraws = [],
}) => {
  const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all_100' | 'top36_only' | 'tier1_only' | 'correlated_only'>('all_100');
  const [selectedDigitFilter, setSelectedDigitFilter] = useState<string>('all'); // 'all', '0'..'9' tens

  // Fast map of pair -> candidate item
  const candidateMap = useMemo(() => {
    const map = new Map<string, { candidate: UnifiedEnginePrediction; rank: number }>();
    candidates.forEach((c, idx) => {
      map.set(c.pair, { candidate: c, rank: idx + 1 });
    });
    return map;
  }, [candidates]);

  // Actual draws set
  const actualDrawsSet = useMemo(() => {
    const map = new Map<string, string>();
    actualRecordedDraws.forEach((d) => map.set(d.number, d.marketKey));
    return map;
  }, [actualRecordedDraws]);

  // Calculate hovered palti/mirror number
  const hoveredMirror = useMemo(() => {
    if (!hoveredNumber || hoveredNumber.length !== 2) return null;
    return `${hoveredNumber[1]}${hoveredNumber[0]}`;
  }, [hoveredNumber]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono space-y-4 shadow-xl">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Layers className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">00–99 Universe Matrix Heatmap</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                100 Cell Map
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Visual overview of all 100 possible pairs colored by Consensus Ranks, 5-Day Correlation & Actual Market Draws.
            </p>
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all_100')}
            className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
              filterMode === 'all_100'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All 100 Universe
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('top36_only')}
            className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
              filterMode === 'top36_only'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Top 36 Pool ({candidates.slice(0, 36).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('tier1_only')}
            className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
              filterMode === 'tier1_only'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Tier 1 Prime (5)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('correlated_only')}
            className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
              filterMode === 'correlated_only'
                ? 'bg-rose-600 text-white border-rose-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            5D Correlated
          </button>
        </div>
      </div>

      {/* Row tens quick selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Row Tens:</span>
        <button
          type="button"
          onClick={() => setSelectedDigitFilter('all')}
          className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
            selectedDigitFilter === 'all'
              ? 'bg-slate-700 text-white border-slate-500'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          All Rows (0-9)
        </button>
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((tensDigit) => (
          <button
            key={tensDigit}
            type="button"
            onClick={() => setSelectedDigitFilter(selectedDigitFilter === tensDigit ? 'all' : tensDigit)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
              selectedDigitFilter === tensDigit
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tensDigit}X Row
          </button>
        ))}
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-amber-400 ring-1 ring-amber-300" />
          <span className="font-bold text-amber-300">Tier 1 Prime (#1-5)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-400" />
          <span className="font-bold text-emerald-300">Tier 2 High Hit (#6-10)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-purple-900/80 border border-purple-400" />
          <span className="font-bold text-purple-300">Tier 3 Calibrated (#11-21)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-indigo-900/80 border border-indigo-500" />
          <span className="font-bold text-indigo-300">Tier 4 Defense (#22-36)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300" />
          <span className="font-bold text-rose-300">5D Correlated Hit</span>
        </div>
        {actualRecordedDraws.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 animate-pulse" />
            <span className="font-bold text-emerald-400">Actual Market Draw</span>
          </div>
        )}
      </div>

      {/* 10x10 Grid Body */}
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {Array.from({ length: 100 }, (_, num) => {
          const pairStr = num.toString().padStart(2, '0');
          const tens = pairStr[0];

          if (selectedDigitFilter !== 'all' && tens !== selectedDigitFilter) {
            return null;
          }

          const candidateInfo = candidateMap.get(pairStr);
          const candidate = candidateInfo?.candidate;
          const rank = candidateInfo?.rank;

          const isActualDraw = actualDrawsSet.has(pairStr);
          const actualMarketKey = actualDrawsSet.get(pairStr);

          const isHovered = hoveredNumber === pairStr;
          const isMirrorHovered = hoveredMirror === pairStr;

          const has5dHit = candidate && (candidate.hasLast5DaysExactHit || candidate.hasLast5DaysPaltiHit || candidate.hasLast5DaysFamilyHit);
          const isPrimaryFam = candidate?.isPrimaryFamilyMember;
          const isRoot = candidate?.familyRole === 'PRIMARY_ROOT';

          // Determine filtering visibility
          let passesFilter = true;
          if (filterMode === 'top36_only') passesFilter = Boolean(rank && rank <= 36);
          else if (filterMode === 'tier1_only') passesFilter = Boolean(rank && rank <= 5);
          else if (filterMode === 'correlated_only') passesFilter = Boolean(has5dHit);

          // Card Background & Styling based on Rank
          let bgClasses = 'bg-slate-900/60 border-slate-800 text-slate-400';

          if (isActualDraw) {
            bgClasses = 'bg-emerald-950 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20';
          } else if (rank) {
            if (rank <= 5) {
              bgClasses = 'bg-gradient-to-br from-amber-500/30 to-amber-950/80 border-amber-400 text-amber-200 ring-1 ring-amber-400/60 shadow-md shadow-amber-500/10';
            } else if (rank <= 10) {
              bgClasses = 'bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/30';
            } else if (rank <= 21) {
              bgClasses = 'bg-gradient-to-br from-purple-950/80 to-slate-900 border-purple-400/60 text-purple-300';
            } else if (rank <= 36) {
              bgClasses = 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500/40 text-indigo-300';
            } else {
              bgClasses = 'bg-slate-900/80 border-slate-800 text-slate-400';
            }
          }

          if (isHovered) {
            bgClasses += ' ring-2 ring-cyan-400 scale-105 z-10 shadow-xl shadow-cyan-500/20';
          } else if (isMirrorHovered) {
            bgClasses += ' ring-2 ring-purple-400 bg-purple-950/80 text-purple-200';
          }

          if (!passesFilter) {
            bgClasses += ' opacity-25 grayscale';
          }

          return (
            <div
              key={pairStr}
              onMouseEnter={() => setHoveredNumber(pairStr)}
              onMouseLeave={() => setHoveredNumber(null)}
              onClick={() => {
                if (candidate) {
                  onInspectCandidate(candidate);
                }
              }}
              className={`relative p-2 rounded-xl border transition-all duration-150 flex flex-col items-center justify-between cursor-pointer min-h-[64px] ${bgClasses}`}
            >
              {/* Top Row: Rank or Draw Tag */}
              <div className="w-full flex items-center justify-between text-[8px] font-bold">
                {rank ? (
                  <span
                    className={`px-1 rounded ${
                      rank <= 5
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : rank <= 10
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{rank}
                  </span>
                ) : (
                  <span className="text-slate-600">--</span>
                )}

                {isActualDraw && (
                  <span className="px-1 rounded bg-emerald-400 text-slate-950 font-black">
                    {actualMarketKey}
                  </span>
                )}

                {!isActualDraw && has5dHit && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 border border-rose-300 animate-pulse" title="5-Day Historical Correlation Hit" />
                )}
              </div>

              {/* Main Number Display */}
              <div className="flex items-center gap-0.5 my-0.5">
                {isRoot && <Crown className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                <span className="text-base sm:text-lg font-black tracking-wider">
                  {pairStr}
                </span>
              </div>

              {/* Bottom Tag */}
              <div className="w-full text-center text-[8px]">
                {candidate ? (
                  <span className="text-slate-400 font-semibold truncate block">
                    {(candidate.compositeConfidenceScore ?? candidate.possibilityScore).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-slate-600 block text-[7px]">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Information Banner */}
      {hoveredNumber && (
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              {hoveredNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Pair #{hoveredNumber}</span>
                {candidateMap.has(hoveredNumber) ? (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    In Consensus (Rank #{candidateMap.get(hoveredNumber)?.rank})
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
                    Standard Universe Pair
                  </span>
                )}
                {hoveredMirror && (
                  <span className="text-[10px] text-purple-300">
                    Palti Mirror: <strong>{hoveredMirror}</strong>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {candidateMap.has(hoveredNumber)
                  ? `Composite Confidence: ${candidateMap.get(hoveredNumber)?.candidate.compositeConfidenceScore?.toFixed(1)}% | Generated by ${candidateMap.get(hoveredNumber)?.candidate.distinctEngineCount} reasoning engines.`
                  : `Pair ${hoveredNumber} is available in the 100-number universe.`}
              </p>
            </div>
          </div>

          {candidateMap.has(hoveredNumber) && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const item = candidateMap.get(hoveredNumber)?.candidate;
                  if (item) onInspectCandidate(item);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Inspect Rationale</span>
              </button>
              {onSendPairsToSimulator && (
                <button
                  type="button"
                  onClick={() => onSendPairsToSimulator([hoveredNumber])}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition text-xs cursor-pointer"
                >
                  Simulate &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
