import React, { useState, useMemo } from 'react';
import { CustomNumberAssessment } from '../utils/customNumberIntelligenceEngine';
import { Currency } from '../types';
import {
  X,
  Scale,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Layers,
  History,
  TrendingUp,
} from 'lucide-react';

interface CustomNumberComparisonModalProps {
  candidates: CustomNumberAssessment[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNumberForDetail?: (candidate: CustomNumberAssessment) => void;
  onSendToSimulator?: (pairs: string[]) => void;
  currency?: Currency;
}

type SortField =
  | 'rank'
  | 'unified'
  | 'historical'
  | 'pattern'
  | 'engines'
  | 'hitRate'
  | 'hits'
  | 'skip';

export const CustomNumberComparisonModal: React.FC<CustomNumberComparisonModalProps> = ({
  candidates,
  isOpen,
  onClose,
  onSelectNumberForDetail,
  onSendToSimulator,
  currency = 'INR',
}) => {
  const [sortField, setSortField] = useState<SortField>('unified');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'rank':
          diff = a.rank - b.rank;
          break;
        case 'unified':
          diff = b.unifiedResearchScore - a.unifiedResearchScore;
          break;
        case 'historical':
          diff = b.historicalEvidenceScore - a.historicalEvidenceScore;
          break;
        case 'pattern':
          diff = b.currentPatternMatchScore - a.currentPatternMatchScore;
          break;
        case 'engines':
          diff = b.engineSupport.agreementCount - a.engineSupport.agreementCount;
          break;
        case 'hitRate':
          diff = b.calibratedOosTop10HitRate - a.calibratedOosTop10HitRate;
          break;
        case 'hits':
          diff = b.coreX.totalHistoricalOccurrences - a.coreX.totalHistoricalOccurrences;
          break;
        case 'skip':
          diff = a.coreX.currentSkipDraws - b.coreX.currentSkipDraws;
          break;
      }
      return sortAsc ? -diff : diff;
    });
  }, [candidates, sortField, sortAsc]);

  if (!isOpen) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const copyComparisonTable = () => {
    const header = 'Number\tRank\tUnified Score\tHist Evidence\tPattern Match\tEngines\tOOS Hit Rate\tHistorical Hits\tCurrent Skip\tEvidence Tier';
    const rows = sortedCandidates.map((c) =>
      `${c.pair}\t#${c.rank}\t${c.unifiedResearchScore}/100\t${c.historicalEvidenceScore}/100\t${c.currentPatternMatchScore}/100\t${c.engineSupport.agreementCount}/6\t${c.calibratedOosTop10HitRate}%\t${c.coreX.totalHistoricalOccurrences}\t${c.coreX.currentSkipDraws}\t${c.evidenceLevel}`
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="custom-number-comparison-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="custom-number-comparison-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/20 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* HEADER */}
        <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                Multi-Number Side-by-Side Comparative Matrix
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Evaluating {candidates.length} candidate numbers across 6 analytical engines and historical parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-comparison-table-btn"
              type="button"
              onClick={copyComparisonTable}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 text-xs font-mono flex items-center gap-1.5"
              title="Copy Table as TSV"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied TSV' : 'Copy Table'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="p-4 overflow-x-auto flex-1 font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider select-none">
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Number</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('unified')}
                >
                  <div className="flex items-center gap-1">
                    <span>Unified Score</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('historical')}
                >
                  <div className="flex items-center gap-1">
                    <span>Hist. Evidence</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('pattern')}
                >
                  <div className="flex items-center gap-1">
                    <span>Pattern Match</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('engines')}
                >
                  <div className="flex items-center gap-1">
                    <span>Engines</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('hitRate')}
                >
                  <div className="flex items-center gap-1">
                    <span>OOS Hit Rate</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('hits')}
                >
                  <div className="flex items-center gap-1">
                    <span>Hist. Hits</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('skip')}
                >
                  <div className="flex items-center gap-1">
                    <span>Skip</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Evidence Tier</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedCandidates.map((c) => {
                const isStrong = c.evidenceLevel === 'STRONG';
                const isModerate = c.evidenceLevel === 'MODERATE';

                return (
                  <tr
                    key={c.pair}
                    className={`hover:bg-slate-800/40 transition ${
                      isStrong ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-400">#{c.rank}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-base font-black text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {c.pair}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{c.unifiedResearchScore}</span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-1.5 rounded-full"
                            style={{ width: `${c.unifiedResearchScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{c.historicalEvidenceScore}/100</td>
                    <td className="py-3 px-3 text-slate-300">{c.currentPatternMatchScore}/100</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-emerald-400">
                        {c.engineSupport.agreementCount} / 6
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold">
                      {c.calibratedOosTop10HitRate}%
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {c.coreX.totalHistoricalOccurrences} ({c.coreX.historicalHitFrequencyPct}%)
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {c.coreX.currentSkipDraws} draws
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isStrong
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isModerate
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {c.evidenceLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectNumberForDetail && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectNumberForDetail(c);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-bold px-2 py-1 bg-cyan-950/40 rounded border border-cyan-500/30"
                          >
                            Why?
                          </button>
                        )}
                        {onSendToSimulator && (
                          <button
                            type="button"
                            onClick={() => {
                              onSendToSimulator([c.pair]);
                              onClose();
                            }}
                            className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer font-bold px-2 py-1 bg-emerald-950/40 rounded border border-emerald-500/30"
                          >
                            Sim
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

        {/* FOOTER */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-400 text-[11px]">
            Showing {sortedCandidates.length} numbers sorted by{' '}
            <strong className="text-slate-200 uppercase">{sortField}</strong> ({sortAsc ? 'Ascending' : 'Descending'})
          </div>

          <div className="flex items-center gap-2">
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
                  onSendToSimulator(sortedCandidates.slice(0, 10).map((c) => c.pair));
                  onClose();
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Top {Math.min(10, sortedCandidates.length)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
