import React, { useState, useMemo } from 'react';
import { Currency, CURRENCIES, DayMarketEntry, Market } from '../types';
import {
  generateGSquareHarmonicGrid,
  runGSquareHarmonicsWalkForwardTest,
  GSquareHarmonicSourceMode,
  GSquareHarmonicWalkForwardStep,
  GSquareHarmonicCellEfficacy,
} from '../utils/gSquareHarmonicsEngine';
import {
  Grid,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Search,
  Filter,
  ShieldCheck,
  Send,
  HelpCircle,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface GSquareHarmonicsSectionProps {
  records: DayMarketEntry[];
  currency?: Currency;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

type HarmonicsSubTab = 'walk-forward' | 'grid' | 'cell-heatmap' | 'theory';

export const GSquareHarmonicsSection: React.FC<GSquareHarmonicsSectionProps> = ({
  records,
  currency = 'USD',
  onSendPairsToSimulator,
}) => {
  // Navigation & Sub-tab
  const [activeTab, setActiveTab] = useState<HarmonicsSubTab>('walk-forward');

  // Walk-forward configuration state
  const [sourceMode, setSourceMode] = useState<GSquareHarmonicSourceMode>('auto');
  const [targetMarket, setTargetMarket] = useState<Market | 'ALL'>('ALL');
  const [testWindowDays, setTestWindowDays] = useState<number>(15);
  const [includePalat, setIncludePalat] = useState<boolean>(true);
  const [filterResult, setFilterResult] = useState<'ALL' | 'HIT' | 'MISS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Currency & Stake settings for simulation
  const [stakePerPair, setStakePerPair] = useState<number>(10);
  const [payoutMultiplier, setPayoutMultiplier] = useState<number>(90);

  // Selected date / step for detailed inspection in Grid view
  const [inspectorDate, setInspectorDate] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const currencySymbol = CURRENCIES[currency]?.symbol || '$';

  // Sort records chronologically
  const sortedDates = useMemo(() => {
    const list = (Array.from(new Set(records.map((r) => r.date))) as string[]).sort((a, b) => b.localeCompare(a));
    return list;
  }, [records]);

  // Derive source number for Grid view (either from inspectorDate or latest record)
  const gridSourceData = useMemo(() => {
    let targetEntry: DayMarketEntry | undefined;
    if (inspectorDate) {
      targetEntry = records.find((r) => r.date === inspectorDate);
    }
    if (!targetEntry) {
      targetEntry = [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
    }

    if (!targetEntry) {
      return { number: '47', date: 'Demo', market: 'Gali' };
    }

    let num = '';
    let market = 'Gali';
    if (sourceMode === 'gali' && targetEntry.gali) {
      num = targetEntry.gali;
      market = 'Gali';
    } else if (sourceMode === 'ghaziabad' && (targetEntry.ghaziabad || targetEntry.gzb)) {
      num = targetEntry.ghaziabad || targetEntry.gzb || '';
      market = 'Ghaziabad';
    } else if (sourceMode === 'faridabad' && targetEntry.faridabad) {
      num = targetEntry.faridabad;
      market = 'Faridabad';
    } else if (sourceMode === 'deshawar' && targetEntry.deshawar) {
      num = targetEntry.deshawar;
      market = 'Deshawar';
    } else {
      // Auto
      if (targetEntry.gali) {
        num = targetEntry.gali;
        market = 'Gali';
      } else if (targetEntry.ghaziabad || targetEntry.gzb) {
        num = targetEntry.ghaziabad || targetEntry.gzb || '';
        market = 'Ghaziabad';
      } else if (targetEntry.faridabad) {
        num = targetEntry.faridabad;
        market = 'Faridabad';
      } else if (targetEntry.deshawar) {
        num = targetEntry.deshawar;
        market = 'Deshawar';
      }
    }

    return {
      number: String(num || '47').trim(),
      date: targetEntry.date,
      market,
    };
  }, [records, inspectorDate, sourceMode]);

  // Compute live harmonic grid for inspector view
  const harmonicResult = useMemo(
    () => generateGSquareHarmonicGrid({ sourceNumber: gridSourceData.number }),
    [gridSourceData.number]
  );

  // Compute Walk-Forward Test Report
  const walkForwardReport = useMemo(() => {
    return runGSquareHarmonicsWalkForwardTest({
      records,
      sourceMode,
      targetMarket,
      testWindowDays,
      includePalat,
      stakePerPair,
      payoutMultiplier,
    });
  }, [records, sourceMode, targetMarket, testWindowDays, includePalat, stakePerPair, payoutMultiplier]);

  // Filtered steps for the table
  const filteredSteps = useMemo(() => {
    return walkForwardReport.steps.filter((step) => {
      // Filter by outcome
      if (filterResult === 'HIT' && !step.isHit) return false;
      if (filterResult === 'MISS' && step.isHit) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDate = step.targetDate.toLowerCase().includes(q);
        const matchesPairs = step.straightPairs.some((p) => p.includes(q));
        const matchesWinners = step.winningPairs.some((p) => p.includes(q));
        const matchesMarket = step.hits.some((h) => h.market.toLowerCase().includes(q));
        return matchesDate || matchesPairs || matchesWinners || matchesMarket;
      }

      return true;
    });
  }, [walkForwardReport.steps, filterResult, searchQuery]);

  // Prepare chart data for walk-forward timeline
  const timelineChartData = useMemo(() => {
    // Reverse so chronologically left-to-right (oldest to newest)
    return [...walkForwardReport.steps].reverse().map((step) => ({
      date: step.targetDate.slice(5),
      fullDate: step.targetDate,
      hits: step.hits.length,
      isHit: step.isHit ? 1 : 0,
      dailyProfit: step.dailyNetProfit,
    }));
  }, [walkForwardReport.steps]);

  // Prepare chart data for market breakdown
  const marketChartData = useMemo(() => {
    const markets: Market[] = ['Faridabad', 'Ghaziabad', 'Gali', 'Deshawar'];
    return markets.map((m) => {
      const stats = walkForwardReport.marketBreakdown[m];
      return {
        market: m,
        hits: includePalat ? stats.totalHits : stats.straightHits,
        draws: stats.drawCount,
        rate: stats.hitRate,
      };
    });
  }, [walkForwardReport.marketBreakdown, includePalat]);

  // Copy Walk-Forward Summary to clipboard
  const handleCopySummary = () => {
    const summaryText = [
      `=== G SQUARE HARMONICS WALK-FORWARD TEST REPORT ===`,
      `Evaluated Days: ${walkForwardReport.evaluatedDays}`,
      `Day Hit Rate: ${walkForwardReport.anyHitRate}% (${walkForwardReport.anyHitDays} / ${walkForwardReport.evaluatedDays} days)`,
      `Straight Hit Days: ${walkForwardReport.straightHitDays} (${walkForwardReport.straightHitRate}%)`,
      `Palat (Reverse) Hits: ${walkForwardReport.totalPalatHits}`,
      `Total Draw Hits: ${walkForwardReport.totalStraightHits + (includePalat ? walkForwardReport.totalPalatHits : 0)} / ${walkForwardReport.totalTargetDraws} (${walkForwardReport.drawHitRate}%)`,
      `Winning Streak: Current ${walkForwardReport.currentStreak.type} ${walkForwardReport.currentStreak.count} (Max Win Streak: ${walkForwardReport.maxWinningStreak})`,
      `Simulated Net P&L: ${currencySymbol}${walkForwardReport.roiSimulation.netProfit.toLocaleString()} (${walkForwardReport.roiSimulation.roiPercentage}% ROI)`,
      `Market Accuracy:`,
      ...(Object.keys(walkForwardReport.marketBreakdown) as Market[]).map((m) => {
        const s = walkForwardReport.marketBreakdown[m];
        return ` - ${m}: ${s.hitRate}% (${includePalat ? s.totalHits : s.straightHits}/${s.drawCount} draws)`;
      }),
    ].join('\n');

    navigator.clipboard.writeText(summaryText);
    setCopyFeedback('Summary copied to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Export Walk-Forward step data to CSV
  const handleExportCSV = () => {
    const headers = [
      'Step',
      'Target Date',
      'Source Date',
      'Source Market',
      'Source Number',
      'Base X',
      'Status',
      'Hits Count',
      'Hit Details',
      'Target Draws',
      'Daily Net PnL',
    ];

    const rows = walkForwardReport.steps.map((step) => {
      const hitDetails = step.hits
        .map((h) => `${h.market}:${h.pair}(${h.matchType})`)
        .join('; ');
      const outcomes = step.targetOutcomes.map((o) => `${o.market}:${o.pair}`).join('; ');

      return [
        step.stepIndex,
        step.targetDate,
        step.sourceDate,
        step.sourceMarket,
        step.sourceNumber,
        step.x,
        step.isHit ? 'HIT' : 'MISS',
        step.hits.length,
        `"${hitDetails}"`,
        `"${outcomes}"`,
        step.dailyNetProfit,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `g_square_harmonics_walk_forward_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspectStep = (step: GSquareHarmonicWalkForwardStep) => {
    setInspectorDate(step.sourceDate);
    setActiveTab('grid');
  };

  return (
    <div id="g-square-harmonics-container" className="space-y-6">
      {/* Header Banner */}
      <div
        id="g-square-harmonics-banner"
        className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/40 bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-300">
                <Grid className="w-3.5 h-3.5" />
                Mathematical Matrix Theorem
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                Walk-Forward Tested
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              G Square Harmonics
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Formal 6×4 Harmonic Grid derived from modular ones-digit seed coordinates (A–F × G–J),
              paired with empirical sequential walk-forward backtesting across historical draws.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSendPairsToSimulator && (
              <button
                id="btn-send-harmonic-pairs-simulator"
                type="button"
                onClick={() => onSendPairsToSimulator(harmonicResult.pairs)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/50 bg-violet-600/30 hover:bg-violet-600/50 px-3.5 py-2 text-xs font-semibold text-violet-100 transition shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-violet-300" />
                <span>Send 24 Pairs to Simulator</span>
              </button>
            )}

            <button
              id="btn-copy-harmonic-summary"
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>{copyFeedback || 'Copy Audit'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div id="harmonics-sub-nav" className="mt-6 flex items-center gap-2 border-t border-slate-800/80 pt-4 overflow-x-auto">
          <button
            id="tab-btn-walk-forward"
            type="button"
            onClick={() => setActiveTab('walk-forward')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'walk-forward'
                ? 'bg-violet-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Walk-Forward Empirical Test</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === 'walk-forward' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {walkForwardReport.anyHitRate}%
            </span>
          </button>

          <button
            id="tab-btn-grid"
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'grid'
                ? 'bg-violet-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>6×4 Harmonic Matrix</span>
          </button>

          <button
            id="tab-btn-cell-heatmap"
            type="button"
            onClick={() => setActiveTab('cell-heatmap')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'cell-heatmap'
                ? 'bg-violet-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Cell Hit Heatmap (24 Cells)</span>
          </button>

          <button
            id="tab-btn-theory"
            type="button"
            onClick={() => setActiveTab('theory')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'theory'
                ? 'bg-violet-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Core Theorem & Axioms</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WALK-FORWARD EMPIRICAL TEST */}
      {activeTab === 'walk-forward' && (
        <div id="section-walk-forward" className="space-y-6">
          {/* Controls Bar */}
          <div
            id="walk-forward-controls-bar"
            className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Walk-Forward Parameters & Horizon
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-export-wf-csv"
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Baseline Source Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Baseline Source
                </label>
                <select
                  id="select-harmonic-source-mode"
                  value={sourceMode}
                  onChange={(e) => setSourceMode(e.target.value as GSquareHarmonicSourceMode)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  <option value="auto">Auto (Gali &gt; Gzb &gt; Fbd &gt; Dsw)</option>
                  <option value="gali">Gali Only</option>
                  <option value="ghaziabad">Ghaziabad Only</option>
                  <option value="faridabad">Faridabad Only</option>
                  <option value="deshawar">Deshawar Only</option>
                </select>
              </div>

              {/* Target Market Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Target Outcome Market
                </label>
                <select
                  id="select-harmonic-target-market"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value as Market | 'ALL')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  <option value="ALL">All Markets (Fbd, Gzb, Gali, Dsw)</option>
                  <option value="Faridabad">Faridabad Only</option>
                  <option value="Ghaziabad">Ghaziabad Only</option>
                  <option value="Gali">Gali Only</option>
                  <option value="Deshawar">Deshawar Only</option>
                </select>
              </div>

              {/* Historical Horizon */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Historical Window
                </label>
                <select
                  id="select-harmonic-window"
                  value={testWindowDays}
                  onChange={(e) => setTestWindowDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  <option value={7}>Last 7 Days (Short Cycle)</option>
                  <option value={15}>Last 15 Days (Recommended)</option>
                  <option value={30}>Last 30 Days (Monthly)</option>
                  <option value={0}>All Recorded Days ({records.length} Days)</option>
                </select>
              </div>

              {/* Palat (Reverse) Mode Toggle */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Pair Symmetry
                </label>
                <button
                  id="btn-toggle-palat"
                  type="button"
                  onClick={() => setIncludePalat(!includePalat)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                    includePalat
                      ? 'border-violet-500/60 bg-violet-950/40 text-violet-200'
                      : 'border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  <span>{includePalat ? 'Straight + Palat (48 Pairs)' : 'Straight Only (24 Pairs)'}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      includePalat ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {includePalat ? 'Active' : 'Off'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Executive KPI Summary Cards */}
          <div id="walk-forward-kpis" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Walk-Forward Hit Rate */}
            <div
              id="kpi-card-hit-rate"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Walk-Forward Hit Rate
                </span>
                <span className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-white font-mono">
                  {walkForwardReport.anyHitRate}%
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  ({walkForwardReport.anyHitDays} / {walkForwardReport.evaluatedDays} Days)
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${walkForwardReport.anyHitRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Straight: {walkForwardReport.straightHitRate}%</span>
                  <span>Palat: {walkForwardReport.totalPalatHits} hits</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Draw Hits */}
            <div
              id="kpi-card-draw-hits"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Target Draw Accuracy
                </span>
                <span className="rounded-full bg-violet-500/10 p-1.5 text-violet-400">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-white font-mono">
                  {walkForwardReport.drawHitRate}%
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  ({walkForwardReport.totalStraightHits + (includePalat ? walkForwardReport.totalPalatHits : 0)} / {walkForwardReport.totalTargetDraws} draws)
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Frequency of target market draws landing directly inside the 6×4 Harmonic coordinate field.
              </p>
            </div>

            {/* KPI 3: Streak Performance */}
            <div
              id="kpi-card-streak"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Streak Dynamics
                </span>
                <span className="rounded-full bg-amber-500/10 p-1.5 text-amber-400">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div
                  className={`text-3xl font-black font-mono ${
                    walkForwardReport.currentStreak.type === 'WIN' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {walkForwardReport.currentStreak.count}{' '}
                  <span className="text-base font-bold">{walkForwardReport.currentStreak.type}</span>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>Max Win: {walkForwardReport.maxWinningStreak} days</span>
                <span>Max Loss: {walkForwardReport.maxLosingStreak} days</span>
              </div>
            </div>

            {/* KPI 4: Simulated Risk-Reward ROI */}
            <div
              id="kpi-card-roi"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Simulated ROI (90× Multiplier)
                </span>
                <span className="rounded-full bg-cyan-500/10 p-1.5 text-cyan-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div
                  className={`text-3xl font-black font-mono ${
                    walkForwardReport.roiSimulation.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {walkForwardReport.roiSimulation.netProfit >= 0 ? '+' : ''}
                  {currencySymbol}
                  {Math.abs(walkForwardReport.roiSimulation.netProfit).toLocaleString()}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  ({walkForwardReport.roiSimulation.roiPercentage}%)
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Total Stake: {currencySymbol}{walkForwardReport.roiSimulation.totalStake.toLocaleString()}</span>
                <span>Payout: {currencySymbol}{walkForwardReport.roiSimulation.totalPayout.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Market Accuracy Breakdown Cards */}
          <div id="market-accuracy-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(['Faridabad', 'Ghaziabad', 'Gali', 'Deshawar'] as Market[]).map((m) => {
              const stats = walkForwardReport.marketBreakdown[m];
              const hits = includePalat ? stats.totalHits : stats.straightHits;
              return (
                <div
                  key={m}
                  id={`market-card-${m.toLowerCase()}`}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{m}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {hits} / {stats.drawCount} draws hit
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black font-mono text-violet-300">
                      {stats.hitRate}%
                    </div>
                    <div className="text-[9px] uppercase font-mono text-slate-400">Hit Rate</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row: Performance Timeline & Market Distribution */}
          <div id="charts-row" className="grid gap-4 lg:grid-cols-2">
            {/* Timeline Bar Chart */}
            <div
              id="chart-timeline-container"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Daily Walk-Forward Hit Timeline</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Green = Hit Day (≥1 draw matched) • Red = Miss Day
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {timelineChartData.length} Steps
                </span>
              </div>

              <div className="h-52 w-full">
                {timelineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(val: any, name: string) => [
                          name === 'hits' ? `${val} Hits` : val,
                          'Hits Detected',
                        ]}
                        labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                      />
                      <Bar dataKey="hits" radius={[4, 4, 0, 0]}>
                        {timelineChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.hits > 0 ? '#10b981' : '#f43f5e'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400 font-mono">
                    Insufficient historical data for timeline visualization
                  </div>
                )}
              </div>
            </div>

            {/* Market Distribution Chart */}
            <div
              id="chart-market-container"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Market-by-Market Hit Distribution</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Absolute hits captured across the 4 major houses
                  </p>
                </div>
                <span className="text-xs font-mono text-violet-400">
                  {walkForwardReport.totalStraightHits + (includePalat ? walkForwardReport.totalPalatHits : 0)} Total Hits
                </span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="market" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(val: any, name: string, item: any) => [
                        `${val} Hits (${item.payload.rate}%)`,
                        'Hits',
                      ]}
                    />
                    <Bar dataKey="hits" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Walk-Forward Step Replay Audit Table */}
          <div
            id="walk-forward-table-container"
            className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 font-mono">
                  Empirical Verification Log
                </span>
                <h3 className="text-base font-bold text-white">
                  Step-by-Step Walk-Forward Replay Log ({filteredSteps.length} Steps)
                </h3>
              </div>

              {/* Table search & outcome filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    id="input-wf-search"
                    type="text"
                    placeholder="Search date, pair..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none w-44 sm:w-56"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setFilterResult('ALL')}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      filterResult === 'ALL' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterResult('HIT')}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      filterResult === 'HIT' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Wins
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterResult('MISS')}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      filterResult === 'MISS' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Misses
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-3">Step / Date</th>
                    <th className="py-2.5 px-3">Source Draw</th>
                    <th className="py-2.5 px-3">Base X</th>
                    <th className="py-2.5 px-3">Actual Results</th>
                    <th className="py-2.5 px-3">Detected Hits</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3 text-right">Net P&L</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSteps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No walk-forward steps matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSteps.map((step) => (
                      <tr
                        key={step.stepIndex}
                        className={`transition hover:bg-slate-800/40 ${
                          step.isHit ? 'bg-emerald-950/10' : ''
                        }`}
                      >
                        {/* Step & Date */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-200">{step.targetDate}</div>
                          <div className="text-[10px] text-slate-400">Step #{step.stepIndex}</div>
                        </td>

                        {/* Source Draw */}
                        <td className="py-3 px-3">
                          <div className="text-slate-300 font-medium">
                            <span className="text-violet-300">{step.sourceMarket}</span>:{' '}
                            <span className="font-bold text-white">{step.sourceNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{step.sourceDate}</div>
                        </td>

                        {/* Base X */}
                        <td className="py-3 px-3">
                          <span className="inline-block rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-300">
                            X = {step.x}
                          </span>
                        </td>

                        {/* Actual Results */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {step.targetOutcomes.map((out) => {
                              const isHit = step.hits.some(
                                (h) => h.market === out.market && h.pair === out.pair
                              );
                              return (
                                <span
                                  key={out.market}
                                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                                    isHit
                                      ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-200 font-bold'
                                      : 'border border-slate-700 bg-slate-800/60 text-slate-400'
                                  }`}
                                  title={`${out.market}: ${out.pair}`}
                                >
                                  {out.market.slice(0, 3)}: {out.pair}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Detected Hits */}
                        <td className="py-3 px-3">
                          {step.hits.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {step.hits.map((h, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300"
                                >
                                  <span>{h.market}:</span>
                                  <span className="text-white">{h.pair}</span>
                                  <span className="text-[9px] text-emerald-400 opacity-80">
                                    [{h.matchType === 'STRAIGHT' ? h.cellKey : 'Palat'}]
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Result Status */}
                        <td className="py-3 px-3">
                          {step.isHit ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              HIT ({step.hits.length})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              MISS
                            </span>
                          )}
                        </td>

                        {/* Net Day P&L */}
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-bold ${
                              step.dailyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {step.dailyNetProfit >= 0 ? '+' : ''}
                            {currencySymbol}
                            {step.dailyNetProfit.toLocaleString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-inspect-step-${step.stepIndex}`}
                              type="button"
                              onClick={() => handleInspectStep(step)}
                              title="Inspect this step in 6×4 Grid"
                              className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-300 transition cursor-pointer"
                            >
                              Inspect Grid
                            </button>
                            {onSendPairsToSimulator && (
                              <button
                                id={`btn-send-step-${step.stepIndex}`}
                                type="button"
                                onClick={() => onSendPairsToSimulator(step.straightPairs)}
                                title="Send 24 straight pairs to Simulator"
                                className="rounded border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/40 px-2 py-1 text-[10px] text-violet-200 transition cursor-pointer"
                              >
                                Send Sim
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

      {/* TAB 2: 6×4 HARMONIC MATRIX & INSPECTOR */}
      {activeTab === 'grid' && (
        <div id="section-grid" className="space-y-6">
          {/* Source Selector Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 text-violet-300">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-slate-400">Current Grid Source</div>
                <div className="text-sm font-bold text-white">
                  {gridSourceData.market}:{' '}
                  <span className="font-mono text-violet-300">{gridSourceData.number}</span> on{' '}
                  <span className="text-slate-300">{gridSourceData.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mr-2">
                  Select Historical Date:
                </label>
                <select
                  id="select-inspector-date"
                  value={inspectorDate || sortedDates[0] || ''}
                  onChange={(e) => setInspectorDate(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                >
                  {sortedDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              {onSendPairsToSimulator && (
                <button
                  type="button"
                  onClick={() => onSendPairsToSimulator(harmonicResult.pairs)}
                  className="rounded-xl border border-violet-500/40 bg-violet-600/30 hover:bg-violet-600/50 px-3 py-1.5 text-xs font-semibold text-violet-200 transition cursor-pointer"
                >
                  Send 24 Pairs to Sim
                </button>
              )}
            </div>
          </div>

          {/* Coordinate Vectors Display */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white">
                  Vertical Axis V (6 Digits): Rows A to F
                </h3>
                <span className="text-xs font-mono text-cyan-300 font-bold">X = {harmonicResult.x}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {harmonicResult.verticalDigits.map((v) => (
                  <div
                    key={v.key}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center"
                  >
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{v.key} Row</div>
                    <div className="text-base font-black text-cyan-400">{v.value}</div>
                    <div className="text-[9px] text-slate-400 truncate">{v.formula}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white">
                  Horizontal Axis H (4 Digits): Columns G to J
                </h3>
                <span className="text-xs font-mono text-emerald-300 font-bold">X = {harmonicResult.x}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {harmonicResult.horizontalDigits.map((h) => (
                  <div
                    key={h.key}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center"
                  >
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{h.key} Column</div>
                    <div className="text-base font-black text-emerald-400">{h.value}</div>
                    <div className="text-[9px] text-slate-400 truncate">{h.formula}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Interactive Live 6×4 Grid Table */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
              <div>
                <h3 className="text-lg font-bold text-white">Live 6×4 G-Square Harmonic Grid</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Coordinate Formula: Pair = 10·V(Row) + H(Col) • Total: 24 active pairs
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Source: {gridSourceData.number} ({gridSourceData.market})
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-700 bg-slate-800 px-4 py-3 text-slate-300 font-bold text-left">
                      V \ H
                    </th>
                    {harmonicResult.horizontalDigits.map((horizontal) => (
                      <th
                        key={horizontal.key}
                        className="border border-slate-700 bg-slate-800 px-4 py-3 text-center text-slate-300 font-mono"
                      >
                        <div className="font-bold text-emerald-300">{horizontal.key}</div>
                        <div className="text-[10px] text-slate-400 font-normal">val: {horizontal.value}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {harmonicResult.verticalDigits.map((vertical) => (
                    <tr key={vertical.key} className="hover:bg-slate-800/30">
                      <td className="border border-slate-700 bg-slate-800 px-4 py-3 font-bold text-violet-200">
                        <div className="text-violet-300">{vertical.key}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          val: {vertical.value}
                        </div>
                      </td>
                      {harmonicResult.horizontalDigits.map((horizontal) => {
                        const match = harmonicResult.cells.find(
                          (cell) => cell.rowKey === vertical.key && cell.colKey === horizontal.key
                        );
                        return (
                          <td
                            key={`${vertical.key}-${horizontal.key}`}
                            className="border border-slate-700 bg-slate-950/50 px-4 py-3 text-center"
                          >
                            <div className="text-base sm:text-lg font-mono font-black text-slate-100">
                              {match?.pair ?? '00'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              rev: {match?.reversePair ?? '00'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Generated Pairs Array Pills */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Straight 24 Pairs Set:</span>
                <span>{harmonicResult.pairs.length} numbers</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {harmonicResult.pairs.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-mono font-bold text-violet-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: CELL HIT HEATMAP (24 CELLS EFFICACY) */}
      {activeTab === 'cell-heatmap' && (
        <div id="section-cell-heatmap" className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-2">
            <h3 className="text-lg font-bold text-white">6×4 Harmonic Matrix Cell Efficacy Heatmap</h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              Historical distribution of hits mapped onto each cell coordinate (Rows A–F × Columns G–J)
              across the walk-forward evaluation period. Identifies harmonic hot zones.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {walkForwardReport.cellEfficacy.map((cell) => {
              const heatIntensity =
                cell.totalHits > 4
                  ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                  : cell.totalHits > 2
                  ? 'border-violet-500/40 bg-violet-950/30 text-violet-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300';

              return (
                <div
                  key={cell.cellKey}
                  className={`rounded-xl border p-4 shadow-sm space-y-2 transition ${heatIntensity}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono uppercase">
                      Cell {cell.cellKey}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {cell.pairFormula}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-black font-mono">
                      {cell.totalHits}{' '}
                      <span className="text-xs font-normal text-slate-400">Hits</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {cell.hitRate}%
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-1.5">
                    <span>Straight: {cell.straightHits}</span>
                    <span>Palat: {cell.palatHits}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CORE THEOREM & AXIOMS */}
      {activeTab === 'theory' && (
        <div id="section-theory" className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
              Mathematical Foundation
            </h3>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                1. <strong className="text-white">Seed Extraction (X):</strong> Take the ones-place digit of the chosen benchmark market result (typically yesterday's Gali or Ghaziabad).
              </p>
              <p>
                2. <strong className="text-white">Vertical Vector V:</strong> 6 modular steps:
                <br />
                <span className="font-mono text-cyan-300 text-xs pl-3 inline-block">
                  A = (X - 1) mod 10 • B = X • C = (X + 1) mod 10
                  <br />
                  D = (X + 4) mod 10 • E = (X + 5) mod 10 • F = (X + 6) mod 10
                </span>
              </p>
              <p>
                3. <strong className="text-white">Horizontal Vector H:</strong> 4 modular steps:
                <br />
                <span className="font-mono text-emerald-300 text-xs pl-3 inline-block">
                  G = (X - 2) mod 10 • H = (X - 3) mod 10 • I = (X + 2) mod 10 • J = (X + 3) mod 10
                </span>
              </p>
              <p>
                4. <strong className="text-white">Pair Formulation:</strong> Every cell (i, j) creates a 2-digit number <span className="font-mono text-violet-300">10·V[i] + H[j]</span>, producing exactly 24 straight coordinates.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
              Walk-Forward Testing Methodology
            </h3>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Sequential Out-Of-Sample Evaluation:</strong> For every date <span className="font-mono text-amber-300">t</span> in the historical sequence, only data up to date <span className="font-mono text-amber-300">t-1</span> is used to generate the 24 harmonic pairs.
              </p>
              <p>
                <strong className="text-white">Zero Lookahead Bias:</strong> The model never trains or peeks at the target day outcomes when generating predictions.
              </p>
              <p>
                <strong className="text-white">Risk-Reward Audit:</strong> Assumes a standard payout of 90× gross on winning hits to evaluate empirical viability across long horizons.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
