import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react';

interface SafetyBannerProps {
  compact?: boolean;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div id="safety-educational-banner" className="space-y-2">
      {/* Top micro banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-lg text-[10px] text-amber-400 text-center uppercase tracking-widest font-bold flex items-center justify-between gap-2">
        <div className="flex-1 text-center truncate sm:text-clip">
          Educational Mathematics Simulator: No Predictive Power. Past frequency ≠ future probability.
        </div>
        <button
          id="toggle-safety-math-principles"
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-[9px] font-semibold text-slate-300 border border-slate-700 transition"
          aria-expanded={isExpanded}
        >
          <BookOpen className="w-3 h-3 text-emerald-400" />
          <span>{isExpanded ? 'Hide Notice' : 'Core Probability Principles'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {isExpanded && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fadeIn">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Deterministic vs. Probabilistic</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                The date algorithm uses modulo arithmetic and cyclical transformations to generate 12 ordered pairs.
                This process is 100% deterministic (rules-based) and does NOT endow those numbers with any statistical advantage in independent random drawings.
              </p>
            </div>
            <div className="text-[9px] text-slate-600 font-mono mt-2 pt-1.5 border-t border-slate-900">
              Rule: P(Permutation | Draw) = 1/100
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Independent Trials: P(A | B) = P(A)</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In an independent random process (such as a 1-in-100 two-digit draw), each trial resets completely. Past frequency does NOT influence future probability.
              </p>
            </div>
            <div className="text-[9px] text-slate-600 font-mono mt-2 pt-1.5 border-t border-slate-900">
              Rule: Gambler&apos;s Fallacy refuted
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Financial Exposure & EV</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Selecting more pairs linearly increases total capital exposure (Total Stake = K × S). High nominal multiplier (M) does not imply positive Expected Value when M &lt; N.
              </p>
            </div>
            <div className="text-[9px] text-amber-500/80 font-mono mt-2 pt-1.5 border-t border-slate-900">
              Rule: EV = K × S × ((M/N) - 1)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

