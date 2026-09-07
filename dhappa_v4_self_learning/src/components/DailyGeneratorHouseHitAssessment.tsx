import React, { useState, useMemo } from 'react';
import { Market, MARKETS, DayMarketEntry } from '../types';
import {
  Building2,
  Target,
  Award,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Calendar,
  Filter,
  ArrowRight,
  Flame,
  PieChart,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import { ConsensusPoolItem } from './ConsensusDecisionMatrixHub';
import { ConsensusMLModelType } from '../utils/consensusMatrixMLEngine';

export interface SingleHouseHitMetric {
  houseName: Market;
  shortCode: string;
  colorHex: string;
  bgGradient: string;
  borderColor: string;
  totalDrawsEvaluated: number;
  totalHits: number;
  top5Hits: number;
  top12Hits: number;
  top24Hits: number;
  top36Hits: number;
  top5HitRate: number;
  top12HitRate: number;
  top24HitRate: number;
  top36HitRate: number;
  averageWinningRank: number;
  paltiDirectRatio: string;
  directHits: number;
  paltiHits: number;
  consecutiveWinStreak: number;
  maxHistoricalStreak: number;
  roiEstimatePct: number;
  activeTargetResult?: string;
  activeTargetHitTier?: 'PRIME' | 'CONSENSUS' | 'DEFENSIVE' | 'LONGTAIL' | 'MISS' | 'PENDING';
  activeTargetMatchedPair?: string;
  activeTargetRank?: number;
}

export interface MultiHouseSweepStats {
  totalDays: number;
  atLeast1HouseHitDays: number;
  atLeast1HouseHitRate: number;
  atLeast2HousesHitDays: number;
  atLeast2HousesHitRate: number;
  atLeast3HousesHitDays: number;
  atLeast3HousesHitRate: number;
  all4HousesHitDays: number;
  all4HousesHitRate: number;
  totalPossibleHouseDraws: number;
  totalAggregatedHouseHits: number;
  overallHouseDrawCaptureRate: number;
}

export interface DayHouseBreakdownRow {
  date: string;
  deshawar: { drawn: string; hit: boolean; rank?: number; tier?: string; pair?: string; score?: number };
  faridabad: { drawn: string; hit: boolean; rank?: number; tier?: string; pair?: string; score?: number };
  ghaziabad: { drawn: string; hit: boolean; rank?: number; tier?: string; pair?: string; score?: number };
  gali: { drawn: string; hit: boolean; rank?: number; tier?: string; pair?: string; score?: number };
  totalHitsOnDay: number;
}

export interface TierDistributionAudit {
  tierName: string;
  tierNumber: number;
  tierLabel: string;
  rankRange: string;
  count: number;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  icon: any;
  shareOfHitsPct: number;
  totalDrawsHit: number;
  hitRateAcrossDraws: number;
  houseBreakdown: Record<Market, number>;
  topScoringCandidates: ConsensusPoolItem[];
}

interface DailyGeneratorHouseHitAssessmentProps {
  records: DayMarketEntry[];
  selectedDate: string;
  activeModel: 'ensemble' | 'briquette_engine' | 'pattern_dashboard' | ConsensusMLModelType;
  currentConsensusPool: ConsensusPoolItem[];
  computeConsensusForDate: (
    targetDate: string,
    budget: number,
    modelOverride?: any,
    houseOverride?: Market | 'ALL'
  ) => { consensusPool: ConsensusPoolItem[] };
  selectedHouse: Market | 'ALL';
  onSelectHouse: (house: Market | 'ALL') => void;
  actualResult?: string;
}

export const DailyGeneratorHouseHitAssessment: React.FC<DailyGeneratorHouseHitAssessmentProps> = ({
  records,
  selectedDate,
  activeModel,
  currentConsensusPool,
  computeConsensusForDate,
  selectedHouse,
  onSelectHouse,
  actualResult = '',
}) => {
  const [lookbackWindow, setLookbackWindow] = useState<number>(15);
  const [showFullHistoryTable, setShowFullHistoryTable] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tier_breakdown' | 'house_scorecards' | 'draw_audit'>('tier_breakdown');

  // Compute zero-lookahead walk-forward house metrics & tier-by-tier distribution audit
  const evaluationResults = useMemo(() => {
    const sortedDays = [...records]
      .filter((r) => r.date <= selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date));

    const testingSlice = sortedDays.slice(0, lookbackWindow > 0 ? lookbackWindow : sortedDays.length);

    const houseConfig: Record<Market, { shortCode: string; key: keyof DayMarketEntry; colorHex: string; bgGradient: string; borderColor: string }> = {
      Deshawar: {
        shortCode: 'DES',
        key: 'deshawar',
        colorHex: '#f59e0b',
        bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
        borderColor: 'border-amber-500/40',
      },
      Faridabad: {
        shortCode: 'FD',
        key: 'faridabad',
        colorHex: '#06b6d4',
        bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950',
        borderColor: 'border-cyan-500/40',
      },
      Ghaziabad: {
        shortCode: 'GB/GD',
        key: 'ghaziabad',
        colorHex: '#10b981',
        bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
        borderColor: 'border-emerald-500/40',
      },
      Gali: {
        shortCode: 'GAL/GL',
        key: 'gali',
        colorHex: '#8b5cf6',
        bgGradient: 'from-purple-950/40 via-slate-900 to-slate-950',
        borderColor: 'border-purple-500/40',
      },
    };

    const houseStats: Record<Market, {
      totalDraws: number;
      top5Hits: number;
      top12Hits: number;
      top24Hits: number;
      top36Hits: number;
      tier1Hits: number;
      tier2Hits: number;
      tier3Hits: number;
      tier4Hits: number;
      directHits: number;
      paltiHits: number;
      rankSums: number;
      currentStreak: number;
      maxStreak: number;
      tempStreak: number;
    }> = {
      Deshawar: { totalDraws: 0, top5Hits: 0, top12Hits: 0, top24Hits: 0, top36Hits: 0, tier1Hits: 0, tier2Hits: 0, tier3Hits: 0, tier4Hits: 0, directHits: 0, paltiHits: 0, rankSums: 0, currentStreak: 0, maxStreak: 0, tempStreak: 0 },
      Faridabad: { totalDraws: 0, top5Hits: 0, top12Hits: 0, top24Hits: 0, top36Hits: 0, tier1Hits: 0, tier2Hits: 0, tier3Hits: 0, tier4Hits: 0, directHits: 0, paltiHits: 0, rankSums: 0, currentStreak: 0, maxStreak: 0, tempStreak: 0 },
      Ghaziabad: { totalDraws: 0, top5Hits: 0, top12Hits: 0, top24Hits: 0, top36Hits: 0, tier1Hits: 0, tier2Hits: 0, tier3Hits: 0, tier4Hits: 0, directHits: 0, paltiHits: 0, rankSums: 0, currentStreak: 0, maxStreak: 0, tempStreak: 0 },
      Gali: { totalDraws: 0, top5Hits: 0, top12Hits: 0, top24Hits: 0, top36Hits: 0, tier1Hits: 0, tier2Hits: 0, tier3Hits: 0, tier4Hits: 0, directHits: 0, paltiHits: 0, rankSums: 0, currentStreak: 0, maxStreak: 0, tempStreak: 0 },
    };

    let atLeast1HitDays = 0;
    let atLeast2HitDays = 0;
    let atLeast3HitDays = 0;
    let all4HitDays = 0;
    let totalPossibleDraws = 0;
    let totalAggregatedHits = 0;

    let totalTier1Hits = 0;
    let totalTier2Hits = 0;
    let totalTier3Hits = 0;
    let totalTier4Hits = 0;

    const dayRows: DayHouseBreakdownRow[] = [];

    // Evaluate each day in chronological order for streaks
    const chronoTestingDays = [...testingSlice].reverse();

    chronoTestingDays.forEach((dayEntry) => {
      const generated = computeConsensusForDate(dayEntry.date, 2000, activeModel, selectedHouse);
      const pool = generated.consensusPool || [];
      const poolPairs = pool.map((p) => p.pair);

      let dayHitsCount = 0;

      const dayRow: DayHouseBreakdownRow = {
        date: dayEntry.date,
        deshawar: { drawn: '', hit: false },
        faridabad: { drawn: '', hit: false },
        ghaziabad: { drawn: '', hit: false },
        gali: { drawn: '', hit: false },
        totalHitsOnDay: 0,
      };

      MARKETS.forEach((mkt) => {
        const conf = houseConfig[mkt];
        let drawnRaw = dayEntry[conf.key] || (mkt === 'Ghaziabad' ? dayEntry.gzb : undefined);
        if (drawnRaw && typeof drawnRaw === 'string' && /^\d{1,2}$/.test(drawnRaw.trim())) {
          const drawnVal = drawnRaw.trim().padStart(2, '0');
          const paltiVal = drawnVal.split('').reverse().join('');
          houseStats[mkt].totalDraws++;
          totalPossibleDraws++;

          // Check if drawnVal or paltiVal is in pool
          const matchIndex = poolPairs.indexOf(drawnVal);
          const paltiMatchIndex = poolPairs.indexOf(paltiVal);

          const isDirect = matchIndex >= 0;
          const isPalti = !isDirect && paltiMatchIndex >= 0;
          const bestRank = isDirect ? matchIndex + 1 : isPalti ? paltiMatchIndex + 1 : -1;
          const hit = bestRank > 0 && bestRank <= 36;
          const matchedItem = hit ? pool[bestRank - 1] : undefined;

          let hitTier: string | undefined = undefined;
          if (bestRank > 0 && bestRank <= 5) hitTier = 'Tier 1 (Prime #1-5)';
          else if (bestRank > 5 && bestRank <= 12) hitTier = 'Tier 2 (Conviction #6-12)';
          else if (bestRank > 12 && bestRank <= 24) hitTier = 'Tier 3 (Defense #13-24)';
          else if (bestRank > 24 && bestRank <= 36) hitTier = 'Tier 4 (Buffer #25-36)';

          const cellData = {
            drawn: drawnVal,
            hit,
            rank: bestRank > 0 ? bestRank : undefined,
            tier: hitTier,
            pair: isDirect ? drawnVal : paltiVal,
            score: matchedItem?.consensusScore,
          };

          if (mkt === 'Deshawar') dayRow.deshawar = cellData;
          if (mkt === 'Faridabad') dayRow.faridabad = cellData;
          if (mkt === 'Ghaziabad') dayRow.ghaziabad = cellData;
          if (mkt === 'Gali') dayRow.gali = cellData;

          if (hit) {
            dayHitsCount++;
            totalAggregatedHits++;
            houseStats[mkt].top36Hits++;
            houseStats[mkt].rankSums += bestRank;

            if (bestRank <= 5) {
              houseStats[mkt].top5Hits++;
              houseStats[mkt].tier1Hits++;
              totalTier1Hits++;
            } else if (bestRank <= 12) {
              houseStats[mkt].top12Hits++;
              houseStats[mkt].tier2Hits++;
              totalTier2Hits++;
            } else if (bestRank <= 24) {
              houseStats[mkt].top24Hits++;
              houseStats[mkt].tier3Hits++;
              totalTier3Hits++;
            } else if (bestRank <= 36) {
              houseStats[mkt].tier4Hits++;
              totalTier4Hits++;
            }

            if (isDirect) houseStats[mkt].directHits++;
            if (isPalti) houseStats[mkt].paltiHits++;

            houseStats[mkt].tempStreak++;
            if (houseStats[mkt].tempStreak > houseStats[mkt].maxStreak) {
              houseStats[mkt].maxStreak = houseStats[mkt].tempStreak;
            }
          } else {
            houseStats[mkt].tempStreak = 0;
          }
        }
      });

      // Update current active streak
      MARKETS.forEach((mkt) => {
        houseStats[mkt].currentStreak = houseStats[mkt].tempStreak;
      });

      dayRow.totalHitsOnDay = dayHitsCount;
      if (dayHitsCount >= 1) atLeast1HitDays++;
      if (dayHitsCount >= 2) atLeast2HitDays++;
      if (dayHitsCount >= 3) atLeast3HitDays++;
      if (dayHitsCount === 4) all4HitDays++;

      dayRows.push(dayRow);
    });

    // Determine current selected date's live draw assessment
    const activeRecord = records.find((r) => r.date === selectedDate);
    const activeConsensusPairs = currentConsensusPool.map((c) => c.pair);

    const houseMetricsList: SingleHouseHitMetric[] = MARKETS.map((mkt) => {
      const conf = houseConfig[mkt];
      const stats = houseStats[mkt];
      const total = stats.totalDraws || 1;

      const top5Rate = Math.round((stats.top5Hits / total) * 1000) / 10;
      const top12Rate = Math.round((stats.top12Hits / total) * 1000) / 10;
      const top24Rate = Math.round((stats.top24Hits / total) * 1000) / 10;
      const top36Rate = Math.round((stats.top36Hits / total) * 1000) / 10;
      const avgRank = stats.top36Hits > 0 ? Math.round((stats.rankSums / stats.top36Hits) * 10) / 10 : 0;

      const totalCost = total * 360;
      const totalPayout = stats.top36Hits * 900;
      const roiEst = totalCost > 0 ? Math.round(((totalPayout - totalCost) / totalCost) * 1000) / 10 : 0;

      // Active target evaluation
      let activeValRaw = activeRecord ? activeRecord[conf.key] || (mkt === 'Ghaziabad' ? activeRecord.gzb : undefined) : undefined;
      let activeTargetResult = 'PENDING';
      let activeTargetHitTier: 'PRIME' | 'CONSENSUS' | 'DEFENSIVE' | 'LONGTAIL' | 'MISS' | 'PENDING' = 'PENDING';
      let activeTargetMatchedPair: string | undefined = undefined;
      let activeTargetRank: number | undefined = undefined;

      if (activeValRaw && typeof activeValRaw === 'string' && /^\d{1,2}$/.test(activeValRaw.trim())) {
        const drawnVal = activeValRaw.trim().padStart(2, '0');
        const paltiVal = drawnVal.split('').reverse().join('');
        activeTargetResult = drawnVal;

        const dIdx = activeConsensusPairs.indexOf(drawnVal);
        const pIdx = activeConsensusPairs.indexOf(paltiVal);

        if (dIdx >= 0) {
          activeTargetMatchedPair = drawnVal;
          activeTargetRank = dIdx + 1;
        } else if (pIdx >= 0) {
          activeTargetMatchedPair = paltiVal;
          activeTargetRank = pIdx + 1;
        }

        if (activeTargetRank) {
          if (activeTargetRank <= 5) activeTargetHitTier = 'PRIME';
          else if (activeTargetRank <= 12) activeTargetHitTier = 'CONSENSUS';
          else if (activeTargetRank <= 24) activeTargetHitTier = 'DEFENSIVE';
          else if (activeTargetRank <= 36) activeTargetHitTier = 'LONGTAIL';
          else activeTargetHitTier = 'MISS';
        } else {
          activeTargetHitTier = 'MISS';
        }
      }

      return {
        houseName: mkt,
        shortCode: conf.shortCode,
        colorHex: conf.colorHex,
        bgGradient: conf.bgGradient,
        borderColor: conf.borderColor,
        totalDrawsEvaluated: stats.totalDraws,
        totalHits: stats.top36Hits,
        top5Hits: stats.top5Hits,
        top12Hits: stats.top12Hits,
        top24Hits: stats.top24Hits,
        top36Hits: stats.top36Hits,
        top5HitRate: top5Rate,
        top12HitRate: top12Rate,
        top24HitRate: top24Rate,
        top36HitRate: top36Rate,
        averageWinningRank: avgRank,
        paltiDirectRatio: `${stats.directHits} Direct / ${stats.paltiHits} Mirror`,
        directHits: stats.directHits,
        paltiHits: stats.paltiHits,
        consecutiveWinStreak: stats.currentStreak,
        maxHistoricalStreak: stats.maxStreak,
        roiEstimatePct: roiEst,
        activeTargetResult,
        activeTargetHitTier,
        activeTargetMatchedPair,
        activeTargetRank,
      };
    });

    const totalDaysCount = testingSlice.length || 1;
    const sweepStats: MultiHouseSweepStats = {
      totalDays: totalDaysCount,
      atLeast1HouseHitDays: atLeast1HitDays,
      atLeast1HouseHitRate: Math.round((atLeast1HitDays / totalDaysCount) * 1000) / 10,
      atLeast2HousesHitDays: atLeast2HitDays,
      atLeast2HousesHitRate: Math.round((atLeast2HitDays / totalDaysCount) * 1000) / 10,
      atLeast3HousesHitDays: atLeast3HitDays,
      atLeast3HousesHitRate: Math.round((atLeast3HitDays / totalDaysCount) * 1000) / 10,
      all4HousesHitDays: all4HitDays,
      all4HousesHitRate: Math.round((all4HitDays / totalDaysCount) * 1000) / 10,
      totalPossibleHouseDraws: totalPossibleDraws,
      totalAggregatedHouseHits: totalAggregatedHits,
      overallHouseDrawCaptureRate: totalPossibleDraws > 0 ? Math.round((totalAggregatedHits / totalPossibleDraws) * 1000) / 10 : 0,
    };

    // Sequential Tier 1 to Tier 4 Distribution Assessment
    const totalHitsGrand = totalAggregatedHits || 1;
    const tierAuditData: TierDistributionAudit[] = [
      {
        tierName: 'Tier 1',
        tierNumber: 1,
        tierLabel: 'Elite Prime Set',
        rankRange: '#1 – #5 (5 Numbers)',
        count: 5,
        colorHex: '#fbbf24',
        badgeBg: 'bg-amber-500/20 text-amber-300',
        badgeBorder: 'border-amber-500/40',
        icon: Award,
        shareOfHitsPct: Math.round((totalTier1Hits / totalHitsGrand) * 1000) / 10,
        totalDrawsHit: totalTier1Hits,
        hitRateAcrossDraws: totalPossibleDraws > 0 ? Math.round((totalTier1Hits / totalPossibleDraws) * 1000) / 10 : 0,
        houseBreakdown: {
          Deshawar: houseStats.Deshawar.tier1Hits,
          Faridabad: houseStats.Faridabad.tier1Hits,
          Ghaziabad: houseStats.Ghaziabad.tier1Hits,
          Gali: houseStats.Gali.tier1Hits,
        },
        topScoringCandidates: currentConsensusPool.slice(0, 5),
      },
      {
        tierName: 'Tier 2',
        tierNumber: 2,
        tierLabel: 'High Conviction Core',
        rankRange: '#6 – #12 (7 Numbers)',
        count: 7,
        colorHex: '#22d3ee',
        badgeBg: 'bg-cyan-500/20 text-cyan-300',
        badgeBorder: 'border-cyan-500/40',
        icon: Zap,
        shareOfHitsPct: Math.round((totalTier2Hits / totalHitsGrand) * 1000) / 10,
        totalDrawsHit: totalTier2Hits,
        hitRateAcrossDraws: totalPossibleDraws > 0 ? Math.round((totalTier2Hits / totalPossibleDraws) * 1000) / 10 : 0,
        houseBreakdown: {
          Deshawar: houseStats.Deshawar.tier2Hits,
          Faridabad: houseStats.Faridabad.tier2Hits,
          Ghaziabad: houseStats.Ghaziabad.tier2Hits,
          Gali: houseStats.Gali.tier2Hits,
        },
        topScoringCandidates: currentConsensusPool.slice(5, 12),
      },
      {
        tierName: 'Tier 3',
        tierNumber: 3,
        tierLabel: 'Calibrated Defensive Hedge',
        rankRange: '#13 – #24 (12 Numbers)',
        count: 12,
        colorHex: '#34d399',
        badgeBg: 'bg-emerald-500/20 text-emerald-300',
        badgeBorder: 'border-emerald-500/40',
        icon: ShieldCheck,
        shareOfHitsPct: Math.round((totalTier3Hits / totalHitsGrand) * 1000) / 10,
        totalDrawsHit: totalTier3Hits,
        hitRateAcrossDraws: totalPossibleDraws > 0 ? Math.round((totalTier3Hits / totalPossibleDraws) * 1000) / 10 : 0,
        houseBreakdown: {
          Deshawar: houseStats.Deshawar.tier3Hits,
          Faridabad: houseStats.Faridabad.tier3Hits,
          Ghaziabad: houseStats.Ghaziabad.tier3Hits,
          Gali: houseStats.Gali.tier3Hits,
        },
        topScoringCandidates: currentConsensusPool.slice(12, 24),
      },
      {
        tierName: 'Tier 4',
        tierNumber: 4,
        tierLabel: 'Support Tail & Longtail Buffer',
        rankRange: '#25 – #36 (12 Numbers)',
        count: 12,
        colorHex: '#c084fc',
        badgeBg: 'bg-purple-500/20 text-purple-300',
        badgeBorder: 'border-purple-500/40',
        icon: Layers,
        shareOfHitsPct: Math.round((totalTier4Hits / totalHitsGrand) * 1000) / 10,
        totalDrawsHit: totalTier4Hits,
        hitRateAcrossDraws: totalPossibleDraws > 0 ? Math.round((totalTier4Hits / totalPossibleDraws) * 1000) / 10 : 0,
        houseBreakdown: {
          Deshawar: houseStats.Deshawar.tier4Hits,
          Faridabad: houseStats.Faridabad.tier4Hits,
          Ghaziabad: houseStats.Ghaziabad.tier4Hits,
          Gali: houseStats.Gali.tier4Hits,
        },
        topScoringCandidates: currentConsensusPool.slice(24, 36),
      },
    ];

    return {
      houseMetricsList,
      sweepStats,
      tierAuditData,
      dayRows: dayRows.reverse(), // most recent first for display
      totalPossibleDraws,
      totalAggregatedHits,
    };
  }, [records, selectedDate, activeModel, lookbackWindow, currentConsensusPool, computeConsensusForDate]);

  return (
    <div id="house-hit-assessment-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 text-left">
      {/* SECTION HEADER & CONTROLLERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              SEQUENTIAL HOUSE HIT AUDIT
            </span>
            <span className="bg-purple-500/15 text-purple-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
              Tier 1 → Tier 4 Sequential Distribution
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-100 font-mono tracking-tight flex items-center gap-2">
            Sequential Tier Distribution &amp; House Hit Assessment
          </h3>
          <p className="text-xs text-slate-400 max-w-3xl">
            Audit understanding the exact hit concentration across sequential tiers (<strong>Tier-1 Prime</strong>, <strong>Tier-2 Conviction</strong>, <strong>Tier-3 Defense</strong>, <strong>Tier-4 Buffer</strong>) ordered strictly by highest scoring candidate potential first.
          </p>
        </div>

        {/* LOOKBACK CONTROLS & NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Audit Window:</span>
            <select
              value={lookbackWindow}
              onChange={(e) => setLookbackWindow(Number(e.target.value))}
              className="bg-transparent text-xs font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value={15} className="bg-slate-900 text-slate-200">Last 15 Draws (Recommended)</option>
              <option value={30} className="bg-slate-900 text-slate-200">Last 30 Draws (Monthly)</option>
              <option value={45} className="bg-slate-900 text-slate-200">Last 45 Draws (Extended)</option>
              <option value={0} className="bg-slate-900 text-slate-200">All History ({records.length} Slices)</option>
            </select>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('tier_breakdown')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tier_breakdown'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tier 1-4 Sequential Distribution</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('house_scorecards')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'house_scorecards'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>4 House Scorecards</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('draw_audit')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'draw_audit'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Draw-by-Draw Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* CROSS-HOUSE SUMMARY STATS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">≥1 House Daily Win</span>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {evaluationResults.sweepStats.atLeast1HouseHitRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {evaluationResults.sweepStats.atLeast1HouseHitDays}/{evaluationResults.sweepStats.totalDays} days captured
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">≥2 Houses Double Sweep</span>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
            {evaluationResults.sweepStats.atLeast2HousesHitRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {evaluationResults.sweepStats.atLeast2HousesHitDays}/{evaluationResults.sweepStats.totalDays} multi-house hits
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">≥3 Houses Triple Sweep</span>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
            {evaluationResults.sweepStats.atLeast3HousesHitRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {evaluationResults.sweepStats.atLeast3HousesHitDays}/{evaluationResults.sweepStats.totalDays} days with 3+ hits
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">4/4 Quad Clean Sweep</span>
          <div className="text-2xl font-black font-mono text-purple-300 mt-1">
            {evaluationResults.sweepStats.all4HousesHitRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {evaluationResults.sweepStats.all4HousesHitDays}/{evaluationResults.sweepStats.totalDays} perfect sweep days
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Draw Capture Rate</span>
          <div className="text-2xl font-black font-mono text-indigo-300 mt-1">
            {evaluationResults.sweepStats.overallHouseDrawCaptureRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {evaluationResults.sweepStats.totalAggregatedHouseHits}/{evaluationResults.sweepStats.totalPossibleHouseDraws} individual house outcomes
          </div>
        </div>
      </div>

      {/* TAB 1: SEQUENTIAL TIER 1 TO TIER 4 DISTRIBUTION (ALIGNED AS PER HIGHEST SCORING NUMBER FIRST) */}
      {activeTab === 'tier_breakdown' && (
        <div className="space-y-6">
          {/* Visual Tier Share Breakdown Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-amber-400" />
                Aggregated Hit Contribution Share Across Sequential Tiers (Total {evaluationResults.totalAggregatedHits} House Hits)
              </span>
              <span className="text-slate-400 text-[11px]">
                Higher tiers capture more hits with significantly fewer numbers
              </span>
            </div>

            {/* Stacked Multi-Color Segment Bar */}
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              {evaluationResults.tierAuditData.map((tier) => (
                <div
                  key={tier.tierName}
                  className="h-full transition-all relative group"
                  style={{
                    width: `${Math.max(tier.shareOfHitsPct, 4)}%`,
                    backgroundColor: tier.colorHex,
                  }}
                  title={`${tier.tierName} (${tier.tierLabel}): ${tier.shareOfHitsPct}% of all winning draws`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              {evaluationResults.tierAuditData.map((tier) => (
                <div key={tier.tierName} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tier.colorHex }} />
                  <div className="truncate">
                    <span className="font-bold text-slate-200">{tier.tierName}:</span>{' '}
                    <span className="text-slate-400">{tier.shareOfHitsPct}% share</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sequential 4-Tier Cards: Tier-1 -> Tier-2 -> Tier-3 -> Tier-4 */}
          <div className="space-y-5">
            {evaluationResults.tierAuditData.map((tier) => {
              const TierIcon = tier.icon;
              return (
                <div
                  key={tier.tierName}
                  className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-lg"
                  style={{ borderLeft: `4px solid ${tier.colorHex}` }}
                >
                  {/* Tier Header with Rank Range & Hit Share */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono shadow-md"
                        style={{ backgroundColor: `${tier.colorHex}25`, color: tier.colorHex, border: `1px solid ${tier.colorHex}50` }}
                      >
                        <TierIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-100 font-mono tracking-tight">
                            {tier.tierName}: {tier.tierLabel}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${tier.badgeBg} border ${tier.badgeBorder}`}>
                            {tier.rankRange}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Ordered by highest machine learning consensus scores first (top {tier.count} candidates).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Total House Hits</span>
                        <span className="text-sm font-black font-mono text-slate-100">
                          {tier.totalDrawsHit} / {evaluationResults.totalPossibleDraws}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Share of Total Hits</span>
                        <span className="text-sm font-black font-mono" style={{ color: tier.colorHex }}>
                          {tier.shareOfHitsPct}%
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Draw Capture Rate</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          {tier.hitRateAcrossDraws}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* House-by-House Distribution in this Tier */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      House Breakdown in this Tier (Historical Wins):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {MARKETS.map((mkt) => {
                        const count = tier.houseBreakdown[mkt];
                        const totalMkt = evaluationResults.houseMetricsList.find((h) => h.houseName === mkt)?.totalDrawsEvaluated || 1;
                        const pct = Math.round((count / totalMkt) * 1000) / 10;
                        return (
                          <div key={mkt} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                            <span className="text-slate-400 font-bold">{mkt}:</span>
                            <span className="text-slate-100 font-black">
                              {count} Wins <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Candidate Numbers Aligned Highest Possible First */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        Live Candidate Numbers for Active Target ({selectedDate}) — Highest Rank First:
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Confidence score &amp; multi-engine agreement
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      {tier.topScoringCandidates.map((cand, idx) => {
                        const rankNumber = (tier.tierNumber === 1 ? 0 : tier.tierNumber === 2 ? 5 : tier.tierNumber === 3 ? 12 : 24) + idx + 1;
                        const isHitInActual = actualResult && actualResult.includes(cand.pair);
                        return (
                          <div
                            key={cand.pair}
                            className={`p-2.5 rounded-xl border font-mono transition relative ${
                              isHitInActual
                                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/50'
                                : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${tier.colorHex}20`, color: tier.colorHex }}
                              >
                                #{rankNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {(cand.consensusScore * 100).toFixed(0)}%
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black tracking-wider text-slate-100">
                                {cand.pair}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Mirr: {cand.pair.split('').reverse().join('')}
                              </span>
                            </div>

                            <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
                              <span>{cand.supportingEnginesCount} Engines</span>
                              <span className="text-amber-300 font-bold">₹{cand.recommendedStake}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL 4 HOUSE SCORECARDS */}
      {activeTab === 'house_scorecards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {evaluationResults.houseMetricsList.map((house) => {
              const isSelected = selectedHouse === 'ALL' || selectedHouse === house.houseName;
              return (
                <div
                  key={house.houseName}
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `bg-gradient-to-b ${house.bgGradient} ${house.borderColor} shadow-xl shadow-black/40 ring-1 ring-white/10`
                      : 'bg-slate-950/50 border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* House Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {house.shortCode}
                        </span>
                        <h4 className="text-base font-black text-slate-100 font-mono flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" style={{ color: house.colorHex }} />
                          {house.houseName}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Overall Hit %</span>
                        <span className="text-xl font-black font-mono" style={{ color: house.colorHex }}>
                          {house.top36HitRate}%
                        </span>
                      </div>
                    </div>

                    {/* Stratified Tiers Progress Bars */}
                    <div className="space-y-2.5 mb-4">
                      {/* Top 5 Prime */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-400" />
                            Tier 1 (Top 5 Prime)
                          </span>
                          <span className="text-slate-200 font-black">{house.top5HitRate}% ({house.top5Hits}/{house.totalDrawsEvaluated})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${house.top5HitRate}%` }}></div>
                        </div>
                      </div>

                      {/* Top 12 Conviction */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-cyan-400 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-cyan-400" />
                            Tier 2 (Top 12 Conviction)
                          </span>
                          <span className="text-slate-200 font-black">{house.top12HitRate}% ({house.top12Hits}/{house.totalDrawsEvaluated})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${house.top12HitRate}%` }}></div>
                        </div>
                      </div>

                      {/* Top 24 Calibrated Defense */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Tier 3 (Top 24 Defense)
                          </span>
                          <span className="text-slate-200 font-black">{house.top24HitRate}% ({house.top24Hits}/{house.totalDrawsEvaluated})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${house.top24HitRate}%` }}></div>
                        </div>
                      </div>

                      {/* Top 36 Full Pool */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-purple-400 font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-purple-400" />
                            Tier 4 (Full 36 Pool)
                          </span>
                          <span className="text-slate-200 font-black">{house.top36HitRate}% ({house.top36Hits}/{house.totalDrawsEvaluated})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${house.top36HitRate}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Breakdown Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 mb-3">
                      <div>
                        <span className="text-slate-500 block uppercase">Avg Hit Rank:</span>
                        <span className="text-slate-200 font-bold">#{house.averageWinningRank} / 36</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Win Streak:</span>
                        <span className="text-emerald-400 font-bold">+{house.consecutiveWinStreak} (Max: {house.maxHistoricalStreak})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Direct / Mirror:</span>
                        <span className="text-cyan-300 font-bold">{house.directHits}D / {house.paltiHits}M</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Est House ROI:</span>
                        <span className={`font-bold ${house.roiEstimatePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {house.roiEstimatePct >= 0 ? '+' : ''}{house.roiEstimatePct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Target Date Live Assessment Pill */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Target ({selectedDate}):</span>
                    {house.activeTargetResult === 'PENDING' ? (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">
                        PENDING
                      </span>
                    ) : house.activeTargetHitTier !== 'MISS' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        HIT: {house.activeTargetResult} (#{house.activeTargetRank})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        MISS ({house.activeTargetResult})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DRAW-BY-DRAW SEQUENTIAL HOUSE HIT MATRIX TABLE */}
      {activeTab === 'draw_audit' && (
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Draw-by-Draw Sequential House Hit Audit
              </h4>
              <p className="text-[11px] text-slate-400">
                Zero-lookahead log detailing drawn numbers, winning candidate tiers, and multi-house sweep status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFullHistoryTable(!showFullHistoryTable)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{showFullHistoryTable ? 'Collapse Table' : `Show All ${evaluationResults.dayRows.length} Days`}</span>
              {showFullHistoryTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950 z-10">
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-amber-400">Deshawar (DES)</th>
                  <th className="py-2.5 px-3 text-cyan-400">Faridabad (FD)</th>
                  <th className="py-2.5 px-3 text-emerald-400">Ghaziabad (GB)</th>
                  <th className="py-2.5 px-3 text-purple-400">Gali (GAL)</th>
                  <th className="py-2.5 px-3 text-center">Day Sweep Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {(showFullHistoryTable ? evaluationResults.dayRows : evaluationResults.dayRows.slice(0, 10)).map((row, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-300">{row.date}</td>

                      {/* Deshawar */}
                      <td className="py-2.5 px-3">
                        {row.deshawar.drawn ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                              row.deshawar.hit ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {row.deshawar.drawn}
                            </span>
                            {row.deshawar.hit && (
                              <span className="text-[10px] text-amber-400 font-bold">
                                #{row.deshawar.rank} ({row.deshawar.tier?.split(' ')[0]} {row.deshawar.tier?.split(' ')[1]})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Faridabad */}
                      <td className="py-2.5 px-3">
                        {row.faridabad.drawn ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                              row.faridabad.hit ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {row.faridabad.drawn}
                            </span>
                            {row.faridabad.hit && (
                              <span className="text-[10px] text-cyan-400 font-bold">
                                #{row.faridabad.rank} ({row.faridabad.tier?.split(' ')[0]} {row.faridabad.tier?.split(' ')[1]})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Ghaziabad */}
                      <td className="py-2.5 px-3">
                        {row.ghaziabad.drawn ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                              row.ghaziabad.hit ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {row.ghaziabad.drawn}
                            </span>
                            {row.ghaziabad.hit && (
                              <span className="text-[10px] text-emerald-400 font-bold">
                                #{row.ghaziabad.rank} ({row.ghaziabad.tier?.split(' ')[0]} {row.ghaziabad.tier?.split(' ')[1]})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Gali */}
                      <td className="py-2.5 px-3">
                        {row.gali.drawn ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                              row.gali.hit ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {row.gali.drawn}
                            </span>
                            {row.gali.hit && (
                              <span className="text-[10px] text-purple-400 font-bold">
                                #{row.gali.rank} ({row.gali.tier?.split(' ')[0]} {row.gali.tier?.split(' ')[1]})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Day Sweep Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          row.totalHitsOnDay === 4
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-black'
                            : row.totalHitsOnDay >= 2
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : row.totalHitsOnDay === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {row.totalHitsOnDay}/4 Houses Won
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
