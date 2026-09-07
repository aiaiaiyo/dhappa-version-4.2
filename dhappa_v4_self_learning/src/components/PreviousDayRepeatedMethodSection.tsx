import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Check,
  Copy,
  Download,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  Grid,
  Send,
  HelpCircle,
  Hash,
  ListOrdered,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DayMarketEntry, PreviousDayRepeatedAssessment } from '../types';
import {
  computePreviousDayRepeatedDigitMethod,
  formatDateISO,
  formatDateBanner,
  getTodayDateISO,
  getPreviousDateISO,
  getOutcomesForDate,
} from '../utils/mathEngine';
import { Calendar } from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface PreviousDayRepeatedMethodSectionProps {
  records: DayMarketEntry[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const PreviousDayRepeatedMethodSection: React.FC<PreviousDayRepeatedMethodSectionProps> = ({
  records,
  onSendPairsToSimulator,
}) => {
  // Compute default previous date (current date - 1 day, e.g. 2026-08-15)
  const defaultPreviousDate = useMemo(() => getPreviousDateISO(), []);

  // Sorted records by date descending
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  // Mode: Default to recorded archive when records exist
  const [inputMode, setInputMode] = useState<'recorded' | 'custom'>('recorded');
  const [customPrevDate, setCustomPrevDate] = useState<string>(defaultPreviousDate);
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>(() => {
    const prevDate = getPreviousDateISO();
    const match = records.find((r) => r.date === prevDate);
    if (match) return match.date;
    return records.length > 0 ? records[0].date : prevDate;
  });

  const [customOutcomesText, setCustomOutcomesText] = useState<string>(() => {
    const prevDate = getPreviousDateISO();
    const initial = getOutcomesForDate(records, prevDate);
    return initial.length > 0 ? initial.join(', ') : '49, 58, 71, 40';
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number>(0);

  // Synchronize default dates when records are loaded or updated
  React.useEffect(() => {
    if (records.length > 0) {
      const prevDate = getPreviousDateISO();
      const match = records.find((r) => r.date === prevDate);
      if (match) {
        setSelectedRecordDate(match.date);
        setCustomPrevDate(match.date);
        const outcomes = getOutcomesForDate(records, match.date);
        if (outcomes.length > 0) {
          setCustomOutcomesText(outcomes.join(', '));
        }
      }
    }
  }, [records]);

  // Sync customOutcomesText when user changes custom date or recorded date
  const handleCustomDateChange = (newDate: string) => {
    setCustomPrevDate(newDate);
    const outcomes = getOutcomesForDate(records, newDate);
    if (outcomes.length > 0) {
      setCustomOutcomesText(outcomes.join(', '));
    }
  };

  const handleRecordDateChange = (newDate: string) => {
    setSelectedRecordDate(newDate);
    setCustomPrevDate(newDate);
    const outcomes = getOutcomesForDate(records, newDate);
    if (outcomes.length > 0) {
      setCustomOutcomesText(outcomes.join(', '));
    }
  };

  // Selected record data
  const selectedRecord = useMemo(() => {
    return sortedRecords.find((r) => r.date === selectedRecordDate) || sortedRecords[0];
  }, [sortedRecords, selectedRecordDate]);

  // Compute assessment
  const assessment: PreviousDayRepeatedAssessment = useMemo(() => {
    if (inputMode === 'recorded' && selectedRecord) {
      const outcomes = [
        selectedRecord.deshawar,
        selectedRecord.faridabad,
        selectedRecord.gali,
        selectedRecord.ghaziabad,
      ]
        .map((v) => (v || '').trim())
        .filter((v) => /^\d{2}$/.test(v));

      return computePreviousDayRepeatedDigitMethod(
        outcomes,
        selectedRecord.date,
        'auto-recorded'
      );
    } else {
      return computePreviousDayRepeatedDigitMethod(
        customOutcomesText,
        customPrevDate || defaultPreviousDate,
        'custom-input'
      );
    }
  }, [inputMode, selectedRecord, customOutcomesText, customPrevDate, defaultPreviousDate]);

  // Standardized Engine Result for Consensus Layer
  const standardizedPrevDayResult = useMemo(() => {
    const topBranch = assessment.branches[0];
    const candidates = topBranch?.finalPairs.map((p) => p) || assessment.outcomes || [];
    const topScore = topBranch?.frequency || 0;
    const evidence = (topBranch?.finalPairs || []).slice(0, 5).map((p) => `repeat-${p}`);

    return buildStandardizedEngineResult({
      engineId: 'PREV_DAY_REPEATED',
      methodName: 'Previous Day Repeated Method',
      date: selectedRecord?.date || customPrevDate,
      channel: 'live-engine-output',
      sourceValues: { prevOutcomes: selectedRecord ? [selectedRecord.deshawar, selectedRecord.faridabad, selectedRecord.gali, selectedRecord.ghaziabad] : [] },
      normalizedValues: { pairsCount: candidates.length },
      rawResult: assessment as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: 0,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractRepeatedDigits()', 'generatePairs()', 'rankByFrequency()', 'score()'],
    });
  }, [assessment, selectedRecord, customPrevDate]);

  // Quick Preset Handlers
  const handlePreset = (preset: 'benchmark' | 'boundary0' | 'boundary9' | 'tie' | 'norepeat') => {
    setInputMode('custom');
    if (preset === 'benchmark') {
      setCustomOutcomesText('12, 49, 38, 71');
    } else if (preset === 'boundary0') {
      setCustomOutcomesText('00, 12, 34, 56');
    } else if (preset === 'boundary9') {
      setCustomOutcomesText('99, 88, 76, 45');
    } else if (preset === 'tie') {
      setCustomOutcomesText('12, 21, 48, 79');
    } else if (preset === 'norepeat') {
      setCustomOutcomesText('12, 34, 56, 78, 90');
    }
    setActiveBranchIndex(0);
  };

  const handleCopyPairs = (pairs: string[]) => {
    navigator.clipboard.writeText(pairs.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(assessment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `previous-day-repeated-method-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentBranch = assessment.branches[activeBranchIndex] || assessment.branches[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Method Independence Declaration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SEPARATE RESULT METHOD
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60">
                Deterministic 12-Step Assessment
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Previous Day Repeated Digit Method
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Analyzes <strong className="text-slate-200">only the previous day’s actual outcomes</strong> to identify single-digit frequency peaks, generates boundary-tested triads (<code className="text-emerald-400 font-mono">X-1, X, X+1</code>), applies the <code className="text-emerald-400 font-mono">+5</code> offset transformation, and outputs an isolated, unblended set of paired outcomes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        {/* Input Mode Selector & Controls */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputMode === 'custom'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual / Custom Input
            </button>
            <button
              type="button"
              onClick={() => setInputMode('recorded')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputMode === 'recorded'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recorded Daily Archive ({records.length})
            </button>
          </div>

          {/* Preset Buttons for Instant Verification */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handlePreset('benchmark')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
              title="Standard Example: 12, 49, 38, 71"
            >
              Spec Demo (12,49,38,71)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('boundary0')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
              title="Boundary test X=0: 00, 12, 34, 56"
            >
              X=0 (-1 discard)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('boundary9')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
              title="Boundary test X=9: 99, 88, 76, 45"
            >
              X=9 (10 discard)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('tie')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
              title="Tied X values: 12, 21, 48, 79"
            >
              Tie Rule (X=1,2)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('norepeat')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition cursor-pointer"
              title="No repeated digit: 12, 34, 56, 78, 90"
            >
              No-Repeat Test
            </button>
          </div>
        </div>

        {/* Input Form Area */}
        <div className="mt-4 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
          {inputMode === 'custom' ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Previous Date Reference:</span>
                  <input
                    type="date"
                    value={customPrevDate}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    ({formatDateBanner(customPrevDate)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCustomDateChange(getPreviousDateISO())}
                  className="self-start sm:self-auto text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Reset to Yesterday (Current Date - 1 Day)"
                >
                  <RefreshCw className="w-2.5 h-2.5 text-emerald-400" />
                  <span>RESET TO YESTERDAY ({getPreviousDateISO()})</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Previous Day Actual Two-Digit Outcomes (comma or space separated):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customOutcomesText}
                    onChange={(e) => setCustomOutcomesText(e.target.value)}
                    placeholder="e.g. 49, 58, 71, 40"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Detected Outcomes:</span>
                    <span className="font-mono text-slate-200 font-bold bg-slate-800 px-2 py-1 rounded">
                      {assessment.outcomes.length} numbers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Selected Date Record:</span>
                  <input
                    type="date"
                    value={selectedRecordDate}
                    onChange={(e) => handleRecordDateChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    ({formatDateBanner(selectedRecordDate)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const prevDate = getPreviousDateISO();
                    handleRecordDateChange(prevDate);
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5 text-emerald-400" />
                  <span>YESTERDAY ({getPreviousDateISO()})</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Recorded Date from Daily Archive:
                  </label>
                  <select
                    value={selectedRecordDate}
                    onChange={(e) => handleRecordDateChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {sortedRecords.map((r) => (
                      <option key={r.date} value={r.date}>
                        {r.date} {r.date === getPreviousDateISO() ? '(Yesterday / Prev Day) ' : ''}&bull; DS: {r.deshawar || '--'} | FB: {r.faridabad || '--'} | GL: {r.gali || '--'} | GZ: {r.ghaziabad || '--'} {r.notes ? `(${r.notes})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium">Record Draw Outcomes:</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
                    {assessment.outcomes.length > 0 ? (
                      assessment.outcomes.map((num, i) => (
                        <span key={i} className="bg-slate-800/80 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                          {num}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 font-normal">No complete 2-digit outcomes</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No-Repeat Condition Notice if triggered */}
      {assessment.isNoResult ? (
        <div className="bg-amber-950/30 border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400">
              No Repeated Digit Found
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-lg mx-auto">
              Every individual digit from the previous day's outcomes occurs only once (frequency &le; 1). Per specification rules, no arbitrary X is selected and no speculative pairs are generated.
            </p>
          </div>
          <div className="inline-block bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 font-mono text-sm">
            <span className="text-slate-400">Previous Day Repeated Digit Method: </span>
            <span className="text-amber-400 font-bold tracking-wider">NO RESULT</span>
          </div>

          {/* Show the breakdown and frequency table anyway for full auditability */}
          <div className="pt-4 border-t border-slate-800/80 max-w-2xl mx-auto text-left">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Auditable Digit Frequency Verification:
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const count = assessment.frequencyTable[digit] || 0;
                return (
                  <div
                    key={digit}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-xs"
                  >
                    <div className="text-slate-500 text-[10px]">Digit {digit}</div>
                    <div className="text-slate-300 font-bold mt-0.5">{count}×</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Complete Required Result Display (10 Sections) */
        <div className="space-y-6">
          {/* Top Multi-Branch Selector if Tie Rule active */}
          {assessment.isTie && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Info className="w-4 h-4 shrink-0" />
                <span>Tie Rule Activated: Multiple digits tied for highest frequency ({assessment.maxFrequency}×). Each X is evaluated independently:</span>
              </div>
              <div className="flex items-center gap-2">
                {assessment.branches.map((branch, idx) => (
                  <button
                    key={branch.x}
                    type="button"
                    onClick={() => setActiveBranchIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                      activeBranchIndex === idx
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    Evaluate X = {branch.x}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1 & 2: Previous Day Outcomes & Digit Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Previous Day Outcomes */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
                  Previous Day Outcomes
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {assessment.outcomes.length} numbers
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {assessment.outcomes.map((outcome, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-base font-mono font-bold text-emerald-400 shadow-sm"
                  >
                    {outcome}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Digit Breakdown */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                  Digit Breakdown (Tens & Ones)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {assessment.combinedDigitPool.length} single digits
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {assessment.digitBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-1.5"
                  >
                    <span className="text-emerald-400 font-bold">{item.outcome}</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="text-slate-100">{item.tens}, {item.ones}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Digit Frequency Table (0-9) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
                Single-Digit Frequency Table (0–9)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Peak Frequency: <strong className="text-emerald-400">{assessment.maxFrequency}×</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 pt-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const count = assessment.frequencyTable[digit] || 0;
                const isMax = count === assessment.maxFrequency && count > 1;
                return (
                  <div
                    key={digit}
                    className={`p-2.5 rounded-xl border font-mono transition text-center ${
                      isMax
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                        : count > 0
                        ? 'bg-slate-950 border-slate-700/80 text-slate-200'
                        : 'bg-slate-950/50 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold flex items-center justify-center gap-1">
                      <span>Digit {digit}</span>
                      {isMax && <span className="text-amber-400 font-bold">&starf;</span>}
                    </div>
                    <div className="text-lg font-bold mt-0.5">{count}</div>
                    <div className="text-[9px] text-slate-500">times</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4, 5 & 6: Most Repeated Digit, Triad & Transformation */}
          {currentBranch && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 4. Most Repeated Digit */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
                    Most Repeated Digit (X)
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-mono font-bold text-emerald-400">
                        X = {currentBranch.x}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Occurrences: {currentBranch.frequency} times
                      </div>
                    </div>
                    {assessment.isTie && (
                      <span className="px-2 py-1 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Tied Candidate
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. X-1 / X / X+1 Generation */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">5</span>
                    X-1 / X / X+1 (Boundary Rule)
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-slate-400">Valid Digits:</span>
                      <span className="text-emerald-400 font-bold">
                        [{currentBranch.validTriad.join(', ')}]
                      </span>
                    </div>
                    {currentBranch.discardedTriad.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Discarded out-of-bounds: [{currentBranch.discardedTriad.join(', ')}]</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-mono">
                        All triad members within [0..9]
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. +5 Transformation Overview */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">6</span>
                    +5 Transformation Rule
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1 text-xs font-mono">
                    <div className="text-slate-400">Formula: <code className="text-slate-200">v+4, v+5, v+6</code></div>
                    <div className="text-emerald-400 font-semibold text-[11px]">
                      {currentBranch.plus5Transformations.map((t) => (
                        <div key={t.baseVal}>
                          {t.baseVal} &rarr; [{t.transformedValues.join(', ')}]
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7 & 8: Ones-Place Digits, Excluded Digits & Remaining Digits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 7. Ones-Place & Unique Excluded Digits */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">7</span>
                      Ones-Place Digits & Excluded Pool
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Raw Ones-Place Digits:</div>
                      <div className="text-slate-300 mt-0.5">
                        {currentBranch.rawOnesPlaceDigits.join(', ')}
                      </div>
                    </div>

                    <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-lg text-xs font-mono flex items-center justify-between">
                      <div>
                        <div className="text-rose-400 text-[10px] uppercase font-bold">Unique Excluded Digits:</div>
                        <div className="text-rose-300 font-bold text-sm mt-0.5">
                          [{currentBranch.uniqueExcludedDigits.join(', ')}]
                        </div>
                      </div>
                      <span className="text-[11px] text-rose-400/80">
                        {currentBranch.uniqueExcludedDigits.length} digits removed
                      </span>
                    </div>
                  </div>
                </div>

                {/* 8. Remaining Pairing Digits */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-mono font-bold">8</span>
                      Remaining Pairing Digits Pool
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {currentBranch.remainingDigits.length} Active Digits
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                        const isExcluded = currentBranch.uniqueExcludedDigits.includes(digit);
                        return (
                          <div
                            key={digit}
                            className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                              isExcluded
                                ? 'bg-rose-950/40 text-rose-500 border border-rose-900 line-through opacity-60'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                            }`}
                          >
                            {digit}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs font-mono text-slate-300 pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span>Active Digits:</span>
                      <strong className="text-emerald-400 font-bold">
                        [{currentBranch.remainingDigits.join(', ')}]
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 9: Final Pairs Display */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">9</span>
                      <h2 className="text-lg font-bold text-slate-100">
                        Final Generated Two-Digit Pairs (P({currentBranch.remainingDigits.length}, 2))
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deterministic ordered pairs preserving leading zeros. Completely independent assessment.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPairs(currentBranch.finalPairs)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy All Pairs'}</span>
                    </button>
                    {onSendPairsToSimulator && (
                      <button
                        type="button"
                        onClick={() => onSendPairsToSimulator(currentBranch.finalPairs)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Simulate Exposure</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Pairs Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2.5 pt-2">
                  {currentBranch.finalPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 text-center font-mono transition shadow-sm group cursor-default"
                    >
                      <div className="text-base font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                        {pair}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Audit Verification Summary Box */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 space-y-1.5">
                  <div className="text-slate-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Audited Output Summary:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">Most Repeated X: </span>
                      <strong className="text-slate-200">{currentBranch.x} ({currentBranch.frequency}×)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Excluded Digits: </span>
                      <strong className="text-rose-400">[{currentBranch.uniqueExcludedDigits.join(',')}]</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Remaining Digits: </span>
                      <strong className="text-emerald-400">[{currentBranch.remainingDigits.join(',')}]</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Generated Pairs: </span>
                      <strong className="text-emerald-400">{currentBranch.finalPairs.length} pairs</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
