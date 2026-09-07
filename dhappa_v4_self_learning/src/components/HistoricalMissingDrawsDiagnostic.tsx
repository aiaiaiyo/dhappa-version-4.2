import React, { useState, useMemo, useRef } from 'react';
import { DayMarketEntry, Currency, Market } from '../types';
import {
  analyzeHistoricalMissingDraws,
  MissingMarketDrawDetail,
  HistoricalMissingDrawsReport,
  DrawCompletenessStatus,
} from '../utils/historicalMissingDrawsEngine';
import { formatDateBanner } from '../utils/mathEngine';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Check,
  Flame,
  BarChart3,
  Edit3,
  Save,
  HelpCircle,
} from 'lucide-react';

interface HistoricalMissingDrawsDiagnosticProps {
  records: DayMarketEntry[];
  currency?: Currency;
  onAddRecord?: (entry: Omit<DayMarketEntry, 'id' | 'createdAt'>) => void | Promise<void>;
  onUpdateRecord?: (entry: DayMarketEntry) => void | Promise<void>;
  onSelectDateForAnalysis?: (dateISO: string) => void;
}

export const HistoricalMissingDrawsDiagnostic: React.FC<HistoricalMissingDrawsDiagnosticProps> = ({
  records,
  currency = 'USD',
  onAddRecord,
  onUpdateRecord,
  onSelectDateForAnalysis,
}) => {
  // Configurable lookback window: 3 months (default), 1 month, 2 months, 6 months
  const [lookbackMonths, setLookbackMonths] = useState<number>(3);
  const [statusFilter, setStatusFilter] = useState<'ALL_GAPS' | 'MISSING_ONLY' | 'INCOMPLETE_ONLY' | 'ALL_DAYS' | 'COMPLETE_ONLY'>('ALL_GAPS');
  const [searchDateQuery, setSearchDateQuery] = useState<string>('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  // Inline Quick-Add Draft State per Date
  const [draftInputs, setDraftInputs] = useState<Record<string, { deshawar: string; faridabad: string; ghaziabad: string; gali: string }>>({});
  const [savedSuccessDates, setSavedSuccessDates] = useState<Record<string, boolean>>({});
  const [savingDates, setSavingDates] = useState<Record<string, boolean>>({});

  // Batch Quick Add Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchRawText, setBatchRawText] = useState<string>('');
  const [batchError, setBatchError] = useState<string | null>(null);

  // Active selected detail for focused inspect
  const [focusedDateISO, setFocusedDateISO] = useState<string | null>(null);

  // Analyze 3-month timeline vs records
  const report: HistoricalMissingDrawsReport = useMemo(() => {
    return analyzeHistoricalMissingDraws(records, { lookbackMonths });
  }, [records, lookbackMonths]);

  // Filtered date details
  const filteredDetails = useMemo(() => {
    return report.allDateDetails.filter((item) => {
      // Month filter
      if (selectedMonthFilter !== 'ALL') {
        const itemMonthKey = item.date.slice(0, 7);
        if (itemMonthKey !== selectedMonthFilter) return false;
      }

      // Search filter
      if (searchDateQuery.trim()) {
        const query = searchDateQuery.trim().toLowerCase();
        const dateMatch = item.date.includes(query);
        const dayMatch = item.dayOfWeek.toLowerCase().includes(query);
        const monthMatch = item.monthLabel.toLowerCase().includes(query);
        if (!dateMatch && !dayMatch && !monthMatch) return false;
      }

      // Status filter
      if (statusFilter === 'ALL_GAPS') {
        return item.status !== 'COMPLETE';
      }
      if (statusFilter === 'MISSING_ONLY') {
        return item.status === 'MISSING';
      }
      if (statusFilter === 'INCOMPLETE_ONLY') {
        return item.status === 'INCOMPLETE';
      }
      if (statusFilter === 'COMPLETE_ONLY') {
        return item.status === 'COMPLETE';
      }
      return true; // ALL_DAYS
    });
  }, [report.allDateDetails, selectedMonthFilter, searchDateQuery, statusFilter]);

  // Handle input change with auto-formatting
  const handleInputChange = (dateISO: string, field: 'deshawar' | 'faridabad' | 'ghaziabad' | 'gali', val: string) => {
    // Only accept numeric up to 2 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 2);
    setDraftInputs((prev) => {
      const current = prev[dateISO] || {
        deshawar: report.allDateDetails.find((d) => d.date === dateISO)?.deshawar || '',
        faridabad: report.allDateDetails.find((d) => d.date === dateISO)?.faridabad || '',
        ghaziabad: report.allDateDetails.find((d) => d.date === dateISO)?.ghaziabad || '',
        gali: report.allDateDetails.find((d) => d.date === dateISO)?.gali || '',
      };
      return {
        ...prev,
        [dateISO]: {
          ...current,
          [field]: cleaned,
        },
      };
    });
  };

  // Helper to get current draft value (or fallback to existing record)
  const getDraftValue = (detail: MissingMarketDrawDetail, field: 'deshawar' | 'faridabad' | 'ghaziabad' | 'gali'): string => {
    if (draftInputs[detail.date] && draftInputs[detail.date][field] !== undefined) {
      return draftInputs[detail.date][field];
    }
    return detail[field] || '';
  };

  // Save / Quick-Add entry
  const handleSaveEntry = async (detail: MissingMarketDrawDetail) => {
    const ds = (getDraftValue(detail, 'deshawar') || '').trim();
    const fb = (getDraftValue(detail, 'faridabad') || '').trim();
    const gb = (getDraftValue(detail, 'ghaziabad') || '').trim();
    const gl = (getDraftValue(detail, 'gali') || '').trim();

    if (!ds && !fb && !gb && !gl) {
      return;
    }

    setSavingDates((prev) => ({ ...prev, [detail.date]: true }));

    try {
      if (detail.record && detail.record.id) {
        // Update existing incomplete record
        if (onUpdateRecord) {
          await onUpdateRecord({
            ...detail.record,
            deshawar: ds || detail.record.deshawar,
            faridabad: fb || detail.record.faridabad,
            ghaziabad: gb || detail.record.ghaziabad,
            gali: gl || detail.record.gali,
          });
        }
      } else {
        // Add new record for missing date
        if (onAddRecord) {
          await onAddRecord({
            date: detail.date,
            deshawar: ds,
            faridabad: fb,
            ghaziabad: gb,
            gali: gl,
          });
        }
      }

      setSavedSuccessDates((prev) => ({ ...prev, [detail.date]: true }));
      setTimeout(() => {
        setSavedSuccessDates((prev) => ({ ...prev, [detail.date]: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to save missing draw record', err);
    } finally {
      setSavingDates((prev) => ({ ...prev, [detail.date]: false }));
    }
  };

  // Quick fill with 00 (closed market)
  const handleQuickFillZeros = (dateISO: string) => {
    setDraftInputs((prev) => ({
      ...prev,
      [dateISO]: {
        deshawar: '00',
        faridabad: '00',
        ghaziabad: '00',
        gali: '00',
      },
    }));
  };

  // Batch process raw CSV/text entries: "YYYY-MM-DD,DS,FB,GB,GL"
  const handleProcessBatchText = async () => {
    setBatchError(null);
    if (!batchRawText.trim()) return;

    const lines = batchRawText.trim().split('\n');
    let addedCount = 0;

    for (const line of lines) {
      const parts = line.split(/[,\t|]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const dateStr = parts[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const ds = parts[1] || '';
          const fb = parts[2] || '';
          const gb = parts[3] || '';
          const gl = parts[4] || '';

          const existing = records.find((r) => r.date === dateStr);
          if (existing && onUpdateRecord) {
            await onUpdateRecord({
              ...existing,
              deshawar: ds || existing.deshawar,
              faridabad: fb || existing.faridabad,
              ghaziabad: gb || existing.ghaziabad,
              gali: gl || existing.gali,
            });
            addedCount++;
          } else if (onAddRecord) {
            await onAddRecord({
              date: dateStr,
              deshawar: ds,
              faridabad: fb,
              ghaziabad: gb,
              gali: gl,
            });
            addedCount++;
          }
        }
      }
    }

    if (addedCount > 0) {
      setBatchRawText('');
      setIsBatchModalOpen(false);
    } else {
      setBatchError('No valid rows found. Format: YYYY-MM-DD,DS,FB,GB,GL');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Historical Continuity & Missing Draw Diagnostic
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Sequential Date Audit Active
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Clock className="w-3 h-3 text-cyan-400" />
                {lookbackMonths}-Month Window ({report.totalCalendarDays} Total Days)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              Historical Draw Gap Identifier & Quick-Add Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
              Automatically scans calendar dates across the last {lookbackMonths} months ({report.startDate} to {report.endDate}), detecting unrecorded draw dates and incomplete market entries with zero-friction inline entry.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5 border border-amber-400/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Batch Quick-Add CSV</span>
            </button>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setLookbackMonths(1)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  lookbackMonths === 1 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1M (30d)
              </button>
              <button
                type="button"
                onClick={() => setLookbackMonths(3)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  lookbackMonths === 3 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3M (90d)
              </button>
              <button
                type="button"
                onClick={() => setLookbackMonths(6)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  lookbackMonths === 6 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6M (180d)
              </button>
            </div>
          </div>
        </div>

        {/* 4 PRIMARY METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: 3-Month Continuity Score */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Continuity Score</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  report.overallCompletenessPct >= 95
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : report.overallCompletenessPct >= 80
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {report.overallCompletenessPct >= 95 ? 'HEALTHY' : report.overallCompletenessPct >= 80 ? 'ATTENTION' : 'CRITICAL GAPS'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-100">
                {report.overallCompletenessPct}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({report.totalCompleteDays}/{report.totalCalendarDays} Days)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.overallCompletenessPct >= 95
                    ? 'bg-emerald-500'
                    : report.overallCompletenessPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, report.overallCompletenessPct)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Entirely Missing Days */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Missing Days</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${report.totalMissingDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${report.totalMissingDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {report.totalMissingDays}
              </span>
              <span className="text-xs text-slate-400 font-mono">Unrecorded Dates</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {report.totalMissingDays === 0 ? 'Zero calendar gaps detected' : 'Calendar dates with no database entry'}
            </p>
          </div>

          {/* Card 3: Incomplete Draws */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Incomplete Draws</span>
              <Edit3 className={`w-3.5 h-3.5 ${report.totalIncompleteDays > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${report.totalIncompleteDays > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {report.totalIncompleteDays}
              </span>
              <span className="text-xs text-slate-400 font-mono">Partial Entries</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Dates with 1 to 3 missing market outcomes
            </p>
          </div>

          {/* Card 4: Action Required Total */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">Action Required</span>
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                {report.totalActionRequiredDays}
              </span>
              <span className="text-xs text-slate-400 font-mono">Gaps to Fill</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Max streak gap: <span className="text-amber-300 font-bold">{report.maxConsecutiveMissingStreak} days</span>
            </p>
          </div>
        </div>

        {/* MARKET HEALTH GAUGES */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950/90 border border-slate-800/80 p-2.5 rounded-lg">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Deshawar (DS)</span>
              <span className="text-cyan-400 font-bold">{report.marketCompletenessStats.deshawar.pct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
              <div className="bg-cyan-400 h-1 rounded-full" style={{ width: `${report.marketCompletenessStats.deshawar.pct}%` }} />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{report.marketCompletenessStats.deshawar.filled}/{report.totalCalendarDays} Draws</div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 p-2.5 rounded-lg">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Faridabad (FB)</span>
              <span className="text-emerald-400 font-bold">{report.marketCompletenessStats.faridabad.pct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
              <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${report.marketCompletenessStats.faridabad.pct}%` }} />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{report.marketCompletenessStats.faridabad.filled}/{report.totalCalendarDays} Draws</div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 p-2.5 rounded-lg">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Ghaziabad (GB)</span>
              <span className="text-amber-400 font-bold">{report.marketCompletenessStats.ghaziabad.pct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
              <div className="bg-amber-400 h-1 rounded-full" style={{ width: `${report.marketCompletenessStats.ghaziabad.pct}%` }} />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{report.marketCompletenessStats.ghaziabad.filled}/{report.totalCalendarDays} Draws</div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 p-2.5 rounded-lg">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Gali (GL)</span>
              <span className="text-purple-400 font-bold">{report.marketCompletenessStats.gali.pct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
              <div className="bg-purple-400 h-1 rounded-full" style={{ width: `${report.marketCompletenessStats.gali.pct}%` }} />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{report.marketCompletenessStats.gali.filled}/{report.totalCalendarDays} Draws</div>
          </div>
        </div>
      </div>

      {/* SEQUENTIAL 90-DAY CALENDAR TIMELINE MATRIX */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
              {lookbackMonths}-Month Sequential Calendar Timeline Heatmap
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Complete (4/4)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Incomplete
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Missing Day
            </span>
          </div>
        </div>

        {/* Timeline Grid: Horizontal wrap with days */}
        <div className="flex flex-wrap gap-1.5 pt-1 max-h-44 overflow-y-auto pr-1">
          {report.allDateDetails.map((day) => {
            const isSelected = focusedDateISO === day.date;
            let bgColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/40';
            if (day.status === 'INCOMPLETE') {
              bgColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/40';
            } else if (day.status === 'MISSING') {
              bgColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/40';
            }

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  setFocusedDateISO(day.date);
                  // Auto switch filter if needed
                  if (day.status !== 'COMPLETE' && statusFilter === 'COMPLETE_ONLY') {
                    setStatusFilter('ALL_GAPS');
                  }
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-mono border transition cursor-pointer flex flex-col items-center justify-center min-w-[42px] ${bgColor} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10 shadow-lg' : ''
                }`}
                title={`${day.date} (${day.dayOfWeek}) - ${day.status === 'COMPLETE' ? '4/4 Complete' : day.status === 'INCOMPLETE' ? `Incomplete (${day.presentMarkets.length}/4)` : 'Entirely Missing'}`}
              >
                <span className="text-[9px] opacity-75">{day.date.slice(5)}</span>
                <span className="font-bold">{day.status === 'COMPLETE' ? '✓' : day.status === 'INCOMPLETE' ? '⚠️' : '✕'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL_GAPS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ALL_GAPS'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>All Gaps ({report.totalActionRequiredDays})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('MISSING_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'MISSING_ONLY'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Missing Dates ({report.totalMissingDays})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INCOMPLETE_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'INCOMPLETE_ONLY'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Incomplete Draws ({report.totalIncompleteDays})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL_DAYS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'ALL_DAYS'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Days ({report.totalCalendarDays})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETE_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'COMPLETE_ONLY'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Complete ({report.totalCompleteDays})</span>
            </button>
          </div>

          {/* Month Dropdown & Date Search */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Months ({report.monthlySummaries.length})</option>
              {report.monthlySummaries.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthLabel} ({m.completenessRatePct}% complete)
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search date YYYY-MM-DD..."
                value={searchDateQuery}
                onChange={(e) => setSearchDateQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* MONTHLY SUMMARY ACCORDION BARS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {report.monthlySummaries.map((m) => (
            <div
              key={m.monthKey}
              onClick={() => setSelectedMonthFilter(selectedMonthFilter === m.monthKey ? 'ALL' : m.monthKey)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                selectedMonthFilter === m.monthKey
                  ? 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-200 font-mono block">{m.monthLabel}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {m.completeDays}/{m.totalDays} Days Recorded • {m.missingDays + m.incompleteDays} Gaps
                </span>
              </div>
              <span
                className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                  m.completenessRatePct >= 95
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : m.completenessRatePct >= 80
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {m.completenessRatePct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* LIST OF GAP ENTRIES WITH INLINE QUICK-ADD CONTROLS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
            <span>Diagnostic Breakdown List</span>
            <span className="text-xs font-normal text-slate-400 font-mono">
              (Showing {filteredDetails.length} items)
            </span>
          </h3>
          {filteredDetails.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              Type 2-digit pairs into DS, FB, GB, GL boxes & click Save
            </span>
          )}
        </div>

        {filteredDetails.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-200 font-mono">Zero Gaps Found in Selected Filter!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All calendar dates in this selection have complete, verified 4-house historical draw records.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDetails.map((detail) => {
              const isSaved = savedSuccessDates[detail.date];
              const isSaving = savingDates[detail.date];
              const isComplete = detail.status === 'COMPLETE';
              const isFocused = focusedDateISO === detail.date;

              const dsVal = getDraftValue(detail, 'deshawar');
              const fbVal = getDraftValue(detail, 'faridabad');
              const gbVal = getDraftValue(detail, 'ghaziabad');
              const glVal = getDraftValue(detail, 'gali');

              const hasAnyInput = Boolean(dsVal || fbVal || gbVal || glVal);

              return (
                <div
                  key={detail.date}
                  id={`gap-item-${detail.date}`}
                  className={`bg-slate-900/90 border rounded-2xl p-4 transition shadow-md ${
                    isFocused
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                      : detail.status === 'MISSING'
                      ? 'border-rose-500/30 hover:border-rose-500/50'
                      : detail.status === 'INCOMPLETE'
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Date info & status badge */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                          detail.status === 'COMPLETE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : detail.status === 'INCOMPLETE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {detail.dayOfMonth}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-100">{detail.date}</span>
                          <span className="text-xs text-slate-400 font-mono">({detail.dayOfWeek})</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              detail.status === 'COMPLETE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : detail.status === 'INCOMPLETE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {detail.status === 'COMPLETE'
                              ? '4/4 COMPLETE'
                              : detail.status === 'INCOMPLETE'
                              ? `PARTIAL (${detail.presentMarkets.length}/4)`
                              : 'ENTIRE DAY MISSING'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                          {detail.missingMarkets.length > 0 ? (
                            <span className="text-amber-400">
                              Missing: {detail.missingMarkets.join(', ')}
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> All 4 Houses Recorded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: 4 Market Input Boxes (DS, FB, GB, GL) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Deshawar */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">DS</span>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="--"
                          value={dsVal}
                          onChange={(e) => handleInputChange(detail.date, 'deshawar', e.target.value)}
                          className={`w-9 text-center bg-slate-900 border rounded py-0.5 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                            detail.isDeshawarMissing ? 'border-rose-500/40 text-rose-300' : 'border-cyan-500/30 text-cyan-300'
                          }`}
                        />
                      </div>

                      {/* Faridabad */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">FB</span>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="--"
                          value={fbVal}
                          onChange={(e) => handleInputChange(detail.date, 'faridabad', e.target.value)}
                          className={`w-9 text-center bg-slate-900 border rounded py-0.5 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            detail.isFaridabadMissing ? 'border-rose-500/40 text-rose-300' : 'border-emerald-500/30 text-emerald-300'
                          }`}
                        />
                      </div>

                      {/* Ghaziabad */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">GB</span>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="--"
                          value={gbVal}
                          onChange={(e) => handleInputChange(detail.date, 'ghaziabad', e.target.value)}
                          className={`w-9 text-center bg-slate-900 border rounded py-0.5 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                            detail.isGhaziabadMissing ? 'border-rose-500/40 text-rose-300' : 'border-amber-500/30 text-amber-300'
                          }`}
                        />
                      </div>

                      {/* Gali */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-mono text-purple-400 font-bold">GL</span>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="--"
                          value={glVal}
                          onChange={(e) => handleInputChange(detail.date, 'gali', e.target.value)}
                          className={`w-9 text-center bg-slate-900 border rounded py-0.5 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                            detail.isGaliMissing ? 'border-rose-500/40 text-rose-300' : 'border-purple-500/30 text-purple-300'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-auto">
                      <button
                        type="button"
                        onClick={() => handleQuickFillZeros(detail.date)}
                        className="px-2 py-1 rounded-md text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
                        title="Quick fill all 4 houses with 00 (closed market)"
                      >
                        Set 00s
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveEntry(detail)}
                        disabled={isSaving || !hasAnyInput}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                          isSaved
                            ? 'bg-emerald-500 text-slate-950'
                            : hasAnyInput
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved!</span>
                          </>
                        ) : isSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>{detail.record ? 'Update Draw' : 'Quick Add'}</span>
                          </>
                        )}
                      </button>

                      {onSelectDateForAnalysis && (
                        <button
                          type="button"
                          onClick={() => onSelectDateForAnalysis(detail.date)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer border border-slate-700"
                          title="Inspect in Pattern Consensus Engine"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BATCH QUICK-ADD MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Batch Multi-Day Quick Add
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Paste missing draw records in CSV or comma-separated format. One day per line:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-amber-300 border border-slate-800">
                YYYY-MM-DD,Deshawar,Faridabad,Ghaziabad,Gali<br />
                2026-08-15,49,58,71,40<br />
                2026-08-16,32,19,84,65
              </div>
            </div>

            <textarea
              rows={6}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder="2026-08-15,49,58,71,40&#10;2026-08-16,32,19,84,65"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {batchError && (
              <div className="text-xs text-rose-400 font-mono bg-rose-950/40 border border-rose-500/30 p-2 rounded-lg">
                {batchError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessBatchText}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Import & Save Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
