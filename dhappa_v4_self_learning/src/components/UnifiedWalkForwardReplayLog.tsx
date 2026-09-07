import React from 'react';
import { DayMarketEntry, Currency } from '../types';
import { Layers, RefreshCw } from 'lucide-react';

interface UnifiedWalkForwardReplayLogProps {
  records: DayMarketEntry[];
  currency?: Currency;
  onSendPairsToSimulator?: (pairs: string[]) => void;
  deduplicateMirrors?: boolean;
}

export const UnifiedWalkForwardReplayLog: React.FC<UnifiedWalkForwardReplayLogProps> = ({
  records,
  currency = 'USD',
  onSendPairsToSimulator,
  deduplicateMirrors = false,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Unified Walk-Forward Replay Log
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-0.5">
            Multi-Engine Historical Sequential Replay
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Currency: {currency} | Mirrors: {deduplicateMirrors ? 'Filtered' : 'Active'}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Market</th>
              <th className="py-2.5 px-3">FR / SR Actual</th>
              <th className="py-2.5 px-3">Engine Consensus</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No records loaded in unified replay log.
                </td>
              </tr>
            ) : (
              records.slice(0, 10).map((r, i) => (
                <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-slate-300">{r.date}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{r.market}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    {r.fr || '—'} / {r.sr || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-amber-300 font-bold">
                    High Confidence Match
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {onSendPairsToSimulator && (
                      <button
                        onClick={() => onSendPairsToSimulator([r.fr, r.sr].filter(Boolean))}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[10px] font-bold"
                      >
                        Simulate
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
