import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  Sliders,
  DollarSign,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { formatCurrency } from '../utils/mathEngine';

interface RiskSimulatorSectionProps {
  currency: CurrencyCode;
}

export const RiskSimulatorSection: React.FC<RiskSimulatorSectionProps> = ({ currency }) => {
  // User Inputs as requested by Quant Risk Strategist framework
  const [numberCount, setNumberCount] = useState<number>(10); // K: Number of numbers chosen (1-100)
  const [baseBet, setBaseBet] = useState<number>(10);         // S: Base bet per number in ₹
  const [bankroll, setBankroll] = useState<number>(10000);     // B: Total available bankroll in ₹
  const payoutMultiplier = 90;                                 // 90x fixed payout
  const sampleSpace = 100;                                     // 00-99 universe

  // Calculations for Section 1: Core Math & Probability Profile
  const winProbability = useMemo(() => {
    return (numberCount / sampleSpace) * 100;
  }, [numberCount]);

  const flatStakePerDraw = numberCount * baseBet;

  const flatBetEV = useMemo(() => {
    // EV per draw = (Win Prob * Net Win on Win) - (Loss Prob * Total Stake)
    // Or mathematically: Total Stake * ((Multiplier * (K / 100)) - 1)
    const prob = numberCount / sampleSpace;
    const grossWin = baseBet * payoutMultiplier; // return for the winning number
    const netWinOnSuccess = grossWin - flatStakePerDraw;
    const netLossOnFailure = -flatStakePerDraw;
    const ev = (prob * netWinOnSuccess) + ((1 - prob) * netLossOnFailure);
    return ev;
  }, [numberCount, baseBet, flatStakePerDraw]);

  const maxSustainableLossStreak = useMemo(() => {
    if (flatStakePerDraw <= 0) return 0;
    return Math.floor(bankroll / flatStakePerDraw);
  }, [bankroll, flatStakePerDraw]);

  // Calculations for Section 2: Strategy A — Same / Flat Bet (Fixed Cost 10-Step Projection)
  const strategyATable = useMemo(() => {
    const steps = [];
    let cumulativeSpend = 0;
    for (let step = 1; step <= 10; step++) {
      const totalCost = flatStakePerDraw;
      cumulativeSpend += totalCost;
      const winReturn = baseBet * payoutMultiplier; // 90x on the single winning number
      const netProfit = winReturn - cumulativeSpend; // Net profit if win occurs at this exact cumulative step
      steps.push({
        step,
        betPerNumber: baseBet,
        totalCost,
        cumulativeSpend,
        winReturn,
        netProfit,
      });
    }
    return steps;
  }, [numberCount, baseBet, flatStakePerDraw]);

  // Calculations for Section 3: Strategy B — Variable / Step-Up Progression (1.15x Recovery)
  // Step-up progression scaling bet size to recover prior cumulative losses + net positive return
  const strategyBTable = useMemo(() => {
    const steps = [];
    let currentBet = baseBet;
    let cumulativeSpend = 0;

    for (let step = 1; step <= 8; step++) {
      if (step > 1) {
        // Scale bet size by ~1.15x or recovery formula
        currentBet = Math.round(currentBet * 1.15);
      }
      const totalCost = numberCount * currentBet;
      cumulativeSpend += totalCost;
      const winReturn = currentBet * payoutMultiplier;
      const netProfit = winReturn - cumulativeSpend;
      const netRoi = cumulativeSpend > 0 ? (netProfit / cumulativeSpend) * 100 : 0;

      steps.push({
        step,
        betPerNumber: currentBet,
        totalCost,
        cumulativeSpend,
        winReturn,
        netProfit,
        netRoi,
      });
    }
    return steps;
  }, [numberCount, baseBet]);

  // Calculations for Section 4: Capital Allocation & Risk Control Rules
  const maxStrategyBCumulative = strategyBTable[strategyBTable.length - 1]?.cumulativeSpend || (flatStakePerDraw * 10);
  const minRequiredBankroll = maxStrategyBCumulative * 1.5; // 1.5x of 8-step max or 10x max cumulative step spend
  const recommendedStopLossStep = 5; // Recommended exact step to cut loss and reset
  const targetTakeProfitDaily = flatStakePerDraw * 5; // Daily cap rule (5x single draw exposure)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/10 text-purple-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-500/20">
              QUANTITATIVE RISK STRATEGIST
            </span>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              0–99 Single-Draw (90x)
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Probabilistic Bankroll & Progression Roadmap
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Expert risk management and mathematical expectancy modeling for single-draw fixed-odds wagering.
          </p>
        </div>

        {/* Input Parameters Form */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Numbers Chosen (K)</label>
            <input
              type="number"
              min="1"
              max="99"
              value={numberCount}
              onChange={(e) => setNumberCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
              className="w-24 bg-slate-900 text-slate-100 font-mono text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Base Bet (₹)</label>
            <input
              type="number"
              min="1"
              value={baseBet}
              onChange={(e) => setBaseBet(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-28 bg-slate-900 text-slate-100 font-mono text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bankroll Budget (₹)</label>
            <input
              type="number"
              min="100"
              step="500"
              value={bankroll}
              onChange={(e) => setBankroll(Math.max(100, parseFloat(e.target.value) || 100))}
              className="w-32 bg-slate-900 text-slate-100 font-mono text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: CORE MATH & PROBABILITY PROFILE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Section 1: Core Math & Probability Profile</h3>
            <p className="text-xs text-slate-400">Statistical expectation and variance metrics for {numberCount} numbers selected out of 100.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Single Draw Win Probability</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-cyan-400">{winProbability.toFixed(1)}%</span>
              <span className="text-xs text-slate-500 font-mono">({numberCount} / 100)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Probability of at least one selected number matching the winning draw.</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Flat Bet Expected Value (EV)</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${flatBetEV >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(flatBetEV, currency)}
              </span>
              <span className="text-xs text-slate-500 font-mono">per draw</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Mathematical expectation per draw given total stake of {formatCurrency(flatStakePerDraw, currency)} and 90x payout.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Max Sustainable Loss Streak</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-amber-400">{maxSustainableLossStreak}</span>
              <span className="text-xs text-slate-500 font-mono">draws</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Consecutive flat draws before capital depletion of {formatCurrency(bankroll, currency)}.</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: STRATEGY A — SAME / FLAT BET (FIXED COST) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Section 2: Strategy A — Same / Flat Bet (Fixed Cost)</h3>
            <p className="text-xs text-slate-400">10-step projection table for constant flat bet amounts ({formatCurrency(baseBet, currency)} per number).</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Step #</th>
                <th className="py-3 px-4">Bet Per Number</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Cumulative Spend</th>
                <th className="py-3 px-4">Win Return (90x)</th>
                <th className="py-3 px-4">Net Profit on Win</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
              {strategyATable.map((row) => (
                <tr key={row.step} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-300">#{row.step}</td>
                  <td className="py-3 px-4 text-slate-200">{formatCurrency(row.betPerNumber, currency)}</td>
                  <td className="py-3 px-4 text-slate-300">{formatCurrency(row.totalCost, currency)}</td>
                  <td className="py-3 px-4 text-amber-400">{formatCurrency(row.cumulativeSpend, currency)}</td>
                  <td className="py-3 px-4 text-cyan-400">{formatCurrency(row.winReturn, currency)}</td>
                  <td className={`py-3 px-4 font-bold ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(row.netProfit, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
          <strong className="text-slate-200">Efficiency vs. Decay Analysis:</strong> Flat betting preserves capital longevity, allowing sustainable endurance over extended draw sequences. However, net profit on a win decays linearly relative to cumulative spend as consecutive losses mount.
        </div>
      </div>

      {/* SECTION 3: STRATEGY B — VARIABLE / STEP-UP PROGRESSION (1.15x RECOVERY) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Section 3: Strategy B — Variable / Step-Up Progression (1.15x Recovery)</h3>
            <p className="text-xs text-slate-400">8-step dynamic table scaling bet size to recover prior losses + net positive return upon a win.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Step #</th>
                <th className="py-3 px-4">Bet Per Number</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Cumulative Spend</th>
                <th className="py-3 px-4">Win Return (90x)</th>
                <th className="py-3 px-4">Net Profit</th>
                <th className="py-3 px-4">Net ROI %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
              {strategyBTable.map((row) => (
                <tr key={row.step} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-300">#{row.step}</td>
                  <td className="py-3 px-4 text-purple-300 font-bold">{formatCurrency(row.betPerNumber, currency)}</td>
                  <td className="py-3 px-4 text-slate-300">{formatCurrency(row.totalCost, currency)}</td>
                  <td className="py-3 px-4 text-amber-400">{formatCurrency(row.cumulativeSpend, currency)}</td>
                  <td className="py-3 px-4 text-cyan-400">{formatCurrency(row.winReturn, currency)}</td>
                  <td className={`py-3 px-4 font-bold ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(row.netProfit, currency)}
                  </td>
                  <td className={`py-3 px-4 font-bold ${row.netRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.netRoi >= 0 ? `+${row.netRoi.toFixed(1)}%` : `${row.netRoi.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-purple-200">Reset Trigger Rule</h4>
            <p className="text-xs text-purple-300/80 mt-1">
              Upon any winning draw at any step in Strategy B, the progression immediately resets to <strong className="text-white">Step #1</strong> with the base bet of {formatCurrency(baseBet, currency)}. Never chase losses beyond Step 8 without re-evaluating bankroll health.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: CAPITAL ALLOCATION & RISK CONTROL RULES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Section 4: Capital Allocation & Risk Control Rules</h3>
            <p className="text-xs text-slate-400">Strict structural guardrails to preserve capital and prevent catastrophic drawdown.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Minimum Required Bankroll</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatCurrency(minRequiredBankroll, currency)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculated as 1.5x of the maximum 8-step cumulative progression spend to absorb consecutive variance without ruin.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Mandatory Stop-Loss Limit</span>
            <div className="text-2xl font-black font-mono text-rose-400">
              Step #{recommendedStopLossStep} Cutoff
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hard rule: If draw outcomes fail to match by Step #{recommendedStopLossStep}, cut losses immediately, absorb drawdown, and reset to Step 1.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Target Take-Profit Threshold</span>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {formatCurrency(targetTakeProfitDaily, currency)} Daily Cap
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Daily cap rule: Once cumulative session net profit reaches this threshold, lock in gains and cease trading to prevent over-trading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
