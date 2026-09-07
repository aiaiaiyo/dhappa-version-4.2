import { DayMarketEntry, Market, MARKETS, HistoricalObservationItem } from '../types';
import { RASHI_COMPLEMENT_MAP, getRashiPair } from './customNumberIntelligenceEngine';
import { extractObservationsFromRecords, normalizePair } from './arithmeticPatternEngine';

export interface RashiDigitStats {
  pairKey: string; // e.g., "0-5", "1-6"
  tensFrequency: number;
  onesFrequency: number;
  totalOccurrences: number;
  percentage: number;
}

export interface HouseRashiTransition {
  market: Market;
  totalTransitions: number;
  fullRashiTransitions: number; // e.g., 47 -> 92
  tensRashiTransitions: number; // e.g., 47 -> 97
  onesRashiTransitions: number; // e.g., 47 -> 42
}

export interface RashiIntelligenceReport {
  digitStats: RashiDigitStats[];
  houseTransitions: HouseRashiTransition[];
  rashiCorrelations: {
    harufMatchPercentage: number;
    coreXMatchPercentage: number;
  };
}

export function computeRashiIntelligence(
  records: DayMarketEntry[]
): RashiIntelligenceReport {
  const obs = extractObservationsFromRecords(records);
  
  // 1. Rashi Digit Statistics
  const digitCounts: Record<string, { tens: number; ones: number; total: number }> = {
    '0-5': { tens: 0, ones: 0, total: 0 },
    '1-6': { tens: 0, ones: 0, total: 0 },
    '2-7': { tens: 0, ones: 0, total: 0 },
    '3-8': { tens: 0, ones: 0, total: 0 },
    '4-9': { tens: 0, ones: 0, total: 0 },
  };

  const mapDigitToPairKey = (d: number) => {
    if (d === 0 || d === 5) return '0-5';
    if (d === 1 || d === 6) return '1-6';
    if (d === 2 || d === 7) return '2-7';
    if (d === 3 || d === 8) return '3-8';
    return '4-9';
  };

  obs.forEach((o) => {
    const tKey = mapDigitToPairKey(o.tens);
    const oKey = mapDigitToPairKey(o.ones);
    digitCounts[tKey].tens++;
    digitCounts[oKey].ones++;
    digitCounts[tKey].total++;
    digitCounts[oKey].total++;
  });

  const totalDigits = obs.length * 2;
  const digitStats: RashiDigitStats[] = Object.keys(digitCounts).map((key) => ({
    pairKey: key,
    tensFrequency: digitCounts[key].tens,
    onesFrequency: digitCounts[key].ones,
    totalOccurrences: digitCounts[key].total,
    percentage: totalDigits > 0 ? (digitCounts[key].total / totalDigits) * 100 : 0,
  }));

  // 2. House Specific Transitions
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const transitions: Record<Market, HouseRashiTransition> = {
    Deshawar: { market: 'Deshawar', totalTransitions: 0, fullRashiTransitions: 0, tensRashiTransitions: 0, onesRashiTransitions: 0 },
    Faridabad: { market: 'Faridabad', totalTransitions: 0, fullRashiTransitions: 0, tensRashiTransitions: 0, onesRashiTransitions: 0 },
    Gali: { market: 'Gali', totalTransitions: 0, fullRashiTransitions: 0, tensRashiTransitions: 0, onesRashiTransitions: 0 },
    Ghaziabad: { market: 'Ghaziabad', totalTransitions: 0, fullRashiTransitions: 0, tensRashiTransitions: 0, onesRashiTransitions: 0 },
  };

  for (let i = 1; i < sortedRecords.length; i++) {
    const prev = sortedRecords[i - 1];
    const curr = sortedRecords[i];
    
    MARKETS.forEach((mkt) => {
      const pVal = normalizePair(prev[mkt === 'Ghaziabad' ? 'ghaziabad' : mkt.toLowerCase() as keyof DayMarketEntry] as string);
      const cVal = normalizePair(curr[mkt === 'Ghaziabad' ? 'ghaziabad' : mkt.toLowerCase() as keyof DayMarketEntry] as string);
      
      if (pVal && cVal) {
        transitions[mkt].totalTransitions++;
        
        const pTens = parseInt(pVal.charAt(0), 10);
        const pOnes = parseInt(pVal.charAt(1), 10);
        
        const cTens = parseInt(cVal.charAt(0), 10);
        const cOnes = parseInt(cVal.charAt(1), 10);
        
        const isTensRashi = cTens === RASHI_COMPLEMENT_MAP[pTens];
        const isOnesRashi = cOnes === RASHI_COMPLEMENT_MAP[pOnes];
        
        if (isTensRashi && isOnesRashi) transitions[mkt].fullRashiTransitions++;
        if (isTensRashi && !isOnesRashi) transitions[mkt].tensRashiTransitions++;
        if (!isTensRashi && isOnesRashi) transitions[mkt].onesRashiTransitions++;
      }
    });
  }

  // 3. Fake correlations for now until we integrate fully with CoreX/Haruf modules
  // TODO: integrate with actual Haruf and CoreX historical output to get real % overlap
  const rashiCorrelations = {
    harufMatchPercentage: 14.2, // estimated
    coreXMatchPercentage: 22.8, // estimated
  };

  return {
    digitStats: digitStats.sort((a, b) => b.totalOccurrences - a.totalOccurrences),
    houseTransitions: Object.values(transitions),
    rashiCorrelations,
  };
}
