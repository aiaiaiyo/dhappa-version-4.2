import React, { useState, useMemo } from 'react';
import { DayMarketEntry, Market, MARKETS } from '../types';
import {
  NumberAppearanceItem,
  RangeCoverageItem,
  DayWiseCoverageItem,
  MonthCoverageReport,
  analyzeMonthlyNumberCoverage,
  getReversePair,
} from '../utils/monthlyCoverageEngine';
import {
  CalendarDays,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Flame,
  Zap,
  Copy,
  Check,
  Send,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  ShieldCheck,
  Activity,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  Percent,
  History,
  Download,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface MonthlyNumberCoverageAnalysisModuleProps {
  records: DayMarketEntry[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const MonthlyNumberCoverageAnalysisModule: React.FC<
  MonthlyNumberCoverageAnalysisModuleProps
> = ({ records, onSendPairsToSimulator }) => {
  // Available Months
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const [customRangeMode, setCustomRangeMode] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Active View Tab
  const [activeTab, setActiveTab] = useState<
    | 'ledger'
    | 'matrix'
    | 'ranges'
    | 'daywise'
    | 'appeared-vs-remaining'
    | 'reverse-tracking'
    | 'predictive-audit'
  >('ledger');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'appeared' | 'not-appeared' | 'multi-hit'>('all');
  const [rangeFilter, setRangeFilter] = useState<string>('all'); // 'all' or '00-09', '10-19', etc.

  // Sorting
  const [sortField, setSortField] = useState<
    'number' | 'frequency' | 'daysSince' | 'firstDate' | 'lastDate' | 'reverseFrequency'
  >('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Deep-Dive Modal
  const [inspectedNumber, setInspectedNumber] = useState<NumberAppearanceItem | null>(null);

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Run Monthly Coverage Engine
  const report: MonthCoverageReport = useMemo(() => {
    return analyzeMonthlyNumberCoverage(
      records,
      selectedMonthKey || undefined,
      customRangeMode ? customStartDate : undefined,
      customRangeMode ? customEndDate : undefined
    );
  }, [records, selectedMonthKey, customRangeMode, customStartDate, customEndDate]);

  // Set default month key on first load if not set
  React.useEffect(() => {
    if (!selectedMonthKey && report.availableMonths.length > 0) {
      setSelectedMonthKey(report.availableMonths[0].monthKey);
    }
  }, [report.availableMonths, selectedMonthKey]);

  // Filtered Ledger List
  const filteredLedger = useMemo(() => {
    return report.universeLedger
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchesNum = item.number.includes(q);
          const matchesRev = item.reverseNumber.includes(q);
          const matchesMarket = Object.entries(item.byMarket).some(
            ([mkt, count]) => count > 0 && mkt.toLowerCase().includes(q)
          );
          if (!matchesNum && !matchesRev && !matchesMarket) return false;
        }

        // Status filter
        if (statusFilter === 'appeared' && !item.appearedThisMonth) return false;
        if (statusFilter === 'not-appeared' && item.appearedThisMonth) return false;
        if (statusFilter === 'multi-hit' && item.frequency < 2) return false;

        // Range filter
        if (rangeFilter !== 'all') {
          const decile = parseInt(rangeFilter[0], 10);
          if (item.tens !== decile) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'number') {
          diff = parseInt(a.number, 10) - parseInt(b.number, 10);
        } else if (sortField === 'frequency') {
          diff = a.frequency - b.frequency;
        } else if (sortField === 'daysSince') {
          const da = a.daysSinceLastAppearance ?? (sortDirection === 'asc' ? 999 : -1);
          const db = b.daysSinceLastAppearance ?? (sortDirection === 'asc' ? 999 : -1);
          diff = da - db;
        } else if (sortField === 'firstDate') {
          const fa = a.firstAppearance || '';
          const fb = b.firstAppearance || '';
          diff = fa.localeCompare(fb);
        } else if (sortField === 'lastDate') {
          const la = a.lastAppearance || '';
          const lb = b.lastAppearance || '';
          diff = la.localeCompare(lb);
        } else if (sortField === 'reverseFrequency') {
          diff = a.reverseFrequency - b.reverseFrequency;
        }
        return sortDirection === 'asc' ? diff : -diff;
      });
  }, [report.universeLedger, searchQuery, statusFilter, rangeFilter, sortField, sortDirection]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Number',
      'Appeared_This_Month',
      'Frequency',
      'First_Appearance',
      'Last_Appearance',
      'Days_Since_Last',
      'Status',
      'Deshawar_Hits',
      'Faridabad_Hits',
      'Gali_Hits',
      'Ghaziabad_Hits',
      'Reverse_Number',
      'Reverse_Frequency',
    ];

    const rows = report.universeLedger.map((item) => [
      item.number,
      item.appearedThisMonth ? 'YES' : 'NO',
      item.frequency,
      item.firstAppearance || '—',
      item.lastAppearance || '—',
      item.daysSinceLastAppearance !== undefined ? item.daysSinceLastAppearance : '—',
      item.status,
      item.byMarket.Deshawar,
      item.byMarket.Faridabad,
      item.byMarket.Gali,
      item.byMarket.Ghaziabad,
      item.reverseNumber,
      item.reverseFrequency,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monthly_coverage_${report.summary.monthKey}_00_99.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="monthly-coverage-module" className="space-y-6">
      {/* 1. Header & Month Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-cyan-400" />
                Monthly 00–99 Coverage Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                100-Number Universe
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              Monthly 00–99 Number Coverage Analysis
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Complete universe tracking of all numbers from <span className="text-cyan-300 font-bold font-mono">00 to 99</span> for{' '}
              <strong className="text-white">{report.summary.monthLabel}</strong>. Evaluates actual draw occurrences, coverage percentage, remaining numbers, and repeat vs new number progression.
            </p>
          </div>

          {/* Month Selection Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1">
              {report.availableMonths.map((m) => (
                <button
                  key={m.monthKey}
                  onClick={() => {
                    setSelectedMonthKey(m.monthKey);
                    setCustomRangeMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    !customRangeMode && (selectedMonthKey === m.monthKey || (!selectedMonthKey && m === report.availableMonths[0]))
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {m.monthLabel.split(' ')[0]} {m.monthKey.slice(2, 4)}
                </button>
              ))}

              <button
                onClick={() => setCustomRangeMode(!customRangeMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                  customRangeMode
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Custom Range
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Export complete 00-99 Monthly Coverage Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Custom Date Range Selector (Collapsible) */}
        {customRangeMode && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-2xl">
            <span className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Custom Date Window:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => {
                if (customStartDate && customEndDate) {
                  // Trigger recalculation
                }
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Section 12: Monthly Summary KPI Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {/* Card 1: Coverage */}
          <div className="bg-slate-950/80 border border-cyan-900/40 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
              Monthly Coverage
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {report.summary.monthlyCoveragePercentage.toFixed(0)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{report.summary.uniqueNumbersAppeared} / 100 Unique</span>
              <span className="text-cyan-400 font-mono font-bold">
                {report.summary.totalActualDraws} Draws
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                style={{ width: `${report.summary.monthlyCoveragePercentage}%` }}
              />
            </div>
          </div>

          {/* Card 2: Numbers Remaining */}
          <div className="bg-slate-950/80 border border-rose-900/40 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase text-rose-400 tracking-wider">
              Remaining Numbers
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {report.summary.uniqueNumbersRemaining}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{report.summary.remainingCoveragePercentage.toFixed(0)}% of Universe</span>
              <span className="text-rose-400 font-mono font-bold">0 Hits</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                style={{ width: `${report.summary.remainingCoveragePercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Most Frequent */}
          <div className="bg-slate-950/80 border border-emerald-900/40 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
              Most Frequent
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-emerald-300 font-mono">
                {report.summary.mostFrequentNumbers.slice(0, 3).map((n) => n.number).join(', ') || '—'}
              </span>
              <span className="text-xs font-mono text-emerald-400">
                ({report.summary.highestFrequency}x)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Avg frequency: <strong className="text-white">{report.summary.averageFrequencyAppeared}x</strong> per hit
            </div>
          </div>

          {/* Card 4: Most Active Range */}
          <div className="bg-slate-950/80 border border-violet-900/40 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase text-violet-400 tracking-wider">
              Top Active Range
            </div>
            <div className="text-2xl font-black text-violet-300 font-mono mt-0.5">
              {report.summary.mostFrequentRange}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Least covered: <strong className="text-slate-300">{report.summary.leastCoveredRange}</strong>
            </div>
          </div>

          {/* Card 5: Repeat vs New */}
          <div className="bg-slate-950/80 border border-amber-900/40 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase text-amber-400 tracking-wider">
              Repeat vs New
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">
                {report.summary.newNumberPercentage}%
              </span>
              <span className="text-xs text-emerald-400 font-bold">New</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span className="text-amber-400 font-mono font-bold">{report.summary.repeatNumberPercentage}%</span> Repeat draws
            </div>
          </div>

          {/* Card 6: Analysis Period */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Period Window
            </div>
            <div className="text-sm font-black text-cyan-300 font-mono mt-1 truncate">
              {report.summary.startDate.slice(5)} → {report.summary.endDate.slice(5)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{report.summary.totalDaysWithDraws} Days Active</span>
              <span className="text-cyan-400 font-mono font-bold">4 Houses</span>
            </div>
          </div>
        </div>

        {/* Prominent Empirical Principle Box */}
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-cyan-300">Statistical Grounding Principle:</strong> This analysis evaluates the complete 100-number universe (<span className="font-mono text-white">00–99</span>) based <strong>strictly on actual historical draw results</strong>. Missing numbers are statistical observations of non-occurrence in the sample window — <em>never assume that a missing number is &ldquo;due&rdquo; or imminent</em>.
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          00–99 Appearance Ledger ({report.universeLedger.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          10 × 10 Frequency Heatmap
        </button>

        <button
          onClick={() => setActiveTab('ranges')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'ranges'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Range-Wise Coverage (00–09 to 90–99)
        </button>

        <button
          onClick={() => setActiveTab('daywise')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'daywise'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Day-Wise Timeline & Repeat vs New
        </button>

        <button
          onClick={() => setActiveTab('appeared-vs-remaining')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'appeared-vs-remaining'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Appeared ({report.summary.uniqueNumbersAppeared}) vs Remaining ({report.summary.uniqueNumbersRemaining})
        </button>

        <button
          onClick={() => setActiveTab('reverse-tracking')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'reverse-tracking'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reverse (Palti) Tracking
        </button>

        <button
          onClick={() => setActiveTab('predictive-audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'predictive-audit'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
              : 'text-violet-400 hover:text-violet-200 hover:bg-violet-950/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Prediction Separation & Audit
        </button>
      </div>

      {/* 3. VIEW TAB 1: Complete 00–99 Number Appearance Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search number (e.g. 58, 00)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition ${
                    statusFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All (100)
                </button>
                <button
                  onClick={() => setStatusFilter('appeared')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition flex items-center gap-1 ${
                    statusFilter === 'appeared' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Appeared ({report.summary.uniqueNumbersAppeared})
                </button>
                <button
                  onClick={() => setStatusFilter('not-appeared')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition flex items-center gap-1 ${
                    statusFilter === 'not-appeared' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <XCircle className="w-3 h-3 text-rose-400" />
                  Not Appeared ({report.summary.uniqueNumbersRemaining})
                </button>
                <button
                  onClick={() => setStatusFilter('multi-hit')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition ${
                    statusFilter === 'multi-hit' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Hit ({report.summary.multiHitCount})
                </button>
              </div>

              {/* Range Filter */}
              <select
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Deciles (00–99)</option>
                {report.rangeCoverage.map((r) => (
                  <option key={r.range} value={r.range}>
                    {r.range} ({r.appearedCount}/10 Appeared)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Showing <strong className="text-white">{filteredLedger.length}</strong> of 100</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRangeFilter('all');
                  setSortField('number');
                  setSortDirection('asc');
                }}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th
                      onClick={() => {
                        if (sortField === 'number') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('number');
                          setSortDirection('asc');
                        }
                      }}
                      className="py-3 px-4 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Number</span>
                        {sortField === 'number' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                      </div>
                    </th>
                    <th className="py-3 px-4">Appeared This Month</th>
                    <th
                      onClick={() => {
                        if (sortField === 'frequency') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('frequency');
                          setSortDirection('desc');
                        }
                      }}
                      className="py-3 px-4 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Frequency</span>
                        {sortField === 'frequency' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === 'firstDate') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('firstDate');
                          setSortDirection('asc');
                        }
                      }}
                      className="py-3 px-4 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>First Appearance</span>
                        {sortField === 'firstDate' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === 'lastDate') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('lastDate');
                          setSortDirection('desc');
                        }
                      }}
                      className="py-3 px-4 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Last Appearance</span>
                        {sortField === 'lastDate' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === 'daysSince') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('daysSince');
                          setSortDirection('asc');
                        }
                      }}
                      className="py-3 px-4 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Days Since Last</span>
                        {sortField === 'daysSince' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                      </div>
                    </th>
                    <th className="py-3 px-4">4-House Breakdown</th>
                    <th className="py-3 px-4">Reverse (Palti)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                        No numbers found matching query &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item) => (
                      <tr
                        key={item.number}
                        className={`hover:bg-slate-800/40 transition ${
                          item.appearedThisMonth ? 'bg-slate-900/30' : 'bg-rose-950/10'
                        }`}
                      >
                        {/* Number */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm ${
                                item.appearedThisMonth
                                  ? item.frequency >= 3
                                    ? 'bg-violet-950/80 text-violet-200 border-violet-700/80 ring-2 ring-violet-500/40'
                                    : item.frequency >= 2
                                    ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700/80'
                                    : 'bg-cyan-950/80 text-cyan-200 border-cyan-700/80'
                                  : 'bg-slate-950 text-slate-500 border-slate-800'
                              }`}
                            >
                              {item.number}
                            </span>
                            {item.isDouble && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                Joda
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Appeared This Month */}
                        <td className="py-3 px-4">
                          {item.appearedThisMonth ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              YES
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-950 text-slate-500 border border-slate-800">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              NO
                            </span>
                          )}
                        </td>

                        {/* Frequency */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-black text-sm ${
                              item.frequency >= 3
                                ? 'text-violet-300'
                                : item.frequency >= 2
                                ? 'text-emerald-300'
                                : item.frequency === 1
                                ? 'text-cyan-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {item.frequency}
                          </span>
                        </td>

                        {/* First Appearance */}
                        <td className="py-3 px-4 text-slate-300">
                          {item.firstAppearance ? item.firstAppearance.slice(5) : '—'}
                        </td>

                        {/* Last Appearance */}
                        <td className="py-3 px-4 text-slate-300">
                          {item.lastAppearance ? (
                            <span className="text-cyan-300 font-bold">{item.lastAppearance.slice(5)}</span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Days Since Last Appearance */}
                        <td className="py-3 px-4">
                          {item.daysSinceLastAppearance !== undefined ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.daysSinceLastAppearance === 0
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  : item.daysSinceLastAppearance <= 3
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {item.daysSinceLastAppearance === 0 ? 'Today / Latest' : `${item.daysSinceLastAppearance}d ago`}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* 4-House Breakdown */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                item.byMarket.Deshawar > 0
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold'
                                  : 'text-slate-600'
                              }`}
                              title={`Deshawar: ${item.byMarket.Deshawar}`}
                            >
                              DS:{item.byMarket.Deshawar}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                item.byMarket.Faridabad > 0
                                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-bold'
                                  : 'text-slate-600'
                              }`}
                              title={`Faridabad: ${item.byMarket.Faridabad}`}
                            >
                              FB:{item.byMarket.Faridabad}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                item.byMarket.Gali > 0
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold'
                                  : 'text-slate-600'
                              }`}
                              title={`Gali: ${item.byMarket.Gali}`}
                            >
                              GL:{item.byMarket.Gali}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                item.byMarket.Ghaziabad > 0
                                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold'
                                  : 'text-slate-600'
                              }`}
                              title={`Ghaziabad: ${item.byMarket.Ghaziabad}`}
                            >
                              GB:{item.byMarket.Ghaziabad}
                            </span>
                          </div>
                        </td>

                        {/* Reverse (Palti) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{item.reverseNumber}</span>
                            {item.reverseFrequency > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-bold">
                                {item.reverseFrequency}x rev
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600">0x</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'High Frequency'
                                ? 'bg-violet-950 text-violet-300 border border-violet-800/60'
                                : item.status === 'Multi-Hit'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                : item.status === 'Appeared'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectedNumber(item)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title="Inspect Number Details"
                            >
                              Inspect
                            </button>
                            {onSendPairsToSimulator && (
                              <button
                                onClick={() => onSendPairsToSimulator([item.number])}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                                title="Send to Risk Simulator"
                              >
                                <Send className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW TAB 2: 10 × 10 Frequency Heatmap Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  10 × 10 Matrix: Full 00–99 Universe Frequency Grid
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rows represent tens digits (00–09 through 90–99), columns represent ones digits (0 through 9).
                </p>
              </div>

              {/* Heat legend */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" />
                  0 Hits (Not Observed)
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600" />
                  1 Hit (Single)
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  2 Hits (Medium)
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/40 text-violet-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                  3+ Hits (High Frequency)
                </span>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[640px] space-y-2">
                {/* Column Headers */}
                <div className="grid grid-cols-11 gap-1.5 text-center text-xs font-mono font-bold text-slate-500 mb-1">
                  <div className="py-1 text-slate-400">Decile</div>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                    <div key={col} className="py-1 bg-slate-950/60 rounded-lg border border-slate-800/60 text-slate-300">
                      .{col}
                    </div>
                  ))}
                </div>

                {/* 10 Rows */}
                {report.matrix10x10.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-11 gap-1.5 items-center">
                    {/* Row Header */}
                    <div className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2 py-3 rounded-xl border border-slate-800 text-center">
                      {rowIdx}0s
                    </div>

                    {/* 10 Cells */}
                    {row.map((item) => {
                      let cellStyle = 'bg-slate-950 text-slate-600 border-slate-800/80 hover:border-slate-600';
                      if (item.frequency >= 3) {
                        cellStyle = 'bg-gradient-to-br from-violet-950/90 to-purple-900/90 text-violet-100 border-violet-600/80 shadow-md shadow-violet-950/40 font-black ring-1 ring-violet-400/30';
                      } else if (item.frequency === 2) {
                        cellStyle = 'bg-gradient-to-br from-emerald-950/90 to-teal-900/90 text-emerald-100 border-emerald-600/80 shadow-md shadow-emerald-950/40 font-bold';
                      } else if (item.frequency === 1) {
                        cellStyle = 'bg-gradient-to-br from-cyan-950/80 to-slate-900 text-cyan-200 border-cyan-700/80 font-bold';
                      }

                      return (
                        <button
                          key={item.number}
                          onClick={() => setInspectedNumber(item)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-105 ${cellStyle}`}
                          title={`Number ${item.number} | Frequency: ${item.frequency} | Last: ${item.lastAppearance || 'Never'}`}
                        >
                          <span className="font-mono text-xs md:text-sm">{item.number}</span>
                          <span
                            className={`text-[10px] font-mono mt-0.5 ${
                              item.frequency > 0 ? 'text-white' : 'text-slate-600'
                            }`}
                          >
                            {item.frequency > 0 ? `${item.frequency}x` : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW TAB 3: Range-Wise Coverage (Deciles) */}
      {activeTab === 'ranges' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Section 7: Numerical Decile Range Coverage (00–09 through 90–99)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Assesses whether certain numerical decades are disproportionately represented during the current month.
            </p>

            <div className="space-y-3">
              {report.rangeCoverage.map((rangeItem) => (
                <div
                  key={rangeItem.range}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <span className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-cyan-300 text-sm">
                      {rangeItem.range}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">{rangeItem.range} Decade</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {rangeItem.appearedCount}/10 Numbers Appeared
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="flex-1 max-w-xl">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-cyan-400 font-bold">{rangeItem.coveragePercentage.toFixed(0)}% Coverage</span>
                      <span className="text-slate-400">{rangeItem.totalDrawHits} Total Hits Drawn</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${rangeItem.coveragePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Number chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rangeItem.numbersList.map((numItem) => (
                      <button
                        key={numItem.number}
                        onClick={() => setInspectedNumber(numItem)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center transition cursor-pointer ${
                          numItem.appearedThisMonth
                            ? numItem.frequency >= 3
                              ? 'bg-violet-950 text-violet-200 border border-violet-700 font-black'
                              : numItem.frequency >= 2
                              ? 'bg-emerald-950 text-emerald-200 border border-emerald-700 font-bold'
                              : 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold'
                            : 'bg-slate-900 text-slate-600 border border-slate-800'
                        }`}
                        title={`${numItem.number}: ${numItem.frequency} hits`}
                      >
                        {numItem.number}
                      </button>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div className="text-right min-w-[120px] text-xs font-mono">
                    <div className="text-slate-400 text-[10px] uppercase">Most Active</div>
                    <div className="text-emerald-300 font-bold">
                      {rangeItem.mostActiveNumber ? `${rangeItem.mostActiveNumber} (${rangeItem.mostActiveCount}x)` : 'None'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW TAB 4: Day-Wise Progression & Repeat vs New */}
      {activeTab === 'daywise' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Sections 8 & 9: Day-Wise Coverage Progression & Repeat vs New Analysis
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Progressively tracks how the 00–99 universe fills up across each day of {report.summary.monthLabel}, classifying draws into <span className="text-emerald-400 font-bold">NEW</span> vs <span className="text-amber-400 font-bold">REPEAT</span> numbers.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">4-House Draw Outcomes</th>
                    <th className="py-3 px-4">New Numbers Today</th>
                    <th className="py-3 px-4">Repeat Numbers</th>
                    <th className="py-3 px-4">Cumulative Unique</th>
                    <th className="py-3 px-4">Total Coverage %</th>
                    <th className="py-3 px-4">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.dayWiseCoverage.map((day) => (
                    <tr key={day.date} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {day.date}
                        <span className="block text-[10px] text-slate-500 font-normal">Day {day.dayIndex}</span>
                      </td>

                      {/* 4 Houses */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {day.drawOutcomes.map((draw, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${
                                draw.isNewToMonth
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                              }`}
                              title={`${draw.market}: ${draw.pair} (${draw.isNewToMonth ? 'NEW to Month' : 'REPEAT'})`}
                            >
                              <span className="text-[10px] text-slate-400">{draw.market.slice(0, 2)}:</span>
                              <span>{draw.pair}</span>
                              <span className="text-[9px] uppercase px-1 rounded bg-black/40">
                                {draw.isNewToMonth ? 'NEW' : 'REP'}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* New Numbers Today */}
                      <td className="py-3 px-4">
                        <span className="text-emerald-300 font-bold">
                          +{day.newNumbersToday.length}
                        </span>
                        {day.newNumbersToday.length > 0 && (
                          <span className="text-slate-400 text-[10px] ml-1">
                            ({day.newNumbersToday.join(', ')})
                          </span>
                        )}
                      </td>

                      {/* Repeat Numbers Today */}
                      <td className="py-3 px-4">
                        <span className="text-amber-300 font-bold">
                          {day.repeatNumbersToday.length}
                        </span>
                        {day.repeatNumbersToday.length > 0 && (
                          <span className="text-slate-400 text-[10px] ml-1">
                            ({day.repeatNumbersToday.join(', ')})
                          </span>
                        )}
                      </td>

                      {/* Cumulative Unique */}
                      <td className="py-3 px-4 text-cyan-300 font-bold">
                        {day.cumulativeUniqueCount} / 100
                      </td>

                      {/* Total Coverage % */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${day.totalCoveragePercentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-white">{day.totalCoveragePercentage.toFixed(0)}%</span>
                        </div>
                      </td>

                      {/* Remaining */}
                      <td className="py-3 px-4 text-rose-400">
                        {day.remainingNumbersCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW TAB 5: Appeared vs Remaining Side-by-Side Breakdown */}
      {activeTab === 'appeared-vs-remaining' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 4: Appeared Numbers */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 uppercase">
                  Section 4: Appeared Numbers
                </span>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Numbers Already Appeared This Month
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-black text-emerald-400">
                  {report.summary.uniqueNumbersAppeared} / 100
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {report.summary.monthlyCoveragePercentage.toFixed(0)}% Coverage
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Ranked in descending order by occurrence frequency, followed by most recent appearance.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {report.appearedNumbers.map((item) => (
                <button
                  key={item.number}
                  onClick={() => setInspectedNumber(item)}
                  className="bg-slate-950 border border-slate-800/90 hover:border-cyan-500 rounded-2xl p-3 text-left transition hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white font-mono">{item.number}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono font-bold text-[10px]">
                      {item.frequency}x
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 flex items-center justify-between">
                    <span>Last: {item.lastAppearance?.slice(5)}</span>
                    <span className="text-cyan-400">{item.daysSinceLastAppearance}d ago</span>
                  </div>
                </button>
              ))}
            </div>

            {onSendPairsToSimulator && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onSendPairsToSimulator(report.appearedNumbers.map((x) => x.number))}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send All Appeared ({report.appearedNumbers.length}) to Simulator
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Remaining Numbers */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/60 uppercase">
                  Section 5: Remaining Numbers
                </span>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Numbers Not Yet Appeared This Month
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-black text-rose-400">
                  {report.summary.uniqueNumbersRemaining} / 100
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {report.summary.remainingCoveragePercentage.toFixed(0)}% Remaining
                </div>
              </div>
            </div>

            <p className="text-xs text-rose-300/80 mb-4 bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40">
              <strong>Definition:</strong> <em>&ldquo;Not observed in the current month&apos;s actual draws.&rdquo;</em> Strictly non-predictive observation — missing numbers are NOT automatically due.
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {report.remainingNumbers.map((item) => (
                <button
                  key={item.number}
                  onClick={() => setInspectedNumber(item)}
                  className="bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-2xl p-2.5 text-center transition hover:scale-[1.03] cursor-pointer"
                >
                  <span className="text-sm font-black text-slate-300 font-mono block">{item.number}</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">0 Hits</span>
                </button>
              ))}
            </div>

            {onSendPairsToSimulator && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onSendPairsToSimulator(report.remainingNumbers.map((x) => x.number))}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Remaining ({report.remainingNumbers.length}) to Simulator
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. VIEW TAB 6: Reverse (Palti) Tracking Matrix */}
      {activeTab === 'reverse-tracking' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              Section 11: Reverse (Palti) Tracking Matrix & Separation
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Evaluates actual direct appearance ($AB$) against reverse appearance ($BA$) while strictly keeping reverse observations from contaminating the true 00–99 monthly coverage metric.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="text-xs font-mono text-cyan-400 uppercase">Doubles (Joda) Appeared</div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {report.summary.doublesAppearedCount} / 10
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  00, 11, 22, 33, 44, 55, 66, 77, 88, 99
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="text-xs font-mono text-violet-400 uppercase">Dual Symmetric Pairs (AB &amp; BA)</div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {report.summary.reversalsBothAppearedCount} Pairs
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Both direct and reverse numbers drawn this month
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="text-xs font-mono text-amber-400 uppercase">Separation Integrity</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  100% Contamination-Free
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Reverse draws never increment direct number coverage
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Direct Number (AB)</th>
                    <th className="py-3 px-4">Direct Hits</th>
                    <th className="py-3 px-4">Reverse Pair (BA)</th>
                    <th className="py-3 px-4">Reverse Hits</th>
                    <th className="py-3 px-4">Combined Frequency</th>
                    <th className="py-3 px-4">Symmetry Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.appearedNumbers.slice(0, 25).map((item) => (
                    <tr key={item.number} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-300">
                          {item.number}
                        </span>
                        <span>{item.isDouble ? '(Double)' : ''}</span>
                      </td>
                      <td className="py-3 px-4 text-cyan-300 font-bold">{item.frequency}x</td>
                      <td className="py-3 px-4 text-slate-300 font-bold">{item.reverseNumber}</td>
                      <td className="py-3 px-4">
                        {item.reverseFrequency > 0 ? (
                          <span className="text-violet-300 font-bold">{item.reverseFrequency}x</span>
                        ) : (
                          <span className="text-slate-600">0x</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white font-black">
                        {item.isDouble ? item.frequency : item.frequency + item.reverseFrequency}x
                      </td>
                      <td className="py-3 px-4">
                        {item.isDouble ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            Double (Auto-Symmetric)
                          </span>
                        ) : item.reverseFrequency > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/60 text-[10px] font-bold">
                            Dual Hit (Both Appeared)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-500 text-[10px]">
                            Direct Only
                          </span>
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

      {/* 9. VIEW TAB 7: Prediction Separation & Walk-Forward Audit */}
      {activeTab === 'predictive-audit' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              Sections 10 & 14: Prediction Separation & Walk-Forward Statistical Validation
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Validates empirical behavior across daily transitions to test whether missing / zero-frequency numbers provide out-of-sample predictive lift.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-mono text-cyan-400 uppercase font-bold mb-1">
                  Section 10: Dataset Separation Rule
                </div>
                <h4 className="text-sm font-bold text-white mb-2">
                  Actual Coverage vs Generated 15-Pair Predictions
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  The model generates 15 pairs daily based on cyclic triad arithmetic (S = [a, x, b, y, z, e]). A candidate is <strong>strictly recorded as &ldquo;Appeared&rdquo; only if actually drawn</strong> in the official 4-house results. Generated candidate membership does not count as an actual draw hit.
                </p>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                  <div>Model Generated: <span className="text-violet-300 font-bold">83</span></div>
                  <div>Actual Draw: <span className="text-slate-400">Deshawar 57, FB 90, GL 59, GB 99</span></div>
                  <div className="mt-1 text-rose-400 font-bold">&rarr; 83 = NOT APPEARED (0 Hit Count)</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-mono text-violet-400 uppercase font-bold mb-1">
                  Section 14: Walk-Forward Due Number Test
                </div>
                <h4 className="text-sm font-bold text-white mb-2">
                  Empirical Edge Assessment of Missing Numbers
                </h4>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Tested Next-Day Cycles:</span>
                    <span className="text-white font-bold">{report.missingNumberPredictiveTest.testedNextDayCycles} Days</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Missing Numbers Next-Day Conversion:</span>
                    <span className="text-cyan-300 font-bold">
                      {report.missingNumberPredictiveTest.zeroFrequencyNextDayHits} Hits ({report.missingNumberPredictiveTest.zeroFrequencyNextDayHitRate}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Repeated Numbers Next-Day Conversion:</span>
                    <span className="text-amber-300 font-bold">
                      {report.missingNumberPredictiveTest.repeatedNextDayHits} Hits ({report.missingNumberPredictiveTest.repeatedNextDayHitRate}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-violet-950/40 border border-violet-800/60 rounded-2xl text-xs text-violet-200 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Final Principle Verdict:</strong>
                {report.missingNumberPredictiveTest.empiricalConclusion}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Deep-Dive Modal for Single Number */}
      {inspectedNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-700 text-cyan-200 font-mono font-black text-xl flex items-center justify-center shadow-lg">
                  {inspectedNumber.number}
                </span>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">
                    Number {inspectedNumber.number} Deep Dive
                  </h4>
                  <span className="text-xs text-slate-400">
                    Reverse: <strong className="text-cyan-300 font-mono">{inspectedNumber.reverseNumber}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedNumber(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Appeared This Month</div>
                  <div className={`text-base font-bold mt-0.5 ${inspectedNumber.appearedThisMonth ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inspectedNumber.appearedThisMonth ? 'YES (Appeared)' : 'NO (Not Observed)'}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Frequency Count</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {inspectedNumber.frequency} Occurrences
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">First Appearance:</span>
                  <span className="text-white font-bold">{inspectedNumber.firstAppearance || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Appearance:</span>
                  <span className="text-cyan-300 font-bold">{inspectedNumber.lastAppearance || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Days Since Last:</span>
                  <span className="text-white font-bold">
                    {inspectedNumber.daysSinceLastAppearance !== undefined ? `${inspectedNumber.daysSinceLastAppearance} days` : '—'}
                  </span>
                </div>
              </div>

              {/* House Breakdown */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase mb-2">4-House Draw Distribution</div>
                <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                  <div className="p-1.5 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[9px]">DS</span>
                    <span className="font-bold text-amber-300">{inspectedNumber.byMarket.Deshawar}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[9px]">FB</span>
                    <span className="font-bold text-indigo-300">{inspectedNumber.byMarket.Faridabad}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[9px]">GL</span>
                    <span className="font-bold text-emerald-300">{inspectedNumber.byMarket.Gali}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[9px]">GB</span>
                    <span className="font-bold text-rose-300">{inspectedNumber.byMarket.Ghaziabad}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => copyToClipboard(inspectedNumber.number, 'inspect-copy')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'inspect-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Number
              </button>
              {onSendPairsToSimulator && (
                <button
                  onClick={() => {
                    onSendPairsToSimulator([inspectedNumber.number]);
                    setInspectedNumber(null);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test in Simulator
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
