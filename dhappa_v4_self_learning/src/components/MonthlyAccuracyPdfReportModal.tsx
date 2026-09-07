import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  Activity,
  GitBranch,
  Filter,
  Search,
  Zap,
  Sliders,
  X,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { DayMarketEntry } from '../types';
import {
  computeMonthlyAccuracyReport,
  getAvailableMonthsFromRecords,
  MonthlyAccuracyReportData,
} from '../utils/monthlyAccuracyReportEngine';
import { downloadMonthlyAccuracyPdfReport } from '../utils/monthlyAccuracyPdfReportGenerator';
import * as XLSX from 'xlsx';

interface MonthlyAccuracyPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DayMarketEntry[];
  initialMonthKey?: string; // YYYY-MM
  historicalLookbackDays?: number;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const MonthlyAccuracyPdfReportModal: React.FC<MonthlyAccuracyPdfReportModalProps> = ({
  isOpen,
  onClose,
  records,
  initialMonthKey,
  historicalLookbackDays = 6,
  onSendPairsToSimulator,
}) => {
  const availableMonths = useMemo(() => getAvailableMonthsFromRecords(records), [records]);
  
  // Default to initialMonthKey or first available month
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    if (initialMonthKey && availableMonths.some((m) => m.monthKey === initialMonthKey)) {
      return initialMonthKey;
    }
    return availableMonths[0]?.monthKey || new Date().toISOString().slice(0, 7);
  });

  const [lookbackHorizon, setLookbackHorizon] = useState<number>(historicalLookbackDays);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DAILY_AUDIT' | 'TIERS' | 'SELF_LEARNING'>('OVERVIEW');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'HITS_ONLY' | 'PERFECT_DAYS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compute report data for selected month
  const reportData = useMemo<MonthlyAccuracyReportData>(() => {
    return computeMonthlyAccuracyReport(records, selectedMonthKey, lookbackHorizon);
  }, [records, selectedMonthKey, lookbackHorizon]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      setTimeout(() => {
        downloadMonthlyAccuracyPdfReport(reportData, {
          includeDailyAuditTable: true,
          includeSelfLearningLedger: true,
          authorTag: 'Pattern Analytics Intelligence Suite',
        });
        setIsGeneratingPdf(false);
      }, 150);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Monthly Summary
    const summaryData = [
      { Metric: 'Evaluation Month', Value: reportData.monthLabel },
      { Metric: 'Model Version', Value: reportData.modelVersion },
      { Metric: 'Lookback Horizon (Days)', Value: reportData.historicalLookbackDays },
      { Metric: 'Evaluated Days', Value: reportData.evaluatedDaysCount },
      { Metric: 'Total Market Draws Assessed', Value: reportData.totalMarketDrawsAssessed },
      { Metric: 'Total Exact Hits in Top 36', Value: reportData.totalExactHitsInTop36 },
      { Metric: 'Top 36 Exact Accuracy Rate (%)', Value: reportData.exactHitRateTop36Pct },
      { Metric: 'Top 10 Momentum Hits', Value: reportData.totalExactHitsInTop10 },
      { Metric: 'Top 10 Hit Rate (%)', Value: reportData.exactHitRateTop10Pct },
      { Metric: 'Top 5 Prime Core Hits', Value: reportData.totalExactHitsInTop5 },
      { Metric: 'Top 5 Hit Rate (%)', Value: reportData.exactHitRateTop5Pct },
      { Metric: 'Palti Mirror Captures', Value: reportData.totalPaltiHits },
      { Metric: 'Family Resonance Hits', Value: reportData.totalFamilyHits },
      { Metric: 'Self-Learning Convergence Score (%)', Value: reportData.precisionConvergenceScore },
      { Metric: 'Optimization Loss Delta', Value: reportData.lossDelta },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

    // Sheet 2: Market Breakdown
    const marketData = reportData.marketBreakdown.map((m) => ({
      Market: m.market,
      MarketKey: m.marketKey,
      DrawsLogged: m.drawsLogged,
      ExactHitsTop36: m.exactHitsTop36,
      ExactHitsTop10: m.exactHitsTop10,
      ExactHitsTop5: m.exactHitsTop5,
      PaltiHits: m.paltiHits,
      FamilyHits: m.familyHits,
      AccuracyRatePct: m.accuracyRatePct,
      PerformanceGrade: m.performanceGrade,
    }));
    const wsMarket = XLSX.utils.json_to_sheet(marketData);
    XLSX.utils.book_append_sheet(wb, wsMarket, 'Market Breakdown');

    // Sheet 3: Daily Audit Logs
    const dailyData = reportData.dailyAuditRecords.map((day) => ({
      Date: day.date,
      DayOfWeek: day.dayOfWeek,
      Deshawar: day.actualDraws.find((d) => d.marketKey === 'DS')?.number || '--',
      Faridabad: day.actualDraws.find((d) => d.marketKey === 'FB')?.number || '--',
      Ghaziabad: day.actualDraws.find((d) => d.marketKey === 'GB')?.number || '--',
      Gali: day.actualDraws.find((d) => d.marketKey === 'GL')?.number || '--',
      ExactHitsCount: day.exactHitsCount,
      PaltiHitsCount: day.paltiHitsCount,
      FamilyHitsCount: day.familyHitsCount,
      HighestTierCaptured: day.highestTierCaptured,
      Top5Predictions: day.top5Predictions.join(', '),
      Top10Predictions: day.top10Predictions.join(', '),
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Audit Logs');

    XLSX.writeFile(wb, `Monthly_Accuracy_Report_${reportData.monthKey.replace('-', '_')}.xlsx`);
  };

  // Filtered Daily Audit records
  const filteredDailyRecords = reportData.dailyAuditRecords.filter((d) => {
    if (auditFilter === 'PERFECT_DAYS' && d.exactHitsCount < d.totalMarketDrawsLogged) return false;
    if (auditFilter === 'HITS_ONLY' && d.exactHitsCount === 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hasDate = d.date.includes(q) || d.formattedDate.toLowerCase().includes(q);
      const hasNum = d.actualDraws.some((ad) => ad.number.includes(q));
      const hasTop = d.top5Predictions.some((p) => p.includes(q));
      if (!hasDate && !hasNum && !hasTop) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                AUTOMATED MONTHLY AUDIT REPORT
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-semibold">
                Model {reportData.modelVersion}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Monthly Prediction Accuracy & Actual Draws Audit</span>
            </h2>
            <p className="text-xs text-slate-400">
              Cross-evaluating multi-engine candidate pools against recorded market outcomes with self-learning precision metrics.
            </p>
          </div>

          {/* Action Buttons: PDF, Print, Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs font-mono shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Download vector publication-ready PDF report"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
              title="Print formatted document / Save as PDF via browser"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-700/60 hover:bg-emerald-600 text-emerald-200 border border-emerald-500/40 font-bold text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
              title="Export complete monthly dataset to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MONTH SELECTOR & HORIZON BAR */}
        <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
          {/* Month Dropdown & Navigation */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Target Month:
            </span>
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="bg-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1 text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthLabel} ({m.recordCount} Days Logged)
                </option>
              ))}
            </select>
          </div>

          {/* Lookback Horizon Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Horizon:
            </span>
            <div className="flex items-center gap-1">
              {[3, 5, 6, 7, 10, 14, 30].map((d) => (
                <button
                  key={`horizon-btn-${d}`}
                  type="button"
                  onClick={() => setLookbackHorizon(d)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    lookbackHorizon === d
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {d}d{d === 6 ? '★' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-slate-950/40 px-4 pt-2 border-b border-slate-800 flex items-center gap-2 text-xs font-mono shrink-0 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Executive KPI & Markets', icon: Activity },
            { id: 'DAILY_AUDIT', label: `Daily Audit Logs (${reportData.dailyAuditRecords.length})`, icon: Calendar },
            { id: 'TIERS', label: '4-Tier Segregation Performance', icon: Layers },
            { id: 'SELF_LEARNING', label: 'Self-Learning Precision Ledger', icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL BODY (SCROLLABLE & PRINTABLE CONTAINER) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 print:p-0 print:bg-white print:text-black">
          {/* TAB 1: EXECUTIVE KPI & MARKETS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* TOP 4 EXECUTIVE SCORECARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
                    <span>TOP 36 HIT ACCURACY</span>
                    <Award className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
                    {reportData.exactHitRateTop36Pct}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {reportData.totalExactHitsInTop36} of {reportData.totalMarketDrawsAssessed} Total Draws
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
                    <span>TOP 10 MOMENTUM</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    {reportData.exactHitRateTop10Pct}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {reportData.totalExactHitsInTop10} Exact Hits (#6-10)
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
                    <span>TOP 5 PRIME CORE</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                    {reportData.exactHitRateTop5Pct}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {reportData.totalExactHitsInTop5} Exact Hits (#1-5)
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
                    <span>PRECISION CONVERGENCE</span>
                    <GitBranch className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
                    {reportData.precisionConvergenceScore}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Loss Delta: {reportData.lossDelta.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* EXECUTIVE AUDIT SUMMARY HIGHLIGHTS */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Executive Monthly Takeaways ({reportData.monthLabel})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
                  {reportData.executiveSummaryTakeaways.map((takeaway, idx) => (
                    <div key={`takeaway-${idx}`} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MARKET-BY-MARKET ACCURACY PERFORMANCE */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      <span>Market-by-Market Accuracy Breakdown</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comparing prediction capture and hit rates across all 4 primary game markets.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {reportData.marketBreakdown.map((m) => (
                    <div key={m.market} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-sm">{m.market} ({m.marketKey})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.performanceGrade === 'A+' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          m.performanceGrade === 'A' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                          m.performanceGrade === 'B+' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          Grade {m.performanceGrade}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-slate-400">Exact Top 36 Rate:</span>
                          <span className="text-emerald-400 font-bold text-base">{m.accuracyRatePct}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, m.accuracyRatePct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <div>
                          <span>Draws: </span>
                          <span className="text-slate-200 font-bold">{m.drawsLogged}</span>
                        </div>
                        <div>
                          <span>Top 36 Hits: </span>
                          <span className="text-emerald-300 font-bold">{m.exactHitsTop36}</span>
                        </div>
                        <div>
                          <span>Top 10 Hits: </span>
                          <span className="text-indigo-300 font-bold">{m.exactHitsTop10}</span>
                        </div>
                        <div>
                          <span>Palti Hits: </span>
                          <span className="text-purple-300 font-bold">{m.paltiHits}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY AUDIT LOGS TABLE */}
          {activeTab === 'DAILY_AUDIT' && (
            <div className="space-y-4">
              {/* Table Controls: Filters and Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-400">Filter Days:</span>
                  {(['ALL', 'HITS_ONLY', 'PERFECT_DAYS'] as const).map((f) => (
                    <button
                      key={`audit-filter-${f}`}
                      type="button"
                      onClick={() => setAuditFilter(f)}
                      className={`px-2.5 py-1 rounded transition cursor-pointer font-bold ${
                        auditFilter === f
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {f === 'ALL' ? `All Days (${reportData.dailyAuditRecords.length})` : f === 'HITS_ONLY' ? 'Exact Hits Only' : 'Perfect Sweep Days'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search date, number, market..."
                    className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Table of Daily Entries */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-3">Date (Day)</th>
                        <th className="py-3 px-3">Actual Market Draws</th>
                        <th className="py-3 px-3">Exact Hits in Top 36</th>
                        <th className="py-3 px-3">Top 5 Prime Predictions</th>
                        <th className="py-3 px-3">Capture</th>
                        <th className="py-3 px-3">Highest Tier</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredDailyRecords.map((day) => (
                        <tr key={day.date} className="hover:bg-slate-900/50 transition">
                          <td className="py-3 px-3 font-bold text-slate-200 whitespace-nowrap">
                            <div>{day.formattedDate}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{day.dayOfWeek}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1.5">
                              {day.actualDraws.map((d) => (
                                <span
                                  key={`ad-${day.date}-${d.marketKey}`}
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                    d.hitType === 'EXACT'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                      : d.hitType === 'PALTI'
                                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                                      : d.hitType === 'FAMILY'
                                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                                      : 'bg-slate-900 text-slate-400 border-slate-800'
                                  }`}
                                >
                                  {d.marketKey}: <span className="font-mono">{d.number}</span>
                                  {d.hitType === 'EXACT' && <span className="text-[9px] ml-1">✓#{d.hitRankInTop36}</span>}
                                  {d.hitType === 'PALTI' && <span className="text-[9px] ml-1">⟲</span>}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {day.actualDraws.filter((d) => d.hitType === 'EXACT').length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {day.actualDraws
                                  .filter((d) => d.hitType === 'EXACT')
                                  .map((d) => (
                                    <span key={`ex-${d.number}`} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                                      {d.number} ({d.marketKey} #{d.hitRankInTop36})
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">No exact hit</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-400">
                            <span className="text-indigo-300 font-bold">{day.top5Predictions.join(', ')}</span>
                          </td>

                          <td className="py-3 px-3 font-bold whitespace-nowrap">
                            <span className={day.exactHitsCount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                              {day.exactHitsCount}/{day.totalMarketDrawsLogged} ({day.dayCaptureRatePct}%)
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              day.highestTierCaptured === 'TIER_1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              day.highestTierCaptured === 'TIER_2' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                              day.highestTierCaptured === 'TIER_3' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                              day.highestTierCaptured === 'TIER_4' ? 'bg-slate-800 text-slate-400' :
                              'text-slate-600'
                            }`}>
                              {day.highestTierCaptured !== 'NONE' ? day.highestTierCaptured.replace('_', ' ') : 'MISS'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {onSendPairsToSimulator && (
                              <button
                                type="button"
                                onClick={() => onSendPairsToSimulator(day.top36Predictions)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                                title="Send this day's Top 36 predictions to simulator"
                              >
                                Simulate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 4-TIER SEGREGATION PERFORMANCE */}
          {activeTab === 'TIERS' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 font-mono">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>4-Tier Segregation Performance in {reportData.monthLabel}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed distribution of hit capture and precision across the 4 algorithmic confidence tiers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reportData.tierPerformance.map((tier) => (
                    <div key={tier.tier} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-200 text-sm">{tier.tierName}</div>
                        <span className="text-xs text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                          {tier.bracketLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px]">Exact Hits Captured:</div>
                          <div className="text-emerald-400 font-bold text-lg">{tier.totalHitsCaptured} Hits</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Share of Total Hits:</div>
                          <div className="text-cyan-400 font-bold text-lg">{tier.hitSharePct}%</div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                        {tier.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SELF-LEARNING PRECISION LEDGER */}
          {activeTab === 'SELF_LEARNING' && (
            <div className="space-y-4 font-mono">
              <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <span>Self-Learning Precision Weights & Efficacy Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Dynamically calibrated weights generated during optimization epochs for {reportData.monthLabel}.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Active Model Checkpoint:</div>
                    <div className="text-sm font-black text-purple-300">{reportData.modelVersion}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reportData.engineRankings.map((eng) => (
                    <div key={eng.engineId} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200 text-xs">{eng.engineName}</div>
                        <div className="text-[10px] text-slate-400">Historical Hit Rate: {eng.hitRatePct.toFixed(1)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-indigo-400">{eng.learnedWeight.toFixed(2)}x</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">Grade {eng.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="text-slate-400 text-[11px]">
            Generated on {(() => {
              try {
                const d = new Date(reportData.generationTimestamp);
                return isNaN(d.getTime()) ? reportData.generationTimestamp : d.toLocaleDateString();
              } catch (e) {
                return reportData.generationTimestamp;
              }
            })()} • {reportData.evaluatedDaysCount} days evaluated
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
