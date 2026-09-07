import React, { useMemo, useState } from 'react';
import { DayMarketEntry } from '../types';
import { computeDoublesLabReport, DoublesLabReport } from '../utils/doublesLabEngine';
import { Layers, Flame, Sparkles, Activity, Clock, Award, ShieldCheck, RefreshCw, BarChart3, Target } from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface Props {
  records: DayMarketEntry[];
}

export const DoublesLabModule: React.FC<Props> = ({ records }) => {
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');

  const report: DoublesLabReport = useMemo(() => computeDoublesLabReport(records), [records]);

  // Standardized Engine Result for Consensus Layer
  const standardizedDoublesResult = useMemo(() => {
    const candidates = (report.doubles || []).map((d) => d.pair);
    const topScore = report.doubleHitPercentage || 0;
    const evidence = (report.doubles || []).slice(0, 5).map((d) => `doubles:${d.pair}`);

    return buildStandardizedEngineResult({
      engineId: 'DOUBLES_LAB',
      methodName: 'Doubles Specialization Engine',
      date: records[records.length - 1]?.date,
      channel: 'live-engine-output',
      sourceValues: { marketCount: 4 },
      normalizedValues: { doublesCount: candidates.length },
      rawResult: report as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: records.length,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractDoubles()', 'frequencyAnalysis()', 'compatibilityCheck()', 'score()'],
    });
  }, [report, records]);

  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        No historical records available for Doubles Lab analysis.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/10 text-purple-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-500/20">
              SPECIALIZED MODULE
            </span>
            <span className="bg-cyan-500/15 text-cyan-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              00, 11, 22 … 99 (Doubles Universe)
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Doubles Lab & Compatibility Suite
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tracking historical frequency, skip draws, Haruf tendency, Markov transitions, Rashi complements, and Core-X compatibility for all double numbers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Double Hit Rate</div>
            <div className="font-mono text-xl font-black text-emerald-400">{report.doubleHitPercentage}%</div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Double Hits</div>
            <div className="font-mono text-xl font-black text-cyan-400">{report.totalDoubleHits}</div>
          </div>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Hottest Double</span>
            <div className="text-3xl font-black font-mono text-amber-400">{report.hottestDouble}</div>
            <p className="text-xs text-slate-400 mt-1">Highest frequency & recency score in universe.</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Coldest / Overdue Double</span>
            <div className="text-3xl font-black font-mono text-cyan-400">{report.coldestDouble}</div>
            <p className="text-xs text-slate-400 mt-1">Maximum skip gap relative to historical average.</p>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Universe Coverage</span>
            <div className="text-3xl font-black font-mono text-purple-400">10 Pairs</div>
            <p className="text-xs text-slate-400 mt-1">Explicitly monitored across all 4 markets.</p>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Doubles Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Comprehensive Doubles Audit Table (00 – 99)
          </h3>
          <span className="text-xs font-mono text-slate-500">Sorted by Composite Hotness</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-950/50">
                <th className="py-3 px-4">Double</th>
                <th className="py-3 px-4">Total Hits</th>
                <th className="py-3 px-4">Current Skip</th>
                <th className="py-3 px-4">Avg Skip</th>
                <th className="py-3 px-4">Haruf Score</th>
                <th className="py-3 px-4">Markov %</th>
                <th className="py-3 px-4">Rashi Pair</th>
                <th className="py-3 px-4">Core-X Match</th>
                <th className="py-3 px-4">Hotness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
              {report.doubles.map((item, idx) => (
                <tr key={item.pair} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-400">
                      {item.pair}
                    </span>
                    {idx === 0 && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">HOT</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-200">{item.totalHits}</td>
                  <td className={`py-3 px-4 font-bold ${item.currentSkip > item.averageSkip * 1.5 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {item.currentSkip} draws
                  </td>
                  <td className="py-3 px-4 text-slate-400">{item.averageSkip} draws</td>
                  <td className="py-3 px-4 text-emerald-400">{item.harufScore}%</td>
                  <td className="py-3 px-4 text-purple-300">{item.markovProbability}%</td>
                  <td className="py-3 px-4 text-slate-300 font-bold">{item.rashiComplement}</td>
                  <td className="py-3 px-4">
                    {item.coreXCompatibility ? (
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/20 font-bold">YES</span>
                    ) : (
                      <span className="bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded">NO</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-black text-cyan-400">{item.hotnessScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
