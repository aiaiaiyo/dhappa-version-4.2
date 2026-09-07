import React, { useMemo } from 'react';
import { BacktestRecordStep, DayMarketEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, Target, Award, ShieldCheck, Flame, Layers, AlertCircle, TrendingUp } from 'lucide-react';

interface Last5DaysHousePoolChartProps {
  historySteps: BacktestRecordStep[];
  records: DayMarketEntry[];
}

export const Last5DaysHousePoolChart: React.FC<Last5DaysHousePoolChartProps> = ({
  historySteps,
  records,
}) => {
  // 1. Get the last 5 days of backtest steps (sorted chronologically descending, then take the first 5, then reverse to display ascending)
  const last5Steps = useMemo(() => {
    if (!historySteps || historySteps.length === 0) return [];
    
    // Sort chronologically descending to get the absolute most recent days
    const sorted = [...historySteps].sort((a, b) => b.date.localeCompare(a.date));
    const raw5 = sorted.slice(0, 5);
    
    // Return chronologically ascending (oldest to newest among the 5 days) for the charts/tables
    return [...raw5].reverse();
  }, [historySteps]);

  // Helper to normalize draw entries
  const normalizePair = (p?: string): string | null => {
    if (!p) return null;
    const clean = p.trim();
    if (/^\d{1,2}$/.test(clean)) {
      return clean.padStart(2, '0');
    }
    return null;
  };

  // 2. Compute exact hit details for each house on each of the last 5 days
  const detailedDaysData = useMemo(() => {
    if (last5Steps.length === 0 || !records || records.length === 0) return [];

    return last5Steps.map((step) => {
      // Find the corresponding DayMarketEntry to get exact house-to-draw mappings
      const recordEntry = records.find((r) => r.date === step.date);
      
      const houses = [
        { name: 'Deshawar', key: 'DES', draw: recordEntry?.deshawar || recordEntry?.gzb }, // Fallback check
        { name: 'Faridabad', key: 'FD', draw: recordEntry?.faridabad },
        { name: 'Ghaziabad', key: 'GD/GB', draw: recordEntry?.ghaziabad || recordEntry?.gzb },
        { name: 'Gali', key: 'GAL', draw: recordEntry?.gali },
      ];

      // If recordEntry is missing or some fields are blank, try to map from targetDrawPairs as fallback
      const processedHouses = houses.map((house, idx) => {
        let pair = normalizePair(house.draw);
        
        // Fallback to targetDrawPairs if record is not matched or blank
        if (!pair && step.targetDrawPairs && step.targetDrawPairs[idx]) {
          pair = normalizePair(step.targetDrawPairs[idx]);
        }

        if (!pair) {
          return {
            name: house.name,
            key: house.key,
            pair: '--',
            hitLevel: 'NONE' as const,
            rank: -1,
          };
        }

        // Check hits in Top 5, Top 10, or Top 20 (representing Top 21 Calibrated)
        const rank5 = step.top5Candidates?.indexOf(pair) ?? -1;
        const rank10 = step.top10Candidates?.indexOf(pair) ?? -1;
        const rank21 = step.top20Candidates?.indexOf(pair) ?? -1;

        let hitLevel: 'TOP5' | 'TOP10' | 'TOP21' | 'NONE' = 'NONE';
        let rank = -1;

        if (rank5 >= 0) {
          hitLevel = 'TOP5';
          rank = rank5 + 1;
        } else if (rank10 >= 0) {
          hitLevel = 'TOP10';
          rank = rank10 + 1;
        } else if (rank21 >= 0) {
          hitLevel = 'TOP21';
          rank = rank21 + 1;
        }

        return {
          name: house.name,
          key: house.key,
          pair,
          hitLevel,
          rank,
        };
      });

      return {
        date: step.date,
        houses: processedHouses,
      };
    });
  }, [last5Steps, records]);

  // 3. Compute cumulative hits count per house over these last 5 days
  const cumulativeHouseMetrics = useMemo(() => {
    const stats = {
      Deshawar: { top5: 0, top10: 0, top21: 0, total: 0 },
      Faridabad: { top5: 0, top10: 0, top21: 0, total: 0 },
      Ghaziabad: { top5: 0, top10: 0, top21: 0, total: 0 },
      Gali: { top5: 0, top10: 0, top21: 0, total: 0 },
    };

    detailedDaysData.forEach((day) => {
      day.houses.forEach((house) => {
        const name = house.name as 'Deshawar' | 'Faridabad' | 'Ghaziabad' | 'Gali';
        if (!stats[name]) return;

        if (house.pair !== '--') {
          stats[name].total += 1;
          if (house.hitLevel === 'TOP5') {
            stats[name].top5 += 1;
            stats[name].top10 += 1;
            stats[name].top21 += 1;
          } else if (house.hitLevel === 'TOP10') {
            stats[name].top10 += 1;
            stats[name].top21 += 1;
          } else if (house.hitLevel === 'TOP21') {
            stats[name].top21 += 1;
          }
        }
      });
    });

    return stats;
  }, [detailedDaysData]);

  // 4. Construct Recharts data representing cumulative hits in each tier for each house
  const chartData = useMemo(() => {
    const metrics = cumulativeHouseMetrics;
    return [
      {
        name: 'Deshawar',
        short: 'DES',
        'Top 5': metrics.Deshawar.top5,
        'Top 10': metrics.Deshawar.top10,
        'Top 21': metrics.Deshawar.top21,
        color: '#f59e0b',
      },
      {
        name: 'Faridabad',
        short: 'FD',
        'Top 5': metrics.Faridabad.top5,
        'Top 10': metrics.Faridabad.top10,
        'Top 21': metrics.Faridabad.top21,
        color: '#06b6d4',
      },
      {
        name: 'Ghaziabad',
        short: 'GZB',
        'Top 5': metrics.Ghaziabad.top5,
        'Top 10': metrics.Ghaziabad.top10,
        'Top 21': metrics.Ghaziabad.top21,
        color: '#10b981',
      },
      {
        name: 'Gali',
        short: 'GAL',
        'Top 5': metrics.Gali.top5,
        'Top 10': metrics.Gali.top10,
        'Top 21': metrics.Gali.top21,
        color: '#a855f7',
      },
    ];
  }, [cumulativeHouseMetrics]);

  return (
    <div id="last-5-days-house-pool-analysis" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-100 flex items-center gap-2">
              Last 5 Days Multi-Tier House Hit Analyzer
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real hit counts and exact numbers captured in the last 5 days across <strong className="text-cyan-400">Top 5 (Prime)</strong>, <strong className="text-emerald-400">Top 10 (High)</strong>, and <strong className="text-purple-400">Top 21 (Calibrated)</strong> pools for each house.
          </p>
        </div>

        {/* Date window badge */}
        {last5Steps.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-slate-400 font-semibold uppercase">Temporal Window:</span>
            <span className="text-purple-300 font-bold">
              {last5Steps[0]?.date} to {last5Steps[last5Steps.length - 1]?.date}
            </span>
          </div>
        )}
      </div>

      {/* Grid Content: Chart + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Visual Bar Chart Column (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-xl p-4 sm:p-5 space-y-4">
          <span className="text-[10.5px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
            📊 Grouped Hits Comparison (Last 5 Days Cumulative)
          </span>

          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="short"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 5]}
                  tickCount={6}
                  fontFamily="monospace"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl font-mono text-xs space-y-1">
                          <span className="font-bold text-slate-200 block">{data.name} ({data.short})</span>
                          <div className="text-[10px] text-slate-400 space-y-1 mt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded bg-cyan-400" />
                              <span>Top 5 Hits: <strong>{data['Top 5']} / 5</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded bg-emerald-400" />
                              <span>Top 10 Hits: <strong>{data['Top 10']} / 5</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded bg-purple-400" />
                              <span>Top 21 Hits: <strong>{data['Top 21']} / 5</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="Top 5" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Top 10" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Top 21" fill="#a855f7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick takeaway summary list */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-900 text-[10.5px] font-mono">
            {chartData.map((house) => {
              const maxHits = Math.max(house['Top 5'], house['Top 10'], house['Top 21']);
              return (
                <div key={house.name} className="bg-slate-950/80 border border-slate-900 rounded-lg p-2 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: house.color }} />
                    <span className="text-slate-300 font-bold">{house.name}</span>
                  </div>
                  <div className="text-slate-400 mt-1">
                    Best: <span className="text-emerald-400 font-bold">{maxHits}/5 hits</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chronological Table List Column (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Day-by-Day Precision Matrix
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Latest 5 Draw Cycles</span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {detailedDaysData.map((day) => (
              <div key={day.date} className="bg-slate-950/90 border border-slate-900 rounded-xl p-3 space-y-2.5">
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 font-mono text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Date: {day.date}
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    4-House Outcomes
                  </span>
                </div>

                {/* Houses Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {day.houses.map((house) => {
                    let badgeClass = 'bg-slate-900 text-slate-400 border-slate-850';
                    let label = 'Miss';

                    if (house.hitLevel === 'TOP5') {
                      badgeClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-extrabold';
                      label = 'Top 5 Hit';
                    } else if (house.hitLevel === 'TOP10') {
                      badgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-extrabold';
                      label = 'Top 10 Hit';
                    } else if (house.hitLevel === 'TOP21') {
                      badgeClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30 font-extrabold';
                      label = 'Top 21 Hit';
                    } else if (house.pair === '--') {
                      badgeClass = 'bg-slate-950 text-slate-600 border-slate-950';
                      label = 'No Draw';
                    }

                    return (
                      <div key={house.name} className="bg-slate-900/40 p-2 rounded-lg border border-slate-900 flex flex-col justify-between space-y-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>{house.name}</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className="text-sm font-black text-slate-100">
                            #{house.pair}
                          </span>
                          {house.rank > 0 && (
                            <span className="text-[9px] text-slate-500">
                              (R#{house.rank})
                            </span>
                          )}
                        </div>
                        <div className={`text-[9.5px] text-center py-0.5 px-1 rounded border mt-1.5 ${badgeClass}`}>
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
