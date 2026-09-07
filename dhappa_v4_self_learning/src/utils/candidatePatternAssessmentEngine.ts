import { DayMarketEntry, Market, MARKETS } from '../types';
import { RASHI_COMPLEMENT_MAP, getRashiPair, getReversePair } from './customNumberIntelligenceEngine';
import { analyzeMonthlyNumberCoverage, NumberAppearanceItem } from './monthlyCoverageEngine';
import {
  EngineSelfLearningReport,
  trainAndCalibrateAllEngines,
} from './engineSelfLearningCalibrator';
import { loadSavedRulesFromStorage, DEFAULT_MASTER_RULES } from './rulesVaultStorage';

export interface JodiFamilyDefinition {
  familyRoot: string; // e.g. "12/67" or "04/59"
  familyMembers: string[]; // 4 core pairs e.g. ["12", "17", "62", "67"]
  allExtendedMembers: string[]; // with paltis e.g. ["12", "17", "62", "67", "21", "71", "26", "76"]
  description: string;
}

export interface RecentDrawHit {
  date: string;
  daysAgo: number;
  market: Market;
  number: string;
  isExact: boolean;
  isReverse: boolean;
  isFullRashi: boolean;
  isHalfRashiTens: boolean;
  isHalfRashiOnes: boolean;
  isFamilyMember: boolean;
}

export interface FiveDayDrawSnapshot {
  date: string;
  daysAgo: number;
  draws: {
    market: Market;
    number: string;
    tens: number;
    ones: number;
    familyRoot: string;
    fullRashi: string;
  }[];
}

export type CandidateMlTier =
  | 'TIER_1_TOP_5_PRIME'
  | 'TIER_2_TOP_10_HIGH_HIT'
  | 'TIER_3_TOP_21_CALIBRATED'
  | 'TIER_4_TOP_36_BUFFER';

export interface CandidatePatternAssessment {
  pair: string;
  tens: number;
  ones: number;
  reversePair: string;
  fullRashiPair: string;
  halfRashiTensPair: string;
  halfRashiOnesPair: string;
  
  // Family Info
  familyRoot: string;
  familyMembers: string[];
  allFamilyMembersWithPalti: string[];

  // Dynamic Historical Lookback Correlation Metrics (Default 6-Day Window, user editable)
  historicalLookbackDays: number;
  recentDaysExactHits: RecentDrawHit[];
  recentDaysPaltiHits: RecentDrawHit[];
  recentDaysFamilyHits: RecentDrawHit[];
  recentDaysFullRashiHits: RecentDrawHit[];
  recentDaysHalfRashiHits: RecentDrawHit[];
  hasRecentDaysExactHit: boolean;
  hasRecentDaysPaltiHit: boolean;
  hasRecentDaysFamilyHit: boolean;
  hasRecentDaysFullRashiHit: boolean;
  hasRecentDaysHalfRashiHit: boolean;
  totalRecentDaysHits: number;
  recentDaysCorrelationScore: number; // 0 - 100

  // Backward-compatible 5-Day aliases
  last5DaysExactHits: RecentDrawHit[];
  last5DaysPaltiHits: RecentDrawHit[];
  last5DaysFamilyHits: RecentDrawHit[];
  last5DaysFullRashiHits: RecentDrawHit[];
  last5DaysHalfRashiHits: RecentDrawHit[];
  hasLast5DaysExactHit: boolean;
  hasLast5DaysPaltiHit: boolean;
  hasLast5DaysFamilyHit: boolean;
  hasLast5DaysFullRashiHit: boolean;
  hasLast5DaysHalfRashiHit: boolean;
  totalLast5DaysHits: number;
  fiveDayCorrelationScore: number; // 0 - 100

  // 1-Week (7-day) Exact / Palti Jodi Occurrences
  last1WeekExactHits: RecentDrawHit[];
  last1WeekPaltiHits: RecentDrawHit[];
  hasLast1WeekExactHit: boolean;
  hasLast1WeekPaltiHit: boolean;
  totalLast1WeekJodiHits: number;
  mostRecentJodiHit: RecentDrawHit | null;

  // Core Family Occurrences in Last 1-2 Weeks
  last1WeekFamilyHits: RecentDrawHit[];
  last2WeeksFamilyHits: RecentDrawHit[];
  hasLast1WeekFamilyHit: boolean;
  totalLast1WeekFamilyHits: number;
  activeFamilyMembersHit: string[];

  // Rashi Occurrences in Last 1-2 Weeks
  last1WeekFullRashiHits: RecentDrawHit[];
  last1WeekHalfRashiHits: RecentDrawHit[];
  hasLast1WeekFullRashiHit: boolean;
  hasLast1WeekHalfRashiHit: boolean;
  totalLast1WeekRashiHits: number;
  mostRecentRashiHit: RecentDrawHit | null;

  // 00-99 Universe Coverage & Historical Leaderboard Integration
  universeLeaderboardRank?: number;
  universeHistoricalFrequency?: number;
  universeCoverageStatus?: 'High Frequency' | 'Multi-Hit' | 'Appeared' | 'Not Appeared';
  universeDecileRange?: string;
  inUniverseTopLeaderboard: boolean;
  universeLeaderboardSynergyScore: number; // 0 - 25

  // Primary Pattern Archetype Classification
  primaryPatternType:
    | 'N_DAY_EXACT_MOMENTUM'
    | 'N_DAY_PALTI_RESONANCE'
    | 'N_DAY_FAMILY_CLUSTER'
    | 'N_DAY_RASHI_TRANSITION'
    | '5_DAY_EXACT_MOMENTUM'
    | '5_DAY_PALTI_RESONANCE'
    | '5_DAY_FAMILY_CLUSTER'
    | '5_DAY_RASHI_TRANSITION'
    | '1_WEEK_JODI_REPEAT'
    | '1_WEEK_PALTI_REPEAT'
    | 'CORE_FAMILY_ECHO'
    | 'FULL_RASHI_TRANSITION'
    | 'HALF_RASHI_SHIFT'
    | 'UNIVERSE_LEADERBOARD_PIVOT'
    | 'FRESH_GAP_EMERGENCE';

  patternArchetypeLabel: string;
  patternArchetypeBadgeColor: string;
  patternExplanation: string;
  
  // Confidence synergy score adjustment
  patternSynergyBonus: number;
  compositeConfidenceScore: number; // 0 - 100 calibrated confidence
  patternConfidenceCategory: 'HIGH_RESONANCE' | 'ACTIVE_CYCLE' | 'FRESH_BREAKOUT';
}

export interface RankedTop36Candidate {
  rank: number;
  pair: string;
  tens: number;
  ones: number;
  compositeConfidence: number;
  distinctEngineCount: number;
  totalOccurrences: number;
  engineSources: string[];
  
  // Dynamic N-Day Correlation Highlights
  historicalLookbackDays: number;
  recentDaysCorrelationScore: number;
  hasRecentExact: boolean;
  hasRecentPalti: boolean;
  hasRecentFamily: boolean;
  hasRecentRashi: boolean;

  // 5-Day Correlation Highlights (backward compatibility)
  fiveDayCorrelationScore: number;
  has5DayExact: boolean;
  has5DayPalti: boolean;
  has5DayFamily: boolean;
  has5DayRashi: boolean;
  
  // 4-Tier Segregation
  mlTier: CandidateMlTier;
  tierLabel: string;
  tierBadgeColor: string;
  tierRank: number; // 1 to 5, 1 to 5, 1 to 11, or 1 to 15
  
  // Universe Leaderboard Highlights
  universeRank?: number;
  universeFrequency?: number;
  inUniverseLeaderboard: boolean;
  
  // Pattern Identity
  familyRoot: string;
  fullRashiPair: string;
  reversePair: string;
  patternArchetypeLabel: string;
  patternBadgeColor: string;
  primaryRationale: string;

  // Actual Recorded Draw Match Verification (if draws exist for active date)
  actualDrawMatch?: {
    market: Market;
    drawNumber: string;
    matchType: 'EXACT' | 'PALTI' | 'FAMILY';
    label: string;
  };
}

export interface AllEnginesPatternAssessmentReport {
  targetDate: string;
  evaluatedDaysCount: number;
  historicalLookbackDays: number;
  totalCandidatesEvaluated: number;
  candidateAssessments: Record<string, CandidatePatternAssessment>;
  
  // Historical Draws Snapshot Log for selected window (e.g. 6 days)
  last5DaysDraws: FiveDayDrawSnapshot[];
  recentDaysDraws: FiveDayDrawSnapshot[];
  
  // Top 36 Calibrated Order of Confidence Candidates
  top36RankedPool: RankedTop36Candidate[];

  // 4-Tier Stratified Slices
  tier1Top5: RankedTop36Candidate[]; // Rank 1 to 5
  tier2Top10: RankedTop36Candidate[]; // Rank 6 to 10
  tier3Top21: RankedTop36Candidate[]; // Rank 11 to 21
  tier4Top36: RankedTop36Candidate[]; // Rank 22 to 36

  // Actual Recorded Draws for this date (if already in records)
  actualRecordedDrawsForDate?: {
    market: Market;
    number: string;
    familyRoot: string;
    fullRashi: string;
    isCapturedInTop36: boolean;
    isCapturedInTop5: boolean;
    isCapturedInTop10: boolean;
    capturedRank?: number;
    matchType?: 'EXACT' | 'PALTI' | 'FAMILY';
  }[];
  actualDrawCoverageRatePct?: number;
  
  // Summary Aggregates
  counts: {
    last5DaysExactOrPaltiCount: number;
    last5DaysFamilyHitsCount: number;
    last5DaysRashiHitsCount: number;
    universeLeaderboardMatchesCount: number;
    last1WeekJodiHitsCount: number;
    coreFamilyHitsCount: number;
    rashiHitsCount: number;
    freshEmergenceCount: number;
  };
  
  mostActiveFamiliesInPastWeek: {
    familyRoot: string;
    hitCount: number;
    numbers: string[];
  }[];

  topHistoricalLeaderboardOverlap: {
    rank: number;
    pair: string;
    frequency: number;
    inTop36: boolean;
    confidence: number;
  }[];

  // Self-Learning Historical Efficacy & Adaptive Weight Calibration Subsystem
  engineSelfLearningReport?: EngineSelfLearningReport;
}

/**
 * Calculates the complete 4-pair Core Family and 8-pair extended Family with Paltis.
 */
export function getCoreFamilyForPair(pair: string): JodiFamilyDefinition {
  const tens = parseInt(pair.charAt(0), 10) || 0;
  const ones = parseInt(pair.charAt(1), 10) || 0;

  const tRashi = RASHI_COMPLEMENT_MAP[tens] ?? ((tens + 5) % 10);
  const oRashi = RASHI_COMPLEMENT_MAP[ones] ?? ((ones + 5) % 10);

  const p1 = `${tens}${ones}`;
  const p2 = `${tens}${oRashi}`;
  const p3 = `${tRashi}${ones}`;
  const p4 = `${tRashi}${oRashi}`;

  const coreSet = Array.from(new Set([p1, p2, p3, p4])).sort();

  const extendedSet = new Set<string>();
  coreSet.forEach((num) => {
    extendedSet.add(num);
    extendedSet.add(getReversePair(num));
  });

  const sortedExtended = Array.from(extendedSet).sort();
  const familyRoot = `Family ${coreSet[0]}`;

  return {
    familyRoot,
    familyMembers: coreSet,
    allExtendedMembers: sortedExtended,
    description: `Core 4-member group [${coreSet.join(', ')}] with Rashi symmetry`,
  };
}

/**
 * Evaluates a single candidate number against historical draw records prior to targetDate,
 * with customizable historical lookback window (default 6 days) and 00-99 Universe Leaderboard weighting.
 */
export function assessCandidatePattern(
  pair: string,
  recordsPriorToDate: DayMarketEntry[],
  targetDateISO: string,
  universeLeaderboardMapOrLookback?:
    | Map<string, { rank: number; item: NumberAppearanceItem }>
    | number,
  historicalLookbackDays: number = 5
): CandidatePatternAssessment {
  let universeLeaderboardMap: Map<string, { rank: number; item: NumberAppearanceItem }> | undefined = undefined;
  let effectiveLookback = historicalLookbackDays;

  if (typeof universeLeaderboardMapOrLookback === 'number') {
    effectiveLookback = universeLeaderboardMapOrLookback;
  } else if (universeLeaderboardMapOrLookback instanceof Map) {
    universeLeaderboardMap = universeLeaderboardMapOrLookback;
  }

  const lookback = Math.max(2, Math.min(30, effectiveLookback || 5));
  const tens = parseInt(pair.charAt(0), 10) || 0;
  const ones = parseInt(pair.charAt(1), 10) || 0;
  const reversePair = getReversePair(pair);
  const fullRashiPair = getRashiPair(pair);

  const tRashi = RASHI_COMPLEMENT_MAP[tens] ?? ((tens + 5) % 10);
  const oRashi = RASHI_COMPLEMENT_MAP[ones] ?? ((ones + 5) % 10);
  const halfRashiTensPair = `${tRashi}${ones}`;
  const halfRashiOnesPair = `${tens}${oRashi}`;

  const familyDef = getCoreFamilyForPair(pair);
  const allExtendedFamilySet = new Set(familyDef.allExtendedMembers);

  // Sort records descending (most recent first)
  const sortedRecords = [...recordsPriorToDate]
    .filter((r) => r.date < targetDateISO)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Dynamic N-Day Collections
  const recentDaysExactHits: RecentDrawHit[] = [];
  const recentDaysPaltiHits: RecentDrawHit[] = [];
  const recentDaysFamilyHits: RecentDrawHit[] = [];
  const recentDaysFullRashiHits: RecentDrawHit[] = [];
  const recentDaysHalfRashiHits: RecentDrawHit[] = [];

  // 5-Day Collections (for backward compatibility)
  const last5DaysExactHits: RecentDrawHit[] = [];
  const last5DaysPaltiHits: RecentDrawHit[] = [];
  const last5DaysFamilyHits: RecentDrawHit[] = [];
  const last5DaysFullRashiHits: RecentDrawHit[] = [];
  const last5DaysHalfRashiHits: RecentDrawHit[] = [];

  // 7-14 Day Collections
  const last1WeekExactHits: RecentDrawHit[] = [];
  const last1WeekPaltiHits: RecentDrawHit[] = [];
  const last1WeekFamilyHits: RecentDrawHit[] = [];
  const last2WeeksFamilyHits: RecentDrawHit[] = [];
  const last1WeekFullRashiHits: RecentDrawHit[] = [];
  const last1WeekHalfRashiHits: RecentDrawHit[] = [];

  const targetDateObj = new Date(targetDateISO);

  sortedRecords.forEach((record, recIdx) => {
    const recordDateObj = new Date(record.date);
    const diffTime = Math.abs(targetDateObj.getTime() - recordDateObj.getTime());
    const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || (recIdx + 1);

    if (daysAgo > Math.max(14, lookback)) return;

    MARKETS.forEach((market) => {
      const key = (market === 'Ghaziabad' ? 'ghaziabad' : market.toLowerCase()) as keyof DayMarketEntry;
      const drawVal = record[key];
      if (!drawVal || typeof drawVal !== 'string') return;
      const num = drawVal.trim().padStart(2, '0');
      if (!/^\d{2}$/.test(num)) return;

      const isExact = num === pair;
      const isReverse = num === reversePair && num !== pair;
      const isFullRashi = num === fullRashiPair && num !== pair;
      const isHalfRashiTens = num === halfRashiTensPair && num !== pair && num !== fullRashiPair;
      const isHalfRashiOnes = num === halfRashiOnesPair && num !== pair && num !== fullRashiPair;
      const isFamilyMember = allExtendedFamilySet.has(num);

      const hitItem: RecentDrawHit = {
        date: record.date,
        daysAgo,
        market,
        number: num,
        isExact,
        isReverse,
        isFullRashi,
        isHalfRashiTens,
        isHalfRashiOnes,
        isFamilyMember,
      };

      // User-Configured Lookback Window
      if (daysAgo <= lookback) {
        if (isExact) recentDaysExactHits.push(hitItem);
        if (isReverse) recentDaysPaltiHits.push(hitItem);
        if (isFamilyMember) recentDaysFamilyHits.push(hitItem);
        if (isFullRashi) recentDaysFullRashiHits.push(hitItem);
        if (isHalfRashiTens || isHalfRashiOnes) recentDaysHalfRashiHits.push(hitItem);
      }

      // 5-Day Window
      if (daysAgo <= 5) {
        if (isExact) last5DaysExactHits.push(hitItem);
        if (isReverse) last5DaysPaltiHits.push(hitItem);
        if (isFamilyMember) last5DaysFamilyHits.push(hitItem);
        if (isFullRashi) last5DaysFullRashiHits.push(hitItem);
        if (isHalfRashiTens || isHalfRashiOnes) last5DaysHalfRashiHits.push(hitItem);
      }

      // 7-Day Window
      if (daysAgo <= 7) {
        if (isExact) last1WeekExactHits.push(hitItem);
        if (isReverse) last1WeekPaltiHits.push(hitItem);
        if (isFamilyMember) last1WeekFamilyHits.push(hitItem);
        if (isFullRashi) last1WeekFullRashiHits.push(hitItem);
        if (isHalfRashiTens || isHalfRashiOnes) last1WeekHalfRashiHits.push(hitItem);
      }

      if (daysAgo <= 14 && isFamilyMember) {
        last2WeeksFamilyHits.push(hitItem);
      }
    });
  });

  const hasRecentDaysExactHit = recentDaysExactHits.length > 0;
  const hasRecentDaysPaltiHit = recentDaysPaltiHits.length > 0;
  const hasRecentDaysFamilyHit = recentDaysFamilyHits.length > 0;
  const hasRecentDaysFullRashiHit = recentDaysFullRashiHits.length > 0;
  const hasRecentDaysHalfRashiHit = recentDaysHalfRashiHits.length > 0;
  const totalRecentDaysHits =
    recentDaysExactHits.length +
    recentDaysPaltiHits.length +
    recentDaysFamilyHits.length +
    recentDaysFullRashiHits.length +
    recentDaysHalfRashiHits.length;

  // Calculate N-Day Correlation Score (0 - 100)
  let recentDaysCorrelationScore = 0;
  if (hasRecentDaysExactHit) recentDaysCorrelationScore += 35;
  if (hasRecentDaysPaltiHit) recentDaysCorrelationScore += 25;
  if (hasRecentDaysFullRashiHit) recentDaysCorrelationScore += 20;
  if (hasRecentDaysHalfRashiHit) recentDaysCorrelationScore += 15;
  if (hasRecentDaysFamilyHit) recentDaysCorrelationScore += 18;
  recentDaysCorrelationScore = Math.min(100, recentDaysCorrelationScore);

  const hasLast5DaysExactHit = last5DaysExactHits.length > 0;
  const hasLast5DaysPaltiHit = last5DaysPaltiHits.length > 0;
  const hasLast5DaysFamilyHit = last5DaysFamilyHits.length > 0;
  const hasLast5DaysFullRashiHit = last5DaysFullRashiHits.length > 0;
  const hasLast5DaysHalfRashiHit = last5DaysHalfRashiHits.length > 0;
  const totalLast5DaysHits =
    last5DaysExactHits.length +
    last5DaysPaltiHits.length +
    last5DaysFamilyHits.length +
    last5DaysFullRashiHits.length +
    last5DaysHalfRashiHits.length;

  let fiveDayCorrelationScore = 0;
  if (hasLast5DaysExactHit) fiveDayCorrelationScore += 35;
  if (hasLast5DaysPaltiHit) fiveDayCorrelationScore += 25;
  if (hasLast5DaysFullRashiHit) fiveDayCorrelationScore += 20;
  if (hasLast5DaysHalfRashiHit) fiveDayCorrelationScore += 15;
  if (hasLast5DaysFamilyHit) fiveDayCorrelationScore += 18;
  fiveDayCorrelationScore = Math.min(100, fiveDayCorrelationScore);

  const hasLast1WeekExactHit = last1WeekExactHits.length > 0;
  const hasLast1WeekPaltiHit = last1WeekPaltiHits.length > 0;
  const totalLast1WeekJodiHits = last1WeekExactHits.length + last1WeekPaltiHits.length;
  const mostRecentJodiHit = last1WeekExactHits[0] || last1WeekPaltiHits[0] || null;

  const hasLast1WeekFamilyHit = last1WeekFamilyHits.length > 0;
  const totalLast1WeekFamilyHits = last1WeekFamilyHits.length;
  const activeFamilyMembersHit = Array.from(new Set(last1WeekFamilyHits.map((h) => h.number)));

  const hasLast1WeekFullRashiHit = last1WeekFullRashiHits.length > 0;
  const hasLast1WeekHalfRashiHit = last1WeekHalfRashiHits.length > 0;
  const totalLast1WeekRashiHits = last1WeekFullRashiHits.length + last1WeekHalfRashiHits.length;
  const mostRecentRashiHit = last1WeekFullRashiHits[0] || last1WeekHalfRashiHits[0] || null;

  // 00-99 Universe Leaderboard Lookup
  const universeInfo = universeLeaderboardMap?.get(pair);
  const universeLeaderboardRank = universeInfo?.rank;
  const universeHistoricalFrequency = universeInfo?.item.frequency;
  const universeCoverageStatus = universeInfo?.item.status;
  const universeDecileRange = universeInfo?.item.rangeDecile;
  const inUniverseTopLeaderboard = !!universeLeaderboardRank && universeLeaderboardRank <= 36;

  let universeLeaderboardSynergyScore = 0;
  if (universeLeaderboardRank) {
    if (universeLeaderboardRank <= 5) universeLeaderboardSynergyScore = 20;
    else if (universeLeaderboardRank <= 12) universeLeaderboardSynergyScore = 15;
    else if (universeLeaderboardRank <= 24) universeLeaderboardSynergyScore = 10;
    else if (universeLeaderboardRank <= 36) universeLeaderboardSynergyScore = 7;
  }

  // Determine Primary Pattern Archetype Classification
  let primaryPatternType: CandidatePatternAssessment['primaryPatternType'] = 'FRESH_GAP_EMERGENCE';
  let patternArchetypeLabel = 'Fresh Breakout';
  let patternArchetypeBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  let patternExplanation = 'Fresh pair emergence with balanced statistical dispersion.';
  let patternSynergyBonus = 0;
  let patternConfidenceCategory: CandidatePatternAssessment['patternConfidenceCategory'] = 'FRESH_BREAKOUT';

  if (hasRecentDaysExactHit) {
    primaryPatternType = 'N_DAY_EXACT_MOMENTUM';
    patternArchetypeLabel = `${lookback}-Day Exact Momentum`;
    patternArchetypeBadgeColor = 'bg-amber-500/25 text-amber-300 border-amber-400 font-bold';
    patternExplanation = `Recent ${lookback}-day exact draw repeat (#${pair} hit in ${recentDaysExactHits[0].market} ${recentDaysExactHits[0].daysAgo}d ago).`;
    patternSynergyBonus = 16;
    patternConfidenceCategory = 'HIGH_RESONANCE';
  } else if (hasRecentDaysPaltiHit) {
    primaryPatternType = 'N_DAY_PALTI_RESONANCE';
    patternArchetypeLabel = `${lookback}-Day Palti Echo`;
    patternArchetypeBadgeColor = 'bg-purple-500/25 text-purple-300 border-purple-400 font-bold';
    patternExplanation = `Recent ${lookback}-day Palti resonance (#${reversePair} hit in ${recentDaysPaltiHits[0].market} ${recentDaysPaltiHits[0].daysAgo}d ago).`;
    patternSynergyBonus = 14;
    patternConfidenceCategory = 'HIGH_RESONANCE';
  } else if (hasRecentDaysFullRashiHit) {
    primaryPatternType = 'N_DAY_RASHI_TRANSITION';
    patternArchetypeLabel = `${lookback}-Day Rashi Mirror`;
    patternArchetypeBadgeColor = 'bg-emerald-500/25 text-emerald-300 border-emerald-400 font-bold';
    patternExplanation = `${lookback}-day Full Rashi mirror of #${fullRashiPair} (${recentDaysFullRashiHits[0].market} ${recentDaysFullRashiHits[0].daysAgo}d ago).`;
    patternSynergyBonus = 12;
    patternConfidenceCategory = 'HIGH_RESONANCE';
  } else if (hasRecentDaysFamilyHit) {
    primaryPatternType = 'N_DAY_FAMILY_CLUSTER';
    patternArchetypeLabel = `${lookback}-Day Family Hot`;
    patternArchetypeBadgeColor = 'bg-indigo-500/25 text-indigo-300 border-indigo-400 font-bold';
    patternExplanation = `Active ${lookback}-day ${familyDef.familyRoot} cluster (${recentDaysFamilyHits.length} hits recorded in past ${lookback} days).`;
    patternSynergyBonus = 11;
    patternConfidenceCategory = 'ACTIVE_CYCLE';
  } else if (inUniverseTopLeaderboard) {
    primaryPatternType = 'UNIVERSE_LEADERBOARD_PIVOT';
    patternArchetypeLabel = `Univ Leaderboard #${universeLeaderboardRank}`;
    patternArchetypeBadgeColor = 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-bold';
    patternExplanation = `00–99 Universe Historical Leaderboard Rank #${universeLeaderboardRank} with ${universeHistoricalFrequency} total occurrences.`;
    patternSynergyBonus = 10;
    patternConfidenceCategory = 'HIGH_RESONANCE';
  } else if (hasLast1WeekExactHit || hasLast1WeekPaltiHit) {
    primaryPatternType = '1_WEEK_JODI_REPEAT';
    patternArchetypeLabel = '1-Week Jodi Cycle';
    patternArchetypeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    patternExplanation = `1-week cycle occurrence (#${pair} or #${reversePair} active in 7-day window).`;
    patternSynergyBonus = 8;
    patternConfidenceCategory = 'ACTIVE_CYCLE';
  } else if (hasLast1WeekFullRashiHit || hasLast1WeekHalfRashiHit) {
    primaryPatternType = 'HALF_RASHI_SHIFT';
    patternArchetypeLabel = 'Rashi Symmetry Shift';
    patternArchetypeBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    patternExplanation = `Rashi complement step from recent 7-day draw outcomes.`;
    patternSynergyBonus = 7;
    patternConfidenceCategory = 'ACTIVE_CYCLE';
  } else if (hasLast1WeekFamilyHit) {
    primaryPatternType = 'CORE_FAMILY_ECHO';
    patternArchetypeLabel = 'Core Family Cycle';
    patternArchetypeBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    patternExplanation = `Sustained ${familyDef.familyRoot} cluster presence over 7-14 days.`;
    patternSynergyBonus = 6;
    patternConfidenceCategory = 'ACTIVE_CYCLE';
  }

  // Composite Calibrated Confidence (0 - 100)
  const compositeConfidenceScore = Math.min(
    99.4,
    Math.max(
      20.0,
      Math.round(
        (recentDaysCorrelationScore * 0.35 +
          universeLeaderboardSynergyScore * 1.5 +
          patternSynergyBonus * 2.2 +
          (totalRecentDaysHits > 0 ? 15 : 0) +
          (inUniverseTopLeaderboard ? 12 : 0) +
          25) * 10
      ) / 10
    )
  );

  return {
    pair,
    tens,
    ones,
    reversePair,
    fullRashiPair,
    halfRashiTensPair,
    halfRashiOnesPair,
    familyRoot: familyDef.familyRoot,
    familyMembers: familyDef.familyMembers,
    allFamilyMembersWithPalti: familyDef.allExtendedMembers,
    historicalLookbackDays: lookback,
    recentDaysExactHits,
    recentDaysPaltiHits,
    recentDaysFamilyHits,
    recentDaysFullRashiHits,
    recentDaysHalfRashiHits,
    hasRecentDaysExactHit,
    hasRecentDaysPaltiHit,
    hasRecentDaysFamilyHit,
    hasRecentDaysFullRashiHit,
    hasRecentDaysHalfRashiHit,
    totalRecentDaysHits,
    recentDaysCorrelationScore,
    last5DaysExactHits,
    last5DaysPaltiHits,
    last5DaysFamilyHits,
    last5DaysFullRashiHits,
    last5DaysHalfRashiHits,
    hasLast5DaysExactHit,
    hasLast5DaysPaltiHit,
    hasLast5DaysFamilyHit,
    hasLast5DaysFullRashiHit,
    hasLast5DaysHalfRashiHit,
    totalLast5DaysHits,
    fiveDayCorrelationScore,
    last1WeekExactHits,
    last1WeekPaltiHits,
    hasLast1WeekExactHit,
    hasLast1WeekPaltiHit,
    totalLast1WeekJodiHits,
    mostRecentJodiHit,
    last1WeekFamilyHits,
    last2WeeksFamilyHits,
    hasLast1WeekFamilyHit,
    totalLast1WeekFamilyHits,
    activeFamilyMembersHit,
    last1WeekFullRashiHits,
    last1WeekHalfRashiHits,
    hasLast1WeekFullRashiHit,
    hasLast1WeekHalfRashiHit,
    totalLast1WeekRashiHits,
    mostRecentRashiHit,
    universeLeaderboardRank,
    universeHistoricalFrequency,
    universeCoverageStatus,
    universeDecileRange,
    inUniverseTopLeaderboard,
    universeLeaderboardSynergyScore,
    primaryPatternType,
    patternArchetypeLabel,
    patternArchetypeBadgeColor,
    patternExplanation,
    patternSynergyBonus,
    compositeConfidenceScore,
    patternConfidenceCategory,
  };
}

/**
 * Assesses an entire pool of candidate numbers across all engines, correlates with historical draws
 * across the selected lookback range (default 6 days), incorporates 00-99 Universe Leaderboard data,
 * and calculates the Top 36 calibrated candidate ranking with explicit 4-Tier Segregation and Actual Draw verification.
 */
export function assessAllEngineCandidates(
  candidatePairs: string[],
  recordsPriorToDate: DayMarketEntry[],
  targetDateISO: string,
  candidateEngineDetails?: Map<
    string,
    { distinctEngines: number; totalOccurrences: number; engines: string[] }
  >,
  precomputedLearningReportOrDays?: EngineSelfLearningReport | number,
  historicalLookbackDaysParam?: number
): AllEnginesPatternAssessmentReport {
  let precomputedLearningReport: EngineSelfLearningReport | undefined = undefined;
  let effectiveLookbackDays = 6;

  if (typeof precomputedLearningReportOrDays === 'number') {
    effectiveLookbackDays = precomputedLearningReportOrDays;
  } else if (precomputedLearningReportOrDays && typeof precomputedLearningReportOrDays === 'object') {
    precomputedLearningReport = precomputedLearningReportOrDays;
    if (typeof historicalLookbackDaysParam === 'number') {
      effectiveLookbackDays = historicalLookbackDaysParam;
    }
  } else if (typeof historicalLookbackDaysParam === 'number') {
    effectiveLookbackDays = historicalLookbackDaysParam;
  }

  const lookback = Math.max(2, Math.min(30, effectiveLookbackDays));
  const uniquePairs = Array.from(new Set(candidatePairs));
  const candidateAssessments: Record<string, CandidatePatternAssessment> = {};

  // Run or use Self-Learning Engine Calibration across all historical draws
  const engineSelfLearningReport: EngineSelfLearningReport =
    precomputedLearningReport ||
    trainAndCalibrateAllEngines(recordsPriorToDate, targetDateISO, 30);

  const engineEfficacies = engineSelfLearningReport?.engineEfficacies || {};

  // Build Universe 00-99 Historical Leaderboard Map
  const universeCoverageReport = analyzeMonthlyNumberCoverage(recordsPriorToDate, targetDateISO);
  const universeLeaderboardMap = new Map<string, { rank: number; item: NumberAppearanceItem }>();
  universeCoverageReport.appearedNumbers.forEach((item, idx) => {
    universeLeaderboardMap.set(item.number, { rank: idx + 1, item });
  });

  let last5DaysExactOrPaltiCount = 0;
  let last5DaysFamilyHitsCount = 0;
  let last5DaysRashiHitsCount = 0;
  let universeLeaderboardMatchesCount = 0;
  let last1WeekJodiHitsCount = 0;
  let coreFamilyHitsCount = 0;
  let rashiHitsCount = 0;
  let freshEmergenceCount = 0;

  const familyHitMap = new Map<string, { count: number; numbers: Set<string> }>();

  // Extract recent N-day draws snapshot (sorted descending)
  const sortedRecords = [...recordsPriorToDate]
    .filter((r) => r.date < targetDateISO)
    .sort((a, b) => b.date.localeCompare(a.date));

  const targetDateObj = new Date(targetDateISO);
  const recentDaysDraws: FiveDayDrawSnapshot[] = [];

  sortedRecords.slice(0, lookback).forEach((rec, recIdx) => {
    const recordDateObj = new Date(rec.date);
    const diffTime = Math.abs(targetDateObj.getTime() - recordDateObj.getTime());
    const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || (recIdx + 1);

    const draws: FiveDayDrawSnapshot['draws'] = [];
    MARKETS.forEach((m) => {
      const key = (m === 'Ghaziabad' ? 'ghaziabad' : m.toLowerCase()) as keyof DayMarketEntry;
      const val = rec[key];
      if (val && typeof val === 'string' && /^\d{2}$/.test(val.trim())) {
        const num = val.trim().padStart(2, '0');
        const tens = parseInt(num.charAt(0), 10);
        const ones = parseInt(num.charAt(1), 10);
        const fam = getCoreFamilyForPair(num);
        draws.push({
          market: m,
          number: num,
          tens,
          ones,
          familyRoot: fam.familyRoot,
          fullRashi: getRashiPair(num),
        });
      }
    });

    recentDaysDraws.push({
      date: rec.date,
      daysAgo,
      draws,
    });
  });

  const last5DaysDraws = recentDaysDraws.slice(0, 5);

  // Check if targetDateISO itself has actual recorded draws in recordsPriorToDate
  const targetDateRecord = recordsPriorToDate.find((r) => r.date === targetDateISO);
  const actualRecordedDrawsForDate: AllEnginesPatternAssessmentReport['actualRecordedDrawsForDate'] = [];
  const actualDrawsLookup = new Map<string, { market: Market; number: string }>();

  if (targetDateRecord) {
    MARKETS.forEach((m) => {
      const key = (m === 'Ghaziabad' ? 'ghaziabad' : m.toLowerCase()) as keyof DayMarketEntry;
      const val = targetDateRecord[key];
      if (val && typeof val === 'string' && /^\d{2}$/.test(val.trim())) {
        const num = val.trim().padStart(2, '0');
        const fam = getCoreFamilyForPair(num);
        actualRecordedDrawsForDate.push({
          market: m,
          number: num,
          familyRoot: fam.familyRoot,
          fullRashi: getRashiPair(num),
          isCapturedInTop36: false,
          isCapturedInTop5: false,
          isCapturedInTop10: false,
        });
        actualDrawsLookup.set(num, { market: m, number: num });
      }
    });
  }

  uniquePairs.forEach((pair) => {
    const assessment = assessCandidatePattern(
      pair,
      recordsPriorToDate,
      targetDateISO,
      universeLeaderboardMap,
      lookback
    );
    candidateAssessments[pair] = assessment;

    if (assessment.hasRecentDaysExactHit || assessment.hasRecentDaysPaltiHit) {
      last5DaysExactOrPaltiCount++;
    }
    if (assessment.hasRecentDaysFamilyHit) {
      last5DaysFamilyHitsCount++;
    }
    if (assessment.hasRecentDaysFullRashiHit || assessment.hasRecentDaysHalfRashiHit) {
      last5DaysRashiHitsCount++;
    }
    if (assessment.inUniverseTopLeaderboard) {
      universeLeaderboardMatchesCount++;
    }

    if (assessment.hasLast1WeekExactHit || assessment.hasLast1WeekPaltiHit) {
      last1WeekJodiHitsCount++;
    } else if (assessment.hasLast1WeekFullRashiHit || assessment.hasLast1WeekHalfRashiHit) {
      rashiHitsCount++;
    } else if (assessment.hasLast1WeekFamilyHit) {
      coreFamilyHitsCount++;
    } else {
      freshEmergenceCount++;
    }

    if (assessment.hasLast1WeekFamilyHit) {
      const famKey = assessment.familyRoot;
      const existing = familyHitMap.get(famKey) || { count: 0, numbers: new Set<string>() };
      existing.count += assessment.last1WeekFamilyHits.length;
      assessment.activeFamilyMembersHit.forEach((n) => existing.numbers.add(n));
      familyHitMap.set(famKey, existing);
    }
  });

  // PRE-COMPUTATIONS FOR VAULT RULES ALIGNMENT
  let activeRules: any[] = [];
  try {
    activeRules = loadSavedRulesFromStorage();
  } catch (err) {
    activeRules = DEFAULT_MASTER_RULES;
  }
  const enabledRules = activeRules.filter(
    (r) => r.status === 'ACTIVE_ENFORCED' || r.status === 'HIGH_CONFIDENCE' || r.status === 'CUSTOM_ACTIVE'
  );

  // 1. Spillover Tracker (ML-RULE-103)
  const prevDayRecord = sortedRecords[0];
  const prevDeshawar = prevDayRecord?.deshawar?.trim();
  const hasSpilloverActive = prevDeshawar && /^\d{2}$/.test(prevDeshawar);
  const prevDeshawarFamily = hasSpilloverActive ? getCoreFamilyForPair(prevDeshawar).familyRoot : '';

  // 2. Family Harmonic Window (ML-RULE-104)
  const last3DaysDrawnNumbers = new Set<string>();
  const last3DaysFamilyRoots = new Set<string>();
  sortedRecords.slice(0, 3).forEach((rec) => {
    MARKETS.forEach((m) => {
      const key = (m === 'Ghaziabad' ? 'ghaziabad' : m.toLowerCase()) as keyof DayMarketEntry;
      const val = rec[key];
      if (val && typeof val === 'string' && /^\d{2}$/.test(val.trim())) {
        const num = val.trim().padStart(2, '0');
        last3DaysDrawnNumbers.add(num);
        try {
          const fam = getCoreFamilyForPair(num);
          last3DaysFamilyRoots.add(fam.familyRoot);
        } catch (e) {}
      }
    });
  });

  // 3. High-Frequency Haruf Ank Lock (ML-RULE-105)
  const digitsDay0 = new Set<string>();
  const digitsDay1 = new Set<string>();
  const digitsDay2 = new Set<string>();
  const daysDigitSets = [digitsDay0, digitsDay1, digitsDay2];
  sortedRecords.slice(0, 3).forEach((rec, dayIdx) => {
    const digitSet = daysDigitSets[dayIdx];
    MARKETS.forEach((m) => {
      const key = (m === 'Ghaziabad' ? 'ghaziabad' : m.toLowerCase()) as keyof DayMarketEntry;
      const val = rec[key];
      if (val && typeof val === 'string' && /^\d{2}$/.test(val.trim())) {
        const num = val.trim().padStart(2, '0');
        digitSet.add(num.charAt(0));
        digitSet.add(num.charAt(1));
      }
    });
  });
  const continuousHarufDigits = new Set<string>();
  for (let d = 0; d <= 9; d++) {
    const dStr = d.toString();
    if (digitsDay0.has(dStr) && digitsDay1.has(dStr) && digitsDay2.has(dStr)) {
      continuousHarufDigits.add(dStr);
    }
  }

  // 4. Double-Digit Surge Defense (ML-RULE-106)
  let hasDoublesInLast4Days = false;
  sortedRecords.slice(0, 4).forEach((rec) => {
    MARKETS.forEach((m) => {
      const key = (m === 'Ghaziabad' ? 'ghaziabad' : m.toLowerCase()) as keyof DayMarketEntry;
      const val = rec[key];
      if (val && typeof val === 'string' && /^\d{2}$/.test(val.trim())) {
        const num = val.trim().padStart(2, '0');
        if (num.charAt(0) === num.charAt(1)) {
          hasDoublesInLast4Days = true;
        }
      }
    });
  });
  const isDoubleSurgeActive = !hasDoublesInLast4Days && sortedRecords.length >= 4;

  // Calculate Top 36 Calibrated Pool in order of confidence with Machine Learning Efficacy Weights
  const candidateScoredList = uniquePairs.map((pair) => {
    const assessment = candidateAssessments[pair];
    const details = candidateEngineDetails?.get(pair) || {
      distinctEngines: 1,
      totalOccurrences: 1,
      engines: ['Engine Signal'],
    };

    // Calculate aggregated learned multiplier for participating engines
    let engineMultiplierSum = 0;
    let engineMultiplierCount = 0;
    details.engines.forEach((engName) => {
      let weight = 1.0;
      if (engName.includes('Univ') && engineEfficacies?.UNIVERSE_COVERAGE) {
        weight = engineEfficacies.UNIVERSE_COVERAGE.learnedWeightMultiplier ?? 1.0;
      } else if (engName.includes('Date') && engineEfficacies?.DATE_GEN) {
        weight = engineEfficacies.DATE_GEN.learnedWeightMultiplier ?? 1.0;
      } else if (engName.includes('Prev') && engineEfficacies?.PREV_DAY) {
        weight = engineEfficacies.PREV_DAY.learnedWeightMultiplier ?? 1.0;
      } else if (engName.includes('Abhishek') && engineEfficacies?.SIR_ABHISHEK) {
        weight = engineEfficacies.SIR_ABHISHEK.learnedWeightMultiplier ?? 1.0;
      } else if (engName.includes('Delta') && engineEfficacies?.DELTA_METHOD) {
        weight = engineEfficacies.DELTA_METHOD.learnedWeightMultiplier ?? 1.0;
      } else if (engName.includes('Beta') && engineEfficacies?.BETA_TESTING) {
        weight = engineEfficacies.BETA_TESTING.learnedWeightMultiplier ?? 1.0;
      }
      engineMultiplierSum += weight;
      engineMultiplierCount++;
    });
    const avgEngineMultiplier = engineMultiplierCount > 0 ? engineMultiplierSum / engineMultiplierCount : 1.0;

    const nDayWeight = engineEfficacies?.FIVE_DAY_CORRELATION?.learnedWeightMultiplier || 1.18;
    const universeWeight = engineEfficacies?.UNIVERSE_COVERAGE?.learnedWeightMultiplier || 1.25;

    // Advanced Correlation & Consensus Confidence Formula:
    let multiEngineWeight = details.distinctEngines * 16.5 * avgEngineMultiplier;
    if (details.distinctEngines >= 3) multiEngineWeight += 14 * avgEngineMultiplier;
    if (details.totalOccurrences >= 3) multiEngineWeight += 6;

    const nDayBonus = assessment.recentDaysCorrelationScore * 0.24 * nDayWeight;
    const universeBonus = assessment.universeLeaderboardSynergyScore * 0.9 * universeWeight;
    const patternBonus = assessment.patternSynergyBonus * 0.8;

    // Dynamically calculate and apply Rules Vault multipliers across all engines
    let ruleMultiplier = 1.0;
    enabledRules.forEach((rule) => {
      // Rule 1: Multi-Engine Family Convergence Acceleration (ML-RULE-101)
      if (rule.ruleCode === 'ML-RULE-101' || rule.category === 'CONVERGENCE') {
        if (details.distinctEngines >= 3) {
          ruleMultiplier *= (rule.impactWeightBoost || 1.35);
        }
      }

      // Rule 2: High-Confidence Palti Inversion Safeguard (ML-RULE-102)
      if (rule.ruleCode === 'ML-RULE-102' || rule.category === 'PALTI_REVERSAL') {
        const rev = getReversePair(pair);
        if (rev !== pair && candidateAssessments[rev]) {
          ruleMultiplier *= (rule.impactWeightBoost || 1.25);
        }
      }

      // Rule 3: Deshawar -> Faridabad 24h Spillover Rule (ML-RULE-103)
      if (rule.ruleCode === 'ML-RULE-103' || rule.category === 'MARKET_SPILLOVER') {
        if (hasSpilloverActive && (assessment.familyRoot === prevDeshawarFamily || pair === prevDeshawar || assessment.reversePair === prevDeshawar)) {
          ruleMultiplier *= (rule.impactWeightBoost || 1.28);
        }
      }

      // Rule 4: Primary Root Family 4-Way Extension (ML-RULE-104)
      if (rule.ruleCode === 'ML-RULE-104' || rule.category === 'FAMILY_HARMONIC') {
        if (last3DaysFamilyRoots.has(assessment.familyRoot) && !last3DaysDrawnNumbers.has(pair)) {
          ruleMultiplier *= (rule.impactWeightBoost || 1.18);
        }
      }

      // Rule 5: Single-Digit Haruf Ank Continuity Lock (ML-RULE-105)
      if (rule.ruleCode === 'ML-RULE-105' || rule.category === 'HARUF_RESONANCE') {
        if (continuousHarufDigits.has(pair.charAt(0)) || continuousHarufDigits.has(pair.charAt(1))) {
          ruleMultiplier *= (rule.impactWeightBoost || 1.22);
        }
      }

      // Rule 6: Jodi Double-Digit Repeat Surge Defense (ML-RULE-106)
      if (rule.ruleCode === 'ML-RULE-106' || rule.category === 'DOUBLE_JODI_SURGE') {
        if (isDoubleSurgeActive && pair.charAt(0) === pair.charAt(1)) {
          ruleMultiplier *= (rule.impactWeightBoost || 1.15);
        }
      }
    });

    const totalConfidence = Math.min(
      99.4,
      Math.max(
        18.0,
        Math.round((multiEngineWeight + nDayBonus + universeBonus + patternBonus + 12) * ruleMultiplier * 10) / 10
      )
    );

    // Cross-match with actual recorded draw for target date if available
    let actualDrawMatch: RankedTop36Candidate['actualDrawMatch'] = undefined;
    if (actualRecordedDrawsForDate.length > 0) {
      for (const d of actualRecordedDrawsForDate) {
        if (d.number === pair) {
          actualDrawMatch = {
            market: d.market,
            drawNumber: d.number,
            matchType: 'EXACT',
            label: `⚡ EXACT HIT (${d.market}: ${d.number})`,
          };
          break;
        } else if (d.number === assessment.reversePair) {
          actualDrawMatch = {
            market: d.market,
            drawNumber: d.number,
            matchType: 'PALTI',
            label: `🔄 PALTI HIT (${d.market}: ${d.number})`,
          };
          break;
        } else if (assessment.allFamilyMembersWithPalti.includes(d.number)) {
          actualDrawMatch = {
            market: d.market,
            drawNumber: d.number,
            matchType: 'FAMILY',
            label: `👥 FAMILY HIT (${d.market}: ${d.number})`,
          };
        }
      }
    }

    return {
      pair,
      tens: assessment.tens,
      ones: assessment.ones,
      compositeConfidence: totalConfidence,
      distinctEngineCount: details.distinctEngines,
      totalOccurrences: details.totalOccurrences,
      engineSources: details.engines,
      historicalLookbackDays: lookback,
      recentDaysCorrelationScore: assessment.recentDaysCorrelationScore,
      hasRecentExact: assessment.hasRecentDaysExactHit,
      hasRecentPalti: assessment.hasRecentDaysPaltiHit,
      hasRecentFamily: assessment.hasRecentDaysFamilyHit,
      hasRecentRashi: assessment.hasRecentDaysFullRashiHit || assessment.hasRecentDaysHalfRashiHit,
      fiveDayCorrelationScore: assessment.fiveDayCorrelationScore,
      has5DayExact: assessment.hasLast5DaysExactHit,
      has5DayPalti: assessment.hasLast5DaysPaltiHit,
      has5DayFamily: assessment.hasLast5DaysFamilyHit,
      has5DayRashi: assessment.hasLast5DaysFullRashiHit || assessment.hasLast5DaysHalfRashiHit,
      universeRank: assessment.universeLeaderboardRank,
      universeFrequency: assessment.universeHistoricalFrequency,
      inUniverseLeaderboard: assessment.inUniverseTopLeaderboard,
      familyRoot: assessment.familyRoot,
      fullRashiPair: assessment.fullRashiPair,
      reversePair: assessment.reversePair,
      patternArchetypeLabel: assessment.patternArchetypeLabel,
      patternBadgeColor: assessment.patternArchetypeBadgeColor,
      primaryRationale: assessment.patternExplanation,
      actualDrawMatch,
    };
  });

  // Sort strictly by composite confidence descending
  candidateScoredList.sort((a, b) => {
    if (b.compositeConfidence !== a.compositeConfidence) {
      return b.compositeConfidence - a.compositeConfidence;
    }
    if (b.distinctEngineCount !== a.distinctEngineCount) {
      return b.distinctEngineCount - a.distinctEngineCount;
    }
    if (b.recentDaysCorrelationScore !== a.recentDaysCorrelationScore) {
      return b.recentDaysCorrelationScore - a.recentDaysCorrelationScore;
    }
    return (a.universeRank || 999) - (b.universeRank || 999);
  });

  // Stratify into Top 4 Tiers
  const top36RankedPool: RankedTop36Candidate[] = candidateScoredList
    .slice(0, 36)
    .map((item, idx) => {
      const rank = idx + 1;
      let mlTier: CandidateMlTier = 'TIER_4_TOP_36_BUFFER';
      let tierLabel = 'Tier 4: Strategic Defense';
      let tierBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
      let tierRank = rank - 21;

      if (rank <= 5) {
        mlTier = 'TIER_1_TOP_5_PRIME';
        tierLabel = 'Tier 1: Top 5 Prime Anchors';
        tierBadgeColor = 'bg-amber-500/25 text-amber-300 border-amber-400 font-bold';
        tierRank = rank;
      } else if (rank <= 10) {
        mlTier = 'TIER_2_TOP_10_HIGH_HIT';
        tierLabel = 'Tier 2: Top 6–10 High Hit';
        tierBadgeColor = 'bg-indigo-500/25 text-indigo-300 border-indigo-400 font-bold';
        tierRank = rank - 5;
      } else if (rank <= 21) {
        mlTier = 'TIER_3_TOP_21_CALIBRATED';
        tierLabel = 'Tier 3: Top 11–21 Calibrated';
        tierBadgeColor = 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-bold';
        tierRank = rank - 10;
      }

      return {
        ...item,
        rank,
        mlTier,
        tierLabel,
        tierBadgeColor,
        tierRank,
      };
    });

  // Update actualRecordedDrawsForDate with hit flags
  actualRecordedDrawsForDate.forEach((ad) => {
    const matchedCandidate = top36RankedPool.find(
      (c) => c.pair === ad.number || c.reversePair === ad.number || c.familyRoot === ad.familyRoot
    );
    if (matchedCandidate) {
      ad.isCapturedInTop36 = true;
      ad.capturedRank = matchedCandidate.rank;
      ad.isCapturedInTop5 = matchedCandidate.rank <= 5;
      ad.isCapturedInTop10 = matchedCandidate.rank <= 10;
      if (matchedCandidate.pair === ad.number) ad.matchType = 'EXACT';
      else if (matchedCandidate.reversePair === ad.number) ad.matchType = 'PALTI';
      else ad.matchType = 'FAMILY';
    }
  });

  const capturedDrawsCount = actualRecordedDrawsForDate.filter((d) => d.isCapturedInTop36).length;
  const actualDrawCoverageRatePct =
    actualRecordedDrawsForDate.length > 0
      ? Math.round((capturedDrawsCount / actualRecordedDrawsForDate.length) * 100)
      : undefined;

  const tier1Top5 = top36RankedPool.filter((c) => c.mlTier === 'TIER_1_TOP_5_PRIME');
  const tier2Top10 = top36RankedPool.filter((c) => c.mlTier === 'TIER_2_TOP_10_HIGH_HIT');
  const tier3Top21 = top36RankedPool.filter((c) => c.mlTier === 'TIER_3_TOP_21_CALIBRATED');
  const tier4Top36 = top36RankedPool.filter((c) => c.mlTier === 'TIER_4_TOP_36_BUFFER');

  const mostActiveFamiliesInPastWeek = Array.from(familyHitMap.entries())
    .map(([fam, data]) => ({
      familyRoot: fam,
      hitCount: data.count,
      numbers: Array.from(data.numbers),
    }))
    .sort((a, b) => b.hitCount - a.hitCount);

  const top36Set = new Set(top36RankedPool.map((c) => c.pair));
  const topHistoricalLeaderboardOverlap = universeCoverageReport.appearedNumbers
    .slice(0, 12)
    .map((item, idx) => ({
      rank: idx + 1,
      pair: item.number,
      frequency: item.frequency,
      inTop36: top36Set.has(item.number),
      confidence: candidateAssessments[item.number]?.compositeConfidenceScore || 50,
    }));

  return {
    targetDate: targetDateISO,
    evaluatedDaysCount: lookback,
    historicalLookbackDays: lookback,
    totalCandidatesEvaluated: uniquePairs.length,
    candidateAssessments,
    last5DaysDraws,
    recentDaysDraws,
    top36RankedPool,
    tier1Top5,
    tier2Top10,
    tier3Top21,
    tier4Top36,
    actualRecordedDrawsForDate: actualRecordedDrawsForDate.length > 0 ? actualRecordedDrawsForDate : undefined,
    actualDrawCoverageRatePct,
    counts: {
      last5DaysExactOrPaltiCount,
      last5DaysFamilyHitsCount,
      last5DaysRashiHitsCount,
      universeLeaderboardMatchesCount,
      last1WeekJodiHitsCount,
      coreFamilyHitsCount,
      rashiHitsCount,
      freshEmergenceCount,
    },
    mostActiveFamiliesInPastWeek,
    topHistoricalLeaderboardOverlap,
    engineSelfLearningReport,
  };
}

