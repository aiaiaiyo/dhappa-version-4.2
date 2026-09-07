export const PATTERN_DASHBOARD_SCHEMA_VERSION = '1.0.0';

export type PatternDashboardEngineId =
  | 'DATE_GEN'
  | 'PREV_DAY'
  | 'SIR_ABHISHEK'
  | 'DELTA_METHOD'
  | 'BETA_TESTING'
  | 'UNIVERSE_COVERAGE'
  | 'FIVE_DAY_CORRELATION'
  | 'G_SQUARE_METHOD'
  | 'BELGIUM_SQUARE_METHOD';

export interface PatternDashboardBadge {
  engineId: PatternDashboardEngineId;
  engineName: string;
  engineShort: string;
  badgeColor: string;
  detail: string;
}

export interface PatternDashboardCandidate {
  pair: string;
  possibilityScore: number;
  occurrenceCount: number;
  distinctEngineCount: number;
  reversePair: string;
  engineBadges: PatternDashboardBadge[];
  compositeConfidenceScore?: number;
  historicalHitRate?: number;
  inCoverageLeaderboard?: boolean;
  universeRank?: number;
  universeFrequency?: number;
  universeStatus?: string;
  primaryPatternType?: string;
  patternArchetypeLabel?: string;
  patternArchetypeBadgeColor?: string;
  patternExplanation?: string;
  isPrimaryFamilyMember?: boolean;
  familyRoot?: string;
  primaryFamilyRoot?: string;
  convergenceTier?: string;
  evidenceLevel?: string;
}

export interface PatternDashboardMetrics {
  totalCandidates: number;
  primaryCandidate: string | null;
  top5: string[];
  averagePossibilityScore: number;
  averageConfidenceScore: number;
  highConvictionCount: number;
}

export interface PatternDashboardSnapshot {
  schemaVersion: string;
  targetDate: string;
  dashboardMode: 'unified_all' | 'multi_signal';
  generatedAt: string;
  updatedAt: string;
  candidates: PatternDashboardCandidate[];
  metrics: PatternDashboardMetrics;
  metadata: {
    prevDate: string | null;
    totalUniquePairs: number;
    totalEngineSignals: number;
    source: 'computed';
  };
}

function toIsoDate(value?: string | null): string {
  const candidate = (value || new Date().toISOString()).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : new Date().toISOString().slice(0, 10);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizePair(value: unknown, fallback = '00'): string {
  const raw = String(value ?? fallback).trim();
  if (!/^\d{2}$/.test(raw)) {
    return fallback;
  }
  return raw.padStart(2, '0');
}

function normalizeBadge(input: Partial<PatternDashboardBadge> = {}): PatternDashboardBadge {
  const engineId = (input.engineId || 'DATE_GEN') as PatternDashboardEngineId;
  return {
    engineId,
    engineName: String(input.engineName || 'Pattern Engine'),
    engineShort: String(input.engineShort || 'ENG'),
    badgeColor: String(input.badgeColor || 'bg-slate-500/20 text-slate-200'),
    detail: String(input.detail || ''),
  };
}

function normalizeCandidate(input: Partial<PatternDashboardCandidate> = {}): PatternDashboardCandidate {
  const pair = normalizePair(input.pair, '00');
  const reversePair = normalizePair(input.reversePair, `${pair[1]}${pair[0]}`);

  return {
    pair,
    possibilityScore: toFiniteNumber(input.possibilityScore, 0),
    occurrenceCount: Math.max(0, Math.round(toFiniteNumber(input.occurrenceCount, 0))),
    distinctEngineCount: Math.max(0, Math.round(toFiniteNumber(input.distinctEngineCount, 0))),
    reversePair,
    engineBadges: Array.isArray(input.engineBadges)
      ? input.engineBadges.map((badge) => normalizeBadge(badge as Partial<PatternDashboardBadge>))
      : [],
    compositeConfidenceScore: input.compositeConfidenceScore === undefined ? undefined : toFiniteNumber(input.compositeConfidenceScore, 0),
    historicalHitRate: input.historicalHitRate === undefined ? undefined : toFiniteNumber(input.historicalHitRate, 0),
    inCoverageLeaderboard: Boolean(input.inCoverageLeaderboard),
    universeRank: input.universeRank === undefined ? undefined : Math.max(0, Math.round(toFiniteNumber(input.universeRank, 0))),
    universeFrequency: input.universeFrequency === undefined ? undefined : Math.max(0, Math.round(toFiniteNumber(input.universeFrequency, 0))),
    universeStatus: input.universeStatus ? String(input.universeStatus) : undefined,
    primaryPatternType: input.primaryPatternType ? String(input.primaryPatternType) : undefined,
    patternArchetypeLabel: input.patternArchetypeLabel ? String(input.patternArchetypeLabel) : undefined,
    patternArchetypeBadgeColor: input.patternArchetypeBadgeColor ? String(input.patternArchetypeBadgeColor) : undefined,
    patternExplanation: input.patternExplanation ? String(input.patternExplanation) : undefined,
    isPrimaryFamilyMember: Boolean(input.isPrimaryFamilyMember),
    familyRoot: input.familyRoot ? String(input.familyRoot) : undefined,
    primaryFamilyRoot: input.primaryFamilyRoot ? String(input.primaryFamilyRoot) : undefined,
    convergenceTier: input.convergenceTier ? String(input.convergenceTier) : undefined,
    evidenceLevel: input.evidenceLevel ? String(input.evidenceLevel) : undefined,
  };
}

export function normalizePatternDashboardSnapshot(
  input: Partial<PatternDashboardSnapshot> & {
    targetDate?: string;
    dashboardMode?: PatternDashboardSnapshot['dashboardMode'];
    candidates?: Array<Partial<PatternDashboardCandidate>>;
  } = {}
): PatternDashboardSnapshot {
  const now = new Date().toISOString();
  const targetDate = toIsoDate(input.targetDate);
  const rawCandidates = Array.isArray(input.candidates) ? input.candidates : [];
  const normalizedCandidates = rawCandidates
    .map((candidate) => normalizeCandidate(candidate))
    .sort((left, right) => {
      const leftScore = left.compositeConfidenceScore ?? left.possibilityScore;
      const rightScore = right.compositeConfidenceScore ?? right.possibilityScore;
      if (rightScore !== leftScore) return rightScore - leftScore;
      if (right.occurrenceCount !== left.occurrenceCount) return right.occurrenceCount - left.occurrenceCount;
      return left.pair.localeCompare(right.pair);
    });

  const totalCandidates = normalizedCandidates.length;
  const averagePossibilityScore = totalCandidates > 0
    ? normalizedCandidates.reduce((sum, candidate) => sum + candidate.possibilityScore, 0) / totalCandidates
    : 0;
  const averageConfidenceScore = totalCandidates > 0
    ? normalizedCandidates.reduce((sum, candidate) => sum + (candidate.compositeConfidenceScore ?? candidate.possibilityScore), 0) / totalCandidates
    : 0;
  const top5 = normalizedCandidates.slice(0, 5).map((candidate) => candidate.pair);
  const primaryCandidate = normalizedCandidates[0]?.pair ?? null;
  const highConvictionCount = normalizedCandidates.filter(
    (candidate) => candidate.distinctEngineCount >= 2 || candidate.occurrenceCount >= 2
  ).length;

  return {
    schemaVersion: PATTERN_DASHBOARD_SCHEMA_VERSION,
    targetDate,
    dashboardMode: input.dashboardMode || 'unified_all',
    generatedAt: input.generatedAt || now,
    updatedAt: now,
    candidates: normalizedCandidates,
    metrics: {
      totalCandidates,
      primaryCandidate,
      top5,
      averagePossibilityScore: Number(averagePossibilityScore.toFixed(2)),
      averageConfidenceScore: Number(averageConfidenceScore.toFixed(2)),
      highConvictionCount,
    },
    metadata: {
      prevDate: input.metadata?.prevDate ?? null,
      totalUniquePairs: totalCandidates,
      totalEngineSignals: normalizedCandidates.reduce((sum, candidate) => sum + candidate.occurrenceCount, 0),
      source: 'computed',
    },
  };
}
