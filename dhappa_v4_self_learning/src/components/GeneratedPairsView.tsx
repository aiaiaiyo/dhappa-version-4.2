import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  CheckSquare,
  Square,
  Shuffle,
  Grid,
  List,
  LayoutGrid,
  Send,
  Info,
} from 'lucide-react';
import { GeneratedResult, DisplayMode } from '../types';

interface GeneratedPairsViewProps {
  result?: GeneratedResult;
  generatedData?: GeneratedResult;
  selectedPairs?: string[];
  displayMode?: DisplayMode;
  setDisplayMode?: (mode: DisplayMode) => void;
  onTogglePair?: (pair: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  onInvertSelection?: () => void;
  onSendToSimulator?: () => void;
  onSimulatePairs?: (pairs: string[]) => void;
}

export const GeneratedPairsView: React.FC<GeneratedPairsViewProps> = ({
  result,
  generatedData,
  selectedPairs: controlledSelectedPairs,
  displayMode: controlledDisplayMode,
  setDisplayMode: controlledSetDisplayMode,
  onTogglePair,
  onSelectAll,
  onClearAll,
  onInvertSelection,
  onSendToSimulator,
  onSimulatePairs,
}) => {
  const data = result || generatedData!;
  
  // Local selection state if not controlled externally
  const [internalSelected, setInternalSelected] = useState<string[]>(['23', '32', '73', '87']);
  const [internalDisplayMode, setInternalDisplayMode] = useState<DisplayMode>('tiles');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const selectedPairs = controlledSelectedPairs !== undefined ? controlledSelectedPairs : internalSelected;
  const currentDisplayMode = controlledDisplayMode !== undefined ? controlledDisplayMode : internalDisplayMode;

  const handleTogglePair = (pair: string) => {
    if (onTogglePair) {
      onTogglePair(pair);
    } else {
      setInternalSelected((prev) =>
        prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]
      );
    }
  };

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      setInternalSelected([...data.pairs]);
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setInternalSelected([]);
    }
  };

  const handleInvert = () => {
    if (onInvertSelection) {
      onInvertSelection();
    } else {
      setInternalSelected((prev) => data.pairs.filter((p) => !prev.includes(p)));
    }
  };

  const setViewMode = (mode: DisplayMode) => {
    if (controlledSetDisplayMode) {
      controlledSetDisplayMode(mode);
    } else {
      setInternalDisplayMode(mode);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExportTxt = () => {
    const content = `Date Pair Generator & Risk-Reward Simulator
Date: ${data.formattedDate} (${data.date})
Day of Month: ${data.dayOfMonth}
X (day % 10): ${data.x}
Cyclic Base Triad: [${data.baseTriad.join(', ')}]
Transformed (+5): [${data.transformedTriad.join(', ')}]
Excluded Digits (6): [${data.excludedDigits.join(', ')}]
Active Digits (4): [${data.activeDigits.join(', ')}]
Generated Pairs (12): ${data.pairs.join(', ')}
Selected Pairs (${selectedPairs.length}): ${selectedPairs.join(', ') || 'None'}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `date-pairs-${data.date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = 'Pair,FirstDigit,SecondDigit,Selected,Date\n';
    const rows = data.pairs
      .map((p) => {
        const isSelected = selectedPairs.includes(p) ? 'YES' : 'NO';
        return `${p},${p[0]},${p[1]},${isSelected},${data.date}`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `date-pairs-${data.date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendSim = () => {
    if (onSimulatePairs) {
      onSimulatePairs(selectedPairs.length > 0 ? selectedPairs : data.pairs);
    } else if (onSendToSimulator) {
      onSendToSimulator();
    }
  };

  // Group pairs by first digit for Matrix View
  const matrixGrouped = data.activeDigits.map((firstDigit) => ({
    firstDigit,
    pairs: data.pairs.filter((p) => p.startsWith(String(firstDigit))),
  }));

  return (
    <div id="section-generated-pairs" className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Header & Bento View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Generated Ordered Pairs P(4,2) = 12
          </span>
          <div className="flex items-center gap-1.5">
            <button
              id="btn-copy-all-pairs"
              type="button"
              onClick={() => handleCopy(data.pairs.join(', '), 'all')}
              className="text-[9px] border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-slate-300 transition flex items-center gap-1"
            >
              {copiedText === 'all' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
              <span>{copiedText === 'all' ? 'Copied' : 'Copy All'}</span>
            </button>
            <button
              id="btn-export-csv-pairs"
              type="button"
              onClick={handleExportCsv}
              className="text-[9px] border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-slate-300 transition flex items-center gap-1"
            >
              <Download className="w-2.5 h-2.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <button
              id="btn-export-txt-pairs"
              type="button"
              onClick={handleExportTxt}
              className="text-[9px] border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-slate-300 transition hidden md:flex items-center gap-1"
            >
              <Download className="w-2.5 h-2.5 text-slate-400" />
              <span>TXT</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-[10px] font-bold text-emerald-500 font-mono tracking-wider">
            SELECTED: {selectedPairs.length} / 12
          </div>

          {/* View mode switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              id="view-mode-tiles"
              type="button"
              onClick={() => setViewMode('tiles')}
              className={`p-1.5 rounded transition ${
                currentDisplayMode === 'tiles' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Big Tiles"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-matrix"
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded transition ${
                currentDisplayMode === 'matrix' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Matrix by First Digit"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-compact"
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded transition ${
                currentDisplayMode === 'compact' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Selection Actions Sub-toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            id="btn-select-all-pairs"
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
          >
            <CheckSquare className="w-3 h-3 text-emerald-400" />
            <span>Select All</span>
          </button>
          <button
            id="btn-clear-all-pairs"
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
          >
            <Square className="w-3 h-3 text-slate-500" />
            <span>Clear</span>
          </button>
          <button
            id="btn-invert-selection-pairs"
            type="button"
            onClick={handleInvert}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
          >
            <Shuffle className="w-3 h-3 text-amber-400" />
            <span>Invert</span>
          </button>
        </div>

        <button
          id="btn-send-pairs-to-simulator"
          type="button"
          onClick={handleSendSim}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Simulate Selected ({selectedPairs.length})</span>
        </button>
      </div>

      {/* Bento View A: Big Tiles (6 columns on desktop) */}
      {(currentDisplayMode === 'tiles' || currentDisplayMode === undefined) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.pairs.map((pair, idx) => {
            const isSelected = selectedPairs.includes(pair);
            return (
              <div
                key={`${pair}-${idx}`}
                id={`pair-tile-${pair}-${idx}`}
                onClick={() => handleTogglePair(pair)}
                className={`group relative p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-slate-900/70 border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-900/30 border border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                {/* Status Dot / Indicator */}
                {isSelected ? (
                  <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                ) : (
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-slate-700 group-hover:border-slate-500" />
                )}

                <span
                  className={`text-3xl sm:text-4xl font-mono font-bold tracking-wider transition-transform duration-200 group-hover:scale-105 ${
                    isSelected ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {pair}
                </span>

                <span
                  className={`text-[8px] font-bold mt-1 uppercase tracking-wider ${
                    isSelected ? 'text-emerald-500' : 'text-slate-600'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Unselected'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bento View B: Matrix Grouped by First Digit */}
      {currentDisplayMode === 'matrix' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {matrixGrouped.map((group) => (
            <div
              key={group.firstDigit}
              className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Lead Digit
                </span>
                <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                  {group.firstDigit}
                </span>
              </div>

              <div className="space-y-1.5">
                {group.pairs.map((p, pIdx) => {
                  const isSelected = selectedPairs.includes(p);
                  return (
                    <button
                      key={`${p}-${pIdx}`}
                      id={`pair-matrix-btn-${p}-${pIdx}`}
                      type="button"
                      onClick={() => handleTogglePair(p)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border font-mono text-xs transition ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm font-bold">{p}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({p[0]} &rarr; {p[1]})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bento View C: Compact Comma-Separated List */}
      {currentDisplayMode === 'compact' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-emerald-400 text-sm leading-relaxed tracking-widest flex items-center justify-between">
            <span>{data.pairs.join(', ')}</span>
            <button
              type="button"
              onClick={() => handleCopy(data.pairs.join(', '), 'compact')}
              className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-sans"
            >
              {copiedText === 'compact' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedText === 'compact' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            {data.pairs.map((p, idx) => {
              const isSelected = selectedPairs.includes(p);
              return (
                <button
                  key={`${p}-${idx}`}
                  type="button"
                  onClick={() => handleTogglePair(p)}
                  className={`p-2 rounded-lg border font-mono text-xs text-center transition ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bento Bottom Metrics & Properties Bar */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-800/80 pt-3 gap-2">
        <div className="flex items-center gap-4 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-emerald-500" />
            <span>23 &ne; 32 (Ordered)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-emerald-500" />
            <span>No repeats (22, 33...)</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 italic font-mono">
          *Theoretical Probability: P(at least one) = K / N = {selectedPairs.length} / 100 = {((selectedPairs.length / 100) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
