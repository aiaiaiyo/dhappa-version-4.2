import React, { useMemo } from 'react';
import { DayMarketEntry } from '../types';
import { computeRashiIntelligence, RashiIntelligenceReport } from '../utils/rashiIntelligenceEngine';
import { Sparkles, ArrowRight, BarChart3, Activity } from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface Props {
  records: DayMarketEntry[];
}

export const RashiIntelligenceModule: React.FC<Props> = ({ records }) => {
  const report: RashiIntelligenceReport = useMemo(() => computeRashiIntelligence(records), [records]);

  // Standardized Engine Result for Consensus Layer
  const standardizedRashiResult = useMemo(() => {
    const digitStats = report.digitStats || [];
    const evidence = digitStats.slice(0, 5).map((ds) => `rashi-${ds.pairKey}`);
    const topScore = (digitStats[0]?.percentage || 0);

    return buildStandardizedEngineResult({
      engineId: 'RASHI_INTELLIGENCE',
      methodName: 'Rashi Intelligence (Vedic Complements)',
      date: records[records.length - 1]?.date,
      channel: 'live-engine-output',
      sourceValues: { groupCount: digitStats.length },
      normalizedValues: { digitsCount: digitStats.length },
      rawResult: report as any,
      score: Math.min(100, topScore),
      confidence: Math.min(1, topScore / 100),
      historicalSupport: records.length,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'computeRashiGroups()', 'analyzeTransitions()', 'rankPairs()', 'score()'],
    });
  }, [report, records]);

  if (!records || records.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        No historical data available to compute Rashi Intelligence.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Rashi Intelligence (Vedic Complements)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deep analysis of 0-5, 1-6, 2-7, 3-8, 4-9 half-decade cyclic transitions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Digit Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Rashi Pair Frequency Distribution
          </h3>
          <div className="space-y-3">
            {report.digitStats.map((stat) => (
              <div key={stat.pairKey} className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded">
                      {stat.pairKey}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                      {(stat.percentage).toFixed(1)}% Universe
                    </span>
                  </div>
                  <span className="font-mono text-sm text-cyan-400">
                    {stat.totalOccurrences} obs
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tens (Inside)</div>
                    <div className="font-mono text-sm text-slate-300">{stat.tensFrequency}</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2 text-center border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ones (Outside)</div>
                    <div className="font-mono text-sm text-slate-300">{stat.onesFrequency}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: House Transitions & Correlates */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Day-to-Day House Specific Transitions
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Measures how often a house outcome shifts directly to its Rashi complement on the following day.
            </p>
            <div className="space-y-3">
              {report.houseTransitions.map((ht) => (
                <div key={ht.market} className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-semibold text-slate-200">{ht.market}</span>
                    <span className="text-xs text-slate-500 font-mono">n = {ht.totalTransitions}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 bg-slate-900 rounded-lg border border-slate-800/50">
                      <span className="text-[10px] text-slate-400">Full Rashi</span>
                      <span className="font-mono text-sm font-bold text-purple-400 mt-1">
                        {ht.totalTransitions > 0 ? ((ht.fullRashiTransitions / ht.totalTransitions) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-slate-900 rounded-lg border border-slate-800/50">
                      <span className="text-[10px] text-slate-400">Tens Only</span>
                      <span className="font-mono text-sm font-bold text-amber-400 mt-1">
                        {ht.totalTransitions > 0 ? ((ht.tensRashiTransitions / ht.totalTransitions) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-slate-900 rounded-lg border border-slate-800/50">
                      <span className="text-[10px] text-slate-400">Ones Only</span>
                      <span className="font-mono text-sm font-bold text-cyan-400 mt-1">
                        {ht.totalTransitions > 0 ? ((ht.onesRashiTransitions / ht.totalTransitions) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-200 mb-3">Model Integrations</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider mb-2">Haruf Correlation</span>
                <span className="font-mono text-2xl font-black text-amber-400">
                  {report.rashiCorrelations.harufMatchPercentage.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Historical overlap</span>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider mb-2">Core-X Inclusion</span>
                <span className="font-mono text-2xl font-black text-emerald-400">
                  {report.rashiCorrelations.coreXMatchPercentage.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Historical overlap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
