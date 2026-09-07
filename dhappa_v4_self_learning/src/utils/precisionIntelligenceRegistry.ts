export type PrecisionEngineId =
  | 'BELGIUM_SQUARE'
  | 'G_SQUARE'
  | 'G_SQUARE_HARMONIC'
  | 'MATRIX'
  | 'HARMONIC_GRID'
  | 'HISTORICAL'
  | 'REPEATED'
  | 'SIR'
  | 'PAIR_TRANSFORM'
  | 'ML_PATTERN'
  | 'WALK_FORWARD'
  | 'CONSENSUS'
  | 'RANKING';

export interface EngineResultInput {
  engineId?: PrecisionEngineId | string;
  methodName?: string;
  version?: string;
  date?: string;
  channel?: string;
  sourceValues?: Record<string, unknown>;
  normalizedValues?: Record<string, unknown>;
  steps?: string[];
  intermediateValues?: Record<string, unknown>;
  transformations?: Record<string, unknown>;
  formulaVersion?: string;
  digits?: number[];
  pairs?: string[];
  reversePairs?: string[];
  sequences?: string[];
  matrixRelations?: string[];
  historicalRelations?: string[];
  candidates?: string[];
  rawScore?: number;
  score?: number;
  normalizedScore?: number;
  confidence?: number;
  historicalSupport?: number;
  backtestScore?: number;
  stability?: number;
  riskScore?: number;
  risk?: number;
  evidence?: string[];
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface PrecisionEngineMeta {
  engineId: PrecisionEngineId;
  label: string;
  category: 'mathematical' | 'historical' | 'ml' | 'consensus' | 'ranking';
  description: string;
  version: string;
}

export interface EngineResult {
  engineId: PrecisionEngineId | string;
  methodName: string;
  version: string;
  input: {
    date?: string;
    channel?: string;
    sourceValues?: Record<string, unknown>;
    normalizedValues?: Record<string, unknown>;
  };
  calculation: {
    steps: string[];
    intermediateValues: Record<string, unknown>;
    transformations: Record<string, unknown>;
    formulaVersion?: string;
  };
  patterns: {
    digits: number[];
    pairs: string[];
    reversePairs: string[];
    sequences: string[];
    matrixRelations: string[];
    historicalRelations: string[];
  };
  candidates: string[];
  score: number;
  normalizedScore: number;
  confidence: number;
  historicalSupport: number;
  backtestScore: number;
  stability: number;
  risk: number;
  evidence: string[];
  metadata: Record<string, unknown>;
  timestamp: string;
}

export function normalizeEngineResult(input: EngineResultInput = {}): EngineResult {
  const engineId = (input.engineId || 'UNKNOWN') as PrecisionEngineId | string;
  const version = input.version || '1.0.0';
  const timestamp = input.timestamp || new Date().toISOString();

  return {
    engineId,
    methodName: input.methodName || 'Precision Engine',
    version,
    input: {
      date: input.date,
      channel: input.channel,
      sourceValues: input.sourceValues || {},
      normalizedValues: input.normalizedValues || {},
    },
    calculation: {
      steps: Array.isArray(input.steps) ? input.steps : ['validate()', 'calculate()', 'extractPatterns()', 'score()'],
      intermediateValues: input.intermediateValues || {},
      transformations: input.transformations || {},
      formulaVersion: input.formulaVersion || version,
    },
    patterns: {
      digits: Array.isArray(input.digits) ? input.digits : [],
      pairs: Array.isArray(input.pairs) ? input.pairs : [],
      reversePairs: Array.isArray(input.reversePairs) ? input.reversePairs : [],
      sequences: Array.isArray(input.sequences) ? input.sequences : [],
      matrixRelations: Array.isArray(input.matrixRelations) ? input.matrixRelations : [],
      historicalRelations: Array.isArray(input.historicalRelations) ? input.historicalRelations : [],
    },
    candidates: Array.isArray(input.candidates) ? input.candidates : [],
    score: Number.isFinite(Number(input.score ?? input.rawScore ?? 0)) ? Number(input.score ?? input.rawScore ?? 0) : 0,
    normalizedScore: Number.isFinite(Number(input.normalizedScore ?? input.score ?? input.rawScore ?? 0))
      ? Number(input.normalizedScore ?? input.score ?? input.rawScore ?? 0)
      : 0,
    confidence: Number.isFinite(Number(input.confidence ?? 0)) ? Number(input.confidence ?? 0) : 0,
    historicalSupport: Number.isFinite(Number(input.historicalSupport ?? 0)) ? Number(input.historicalSupport ?? 0) : 0,
    backtestScore: Number.isFinite(Number(input.backtestScore ?? 0)) ? Number(input.backtestScore ?? 0) : 0,
    stability: Number.isFinite(Number(input.stability ?? 0)) ? Number(input.stability ?? 0) : 0,
    risk: Number.isFinite(Number(input.risk ?? input.riskScore ?? 0)) ? Number(input.risk ?? input.riskScore ?? 0) : 0,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    metadata: input.metadata || {},
    timestamp,
  };
}

export function toReversePair(pair: string): string {
  if (!pair || !/^\d{2}$/.test(pair)) return pair;
  return `${pair[1]}${pair[0]}`;
}

export function extractStandardizedCandidates(rawResult: Record<string, unknown> | undefined): string[] {
  if (!rawResult || typeof rawResult !== 'object') return [];

  const directCollections = [
    rawResult.candidates,
    rawResult.allCandidates,
    rawResult.top5Pairs,
    rawResult.top10Pairs,
    rawResult.top21Pairs,
    rawResult.all24Pairs,
    rawResult.predictions,
    rawResult.top5,
    rawResult.top10,
    rawResult.top15,
    rawResult.top21,
    rawResult.top21Predictions,
    rawResult.rankedCandidates,
  ];

  for (const collection of directCollections) {
    if (Array.isArray(collection)) {
      const strings = collection.filter((item): item is string => typeof item === 'string' && /^\d{2}$/.test(item));
      if (strings.length > 0) return strings;

      const paired = collection
        .map((item) => {
          if (typeof item === 'object' && item && 'pair' in item && typeof (item as { pair?: unknown }).pair === 'string') {
            return (item as { pair: string }).pair;
          }
          return null;
        })
        .filter((pair): pair is string => Boolean(pair && /^\d{2}$/.test(pair)));
      if (paired.length > 0) return paired;
    }
  }

  return [];
}

export function extractStandardizedEvidence(rawResult: Record<string, unknown> | undefined): string[] {
  if (!rawResult || typeof rawResult !== 'object') return [];

  const collected: string[] = [];
  const candidateCollections = [
    rawResult.predictions,
    rawResult.top5,
    rawResult.top10,
    rawResult.top21,
    rawResult.rankedCandidates,
  ];

  for (const collection of candidateCollections) {
    if (!Array.isArray(collection)) continue;
    for (const item of collection) {
      if (typeof item === 'object' && item && 'whySelectedReasons' in item) {
        const reasons = (item as { whySelectedReasons?: unknown }).whySelectedReasons;
        if (Array.isArray(reasons)) collected.push(...reasons.filter((reason): reason is string => typeof reason === 'string'));
      }
      if (typeof item === 'object' && item && 'whySelected' in item && typeof (item as { whySelected?: unknown }).whySelected === 'string') {
        collected.push((item as { whySelected: string }).whySelected);
      }
    }
  }

  if (rawResult.patternDiscovery && typeof rawResult.patternDiscovery === 'object') {
    const discovery = rawResult.patternDiscovery as Record<string, unknown>;
    if (Array.isArray(discovery.bestCommonDigits)) {
      collected.push(...discovery.bestCommonDigits.map((digit) => `best-common-digit:${digit}`));
    }
  }

  return Array.from(new Set(collected)).slice(0, 10);
}

export function buildStandardizedEngineResult(options: {
  engineId: PrecisionEngineId | string;
  methodName?: string;
  version?: string;
  date?: string;
  channel?: string;
  sourceValues?: Record<string, unknown>;
  normalizedValues?: Record<string, unknown>;
  rawResult?: Record<string, unknown>;
  rawScore?: number;
  score?: number;
  confidence?: number;
  historicalSupport?: number;
  risk?: number;
  steps?: string[];
  evidence?: string[];
}): EngineResult {
  const rawResult = options.rawResult || {};
  const candidates = extractStandardizedCandidates(rawResult);
  const baseScore = Number(options.score ?? options.rawScore ?? 0);
  const confidence = Number(options.confidence ?? Math.max(0, Math.min(1, baseScore / 100)) ?? 0);
  const historicalSupport = Number(options.historicalSupport ?? (rawResult.walkForwardReport && typeof rawResult.walkForwardReport === 'object'
    ? Number((rawResult.walkForwardReport as { totalTestedDraws?: number }).totalTestedDraws ?? 0)
    : 0));
  const risk = Number(options.risk ?? Math.max(0, 100 - Math.min(100, baseScore)) ?? 0);

  const reversePairs = candidates.map((pair) => toReversePair(pair));
  const evidence = [...(options.evidence || []), ...extractStandardizedEvidence(rawResult)];

  return normalizeEngineResult({
    engineId: options.engineId,
    methodName: options.methodName || 'Precision Engine',
    version: options.version || '1.0.0',
    date: options.date,
    channel: options.channel,
    sourceValues: options.sourceValues || {},
    normalizedValues: options.normalizedValues || {},
    steps: options.steps || ['validate()', 'calculate()', 'extractPatterns()', 'score()'],
    intermediateValues: rawResult,
    transformations: { rawResult },
    formulaVersion: options.version || '1.0.0',
    pairs: candidates,
    reversePairs,
    candidates,
    rawScore: baseScore,
    score: baseScore,
    normalizedScore: baseScore,
    confidence,
    historicalSupport,
    riskScore: risk,
    risk,
    evidence: Array.from(new Set(evidence)).slice(0, 12),
    metadata: {
      rawResultDepth: Object.keys(rawResult).length,
      liveStandardized: true,
    },
  });
}

export function createPrecisionIntelligenceEngineRegistry(): PrecisionEngineMeta[] {
  return [
    {
      engineId: 'BELGIUM_SQUARE',
      label: 'Belgium Square',
      category: 'mathematical',
      description: 'Matrix + common-digit structural engine',
      version: '1.0.0',
    },
    {
      engineId: 'G_SQUARE',
      label: 'G-Square',
      category: 'mathematical',
      description: '6x4 vertical/horizontal predictive matrix engine',
      version: '1.0.0',
    },
    {
      engineId: 'G_SQUARE_HARMONIC',
      label: 'G-Square Harmonic',
      category: 'mathematical',
      description: 'Modular harmonic grid for digit convergence',
      version: '1.0.0',
    },
    {
      engineId: 'MATRIX',
      label: 'Matrix Engine',
      category: 'mathematical',
      description: 'Transition and matrix relationship engine',
      version: '1.0.0',
    },
    {
      engineId: 'HARMONIC_GRID',
      label: 'Harmonic Grid',
      category: 'mathematical',
      description: 'Digit alignment and harmonic grid extraction',
      version: '1.0.0',
    },
    {
      engineId: 'HISTORICAL',
      label: 'Historical Engine',
      category: 'historical',
      description: 'Frequency, recency and sequence scoring engine',
      version: '1.0.0',
    },
    {
      engineId: 'REPEATED',
      label: 'Repeated Method',
      category: 'historical',
      description: 'Repeated digit and prior-day frequency engine',
      version: '1.0.0',
    },
    {
      engineId: 'SIR',
      label: 'Sir Theory',
      category: 'historical',
      description: 'Primary set and pair-convergence engine',
      version: '1.0.0',
    },
    {
      engineId: 'PAIR_TRANSFORM',
      label: 'Pair Transform',
      category: 'mathematical',
      description: 'Reverse and transformation pair inference engine',
      version: '1.0.0',
    },
    {
      engineId: 'ML_PATTERN',
      label: 'ML Pattern Engine',
      category: 'ml',
      description: 'Machine learning consensus and probability calibration engine',
      version: '1.0.0',
    },
    {
      engineId: 'WALK_FORWARD',
      label: 'Walk-Forward Validation',
      category: 'ml',
      description: 'Zero-lookahead validation and calibration engine',
      version: '1.0.0',
    },
    {
      engineId: 'CONSENSUS',
      label: 'Consensus Engine',
      category: 'consensus',
      description: 'Cross-engine agreement and weighted synthesis layer',
      version: '1.0.0',
    },
    {
      engineId: 'RANKING',
      label: 'Ranking Engine',
      category: 'ranking',
      description: 'Final candidate prioritization and confidence scoring engine',
      version: '1.0.0',
    },
  ];
}
