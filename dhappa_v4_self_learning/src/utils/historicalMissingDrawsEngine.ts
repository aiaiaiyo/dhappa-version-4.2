/**
 * Historical Draw Gap & Continuity Diagnostic Engine
 * Generates sequential calendar dates for the past 3 months (or configurable windows)
 * and compares against existing historical records to identify missing dates and incomplete market draws.
 */

import { DayMarketEntry, Market, MARKETS } from '../types';
import { formatDateISO, parseDateSafe, getTodayDateISO } from './mathEngine';

export type DrawCompletenessStatus = 'COMPLETE' | 'INCOMPLETE' | 'MISSING';

export interface MissingMarketDrawDetail {
  date: string;
  dayOfWeek: string;
  dayOfMonth: number;
  monthLabel: string;
  status: DrawCompletenessStatus;
  record: DayMarketEntry | null;
  deshawar: string;
  faridabad: string;
  ghaziabad: string;
  gali: string;
  isDeshawarMissing: boolean;
  isFaridabadMissing: boolean;
  isGhaziabadMissing: boolean;
  isGaliMissing: boolean;
  missingMarkets: Market[];
  presentMarkets: Market[];
  missingCount: number; // 0 to 4
  gapStreakLength: number; // consecutive missing/incomplete days ending at this date
}

export interface MonthGapSummary {
  monthKey: string; // "2026-08"
  monthLabel: string; // "August 2026"
  totalDays: number;
  completeDays: number;
  incompleteDays: number;
  missingDays: number;
  completenessRatePct: number;
}

export interface HistoricalMissingDrawsReport {
  referenceDate: string;
  startDate: string;
  endDate: string;
  lookbackMonths: number;
  totalCalendarDays: number;
  totalRecordedDays: number;
  totalCompleteDays: number;
  totalIncompleteDays: number;
  totalMissingDays: number;
  totalActionRequiredDays: number; // missing + incomplete
  overallCompletenessPct: number;
  maxConsecutiveMissingStreak: number;
  marketCompletenessStats: {
    deshawar: { filled: number; total: number; pct: number };
    faridabad: { filled: number; total: number; pct: number };
    ghaziabad: { filled: number; total: number; pct: number };
    gali: { filled: number; total: number; pct: number };
  };
  monthlySummaries: MonthGapSummary[];
  allDateDetails: MissingMarketDrawDetail[];
  gapsOnly: MissingMarketDrawDetail[];
  entirelyMissingOnly: MissingMarketDrawDetail[];
  incompleteOnly: MissingMarketDrawDetail[];
}

const diagnosticCache = new Map<string, HistoricalMissingDrawsReport>();

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isValidTwoDigitDraw(val: any): boolean {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  return /^\d{2}$/.test(str);
}

/**
 * Generate sequential dates from startDate to endDate (inclusive) in YYYY-MM-DD
 */
export function generateSequentialDateRange(startDateISO: string, endDateISO: string): string[] {
  const dates: string[] = [];
  const current = parseDateSafe(startDateISO);
  const end = parseDateSafe(endDateISO);

  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Analyze historical records against a generated 3-month (or custom) calendar timeline
 */
export function analyzeHistoricalMissingDraws(
  records: DayMarketEntry[],
  options?: {
    lookbackMonths?: number;
    referenceDateISO?: string;
  }
): HistoricalMissingDrawsReport {
  const lookbackMonths = options?.lookbackMonths ?? 3;
  const referenceDate = options?.referenceDateISO || (records.length > 0 ? records[0]?.date : getTodayDateISO()) || getTodayDateISO();

  // Create memoization cache key
  const latestRec = records[0];
  const earliestRec = records[records.length - 1];
  const cacheKey = `${records.length}:${latestRec?.date || ''}:${earliestRec?.date || ''}:${lookbackMonths}:${referenceDate}`;

  const cached = diagnosticCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Calculate start date by going back lookbackMonths (e.g. ~90-93 days)
  const refDateObj = parseDateSafe(referenceDate);
  const startDateObj = new Date(refDateObj.getFullYear(), refDateObj.getMonth() - lookbackMonths, refDateObj.getDate(), 12, 0, 0);
  const startDateISO = formatDateISO(startDateObj);
  const endDateISO = referenceDate;

  // Generate full sequential calendar array
  const calendarDates = generateSequentialDateRange(startDateISO, endDateISO);

  // Fast map lookup of existing records
  const recordMap = new Map<string, DayMarketEntry>();
  records.forEach((r) => {
    if (r.date) {
      recordMap.set(r.date, r);
    }
  });

  const allDateDetails: MissingMarketDrawDetail[] = [];
  let totalCompleteDays = 0;
  let totalIncompleteDays = 0;
  let totalMissingDays = 0;
  let currentMissingStreak = 0;
  let maxConsecutiveMissingStreak = 0;

  let deshawarFilled = 0;
  let faridabadFilled = 0;
  let ghaziabadFilled = 0;
  let galiFilled = 0;

  const monthlyGroupMap = new Map<string, { total: number; complete: number; incomplete: number; missing: number }>();

  // Process chronological or reverse
  calendarDates.forEach((dateISO) => {
    const dObj = parseDateSafe(dateISO);
    const dayOfWeek = DAYS_OF_WEEK[dObj.getDay()];
    const dayOfMonth = dObj.getDate();
    const monthKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!monthlyGroupMap.has(monthKey)) {
      monthlyGroupMap.set(monthKey, { total: 0, complete: 0, incomplete: 0, missing: 0 });
    }
    const mGroup = monthlyGroupMap.get(monthKey)!;
    mGroup.total++;

    const existingRec = recordMap.get(dateISO) || null;

    if (!existingRec) {
      totalMissingDays++;
      currentMissingStreak++;
      if (currentMissingStreak > maxConsecutiveMissingStreak) {
        maxConsecutiveMissingStreak = currentMissingStreak;
      }
      mGroup.missing++;

      allDateDetails.push({
        date: dateISO,
        dayOfWeek,
        dayOfMonth,
        monthLabel,
        status: 'MISSING',
        record: null,
        deshawar: '',
        faridabad: '',
        ghaziabad: '',
        gali: '',
        isDeshawarMissing: true,
        isFaridabadMissing: true,
        isGhaziabadMissing: true,
        isGaliMissing: true,
        missingMarkets: ['Deshawar', 'Faridabad', 'Ghaziabad', 'Gali'],
        presentMarkets: [],
        missingCount: 4,
        gapStreakLength: currentMissingStreak,
      });
    } else {
      const isDS = isValidTwoDigitDraw(existingRec.deshawar);
      const isFB = isValidTwoDigitDraw(existingRec.faridabad);
      const isGB = isValidTwoDigitDraw(existingRec.ghaziabad);
      const isGL = isValidTwoDigitDraw(existingRec.gali);

      if (isDS) deshawarFilled++;
      if (isFB) faridabadFilled++;
      if (isGB) ghaziabadFilled++;
      if (isGL) galiFilled++;

      const missingMarkets: Market[] = [];
      const presentMarkets: Market[] = [];

      if (isDS) presentMarkets.push('Deshawar'); else missingMarkets.push('Deshawar');
      if (isFB) presentMarkets.push('Faridabad'); else missingMarkets.push('Faridabad');
      if (isGB) presentMarkets.push('Ghaziabad'); else missingMarkets.push('Ghaziabad');
      if (isGL) presentMarkets.push('Gali'); else missingMarkets.push('Gali');

      const isAllComplete = isDS && isFB && isGB && isGL;

      if (isAllComplete) {
        totalCompleteDays++;
        currentMissingStreak = 0;
        mGroup.complete++;

        allDateDetails.push({
          date: dateISO,
          dayOfWeek,
          dayOfMonth,
          monthLabel,
          status: 'COMPLETE',
          record: existingRec,
          deshawar: existingRec.deshawar || '',
          faridabad: existingRec.faridabad || '',
          ghaziabad: existingRec.ghaziabad || '',
          gali: existingRec.gali || '',
          isDeshawarMissing: false,
          isFaridabadMissing: false,
          isGhaziabadMissing: false,
          isGaliMissing: false,
          missingMarkets: [],
          presentMarkets,
          missingCount: 0,
          gapStreakLength: 0,
        });
      } else {
        totalIncompleteDays++;
        currentMissingStreak++;
        if (currentMissingStreak > maxConsecutiveMissingStreak) {
          maxConsecutiveMissingStreak = currentMissingStreak;
        }
        mGroup.incomplete++;

        allDateDetails.push({
          date: dateISO,
          dayOfWeek,
          dayOfMonth,
          monthLabel,
          status: 'INCOMPLETE',
          record: existingRec,
          deshawar: existingRec.deshawar || '',
          faridabad: existingRec.faridabad || '',
          ghaziabad: existingRec.ghaziabad || '',
          gali: existingRec.gali || '',
          isDeshawarMissing: !isDS,
          isFaridabadMissing: !isFB,
          isGhaziabadMissing: !isGB,
          isGaliMissing: !isGL,
          missingMarkets,
          presentMarkets,
          missingCount: missingMarkets.length,
          gapStreakLength: currentMissingStreak,
        });
      }
    }
  });

  // Sort details descending (newest first for UI inspection)
  allDateDetails.sort((a, b) => b.date.localeCompare(a.date));

  const totalCalendarDays = calendarDates.length;
  const totalRecordedDays = totalCompleteDays + totalIncompleteDays;
  const totalActionRequiredDays = totalMissingDays + totalIncompleteDays;
  const overallCompletenessPct = totalCalendarDays > 0
    ? Number(((totalCompleteDays / totalCalendarDays) * 100).toFixed(1))
    : 100;

  const gapsOnly = allDateDetails.filter((d) => d.status !== 'COMPLETE');
  const entirelyMissingOnly = allDateDetails.filter((d) => d.status === 'MISSING');
  const incompleteOnly = allDateDetails.filter((d) => d.status === 'INCOMPLETE');

  // Month-by-month summaries
  const monthlySummaries: MonthGapSummary[] = Array.from(monthlyGroupMap.entries()).map(([monthKey, g]) => {
    const [y, m] = monthKey.split('-');
    const mDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1, 12, 0, 0);
    const monthLabel = mDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const completenessRatePct = g.total > 0 ? Number(((g.complete / g.total) * 100).toFixed(1)) : 100;

    return {
      monthKey,
      monthLabel,
      totalDays: g.total,
      completeDays: g.complete,
      incompleteDays: g.incomplete,
      missingDays: g.missing,
      completenessRatePct,
    };
  }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  const report: HistoricalMissingDrawsReport = {
    referenceDate,
    startDate: startDateISO,
    endDate: endDateISO,
    lookbackMonths,
    totalCalendarDays,
    totalRecordedDays,
    totalCompleteDays,
    totalIncompleteDays,
    totalMissingDays,
    totalActionRequiredDays,
    overallCompletenessPct,
    maxConsecutiveMissingStreak,
    marketCompletenessStats: {
      deshawar: {
        filled: deshawarFilled,
        total: totalCalendarDays,
        pct: Number(((deshawarFilled / totalCalendarDays) * 100).toFixed(1)),
      },
      faridabad: {
        filled: faridabadFilled,
        total: totalCalendarDays,
        pct: Number(((faridabadFilled / totalCalendarDays) * 100).toFixed(1)),
      },
      ghaziabad: {
        filled: ghaziabadFilled,
        total: totalCalendarDays,
        pct: Number(((ghaziabadFilled / totalCalendarDays) * 100).toFixed(1)),
      },
      gali: {
        filled: galiFilled,
        total: totalCalendarDays,
        pct: Number(((galiFilled / totalCalendarDays) * 100).toFixed(1)),
      },
    },
    monthlySummaries,
    allDateDetails,
    gapsOnly,
    entirelyMissingOnly,
    incompleteOnly,
  };

  diagnosticCache.set(cacheKey, report);
  if (diagnosticCache.size > 20) {
    const firstKey = diagnosticCache.keys().next().value;
    if (firstKey) diagnosticCache.delete(firstKey);
  }

  return report;
}
