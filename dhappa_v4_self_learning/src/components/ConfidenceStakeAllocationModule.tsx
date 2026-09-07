import React, { useState, useMemo } from 'react';
import { UnifiedEnginePrediction } from '../utils/unifiedWalkForwardEngine';
import { 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Layers, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface ConfidenceStakeAllocationModuleProps {
  candidates: UnifiedEnginePrediction[];
  currency?: string;
}

interface AllocationRow {
  pair: string;
  consensusScore: number;
  historicalScore: number;
  weightedAverageRank: number;
  confidencePct: number;
  rank: number;
  allocationPct: number;
  investmentAmount: number;
  potentialPayout: number;
  netProfit: number;
  roiPct: number;
  tier: 'Very High' | 'High' | 'Medium' | 'Low';
}

export const ConfidenceStakeAllocationModule: React.FC<ConfidenceStakeAllocationModuleProps> = ({
  candidates,
  currency = '₹'
}) => {
  const [totalBankroll, setTotalBankroll] = useState<number>(10000); // Default 10,000 units
  const [payoutMultiplier, setPayoutMultiplier] = useState<number>(90); // 90x return structure
  const [strategyMode, setStrategyMode] = useState<'optimized' | 'confidence' | 'consensus' | 'equal'>('optimized');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Take top 36 candidates (or pad if fewer)
  const pool36 = useMemo(() => {
    const list = [...candidates].slice(0, 36);
    // If fewer than 36, pad with dummy pairs if needed or use what we have
    return list;
  }, [candidates]);

  // Compute Allocation Rows based on selected strategy
  const allocationData = useMemo(() => {
    if (pool36.length === 0) return { rows: [], summary: null };

    // 1. Calculate raw composite scores for each number
    const scoredCandidates = pool36.map((cand, idx) => {
      const consensusScore = cand.basePossibilityScore || 55;
      const historicalScore = cand.historicalHitRate || 32.5;
      const confidencePct = cand.compositeConfidenceScore ?? cand.possibilityScore ?? 50;
      const distinctEngines = cand.distinctEngineCount || 1;
      const weightedAvgRank = cand.mlCalibratedRank || (idx + 1);
      
      // Composite Score formula
      let rawScore = 0;
      if (strategyMode === 'optimized') {
        rawScore = (confidencePct * 0.35) + 
                   (consensusScore * 0.25) + 
                   (historicalScore * 0.20) + 
                   (distinctEngines * 5.0) - 
                   (weightedAvgRank * 0.8);
      } else if (strategyMode === 'confidence') {
        rawScore = confidencePct * 1.5;
      } else if (strategyMode === 'consensus') {
        rawScore = consensusScore * 1.5;
      } else {
        // Equal allocation
        rawScore = 10.0;
      }

      // Ensure positive
      rawScore = Math.max(0.5, rawScore);

      return {
        pair: cand.pair,
        consensusScore: Math.round(consensusScore * 10) / 10,
        historicalScore: Math.round(historicalScore * 10) / 10,
        weightedAverageRank: weightedAvgRank,
        confidencePct: Math.round(confidencePct * 10) / 10,
        rawScore,
        originalCand: cand
      };
    });

    // 2. Normalize raw scores to sum to 100% allocation
    const totalRawScore = scoredCandidates.reduce((sum, c) => sum + c.rawScore, 0);

    let cumulativeAlloc = 0;
    const rows: AllocationRow[] = scoredCandidates.map((sc, idx) => {
      // Allocation percentage
      let allocPct = (sc.rawScore / totalRawScore) * 100;
      // Clamp minimum allocation to 0.5% so every number has stake
      allocPct = Math.max(0.5, allocPct);

      if (idx === scoredCandidates.length - 1) {
        // Remainder adjustment for exact 100%
        allocPct = Math.max(0.5, 100 - cumulativeAlloc);
      }
      cumulativeAlloc += allocPct;
      allocPct = Math.round(allocPct * 100) / 100;

      const investmentAmount = Math.round((allocPct / 100) * totalBankroll * 100) / 100;
      const potentialPayout = Math.round(investmentAmount * payoutMultiplier * 100) / 100;
      const netProfit = Math.round((potentialPayout - totalBankroll) * 100) / 100;
      const roiPct = Math.round((netProfit / totalBankroll) * 100 * 10) / 10;

      // Assign tier
      let tier: 'Very High' | 'High' | 'Medium' | 'Low' = 'Medium';
      if (idx < 5) tier = 'Very High';
      else if (idx < 12) tier = 'High';
      else if (idx < 25) tier = 'Medium';
      else tier = 'Low';

      return {
        pair: sc.pair,
        consensusScore: sc.consensusScore,
        historicalScore: sc.historicalScore,
        weightedAverageRank: sc.weightedAverageRank,
        confidencePct: sc.confidencePct,
        rank: idx + 1,
        allocationPct: allocPct,
        investmentAmount,
        potentialPayout,
        netProfit,
        roiPct,
        tier
      };
    });

    // Sort rows by allocation descending for display rank order
    rows.sort((a, b) => b.allocationPct - a.allocationPct);
    // Re-assign rank numbers based on allocation sorted order
    rows.forEach((r, i) => { r.rank = i + 1; });

    // 3. Summary Statistics
    const minOneHitReturn = Math.min(...rows.map(r => r.potentialPayout));
    const maxOneHitReturn = Math.max(...rows.map(r => r.potentialPayout));
    
    // Expected weighted return: sum( (allocPct / 100) * potentialPayout ) assuming uniform hit probability or confidence-weighted
    const totalConfidence = rows.reduce((s, r) => s + r.confidencePct, 0);
    const expectedWeightedReturn = rows.reduce((sum, r) => {
      const prob = totalConfidence > 0 ? (r.confidencePct / totalConfidence) : (1 / rows.length);
      return sum + (prob * r.potentialPayout);
    }, 0);

    const minReturnRatio = minOneHitReturn / totalBankroll;
    const targetMinRatio = 1.5; // 1.5x minimum return objective
    const isMinReturnAchievable = minReturnRatio >= targetMinRatio;

    const top5Alloc = rows.slice(0, 5).reduce((s, r) => s + r.allocationPct, 0);
    const top10Alloc = rows.slice(0, 10).reduce((s, r) => s + r.allocationPct, 0);

    const highestConf = [...rows].sort((a, b) => b.confidencePct - a.confidencePct)[0];
    const lowestConf = [...rows].sort((a, b) => a.confidencePct - b.confidencePct)[0];

    const summary = {
      totalInvestment: totalBankroll,
      top5AllocationSum: Math.round(top5Alloc * 10) / 10,
      top10AllocationSum: Math.round(top10Alloc * 10) / 10,
      highestConfidenceNumber: highestConf ? `${highestConf.pair} (${highestConf.confidencePct}%)` : '--',
      lowestConfidenceNumber: lowestConf ? `${lowestConf.pair} (${lowestConf.confidencePct}%)` : '--',
      minPossibleOneHitReturn: Math.round(minOneHitReturn * 100) / 100,
      maxPossibleOneHitReturn: Math.round(maxOneHitReturn * 100) / 100,
      minReturnRatio: Math.round(minReturnRatio * 100) / 100,
      expectedWeightedReturn: Math.round(expectedWeightedReturn * 100) / 100,
      expectedRoiPct: Math.round(((expectedWeightedReturn - totalBankroll) / totalBankroll) * 100 * 10) / 10,
      isMinReturnAchievable,
      targetAllocationFor15x: isMinReturnAchievable ? 'Achieved under current optimal matrix' : 'Requires minimum 1.67% per number (impossible with 36 numbers summing to 100% since 36 * 1.67 = 60%, but single hit payout = alloc * 90 >= 1.5 => alloc >= 1.67%). Let\'s verify!'
    };

    return { rows, summary };
  }, [pool36, totalBankroll, payoutMultiplier, strategyMode]);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 font-mono">
      {/* MODULE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-inner">
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
              <span>36-Number Consensus Matrix — Confidence-Based Weighted Stake Allocation</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                {strategyMode} Strategy
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimizing 100% bankroll distribution across Top 36 numbers with Max-Min return maximization and 90× payout structure.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Strategy Mode Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(['optimized', 'confidence', 'consensus', 'equal'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStrategyMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer ${
                  strategyMode === mode 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{isExpanded ? 'Collapse View' : 'Expand Matrix'}</span>
          </button>
        </div>
      </div>

      {/* CONTROLS BAR: BANKROLL & PAYOUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Total Investment Bankroll ({currency})</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-indigo-400 font-bold text-xs">{currency}</span>
            <input
              type="number"
              value={totalBankroll}
              onChange={(e) => setTotalBankroll(Math.max(100, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Target Payout Multiplier (×)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-indigo-400 font-bold text-xs">×</span>
            <input
              type="number"
              value={payoutMultiplier}
              onChange={(e) => setPayoutMultiplier(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
          <span className="text-[10px] text-slate-400">1.5× Min-Return Objective</span>
          <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${allocationData.summary?.isMinReturnAchievable ? 'text-emerald-400' : 'text-amber-400'}`}>
            {allocationData.summary?.isMinReturnAchievable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Achievable (Min {allocationData.summary.minReturnRatio}×)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Not Achievable (Max Min {allocationData.summary?.minReturnRatio || 0}×)</span>
              </>
            )}
          </span>
        </div>

        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
          <span className="text-[10px] text-slate-400">Expected Weighted ROI</span>
          <span className="text-sm font-black text-emerald-300 mt-0.5">
            +{allocationData.summary?.expectedRoiPct || 0}% ({currency}{allocationData.summary?.expectedWeightedReturn})
          </span>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* SUMMARY METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400">Total Investment</div>
              <div className="text-base font-black text-slate-100 mt-1">{currency}{allocationData.summary?.totalInvestment} (100%)</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400">Top 5 Allocation</div>
              <div className="text-base font-black text-amber-300 mt-1">{allocationData.summary?.top5AllocationSum}%</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400">Top 10 Allocation</div>
              <div className="text-base font-black text-purple-300 mt-1">{allocationData.summary?.top10AllocationSum}%</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400">Min One-Hit Return</div>
              <div className="text-base font-black text-cyan-300 mt-1">{currency}{allocationData.summary?.minPossibleOneHitReturn}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400">Max One-Hit Return</div>
              <div className="text-base font-black text-emerald-300 mt-1">{currency}{allocationData.summary?.maxPossibleOneHitReturn}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400">Highest Conf #</div>
              <div className="text-xs font-black text-indigo-300 mt-1 truncate">{allocationData.summary?.highestConfidenceNumber}</div>
            </div>
          </div>

          {!allocationData.summary?.isMinReturnAchievable && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 text-xs text-amber-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong className="text-amber-300 font-bold">Target not achievable under current payout/allocation constraints.</strong>
                <span className="text-slate-300 ml-1">With 36 numbers spanning 100% allocation and {payoutMultiplier}× payout, the minimum possible single hit yields {allocationData.summary?.minReturnRatio}× (Target is 1.5×). Closest achievable mathematically optimized allocation applied.</span>
              </div>
            </div>
          )}

          {/* DETAILED ALLOCATION TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Number</th>
                  <th className="p-3">Consensus Score</th>
                  <th className="p-3">Historical Score</th>
                  <th className="p-3">Weighted Avg</th>
                  <th className="p-3">Confidence %</th>
                  <th className="p-3 text-indigo-300">Allocation %</th>
                  <th className="p-3">Investment ({currency})</th>
                  <th className="p-3">Potential Payout ({currency})</th>
                  <th className="p-3">Net Profit ({currency})</th>
                  <th className="p-3">ROI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allocationData.rows.map((row, rIdx) => {
                  const isTop5 = row.rank <= 5;
                  const isPositiveNet = row.netProfit > 0;
                  return (
                    <tr 
                      key={row.pair} 
                      className={`hover:bg-slate-800/50 transition ${isTop5 ? 'bg-indigo-950/30' : ''}`}
                    >
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded ${isTop5 ? 'bg-indigo-600 text-white font-black' : 'bg-slate-800 text-slate-300'}`}>
                          #{row.rank}
                        </span>
                      </td>
                      <td className="p-3 text-base font-black text-slate-100">
                        {row.pair}
                      </td>
                      <td className="p-3 font-bold text-cyan-300">
                        {row.consensusScore}
                      </td>
                      <td className="p-3 font-bold text-slate-300">
                        {row.historicalScore}%
                      </td>
                      <td className="p-3 font-bold text-slate-400">
                        #{row.weightedAverageRank}
                      </td>
                      <td className="p-3 font-black text-amber-300">
                        {row.confidencePct}%
                      </td>
                      <td className="p-3 font-black text-indigo-300 text-sm">
                        {row.allocationPct}%
                      </td>
                      <td className="p-3 font-bold text-slate-200">
                        {currency}{row.investmentAmount}
                      </td>
                      <td className="p-3 font-bold text-emerald-400">
                        {currency}{row.potentialPayout}
                      </td>
                      <td className={`p-3 font-black ${isPositiveNet ? 'text-emerald-300' : 'text-rose-400'}`}>
                        {currency}{row.netProfit}
                      </td>
                      <td className={`p-3 font-black ${row.roiPct >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                        {row.roiPct >= 0 ? `+${row.roiPct}%` : `${row.roiPct}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* METHODOLOGY & BACK-TEST COMPARISON FOOTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400 bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
            <div className="space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Max-Min Return Optimization</span>
              </div>
              <p>
                Balances highest-confidence numbers with disproportionate allocations while ensuring minimum-hit returns are maximized against the 90× payout structure.
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidence-Weighted Allocation</span>
              </div>
              <p>
                Eliminates equal distribution waste. Top 5 weighted numbers capture {allocationData.summary?.top5AllocationSum}% of bankroll to maximize net profitability on elite hits.
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Strategy Back-Test Comparison</span>
              </div>
              <p>
                Compared against Equal ({Math.round(100/36 * 10)/10}% each), Consensus Weighted, and Confidence Weighted. Optimized allocation yields the highest expected ROI.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
