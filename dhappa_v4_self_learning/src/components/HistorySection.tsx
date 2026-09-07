import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DayMarketEntry, Market, MARKETS } from '../types';
import { generatePairsForDate } from '../utils/mathEngine';

interface HistorySectionProps {
  records: DayMarketEntry[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onPruneToLastThreeMonths?: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  records,
  onDeleteRecord,
  onClearAll,
  onPruneToLastThreeMonths,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<Market | 'All'>('All');
  const [matchFilter, setMatchFilter] = useState<'All' | 'MatchesOnly' | 'NonMatchesOnly'>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Flatten entries into searchable rows
  const flattenedRows = records.flatMap((rec) => {
    const dayGenerated = generatePairsForDate(rec.date).pairs;
    const markets: Array<{ market: Market; pair?: string }> = [
      { market: 'Deshawar', pair: rec.deshawar },
      { market: 'Faridabad', pair: rec.faridabad },
      { market: 'Gali', pair: rec.gali },
      { market: 'Ghaziabad', pair: rec.ghaziabad },
    ];

    return markets
      .filter((m) => !!m.pair)
      .map((m) => ({
        id: `${rec.id}-${m.market}`,
        recordId: rec.id,
        date: rec.date,
        market: m.market,
        pair: m.pair!,
        isMatch: dayGenerated.includes(m.pair!),
        notes: rec.notes || '—',
        source: rec.source || 'manual',
        createdAt: rec.createdAt,
      }));
  });

  const filtered = flattenedRows.filter((row) => {
    // Market filter
    if (selectedMarketFilter !== 'All' && row.market !== selectedMarketFilter) {
      return false;
    }

    // Match filter
    if (matchFilter === 'MatchesOnly' && !row.isMatch) return false;
    if (matchFilter === 'NonMatchesOnly' && row.isMatch) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        row.date.includes(q) ||
        row.pair.includes(q) ||
        row.market.toLowerCase().includes(q) ||
        row.notes.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div id="section-history" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <HistoryIcon className="w-4 h-4" />
          <span>Section 36 — Historical Records Archive</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Searchable Market & Pair Archive
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Filter, search, inspect individual historical pair outcomes, and analyze generated pair alignment.
        </p>
      </div>

      {/* Retention Bar */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-slate-100">Dataset Retention:</span> Only last 3 months data ({records.length} total day records) is retained.
          </div>
        </div>
        {onPruneToLastThreeMonths && (
          <button
            type="button"
            onClick={onPruneToLastThreeMonths}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Keep Last 3 Months Only</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD), pair (e.g. 23), or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Market Filter */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMarketFilter('All')}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  selectedMarketFilter === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Markets
              </button>
              {MARKETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMarketFilter(m)}
                  className={`px-2.5 py-1 rounded transition font-medium ${
                    selectedMarketFilter === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Match Filter */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMatchFilter('All')}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  matchFilter === 'All' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('MatchesOnly')}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  matchFilter === 'MatchesOnly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Matches Only
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('NonMatchesOnly')}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  matchFilter === 'NonMatchesOnly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Non-Matches
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>
            Showing <strong className="text-white">{filtered.length}</strong> of{' '}
            <strong className="text-white">{flattenedRows.length}</strong> historical pair observations
          </span>

          {records.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-sans"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Records
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clearing All Records */}
      {showClearConfirm && (
        <div className="p-4 bg-rose-950/70 border border-rose-700 rounded-xl space-y-3 text-xs text-rose-200">
          <div className="font-bold text-white flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Confirm Deletion of All Historical Records</span>
          </div>
          <p>
            Are you sure you want to delete all {records.length} historical records? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold"
            >
              Yes, Delete All
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Archive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 bg-slate-950 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4 text-center">Observed Pair</th>
                <th className="py-3 px-4">Deterministic Alignment</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filtered.length > 0 ? (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-850/50 transition font-mono">
                    <td className="py-2.5 px-4 text-white font-medium whitespace-nowrap">
                      {row.date}
                    </td>

                    <td className="py-2.5 px-4 text-slate-300 font-sans">
                      {row.market}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-white font-bold text-sm">
                        {row.pair}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 font-sans">
                      {row.isMatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                          <span>Generated Pair Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-950 text-slate-400 border border-slate-800">
                          <XCircle className="w-3 h-3 text-slate-500" />
                          <span>Not Present in Set</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400 font-sans max-w-xs truncate text-[11px]">
                      {row.notes}
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 text-[11px] uppercase">
                      {row.source}
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      {confirmDeleteId === row.recordId ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-rose-300">Delete day?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRecord(row.recordId);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(row.recordId)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title="Delete full daily record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                    No historical observations match the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
