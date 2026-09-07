import React from 'react';
import {
  Calendar,
  Sparkles,
  Info,
  Check,
  RotateCcw,
  Binary,
  Hash,
  Filter,
} from 'lucide-react';
import { GeneratedResult } from '../types';
import { formatDateISO } from '../utils/mathEngine';

interface DateGeneratorSectionProps {
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  onSetToday?: () => void;
  result?: GeneratedResult;
  generatedData?: GeneratedResult;
}

export const DateGeneratorSection: React.FC<DateGeneratorSectionProps> = ({
  selectedDate,
  onDateChange,
  onSetToday,
  result,
  generatedData,
}) => {
  const data = result || generatedData!;

  const handleSetToday = () => {
    if (onSetToday) {
      onSetToday();
    } else {
      const todayISO = formatDateISO(new Date());
      onDateChange(todayISO);
    }
  };

  return (
    <div id="section-date-generator" className="space-y-4">
      {/* Bento Row 1: Selected Date & Engine Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento Cell 1: Selected Date (col-span-4) */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-emerald-500" />
              <span>Selected Date</span>
            </span>
            <button
              id="btn-date-picker-today"
              type="button"
              onClick={handleSetToday}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono font-bold flex items-center gap-1 transition"
            >
              <RotateCcw className="w-2.5 h-2.5 text-emerald-400" />
              <span>TODAY</span>
            </button>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-light text-slate-100 leading-tight">
              {data.formattedDate.split(' ').slice(0, 2).join(' ')}
              <br />
              <span className="font-bold text-emerald-500">{data.formattedDate.split(' ').slice(2).join(' ') || '2026'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500">Day:</span> <span className="text-emerald-400 font-bold">{data.dayOfMonth}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500">X = {data.dayOfMonth} % 10:</span> <span className="text-emerald-400 font-bold">{data.x}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-800/60">
            <input
              id="native-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 transition"
              aria-label="Select target date for calculation"
            />
          </div>
        </div>

        {/* Bento Cell 2: Deterministic Transformation Engine (col-span-8) */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Binary className="w-3 h-3 text-emerald-500" />
              <span>Deterministic Transformation Engine</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Modulo 10 Ring Arithmetic
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            {/* 1: Base Triad */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1 font-bold tracking-wider">Base Triad</div>
                <div className="font-mono text-xl text-emerald-400 flex justify-center gap-2 font-bold my-1">
                  {data.baseTriad.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-slate-600 font-mono">(X-1, X, X+1)</div>
            </div>

            {/* 2: +5 Modulo */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1 font-bold tracking-wider">+5 Modulo</div>
                <div className="font-mono text-xl text-amber-500 flex justify-center gap-2 font-bold my-1">
                  {data.transformedTriad.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-slate-600 font-mono">(n + 5) % 10</div>
            </div>

            {/* 3: Excluded Digits */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1 font-bold tracking-wider">Excluded Digits</div>
                <div className="font-mono text-base text-slate-500 flex justify-center gap-1.5 my-1 line-through">
                  {data.excludedDigits.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-slate-600 font-mono">6 Digits Filtered</div>
            </div>

            {/* 4: Active Pool */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center flex flex-col justify-between">
              <div>
                <div className="text-[9px] text-emerald-400 uppercase mb-1 font-bold tracking-wider">Active Pool</div>
                <div className="font-mono text-xl text-emerald-300 flex justify-center gap-2 font-bold my-1">
                  {data.activeDigits.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-emerald-400/80 font-semibold underline decoration-emerald-500/40">4 Digits Active</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Universal Set: [0..9] \ [{data.excludedDigits.join(',')}]</span>
            <span className="text-emerald-400 font-bold">P(4, 2) = 12 Permutations</span>
          </div>
        </div>
      </div>

      {/* Bento Row 2: Mathematical Step-by-Step Breakdown Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Modulo 10 Details */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Step 1 &bull; Modulo Extraction
              </span>
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200">Extract Ones-Place Digit</div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>Day = {data.dayOfMonth}</div>
              <div className="text-emerald-400 font-bold">X = {data.dayOfMonth} % 10 = {data.x}</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 font-mono">
            Cycle Range: X &isin; &#123;0, 1, 2, ..., 9&#125;
          </div>
        </div>

        {/* Cyclic Triad Wrapping */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Step 2 &bull; Cyclic Neighborhood
              </span>
              <Binary className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200">Base Triad [X-1, X, X+1]</div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>({data.x}-1+10)%10 &rarr; <span className="text-emerald-400 font-bold">{data.baseTriad[0]}</span></div>
              <div>X &rarr; <span className="text-emerald-400 font-bold">{data.baseTriad[1]}</span></div>
              <div>({data.x}+1)%10 &rarr; <span className="text-emerald-400 font-bold">{data.baseTriad[2]}</span></div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 font-mono">
            Cyclic wrapping: 0 &rarr; [9,0,1], 9 &rarr; [8,9,0]
          </div>
        </div>

        {/* Polar Shift and Filtering */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Step 3 &bull; +5 Shift & Exclusion
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200">Transformed + Filter</div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>Shift: [{data.transformedTriad.join(', ')}]</div>
              <div>Excluded (6): [{data.excludedDigits.join(', ')}]</div>
              <div className="text-emerald-400 font-bold">Active: [{data.activeDigits.join(', ')}]</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 font-mono">
            Remaining Set: 10 - 6 = 4 unique digits
          </div>
        </div>
      </div>
    </div>
  );
};
