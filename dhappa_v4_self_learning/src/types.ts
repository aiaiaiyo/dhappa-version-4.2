/**
 * Core TypeScript definitions for Date Pair Generator & Risk-Reward Simulator
 */

export type Market = 'Gali' | 'Faridabad' | 'Deshawar' | 'Ghaziabad';

export const MARKETS: Market[] = ['Deshawar', 'Faridabad', 'Gali', 'Ghaziabad'];

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type Currency = CurrencyCode;

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToINR: number; // For educational reference
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', rateToINR: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar (USD)', rateToINR: 87 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', rateToINR: 92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', rateToINR: 110 },
};

export interface GeneratedResult {
  date: string; // ISO format: YYYY-MM-DD
  formattedDate: string; // e.g. "15 August 2026"
  dayOfMonth: number;
  x: number;
  baseTriad: number[];
  transformedTriad: number[];
  excludedDigits: number[];
  activeDigits: number[];
  pairs: string[];
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  market: Market;
  pair: string; // "00" to "99" strictly 2 digits
  notes?: string;
  createdAt: string;
  source?: 'manual' | 'import' | 'scraper' | 'demo' | 'csv';
}

export interface DayMarketEntry {
  id: string;
  date: string; // YYYY-MM-DD
  deshawar?: string;
  faridabad?: string;
  gali?: string;
  ghaziabad?: string;
  gzb?: string; // alias for ghaziabad
  notes?: string;
  createdAt: string;
  source?: 'manual' | 'import' | 'scraper' | 'demo' | 'csv';
}

export type SampleSpaceModel = 'generated_12' | 'universe_100' | 'custom';

export interface RiskScenarioParams {
  stakePerPair: number;
  multiplier: number; // Gross Payout Multiplier (e.g. 90)
  selectedPairs: string[];
  sampleSpaceModel: SampleSpaceModel;
  customN?: number;
  currency: CurrencyCode;
}

export interface RiskCalculations {
  K: number; // Selected pair count
  S: number; // Stake per pair
  M: number; // Gross payout multiplier
  N: number; // Sample space size
  totalStake: number; // K * S
  grossPayout: number; // S * M
  netResultWin: number; // S * M - K * S
  netResultLoss: number; // -K * S
  returnMultiple: number; // M / K (Gross payout multiple relative to total exposure)
  breakEvenProbability: number; // K / M
  theoreticalProbability: number; // K / N
  expectedValue: number; // K * S * ((M / N) - 1)
  evPercentage: number; // (EV / Total Stake) * 100
}

export interface PairCellData {
  pair: string; // "00" to "99"
  totalCount: number;
  byMarket: Record<Market, number>;
  dates: string[];
  firstObservedDate?: string;
  lastObservedDate?: string;
}

export type NavigationTab =
  | 'daily-generator'
  | 'self-learning-v4'
  | 'consensus-roadmap'
  | 'engine-performance-log'
  | 'pattern-dashboard'
  | 'rules-vault'
  | 'precision-intelligence'
  | 'belgium-square-matrix'
  | 'g-square-method'
  | 'g-square-harmonics'
  | 'generator'
  | 'previous-day-repeated'
  | 'sir-abhishek-theory'
  | 'sir-theory-pattern'
  | 'relation-hot-numbers'
  | 'arithmetic-pattern-engine'
  | 'rashi-intelligence'
  | 'doubles-lab'
  | 'date-intelligence'
  | 'beta-testing'
  | 'heatmap'
  | 'monthly-coverage'
  | 'previous-date'
  | 'risk-simulator'
  | 'daily-data'
  | 'scraper-import'
  | 'history'
  | 'mathematics'
  | 'quant-research'
  | 'rational-ml-audit'
  | 'briquette-engine'
  | 'unit-tests';

export interface SirTheoryPatternSummary {
  totalSteps: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  multiHitCount: number;
  multiHitRate: number;
  singleHitCount: number;
  doubleHitCount: number;
  tripleHitCount: number;
  quadHitCount: number;
  totalMatchesWon: number;
  averageMatchesPerHit: number;
}

export interface PrimarySetSlotPattern {
  slotCombination: string; // e.g. "a-x", "x-b", "x-y", etc.
  slotIndices: [number, number];
  slotLabels: [string, string];
  hitCount: number;
  hitPercentage: number;
  category: 'core-triad' | 'core-anchor' | 'secondary-cross';
}

export interface WinningPairHistoricalStat {
  pair: string;
  hitCount: number;
  hitRateAmongHits: number; // % among the 562 hits
  generationCount: number; // how many times this pair was in the 15-pair set
  conversionRate: number; // hitCount / generationCount
  houseBreakdown: {
    deshawar: number;
    faridabad: number;
    gali: number;
    ghaziabad: number;
  };
  directHitCount: number;
  reversedHitCount: number;
  tens: number;
  ones: number;
  digitSum: number;
  digitDiff: number;
}

export type NavModule = NavigationTab;

export type DisplayMode = 'tiles' | 'matrix' | 'compact';

export interface SirAbhishekDigitCount {
  digit: number;
  count: number;
  houses: string[]; // e.g. ["Deshawar (T)", "GZB (T)"]
}

export interface SirAbhishekPairBranch {
  primaryLabel: string; // "a", "x", "b", "y", "z"
  primaryDigit: number;
  targetPairs: {
    partnerLabel: string;
    partnerDigit: number;
    pair: string; // e.g. "34"
    formula: string; // e.g. "AX -> 34"
  }[];
}

export interface FaridabadDeltaResult {
  sourceNumber: string; // e.g. "58" or "54"
  digitA: number; // 5
  digitB: number; // 8 or 4
  delta: number; // |A - B| = 3 or 1
  deltaSeriesAscending: string[]; // e.g. ["03", "14", "25", "36", "47", "58", "69"]
  deltaSeriesDescending: string[]; // e.g. ["30", "41", "52", "63", "74", "85", "96"]
  fullDeltaSeries: string[]; // All ordered unique pairs in 00-99 with exact same Delta
  // Convergence with Sir Abhishek 15-Pair Set
  sirAbhishek15Pairs: string[];
  convergingPairs: {
    pair: string;
    inSirAbhishek15: boolean;
    inFourHousesToday: boolean;
    inFourHousesYesterday: boolean;
    appearedInHouses: string[];
  }[];
  // Comparison with 4 houses
  fourHousesComparison: {
    houseName: string;
    outcomeNumber: string;
    outcomeDelta: number;
    hasSameDelta: boolean;
    matchesAnyDeltaSeriesNumber: boolean;
  }[];
}

export interface SirAbhishekTheoryResult {
  sourceDate: string;
  sourceHouseValues: {
    deshawar: string;
    faridabad: string;
    gali: string;
    gzb: string;
  };
  digitFrequencies: SirAbhishekDigitCount[];
  // Primary core digit
  x: number;
  xCount: number;
  // Modulo 10 cyclic neighbors
  a: number; // (x - 1 + 10) % 10
  b: number; // (x + 1) % 10
  // Secondary associated digits
  y: number;
  z: number;
  e: number;
  secondaryReasoning: {
    y: string;
    z: string;
    e: string;
  };
  // The complete primary set of 6 in vertical order: [a, x, b, y, z, e]
  primarySet: {
    label: 'a' | 'x' | 'b' | 'y' | 'z' | 'e';
    digit: number;
    role: string;
  }[];
  // Pair expansion branches (5 + 4 + 3 + 2 + 1 = 15 pairs)
  branches: SirAbhishekPairBranch[];
  // Complete 15 unique pairs
  pairSet: string[]; // 15 pairs
  // Formatted string array representation, e.g. "[34, 35, 37, 32, 39, 45, 47, 42, 49, 57, 52, 59, 72, 79, 29]"
  bracketNotation: string;
  csvNotation: string;
  // Faridabad Delta Series Integration
  faridabadDelta: FaridabadDeltaResult;
}

export interface SirAbhishekBacktestStep {
  date: string;
  sourceDate: string;
  sourceHouseOutcomes: string[];
  targetHouseOutcomes: string[];
  x: number;
  primarySet: number[];
  sirAbhishekPairs: string[]; // 15 pairs
  matchedPairs: string[];
  hitCount: number;
  hitHouseNames: string[];
  isHit: boolean;
}

export interface UserPreferences {
  defaultCurrency: CurrencyCode;
  displayMode: DisplayMode;
  theme?: 'dark' | 'light';
  riskParameters?: {
    totalPairsToStake: number;
    stakePerPair: number;
    payoutMultiplier: number;
  };
}

export interface RepeatedXResult {
  digit: number;
  frequency: number;
  occurrences: string[]; // dates where this digit appeared on ones-place
  generated: GeneratedResult;
}

export interface RepeatedDigitBranch {
  x: number;
  frequency: number;
  rawTriad: number[]; // X-1, X, X+1 (may include -1 or 10)
  validTriad: number[]; // valid within 0..9
  discardedTriad: number[]; // discarded e.g. -1 or 10
  plus5Transformations: Array<{
    baseVal: number;
    formula: string;
    transformedValues: number[]; // e.g. [4, 5, 6]
    onesPlaceDigits: number[]; // e.g. [4, 5, 6]
  }>;
  rawOnesPlaceDigits: number[];
  uniqueExcludedDigits: number[];
  remainingDigits: number[];
  finalPairs: string[];
}

export interface PreviousDayRepeatedAssessment {
  date: string;
  sourceType: 'auto-recorded' | 'custom-input';
  outcomes: string[]; // e.g. ["12", "49", "38", "71"]
  digitBreakdown: Array<{
    outcome: string;
    tens: number;
    ones: number;
  }>;
  combinedDigitPool: number[];
  frequencyTable: Record<number, number>; // 0 to 9
  hasRepeatedDigit: boolean;
  maxFrequency: number;
  isNoResult: boolean;
  noResultMessage?: string;
  xValues: number[];
  isTie: boolean;
  branches: RepeatedDigitBranch[];
}

export interface RankedHotPair {
  pair: string;
  tier: 'HOT_EXACT' | 'MIRROR_MATCH' | 'CORE_DIGIT_PAIR' | 'METHOD_EXCLUSIVE';
  score: number;
  reasons: string[];
  inDateMethod: boolean;
  inPrevDayMethod: boolean;
  isMirrorOfDateMethod?: boolean;
}

export interface CrossMethodConvergence {
  targetDate: string;
  prevDate: string;
  // Date Generator info
  dateMethod: {
    x: number;
    dayOfMonth: number;
    baseTriad: number[];
    activeDigits: number[];
    excludedDigits: number[];
    pairs: string[];
  };
  // Previous Day Method info
  prevDayMethod: {
    outcomes: string[];
    isNoResult: boolean;
    noResultMessage?: string;
    hasRepeatedDigit: boolean;
    maxFrequency: number;
    xValues: number[];
    activeBranch?: RepeatedDigitBranch;
    allBranches: RepeatedDigitBranch[];
    allPrevPairs: string[];
    allPrevActiveDigits: number[];
    allPrevExcludedDigits: number[];
  };
  // Convergence Relationships
  hotPairs: string[]; // Intersection pairs in BOTH methods
  mirrorPairs: Array<{
    datePair: string;
    prevPair: string;
  }>;
  hotCoreDigits: number[]; // Active in BOTH methods
  dualExcludedDigits: number[]; // Excluded by BOTH methods
  dateOnlyDigits: number[];
  prevOnlyDigits: number[];
  dateOnlyPairs: string[];
  prevOnlyPairs: string[];
  totalUnionPairsCount: number;
  jaccardSimilarity: number;
  rankedHotPairs: RankedHotPair[];
}

export interface UnitTestResult {
  id: string;
  name: string;
  category:
    | 'Date Transformation'
    | 'Permutations'
    | 'Risk Formulas'
    | 'Boundary Wraps'
    | 'Previous Day Repeated Method'
    | 'Sir Abhishek Theory'
    | 'G Square Method'
    | 'Cross-Method Convergence'
    | 'Arithmetic Pattern Analysis'
    | 'Beta Testing & Validation'
    | 'Date Intelligence & OOS Target';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

/**
 * =========================================================================
 * ACTUAL RESULTS + ARITHMETIC PATTERN ANALYSIS ENGINE INTERFACES
 * =========================================================================
 */

export interface HistoricalObservationItem {
  id: string;
  date: string;
  market: Market;
  pair: string; // "00" - "99"
  tens: number; // 0 - 9
  ones: number; // 0 - 9
  digitSum: number; // X + Y
  digitDiff: number; // |X - Y|
  reversePair: string; // YX
  plus1Neighbour: string; // (N + 1) % 100 formatted
  minus1Neighbour: string; // (N - 1 + 100) % 100 formatted
  tensNeighbours: number[]; // [T-1, T, T+1] clamped to 0..9
  onesNeighbours: number[]; // [O-1, O, O+1] clamped to 0..9
  isEvenTens: boolean;
  isEvenOnes: boolean;
  isHighTens: boolean; // 5..9
  isHighOnes: boolean; // 5..9
  gapSinceLastSeen: number; // in observations
}

export interface HistoricalFrequencyAnalysis {
  totalObservations: number;
  uniqueNumbersSeen: number;
  mostFrequentNumbers: Array<{ pair: string; count: number; percentage: number }>;
  leastFrequentNumbers: Array<{ pair: string; count: number; percentage: number }>;
  tensFrequency: Record<number, number>;
  onesFrequency: Record<number, number>;
  digitFrequency: Record<number, number>; // overall single digit frequency across all positions
  digitSumFrequency: Record<number, number>; // sums 0 to 18
  digitDiffFrequency: Record<number, number>; // diffs 0 to 9
  reversalPatterns: Array<{
    pair: string;
    reversePair: string;
    pairCount: number;
    reverseCount: number;
    combinedCount: number;
  }>;
  parityDistribution: {
    evenEven: number; // e.g. 24
    evenOdd: number; // e.g. 25
    oddEven: number; // e.g. 34
    oddOdd: number; // e.g. 35
  };
  magnitudeDistribution: {
    lowLow: number; // tens 0-4, ones 0-4
    lowHigh: number; // tens 0-4, ones 5-9
    highLow: number; // tens 5-9, ones 0-4
    highHigh: number; // tens 5-9, ones 5-9
  };
}

export interface RecencyWindowSummary {
  windowLabel: string; // e.g. "Last 5 Observations", "Last 10", "Last 20", "Full Dataset"
  sampleCount: number;
  topPairs: Array<{ pair: string; count: number }>;
  topTens: Array<{ digit: number; count: number }>;
  topOnes: Array<{ digit: number; count: number }>;
  topSums: Array<{ sum: number; count: number }>;
  topDiffs: Array<{ diff: number; count: number }>;
}

export interface TransitionRule {
  fromPair: string;
  toPair: string;
  tensShift: number; // signed delta (-9 to +9)
  onesShift: number; // signed delta (-9 to +9)
  isReverse: boolean;
  isPlus1: boolean;
  isMinus1: boolean;
  isPlus5Tens: boolean;
  isPlus5Ones: boolean;
  isSameTens: boolean;
  isSameOnes: boolean;
  isSameDigitSum: boolean;
  isSameDigitDiff: boolean;
  frequency: number;
}

export type CandidateSignalFamily =
  | 'HISTORICAL_FREQUENCY'
  | 'RECENCY_WINDOW'
  | 'REPEATED_DIGIT_METHOD'
  | 'TRANSITION_PATTERN'
  | 'ARITHMETIC_RELATION'
  | 'REVERSE_SYMMETRY'
  | 'NEIGHBOUR_PROXIMITY'
  | 'DATE_GENERATOR';

export interface CandidateSignal {
  family: CandidateSignalFamily;
  name: string;
  points: number;
  description: string;
  confidence: 'HIGH' | 'MEDIUM' | 'EXPLORATORY';
}

export interface RankedArithmeticCandidate {
  rank: number;
  pair: string; // "00" - "99"
  tens: number;
  ones: number;
  digitSum: number; // X + Y
  digitDiff: number; // |X - Y|
  reversePair: string; // YX
  rawScore: number;
  normalizedScore: number; // 0 to 100
  tier: 'TIER_1_STRONG' | 'TIER_2_MODERATE' | 'TIER_3_EXPLORATORY';
  supportingSignals: CandidateSignal[];
  signalFamilies: CandidateSignalFamily[];
  independentFamilyCount: number;
  inDateMethod: boolean;
  inPrevDayMethod: boolean;
  explanation: {
    arithmeticSummary: string;
    topSignalReasons: string[];
    riskContext: string;
  };
}

export interface BacktestRecordStep {
  date: string;
  targetDrawPairs: string[]; // actual outcome pairs on that date
  historicalSampleSize: number;
  top1Candidate: string;
  top5Candidates: string[];
  top10Candidates: string[];
  top20Candidates: string[];
  hitTop1: boolean;
  hitTop5: boolean;
  hitTop10: boolean;
  hitTop20: boolean;
  matchedPairs: string[];
  methodContribution: Record<CandidateSignalFamily, boolean>;
}

export interface WalkForwardBacktestReport {
  totalTestedDays: number;
  totalTestedOutcomes: number;
  top1HitCount: number;
  top5HitCount: number;
  top10HitCount: number;
  top20HitCount: number;
  top1HitRate: number; // %
  top5HitRate: number; // %
  top10HitRate: number; // %
  top20HitRate: number; // %
  overallCoverage: number; // %
  falsePositiveRate: number; // %
  benchmarkRandomCoverageTop10: number; // 10%
  methodEffectiveness: Array<{
    family: CandidateSignalFamily;
    name: string;
    activationCount: number;
    hitCount: number;
    hitRate: number;
  }>;
  windowComparison: Array<{
    windowName: string;
    sampleSize: number;
    hitRateTop10: number;
  }>;
  historySteps: BacktestRecordStep[];
}

export interface FullArithmeticPatternAnalysis {
  targetDate: string;
  referencePrevDate: string;
  totalHistoricalEntries: number;
  observations: HistoricalObservationItem[];
  frequencyAnalysis: HistoricalFrequencyAnalysis;
  recencyWindows: {
    last5: RecencyWindowSummary;
    last10: RecencyWindowSummary;
    last20: RecencyWindowSummary;
    full: RecencyWindowSummary;
  };
  transitionRules: TransitionRule[];
  topTransitions: TransitionRule[];
  prevDayMethodSummary: {
    xValues: number[];
    activeDigits: number[];
    excludedDigits: number[];
    generatedPairs: string[];
    isNoResult: boolean;
  };
  candidatePool: RankedArithmeticCandidate[];
  tier1Candidates: RankedArithmeticCandidate[]; // Strongest Mathematical Support
  tier2Candidates: RankedArithmeticCandidate[]; // Moderate Support
  tier3Candidates: RankedArithmeticCandidate[]; // Exploratory Candidates
  backtestReport: WalkForwardBacktestReport;
}

/**
 * BETA TESTING FRAMEWORK: 7-Layer Empirical Validation, Signal Independence,
 * Markov Digit Transitions, Score Calibration, and Walk-Forward Lift Engine
 */

export type SignalFeatureId =
  | 'DATE_MODEL'
  | 'PREV_DAY_REPEAT'
  | 'HISTORICAL_FREQ'
  | 'RECENCY_MULTI_HORIZON'
  | 'MARKOV_DIGIT_TRANSITION'
  | 'REVERSAL_RELATION'
  | 'ARITHMETIC_SUM_DIFF'
  | 'HISTORICAL_GAP';

export interface SignalEvaluationMetric {
  signalId: SignalFeatureId;
  name: string;
  family: string;
  historicalSampleSize: number;
  inSampleHitRate: number; // %
  outOfSampleHitRate: number; // %
  randomBaseline: number; // % (e.g. 10%)
  lift: number; // e.g. 1.32x
  excessLiftPct: number; // +32%
  confidenceInterval: [number, number]; // [low %, high %] via Wilson score
  pValEstimate: number; // estimated p-value vs binomial null
  isEligible: boolean; // meets minimum observations + out-of-sample lift > 1.0
  collinearityGroup: string;
  dependencyPenalty: number; // 0.0 to 0.70 reduction for redundant collinear features
  calibratedWeight: number; // dynamically weighted by out-of-sample lift
  stabilityScore: number; // 0-100 stability across temporal partitions
  description: string;
}

export interface MarkovDigitTransitions {
  tensTransitionMatrix: number[][]; // 10x10 P(A_{t+1}|A_t)
  onesTransitionMatrix: number[][]; // 10x10 P(B_{t+1}|B_t)
  crossDigitTransitionMatrix: number[][]; // 10x10 P(A_{t+1}|B_t)
  topTensTransitions: Array<{ from: number; to: number; prob: number; count: number }>;
  topOnesTransitions: Array<{ from: number; to: number; prob: number; count: number }>;
}

export interface DigitStageProbability {
  digit: number; // 0..9
  tensProb: number; // %
  onesProb: number; // %
  combinedDigitProb: number; // %
  rank: number;
}

export interface BetaRankedCandidate {
  rank: number;
  pair: string; // "00" to "99"
  tens: number;
  ones: number;
  baseScore: number;
  recencyMultiHorizonScore: number; // Short 3/5/7/10, Med 15/20/30, Long 50/100
  markovTransitionScore: number;
  gapScore: number; // 0 if gap signal has no historical lift
  convergenceScore: number; // (independent supporting signals) / (eligible signals)
  dependencyPenalty: number;
  stabilityScore: number;
  finalCalibratedScore: number; // 0-100
  calibratedProbability: number; // Empirical hit probability % based on historical score bins
  empiricalLift: number; // e.g. 1.32x vs random expectation
  tier: 'TIER_1_ALPHA' | 'TIER_2_BETA' | 'TIER_3_EXPLORATORY';
  supportingSignals: Array<{ name: string; lift: number; weight: number }>;
}

export interface TemporalStabilityPartition {
  periodIndex: number; // 1..5
  periodLabel: string;
  sampleCount: number;
  top10HitRate: number;
  baselineHitRate: number;
  lift: number;
  isConsistent: boolean;
}

export interface ScoreCalibrationBin {
  binLabel: string; // "90-100", "80-89", etc.
  minScore: number;
  maxScore: number;
  totalSamplesInBin: number;
  actualHistoricalHits: number;
  empiricalHitRate: number; // %
  isMonotonic: boolean;
}

export interface BetaBacktestStep {
  date: string;
  trainingCount: number;
  targetDrawPairs: string[];
  top1: string;
  top5: string[];
  top10: string[];
  top20: string[];
  hitTop1: boolean;
  hitTop5: boolean;
  hitTop10: boolean;
  hitTop20: boolean;
  matchedPairs: string[];
  calibratedEvEstimate: number;
}

export interface BetaTestingMasterAssessment {
  targetDate: string;
  referencePrevDate: string;
  totalObservations: number;
  signals: SignalEvaluationMetric[];
  eligibleSignalsCount: number;
  prunedSignalsCount: number;
  markovTransitions: MarkovDigitTransitions;
  stage1DigitProbabilities: DigitStageProbability[];
  stage2RankedCandidates: BetaRankedCandidate[];
  temporalPartitions: TemporalStabilityPartition[];
  stabilityVariance: number;
  scoreCalibrationBins: ScoreCalibrationBin[];
  walkForwardSteps: BetaBacktestStep[];
  overallTop10HitRate: number;
  randomBaselineTop10: number; // 10%
  aggregateLift: number;
  wilsonConfidenceInterval: [number, number];
  pValVersusRandom: number;
  modelQualityVerdict: 'POSITIVE_EMPIRICAL_LIFT' | 'NEUTRAL_NO_EDGE' | 'OVERFIT_PRUNED';
}

/**
 * =========================================================================
 * DATE PAIR INTELLIGENCE LAB INTERFACES (+75% OOS IMPROVEMENT ENGINE)
 * =========================================================================
 */

export interface DatasetQualityAssessment {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  missingDatesCount: number;
  dateRange: { start: string; end: string };
  markets: Market[];
  marketCoverage: Record<Market, number>;
  monthlyObservations: Record<string, number>;
  continuousSeriesPct: number;
  gapsInSeries: Array<{ start: string; end: string; missingDays: number }>;
  dataQualityScore: number; // 0 - 100
  qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface PairDistributionMetric {
  pair: string; // "00" - "99"
  count: number;
  frequencyPct: number;
  lastOccurrenceDate?: string;
  currentGap: number;
  meanGap: number;
  medianGap: number;
  maxGap: number;
  minGap: number;
  stdDevGap: number;
  rank: number;
}

export interface DigitPositionalDistribution {
  digit: number; // 0 - 9
  tensCount: number;
  tensPct: number;
  onesCount: number;
  onesPct: number;
  totalCount: number;
  totalPct: number;
  recentTensPct: number;
  recentOnesPct: number;
  currentGapTens: number;
  currentGapOnes: number;
  avgGapTens: number;
  avgGapOnes: number;
}

export interface DigitBalanceTestResult {
  digit: number;
  expectedFreqPct: number; // 10.0%
  observedFreqPct: number;
  deviation: number;
  standardizedZScore: number;
  chiSquareComponent: number;
  isStatisticallySignificant: boolean;
  diagnosticLabel: 'BALANCED' | 'ELEVATED' | 'DEFICIT';
}

export interface PairStructureAnalysis {
  repeatedPairsCount: number; // 00, 11, 22 ... 99
  doublesObserved: Array<{ pair: string; count: number; freqPct: number }>;
  reversalsFound: Array<{ pair1: string; count1: number; pair2: string; count2: number; ratio: number }>;
  sharedDigitSummary: {
    sameTensCount: number;
    sameOnesCount: number;
    mirrorCount: number;
  };
  neighborPairSuccessRate: number; // AB and A(B±1) occurrence %
  digitDistanceHistogram: Record<number, number>; // distance 0..9 -> count
}

export interface HistoricalRegimePeriod {
  periodName: string;
  startDate: string;
  endDate: string;
  sampleCount: number;
  topPair: string;
  topDigitTens: number;
  topDigitOnes: number;
  entropyScore: number;
  stabilityStatus: 'STABLE' | 'DRIFTING' | 'VOLATILE';
}

export interface HistoricalRegimeMap {
  periods: HistoricalRegimePeriod[];
  overallRegime: 'STABLE_HOMOGENEOUS' | 'MODERATE_DRIFT' | 'REGIME_SHIFTING';
  regimeStabilityScore: number; // 0 - 100
}

export interface DateGeneratorAblationItem {
  componentName: string;
  excludedFeature: string;
  hitRateTop10: number;
  deltaVsFull: number;
  incrementalLift: number;
  status: 'BENEFICIAL' | 'NEUTRAL' | 'HARMFUL';
}

export interface ConditionalDayModuloPerformance {
  dayMod10: number;
  sampleCount: number;
  hitRateTop10: number;
  lift: number;
  topFormedPairs: string[];
}

export interface DateGeneratorAuditResult {
  totalDatesTested: number;
  top1HitRate: number;
  top5HitRate: number;
  top10HitRate: number;
  top20HitRate: number;
  baselineTop10: number; // 10.0%
  aggregateLift: number;
  wilsonCI: [number, number];
  ablationTable: DateGeneratorAblationItem[];
  conditionalDayModulo: ConditionalDayModuloPerformance[];
  componentRanking: Array<{ name: string; hitRate: number; lift: number; weight: number }>;
}

export interface PreviousDayAblationItem {
  componentName: string;
  hitRateTop10: number;
  deltaVsFull: number;
  incrementalLift: number;
  status: 'BENEFICIAL' | 'NEUTRAL' | 'HARMFUL';
}

export interface PreviousDayAuditResult {
  totalDatesTested: number;
  dominantDigitHitRateTop10: number;
  baseline: number; // 10.0%
  dominantDigitLift: number;
  repeatedDigitPresentCount: number;
  repeatedDigitAbsentCount: number;
  repeatedDigitHitRate: number;
  nonRepeatedHitRate: number;
  repeatedDigitLiftVsNonRepeated: number;
  isRepeatedDigitPredictive: boolean;
  ablationTable: PreviousDayAblationItem[];
}

export interface InteractionMatrixCell {
  dateDigit: number;
  prevDominantDigit: number;
  sampleSize: number;
  hitRate: number;
  baseline: number;
  lift: number;
  ci: [number, number];
}

export interface DatePrevCrossAnalysisResult {
  dateOnlyHitRate: number;
  prevOnlyHitRate: number;
  bothHitRate: number;
  neitherHitRate: number;
  exactIntersectionHitRate: number;
  candidateUnionHitRate: number;
  dateVsPrevComparison: {
    dateWinsCount: number;
    prevWinsCount: number;
    tiesCount: number;
    dominantMethod: 'DATE_GENERATOR' | 'PREVIOUS_DAY' | 'BALANCED';
  };
  interactionMatrix: InteractionMatrixCell[];
}

export interface MethodReliabilityItem {
  id: string;
  name: string;
  recentHitRate: number;
  longTermHitRate: number;
  recentLift: number;
  longTermLift: number;
  stabilityScore: number;
  decayDetected: boolean;
  statusLabel: 'STRENGTHENING' | 'STABLE' | 'DECAYING';
  dynamicWeight: number;
}

export interface MethodReliabilityTracker {
  methods: MethodReliabilityItem[];
  currentDominantMethod: string;
  adaptiveWeightingSummary: string;
}

export interface OOSImprovementEngine {
  baselineTop1: number;
  baselineTop3: number;
  baselineTop5: number;
  baselineTop10: number;
  baselineTop20: number;
  modelTop1: number;
  modelTop3: number;
  modelTop5: number;
  modelTop10: number;
  modelTop20: number;
  relativeImprovementTop1: number;
  relativeImprovementTop3: number;
  relativeImprovementTop5: number;
  relativeImprovementTop10: number;
  relativeImprovementTop20: number;
  targetPct: number; // 75.0%
  remainingGapTop10: number;
  targetAchievedTop10: boolean;
  highestImprovementHorizon: string; // e.g. "Top-10 (+78.2%)"
}

export interface ErrorPatternItem {
  date: string;
  predictedTop3: string[];
  actualOutcome: string;
  errorClass: string;
  modelConfidence: number;
  contributingFeature: string;
}

export interface ErrorLearningSummary {
  totalErrorsAnalyzed: number;
  wrongTensPct: number;
  wrongOnesPct: number;
  bothWrongPct: number;
  reversalMissPct: number;
  nearMissPct: number;
  highConfidenceMissesCount: number;
  prunedOverconfidentFeatures: string[];
  recentErrorPatterns: ErrorPatternItem[];
}

export interface ChampionChallengerModel {
  modelId: string;
  modelName: string;
  modelType: 'champion' | 'challenger' | 'baseline' | 'experimental';
  top10HitRate: number;
  relativeLiftPct: number;
  wilsonCI: [number, number];
  stabilityVariance: number;
  sampleCount: number;
  status: 'LEADER' | 'ACTIVE_COMPETITOR' | 'UNDERPERFORMING';
}

export interface TrainingDataTableRow {
  date: string;
  previousOutcome: string;
  dateDigit: number;
  prevDominantDigit: number;
  dateCandidatesCount: number;
  prevCandidatesCount: number;
  intersectionCount: number;
  unionCount: number;
  modelConfidenceScore: number;
  actualOutcome: string;
  actualTens: number;
  actualOnes: number;
  hitTop1: boolean;
  hitTop5: boolean;
  hitTop10: boolean;
  hitTop20: boolean;
  successType: 'BOTH_SUCCESS' | 'DATE_ONLY' | 'PREV_ONLY' | 'INTERSECTION_HIT' | 'UNION_HIT' | 'NEITHER';
}

export interface HistoricalReplayStep {
  date: string;
  previousDayOutcomes: string[];
  availableHistoricalCount: number;
  dateGenCandidates: string[];
  prevDayCandidates: string[];
  intersectionPairs: string[];
  unionPairs: string[];
  modelRankedTop10: string[];
  actualDayOutcomes: string[];
  hitsFound: string[];
  replayNarrative: string;
}

export interface DateIntelligenceMasterAssessment {
  targetDate: string;
  referencePrevDate: string;
  qualityAssessment: DatasetQualityAssessment;
  pairDistribution: PairDistributionMetric[];
  digitDistribution: DigitPositionalDistribution[];
  digitBalanceTests: DigitBalanceTestResult[];
  pairStructure: PairStructureAnalysis;
  regimeMap: HistoricalRegimeMap;
  dateGeneratorAudit: DateGeneratorAuditResult;
  previousDayAudit: PreviousDayAuditResult;
  crossAnalysis: DatePrevCrossAnalysisResult;
  methodReliability: MethodReliabilityTracker;
  oosTarget: OOSImprovementEngine;
  errorLearning: ErrorLearningSummary;
  championArena: ChampionChallengerModel[];
  trainingTable: TrainingDataTableRow[];
  replayHistory: HistoricalReplayStep[];
  finalCandidates: BetaRankedCandidate[];
}

// ============================================================================
// G SQUARE METHOD — MACHINE-TRAINABLE NUMBER PREDICTION ENGINE TYPES
// ============================================================================

export type GSquareSourceMode = 'gali' | 'ghaziabad' | 'combined' | 'auto';

export type GSquareVerticalKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type GSquareHorizontalKey = 'G' | 'H' | 'I' | 'J';
export type GSquareMatrixCell = `${GSquareVerticalKey}${GSquareHorizontalKey}`;

export interface GSquareDigitItem {
  key: GSquareVerticalKey | GSquareHorizontalKey;
  value: number;
  formula: string;
  explanation: string;
  isBase?: boolean;
}

export interface GSquareMatrixEntry {
  cellKey: GSquareMatrixCell;
  verticalKey: GSquareVerticalKey;
  horizontalKey: GSquareHorizontalKey;
  verticalVal: number;
  horizontalVal: number;
  pair: string; // e.g. "21"
  reversePair: string; // e.g. "12"
  rowIndex: number; // 0 to 5
  colIndex: number; // 0 to 3
}

export interface GSquareCandidatePrediction {
  rank: number;
  pair: string;
  reversePair: string;
  cellKey: GSquareMatrixCell;
  verticalKey: GSquareVerticalKey;
  horizontalKey: GSquareHorizontalKey;
  verticalVal: number;
  horizontalVal: number;
  mlProbability: number; // 0 to 100%
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'MODERATE';
  historicalHitRate: number; // %
  totalHistoricalHits: number;
  recentHits7: number;
  recentHits15: number;
  recentHits30: number;
  daysSinceLastHit: number;
  targetMarketHits: number;
  crossMarketHits: number;
  reverseHits: number;
  reverseDaysSinceLastHit: number;
  positionHistoricalHits: number;
  positionHitRatePct: number;
  rashiHarmonicScore: number;
  compositeScore: number;
  isTop5: boolean;
  isTop10: boolean;
  isTop15: boolean;
  isTop21: boolean;
  actualHitMatch?: 'EXACT' | 'PALTI' | 'MISS';
  whySelectedReasons: string[];
}

export type GSquareMLModelType =
  | 'calibrated_ensemble'
  | 'logistic_regression'
  | 'gradient_boosting'
  | 'random_forest'
  | 'adaptive_weights';

export interface GSquareModelComparisonMetric {
  modelType: GSquareMLModelType;
  modelName: string;
  top1HitRate: number;
  top5HitRate: number;
  top10HitRate: number;
  top15HitRate: number;
  top21HitRate: number;
  top24HitRate: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  avgHitRank: number;
  isBest: boolean;
}

export interface GSquareWalkForwardStep {
  stepIndex: number;
  targetDate: string;
  sourceDate: string;
  sourceMarket: string;
  sourceNumber: string;
  onesX: number;
  top5Pairs: string[];
  top10Pairs: string[];
  top21Pairs: string[];
  all24Pairs: string[];
  actualOutcomes: { market: Market; pair: string }[];
  hitTop1: boolean;
  hitTop5: boolean;
  hitTop10: boolean;
  hitTop21: boolean;
  hitAll24: boolean;
  winningPair?: string;
  winningMarket?: Market;
  winningRank?: number;
  winningMatchClass?: 'EXACT' | 'PALTI' | 'MISS';
}

export interface GSquareWalkForwardReport {
  totalTestedDraws: number;
  top1HitRate: number;
  top5HitRate: number;
  top10HitRate: number;
  top15HitRate: number;
  top21HitRate: number;
  total24HitRate: number;
  paltiHitRate: number;
  averageHitRank: number;
  steps: GSquareWalkForwardStep[];
  modelComparisons: GSquareModelComparisonMetric[];
  cellEfficacyMatrix: Record<string, { cellKey: string; hits: number; totalRuns: number; hitRate: number }>;
}

export interface GSquareMethodResult {
  sourceDate: string;
  targetDate: string;
  sourceMarket: string;
  sourceNumber: string;
  onesX: number;
  verticalSet: GSquareDigitItem[];
  horizontalSet: GSquareDigitItem[];
  matrix24: GSquareMatrixEntry[];
  predictions: GSquareCandidatePrediction[];
  top5: GSquareCandidatePrediction[];
  top10: GSquareCandidatePrediction[];
  top15: GSquareCandidatePrediction[];
  top21: GSquareCandidatePrediction[];
  activeModel: GSquareMLModelType;
  walkForwardReport: GSquareWalkForwardReport;
  availableSources: { market: string; number: string; date: string }[];
}

/**
 * =========================================================================
 * BELGIUM SQUARE MATRIX METHOD TYPES & CONTRACTS
 * Historical Pattern Detection + Matrix Generation + ML Ranking + Backtesting
 * =========================================================================
 */

export interface BelgiumSquareDigitProvenance {
  digit: number;
  sourceType: 'common' | 'unique';
  sourceMarket: string;
  sourceNumber: string;
  digitRole: string; // e.g. "Base Common Digit", "DS Unique Digit (Tens: 5, Ones: 6)"
}

export interface BelgiumSquareMatrixCell {
  rowDigit: number;
  colDigit: number;
  rowIndex: number;
  colIndex: number;
  cellCoordinate: string; // e.g. "[R0,C1]"
  candidatePair: string; // e.g. "56"
  isDiagonal: boolean; // Same-digit pairing (e.g. 55 -> true)
  isUsable: boolean; // !isDiagonal
  status: 'valid' | 'excluded_diagonal';
  reverseCandidate: string; // e.g. "65"
  rowProvenance: BelgiumSquareDigitProvenance;
  colProvenance: BelgiumSquareDigitProvenance;
  mlScore?: number;
  mlRank?: number;
  historicalHitRate?: number;
  isWinningHit?: boolean;
  hitMarket?: Market | string;
}

export interface BelgiumSquareCandidatePrediction {
  rank: number;
  pair: string; // 2-digit zero-padded string
  reversePair: string;
  mlScore: number;
  historicalHitRate: number;
  recentHitRate: number;
  reversePerformance: number;
  commonDigit: number;
  sourceMarkets: string[];
  matrixPosition: {
    rowIndex: number;
    colIndex: number;
    rowDigit: number;
    colDigit: number;
    coordinate: string;
  };
  evScore: number;
  confidenceTier: 'High' | 'Medium' | 'Speculative';
  featureBreakdown: {
    recency7d: number;
    recency15d: number;
    recency30d: number;
    commonDigitAuthority: number;
    marketHitRate: number;
    reverseParity: number;
    positionEfficacy: number;
  };
  whySelectedReasons: string[];
  actualHitMatch?: 'EXACT' | 'PALTI' | 'MISS';
}

export interface BelgiumSquareCommonDigitGroup {
  commonDigit: number;
  participatingDraws: {
    market: Market | string;
    number: string;
    tens: number;
    ones: number;
  }[];
  participatingMarkets: string[];
  uniqueDigits: number[];
  workingDigitSet: number[]; // e.g. [5, 6, 8]
  horizontalSet: BelgiumSquareDigitProvenance[];
  verticalSet: BelgiumSquareDigitProvenance[];
  matrix: BelgiumSquareMatrixCell[][];
  matrixSize: number; // e.g. 3 for 3x3
  totalPositions: number; // e.g. 9
  validPositions: number; // e.g. 6
  excludedPositions: number; // e.g. 3
  candidatePairs: string[]; // e.g. ["56", "58", "65", "68", "85", "86"]
}

export type BelgiumSquareMLModelType =
  | 'calibrated_ensemble'
  | 'gradient_boosting'
  | 'logistic_regression'
  | 'random_forest'
  | 'adaptive_recency';

export type BelgiumSquareSourceMode =
  | 'all_markets'
  | 'gali_ghaziabad'
  | 'deshawar_faridabad'
  | 'custom';

export interface BelgiumSquareModelComparisonMetric {
  modelType: BelgiumSquareMLModelType;
  modelName: string;
  top1HitRate: number;
  top3HitRate: number;
  top5HitRate: number;
  top10HitRate: number;
  allCandidatesHitRate: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  avgHitRank: number;
  isBest: boolean;
}

export interface BelgiumSquareWalkForwardStep {
  stepIndex: number;
  targetDate: string;
  sourceDate: string;
  commonDigit: number;
  participatingMarkets: string[];
  workingDigits: number[];
  candidateCount: number;
  top1Pair: string;
  top3Pairs: string[];
  top5Pairs: string[];
  top10Pairs: string[];
  allCandidatePairs: string[];
  actualDraws: { market: Market | string; number: string }[];
  isHit: boolean;
  hitType?: 'EXACT' | 'REVERSE' | 'MISS';
  winningMarket?: string;
  winningNumber?: string;
  winningRank?: number;
  hitInTop1: boolean;
  hitInTop3: boolean;
  hitInTop5: boolean;
  hitInTop10: boolean;
  hitInAll: boolean;
}

export interface BelgiumSquarePatternDiscovery {
  bestMarketCombinations: {
    markets: string;
    opportunities: number;
    hits: number;
    hitRate: number;
    statisticalAlpha: number;
  }[];
  bestCommonDigits: {
    digit: number;
    opportunities: number;
    hits: number;
    hitRate: number;
    liftRatio: number;
  }[];
  bestMatrixPositions: {
    positionKey: string;
    rowRole: string;
    colRole: string;
    opportunities: number;
    hits: number;
    hitRate: number;
  }[];
  directionalBias: {
    directHits: number;
    reverseHits: number;
    directWinRate: number;
    reverseWinRate: number;
    asymmetryScore: number;
    preferredDirection: 'Direct (VH)' | 'Reverse (HV)' | 'Symmetric (Equal)';
  };
  optimalLookbackWindow: {
    windowDays: number;
    oosAccuracy: number;
    f1Score: number;
  };
}

export interface BelgiumSquareWalkForwardReport {
  totalOpportunities: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  missRate: number;
  top1Hits: number;
  top1HitRate: number;
  top3Hits: number;
  top3HitRate: number;
  top5Hits: number;
  top5HitRate: number;
  top10Hits: number;
  top10HitRate: number;
  allCandidatesHitRate: number;
  avgCandidateCount: number;
  avgHitRank: number;
  longestHitStreak: number;
  longestMissStreak: number;
  marketBreakdown: Record<string, { opportunities: number; hits: number; hitRate: number }>;
  commonDigitBreakdown: Record<number, { opportunities: number; hits: number; hitRate: number }>;
  positionBreakdown: Record<string, { opportunities: number; hits: number; hitRate: number }>;
  steps: BelgiumSquareWalkForwardStep[];
  modelComparisons: BelgiumSquareModelComparisonMetric[];
  patternDiscovery: BelgiumSquarePatternDiscovery;
}

export interface BelgiumSquareMethodResult {
  targetDate: string;
  sourceDate: string;
  sourceDraws: {
    market: Market | string;
    number: string;
    tens: number;
    ones: number;
  }[];
  commonDigitGroups: BelgiumSquareCommonDigitGroup[];
  selectedCommonDigitGroup: BelgiumSquareCommonDigitGroup | null;
  selectedCommonDigit: number | null;
  allCandidates: string[];
  rankedCandidates: BelgiumSquareCandidatePrediction[];
  top1Prediction: BelgiumSquareCandidatePrediction | null;
  top3Predictions: BelgiumSquareCandidatePrediction[];
  top5Predictions: BelgiumSquareCandidatePrediction[];
  top10Predictions: BelgiumSquareCandidatePrediction[];
  activeModel: BelgiumSquareMLModelType;
  sourceMode: BelgiumSquareSourceMode;
  walkForwardReport: BelgiumSquareWalkForwardReport;
  actualOutcomesForTargetDate: { market: Market | string; number: string }[];
  evaluatedHits?: {
    exactHits: string[];
    reverseHits: string[];
    hitRanks: number[];
    hasHit: boolean;
    hitMarkets: string[];
  };
}




