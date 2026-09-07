import React, { useState, useMemo } from 'react';
import { SirAbhishekBacktestStep, DayMarketEntry } from '../types';
import { getCoreFamilyForPair } from '../utils/customNumberIntelligenceEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Award,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Search,
  HelpCircle,
  Dna,
} from 'lucide-react';

interface SirAbhishekFamilyWalkForwardTestProps {
  activeDate: string;
  activeSirAbhishekPairs: string[];
  backtestSteps: SirAbhishekBacktestStep[];
}

export const SirAbhishekFamilyWalkForwardTest: React.FC<SirAbhishekFamilyWalkForwardTestProps> = ({
  activeDate,
  activeSirAbhishekPairs,
  backtestSteps,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculate active date family distribution based on the 15-pair set
  const activeDateFamilyDistribution = useMemo(() => {
    if (!activeSirAbhishekPairs || activeSirAbhishekPairs.length === 0) return [];

    const familyCounts: Record<string, { count: number; pairs: string[]; members: string[] }> = {};

    activeSirAbhishekPairs.forEach((pair) => {
      const famInfo = getCoreFamilyForPair(pair);
      const famRoot = famInfo.familyRoot;
      if (!familyCounts[famRoot]) {
        familyCounts[famRoot] = {
          count: 0,
          pairs: [],
          members: famInfo.allExtendedMembers,
        };
      }
      familyCounts[famRoot].count += 1;
      familyCounts[famRoot].pairs.push(pair);
    });

    return Object.entries(familyCounts)
      .map(([family, data]) => ({
        family,
        count: data.count,
        pairs: data.pairs,
        members: data.members,
        weightPercentage: Math.round((data.count / activeSirAbhishekPairs.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeSirAbhishekPairs]);

  // Identify the predicted leading family for the selected active date
  const predictedLeadingFamily = useMemo(() => {
    return activeDateFamilyDistribution[0] || null;
  }, [activeDateFamilyDistribution]);

  // 2. Perform walk-forward accuracy test for Vedic families inside Sir Abhishek's Theory
  const familyWalkForwardMetrics = useMemo(() => {
    if (!backtestSteps || backtestSteps.length === 0) return [];

    // Accumulators for each family root
    // Format of family stats:
    // - predictedCount: how many times the family had at least 1 pair generated in the 15-pair set
    // - actualHits: how many times the family hit (actual draw matches any of its extended members) when predicted
    // - totalDrawHits: absolute times the family appeared in target outcomes overall
    const familyStats: Record<
      string,
      {
        predictedCount: number;
        actualHits: number;
        hitsByMarket: Record<string, number>;
        totalWeightPoints: number;
      }
    > = {};

    backtestSteps.forEach((step) => {
      // 15 pairs predicted on step
      const predictedPairs = step.sirAbhishekPairs || [];
      const targetDraws = step.targetHouseOutcomes || [];

      // Find which families are generated in the 15-pair prediction
      const predictedFamiliesOnStep: Record<string, number> = {};
      predictedPairs.forEach((pair) => {
        const famRoot = getCoreFamilyForPair(pair).familyRoot;
        predictedFamiliesOnStep[famRoot] = (predictedFamiliesOnStep[famRoot] || 0) + 1;
      });

      // Find which families actually occurred in target draws
      const actualFamiliesOnStep = new Set<string>();
      targetDraws.forEach((draw) => {
        if (draw && draw !== '--' && draw.length === 2) {
          actualFamiliesOnStep.add(getCoreFamilyForPair(draw).familyRoot);
        }
      });

      // Update metrics for predicted families
      Object.entries(predictedFamiliesOnStep).forEach(([famRoot, weight]) => {
        if (!familyStats[famRoot]) {
          familyStats[famRoot] = {
            predictedCount: 0,
            actualHits: 0,
            hitsByMarket: { Deshawar: 0, Faridabad: 0, Gali: 0, GZB: 0 },
            totalWeightPoints: 0,
          };
        }

        familyStats[famRoot].predictedCount += 1;
        familyStats[famRoot].totalWeightPoints += weight;

        // Check if this predicted family actually hit in the draw on Day T
        if (actualFamiliesOnStep.has(famRoot)) {
          familyStats[famRoot].actualHits += 1;

          // Attribute hit to specific market(s)
          targetDraws.forEach((draw, mIdx) => {
            if (draw && getCoreFamilyForPair(draw).familyRoot === famRoot) {
              const markets = ['Deshawar', 'Faridabad', 'Gali', 'GZB'];
              const marketName = markets[mIdx];
              familyStats[famRoot].hitsByMarket[marketName] = (familyStats[famRoot].hitsByMarket[marketName] || 0) + 1;
            }
          });
        }
      });
    });

    return Object.entries(familyStats)
      .map(([family, stats]) => {
        const hitRate = stats.predictedCount > 0 
          ? Number(((stats.actualHits / stats.predictedCount) * 100).toFixed(1)) 
          : 0;

        const averageWeightPerPrediction = stats.predictedCount > 0
          ? Number((stats.totalWeightPoints / stats.predictedCount).toFixed(2))
          : 0;

        return {
          family,
          predictedCount: stats.predictedCount,
          actualHits: stats.actualHits,
          hitRate,
          averageWeightPerPrediction,
          hitsByMarket: stats.hitsByMarket,
          // Calculate an empirical edge over random expectancy.
          // Random probability of a family hitting in 4 draws of 2-digits:
          // A family has 8 extended members (e.g. 03, 30, 08, 80, 53, 35, 58, 85).
          // Probability of at least 1 hit in 4 random independent draws is approx 28.3%.
          empiricalLift: Number((hitRate / 28.3).toFixed(2)),
        };
      })
      .sort((a, b) => b.hitRate - a.hitRate);
  }, [backtestSteps]);

  // Find the family with the absolute highest statistical reliability
  const ultimateReliableFamily = useMemo(() => {
    const valid = familyWalkForwardMetrics.filter((f) => f.predictedCount >= 3);
    return valid[0] || null;
  }, [familyWalkForwardMetrics]);

  // Colors for family visual bars
  const COLORS = ['#818cf8', '#38bdf8', '#fb7185', '#34d399', '#fb923c', '#a78bfa', '#f472b6', '#facc15'];

  const filteredFamilyMetrics = useMemo(() => {
    return familyWalkForwardMetrics.filter((f) =>
      f.family.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [familyWalkForwardMetrics, searchTerm]);

  return (
    <div id="sir-abhishek-family-walk-forward-test" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Dna className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Sir Abhishek's Theory • Vedic Family Leading Predictor
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Predicts the leading Vedic family for the active draw cycle and calculates historical walk-forward accuracy (empirical hit rates) for each family cluster
          </p>
        </div>

        {/* Global Insight Badge */}
        {ultimateReliableFamily && (
          <div className="bg-slate-950 border border-purple-500/30 px-3.5 py-2 rounded-xl text-left md:text-right font-mono self-start md:self-auto">
            <div className="text-[10px] uppercase text-slate-400">Most Reliable Family Cluster</div>
            <div className="text-xs text-purple-300 font-bold flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{ultimateReliableFamily.family} ({ultimateReliableFamily.hitRate}% Walk-Forward Hits)</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Selected Date Leading Family vs. Historical Family Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Column 1: Active Date Prediction (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-950/50 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4 font-mono">
            <div className="pb-2 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 uppercase">
                Active Draw Predictions
              </span>
              <span className="text-[11px] text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Date: {activeDate}
              </span>
            </div>

            {/* Leading Family Hero Section */}
            {predictedLeadingFamily ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                    ⚡ Predicted Leading Family Root
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-400">
                      {predictedLeadingFamily.family}
                    </span>
                    <span className="text-xs text-slate-300 font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                      Weight: {predictedLeadingFamily.count} Pairs
                    </span>
                  </div>
                </div>

                {/* Sub-text explanation */}
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In Sir Abhishek's theory, the 15-pair expansion on {activeDate} has concentrated most heavily inside the <strong className="text-purple-300">{predictedLeadingFamily.family}</strong> cluster ({predictedLeadingFamily.weightPercentage}% of generated combinations). This indicates peak probability to lead the upcoming draw.
                </p>

                {/* Extended members representation */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">
                    Family Staking Members ({predictedLeadingFamily.members.length} Pairs/Reverse)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {predictedLeadingFamily.members.map((member) => {
                      const isGenerated = predictedLeadingFamily.pairs.includes(member) || predictedLeadingFamily.pairs.includes(`${member[1]}${member[0]}`);
                      return (
                        <span
                          key={member}
                          className={`text-xs px-2 py-1 rounded-md font-mono ${
                            isGenerated
                              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold'
                              : 'bg-slate-900 text-slate-500 border border-slate-800/80'
                          }`}
                        >
                          {member}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                Select a date or enter outcomes to compute the leading family prediction.
              </div>
            )}

            {/* Distribution chart inside active predictions */}
            {activeDateFamilyDistribution.length > 0 && (
              <div className="pt-3 border-t border-slate-900 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">
                  Theory Pair Weight Distribution
                </span>
                <div className="space-y-1.5">
                  {activeDateFamilyDistribution.slice(0, 4).map((f, idx) => (
                    <div key={f.family} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{f.family}</span>
                        <span className="text-slate-400 font-bold">{f.weightPercentage}%</span>
                      </div>
                      <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${f.weightPercentage}%` }}
                          className="h-full rounded-full bg-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Staking Strategy:</span>
            <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Focus Predicted Leaders
            </span>
          </div>
        </div>

        {/* Column 2: Walk-Forward Historical Accuracy Leaderboard (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-950/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Vedic Family Walk-Forward Hit Rate Leaderboard
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculates actual historical hit rates specifically when predicted/generated by Sir Abhishek's theory
              </p>
            </div>

            {/* Mini Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Family..."
                className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 focus:outline-none focus:border-purple-500 font-mono w-full sm:w-36"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          {/* Bar Chart Visualization */}
          {filteredFamilyMetrics.length > 0 ? (
            <div className="space-y-4">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredFamilyMetrics.slice(0, 6)}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="family"
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
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl font-mono text-xs space-y-1">
                              <span className="font-bold text-slate-200 block">{data.family}</span>
                              <div className="text-[10px] text-slate-400 space-y-0.5">
                                <div>Predicted Draws: {data.predictedCount} cycles</div>
                                <div>Actual Hits: {data.actualHits} times</div>
                                <div className="text-emerald-400 font-bold">Accuracy: {data.hitRate}%</div>
                                <div className="text-indigo-400">Lift Factor: {data.empiricalLift}x</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="hitRate" name="Walk-Forward Hit Rate (%)" fill="#818cf8" radius={[4, 4, 0, 0]}>
                      {filteredFamilyMetrics.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scrollable Metric List */}
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {filteredFamilyMetrics.map((item, idx) => (
                  <div
                    key={item.family}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/85 bg-slate-900/40 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-200">{item.family}</span>
                        <span className="text-[9px] text-slate-400 ml-2">
                          (Predicted {item.predictedCount}x • Avg Weight: {item.averageWeightPerPrediction})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                          Empirical Hit Rate
                        </span>
                        <span className="font-bold text-slate-100">{item.hitRate}%</span>
                      </div>
                      <div className="text-right border-l border-slate-800 pl-3">
                        <span className="text-[10px] text-emerald-400 block font-bold">
                          Lift vs Rand
                        </span>
                        <span className="font-bold text-emerald-400">{item.empiricalLift}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No family matches found matching "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
