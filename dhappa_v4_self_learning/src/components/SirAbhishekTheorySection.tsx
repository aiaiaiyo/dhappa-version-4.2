import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DayMarketEntry,
  SirAbhishekTheoryResult,
  SirAbhishekBacktestStep,
} from '../types';
import {
  calculateSirAbhishekTheory,
  calculateDeltaSeries,
  runSirAbhishekBacktest,
  mod10,
} from '../utils/sirAbhishekTheoryEngine';
import { formatDateISO, getTodayDateISO } from '../utils/mathEngine';
import { SirAbhishek15PairHeatmap } from './SirAbhishek15PairHeatmap';
import { CommonNonHitRangeAnalysisModule } from './CommonNonHitRangeAnalysisModule';
import { MonthlyNumberCoverageAnalysisModule } from './MonthlyNumberCoverageAnalysisModule';
import { SirAbhishekFamilyWalkForwardTest } from './SirAbhishekFamilyWalkForwardTest';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Send,
  Calendar,
  CalendarDays,
  Layers,
  Calculator,
  Flame,
  ShieldCheck,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2,
  XCircle,
  Hash,
  Binary,
  Dna,
  HelpCircle,
  Activity,
  Zap,
  Download,
  Search,
  RotateCcw,
  Filter,
  Target,
  Building2,
  CheckSquare,
  Square,
  BarChart3,
  TrendingUp,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ListFilter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { buildStandardizedEngineResult } from '../utils/precisionIntelligenceRegistry';

interface SirAbhishekTheorySectionProps {
  records: DayMarketEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSendPairsToSimulator?: (pairs: string[]) => void;
}

export const SirAbhishekTheorySection: React.FC<SirAbhishekTheorySectionProps> = ({
  records,
  selectedDate,
  onSelectDate,
  onSendPairsToSimulator,
}) => {
  // Mode selection: 'historical-date' | 'today' | 'upcoming' | 'custom-sandbox'
  const [selectedMode, setSelectedMode] = useState<'historical-date' | 'today' | 'upcoming' | 'custom-sandbox'>('historical-date');

  // Data Last Sync & Force Refresh state
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const handleForceRefresh = () => {
    setLastSyncTime(new Date().toLocaleTimeString());
    setRefreshCount((c) => c + 1);
  };

  // Midnight (00:00) exact date rollover watcher
  const lastCheckedDateRef = useRef<string>(getTodayDateISO());
  useEffect(() => {
    const checkMidnightRollover = () => {
      const currentToday = getTodayDateISO();
      if (currentToday !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentToday;
        handleForceRefresh();
      }
    };

    const intervalId = setInterval(checkMidnightRollover, 30000);
    const handleFocus = () => checkMidnightRollover();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Sorted records descending by date
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records, refreshCount]);

  // Custom sandbox 4-house inputs
  const [sandboxInputs, setSandboxInputs] = useState<{
    deshawar: string;
    faridabad: string;
    gali: string;
    gzb: string;
  }>({
    deshawar: '49',
    faridabad: '58',
    gali: '71',
    gzb: '40',
  });

  // Custom manual overrides for digits
  const [manualX, setManualX] = useState<number | null>(null);
  const [manualY, setManualY] = useState<number | null>(null);
  const [manualZ, setManualZ] = useState<number | null>(null);
  const [manualE, setManualE] = useState<number | null>(null);
  const [showOverrides, setShowOverrides] = useState<boolean>(false);

  // Copy state feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filters for Backtesting
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterDay, setFilterDay] = useState<string>('All');
  const [filterWeekday, setFilterWeekday] = useState<string>('All');
  const [filterPrimarySet, setFilterPrimarySet] = useState<string>('All');

  // Custom 4-House Search for Backtesting
  const [searchDS, setSearchDS] = useState<string>('');
  const [searchFB, setSearchFB] = useState<string>('');
  const [searchGL, setSearchGL] = useState<string>('');
  const [searchGZB, setSearchGZB] = useState<string>('');
  const [searchAnyHouse, setSearchAnyHouse] = useState<string>('');
  const [houseSearchScope, setHouseSearchScope] = useState<'target' | 'source' | 'both'>('target');

  // Multi-Row Range Selection & Common Numbers Analyzer
  const [selectedBacktestDates, setSelectedBacktestDates] = useState<string[]>([]);
  const [highlightedCommonPair, setHighlightedCommonPair] = useState<string | null>(null);
  const [commonThreshold, setCommonThreshold] = useState<'all' | '100' | '75' | '50'>('50');
  const [rangeSelectStart, setRangeSelectStart] = useState<string>('');
  const [rangeSelectEnd, setRangeSelectEnd] = useState<string>('');
  const [isCommonAnalysisExpanded, setIsCommonAnalysisExpanded] = useState<boolean>(true);

  // Sorting state for Backtesting table (Ascending / Descending order)
  const [backtestSortField, setBacktestSortField] = useState<
    'date' | 'sourceDate' | 'x' | 'primarySet' | 'pairs' | 'actualDraw' | 'result' | 'matchedPairs'
  >('date');
  const [backtestSortDirection, setBacktestSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showNonHitModule, setShowNonHitModule] = useState<boolean>(false);
  const [showMonthlyCoverageModule, setShowMonthlyCoverageModule] = useState<boolean>(false);
  const [showFamilyPredictorModule, setShowFamilyPredictorModule] = useState<boolean>(true);

  const handleToggleSort = (
    field: 'date' | 'sourceDate' | 'x' | 'primarySet' | 'pairs' | 'actualDraw' | 'result' | 'matchedPairs'
  ) => {
    if (backtestSortField === field) {
      setBacktestSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setBacktestSortField(field);
      if (field === 'date' || field === 'sourceDate' || field === 'result' || field === 'matchedPairs') {
        setBacktestSortDirection('desc');
      } else {
        setBacktestSortDirection('asc');
      }
    }
  };

  const isCustomSorted = backtestSortField !== 'date' || backtestSortDirection !== 'desc';

  const resetSorting = () => {
    setBacktestSortField('date');
    setBacktestSortDirection('desc');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filterYear !== 'All' ||
      filterMonth !== 'All' ||
      filterDay !== 'All' ||
      filterWeekday !== 'All' ||
      filterPrimarySet !== 'All' ||
      searchDS.trim() !== '' ||
      searchFB.trim() !== '' ||
      searchGL.trim() !== '' ||
      searchGZB.trim() !== '' ||
      searchAnyHouse.trim() !== '' ||
      isCustomSorted
    );
  }, [
    filterYear,
    filterMonth,
    filterDay,
    filterWeekday,
    filterPrimarySet,
    searchDS,
    searchFB,
    searchGL,
    searchGZB,
    searchAnyHouse,
    isCustomSorted,
  ]);

  const resetAllBacktestFilters = () => {
    setFilterYear('All');
    setFilterMonth('All');
    setFilterDay('All');
    setFilterWeekday('All');
    setFilterPrimarySet('All');
    setSearchDS('');
    setSearchFB('');
    setSearchGL('');
    setSearchGZB('');
    setSearchAnyHouse('');
    setHouseSearchScope('target');
    resetSorting();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Resolve active 4-house inputs based on mode
  const activeHouseData = useMemo(() => {
    if (selectedMode === 'custom-sandbox') {
      return {
        date: 'Custom Sandbox',
        deshawar: sandboxInputs.deshawar,
        faridabad: sandboxInputs.faridabad,
        gali: sandboxInputs.gali,
        gzb: sandboxInputs.gzb,
      };
    }

    if (selectedMode === 'today') {
      const todayISO = getTodayDateISO();
      const match = records.find((r) => r.date === todayISO);
      if (match) {
        return {
          date: todayISO,
          deshawar: match.deshawar,
          faridabad: match.faridabad,
          gali: match.gali,
          gzb: match.gzb || match.ghaziabad,
        };
      }
      // Fallback to latest record
      const latest = sortedRecords[0];
      return {
        date: todayISO,
        deshawar: latest?.deshawar || '49',
        faridabad: latest?.faridabad || '58',
        gali: latest?.gali || '71',
        gzb: latest?.gzb || latest?.ghaziabad || '40',
      };
    }

    if (selectedMode === 'upcoming') {
      const latest = sortedRecords[0];
      return {
        date: 'Upcoming Next Draw',
        deshawar: latest?.deshawar || '49',
        faridabad: latest?.faridabad || '58',
        gali: latest?.gali || '71',
        gzb: latest?.gzb || latest?.ghaziabad || '40',
      };
    }

    // Historical date mode
    const match = records.find((r) => r.date === selectedDate);
    const target = match || sortedRecords[0];
    return {
      date: target?.date || selectedDate,
      deshawar: target?.deshawar || '49',
      faridabad: target?.faridabad || '58',
      gali: target?.gali || '71',
      gzb: target?.gzb || target?.ghaziabad || '40',
    };
  }, [selectedMode, selectedDate, sandboxInputs, records, sortedRecords, refreshCount]);

  // Diagnostic Utility: Raw unmodified data record retrieved for the selected date before calculation starts
  const rawRetrievedRecord = useMemo(() => {
    if (selectedMode === 'custom-sandbox') {
      return {
        id: 'sandbox-custom',
        date: 'Custom Sandbox',
        deshawar: sandboxInputs.deshawar,
        faridabad: sandboxInputs.faridabad,
        gali: sandboxInputs.gali,
        ghaziabad: sandboxInputs.gzb,
        gzb: sandboxInputs.gzb,
        source: 'user-sandbox',
        createdAt: new Date().toISOString(),
      };
    }

    if (selectedMode === 'today') {
      const todayISO = getTodayDateISO();
      const match = records.find((r) => r.date === todayISO);
      if (match) return match;
      return sortedRecords[0] || null;
    }

    if (selectedMode === 'upcoming') {
      return sortedRecords[0] || null;
    }

    // Historical date mode
    const match = records.find((r) => r.date === selectedDate);
    return match || sortedRecords[0] || null;
  }, [selectedMode, selectedDate, sandboxInputs, records, sortedRecords, refreshCount]);

  // Run the Theorem
  const theoryResult: SirAbhishekTheoryResult = useMemo(() => {
    return calculateSirAbhishekTheory({
      sourceDate: activeHouseData.date,
      deshawar: activeHouseData.deshawar,
      faridabad: activeHouseData.faridabad,
      gali: activeHouseData.gali,
      gzb: activeHouseData.gzb,
      manualOverrides: {
        x: manualX !== null ? manualX : undefined,
        y: manualY !== null ? manualY : undefined,
        z: manualZ !== null ? manualZ : undefined,
        e: manualE !== null ? manualE : undefined,
      },
    });
  }, [activeHouseData, manualX, manualY, manualZ, manualE]);

  // Standardized Engine Result for Consensus Layer
  const standardizedSirAbhishekResult = useMemo(() => {
    const candidates = theoryResult.pairSet || [];
    const topBranch = theoryResult.branches?.[0];
    const topScore = topBranch?.targetPairs[0] ? 50 : 0;
    const evidence = (theoryResult.pairSet || []).slice(0, 5).map((p) => `sir-${p}`);

    return buildStandardizedEngineResult({
      engineId: 'SIR_ABHISHEK_THEORY',
      methodName: 'Sir Abhishek Mathematical Theory',
      date: activeHouseData.date,
      channel: 'live-engine-output',
      sourceValues: { x: theoryResult.x, y: theoryResult.y, z: theoryResult.z, e: theoryResult.e },
      normalizedValues: { pairsCount: candidates.length },
      rawResult: theoryResult as any,
      score: topScore,
      confidence: Math.min(1, topScore / 100),
      historicalSupport: 0,
      risk: Math.max(0, 100 - topScore),
      evidence,
      steps: ['validate()', 'calculateDeltas()', 'generateMatrix()', 'rankPairs()', 'score()'],
    });
  }, [theoryResult, activeHouseData.date]);

  // Load Prompt Example: x=4, y=7, z=2, e=9
  const loadPromptExample = () => {
    setSelectedMode('custom-sandbox');
    setSandboxInputs({
      deshawar: '47',
      faridabad: '42',
      gali: '49',
      gzb: '40',
    });
    setManualX(4);
    setManualY(7);
    setManualZ(2);
    setManualE(9);
    setShowOverrides(true);
  };

  // Load Faridabad 58 Example (Delta = |5-8| = 3)
  const loadFaridabad58Example = () => {
    setSelectedMode('custom-sandbox');
    setSandboxInputs({
      deshawar: '36',
      faridabad: '58',
      gali: '14',
      gzb: '47',
    });
    resetOverrides();
  };

  // Load Faridabad 54 Example (Delta = |5-4| = 1)
  const loadFaridabad54Example = () => {
    setSelectedMode('custom-sandbox');
    setSandboxInputs({
      deshawar: '45',
      faridabad: '54',
      gali: '23',
      gzb: '67',
    });
    resetOverrides();
  };

  const resetOverrides = () => {
    setManualX(null);
    setManualY(null);
    setManualZ(null);
    setManualE(null);
  };

  // Backtest across all historical dates
  const backtestSteps = useMemo(() => {
    return runSirAbhishekBacktest(records);
  }, [records]);

  const filteredBacktestSteps = useMemo(() => {
    return backtestSteps.filter((step) => {
      const d = step.date.split('-');
      if (d.length === 3) {
        const [year, month, day] = d;
        if (filterYear !== 'All' && year !== filterYear) return false;
        if (filterMonth !== 'All' && month !== filterMonth) return false;
        if (filterDay !== 'All' && day !== filterDay) return false;
      }

      if (filterWeekday !== 'All') {
        const dateObj = new Date(step.date);
        const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        if (weekdayStr !== filterWeekday) return false;
      }

      const pSetStr = `[${step.primarySet.join(',')}]`;
      if (filterPrimarySet !== 'All' && pSetStr !== filterPrimarySet) return false;

      // Custom 4-House Search Filter
      // step.targetHouseOutcomes = [DS, FB, GL, GZB]
      // step.sourceHouseOutcomes = [DS, FB, GL, GZB]
      const targetDS = (step.targetHouseOutcomes[0] || '').trim();
      const targetFB = (step.targetHouseOutcomes[1] || '').trim();
      const targetGL = (step.targetHouseOutcomes[2] || '').trim();
      const targetGZB = (step.targetHouseOutcomes[3] || '').trim();

      const sourceDS = (step.sourceHouseOutcomes[0] || '').trim();
      const sourceFB = (step.sourceHouseOutcomes[1] || '').trim();
      const sourceGL = (step.sourceHouseOutcomes[2] || '').trim();
      const sourceGZB = (step.sourceHouseOutcomes[3] || '').trim();

      const testHouseMatch = (targetVal: string, sourceVal: string, query: string) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        const matchTarget = targetVal.toLowerCase().includes(q);
        const matchSource = sourceVal.toLowerCase().includes(q);

        if (houseSearchScope === 'target') return matchTarget;
        if (houseSearchScope === 'source') return matchSource;
        return matchTarget || matchSource;
      };

      if (searchDS.trim() && !testHouseMatch(targetDS, sourceDS, searchDS)) return false;
      if (searchFB.trim() && !testHouseMatch(targetFB, sourceFB, searchFB)) return false;
      if (searchGL.trim() && !testHouseMatch(targetGL, sourceGL, searchGL)) return false;
      if (searchGZB.trim() && !testHouseMatch(targetGZB, sourceGZB, searchGZB)) return false;

      if (searchAnyHouse.trim()) {
        const queries = searchAnyHouse
          .split(/[\s,]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        const targetVals = [targetDS, targetFB, targetGL, targetGZB].map((v) => v.toLowerCase());
        const sourceVals = [sourceDS, sourceFB, sourceGL, sourceGZB].map((v) => v.toLowerCase());

        const matchesQuery = queries.some((q) => {
          const matchTarget = targetVals.some((v) => v.includes(q));
          const matchSource = sourceVals.some((v) => v.includes(q));
          if (houseSearchScope === 'target') return matchTarget;
          if (houseSearchScope === 'source') return matchSource;
          return matchTarget || matchSource;
        });

        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [
    backtestSteps,
    filterYear,
    filterMonth,
    filterDay,
    filterWeekday,
    filterPrimarySet,
    searchDS,
    searchFB,
    searchGL,
    searchGZB,
    searchAnyHouse,
    houseSearchScope,
  ]);

  // Sorted backtest steps based on backtestSortField & backtestSortDirection
  const sortedBacktestSteps = useMemo(() => {
    const list = [...filteredBacktestSteps];
    const modifier = backtestSortDirection === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      let comparison = 0;
      switch (backtestSortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'sourceDate':
          comparison = a.sourceDate.localeCompare(b.sourceDate);
          break;
        case 'x':
          comparison = a.x - b.x;
          break;
        case 'primarySet':
          comparison = a.primarySet.join('').localeCompare(b.primarySet.join(''));
          break;
        case 'pairs':
          comparison = a.sirAbhishekPairs.length - b.sirAbhishekPairs.length;
          break;
        case 'actualDraw':
          comparison = a.targetHouseOutcomes.join('-').localeCompare(b.targetHouseOutcomes.join('-'));
          break;
        case 'result': {
          const aScore = (a.isHit ? 100 : 0) + a.hitHouseNames.length;
          const bScore = (b.isHit ? 100 : 0) + b.hitHouseNames.length;
          comparison = aScore - bScore;
          break;
        }
        case 'matchedPairs': {
          comparison = a.matchedPairs.length - b.matchedPairs.length;
          if (comparison === 0) {
            comparison = a.matchedPairs.join(',').localeCompare(b.matchedPairs.join(','));
          }
          break;
        }
        default:
          comparison = a.date.localeCompare(b.date);
      }

      if (comparison === 0) {
        return b.date.localeCompare(a.date);
      }
      return comparison * modifier;
    });

    return list;
  }, [filteredBacktestSteps, backtestSortField, backtestSortDirection]);

  // Derive filter options
  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    const days = new Set<string>();
    const weekdays = new Set<string>();
    const primarySets = new Set<string>();

    backtestSteps.forEach((step) => {
      const parts = step.date.split('-');
      if (parts.length === 3) {
        years.add(parts[0]);
        months.add(parts[1]);
        days.add(parts[2]);
      }
      const d = new Date(step.date);
      if (!isNaN(d.getTime())) {
        weekdays.add(d.toLocaleDateString('en-US', { weekday: 'long' }));
      }
      primarySets.add(`[${step.primarySet.join(',')}]`);
    });

    return {
      years: Array.from(years).sort(),
      months: Array.from(months).sort(),
      days: Array.from(days).sort(),
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter(w => weekdays.has(w)),
      primarySets: Array.from(primarySets).sort(),
    };
  }, [backtestSteps]);

  const houseHitStats = useMemo(() => {
    if (filteredBacktestSteps.length === 0) return [];
    const total = filteredBacktestSteps.length;
    const counts: { [key: string]: number } = { Deshawar: 0, Faridabad: 0, Gali: 0, GZB: 0 };
    filteredBacktestSteps.forEach((step) => {
      step.hitHouseNames.forEach((h) => {
        if (counts[h] !== undefined) {
          counts[h]++;
        }
      });
    });
    return Object.keys(counts).map((house) => ({
      house,
      hits: counts[house],
      percentage: Number(((counts[house] / total) * 100).toFixed(1)),
    }));
  }, [filteredBacktestSteps]);

  const backtestStats = useMemo(() => {
    if (filteredBacktestSteps.length === 0) return { total: 0, hits: 0, hitRate: 0, multiHits: 0 };
    const hits = filteredBacktestSteps.filter((s) => s.isHit).length;
    const multiHits = filteredBacktestSteps.filter((s) => s.hitCount > 1).length;
    return {
      total: filteredBacktestSteps.length,
      hits,
      hitRate: Math.round((hits / filteredBacktestSteps.length) * 100),
      multiHits,
    };
  }, [filteredBacktestSteps]);

  // Helper handlers for row/range selection
  const toggleSelectDate = (date: string) => {
    setSelectedBacktestDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const selectAllFilteredDates = () => {
    setSelectedBacktestDates(filteredBacktestSteps.map((s) => s.date));
  };

  const clearAllSelectedDates = () => {
    setSelectedBacktestDates([]);
    setHighlightedCommonPair(null);
  };

  const selectLastNDays = (n: number) => {
    const dates = filteredBacktestSteps.slice(0, n).map((s) => s.date);
    setSelectedBacktestDates(dates);
  };

  const selectCustomDateRange = (start: string, end: string) => {
    if (!start && !end) return;
    const s = start || '1970-01-01';
    const e = end || '2099-12-31';
    const minD = s <= e ? s : e;
    const maxD = s <= e ? e : s;
    const matching = filteredBacktestSteps
      .filter((step) => step.date >= minD && step.date <= maxD)
      .map((step) => step.date);
    setSelectedBacktestDates(matching);
  };

  const selectHitsOnly = () => {
    setSelectedBacktestDates(filteredBacktestSteps.filter((s) => s.isHit).map((s) => s.date));
  };

  const selectMissesOnly = () => {
    setSelectedBacktestDates(filteredBacktestSteps.filter((s) => !s.isHit).map((s) => s.date));
  };

  // Comprehensive Common Numbers Analysis across selected range
  const rangeCommonStats = useMemo(() => {
    if (selectedBacktestDates.length === 0) return null;

    const selectedSteps = filteredBacktestSteps.filter((s) =>
      selectedBacktestDates.includes(s.date)
    );

    if (selectedSteps.length === 0) return null;

    const totalSelected = selectedSteps.length;
    const hitsCount = selectedSteps.filter((s) => s.isHit).length;
    const multiHitsCount = selectedSteps.filter((s) => s.hitCount > 1).length;
    const hitRate = Math.round((hitsCount / totalSelected) * 100);
    const totalHitMatches = selectedSteps.reduce((acc, s) => acc + s.matchedPairs.length, 0);

    // Sort dates to show range span
    const sortedDates = [...selectedSteps.map((s) => s.date)].sort();
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];

    // Frequency analysis of generated 15 pairs
    const pairMap: {
      [pair: string]: {
        pair: string;
        generatedCount: number;
        generatedDates: string[];
        actualDrawHitsCount: number;
        hitDates: string[];
      };
    } = {};

    selectedSteps.forEach((step) => {
      // Generated 15 pairs
      step.sirAbhishekPairs.forEach((pair) => {
        if (!pairMap[pair]) {
          pairMap[pair] = {
            pair,
            generatedCount: 0,
            generatedDates: [],
            actualDrawHitsCount: 0,
            hitDates: [],
          };
        }
        pairMap[pair].generatedCount++;
        pairMap[pair].generatedDates.push(step.date);

        // Check if this generated pair hit the actual draw for this step
        if (step.matchedPairs.includes(pair)) {
          pairMap[pair].actualDrawHitsCount++;
          pairMap[pair].hitDates.push(step.date);
        }
      });
    });

    const rankedPairs = Object.values(pairMap).map((item) => ({
      ...item,
      frequencyPct: Math.round((item.generatedCount / totalSelected) * 100),
      is100Percent: item.generatedCount === totalSelected,
      isHighConsensus: (item.generatedCount / totalSelected) >= 0.75,
      isMajority: (item.generatedCount / totalSelected) >= 0.50,
    })).sort((a, b) => {
      if (b.generatedCount !== a.generatedCount) return b.generatedCount - a.generatedCount;
      if (b.actualDrawHitsCount !== a.actualDrawHitsCount) return b.actualDrawHitsCount - a.actualDrawHitsCount;
      return a.pair.localeCompare(b.pair);
    });

    const strict100Pairs = rankedPairs.filter((p) => p.is100Percent);
    const high75Pairs = rankedPairs.filter((p) => p.isHighConsensus && !p.is100Percent);
    const majority50Pairs = rankedPairs.filter((p) => p.isMajority && !p.isHighConsensus && !p.is100Percent);
    const lowFrequencyPairs = rankedPairs.filter((p) => !p.isMajority);

    // Primary Set S Digits (Haroof) frequency analysis across selected steps
    const digitCounts: { [digit: string]: number } = {};
    for (let d = 0; d <= 9; d++) {
      digitCounts[d.toString()] = 0;
    }

    selectedSteps.forEach((step) => {
      step.primarySet.forEach((digit) => {
        const dStr = digit.toString();
        if (digitCounts[dStr] !== undefined) {
          digitCounts[dStr]++;
        }
      });
    });

    const rankedDigits = Object.entries(digitCounts)
      .map(([digit, count]) => ({
        digit,
        count,
        percentage: Math.round((count / totalSelected) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSelected,
      minDate,
      maxDate,
      hitsCount,
      multiHitsCount,
      hitRate,
      totalHitMatches,
      rankedPairs,
      strict100Pairs,
      high75Pairs,
      majority50Pairs,
      lowFrequencyPairs,
      rankedDigits,
    };
  }, [selectedBacktestDates, filteredBacktestSteps]);

  const exportBacktestData = () => {
    if (filteredBacktestSteps.length === 0) return;

    const headers = [
      'Target Date',
      'Source Date',
      'Source DS',
      'Source FB',
      'Source GL',
      'Source GZB',
      'Core X',
      'Primary Set S',
      'Generated 15 Pairs',
      'Target DS',
      'Target FB',
      'Target GL',
      'Target GZB',
      'Result',
      'Matched Pairs'
    ];

    const rows = filteredBacktestSteps.map(step => [
      step.date,
      step.sourceDate,
      step.sourceHouseOutcomes[0] || '--',
      step.sourceHouseOutcomes[1] || '--',
      step.sourceHouseOutcomes[2] || '--',
      step.sourceHouseOutcomes[3] || '--',
      step.x,
      `"[${step.primarySet.join(',')}]"`,
      `"${step.sirAbhishekPairs.join(', ')}"`,
      step.targetHouseOutcomes[0] || '--',
      step.targetHouseOutcomes[1] || '--',
      step.targetHouseOutcomes[2] || '--',
      step.targetHouseOutcomes[3] || '--',
      step.isHit ? `HIT (${step.hitCount})` : 'MISS',
      `"${step.matchedPairs.join(', ')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sir-abhishek-backtest-${getTodayDateISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setCopiedKey('export-csv');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                METHOD 3: SIR ABHISHEK THEORY
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Exact 15-Pair Complete Combinatoric Set
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Four-House Recurring Single-Digit Convergence & Pair-Expansion Theorem
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Let four houses be <strong className="text-purple-300">H = {'{Deshawar, Faridabad, Gali, GZB}'}</strong>.
              Identifies the peak recurring single digit <strong className="text-cyan-300">x</strong>, derives cyclic modulo-10
              neighbors <strong className="text-amber-300">a = (x-1) mod 10</strong> and <strong className="text-amber-300">b = (x+1) mod 10</strong>,
              associates secondary paired digits <strong className="text-emerald-300">y, z, e</strong> to establish primary vertical sequence{' '}
              <strong className="text-slate-200 font-mono">[a, x, b, y, z, e]</strong>, and performs systematic pairwise expansion generating exactly{' '}
              <strong className="text-purple-300 font-mono">C(6, 2) = 15 unique pairs</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loadPromptExample}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-600/30 border border-purple-400/40"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Ref: x=4</span>
              </button>
              <button
                type="button"
                onClick={loadFaridabad58Example}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-600/30 border border-amber-400/40"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>FB 58 (Δ3)</span>
              </button>
              <button
                type="button"
                onClick={loadFaridabad54Example}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-600/30 border border-cyan-400/40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>FB 54 (Δ1)</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowOverrides(!showOverrides)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>{showOverrides ? 'Hide Parameter Tweaks' : 'Customize S={a,x,b,y,z,e}'}</span>
            </button>
          </div>
        </div>

        {/* INPUT MODE CONTROLS & DATE SELECTOR */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Source Data:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMode('historical-date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'historical-date'
                  ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Historical Record</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'today'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today ({getTodayDateISO()})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('custom-sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'custom-sandbox'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Interactive Sandbox</span>
            </button>
          </div>

          {selectedMode === 'historical-date' && (
            <div className="flex items-center gap-2">
              <label htmlFor="history-date-select" className="text-xs text-slate-400 font-mono">
                Select Date:
              </label>
              <select
                id="history-date-select"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-purple-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
              >
                {sortedRecords.map((r) => (
                  <option key={r.date} value={r.date}>
                    {r.date} (DS:{r.deshawar}, FB:{r.faridabad}, GL:{r.gali}, GZ:{r.gzb || r.ghaziabad})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* DIAGNOSTIC UTILITY: RAW UNMODIFIED RECORD */}
        <div className="mt-5 bg-slate-950/90 border border-cyan-500/40 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Data Last Sync: <strong className="text-emerald-400">{lastSyncTime}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleForceRefresh}
              className="text-xs font-mono bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Force Refresh (Re-read Storage)</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                🔍 DIAGNOSTIC UTILITY
              </span>
              <span className="text-xs font-mono text-slate-300 font-semibold">
                Raw Unmodified Retrieved Record ({rawRetrievedRecord?.date || selectedDate})
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(rawRetrievedRecord, null, 2), 'raw-json')}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 px-2.5 py-1 rounded border border-cyan-500/30 transition cursor-pointer flex items-center gap-1"
            >
              {copiedKey === 'raw-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'raw-json' ? 'Copied JSON' : 'Copy Raw JSON'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400">Date</div>
              <div className="text-cyan-300 font-bold truncate">{rawRetrievedRecord?.date || '-'}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400">Deshawar (DS)</div>
              <div className="text-emerald-300 font-extrabold text-sm">{rawRetrievedRecord?.deshawar || '-'}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400">Faridabad (FB)</div>
              <div className="text-emerald-300 font-extrabold text-sm">{rawRetrievedRecord?.faridabad || '-'}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400">Gali (GL)</div>
              <div className="text-emerald-300 font-extrabold text-sm">{rawRetrievedRecord?.gali || '-'}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400">Ghaziabad (GZB)</div>
              <div className="text-amber-300 font-extrabold text-sm">{rawRetrievedRecord?.ghaziabad || rawRetrievedRecord?.gzb || '-'}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400">Source / ID</div>
              <div className="text-purple-300 font-bold truncate text-[11px]">{rawRetrievedRecord?.source || rawRetrievedRecord?.id || 'storage'}</div>
            </div>
          </div>
        </div>

        {/* CUSTOM SANDBOX 4-HOUSE MANUAL INPUTS */}
        {selectedMode === 'custom-sandbox' && (
          <div className="mt-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4">
            <div className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
              <Binary className="w-4 h-4" />
              <span>Interactive 4-House Observation Sandbox (Enter any 2-digit outcomes):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Deshawar (DS):</label>
                <input
                  type="text"
                  maxLength={2}
                  value={sandboxInputs.deshawar}
                  onChange={(e) => setSandboxInputs({ ...sandboxInputs, deshawar: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-lg text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Faridabad (FB):</label>
                <input
                  type="text"
                  maxLength={2}
                  value={sandboxInputs.faridabad}
                  onChange={(e) => setSandboxInputs({ ...sandboxInputs, faridabad: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-lg text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Gali (GL):</label>
                <input
                  type="text"
                  maxLength={2}
                  value={sandboxInputs.gali}
                  onChange={(e) => setSandboxInputs({ ...sandboxInputs, gali: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-lg text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Ghaziabad (GZB):</label>
                <input
                  type="text"
                  maxLength={2}
                  value={sandboxInputs.gzb}
                  onChange={(e) => setSandboxInputs({ ...sandboxInputs, gzb: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-lg text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* MANUAL OVERRIDES PANEL */}
        {showOverrides && (
          <div className="mt-4 bg-slate-950/90 border border-purple-500/30 rounded-xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Fine-tune S = {'{a, x, b, y, z, e}'} Parameters:</span>
              </div>
              <button
                type="button"
                onClick={resetOverrides}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Auto Engine</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono">
                  Primary X ({theoryResult.x}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  placeholder={`Auto (${theoryResult.x})`}
                  value={manualX ?? ''}
                  onChange={(e) => setManualX(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Secondary Y ({theoryResult.y}):</label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  placeholder={`Auto (${theoryResult.y})`}
                  value={manualY ?? ''}
                  onChange={(e) => setManualY(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Secondary Z ({theoryResult.z}):</label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  placeholder={`Auto (${theoryResult.z})`}
                  value={manualZ ?? ''}
                  onChange={(e) => setManualZ(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Secondary E ({theoryResult.e}):</label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  placeholder={`Auto (${theoryResult.e})`}
                  value={manualE ?? ''}
                  onChange={(e) => setManualE(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: PROMINENT RESULT SHOWCASE CARD (15 PAIRS) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 border-2 border-purple-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-wider text-purple-300 uppercase">
              SIR ABHISHEK COMPLETE PAIR SET (15 PAIRS)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/40">
              Source: {activeHouseData.date}
            </span>
          </div>
        </div>

        {/* BRACKET NOTATION OUTPUT */}
        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 sm:p-5 mb-5 shadow-inner">
          <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Official Pair Set P(S) = {'{ (di, dj) : 1 <= i < j <= 6 }'}:</span>
            <span className="text-emerald-400 font-bold">15 / 15 Distinct Pairs</span>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black tracking-widest text-purple-200 select-all overflow-x-auto whitespace-nowrap py-1">
            {theoryResult.bracketNotation}
          </div>
          <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">Primary Set S:</span>
              <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                [{theoryResult.primarySet.map((s) => `${s.label}:${s.digit}`).join(', ')}]
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-300 font-mono font-semibold">
              <span>C(6, 2) = (6 × 5) / 2 = 15 Combinations</span>
            </div>
          </div>
        </div>

        {/* 15 TILES VISUAL GRID */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5 mb-5">
          {theoryResult.pairSet.map((pair, idx) => {
            // Find formula branch
            let formula = '';
            for (const b of theoryResult.branches) {
              const match = b.targetPairs.find((tp) => tp.pair === pair);
              if (match) {
                formula = match.formula;
                break;
              }
            }

            return (
              <div
                key={`${pair}-${idx}`}
                className="bg-slate-950/80 hover:bg-purple-950/60 border border-purple-500/30 hover:border-purple-400 rounded-xl p-2.5 text-center transition group shadow-md"
              >
                <div className="text-[10px] font-mono text-slate-500 group-hover:text-purple-400 mb-0.5">
                  #{idx + 1} {formula.split('→')[0].trim()}
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-slate-100 group-hover:text-purple-300">
                  {pair}
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => copyToClipboard(theoryResult.bracketNotation, 'bracket')}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
          >
            {copiedKey === 'bracket' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied Bracket!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-purple-400" />
                <span>Copy [Bracket Format]</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(theoryResult.csvNotation, 'csv')}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
          >
            {copiedKey === 'csv' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied CSV!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>Copy CSV (34, 35, ...)</span>
              </>
            )}
          </button>

          {onSendPairsToSimulator && (
            <button
              type="button"
              onClick={() => onSendPairsToSimulator(theoryResult.pairSet)}
              className="w-full sm:w-auto ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-600/30"
            >
              <Send className="w-4 h-4" />
              <span>Simulate 15 Pairs in Risk Engine</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1.5: FARIDABAD DELTA SERIES (Δ = |A - B|) & FOUR-HOUSE CONVERGENCE */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  FARIDABAD DELTA THEOREM: Δ = |A - B|
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Number: <strong className="text-amber-300 font-black">{theoryResult.faridabadDelta.sourceNumber}</strong> → Δ = |{theoryResult.faridabadDelta.digitA} - {theoryResult.faridabadDelta.digitB}| = <strong className="text-amber-400 font-black text-sm">{theoryResult.faridabadDelta.delta}</strong>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-100 mt-1">
                Same-Delta Series (00–99 Range) & Convergence with Four Houses
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(theoryResult.faridabadDelta.fullDeltaSeries.join(', '), 'delta-series')}
              className="bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-500/40 text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedKey === 'delta-series' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Delta Series!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Delta-{theoryResult.faridabadDelta.delta} ({theoryResult.faridabadDelta.fullDeltaSeries.length} Pairs)</span>
                </>
              )}
            </button>
            {onSendPairsToSimulator && (
              <button
                type="button"
                onClick={() => onSendPairsToSimulator(theoryResult.faridabadDelta.fullDeltaSeries)}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Delta Range</span>
              </button>
            )}
          </div>
        </div>

        {/* DELTA EQUATION & STATS BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">Faridabad Delta Calculation</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-amber-300">
                |{theoryResult.faridabadDelta.digitA} - {theoryResult.faridabadDelta.digitB}| = {theoryResult.faridabadDelta.delta}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                (Delta {theoryResult.faridabadDelta.delta} Series)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              All 2-digit numbers where the absolute difference between tens & ones equals {theoryResult.faridabadDelta.delta}.
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">Delta-{theoryResult.faridabadDelta.delta} Range Cardinality</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-cyan-300">
                {theoryResult.faridabadDelta.fullDeltaSeries.length} Ordered Pairs
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                Complete 00–99
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Ascending: {theoryResult.faridabadDelta.deltaSeriesAscending.length} pairs | Descending: {theoryResult.faridabadDelta.deltaSeriesDescending.length} pairs
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">Four-House Delta Matches</div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {theoryResult.faridabadDelta.fourHousesComparison.map((h) => (
                <span
                  key={h.houseName}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    h.hasSameDelta
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title={`${h.houseName}: ${h.outcomeNumber} (Δ = ${h.outcomeDelta})`}
                >
                  {h.houseName.slice(0, 2)}: {h.outcomeNumber} {h.hasSameDelta ? '★' : `(Δ${h.outcomeDelta})`}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Houses sharing the exact same Delta {theoryResult.faridabadDelta.delta}.
            </p>
          </div>
        </div>

        {/* TWO-ROW ORDERED DELTA SERIES SHOWCASE */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="text-xs font-mono text-amber-400 font-semibold mb-3 flex items-center justify-between">
            <span>Complete Ordered Delta-{theoryResult.faridabadDelta.delta} Matrix (00–99 Range):</span>
            <span className="text-slate-400 text-[11px] font-normal">
              Ordered by Ascending (A &lt; B) and Inverted/Descending (A &gt; B)
            </span>
          </div>

          {/* Ascending Series */}
          {theoryResult.faridabadDelta.deltaSeriesAscending.length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Ascending Branch (Tens &lt; Ones):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {theoryResult.faridabadDelta.deltaSeriesAscending.map((num, idx) => {
                  const in15 = theoryResult.pairSet.includes(num);
                  const inHouses = theoryResult.faridabadDelta.fourHousesComparison.filter(
                    (h) => h.outcomeNumber === num
                  );

                  return (
                    <div
                      key={`${num}-${idx}`}
                      className={`px-3 py-2 rounded-xl font-mono text-center transition ${
                        num === theoryResult.faridabadDelta.sourceNumber
                          ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-lg shadow-amber-500/30'
                          : in15
                          ? 'bg-purple-950/80 border-2 border-purple-400 text-purple-200 font-bold'
                          : inHouses.length > 0
                          ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base sm:text-lg font-black">{num}</div>
                      <div className="text-[9px] mt-0.5 opacity-80">
                        {num === theoryResult.faridabadDelta.sourceNumber
                          ? 'FB Actual'
                          : in15
                          ? 'In 15-Pairs'
                          : inHouses.length > 0
                          ? inHouses.map((h) => h.houseName.slice(0, 2)).join('+')
                          : `Δ${theoryResult.faridabadDelta.delta}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Descending Series */}
          {theoryResult.faridabadDelta.deltaSeriesDescending.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Descending Branch (Tens &gt; Ones):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {theoryResult.faridabadDelta.deltaSeriesDescending.map((num, idx) => {
                  const in15 = theoryResult.pairSet.includes(num);
                  const inHouses = theoryResult.faridabadDelta.fourHousesComparison.filter(
                    (h) => h.outcomeNumber === num
                  );

                  return (
                    <div
                      key={`${num}-${idx}`}
                      className={`px-3 py-2 rounded-xl font-mono text-center transition ${
                        num === theoryResult.faridabadDelta.sourceNumber
                          ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-lg shadow-amber-500/30'
                          : in15
                          ? 'bg-purple-950/80 border-2 border-purple-400 text-purple-200 font-bold'
                          : inHouses.length > 0
                          ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base sm:text-lg font-black">{num}</div>
                      <div className="text-[9px] mt-0.5 opacity-80">
                        {num === theoryResult.faridabadDelta.sourceNumber
                          ? 'FB Actual'
                          : in15
                          ? 'In 15-Pairs'
                          : inHouses.length > 0
                          ? inHouses.map((h) => h.houseName.slice(0, 2)).join('+')
                          : `Δ${theoryResult.faridabadDelta.delta}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SUGGESTED DELTA-ENHANCED CORE NUMBERS & CONFIDENCE SCORE MATRIX */}
        <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-xl p-4 sm:p-5 mb-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Suggested Delta-Enhanced Core Numbers &amp; Confidence Matrix
              </h3>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 font-bold">
              Delta-{theoryResult.faridabadDelta.delta} + Sir Abhishek 15-Pair Fusion
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Combining the main Sir Abhishek 15-pair engine set with Faridabad Delta-{theoryResult.faridabadDelta.delta} series. Numbers intersecting both engines receive highest empirical confidence scores.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {theoryResult.faridabadDelta.fullDeltaSeries.slice(0, 12).map((pair, idx) => {
              const in15 = theoryResult.pairSet.includes(pair);
              const confidence = in15 ? 94 : 78;
              return (
                <div
                  key={`sug-${pair}-${idx}`}
                  className={`p-2.5 rounded-xl border text-center font-mono ${
                    in15
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs text-slate-400">{in15 ? '★ Super-Conv' : 'Delta Match'}</div>
                  <div className="text-xl font-black">{pair}</div>
                  <div className="text-[11px] font-bold mt-1 text-cyan-300">{confidence}% Conf</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONVERGENCE INTERSECTION ANALYSIS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Convergence: Faridabad Delta-{theoryResult.faridabadDelta.delta} ∩ Sir Abhishek 15-Pair Set ∩ Four Houses
              </span>
            </div>
            <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-500/30">
              {theoryResult.faridabadDelta.convergingPairs.filter((cp) => cp.inSirAbhishek15).length} Intersecting Pairs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
            {theoryResult.faridabadDelta.convergingPairs
              .filter((cp) => cp.inSirAbhishek15 || cp.appearedInHouses.length > 0)
              .map((cp, idx) => (
                <div
                  key={`${cp.pair}-${idx}`}
                  className="bg-slate-900 p-2.5 rounded-lg border border-purple-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-amber-300">{cp.pair}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      (Δ = |{cp.pair[0]}-{cp.pair[1]}| = {Math.abs(parseInt(cp.pair[0], 10) - parseInt(cp.pair[1], 10))})
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-[10px]">
                    {cp.inSirAbhishek15 && (
                      <span className="text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/40">
                        In 15-Pair Set
                      </span>
                    )}
                    {cp.appearedInHouses.length > 0 && (
                      <span className="text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        {cp.appearedInHouses.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STEP 1: FOUR-HOUSE OBSERVATIONS & DIGIT FREQUENCY */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/40">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Four-House Digit Analysis
              </h3>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Extract 8 single digits from all four houses to identify the highest recurring digit{' '}
              <strong className="text-cyan-300 font-mono">x</strong>.
            </p>

            {/* 4 Houses Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Deshawar</div>
                <div className="font-mono text-lg font-black text-cyan-400">{theoryResult.sourceHouseValues.deshawar}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Faridabad</div>
                <div className="font-mono text-lg font-black text-cyan-400">{theoryResult.sourceHouseValues.faridabad}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Gali</div>
                <div className="font-mono text-lg font-black text-cyan-400">{theoryResult.sourceHouseValues.gali}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Ghaziabad</div>
                <div className="font-mono text-lg font-black text-cyan-400">{theoryResult.sourceHouseValues.gzb}</div>
              </div>
            </div>

            {/* Digit Frequency List */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 mb-1">Digit Frequency Count (0–9):</div>
              <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
                {theoryResult.digitFrequencies.slice(0, 10).map((df) => (
                  <div
                    key={df.digit}
                    className={`p-1.5 rounded text-center border ${
                      df.digit === theoryResult.x
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>{df.digit}</div>
                    <div className="text-[10px] text-slate-500 font-bold">{df.count}x</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-300">Most Recurring Digit:</span>
            <span className="font-mono font-bold text-sm text-cyan-400">
              x = {theoryResult.x} ({theoryResult.xCount}x in houses)
            </span>
          </div>
        </div>

        {/* STEP 2 & 3: CYCLIC NEIGHBORS & SECONDARY DIGITS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center border border-purple-500/40">
                2 & 3
              </span>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Cyclic Modulo-10 & Secondary Set
              </h3>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Derive cyclic neighbors <strong className="text-purple-300 font-mono">a, b</strong> and secondary associated digits{' '}
              <strong className="text-emerald-300 font-mono">y, z, e</strong>.
            </p>

            {/* Core 3-Digit Triad */}
            <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 mb-3">
              <div className="text-[11px] font-mono text-purple-400 uppercase font-semibold mb-2">
                Primary Modulo-10 Cyclic Triad [a, x, b]:
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">a = (x-1) % 10</div>
                  <div className="text-lg font-bold text-amber-400">{theoryResult.a}</div>
                </div>
                <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-500/40">
                  <div className="text-[10px] text-purple-400">x (Core)</div>
                  <div className="text-lg font-extrabold text-cyan-300">{theoryResult.x}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">b = (x+1) % 10</div>
                  <div className="text-lg font-bold text-amber-400">{theoryResult.b}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-center">
                Cyclic arithmetic: (0-1=9, 9+1=0 mod 10)
              </div>
            </div>

            {/* Secondary 3 Digits */}
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
              <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold mb-2">
                Secondary Associated Digits [y, z, e]:
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">y (Partner 1)</div>
                  <div className="text-lg font-bold text-emerald-300">{theoryResult.y}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">z (Partner 2)</div>
                  <div className="text-lg font-bold text-emerald-300">{theoryResult.z}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">e (Partner 3)</div>
                  <div className="text-lg font-bold text-emerald-300">{theoryResult.e}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/20 text-xs">
            <span className="text-slate-300">Complete Primary Basis: </span>
            <span className="font-mono font-bold text-purple-300">
              S = {'{' + theoryResult.primarySet.map((s) => s.digit).join(', ') + '}'}
            </span>
          </div>
        </div>

        {/* STEP 4: PRIMARY VERTICAL SEQUENCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/40">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Primary Vertical Sequence
              </h3>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              The 6 digits written in exact vertical order for downward pairwise expansion:
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono">
              {theoryResult.primarySet.map((item, idx) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-purple-400 uppercase">
                      {item.label} =
                    </span>
                    <span className="text-base font-black text-slate-100">
                      {item.digit}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {item.role.split('(')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 text-center">
            <span className="text-xs font-mono text-emerald-300 font-bold">
              Expansion: a → x → b → y → z → e
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: STEP 5 PAIR-EXPANSION RULE BREAKDOWN & HISTORICAL REPETITION HEATMAP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <SirAbhishek15PairHeatmap
          theoryResult={theoryResult}
          records={records}
          onSendPairsToSimulator={onSendPairsToSimulator}
        />
      </div>

      {/* SECTION 4: VISUAL THEORY ARCHITECTURE & THEOREM PROOF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* THEORY FLOW TREE DIAGRAM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Visual Theory Flow Architecture
            </h3>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-300/90 overflow-x-auto leading-relaxed whitespace-pre">
{`                    SIR ABHISHEK THEORY
                           │
                           ▼
              FOUR-HOUSE DIGIT ANALYSIS
                           │
       ┌───────────┬───────────┬───────────┬───────────┐
       ▼           ▼           ▼           ▼
   Deshawar    Faridabad      Gali        GZB
       └───────────┴───────────┴───────────┘
                           │
                           ▼
              MOST RECURRING SINGLE DIGIT
                           │
                           ▼
                           X
                     /           \\
                  X-1             X+1
                   │                │
                   A                B
                           │
                           ▼
             SECONDARY PAIRED DIGITS
                       Y, Z, E
                           │
                           ▼
                 PRIMARY SET OF SIX
                    A X B Y Z E
                           │
                           ▼
                  VERTICAL EXPANSION
                           │
                           ▼
          ┌────────────────────────────────┐
          │ AX AB AY AZ AE                 │
          │ XB XY XZ XE                    │
          │ BY BZ BE                       │
          │ YZ YE                          │
          │ ZE                             │
          └────────────────────────────────┘
                           │
                           ▼
                     15 UNIQUE PAIRS`}
          </div>
        </div>

        {/* FORMAL MATHEMATICAL PROOF & COMBINATORICS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Formal Theorem Specification & Proof
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                  1. Formal Set Definition:
                </div>
                <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">
                  S = {'{ (x - 1) mod 10, x, (x + 1) mod 10, y, z, e }'}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                  2. Generated Pair Set Definition:
                </div>
                <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">
                  P(S) = {'{ (di, dj) : 1 <= i < j <= 6 }'}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                  3. Exact Cardinality (No Redundancy):
                </div>
                <div className="font-mono text-emerald-300 font-bold bg-slate-900 p-2 rounded border border-slate-800">
                  |P(S)| = C(6, 2) = (6 × 5) / (2 × 1) = 15 Pairs
                </div>
              </div>

              <p className="text-slate-400 text-xs mt-2">
                This method is mathematically closed and deterministic: once the six-digit primary basis is established, the 15 combinations represent the complete, non-arbitrary pairwise expansion of the set.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Modulo: <strong className="text-slate-200">Z / 10Z</strong></span>
            <span>Basis: <strong className="text-purple-300">6 Distinct Digits</strong></span>
            <span>Combinations: <strong className="text-emerald-400">15 Pairs</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 5: WALK-FORWARD HISTORICAL BACKTESTING REPLAY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Lookahead Replay
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Sir Abhishek Theory Walk-Forward Backtesting
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluates historical accuracy: Day T-1's four houses predict the 15-pair set, tested against Day T's actual outcomes.
            </p>
          </div>

          {/* Quick Stats Bento Pills */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Hit Rate</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{backtestStats.hitRate}%</div>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Total Hits</div>
              <div className="text-sm font-mono font-bold text-cyan-400">
                {backtestStats.hits} / {backtestStats.total}
              </div>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Multi-Hits</div>
              <div className="text-sm font-mono font-bold text-purple-400">{backtestStats.multiHits} Days</div>
            </div>
            <button
              onClick={exportBacktestData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer flex flex-col items-center justify-center min-w-[70px]"
            >
              {copiedKey === 'export-csv' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Exported</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                  <span className="text-[10px] font-mono uppercase">Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Backtest Filters & Custom 4-House Search */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 mb-5 space-y-4">
          {/* Top Row: Date, Weekday & Primary Set Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-400 uppercase font-bold">Year:</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="All">All Years</option>
                  {filterOptions.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Month:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="All">All Months</option>
                  {filterOptions.months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Date:</span>
                <select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="All">All Dates</option>
                  {filterOptions.days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Weekday:</span>
                <select
                  value={filterWeekday}
                  onChange={(e) => setFilterWeekday(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="All">All Weekdays</option>
                  {filterOptions.weekdays.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Primary Set S:</span>
                <select
                  value={filterPrimarySet}
                  onChange={(e) => setFilterPrimarySet(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-purple-500 cursor-pointer max-w-[180px]"
                >
                  <option value="All">All Primary Sets</option>
                  {filterOptions.primarySets.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Sort By Field */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-purple-500/30 rounded-xl px-2 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] text-purple-300 uppercase font-bold">Sort By:</span>
                <select
                  value={backtestSortField}
                  onChange={(e) => setBacktestSortField(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-purple-200 text-xs rounded-lg px-2 py-0.5 outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="date">Target Date</option>
                  <option value="sourceDate">Source (T-1) Date</option>
                  <option value="x">Core X Digit</option>
                  <option value="primarySet">Primary Set S</option>
                  <option value="result">Result (Hit/Miss)</option>
                  <option value="matchedPairs">Matched Pairs Count</option>
                </select>

                {/* Ascending / Descending Toggle Buttons */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 ml-1">
                  <button
                    onClick={() => setBacktestSortDirection('desc')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                      backtestSortDirection === 'desc'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Sort in Descending Order (Newest First / High to Low)"
                  >
                    <ArrowDown className="w-3 h-3" />
                    <span>Descending</span>
                  </button>
                  <button
                    onClick={() => setBacktestSortDirection('asc')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                      backtestSortDirection === 'asc'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Sort in Ascending Order (Oldest First / Low to High)"
                  >
                    <ArrowUp className="w-3 h-3" />
                    <span>Ascending</span>
                  </button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllBacktestFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition cursor-pointer"
                title="Reset all filters, house searches, and sort order"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All Filters & Sort
              </button>
            )}
          </div>

          {/* Bottom Row: Custom 4-House Search Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">
                  Custom House Number Search (4 Houses)
                </span>
                <span className="text-[10px] text-slate-400">
                  Filter historical draws matching specific 2-digit numbers
                </span>
              </div>

              {/* Scope Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                <button
                  onClick={() => setHouseSearchScope('target')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    houseSearchScope === 'target'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Target Draw (Day T)
                </button>
                <button
                  onClick={() => setHouseSearchScope('source')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    houseSearchScope === 'source'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Source Draw (Day T-1)
                </button>
                <button
                  onClick={() => setHouseSearchScope('both')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    houseSearchScope === 'both'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Either / Both
                </button>
              </div>
            </div>

            {/* 4 Houses Dedicated Inputs + Any House Query */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Deshawar DS */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-2 focus-within:border-blue-400 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Deshawar (DS)</span>
                  {searchDS && (
                    <button
                      onClick={() => setSearchDS('')}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={searchDS}
                  onChange={(e) => setSearchDS(e.target.value)}
                  placeholder="e.g. 49"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs px-2 py-1 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* Faridabad FB */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-2 focus-within:border-amber-400 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Faridabad (FB)</span>
                  {searchFB && (
                    <button
                      onClick={() => setSearchFB('')}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={searchFB}
                  onChange={(e) => setSearchFB(e.target.value)}
                  placeholder="e.g. 58"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs px-2 py-1 rounded-lg outline-none focus:border-amber-400"
                />
              </div>

              {/* Gali GL */}
              <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-2 focus-within:border-purple-400 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Gali (GL)</span>
                  {searchGL && (
                    <button
                      onClick={() => setSearchGL('')}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={searchGL}
                  onChange={(e) => setSearchGL(e.target.value)}
                  placeholder="e.g. 71"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs px-2 py-1 rounded-lg outline-none focus:border-purple-400"
                />
              </div>

              {/* Ghaziabad GZB */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2 focus-within:border-cyan-400 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Ghaziabad (GZB)</span>
                  {searchGZB && (
                    <button
                      onClick={() => setSearchGZB('')}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={searchGZB}
                  onChange={(e) => setSearchGZB(e.target.value)}
                  placeholder="e.g. 40"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs px-2 py-1 rounded-lg outline-none focus:border-cyan-400"
                />
              </div>

              {/* Any House Search */}
              <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-slate-700 rounded-xl p-2 focus-within:border-purple-400 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Any of 4 Houses</span>
                  {searchAnyHouse && (
                    <button
                      onClick={() => setSearchAnyHouse('')}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchAnyHouse}
                    onChange={(e) => setSearchAnyHouse(e.target.value)}
                    placeholder="e.g. 58 or 71..."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs pl-7 pr-2 py-1 rounded-lg outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Active search feedback */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1 text-slate-400">
              <div className="flex items-center gap-2">
                <span>Showing <strong className="text-emerald-400">{filteredBacktestSteps.length}</strong> of {backtestSteps.length} backtest steps</span>
                {filteredBacktestSteps.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Hit Rate: {backtestStats.hitRate}% ({backtestStats.hits} hits)
                  </span>
                )}
              </div>

              {(searchDS || searchFB || searchGL || searchGZB || searchAnyHouse) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase text-slate-500">Active House Search:</span>
                  {searchDS && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px]">
                      DS: {searchDS}
                    </span>
                  )}
                  {searchFB && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                      FB: {searchFB}
                    </span>
                  )}
                  {searchGL && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px]">
                      GL: {searchGL}
                    </span>
                  )}
                  {searchGZB && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px]">
                      GZB: {searchGZB}
                    </span>
                  )}
                  {searchAnyHouse && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                      Any: {searchAnyHouse}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* House-wise Hit Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {houseHitStats.map((item) => (
            <div key={item.house} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{item.house}</span>
                <span className="text-emerald-400 font-bold">{item.hits} Hits</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-black text-slate-100">{item.percentage}%</span>
                <span className="text-[10px] text-slate-500 font-mono">Hit Rate</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Range Selection Bar & Common Numbers Quick Tools */}
        <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-100">
                Range Multi-Select & Common Number Finder
              </span>
              <span className="text-[10px] text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">
                {selectedBacktestDates.length} of {filteredBacktestSteps.length} draws selected
              </span>
            </div>

            {selectedBacktestDates.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllSelectedDates}
                  className="text-xs font-mono text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Quick Preset Selection Buttons & Custom Range Inputs */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs font-mono">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Presets:</span>
              <button
                onClick={() => selectLastNDays(7)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer"
              >
                Last 7 Draws
              </button>
              <button
                onClick={() => selectLastNDays(15)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer"
              >
                Last 15 Draws
              </button>
              <button
                onClick={() => selectLastNDays(30)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer"
              >
                Last 30 Draws
              </button>
              <button
                onClick={selectAllFilteredDates}
                className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition cursor-pointer font-bold"
              >
                Select All ({filteredBacktestSteps.length})
              </button>
              <button
                onClick={selectHitsOnly}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
              >
                Hits Only ({backtestStats.hits})
              </button>
              <button
                onClick={selectMissesOnly}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition cursor-pointer"
              >
                Misses Only
              </button>
            </div>

            {/* Custom Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold px-1">From:</span>
              <select
                value={rangeSelectStart}
                onChange={(e) => setRangeSelectStart(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-0.5 outline-none focus:border-purple-500 cursor-pointer max-w-[110px]"
              >
                <option value="">Start Date</option>
                {filteredBacktestSteps.map((s) => (
                  <option key={`start-${s.date}`} value={s.date}>{s.date}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 uppercase font-bold px-1">To:</span>
              <select
                value={rangeSelectEnd}
                onChange={(e) => setRangeSelectEnd(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-0.5 outline-none focus:border-purple-500 cursor-pointer max-w-[110px]"
              >
                <option value="">End Date</option>
                {filteredBacktestSteps.map((s) => (
                  <option key={`end-${s.date}`} value={s.date}>{s.date}</option>
                ))}
              </select>
              <button
                onClick={() => selectCustomDateRange(rangeSelectStart, rangeSelectEnd)}
                disabled={!rangeSelectStart && !rangeSelectEnd}
                className="px-2.5 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold transition cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Dedicated Toggle for Sir Abhishek Family Predictor Module */}
            <button
              onClick={() => setShowFamilyPredictorModule(!showFamilyPredictorModule)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showFamilyPredictorModule
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
                  : 'bg-slate-900 hover:bg-slate-850 text-purple-300 border border-purple-500/40 hover:border-purple-400'
              }`}
              title="Toggle Sir Abhishek Family Leading Predictor & Walk-Forward Test"
            >
              <Dna className="w-3.5 h-3.5 text-purple-400" />
              <span>{showFamilyPredictorModule ? 'Hide Family Predictor' : 'Family Predictor'}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-purple-950/60 text-purple-200 border border-purple-800/40">
                Vedic Fam
              </span>
            </button>

            {/* Dedicated Toggle for Monthly 00-99 Coverage Analysis Engine */}
            <button
              onClick={() => setShowMonthlyCoverageModule(!showMonthlyCoverageModule)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showMonthlyCoverageModule
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400'
                  : 'bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="Toggle Monthly 00–99 Number Coverage Analysis"
            >
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showMonthlyCoverageModule ? 'Hide Monthly Coverage' : 'Monthly 00–99 Coverage'}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950/60 text-cyan-200 border border-cyan-800/40">
                100 Universe
              </span>
            </button>

            {/* Dedicated Toggle for Common Non-Hit Range Analysis Engine */}
            <button
              onClick={() => setShowNonHitModule(!showNonHitModule)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showNonHitModule
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'bg-slate-900 hover:bg-slate-850 text-rose-300 border border-rose-500/40 hover:border-rose-400'
              }`}
              title="Toggle Common Non-Hit Range Analysis (7d, 15d, 30d, 50d, 100d, Custom)"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{showNonHitModule ? 'Hide Non-Hit Analysis' : 'Common Non-Hit Analysis'}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-rose-950/60 text-rose-200 border border-rose-800/40">
                Range Engine
              </span>
            </button>
          </div>
        </div>

        {/* Sir Abhishek Family Leading Predictor & Walk-Forward Test Module */}
        {showFamilyPredictorModule && (
          <div className="mb-6">
            <SirAbhishekFamilyWalkForwardTest
              activeDate={selectedDate}
              activeSirAbhishekPairs={theoryResult.pairSet}
              backtestSteps={backtestSteps}
            />
          </div>
        )}

        {/* Embedded Monthly 00-99 Number Coverage Analysis Module */}
        {showMonthlyCoverageModule && (
          <div className="mb-6">
            <MonthlyNumberCoverageAnalysisModule
              records={records}
              onSendPairsToSimulator={onSendPairsToSimulator}
            />
          </div>
        )}

        {/* Embedded Common Non-Hit Range Analysis Module */}
        {showNonHitModule && (
          <div className="mb-6">
            <CommonNonHitRangeAnalysisModule
              backtestSteps={backtestSteps}
              onSendPairsToSimulator={onSendPairsToSimulator}
            />
          </div>
        )}

        {/* Common Numbers Calculation & Range Analysis Box */}
        {rangeCommonStats && (
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 mb-5 transition-all">
            {/* Header with Range Metadata & Hit Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Binary className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                    Common Numbers & Pair Frequency Analyzer
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {rangeCommonStats.totalSelected} Draws ({rangeCommonStats.minDate} → {rangeCommonStats.maxDate})
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Calculates common numbers generated in the 15-pair sets across your selected date range and their actual draw outcomes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCommonAnalysisExpanded(!isCommonAnalysisExpanded)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
                >
                  {isCommonAnalysisExpanded ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      Expand Details
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Top Stat Bento Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] text-purple-300/80 uppercase font-mono">Strict 100% Common</div>
                <div className="text-xl font-mono font-black text-amber-300">
                  {rangeCommonStats.strict100Pairs.length} Pairs
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Present in ALL {rangeCommonStats.totalSelected} draws</div>
              </div>

              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] text-purple-300/80 uppercase font-mono">Consensus (≥50%)</div>
                <div className="text-xl font-mono font-black text-purple-300">
                  {rangeCommonStats.strict100Pairs.length + rangeCommonStats.high75Pairs.length + rangeCommonStats.majority50Pairs.length} Pairs
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Generated in ≥ 50% draws</div>
              </div>

              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] text-purple-300/80 uppercase font-mono">Range Hit Rate</div>
                <div className="text-xl font-mono font-black text-emerald-400">
                  {rangeCommonStats.hitRate}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{rangeCommonStats.hitsCount} of {rangeCommonStats.totalSelected} draws hit</div>
              </div>

              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] text-purple-300/80 uppercase font-mono">Total Draw Hits</div>
                <div className="text-xl font-mono font-black text-cyan-400">
                  {rangeCommonStats.totalHitMatches}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Winning pair matches</div>
              </div>
            </div>

            {isCommonAnalysisExpanded && (
              <>
                {/* 1. Strict 100% Common Pairs (Intersection) */}
                <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Strict 100% Common Numbers (Intersection)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Generated by Sir Abhishek theory in every selected draw
                      </span>
                    </div>

                    {rangeCommonStats.strict100Pairs.length > 0 && (
                      <div className="flex items-center gap-2">
                        {onSendPairsToSimulator && (
                          <button
                            onClick={() => onSendPairsToSimulator(rangeCommonStats.strict100Pairs.map(p => p.pair))}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            Send Strict to Simulator
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(rangeCommonStats.strict100Pairs.map(p => p.pair).join(', '), 'strict-pairs')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                        >
                          {copiedKey === 'strict-pairs' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy Strict
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {rangeCommonStats.strict100Pairs.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rangeCommonStats.strict100Pairs.map((p) => {
                        const isHighlighted = highlightedCommonPair === p.pair;
                        return (
                          <button
                            key={`strict-${p.pair}`}
                            onClick={() => setHighlightedCommonPair(isHighlighted ? null : p.pair)}
                            className={`group px-3 py-1.5 rounded-xl border font-mono transition cursor-pointer flex items-center gap-2 ${
                              isHighlighted
                                ? 'bg-amber-500 text-slate-950 font-black border-amber-300 ring-2 ring-amber-400 shadow-lg'
                                : 'bg-slate-900/90 border-amber-500/40 text-amber-200 hover:border-amber-400 hover:bg-slate-850'
                            }`}
                            title={`Click to highlight pair ${p.pair} in table below`}
                          >
                            <span className="text-sm font-black">{p.pair}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isHighlighted ? 'bg-slate-900 text-amber-300 font-bold' : 'bg-slate-950 text-slate-400'
                            }`}>
                              100% ({p.generatedCount}/{rangeCommonStats.totalSelected})
                            </span>
                            {p.actualDrawHitsCount > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                isHighlighted ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                ⚡ {p.actualDrawHitsCount} Hits
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        No single pair appeared in 100% of the {rangeCommonStats.totalSelected} selected draws. Check the High Consensus (≥75%) and Majority (≥50%) common pairs below.
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Ranked Pair Commonality & Draw Correlation */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Common Pair Frequency Ranking & Draw Correlation
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Click any pair pill to spotlight its occurrences across backtest rows)
                      </span>
                    </div>

                    {/* Commonality Threshold Selector */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                      <button
                        onClick={() => setCommonThreshold('100')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          commonThreshold === '100'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        100% Strict ({rangeCommonStats.strict100Pairs.length})
                      </button>
                      <button
                        onClick={() => setCommonThreshold('75')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          commonThreshold === '75'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ≥ 75% High ({rangeCommonStats.strict100Pairs.length + rangeCommonStats.high75Pairs.length})
                      </button>
                      <button
                        onClick={() => setCommonThreshold('50')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          commonThreshold === '50'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ≥ 50% Majority ({rangeCommonStats.strict100Pairs.length + rangeCommonStats.high75Pairs.length + rangeCommonStats.majority50Pairs.length})
                      </button>
                      <button
                        onClick={() => setCommonThreshold('all')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          commonThreshold === 'all'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All Generated ({rangeCommonStats.rankedPairs.length})
                      </button>
                    </div>
                  </div>

                  {/* Filtered Pairs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                    {rangeCommonStats.rankedPairs
                      .filter((p) => {
                        if (commonThreshold === '100') return p.is100Percent;
                        if (commonThreshold === '75') return p.isHighConsensus;
                        if (commonThreshold === '50') return p.isMajority;
                        return true;
                      })
                      .map((p) => {
                        const isHighlighted = highlightedCommonPair === p.pair;
                        return (
                          <div
                            key={`pair-rank-${p.pair}`}
                            onClick={() => setHighlightedCommonPair(isHighlighted ? null : p.pair)}
                            className={`p-2.5 rounded-xl border font-mono transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                              isHighlighted
                                ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-400 shadow-md'
                                : p.is100Percent
                                ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                                : p.isHighConsensus
                                ? 'bg-purple-950/30 border-purple-500/30 hover:border-purple-400'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-base font-black text-slate-100">{p.pair}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                p.is100Percent
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : p.isHighConsensus
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {p.frequencyPct}%
                              </span>
                            </div>

                            <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  p.is100Percent
                                    ? 'bg-amber-400'
                                    : p.isHighConsensus
                                    ? 'bg-purple-400'
                                    : 'bg-slate-600'
                                }`}
                                style={{ width: `${p.frequencyPct}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span>{p.generatedCount}/{rangeCommonStats.totalSelected} draws</span>
                              {p.actualDrawHitsCount > 0 ? (
                                <span className="text-emerald-400 font-bold">
                                  ⚡ {p.actualDrawHitsCount} Draw Hits
                                </span>
                              ) : (
                                <span className="text-slate-600">0 hits</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 3. Core Digits (Haroof) Consensus Distribution */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Primary Set Digits (Haroof) Frequency across Selected Draws
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Dominant core digits appearing in Primary Set S
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
                    {rangeCommonStats.rankedDigits.map((d) => (
                      <div
                        key={`digit-${d.digit}`}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-center space-y-1"
                      >
                        <div className="text-sm font-black text-cyan-300 font-mono">{d.digit}</div>
                        <div className="text-[10px] font-bold text-slate-200 font-mono">{d.percentage}%</div>
                        <div className="text-[9px] text-slate-500 font-mono">{d.count}x</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Highlight Banner */}
                {highlightedCommonPair && (
                  <div className="bg-purple-950/60 border border-purple-500/50 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-purple-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                      <span>
                        Spotlight Active: Highlighting pair <strong className="text-yellow-300 text-sm px-1.5 py-0.5 rounded bg-slate-950 border border-yellow-500/40">{highlightedCommonPair}</strong> in the backtesting table below.
                      </span>
                    </div>
                    <button
                      onClick={() => setHighlightedCommonPair(null)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      Clear Spotlight
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Backtesting Table */}
        <div className="overflow-x-auto">
          {filteredBacktestSteps.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-300">No matching historical steps found</div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No backtest dates match your current 4-house search inputs or selected date/primary set filters.
              </p>
              <button
                onClick={resetAllBacktestFilters}
                className="mt-4 px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Search & Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  {/* Multi-Select Checkbox Column Header */}
                  <th className="py-2.5 px-3 w-10 text-center">
                    <button
                      onClick={() => {
                        if (selectedBacktestDates.length === filteredBacktestSteps.length) {
                          clearAllSelectedDates();
                        } else {
                          selectAllFilteredDates();
                        }
                      }}
                      className="text-slate-400 hover:text-purple-300 transition cursor-pointer"
                      title={
                        selectedBacktestDates.length === filteredBacktestSteps.length
                          ? 'Deselect all'
                          : 'Select all filtered'
                      }
                    >
                      {selectedBacktestDates.length > 0 &&
                      selectedBacktestDates.length === filteredBacktestSteps.length ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : selectedBacktestDates.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-purple-400/60" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleSort('date')}
                      className="flex items-center gap-1.5 cursor-pointer select-none group hover:text-purple-300 transition text-left"
                      title="Click to sort by Target Date (Ascending / Descending)"
                    >
                      <span className={backtestSortField === 'date' ? 'text-purple-300 font-bold' : ''}>Target Date</span>
                      {backtestSortField === 'date' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-purple-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleSort('sourceDate')}
                      className="flex items-center gap-1.5 cursor-pointer select-none group hover:text-purple-300 transition text-left"
                      title="Click to sort by Source Date (Ascending / Descending)"
                    >
                      <span className={backtestSortField === 'sourceDate' ? 'text-purple-300 font-bold' : ''}>Source (T-1) 4 Houses</span>
                      {backtestSortField === 'sourceDate' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-purple-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleSort('x')}
                      className="flex items-center gap-1.5 cursor-pointer select-none group hover:text-cyan-300 transition text-left"
                      title="Click to sort by Core X (Ascending / Descending)"
                    >
                      <span className={backtestSortField === 'x' ? 'text-cyan-300 font-bold' : ''}>Core X</span>
                      {backtestSortField === 'x' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-cyan-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleSort('primarySet')}
                      className="flex items-center gap-1.5 cursor-pointer select-none group hover:text-purple-300 transition text-left"
                      title="Click to sort by Primary Set S (Ascending / Descending)"
                    >
                      <span className={backtestSortField === 'primarySet' ? 'text-purple-300 font-bold' : ''}>Primary Set S</span>
                      {backtestSortField === 'primarySet' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-purple-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Generated 15 Pairs</th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleSort('actualDraw')}
                      className="flex items-center gap-1.5 cursor-pointer select-none group hover:text-purple-300 transition text-left"
                      title="Click to sort by Actual Draw Numbers (Ascending / Descending)"
                    >
                      <span className={backtestSortField === 'actualDraw' ? 'text-purple-300 font-bold' : ''}>Actual Draw (4 Houses)</span>
                      {backtestSortField === 'actualDraw' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-purple-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleSort('result')}
                      className="flex items-center justify-center gap-1.5 cursor-pointer select-none group hover:text-emerald-300 transition w-full"
                      title="Click to sort by Result (Hits First / Misses First)"
                    >
                      <span className={backtestSortField === 'result' ? 'text-emerald-300 font-bold' : ''}>Result</span>
                      {backtestSortField === 'result' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-emerald-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleSort('matchedPairs')}
                      className="flex items-center gap-1.5 cursor-pointer select-none group hover:text-emerald-300 transition text-left"
                      title="Click to sort by Matched Winning Pairs Count"
                    >
                      <span className={backtestSortField === 'matchedPairs' ? 'text-emerald-300 font-bold' : ''}>Matched Pairs</span>
                      {backtestSortField === 'matchedPairs' ? (
                        backtestSortDirection === 'asc' ? (
                          <span className="flex items-center text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> ASC
                          </span>
                        ) : (
                          <span className="flex items-center text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> DESC
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-emerald-400" />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedBacktestSteps.map((step) => {
                  const isSelected = selectedBacktestDates.includes(step.date);
                  const dateObj = new Date(step.date);
                  const weekday = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  const houseNames = ['DS', 'FB', 'GL', 'GZB'];
                  const houseColors = [
                    'border-blue-500/40 text-blue-300',
                    'border-amber-500/40 text-amber-300',
                    'border-purple-500/40 text-purple-300',
                    'border-cyan-500/40 text-cyan-300',
                  ];

                  return (
                    <tr
                      key={step.date}
                      className={`transition ${
                        isSelected
                          ? 'bg-purple-950/30 hover:bg-purple-950/40 border-l-2 border-l-purple-500'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => toggleSelectDate(step.date)}
                          className="text-slate-400 hover:text-purple-300 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Target Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{step.date}</div>
                        {weekday && <div className="text-[10px] text-slate-500 uppercase">{weekday}</div>}
                      </td>

                      {/* Source Date & 4 House Inputs */}
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        <div className="text-slate-400 text-[11px] mb-1">{step.sourceDate}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {step.sourceHouseOutcomes.map((num, i) => (
                            <span
                              key={`src-${i}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border ${houseColors[i] || 'border-slate-700 text-slate-300'}`}
                              title={`${houseNames[i]}: ${num}`}
                            >
                              <strong className="text-slate-500 mr-0.5">{houseNames[i]}:</strong>{num || '--'}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Core X */}
                      <td className="py-2.5 px-3 font-bold text-cyan-300">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                          {step.x}
                        </span>
                      </td>

                      {/* Primary Set S */}
                      <td className="py-2.5 px-3 text-purple-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30">
                          [{step.primarySet.join(',')}]
                        </span>
                      </td>

                      {/* Generated 15 Pairs */}
                      <td className="py-2.5 px-3 text-slate-300 min-w-[260px]">
                        <div className="flex flex-wrap gap-1 items-center">
                          {step.sirAbhishekPairs.map((pair, idx) => {
                            const isMatched = step.matchedPairs.includes(pair);
                            const isSpotlighted = highlightedCommonPair === pair;
                            const isStrictCommon = rangeCommonStats?.strict100Pairs.some(p => p.pair === pair);

                            return (
                              <span
                                key={`${pair}-${idx}`}
                                onClick={() => setHighlightedCommonPair(isSpotlighted ? null : pair)}
                                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                                  isSpotlighted
                                    ? 'bg-yellow-400 text-slate-950 font-black ring-2 ring-yellow-300 shadow-md animate-pulse'
                                    : isMatched
                                    ? 'bg-emerald-500 text-slate-950 font-black ring-1 ring-emerald-300 shadow-sm'
                                    : isStrictCommon
                                    ? 'bg-amber-950/80 border border-amber-500/60 text-amber-200 font-bold'
                                    : 'bg-slate-950/80 border border-slate-800 text-purple-200 hover:border-purple-400'
                                }`}
                                title={
                                  isMatched
                                    ? `HIT in actual draw: ${pair}`
                                    : isStrictCommon
                                    ? `100% Common Pair in Selected Range: ${pair}`
                                    : `Generated Pair: ${pair} (Click to spotlight)`
                                }
                              >
                                {pair}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actual Draw (4 Houses) */}
                      <td className="py-2.5 px-3 text-slate-300 min-w-[200px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {step.targetHouseOutcomes.map((num, i) => {
                            const isHit = step.matchedPairs.includes(num);
                            const isSpotlighted = highlightedCommonPair === num;
                            return (
                              <span
                                key={`tgt-${i}`}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                                  isSpotlighted
                                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-300 font-black shadow-md'
                                    : isHit
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
                            <Check className="w-3 h-3" /> HIT ({step.hitCount})
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
                                key={`${hitNum}-${hIdx}`}
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
          )}
        </div>
      </div>
    </div>
  );
};
