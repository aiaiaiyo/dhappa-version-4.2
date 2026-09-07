import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Repeat,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Check,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { analyzeRepeatedX, formatDateISO, getTodayDateISO, getPreviousDateISO } from '../utils/mathEngine';

interface PreviousDateAnalyzerProps {
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const PreviousDateAnalyzer: React.FC<PreviousDateAnalyzerProps> = ({
  onSendPairsToSimulator,
}) => {
  // Preset dates calculation relative to current date
  const [startDateStr, setStartDateStr] = useState<string>(() => getPreviousDateISO(new Date(), 14));
  const [endDateStr, setEndDateStr] = useState<string>(() => getTodayDateISO());

  // Quick Presets
  const applyPreset = (preset: 'last7' | 'last14' | 'last30' | 'thisMonth') => {
    const end = new Date();
    const start = new Date(end);

    if (preset === 'last7') {
      start.setDate(end.getDate() - 6);
    } else if (preset === 'last14') {
      start.setDate(end.getDate() - 13);
    } else if (preset === 'last30') {
      start.setDate(end.getDate() - 29);
    } else if (preset === 'thisMonth') {
      start.setDate(1);
    }

    setStartDateStr(formatDateISO(start));
    setEndDateStr(formatDateISO(end));
  };

  // Generate array of Dates between startDate and endDate
  const dateRangeList = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return dates;
    }

    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [startDateStr, endDateStr]);

  const analysis = useMemo(() => {
    return analyzeRepeatedX(dateRangeList);
  }, [dateRangeList]);

  return (
    <div id="section-previous-date-analyzer" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <CalendarDays className="w-4 h-4" />
              <span>Sections 26 & 27 — Previous-Date Repeat Analyzer</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Calendar Ones-Digit Frequency & Repeated-X Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Evaluates date intervals, counts ones-place frequencies, and generates deterministic pairs for repeated values (frequency &ge; 2).
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] px-1">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('last7')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last14')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            >
              Last 14 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last30')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition"
            >
              This Month
            </button>
          </div>
        </div>

        {/* Date Inputs Form */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <label htmlFor="repeat-start-date" className="text-slate-300 font-medium">
              Start Date:
            </label>
            <input
              id="repeat-start-date"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="bg-slate-950 text-white font-mono text-xs px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="repeat-end-date" className="text-slate-300 font-medium">
              End Date:
            </label>
            <input
              id="repeat-end-date"
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="bg-slate-950 text-white font-mono text-xs px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-slate-400 font-mono ml-auto">
            Analyzed: <strong className="text-white">{analysis.totalAnalyzed}</strong> Calendar Days
          </div>
        </div>
      </div>

      {/* 0-9 Ones-Digit Histogram Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Section 26 — 0–9 Digit Histogram
              </span>
              <span className="text-[10px] text-slate-400 font-mono">dayOfMonth % 10</span>
            </div>
            <p className="text-xs text-slate-400">
              Distribution of calendar date ones-digits in selected interval. Digits with count &ge; 2 trigger Repeated-X logic.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="digit" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} date(s)`, 'Frequency']}
                  labelFormatter={(lbl) => `Ones-Digit: ${lbl}`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analysis.histogram.map((entry) => (
                    <Cell
                      key={`cell-${entry.digit}`}
                      fill={entry.count >= 2 ? '#a855f7' : '#475569'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Repeated (Freq &ge; 2)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span>Single (Freq &lt; 2)</span>
            </span>
          </div>
        </div>

        {/* Section 27: Unique Repeated X Pipelines */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Repeat className="w-4 h-4 text-purple-400" />
              <span>Section 27 — Unique Repeated-X Pipelines ({analysis.repeatedResults.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              frequency &ge; 2
            </span>
          </div>

          {analysis.repeatedResults.length > 0 ? (
            <div className="space-y-4">
              {analysis.repeatedResults.map((item) => (
                <div
                  key={item.digit}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-500/50 text-purple-300 font-mono font-extrabold flex items-center justify-center text-lg shadow-sm">
                        X={item.digit}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">
                          Repeated X = {item.digit}
                        </div>
                        <div className="text-xs text-slate-400">
                          Appeared <strong className="text-purple-300">{item.frequency} times</strong> on calendar days: {item.occurrences.join(', ')}
                        </div>
                      </div>
                    </div>

                    {onSendPairsToSimulator && (
                      <button
                        type="button"
                        onClick={() => onSendPairsToSimulator(item.generated.pairs)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-medium self-start sm:self-auto transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Simulate 12 Pairs</span>
                      </button>
                    )}
                  </div>

                  {/* 5-Step Pipeline Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Base Triad:</span>
                      <div className="font-mono font-bold text-sky-300">
                        [{item.generated.baseTriad.join(', ')}]
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">+5 Modulo:</span>
                      <div className="font-mono font-bold text-purple-300">
                        [{item.generated.transformedTriad.join(', ')}]
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Excluded (6):</span>
                      <div className="font-mono font-bold text-rose-300">
                        [{item.generated.excludedDigits.join(', ')}]
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Active (4):</span>
                      <div className="font-mono font-bold text-emerald-300">
                        [{item.generated.activeDigits.join(', ')}]
                      </div>
                    </div>
                  </div>

                  {/* 12 Ordered Pairs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>12 Ordered Pairs P(4,2):</span>
                      <span className="font-mono text-purple-300">Non-repeating</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {item.generated.pairs.map((p, pIdx) => (
                        <div
                          key={`${p}-${pIdx}`}
                          className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono font-bold text-white text-sm hover:border-purple-500/50 transition"
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs space-y-2">
              <Repeat className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-slate-300 font-semibold">No Repeated-X Digits in Selected Date Range.</p>
              <p className="text-slate-500 max-w-md mx-auto">
                A date ones-digit must occur at least 2 times (e.g. 5 on the 5th, 15th, 25th) within the chosen date range to trigger Repeated-X generation. Try widening the interval to "This Month" or "Last 30 Days".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 28 Principle banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Mathematical Distinction:</strong> Repeated X values identify calendar recurrence in the chosen date window and apply the deterministic triad transformation. This grouping is an arithmetic study and does not imply that repeated date digits have a higher probability of matching independent drawings.
        </div>
      </div>
    </div>
  );
};
