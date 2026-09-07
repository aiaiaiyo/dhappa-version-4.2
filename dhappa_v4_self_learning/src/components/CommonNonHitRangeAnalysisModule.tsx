import React, { useState, useMemo } from 'react';
import { SirAbhishekBacktestStep } from '../types';
import {
  NonHitPeriodPreset,
  NonHitNumberItem,
  NonHitPeriodReport,
  analyzeCommonNonHitRange,
} from '../utils/nonHitRangeEngine';
import {
  Calendar,
  Filter,
  Flame,
  Search,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  TrendingDown,
  RotateCcw,
  Copy,
  Check,
  Send,
  Building2,
  CalendarDays,
  Target,
  BarChart3,
  Layers,
  XCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
} from 'lucide-react';

interface CommonNonHitRangeAnalysisModuleProps {
  backtestSteps: SirAbhishekBacktestStep[];
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const CommonNonHitRangeAnalysisModule: React.FC<
  CommonNonHitRangeAnalysisModuleProps
> = ({ backtestSteps, onSendPairsToSimulator }) => {
  // Period Preset State
  const [selectedPreset, setSelectedPreset] = useState<NonHitPeriodPreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Category Tab
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'persistent' | 'frequent-miss' | 'streaks' | 'reverse' | 'frequent-hits'
  >('all');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<
    'rank' | 'number' | 'generatedDays' | 'actualHits' | 'nonHitDays' | 'nonHitPercentage' | 'maxStreak' | 'currentStreak' | 'reverseHits'
  >('nonHitDays');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selected Number for Deep-Dive Modal
  const [inspectingNumber, setInspectingNumber] = useState<NonHitNumberItem | null>(null);

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Available unique dates for custom picker
  const availableDates = useMemo(() => {
    return Array.from(new Set(backtestSteps.map((s) => s.date))).sort();
  }, [backtestSteps]);

  // Run Range Analysis
  const report: NonHitPeriodReport = useMemo(() => {
    return analyzeCommonNonHitRange(
      backtestSteps,
      selectedPreset,
      customStartDate || (availableDates.length > 0 ? availableDates[0] : undefined),
      customEndDate || (availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined)
    );
  }, [backtestSteps, selectedPreset, customStartDate, customEndDate, availableDates]);

  // Filtered by Category and Search Query
  const filteredNumbers = useMemo(() => {
    let list = report.numbers;

    if (activeCategory === 'persistent') {
      list = report.persistentNonHits;
    } else if (activeCategory === 'frequent-miss') {
      list = report.frequentNonHits;
    } else if (activeCategory === 'streaks') {
      list = report.longestStreakNumbers;
    } else if (activeCategory === 'reverse') {
      list = report.reverseWinners;
    } else if (activeCategory === 'frequent-hits') {
      list = report.frequentHits;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.number.includes(q) ||
          item.reverseNumber.includes(q) ||
          item.status.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    const sorted = [...list];
    const modifier = sortDirection === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'number':
          comparison = a.number.localeCompare(b.number);
          break;
        case 'generatedDays':
          comparison = a.generatedDays - b.generatedDays;
          break;
        case 'actualHits':
          comparison = a.actualHits - b.actualHits;
          break;
        case 'nonHitDays':
          comparison = a.nonHitDays - b.nonHitDays;
          break;
        case 'nonHitPercentage':
          comparison = a.nonHitPercentage - b.nonHitPercentage;
          break;
        case 'maxStreak':
          comparison = a.longestNonHitStreak - b.longestNonHitStreak;
          break;
        case 'currentStreak':
          comparison = a.currentNonHitStreak - b.currentNonHitStreak;
          break;
        case 'reverseHits':
          comparison = a.reverseHits - b.reverseHits;
          break;
        default:
          comparison = a.nonHitDays - b.nonHitDays;
      }
      if (comparison === 0) {
        return b.generatedDays - a.generatedDays;
      }
      return comparison * modifier;
    });

    return sorted;
  }, [report, activeCategory, searchQuery, sortField, sortDirection]);

  const handleToggleSort = (
    field:
      | 'rank'
      | 'number'
      | 'generatedDays'
      | 'actualHits'
      | 'nonHitDays'
      | 'nonHitPercentage'
      | 'maxStreak'
      | 'currentStreak'
      | 'reverseHits'
  ) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (field === 'number' || field === 'rank') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  const getStatusBadge = (status: NonHitNumberItem['status']) => {
    switch (status) {
      case 'Persistent Non-Hit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3 h-3 text-rose-400" />
            Persistent Non-Hit
          </span>
        );
      case 'Frequent Non-Hit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <TrendingDown className="w-3 h-3 text-amber-400" />
            Frequent Non-Hit
          </span>
        );
      case 'Reverse-Only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            Reverse-Only Hit
          </span>
        );
      case 'Frequent Hit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Frequent Hit
          </span>
        );
      case 'Mixed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Mixed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Period Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Range Engine
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                Common Non-Hit Number Range Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Identifies generated 15-pair numbers that repeatedly appeared across multiple walk-forward cycles within a selected historical window but failed to appear in the actual 4-house draw.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const topNonHits = report.persistentNonHits.map((n) => n.number);
                copyToClipboard(topNonHits.join(', '), 'top-nonhits');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Copy top persistent non-hit candidates"
            >
              {copiedKey === 'top-nonhits' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Candidates</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Persistent Non-Hits</span>
                </>
              )}
            </button>

            {onSendPairsToSimulator && (
              <button
                onClick={() => {
                  const candidateSet = report.persistentNonHits.slice(0, 15).map((n) => n.number);
                  onSendPairsToSimulator(candidateSet);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-900/30"
                title="Send persistent non-hit candidates to simulator for testing"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test in Simulator</span>
              </button>
            )}
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-300">Select Historical Period:</span>
            </div>

            {/* Presets Grid */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: '7d', label: 'Last 7 Days', badge: '7 Cycles' },
                  { id: '15d', label: 'Last 15 Days', badge: '15 Cycles' },
                  { id: '30d', label: 'Last 30 Days', badge: '30 Cycles' },
                  { id: '50d', label: 'Last 50 Days', badge: '50 Cycles' },
                  { id: '100d', label: 'Last 100 Days', badge: '100 Cycles' },
                  { id: 'all', label: 'All History', badge: `${backtestSteps.length} Cycles` },
                  { id: 'custom', label: 'Custom Range', badge: 'Dates' },
                ] as const
              ).map((preset) => {
                const isActive = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/40 border border-purple-400'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded ${
                        isActive ? 'bg-purple-800/60 text-purple-200' : 'bg-slate-950 text-slate-500'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Picker when Custom is selected */}
          {selectedPreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-mono">From (Start):</span>
                <select
                  value={customStartDate || availableDates[0] || ''}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer font-mono"
                >
                  {availableDates.map((d) => (
                    <option key={`start-${d}`} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-mono">To (End):</span>
                <select
                  value={customEndDate || availableDates[availableDates.length - 1] || ''}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer font-mono"
                >
                  {availableDates.map((d) => (
                    <option key={`end-${d}`} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-purple-300 font-mono">
                Active Period: <strong className="text-white">{report.startDate}</strong> to{' '}
                <strong className="text-white">{report.endDate}</strong> ({report.totalCycles} cycles)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-500">Cycles in Window</div>
          <div className="text-xl font-mono font-bold text-slate-100">{report.totalCycles}</div>
          <div className="text-[10px] text-slate-400">{report.startDate} ~ {report.endDate}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-500">Unique Generated</div>
          <div className="text-xl font-mono font-bold text-purple-300">
            {report.totalUniqueGeneratedNumbers} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-400">distinct 2-digit pairs</div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] uppercase font-mono text-rose-400 font-bold">Persistent Non-Hits</div>
          <div className="text-xl font-mono font-bold text-rose-400">
            {report.persistentNonHits.length}
          </div>
          <div className="text-[10px] text-rose-300/80">0 hits across window</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-500">Highest Miss Streak</div>
          <div className="text-xl font-mono font-bold text-amber-400">
            {report.summaryStats.highestMissStreakValue}{' '}
            <span className="text-xs text-slate-400">
              ({report.summaryStats.highestMissStreakNumber})
            </span>
          </div>
          <div className="text-[10px] text-slate-400">consecutive missed draws</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-500">Avg Non-Hit %</div>
          <div className="text-xl font-mono font-bold text-slate-200">
            {report.summaryStats.averageNonHitRate}%
          </div>
          <div className="text-[10px] text-slate-400">per generated candidate</div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Reverse Hits (Palti)</div>
          <div className="text-xl font-mono font-bold text-cyan-300">
            {report.reverseWinners.length}
          </div>
          <div className="text-[10px] text-cyan-300/80">reverse hit & direct miss</div>
        </div>
      </div>

      {/* 3. Scientific Note & Distinction Callout */}
      <div className="bg-slate-950 border-l-4 border-rose-500 border-y border-r border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <Info className="w-4 h-4" />
          <span>Important Statistical Principle & Empirical Purpose</span>
        </div>
        <p className="leading-relaxed text-slate-300">
          <strong>Mandated Historical Pattern Reporting:</strong> &ldquo;
          <span className="text-yellow-300 font-bold">
            This number was repeatedly generated during the selected period but was not observed in the corresponding actual draws.
          </span>
          &rdquo;
        </p>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Do not interpret a frequent non-hit as automatically meaning the number is &ldquo;due&rdquo; to occur. The purpose of this feature is to identify persistent prediction-vs-draw divergence, which can be tested through out-of-sample walk-forward validation as a potential signal for calibrating the Sir Abhishek Theory scoring model.
        </p>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'all'
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>All Candidates</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">
                {report.numbers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('persistent')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'persistent'
                  ? 'bg-rose-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-rose-400/80 hover:text-rose-200 border border-rose-500/30'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Persistent Non-Hits (0 Hits)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-200 font-bold">
                {report.persistentNonHits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('frequent-miss')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'frequent-miss'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-amber-400/80 hover:text-amber-200 border border-amber-500/30'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Frequent Non-Hits (≥65% Miss)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-200 font-bold">
                {report.frequentNonHits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('streaks')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'streaks'
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-purple-400/80 hover:text-purple-200 border border-purple-500/30'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Miss Streaks (≥3)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-200 font-bold">
                {report.longestStreakNumbers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('reverse')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'reverse'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-cyan-400/80 hover:text-cyan-200 border border-cyan-500/30'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reverse Winners (Palti Hit)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-200 font-bold">
                {report.reverseWinners.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('frequent-hits')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'frequent-hits'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-emerald-400/80 hover:text-emerald-200 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Frequent Hits (Benchmark)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-200 font-bold">
                {report.frequentHits.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pair (e.g. 83, 49)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 w-full outline-none focus:border-purple-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-slate-400 uppercase font-bold">Sort By:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="nonHitDays">Non-Hit Days (Frequency)</option>
              <option value="nonHitPercentage">Non-Hit % (Miss Rate)</option>
              <option value="generatedDays">Generated Days</option>
              <option value="maxStreak">Longest Non-Hit Streak</option>
              <option value="currentStreak">Current Non-Hit Streak</option>
              <option value="actualHits">Actual Direct Hits</option>
              <option value="reverseHits">Reverse (Palti) Hits</option>
              <option value="number">Number (00-99)</option>
              <option value="rank">Original Rank</option>
            </select>

            <button
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title={`Toggle ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="w-3 h-3 text-purple-400" />
                  <span>Ascending (Low-to-High)</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3 h-3 text-purple-400" />
                  <span>Descending (High-to-Low)</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Showing <strong className="text-purple-300">{filteredNumbers.length}</strong> of{' '}
            <strong className="text-slate-200">{report.numbers.length}</strong> candidates in range
          </div>
        </div>
      </div>

      {/* 5. Main Dashboard Table: Common Generated but Not Drawn Numbers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-200 font-mono">
              Common Generated but Not Drawn Numbers ({report.periodLabel})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Click any column header to sort ascending / descending
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredNumbers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-300">No candidates match the filter</div>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting a broader historical period or clearing the search query.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/60">
                  <th
                    onClick={() => handleToggleSort('rank')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center w-12"
                    title="Sort by Rank"
                  >
                    Rank
                  </th>
                  <th
                    onClick={() => handleToggleSort('number')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition"
                    title="Sort by Number"
                  >
                    <div className="flex items-center gap-1">
                      <span>Number</span>
                      {sortField === 'number' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('generatedDays')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center"
                    title="Days Generated in 15-Pair Sets"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Generated Days</span>
                      {sortField === 'generatedDays' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('actualHits')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center"
                    title="Actual Direct Hits in Draw"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Actual Hits</span>
                      {sortField === 'actualHits' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('nonHitDays')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center"
                    title="Days Generated but Not Drawn (Misses)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Non-Hit Days</span>
                      {sortField === 'nonHitDays' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('nonHitPercentage')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition"
                    title="Non-Hit Percentage"
                  >
                    <div className="flex items-center gap-1">
                      <span>Non-Hit %</span>
                      {sortField === 'nonHitPercentage' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('maxStreak')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center"
                    title="Longest Consecutive Non-Hit Streak"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Max Miss Streak</span>
                      {sortField === 'maxStreak' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('currentStreak')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center"
                    title="Current Active Miss Streak"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Current Streak</span>
                      {sortField === 'currentStreak' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('reverseHits')}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-purple-300 transition text-center"
                    title="Reverse Orientation Hits (BA in Draw)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Reverse Hits</span>
                      {sortField === 'reverseHits' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredNumbers.map((item) => {
                  return (
                    <tr
                      key={item.number}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                        #{item.rank}
                      </td>

                      {/* Number Pill */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-700 shadow-sm">
                            {item.number}
                          </span>
                          <span className="text-[10px] text-slate-500" title={`Reverse: ${item.reverseNumber}`}>
                            (Rev: {item.reverseNumber})
                          </span>
                          {item.isSameDigitDouble && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                              Double
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Generated Days */}
                      <td className="py-2.5 px-3 text-center text-slate-200 font-semibold">
                        {item.generatedDays}
                      </td>

                      {/* Actual Hits */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold ${
                            item.actualHits > 0 ? 'text-emerald-400' : 'text-slate-600'
                          }`}
                        >
                          {item.actualHits}
                        </span>
                      </td>

                      {/* Non-Hit Days */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            item.nonHitDays >= 5
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : item.nonHitDays >= 3
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.nonHitDays}
                        </span>
                      </td>

                      {/* Non-Hit % */}
                      <td className="py-2.5 px-3 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-bold ${
                                item.nonHitPercentage === 100
                                  ? 'text-rose-400'
                                  : item.nonHitPercentage >= 70
                                  ? 'text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              {item.nonHitPercentage}%
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {item.nonHitDays}/{item.generatedDays}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                item.nonHitPercentage === 100
                                  ? 'bg-rose-500'
                                  : item.nonHitPercentage >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${item.nonHitPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Max Miss Streak */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold ${
                            item.longestNonHitStreak >= 5
                              ? 'text-rose-400'
                              : item.longestNonHitStreak >= 3
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.longestNonHitStreak}
                        </span>
                      </td>

                      {/* Current Streak */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold ${
                            item.currentNonHitStreak >= 3
                              ? 'text-rose-400'
                              : item.currentNonHitStreak > 0
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.currentNonHitStreak}
                        </span>
                      </td>

                      {/* Reverse Hits */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold ${
                            item.reverseHits > 0 ? 'text-cyan-300' : 'text-slate-600'
                          }`}
                        >
                          {item.reverseHits}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Inspect Occurrences */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setInspectingNumber(item)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] cursor-pointer transition"
                          title="View all historical dates this number was predicted & drawn"
                        >
                          View Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. Deep-Dive Analytical Modules: Reverse Analysis & Streak Rebound Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Module A: Reverse (Palti) Analysis Matrix */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Reverse (Palti) Orientation Divergence Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Evaluates instances where candidate <strong className="text-slate-200">AB</strong> was generated by the theory, but the reverse orientation <strong className="text-cyan-300">BA</strong> appeared in the draw instead.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Direct Hit</div>
                <div className="text-base font-bold text-emerald-400">
                  {report.summaryStats.totalDirectHitsCount}
                </div>
                <div className="text-[10px] text-slate-400">AB Matched</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400 uppercase font-bold">Reverse Hit</div>
                <div className="text-base font-bold text-cyan-300">
                  {report.summaryStats.totalReverseHitsCount}
                </div>
                <div className="text-[10px] text-cyan-400">BA Matched</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-rose-500/30">
                <div className="text-[10px] text-rose-400 uppercase font-bold">Pure Misses</div>
                <div className="text-base font-bold text-rose-400">
                  {report.summaryStats.totalPredictionsCount -
                    report.summaryStats.totalDirectHitsCount -
                    report.summaryStats.totalReverseHitsCount}
                </div>
                <div className="text-[10px] text-rose-300">Neither Hit</div>
              </div>
            </div>

            {report.reverseWinners.length > 0 ? (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[11px] text-slate-400">
                  Top Reversal-Dominant Candidates in Selected Period:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.reverseWinners.slice(0, 10).map((rw) => (
                    <span
                      key={`rw-${rw.number}`}
                      className="px-2 py-1 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 text-xs flex items-center gap-1"
                    >
                      <strong className="text-white">{rw.number}</strong> ➔ {rw.reverseNumber}
                      <span className="text-[10px] text-cyan-400/80">({rw.reverseHits} Rev Hits)</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic text-center py-2">
                No strong reverse-only patterns in this specific window.
              </div>
            )}
          </div>
        </div>

        {/* Module B: Walk-Forward Learning Engine & Signal Integration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Walk-Forward Out-of-Sample Learning Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Evaluates whether persistent prediction-vs-draw divergence contains empirical signals for theory candidate scoring calibration.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Divergence Rating in Period:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  report.learningEngineInsights.divergenceRating === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : report.learningEngineInsights.divergenceRating === 'Moderate'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {report.learningEngineInsights.divergenceRating} Divergence
              </span>
            </div>

            <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-purple-400 font-bold">Signal Summary: </span>
              {report.learningEngineInsights.persistentNonHitSignal}
            </div>

            {report.learningEngineInsights.topDivergentCandidates.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">
                  Persistent Candidates with 0% Draw Conversion:
                </span>
                <div className="flex flex-wrap gap-1">
                  {report.learningEngineInsights.topDivergentCandidates.map((c) => (
                    <span
                      key={`divergent-${c}`}
                      className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/40 text-xs font-bold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Modal / Popover for Inspecting Specific Number Occurrence Timeline */}
      {inspectingNumber && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white px-2.5 py-1 rounded bg-slate-950 border border-purple-500/40">
                  {inspectingNumber.number}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Candidate Occurrence Timeline (Reverse: {inspectingNumber.reverseNumber})
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Generated on {inspectingNumber.generatedDays} days | Direct Hits: {inspectingNumber.actualHits} | Reverse Hits: {inspectingNumber.reverseHits}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingNumber(null)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Metrics Overview in Modal */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Non-Hit Days</div>
                <div className="text-sm font-bold text-rose-400">{inspectingNumber.nonHitDays}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Non-Hit %</div>
                <div className="text-sm font-bold text-slate-200">{inspectingNumber.nonHitPercentage}%</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Max Miss Streak</div>
                <div className="text-sm font-bold text-amber-400">{inspectingNumber.longestNonHitStreak}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Current Streak</div>
                <div className="text-sm font-bold text-purple-400">{inspectingNumber.currentNonHitStreak}</div>
              </div>
            </div>

            {/* Occurrence List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 font-mono">
                Cycle-by-Cycle Occurrences & Target Draw Comparison:
              </div>
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 font-mono text-xs">
                {inspectingNumber.occurrences.map((occ, idx) => (
                  <div
                    key={`occ-${occ.date}-${idx}`}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                      occ.isDirectHit
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : occ.isReverseHit
                        ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-xs">{occ.date}</strong>
                        <span className="text-[10px] text-slate-500">(Source: {occ.sourceDate})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Actual 4 Houses: [DS: {occ.targetHouses[0]}, FB: {occ.targetHouses[1]}, GL: {occ.targetHouses[2]}, GZB: {occ.targetHouses[3]}]
                      </div>
                    </div>

                    <div className="text-right">
                      {occ.isDirectHit ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ✓ Direct Hit ({occ.hitHouses.join(', ')})
                        </span>
                      ) : occ.isReverseHit ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          🔄 Reverse Hit ({occ.hitHouses.join(', ')})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          ✗ Non-Hit (Missed)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectingNumber(null)}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
