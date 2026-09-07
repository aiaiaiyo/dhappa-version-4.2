import React from 'react';
import { DayMarketEntry } from '../types';

interface WalkForwardCoverageTableProps {
  records: DayMarketEntry[];
  onSendPairToSimulator?: (pair: string) => void;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const WalkForwardCoverageTable: React.FC<WalkForwardCoverageTableProps> = ({
  records,
  onSendPairsToSimulator,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest">
            Walk-Forward Empirical Backtest
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-0.5">
            Sequential Historical Model Performance & Accuracy Audit
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total Historical Records: {records.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Market</th>
              <th className="py-2 px-3">FR Result</th>
              <th className="py-2 px-3">SR Result</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No historical records available for walk-forward testing.
                </td>
              </tr>
            ) : (
              records.slice(0, 15).map((r, idx) => (
                <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-200">{r.date}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{r.market}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.fr || '—'}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.sr || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    {onSendPairsToSimulator && (r.fr || r.sr) && (
                      <button
                        onClick={() => onSendPairsToSimulator([r.fr, r.sr].filter(Boolean))}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                      >
                        Send to Sim
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
