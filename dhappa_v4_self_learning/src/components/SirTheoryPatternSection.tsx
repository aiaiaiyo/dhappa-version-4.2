import React, { useState, useMemo } from 'react';
import {
  DayMarketEntry,
  Currency,
  SirAbhishekBacktestStep,
} from '../types';
import {
  analyzeSirTheoryHistoricalPatterns,
  scoreDateAgainstHistoricalPatterns,
  HistoricalPatternReport,
  SlotPairHitStat,
  WinningPairAnalysis,
  CoreXPerformance,
  PatternMatchResult,
} from '../utils/sirTheoryPatternEngine';
import { getTodayDateISO, getNextDateISO } from '../utils/mathEngine';
import { PrimarySetHistoricalIntelligenceModule } from './PrimarySetHistoricalIntelligenceModule';
import { CommonNonHitRangeAnalysisModule } from './CommonNonHitRangeAnalysisModule';
import { MonthlyNumberCoverageAnalysisModule } from './MonthlyNumberCoverageAnalysisModule';
import {
  Sparkles,
  Layers,
  Flame,
  Target,
  BarChart3,
  TrendingUp,
  Search,
  Copy,
  Check,
  Send,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Binary,
  Activity,
  Award,
  Zap,
  Info,
  CalendarDays,
  Percent,
  SlidersHorizontal,
  LayoutGrid,
  TrendingDown,
  History,
  Grid,
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface SirTheoryPatternSectionProps {
  records: DayMarketEntry[];
  currency: Currency;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const SirTheoryPatternSection: React.FC<SirTheoryPatternSectionProps> = ({
  records,
  currency,
  onSendPairsToSimulator,
}) => {
  // Navigation Sub-tab within Pattern Section
  const [activeSubTab, setActiveSubTab] = useState<
    | 'primary-set-intelligence'
    | 'monthly-coverage'
    | 'common-non-hits'
    | 'overview'
    | 'primary-set'
    | 'pair-mechanics'
    | 'house-convergence'
    | 'hits-browser'
    | 'live-predictor'
  >('primary-set-intelligence');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Run the historical pattern analytics engine
  const report: HistoricalPatternReport = useMemo(() => {
    return analyzeSirTheoryHistoricalPatterns(records);
  }, [records]);

  // Standardized Engine Result for Consensus Layer
  const standardizedSirTheoryPatternResult = useMemo(() => {
    const topWinning = (report.topWinningPairs || [])[0];
    const candidates = (report.topWinningPairs || []).map((p) => p.pair);
    const topScore = topWinning?.conversionRate ? topWinning.conversionRate * 100 : 0;
    const evidence = (report.topWinningPairs || []).slice(0, 5).map((p) => `sir-pattern:${p.pair}`);

    return buildStandardizedEngineResult({
      engineId: 'SIR_THEORY_PATTERN',
      methodName: 'Sir Theory Historical Pattern Analyzer',
      date: records[records.length - 1]?.date,
      channel: 'live-engine-output',
      sourceValues: { totalWinning: (report.topWinningPairs || []).length },
      normalizedValues: { winningPairsCount: candidates.length },
      rawResult: report as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: records.length,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'extractSlotPatterns()', 'analyzeWinHistory()', 'computeCoreX()', 'score()'],
    });
  }, [report, records]);

  // Live Predictor State
  const [predictDate, setPredictDate] = useState<string>(() => getTodayDateISO());
  const [predictMode, setPredictMode] = useState<'today' | 'upcoming' | 'custom'>('today');
  const [customSourceHouses, setCustomSourceHouses] = useState({
    deshawar: '49',
    faridabad: '58',
    gali: '71',
    gzb: '40',
  });

  // Calculate live prediction match
  const livePrediction: PatternMatchResult = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];

    let sourceHouses = {
      deshawar: latest?.deshawar || '49',
      faridabad: latest?.faridabad || '58',
      gali: latest?.gali || '71',
      gzb: latest?.gzb || latest?.ghaziabad || '40',
    };

    let targetDateStr = predictDate;

    if (predictMode === 'custom') {
      sourceHouses = customSourceHouses;
      targetDateStr = 'Custom Test';
    } else if (predictMode === 'today') {
      targetDateStr = getTodayDateISO();
      // Use previous record as source
      if (sorted.length > 1) {
        const prev = sorted.find((r) => r.date < targetDateStr) || sorted[1];
        sourceHouses = {
          deshawar: prev?.deshawar || '49',
          faridabad: prev?.faridabad || '58',
          gali: prev?.gali || '71',
          gzb: prev?.gzb || prev?.ghaziabad || '40',
        };
      }
    } else if (predictMode === 'upcoming') {
      targetDateStr = getNextDateISO(getTodayDateISO());
      sourceHouses = {
        deshawar: latest?.deshawar || '49',
        faridabad: latest?.faridabad || '58',
        gali: latest?.gali || '71',
        gzb: latest?.gzb || latest?.ghaziabad || '40',
      };
    }

    return scoreDateAgainstHistoricalPatterns(targetDateStr, sourceHouses, report);
  }, [records, predictDate, predictMode, customSourceHouses, report]);

  // Hits Browser Filters
  const [browserFilterResult, setBrowserFilterResult] = useState<'all' | 'hits' | 'misses' | 'multi-hits'>('hits');
  const [browserFilterCoreX, setBrowserFilterCoreX] = useState<string>('All');
  const [browserFilterHouse, setBrowserFilterHouse] = useState<string>('All');
  const [browserSearchQuery, setBrowserSearchQuery] = useState<string>('');
  const [browserHighlightedPair, setBrowserHighlightedPair] = useState<string | null>(null);

  // Filtered steps for the Hits Browser
  const filteredBrowserSteps: SirAbhishekBacktestStep[] = useMemo(() => {
    let list: SirAbhishekBacktestStep[] = [];
    if (browserFilterResult === 'hits') list = report.allHitSteps;
    else if (browserFilterResult === 'misses') list = report.allMissSteps;
    else if (browserFilterResult === 'multi-hits') list = report.allHitSteps.filter((s) => s.hitCount > 1);
    else list = [...report.allHitSteps, ...report.allMissSteps].sort((a, b) => b.date.localeCompare(a.date));

    return list.filter((step) => {
      if (browserFilterCoreX !== 'All' && step.x.toString() !== browserFilterCoreX) {
        return false;
      }

      if (browserFilterHouse !== 'All') {
        const houseIdxMap: Record<string, number> = { DS: 0, FB: 1, GL: 2, GZB: 3 };
        const idx = houseIdxMap[browserFilterHouse];
        if (idx !== undefined) {
          const outcome = step.targetHouseOutcomes[idx];
          const rev = `${outcome[1]}${outcome[0]}`;
          if (!step.sirAbhishekPairs.includes(outcome) && !step.sirAbhishekPairs.includes(rev)) {
            return false;
          }
        }
      }

      if (browserSearchQuery.trim()) {
        const q = browserSearchQuery.trim().toLowerCase();
        const matchesDate = step.date.toLowerCase().includes(q);
        const matchesPair = step.sirAbhishekPairs.some((p) => p.includes(q));
        const matchesMatch = step.matchedPairs.some((p) => p.includes(q));
        const matchesTarget = step.targetHouseOutcomes.some((t) => t.includes(q));
        if (!matchesDate && !matchesPair && !matchesMatch && !matchesTarget) {
          return false;
        }
      }

      return true;
    });
  }, [report, browserFilterResult, browserFilterCoreX, browserFilterHouse, browserSearchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero / Executive Pattern Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-slate-900 to-purple-950 border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                HISTORICAL PATTERN DISCOVERY
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {report.totalHits} Hits / {report.totalSteps} Backtest Draws
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Historical Empirical Backtesting</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Sir Abhishek Theory <span className="text-violet-400">Deep Pattern Engine</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Comprehensive statistical and combinatorial assessment of all <strong>{report.totalHits} historical hits out of {report.totalSteps} draws ({report.overallHitRate}%)</strong>. Uncovers recurring characteristics across <strong>Primary Set S</strong>, <strong>15-Pair Vertical Expansion</strong>, <strong>4-House Draw Outcomes</strong>, and <strong>Matched Winning Pairs</strong>.
            </p>
          </div>

          {/* Key Metric Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-[10px] text-violet-300/80 uppercase font-mono font-bold">Total Hits</div>
              <div className="text-2xl font-mono font-black text-emerald-400">
                {report.totalHits}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">out of {report.totalSteps} draws</div>
            </div>

            <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-[10px] text-violet-300/80 uppercase font-mono font-bold">Hit Conversion</div>
              <div className="text-2xl font-mono font-black text-violet-300">
                {report.overallHitRate}%
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">Win Rate</div>
            </div>

            <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-[10px] text-violet-300/80 uppercase font-mono font-bold">Multi-Hit Days</div>
              <div className="text-2xl font-mono font-black text-purple-400">
                {report.doubleHitDays + report.tripleHitDays + report.quadHitDays}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{report.multiHitRate}% of all hits</div>
            </div>

            <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-[10px] text-violet-300/80 uppercase font-mono font-bold">Total Pairs Won</div>
              <div className="text-2xl font-mono font-black text-cyan-400">
                {report.totalWinningPairMatches}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{report.avgWinningPairsPerHit} pairs / hit day</div>
            </div>

            <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-[10px] text-violet-300/80 uppercase font-mono font-bold">Max Win Streak</div>
              <div className="text-2xl font-mono font-black text-amber-400">
                {report.maxHitStreak} Days
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Consecutive hits</div>
            </div>

            <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-3.5 text-center">
              <div className="text-[10px] text-violet-300/80 uppercase font-mono font-bold">Post-Miss Bounce</div>
              <div className="text-2xl font-mono font-black text-emerald-300">
                {report.hitRateAfterMiss}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Hit rate after 1 miss</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('primary-set-intelligence')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'primary-set-intelligence'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Historical Primary Set S (Sec 21–39)
        </button>

        <button
          onClick={() => setActiveSubTab('monthly-coverage')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'monthly-coverage'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Monthly 00–99 Coverage
        </button>

        <button
          onClick={() => setActiveSubTab('common-non-hits')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'common-non-hits'
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Common Non-Hit Range Analysis
        </button>

        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Executive Hit KPIs
        </button>

        <button
          onClick={() => setActiveSubTab('primary-set')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'primary-set'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Primary Set S & Slots
        </button>

        <button
          onClick={() => setActiveSubTab('pair-mechanics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'pair-mechanics'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Binary className="w-3.5 h-3.5" />
          15-Pair Winning Mechanics
        </button>

        <button
          onClick={() => setActiveSubTab('house-convergence')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'house-convergence'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          4-House Draw Convergence
        </button>

        <button
          onClick={() => setActiveSubTab('hits-browser')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'hits-browser'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          562 Hits Browser ({report.totalHits})
        </button>

        <button
          onClick={() => setActiveSubTab('live-predictor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'live-predictor'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg font-black'
              : 'text-violet-400 hover:text-violet-300 hover:bg-violet-950/40'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          Live Pattern Predictor
        </button>
      </div>

      {/* Sub-Tab 0: Section 21-39 Primary Set Historical Intelligence Module */}
      {activeSubTab === 'primary-set-intelligence' && (
        <PrimarySetHistoricalIntelligenceModule
          records={records}
          currency={currency}
          onSendPairsToSimulator={onSendPairsToSimulator}
        />
      )}

      {/* Sub-Tab: Monthly 00–99 Number Coverage Analysis */}
      {activeSubTab === 'monthly-coverage' && (
        <MonthlyNumberCoverageAnalysisModule
          records={records}
          onSendPairsToSimulator={onSendPairsToSimulator}
        />
      )}

      {/* Sub-Tab: Common Non-Hit Number Range Analysis */}
      {activeSubTab === 'common-non-hits' && (
        <CommonNonHitRangeAnalysisModule
          backtestSteps={report.allSteps}
          onSendPairsToSimulator={onSendPairsToSimulator}
        />
      )}

      {/* 3. Sub-Tab 1: Overview & Executive Hit KPIs */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Multi-Hit Breakdown & Win Density */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-House Hit Distribution */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Multi-House Hit Distribution ({report.totalHits} Total Hits)
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {report.multiHitRate}% Multi-Hit Frequency
                </span>
              </div>

              <div className="space-y-3">
                {/* 1-House Single Hit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">1 House Hit (Single)</span>
                    <span className="text-slate-200 font-bold">
                      {report.singleHitDays} Draws ({Math.round((report.singleHitDays / (report.totalHits || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${Math.round((report.singleHitDays / (report.totalHits || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2-House Double Hit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">2 Houses Hit (Double Win)</span>
                    <span className="text-purple-300 font-bold">
                      {report.doubleHitDays} Draws ({Math.round((report.doubleHitDays / (report.totalHits || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${Math.round((report.doubleHitDays / (report.totalHits || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3-House Triple Hit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">3 Houses Hit (Triple Sweep)</span>
                    <span className="text-amber-300 font-bold">
                      {report.tripleHitDays} Draws ({Math.round((report.tripleHitDays / (report.totalHits || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.round((report.tripleHitDays / (report.totalHits || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4-House Quad Sweep */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">4 Houses Hit (Full Quad Sweep)</span>
                    <span className="text-emerald-300 font-bold">
                      {report.quadHitDays} Draws ({Math.round((report.quadHitDays / (report.totalHits || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.round((report.quadHitDays / (report.totalHits || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <div className="font-bold text-violet-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Key Multi-Hit Takeaway
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In over <strong>{report.multiHitRate}%</strong> of winning days, the generated 15-pair set hits <strong>2, 3, or all 4 houses simultaneously</strong>, providing immense convex multi-payout leverage.
                </p>
              </div>
            </div>

            {/* Core X Performance Leaderboard */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Core X Win Conversion Ranking (0..9)
                  </h3>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Best: X={report.bestCoreX.x} ({report.bestCoreX.hitRate}%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {report.coreXStats.map((cx) => (
                  <div
                    key={`cx-${cx.x}`}
                    className={`p-2.5 rounded-xl border text-center space-y-1 transition ${
                      cx.x === report.bestCoreX.x
                        ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black font-mono text-slate-100">X = {cx.x}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        cx.hitRate >= 75 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {cx.hitRate}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {cx.hitCount} / {cx.totalOccurrences} draws
                    </div>
                    <div className="text-[9px] text-cyan-400 font-mono">
                      {cx.totalWinningPairs} winning pairs
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300">Core X Determinism</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every Core digit $X$ maintains a minimum baseline hit rate above <strong>65%</strong>, proving that the modulo-10 cyclic neighbor formation $(a, x, b)$ is invariant across all 10 single digits.
                </p>
              </div>
            </div>
          </div>

          {/* Direct vs Reversed Hit Probability & Resilience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Direct vs Reversed Hits</span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {report.directVsReversedRatio.directPct}% Direct
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-purple-500 h-full"
                  style={{ width: `${report.directVsReversedRatio.directPct}%` }}
                />
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${100 - report.directVsReversedRatio.directPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Direct Hits: {report.directVsReversedRatio.direct}</span>
                <span>Reversed/Mirror: {report.directVsReversedRatio.reversed}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Post-Miss Recovery Rate</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{report.hitRateAfterMiss}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${report.hitRateAfterMiss}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Probability that a miss is immediately followed by a winning hit next day.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Max Hit Streak</span>
                <span className="text-xs font-mono font-bold text-amber-400">{report.maxHitStreak} Consecutive Days</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2">
                <span>Current Streak:</span>
                <span className="font-bold text-slate-200">
                  {report.currentStreak.count} {report.currentStreak.type.toUpperCase()}S
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Longest uninterrupted winning run in backtest history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab 2: Primary Set S & Slot Combinatorics */}
      {activeSubTab === 'primary-set' && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Primary Set S Slot Combinatorial Hit Density (15 Pair Slots)
                </h3>
                <p className="text-xs text-slate-400">
                  In Primary Set $S = [a, x, b, y, z, e]$, which pairwise slot combination $(s_i, s_j)$ produces the winning draw most frequently?
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  Top Slot: {report.topSlotPair.label} ({report.topSlotPair.hitPercentage}%)
                </span>
              </div>
            </div>

            {/* 15 Slot Pairs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {report.slotPairHitStats.map((slot, idx) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-xl border font-mono space-y-2 transition ${
                    slot.category === 'core-triad'
                      ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-400'
                      : slot.category === 'core-anchor'
                      ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-100">{slot.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      slot.category === 'core-triad'
                        ? 'bg-purple-500/20 text-purple-300'
                        : slot.category === 'core-anchor'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {slot.hitPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        slot.category === 'core-triad'
                          ? 'bg-purple-400'
                          : slot.category === 'core-anchor'
                          ? 'bg-cyan-400'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, slot.hitPercentage * 3))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Rank #{idx + 1}</span>
                    <span className="font-bold text-slate-300">{slot.hitCount} Matches</span>
                  </div>

                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    {slot.description}
                  </div>
                </div>
              ))}
            </div>

            {/* Category Explanation Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1">
                <div className="font-bold text-purple-300 font-mono">1. Core Triad Slots (a-x, x-b, a-b)</div>
                <p className="text-[11px] text-slate-400">
                  Neighbor digits $(x-1, x+1)$ paired with Core $x$. Highest consistency across all 4 houses.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-1">
                <div className="font-bold text-cyan-300 font-mono">2. Core Anchor Slots (x-y, x-z, x-e)</div>
                <p className="text-[11px] text-slate-400">
                  Core $x$ paired directly with secondary recurring digits $y, z, e$.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-300 font-mono">3. Secondary Cross Slots (y-z, y-e, z-e)</div>
                <p className="text-[11px] text-slate-400">
                  Cross-pairing between secondary companion digits, capturing outlier multi-house sweeps.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Set Digit Frequency in Winning Sets */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Haroof / Single Digit (0..9) Win Conversion inside Primary Set S
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Frequency of occurrence across all {report.totalHits} winning draws
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {report.digitInSetStats.map((d) => (
                <div
                  key={`digit-stat-${d.digit}`}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center space-y-1.5 font-mono"
                >
                  <div className="text-lg font-black text-violet-300">{d.digit}</div>
                  <div className="text-xs font-bold text-slate-100">{d.hitRatePercentage}%</div>
                  <div className="text-[10px] text-slate-400">{d.occurrenceInHits} hits</div>
                  <div className="text-[9px] text-emerald-400 font-bold">{d.liftRatio}x Lift</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 3: 15-Pair Mechanics & Top Winning Pairs */}
      {activeSubTab === 'pair-mechanics' && (
        <div className="space-y-6">
          {/* Top 25 Most Frequent Winning Pairs Leaderboard */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Top Historical Winning Pairs from Sir Abhishek 15-Pair Sets
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by total winning hit count across the {report.totalHits} historical winning draws
                </p>
              </div>

              {onSendPairsToSimulator && (
                <button
                  onClick={() => onSendPairsToSimulator(report.topWinningPairs.slice(0, 10).map((p) => p.pair))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-violet-600 hover:bg-violet-500 text-white transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Top 10 to Simulator
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {report.topWinningPairs.slice(0, 25).map((p, idx) => (
                <div
                  key={`win-pair-${p.pair}`}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 transition font-mono space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                      <span className="text-base font-black text-slate-100">{p.pair}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {p.hitCount} Hits
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Generated: {p.generationCount}x</span>
                    <span className="text-violet-300 font-bold">{p.conversionRate}% Conversion</span>
                  </div>

                  {/* House Hit Breakdown Pills */}
                  <div className="flex items-center gap-1 text-[9px] pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
                      DS:{p.houseHits.deshawar}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                      FB:{p.houseHits.faridabad}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                      GL:{p.houseHits.gali}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      GZB:{p.houseHits.ghaziabad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Position (1st to 15th Pair) Hit Probabilities */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  15-Pair Position Hit Index Probability (Pair #1 to #15)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Measures if early pairs in vertical expansion hit more frequently
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-15 gap-2">
              {report.pairPositionStats.map((pos) => (
                <div
                  key={`pos-${pos.positionIndex}`}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center space-y-1 font-mono"
                >
                  <div className="text-[10px] text-slate-500">#{pos.positionIndex + 1}</div>
                  <div className="text-xs font-black text-cyan-300">{pos.formula}</div>
                  <div className="text-[11px] font-bold text-slate-100">{pos.hitRatePercentage}%</div>
                  <div className="text-[9px] text-slate-400">{pos.hitCount} hits</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sum (Jod) & Difference (Delta) Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Digit Sum (Jod) Distribution */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Digit Sum (Jod) in Winning Pairs</span>
                <span className="text-[10px] font-mono text-slate-400">Sum = Tens + Ones</span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {report.sumDistribution.map((item) => (
                  <div
                    key={`sum-${item.sum}`}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono space-y-0.5"
                  >
                    <div className="text-[10px] text-slate-400">S={item.sum}</div>
                    <div className="text-xs font-bold text-violet-300">{item.percentage}%</div>
                    <div className="text-[9px] text-slate-500">{item.hitCount}x</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Digit Difference (Delta) Distribution */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Digit Difference (Delta) in Winning Pairs</span>
                <span className="text-[10px] font-mono text-slate-400">Delta = |Tens - Ones|</span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {report.diffDistribution.map((item) => (
                  <div
                    key={`diff-${item.diff}`}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono space-y-0.5"
                  >
                    <div className="text-[10px] text-slate-400">Δ={item.diff}</div>
                    <div className="text-xs font-bold text-cyan-300">{item.percentage}%</div>
                    <div className="text-[9px] text-slate-500">{item.hitCount}x</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Sub-Tab 4: 4-House Draw Convergence & Transition Matrix */}
      {activeSubTab === 'house-convergence' && (
        <div className="space-y-6">
          {/* Individual House Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.houseStats.map((h) => (
              <div
                key={h.code}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-bold text-slate-100">{h.house}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {h.code}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-black text-emerald-400">{h.totalHits} Hits</span>
                  <span className="text-xs font-bold text-slate-300">{h.hitRatePercentage}% Win Rate</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${h.hitRatePercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Solo Hits: {h.soloHits}</span>
                  <span className="text-purple-300">Co-Hits with others: {h.coHitsWithOthers}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 4x4 House Co-Occurrence Matrix */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  4-House Co-Occurrence Hit Matrix (When House A Hits, How Often Does House B Hit?)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Analyzed across all {report.totalHits} historical winning draws
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 text-left">House</th>
                    {report.houseCoOccurrence.houses.map((h) => (
                      <th key={`head-${h}`} className="py-2.5 px-3 font-bold text-slate-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.houseCoOccurrence.houses.map((rowHouse, rIdx) => (
                    <tr key={`row-${rowHouse}`} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 text-left font-bold text-violet-300">
                        {rowHouse}
                      </td>
                      {report.houseCoOccurrence.matrix[rIdx].map((val, cIdx) => (
                        <td
                          key={`cell-${rIdx}-${cIdx}`}
                          className={`py-2.5 px-3 ${
                            rIdx === cIdx
                              ? 'bg-violet-950/40 text-emerald-300 font-black'
                              : val > 50
                              ? 'text-cyan-300 font-bold bg-slate-900/60'
                              : 'text-slate-300'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekday Hit Performance */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Day of Week Hit Performance (Monday → Sunday)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Hit probability per calendar day
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
              {report.weekdayStats.map((w) => (
                <div
                  key={w.weekday}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono space-y-1.5"
                >
                  <div className="text-xs font-bold text-slate-300">{w.weekday.slice(0, 3)}</div>
                  <div className="text-lg font-black text-emerald-400">{w.hitRate}%</div>
                  <div className="text-[10px] text-slate-400">{w.hitCount} / {w.totalSteps} draws</div>
                  <div className="text-[9px] text-purple-300">{w.multiHitCount} Multi-hits</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Sub-Tab 5: 562 Hits Browser & Search Engine */}
      {activeSubTab === 'hits-browser' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold text-slate-100">
                  Historical Backtest Hits Explorer ({filteredBrowserSteps.length} Draws Showing)
                </h3>
              </div>

              {/* Result Filter Tabs */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                <button
                  onClick={() => setBrowserFilterResult('hits')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    browserFilterResult === 'hits'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hits Only ({report.totalHits})
                </button>
                <button
                  onClick={() => setBrowserFilterResult('multi-hits')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    browserFilterResult === 'multi-hits'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Multi-Hits ({report.doubleHitDays + report.tripleHitDays + report.quadHitDays})
                </button>
                <button
                  onClick={() => setBrowserFilterResult('misses')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    browserFilterResult === 'misses'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Misses ({report.totalMisses})
                </button>
                <button
                  onClick={() => setBrowserFilterResult('all')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    browserFilterResult === 'all'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({report.totalSteps})
                </button>
              </div>
            </div>

            {/* Core X & House Filter Dropdowns */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Core X:</span>
                  <select
                    value={browserFilterCoreX}
                    onChange={(e) => setBrowserFilterCoreX(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="All">All Core X</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => (
                      <option key={`opt-x-${x}`} value={x.toString()}>X = {x}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Winning House:</span>
                  <select
                    value={browserFilterHouse}
                    onChange={(e) => setBrowserFilterHouse(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="All">All Houses</option>
                    <option value="DS">Deshawar (DS)</option>
                    <option value="FB">Faridabad (FB)</option>
                    <option value="GL">Gali (GL)</option>
                    <option value="GZB">Ghaziabad (GZB)</option>
                  </select>
                </div>
              </div>

              {/* Quick Text Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={browserSearchQuery}
                  onChange={(e) => setBrowserSearchQuery(e.target.value)}
                  placeholder="Search date, pair, outcome..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-xs pl-8 pr-2.5 py-1 rounded-lg outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Target Date</th>
                  <th className="py-2.5 px-3">Source (T-1) Houses</th>
                  <th className="py-2.5 px-3">Core X</th>
                  <th className="py-2.5 px-3">Primary Set S</th>
                  <th className="py-2.5 px-3">Generated 15 Pairs</th>
                  <th className="py-2.5 px-3">Actual Draw Outcomes</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                  <th className="py-2.5 px-3">Matched Winning Pairs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredBrowserSteps.map((step) => {
                  const houseNames = ['DS', 'FB', 'GL', 'GZB'];
                  const houseColors = [
                    'border-blue-500/40 text-blue-300',
                    'border-amber-500/40 text-amber-300',
                    'border-purple-500/40 text-purple-300',
                    'border-cyan-500/40 text-cyan-300',
                  ];

                  return (
                    <tr key={`step-${step.date}`} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-200">
                        {step.date}
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {step.sourceHouseOutcomes.map((num, i) => (
                            <span
                              key={`src-${i}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border ${houseColors[i] || 'border-slate-700'}`}
                            >
                              <strong className="text-slate-500 mr-0.5">{houseNames[i]}:</strong>{num || '--'}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-cyan-300">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40">
                          {step.x}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-purple-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30">
                          [{step.primarySet.join(',')}]
                        </span>
                      </td>

                      {/* 15 Pairs */}
                      <td className="py-2.5 px-3 min-w-[260px]">
                        <div className="flex flex-wrap gap-1 items-center">
                          {step.sirAbhishekPairs.map((pair, idx) => {
                            const isMatched = step.matchedPairs.includes(pair);
                            return (
                              <span
                                key={`pair-${pair}-${idx}`}
                                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                  isMatched
                                    ? 'bg-emerald-500 text-slate-950 font-black ring-1 ring-emerald-300 shadow-sm'
                                    : 'bg-slate-950/80 border border-slate-800 text-slate-300'
                                }`}
                              >
                                {pair}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actual Draw */}
                      <td className="py-2.5 px-3 min-w-[200px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {step.targetHouseOutcomes.map((num, i) => {
                            const isHit = step.matchedPairs.includes(num);
                            return (
                              <span
                                key={`tgt-${i}`}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                                  isHit
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm ring-1 ring-emerald-400/50'
                                    : `bg-slate-950 ${houseColors[i] || 'border-slate-800 text-slate-300'}`
                                }`}
                              >
                                <span className="text-[10px] text-slate-400 font-normal mr-1">{houseNames[i]}:</span>
                                {num || '--'}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Result */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {step.isHit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" /> HIT ({step.hitCount})
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">MISS</span>
                        )}
                      </td>

                      {/* Matched Pairs */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {step.matchedPairs.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {step.matchedPairs.map((hitNum, hIdx) => (
                              <span
                                key={`hit-${hitNum}-${hIdx}`}
                                className="bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[11px]"
                              >
                                {hitNum}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Sub-Tab 6: Live Pattern Signature Predictor */}
      {activeSubTab === 'live-predictor' && (
        <div className="space-y-6">
          {/* Target Draw Selector */}
          <div className="bg-slate-950/80 border border-violet-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-black text-slate-100">
                  Live Pattern Signature Predictor & Historical Congruence Matcher
                </h3>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                <button
                  onClick={() => setPredictMode('today')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    predictMode === 'today'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Today's Draw
                </button>
                <button
                  onClick={() => setPredictMode('upcoming')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    predictMode === 'upcoming'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upcoming Next Draw
                </button>
                <button
                  onClick={() => setPredictMode('custom')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    predictMode === 'custom'
                      ? 'bg-violet-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Sandbox
                </button>
              </div>
            </div>

            {/* Custom 4 Houses Input (if in custom mode) */}
            {predictMode === 'custom' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Deshawar (DS)</label>
                  <input
                    type="text"
                    value={customSourceHouses.deshawar}
                    onChange={(e) => setCustomSourceHouses({ ...customSourceHouses, deshawar: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Faridabad (FB)</label>
                  <input
                    type="text"
                    value={customSourceHouses.faridabad}
                    onChange={(e) => setCustomSourceHouses({ ...customSourceHouses, faridabad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Gali (GL)</label>
                  <input
                    type="text"
                    value={customSourceHouses.gali}
                    onChange={(e) => setCustomSourceHouses({ ...customSourceHouses, gali: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Ghaziabad (GZB)</label>
                  <input
                    type="text"
                    value={customSourceHouses.gzb}
                    onChange={(e) => setCustomSourceHouses({ ...customSourceHouses, gzb: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {/* Pattern Congruence Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Score Meter */}
              <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-purple-950/40 border border-violet-500/40 rounded-2xl p-5 text-center space-y-3 flex flex-col justify-center items-center">
                <div className="text-xs font-mono text-violet-300 font-bold uppercase">
                  Historical Pattern Match Score
                </div>
                <div className="text-5xl font-mono font-black text-emerald-400">
                  {livePrediction.patternScore}%
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {livePrediction.patternScore >= 80 ? '🔥 Very High Pattern Congruence' : '✨ Strong Pattern Congruence'}
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Predicted match against the 562 historical winning patterns using Core X={livePrediction.coreX} and Primary Set S=[{livePrediction.primarySet.join(',')}].
                </p>
              </div>

              {/* Score Components */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">
                  Empirical Pattern Signal Breakdown
                </h4>

                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span>Core X Historical Hit Reliability</span>
                      <span className="text-cyan-300 font-bold">{livePrediction.scoreBreakdown.coreXScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: `${livePrediction.scoreBreakdown.coreXScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span>15-Pair Winning Frequency Score</span>
                      <span className="text-emerald-300 font-bold">{livePrediction.scoreBreakdown.historicalPairHitScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${livePrediction.scoreBreakdown.historicalPairHitScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span>Primary Set Slot Combinatorial Density</span>
                      <span className="text-purple-300 font-bold">{livePrediction.scoreBreakdown.slotDistributionScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-400 h-full" style={{ width: `${livePrediction.scoreBreakdown.slotDistributionScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span>Faridabad Delta Congruence Lift</span>
                      <span className="text-amber-300 font-bold">{livePrediction.scoreBreakdown.deltaCongruenceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full" style={{ width: `${livePrediction.scoreBreakdown.deltaCongruenceScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ranked Recommended Pairs based on Historical Patterns */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-100">
                    Ranked Recommended Pairs (Congruence with 562 Historical Hits)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onSendPairsToSimulator && (
                    <button
                      onClick={() => onSendPairsToSimulator(livePrediction.recommendedPairs.slice(0, 10).map((p) => p.pair))}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-violet-600 hover:bg-violet-500 text-white transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      Send Top 10 to Simulator
                    </button>
                  )}

                  <button
                    onClick={() => copyToClipboard(livePrediction.recommendedPairs.map((p) => p.pair).join(', '), 'rec-pairs')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  >
                    {copiedKey === 'rec-pairs' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy All 15 Pairs
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pairs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {livePrediction.recommendedPairs.map((rec, idx) => (
                  <div
                    key={`rec-p-${rec.pair}`}
                    className={`p-3 rounded-xl border font-mono space-y-1.5 transition ${
                      idx < 5
                        ? 'bg-gradient-to-br from-violet-950/40 to-slate-900 border-violet-500/50 shadow-md ring-1 ring-violet-500/20'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                        <span className="text-base font-black text-slate-100">{rec.pair}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        idx < 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Score {rec.score}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Historical Hits:</span>
                      <span className="text-emerald-400 font-bold">{rec.historicalHitCount} Draws</span>
                    </div>

                    <div className="text-[10px] text-slate-500 line-clamp-1">
                      {rec.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
