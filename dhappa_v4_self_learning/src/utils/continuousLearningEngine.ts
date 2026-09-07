import { DayMarketEntry, MARKETS, Market } from '../types';

export interface GeneratedPredictionEvent {
  id: string;
  date: string;
  market: Market | 'ALL';
  model: string;
  pairs: string[];
  generatedAt: string;
  status: 'PENDING' | 'EVALUATED';
  actualDraws: string[];
  matchedPairs: string[];
  evaluatedAt?: string;
}

export interface ContinuousLearningSummary {
  generatedSets: number;
  evaluatedSets: number;
  hitSets: number;
  hitRatePct: number;
  baselinePct: number;
  lift: number;
}

const STORAGE_KEY = 'dhappa.ml.continuousPredictionEvents.v1';

function readEvents(): GeneratedPredictionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GeneratedPredictionEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: GeneratedPredictionEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 500)));
  } catch (error) {
    console.warn('Continuous ML feedback could not be persisted:', error);
  }
}

function drawsForMarket(record: DayMarketEntry, market: Market | 'ALL'): string[] {
  const markets = market === 'ALL' ? MARKETS : [market];
  return markets.flatMap((currentMarket) => {
    const key = (currentMarket === 'Ghaziabad' ? 'ghaziabad' : currentMarket.toLowerCase()) as keyof DayMarketEntry;
    const value = record[key];
    return typeof value === 'string' && /^\d{2}$/.test(value.trim()) ? [value.trim()] : [];
  });
}

export function recordGeneratedPrediction(input: Omit<GeneratedPredictionEvent, 'id' | 'status' | 'actualDraws' | 'matchedPairs'>): void {
  const events = readEvents();
  const event: GeneratedPredictionEvent = {
    ...input,
    id: `prediction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'PENDING',
    actualDraws: [],
    matchedPairs: [],
  };
  writeEvents([event, ...events]);
}

export function reconcileGeneratedPredictions(records: DayMarketEntry[]): ContinuousLearningSummary {
  const events = readEvents();
  let changed = false;
  const reconciled = events.map((event) => {
    const record = records.find((candidate) => candidate.date === event.date);
    if (!record) return event;
    const actualDraws = drawsForMarket(record, event.market);
    if (actualDraws.length === 0) return event;
    const matchedPairs = event.pairs.filter((pair) => actualDraws.includes(pair));
    const nextEvent = {
      ...event,
      status: 'EVALUATED' as const,
      actualDraws,
      matchedPairs,
      evaluatedAt: new Date().toISOString(),
    };
    if (event.status !== nextEvent.status || event.matchedPairs.join(',') !== matchedPairs.join(',')) changed = true;
    return nextEvent;
  });
  if (changed) writeEvents(reconciled);
  return summarizeContinuousLearning(reconciled);
}

export function loadGeneratedPredictionEvents(): GeneratedPredictionEvent[] {
  return readEvents();
}

export function summarizeContinuousLearning(events: GeneratedPredictionEvent[] = readEvents()): ContinuousLearningSummary {
  const evaluated = events.filter((event) => event.status === 'EVALUATED');
  const hitSets = evaluated.filter((event) => event.matchedPairs.length > 0).length;
  const hitRatePct = evaluated.length > 0 ? (hitSets / evaluated.length) * 100 : 0;
  const averagePoolSize = evaluated.length > 0
    ? evaluated.reduce((sum, event) => sum + event.pairs.length, 0) / evaluated.length
    : 0;
  const baselinePct = averagePoolSize;
  return {
    generatedSets: events.length,
    evaluatedSets: evaluated.length,
    hitSets,
    hitRatePct: Math.round(hitRatePct * 10) / 10,
    baselinePct: Math.round(baselinePct * 10) / 10,
    lift: baselinePct > 0 ? Math.round((hitRatePct / baselinePct) * 100) / 100 : 0,
  };
}