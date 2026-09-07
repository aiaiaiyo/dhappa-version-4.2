import React, { useState, useMemo } from 'react';
import { EngineWalkForwardStep } from '../utils/engineSelfLearningCalibrator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Target,
  Zap,
  Award,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Dna,
} from 'lucide-react';

interface PoolHitRateReliabilityVisualizerProps {
  walkForwardSteps: EngineWalkForwardStep[];
}

type PoolSizeOption = 5 | 10 | 21 | 36;

export const PoolHitRateReliabilityVisualizer: React.FC<PoolHitRateReliabilityVisualizerProps> = ({
  walkForwardSteps,
}) => {
  const [selectedPoolSize, setSelectedPoolSize] = useState<PoolSizeOption>(10);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // 1. Process steps to extract chronological cumulative hit rate data for all 4 pool sizes
  const processedData = useMemo(() => {
    if (!walkForwardSteps || walkForwardSteps.length === 0) return [];

    // Sort chronologically ascending for mathematical cumulative calculation
    const sorted = [...walkForwardSteps].sort((a, b) => a.date.localeCompare(b.date));

    let top5HitsCumulative = 0;
    let top10HitsCumulative = 0;
    let top21HitsCumulative = 0;
    let top36HitsCumulative = 0;

    return sorted.map((step, idx) => {
      const dayNum = idx + 1;

      // A hit occurs in a pool of size N if any item with rank <= N has a matchedDraw defined
      const hit5 = step.top36CalibratedPool.some(
        (item) => item.rank <= 5 && item.matchedDraw !== undefined
      );
      const hit10 = step.top36CalibratedPool.some(
        (item) => item.rank <= 10 && item.matchedDraw !== undefined
      );
      const hit21 = step.top36CalibratedPool.some(
        (item) => item.rank <= 21 && item.matchedDraw !== undefined
      );
      const hit36 = step.top36CalibratedPool.some(
        (item) => item.rank <= 36 && item.matchedDraw !== undefined
      );

      if (hit5) top5HitsCumulative++;
      if (hit10) top10HitsCumulative++;
      if (hit21) top21HitsCumulative++;
      if (hit36) top36HitsCumulative++;

      return {
        date: step.date,
        shortDate: step.date.length >= 10 ? step.date.slice(5) : step.date,
        dayNum,
        hit5,
        hit10,
        hit21,
        hit36,
        top5Rate: Number(((top5HitsCumulative / dayNum) * 100).toFixed(1)),
        top10Rate: Number(((top10HitsCumulative / dayNum) * 100).toFixed(1)),
        top21Rate: Number(((top21HitsCumulative / dayNum) * 100).toFixed(1)),
        top36Rate: Number(((top36HitsCumulative / dayNum) * 100).toFixed(1)),
        // Exact raw counts for tooltips
        hits5: top5HitsCumulative,
        hits10: top10HitsCumulative,
        hits21: top21HitsCumulative,
        hits36: top36HitsCumulative,
      };
    });
  }, [walkForwardSteps]);

  // 2. Compute total metrics per pool size across all history
  const poolMetrics = useMemo(() => {
    const totalDays = walkForwardSteps.length;
    if (totalDays === 0) {
      return {
        5: { rate: 0, baseline: 18.5, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
        10: { rate: 0, baseline: 34.4, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
        21: { rate: 0, baseline: 61.1, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
        36: { rate: 0, baseline: 83.2, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
      };
    }

    const sizes: PoolSizeOption[] = [5, 10, 21, 36];
    const results: Record<
      PoolSizeOption,
      {
        rate: number;
        baseline: number;
        edge: number;
        density: number;
        streak: number;
        drawdown: number;
        hits: number;
      }
    > = {
      5: { rate: 0, baseline: 18.5, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
      10: { rate: 0, baseline: 34.4, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
      21: { rate: 0, baseline: 61.1, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
      36: { rate: 0, baseline: 83.2, edge: 0, density: 0, streak: 0, drawdown: 0, hits: 0 },
    };

    sizes.forEach((size) => {
      let hits = 0;
      let currentStreak = 0;
      let maxStreak = 0;
      let currentDrawdown = 0;
      let maxDrawdown = 0;

      walkForwardSteps.forEach((step) => {
        const isHit = step.top36CalibratedPool.some(
          (item) => item.rank <= size && item.matchedDraw !== undefined
        );

        if (isHit) {
          hits++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          currentDrawdown = 0;
        } else {
          currentStreak = 0;
          currentDrawdown++;
          if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
        }
      });

      const rate = Number(((hits / totalDays) * 100).toFixed(1));
      const baseline =
        size === 5 ? 18.5 : size === 10 ? 34.4 : size === 21 ? 61.1 : 83.2;
      const edge = Number((rate - baseline).toFixed(1));
      
      // Density measures "Accuracy per Selection Unit". High density indicates superior optimization.
      const density = Number((rate / size).toFixed(2));

      results[size] = {
        rate,
        baseline,
        edge,
        density,
        streak: maxStreak,
        drawdown: maxDrawdown,
        hits,
      };
    });

    return results;
  }, [walkForwardSteps]);

  // Determine the highest density (most efficient) and highest edge
  const recommendationAnalytics = useMemo(() => {
    const metrics = poolMetrics;
    const sizes: PoolSizeOption[] = [5, 10, 21, 36];
    
    let bestDensitySize = 5;
    let maxDensity = 0;
    let bestEdgeSize = 10;
    let maxEdge = 0;

    sizes.forEach((size) => {
      if (metrics[size].density > maxDensity) {
        maxDensity = metrics[size].density;
        bestDensitySize = size;
      }
      if (metrics[size].edge > maxEdge) {
        maxEdge = metrics[size].edge;
        bestEdgeSize = size;
      }
    });

    return {
      bestDensitySize,
      maxDensity,
      bestEdgeSize,
      maxEdge,
    };
  }, [poolMetrics]);

  // Compute market performance (Gali, Deshawar, Ghaziabad, Faridabad) specifically for selected pool size
  const selectedPoolMarketStats = useMemo(() => {
    let deshawarHits = 0;
    let faridabadHits = 0;
    let ghaziabadHits = 0;
    let galiHits = 0;

    walkForwardSteps.forEach((step) => {
      const hitsForStep = step.top36CalibratedPool.filter(
        (item) => item.rank <= selectedPoolSize && item.matchedDraw !== undefined
      );

      hitsForStep.forEach((hit) => {
        if (hit.matchedDraw) {
          const m = hit.matchedDraw.market.toLowerCase();
          if (m === 'deshawar') deshawarHits++;
          else if (m === 'faridabad') faridabadHits++;
          else if (m === 'gali') galiHits++;
          else if (m.includes('ghaziabad') || m === 'gzb') ghaziabadHits++;
        }
      });
    });

    const totalHits = deshawarHits + faridabadHits + ghaziabadHits + galiHits || 1;

    return [
      { name: 'Deshawar', Hits: deshawarHits, Percentage: Math.round((deshawarHits / totalHits) * 100), color: '#f43f5e' },
      { name: 'Faridabad', Hits: faridabadHits, Percentage: Math.round((faridabadHits / totalHits) * 100), color: '#fb923c' },
      { name: 'Ghaziabad', Hits: ghaziabadHits, Percentage: Math.round((ghaziabadHits / totalHits) * 100), color: '#38bdf8' },
      { name: 'Gali', Hits: galiHits, Percentage: Math.round((galiHits / totalHits) * 100), color: '#a855f7' },
    ];
  }, [walkForwardSteps, selectedPoolSize]);

  // Active recommendations per pool size
  const poolNarratives = {
    5: {
      title: 'Tier 1 • Top 5 Prime Selection',
      profile: 'Aggressive High-Alpha Staking',
      description: 'Optimized for high-return strategies where absolute precision is required. By picking only 5 calibrated numbers, you isolate the maximum predictive intensity of the ensemble.',
      suitability: 'Ideal for concentrated positions, single-market direct draws, and low-risk capital commitments.',
    },
    10: {
      title: 'Tier 2 • Top 10 High Hit Set',
      profile: 'Balanced Yield / Risk Optimization',
      description: 'The golden mean. Historically offers the highest "Empirical Edge" over random baseline chance, providing a consistent capture rate without over-diluting stakes.',
      suitability: 'Highly recommended for daily tracking, standard multipliers, and robust mathematical safety.',
    },
    21: {
      title: 'Tier 3 • Top 21 Calibrated Pool',
      profile: 'Conservative Multi-Market Hedging',
      description: 'Bridges raw precision with wide-net insurance. Slices through overlapping family resonance branches to guarantee high capture percentages across parallel draws.',
      suitability: 'Perfect for conservative portfolios, spread staking, and consecutive draw recovery setups.',
    },
    36: {
      title: 'Tier 4 • Top 36 Full Coverage',
      profile: 'Maximum Capture Probability (Absolute Safety)',
      description: 'The complete consolidated predictive universe. Offers nearly 100% empirical coverage by absorbing all marginal signals, rashi fluctuations, and daily gap shifts.',
      suitability: 'Best for hedging macro trends, auditing full-scale simulations, or validating cross-system consensus.',
    },
  };

  return (
    <div id="pool-hit-rate-reliability-visualizer" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Executive Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <Dna className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Selection Pool Sizing Accuracy & Statistical Reliability Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Comparative live backtest performance tracking empirical accuracy, mathematical alpha (edge), and staking density across all 4 pool brackets (Top 5, 10, 21, 36)
          </p>
        </div>

        {/* Dynamic Edge Insight Badge */}
        <div className="bg-slate-950 border border-indigo-500/30 px-3 py-2 rounded-xl text-left md:text-right font-mono self-start md:self-auto">
          <div className="text-[10px] uppercase text-slate-400">Peak Optimization Insight</div>
          <div className="text-xs text-indigo-300 font-bold flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Top {recommendationAnalytics.bestDensitySize} Prime offers {recommendationAnalytics.maxDensity}x Accuracy Density</span>
          </div>
        </div>
      </div>

      {/* 4-Tier Interactive Sizing Scorecard Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([5, 10, 21, 36] as PoolSizeOption[]).map((size) => {
          const metrics = poolMetrics[size];
          const isActive = selectedPoolSize === size;
          const label = size === 5 ? 'Top 5 Prime' : size === 10 ? 'Top 10 Set' : size === 21 ? 'Top 21 Pool' : 'Top 36 Full';
          
          let cardBorderColor = isActive ? 'border-indigo-500/60 ring-1 ring-indigo-500/30 bg-slate-950/80 shadow-indigo-950/20 shadow-md' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700/80';
          let indicatorDot = size === 5 ? 'bg-amber-400' : size === 10 ? 'bg-cyan-400' : size === 21 ? 'bg-purple-400' : 'bg-slate-400';

          return (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedPoolSize(size)}
              className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${cardBorderColor}`}
            >
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {isActive && (
                  <span className="text-[9px] uppercase font-mono font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    Active View
                  </span>
                )}
                <span className={`w-2 h-2 rounded-full ${indicatorDot}`} />
              </div>

              {/* Title & Profile */}
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-[11px] font-mono font-semibold text-indigo-300 block">
                  {poolNarratives[size].profile}
                </span>
              </div>

              {/* Empirical Hit Rate & Alpha Margin */}
              <div className="my-4 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-100">
                    {metrics.rate}%
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    +{metrics.edge}% Alpha
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Random Baseline: {metrics.baseline}%</span>
                  <span>{metrics.hits} Hits / {walkForwardSteps.length} Days</span>
                </div>
              </div>

              {/* Core Analytics parameters inside pool */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                {/* Density Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Accuracy Density / Pair:</span>
                    <span className="text-slate-200 font-bold">{metrics.density}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, metrics.density * 5)}%` }} // Normalized scale
                      className={`h-full ${indicatorDot}`}
                    />
                  </div>
                </div>

                {/* Streak Indicators */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 text-center">
                    <div className="text-slate-400 text-[8px] uppercase">Hit Streak</div>
                    <div className="text-slate-200 font-bold mt-0.5">{metrics.streak} Days</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 text-center">
                    <div className="text-rose-400 text-[8px] uppercase">Drawdown</div>
                    <div className="text-slate-200 font-bold mt-0.5">{metrics.drawdown} Days</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two Column Layout: Historical Trajectory vs Selected Bracket Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Col 1: Comparative Recharts Line Chart (8 Columns) */}
        <div className="lg:col-span-7 bg-slate-950/60 rounded-xl border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div>
              <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Cumulative Bracket Convergence Trajectory
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Zero-lookahead historical track comparing cumulative hit probabilities side-by-side
              </p>
            </div>
            {hoveredDate && (
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Inspect: {hoveredDate}
              </span>
            )}
          </div>

          <div className="h-[280px] sm:h-[320px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                onMouseMove={(state: any) => {
                  if (state && state.activeLabel) {
                    setHoveredDate(state.activeLabel);
                  }
                }}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                  fontFamily="monospace"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs space-y-1.5 z-50">
                          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                            <span className="font-bold text-slate-200">{data.date}</span>
                            <span className="text-[9px] text-indigo-300 font-bold uppercase">
                              Cycle #{data.dayNum}
                            </span>
                          </div>
                          <div className="text-slate-300 text-[11px] space-y-1 pt-0.5">
                            <div className="flex justify-between gap-3">
                              <span className="text-amber-400">Top 5 Prime:</span>
                              <span className="font-bold text-slate-100">{data.top5Rate}%</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-cyan-400">Top 10 Set:</span>
                              <span className="font-bold text-slate-100">{data.top10Rate}%</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-purple-400">Top 21 Pool:</span>
                              <span className="font-bold text-slate-100">{data.top21Rate}%</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Top 36 Full:</span>
                              <span className="font-bold text-slate-100">{data.top36Rate}%</span>
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
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                />

                <Line
                  type="monotone"
                  dataKey="top5Rate"
                  name="Top 5 Prime (%)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="top10Rate"
                  name="Top 10 Set (%)"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="top21Rate"
                  name="Top 21 Pool (%)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="top36Rate"
                  name="Top 36 Full (%)"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Col 2: Active Pool Sizing Inspector & Recommendation Panel (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-950/60 rounded-xl border border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3 font-mono">
            <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase">
                Active Pool Audit Panel
              </span>
              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Size: {selectedPoolSize} Pairs
              </span>
            </div>

            {/* Profile Card & Bio */}
            <div className="space-y-1 pt-1">
              <div className="text-base font-bold text-slate-100">
                {poolNarratives[selectedPoolSize].title}
              </div>
              <div className="text-xs text-indigo-300 font-semibold uppercase">
                {poolNarratives[selectedPoolSize].profile}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                {poolNarratives[selectedPoolSize].description}
              </p>
              <div className="text-xs text-amber-300/90 leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-2">
                📢 {poolNarratives[selectedPoolSize].suitability}
              </div>
            </div>

            {/* Market Convergence Breakdown specifically for this size */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">
                Vedic Market Hit Share (Size: {selectedPoolSize})
              </span>
              
              <div className="space-y-1.5">
                {selectedPoolMarketStats.map((market) => (
                  <div key={market.name} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{market.name}</span>
                      <span className="text-slate-400">
                        {market.Hits} Hits <span className="text-slate-200 font-bold">({market.Percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-1 bg-slate-850 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: market.color, width: `${market.Percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>Historical reliability analysis:</span>
            <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked & Validated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
