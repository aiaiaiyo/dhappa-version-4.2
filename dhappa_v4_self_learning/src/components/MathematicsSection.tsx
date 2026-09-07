import React, { useState } from 'react';
import {
  BookOpen,
  Binary,
  Layers,
  Scale,
  Sparkles,
  Flame,
  Calculator,
  GitCompare,
  HelpCircle,
  TrendingDown,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';
import { combinations, permutations } from '../utils/mathEngine';

export const MathematicsSection: React.FC = () => {
  // Interactive Gambler's Fallacy & Independent Coin Simulation
  const [streakCount, setStreakCount] = useState<number>(5);
  const [simResults, setSimResults] = useState<{ heads: number; tails: number; total: number }>({
    heads: 0,
    tails: 0,
    total: 0,
  });

  const runIndependentSimulation = (trials: number = 1000) => {
    let h = 0;
    let t = 0;
    for (let i = 0; i < trials; i++) {
      if (Math.random() < 0.5) h++;
      else t++;
    }
    setSimResults((prev) => ({
      heads: prev.heads + h,
      tails: prev.tails + t,
      total: prev.total + trials,
    }));
  };

  const resetSim = () => {
    setSimResults({ heads: 0, tails: 0, total: 0 });
  };

  return (
    <div id="section-mathematics" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Section 37 — Educational Mathematics & Probability Reference</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Formal Mathematical Foundations
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Rigorous reference guide to combinatorics, permutations, expected value, break-even probability, and independent random trials.
        </p>
      </div>

      {/* Grid of 6 Mathematical Topic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* A. Permutations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                A. Permutations P(n, r)
              </span>
              <Binary className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">Ordered Arrangements</h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 space-y-1">
              <div>P(n, r) = n! / (n - r)!</div>
              <div>P(4, 2) = 4! / 2! = (4 × 3 × 2 × 1) / (2 × 1) = <strong className="text-white">12</strong></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Order matters in permutations. The pair <strong className="text-white font-mono">23</strong> is distinct from <strong className="text-white font-mono">32</strong> because position 1 and position 2 are unique slots.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
            Rule: 23 ≠ 32 (2 distinct outcomes)
          </div>
        </div>

        {/* B. Combinations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                B. Combinations C(n, r)
              </span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-base font-bold text-white">Unordered Subsets</h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-sky-300 space-y-1">
              <div>C(n, r) = n! / [r! × (n - r)!]</div>
              <div>C(4, 2) = 4! / [2! × 2!] = 24 / 4 = <strong className="text-white">6</strong></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Combinations ignore order. The group <strong className="text-white font-mono">{'{2, 3}'}</strong> is identical to <strong className="text-white font-mono">{'{3, 2}'}</strong>. Thus, C(4,2) is exactly half of P(4,2).
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
            Relationship: P(n, r) = r! × C(n, r)
          </div>
        </div>

        {/* C. Expected Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                C. Expected Value (EV)
              </span>
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">Long-Run Mathematical Mean</h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 space-y-1">
              <div>EV = Σ (Probability_i × Outcome_i)</div>
              <div>EV = K × S × [(M / N) − 1]</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Expected value measures the weighted average outcome per trial over an infinite horizon. If payout multiplier M (e.g. 90) is less than sample space N (100), EV is mathematically negative.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
            When M &lt; N: House edge = (1 − M/N) × 100%
          </div>
        </div>

        {/* D. Break-Even Probability */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                D. Break-Even Probability
              </span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white">P_BE Threshold</h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 space-y-1">
              <div>P_BE = Total Stake / Gross Payout</div>
              <div>P_BE = (K × S) / (S × M) = <strong className="text-white">K / M</strong></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              For K=4 pairs with 90× multiplier, break-even probability is 4/90 = 4.44%. The bettor needs a success rate exceeding 4.44% to achieve positive financial expectation.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
            Example: K=4, M=90 → P_BE = 4.44%
          </div>
        </div>

        {/* E. Independent Trials */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                E. Independent Trials
              </span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white">Conditional Invariance</h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-purple-300 space-y-1">
              <div>P(A | B) = P(A)</div>
              <div>P(Draw = 23 | 23 appeared yesterday) = 1/100</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Two events A and B are statistically independent if the occurrence of B gives zero information about the probability of A. In fair random mechanisms, each drawing resets completely.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400">
            Memoryless property: Random devices have no memory.
          </div>
        </div>

        {/* F. Gambler's Fallacy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                F. Gambler's Fallacy
              </span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white">The "Due Number" Myth</h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-rose-300 space-y-1">
              <div>Fallacy: "It hasn't hit in 30 days, so it is due!"</div>
              <div className="text-slate-400">Reality: P(next) is still exactly 1/N.</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              The belief that past streaks create a balancing force in future independent events is a cognitive bias. The Law of Large Numbers works by dilution, not compensation.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-rose-400">
            Past frequency ≠ future probability
          </div>
        </div>

        {/* G. Previous Day Repeated Digit Method */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                G. Previous Day Repeated Digit Method (Discrete Algebraic Transformation)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Independent Assessment
              </span>
            </div>
            <h3 className="text-base font-bold text-white">12-Step Discrete Transformation Pipeline</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">1. Digit Splitting & Peak X</div>
                <div className="text-emerald-300">d = [tens, ones]</div>
                <div className="text-slate-400 text-[11px]">X = argmax freq(d &isin; {'{0..9}'})</div>
                <div className="text-amber-400 text-[10px]">Rule: freq &gt; 1 required</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">2. Boundary-Tested Triad & +5</div>
                <div className="text-emerald-300">Triad = [X-1, X, X+1] &cap; [0..9]</div>
                <div className="text-slate-300 text-[11px]">&forall; v &isin; Triad &rarr; [v+4, v+5, v+6]</div>
                <div className="text-slate-400 text-[10px]">Excluded = unique(ones-place)</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">3. Permutations of Remainder</div>
                <div className="text-emerald-300">Pool = {'{0..9}'} \ Excluded</div>
                <div className="text-slate-300 text-[11px]">Pairs = P(|Pool|, 2) = K &times; (K-1)</div>
                <div className="text-slate-400 text-[10px]">Ordered, leading zero preserved</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>Deterministic transformation with strict boundary handling</span>
            <span className="text-emerald-400 font-bold">Completely independent of date-based models</span>
          </div>
        </div>

        {/* H. Cross-Method Convergence & Hot Number Discovery */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-amber-400" />
                H. Cross-Method Convergence &amp; Hot Number Discovery (Combinatorial Overlap)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Synthesis Engine
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Dual-Method Intersection &amp; Symmetrical Synthesis</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">1. Exact Intersection (Hot Pairs)</div>
                <div className="text-amber-300">Hot = P_date &cap; P_prev</div>
                <div className="text-slate-400 text-[11px]">Exact pairs present in BOTH independent models</div>
                <div className="text-amber-400 text-[10px]">Highest confidence combinatorial agreement</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">2. Symmetrical Mirror Matches</div>
                <div className="text-indigo-300">Mirror = {'{ (AB, BA) | AB ∈ P_date, BA ∈ P_prev }'}</div>
                <div className="text-slate-300 text-[11px]">Palindromic cross-system parity</div>
                <div className="text-slate-400 text-[10px]">Identifies reversed positional convergence</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">3. Core Digits &amp; Dual Exclusions</div>
                <div className="text-emerald-300">Core = D_date &cap; D_prev</div>
                <div className="text-rose-400 text-[11px]">Dual Excluded = E_date &cap; E_prev</div>
                <div className="text-slate-400 text-[10px]">Sample space reduction ~80% - 94%</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>Calculates Jaccard similarity, shared active digits, and dual-filtered spaces</span>
            <span className="text-amber-400 font-bold">Comprehensive Multi-Model Convergence</span>
          </div>
        </div>

        {/* I. Actual Results + Arithmetic Pattern Analysis & Walk-Forward Validation Engine */}
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" />
                I. Actual Results + Arithmetic Pattern Analysis &amp; Walk-Forward Validation Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Multi-Perspective Synthesis
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Empirical Historical Modeling &amp; Zero-Lookahead Backtesting</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">1. Arithmetic Decompositions</div>
                <div className="text-emerald-300">Sum = T + O &bull; Diff = |T - O|</div>
                <div className="text-slate-400 text-[10px]">Reverse YX &bull; &plusmn;1 &bull; Digit Neighbours</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">2. Multi-Horizon Recency</div>
                <div className="text-sky-300">Windows: 5, 10, 20 draws</div>
                <div className="text-slate-400 text-[10px]">Tracks modal clusters &amp; digit parity</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">3. Anti-Double Counting</div>
                <div className="text-amber-300">Cap = 28 pts / family</div>
                <div className="text-slate-400 text-[10px]">Bonus: +20 pts for &ge;4 distinct families</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">4. Walk-Forward Backtesting</div>
                <div className="text-purple-300">Zero-Lookahead Rolling Run</div>
                <div className="text-slate-400 text-[10px]">Strict out-of-sample hit-rate audit</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ranks all 100 sample candidates into Tier 1 (Strong), Tier 2 (Moderate), and Tier 3 (Exploratory)</span>
            <span className="text-indigo-400 font-bold">Auditable Mathematical Ranking</span>
          </div>
        </div>

        {/* J. Beta Testing: 7-Layer Scoring, Markov Transitions & Calibrated EV */}
        <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-5 space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                J. Beta Testing: 7-Layer Scoring, Markov Digit Transitions, Hit Lift &amp; Calibrated EV
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Empirical Validation Engine
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Out-of-Sample Lift, Markov Chains, and Calibrated Probability Calibration</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">1. Hit Lift Ratio &amp; Wilson CI</div>
                <div className="text-purple-300">Lift = Hit Rate / Random Base (10%)</div>
                <div className="text-slate-400 text-[10px]">Excess Lift % &bull; 95% Wilson Confidence Bounds</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">2. Markov Digit Transitions</div>
                <div className="text-emerald-300">P(A_t+1 | A_t) &bull; P(B_t+1 | B_t)</div>
                <div className="text-slate-400 text-[10px]">Separates Stage 1 Digit &rarr; Stage 2 Pairs</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">3. Collinearity Penalty</div>
                <div className="text-amber-300">Reduces weight for +5 variants</div>
                <div className="text-slate-400 text-[10px]">Prunes zero-lift signals (e.g. cold gaps)</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400 font-sans font-semibold text-[11px]">4. Calibrated Expected Value</div>
                <div className="text-sky-300">EV = (P_win &times; Net_Profit) - (P_loss &times; Stake)</div>
                <div className="text-slate-400 text-[10px]">Maps score bins to empirical historical hit %</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>Evaluates 5-period temporal partition stability variance to prevent overfit anomalies</span>
            <span className="text-purple-400 font-bold">Empirical Forecasting Rigor</span>
          </div>
        </div>
      </div>

      {/* Interactive Probability Demonstration Lab */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Interactive Independent Trial Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Test independent fair trials (50/50 probability) in real-time to observe the Law of Large Numbers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => runIndependentSimulation(100)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
            >
              +100 Trials
            </button>
            <button
              type="button"
              onClick={() => runIndependentSimulation(1000)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm"
            >
              +1,000 Trials
            </button>
            <button
              type="button"
              onClick={resetSim}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
              title="Reset simulator"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase">Total Trials Executed</div>
            <div className="text-2xl font-bold text-white mt-0.5">{simResults.total}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase">Outcome A Count (Heads)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
              {simResults.heads}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({simResults.total > 0 ? ((simResults.heads / simResults.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase">Outcome B Count (Tails)</div>
            <div className="text-2xl font-bold text-sky-400 mt-0.5">
              {simResults.tails}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({simResults.total > 0 ? ((simResults.tails / simResults.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
