import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ArrowRight,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Target,
  Send,
  ExternalLink,
  History,
  Grid,
  Zap,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  Flame,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import { DayMarketEntry, NavigationTab } from '../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DayMarketEntry[];
  onSelectTab: (tab: NavigationTab) => void;
  onSendPairToSimulator?: (pair: string) => void;
  onOpenRestorePointModal?: () => void;
}

interface NavItemInfo {
  id: NavigationTab | 'restore-points';
  label: string;
  category: 'Predictions' | 'Theories' | 'Coverage' | 'Simulator' | 'Data';
  icon: React.ReactNode;
  badge?: string;
  description: string;
  keywords: string[];
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectTab,
  onSendPairToSimulator,
  onOpenRestorePointModal,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle global Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems: NavItemInfo[] = useMemo(
    () => [
      {
        id: 'pattern-dashboard',
        label: 'Pattern Dashboard',
        category: 'Predictions',
        icon: <Target className="w-4 h-4 text-cyan-400" />,
        badge: 'TOP 5/10',
        description: 'Multi-Engine Consensus Top 5 & Top 10 Predictions with Walk-Forward Backtesting',
        keywords: ['consensus', 'top 5', 'top 10', 'prediction', 'possibility', 'today', 'upcoming', 'backtest'],
      },
      {
        id: 'date-intelligence',
        label: 'Date Pair Intelligence',
        category: 'Predictions',
        icon: <Target className="w-4 h-4 text-emerald-400" />,
        badge: '+75%',
        description: 'Dataset Learning, Date Generator Audit, Prev-Day Adaptive Training & +75% OOS Engine',
        keywords: ['intelligence', 'learning', 'audit', 'adaptive', 'oos', 'accuracy'],
      },
      {
        id: 'beta-testing',
        label: 'Beta Testing',
        category: 'Predictions',
        icon: <Zap className="w-4 h-4 text-purple-400" />,
        badge: 'Beta',
        description: '7-Layer empirical scoring, signal lift, Markov transitions & calibrated EV',
        keywords: ['beta', 'scoring', 'markov', 'signal', 'transition', 'layers'],
      },
      {
        id: 'sir-abhishek-theory',
        label: 'Sir Abhishek Theory',
        category: 'Theories',
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
        badge: '15 Pairs',
        description: 'Four-House Single-Digit Convergence & 15-Pair Vertical Expansion Theorem',
        keywords: ['abhishek', '15 pairs', 'set s', 'vertical', 'delta', 'faridabad', 'convergence'],
      },
      {
        id: 'sir-theory-pattern',
        label: 'Sir Theory Pattern',
        category: 'Theories',
        icon: <Layers className="w-4 h-4 text-violet-400" />,
        badge: '562/746 Hits',
        description: 'Historical Pattern Engine across 562 hits: Primary Set S, 15 Pairs, Non-Hits & 00-99 Coverage',
        keywords: ['pattern', 'slots', 'primary set', 'non-hit', 'monthly coverage', 'hits browser'],
      },
      {
        id: 'previous-day-repeated',
        label: 'Previous Day Method',
        category: 'Theories',
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        badge: 'Method 2',
        description: 'Independent single-digit frequency peak assessment (X-digit expansion)',
        keywords: ['previous day', 'repeated', 'method 2', 'peak', 'expansion', 'x digit'],
      },
      {
        id: 'generator',
        label: 'Date Generator',
        category: 'Theories',
        icon: <Calendar className="w-4 h-4 text-slate-300" />,
        badge: '12 Pairs',
        description: 'Generate 12 deterministic pairs for any date using permutation triad arithmetic',
        keywords: ['date', 'generator', '12 pairs', 'calendar', 'deterministic', 'triad'],
      },
      {
        id: 'relation-hot-numbers',
        label: 'Hot Numbers & Relation',
        category: 'Theories',
        icon: <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />,
        badge: 'HOT',
        description: 'Cross-method intersection, core digits and historical digit pairings',
        keywords: ['hot', 'relation', 'intersection', 'cross method', 'pairing'],
      },
      {
        id: 'arithmetic-pattern-engine',
        label: 'Arithmetic Pattern Engine',
        category: 'Theories',
        icon: <Calculator className="w-4 h-4 text-indigo-400" />,
        badge: 'Ranked',
        description: 'Actual outcomes arithmetic decomposition & walk-forward precision evaluation',
        keywords: ['arithmetic', 'decomposition', 'walk forward', 'eval', 'ranking'],
      },
      {
        id: 'heatmap',
        label: '10×10 Universe Heatmap',
        category: 'Coverage',
        icon: <Grid className="w-4 h-4 text-slate-300" />,
        badge: '00-99',
        description: 'Complete 00-99 universe frequency distribution matrix across 4 houses',
        keywords: ['heatmap', 'matrix', '10x10', '00-99', 'frequency', 'distribution'],
      },
      {
        id: 'previous-date',
        label: 'Repeat Analyzer',
        category: 'Coverage',
        icon: <History className="w-4 h-4 text-slate-300" />,
        description: 'Multi-day histogram & repeated digit analysis across previous draw sequences',
        keywords: ['repeat', 'analyzer', 'histogram', 'historical', 'sequence'],
      },
      {
        id: 'risk-simulator',
        label: 'Risk & EV Simulator',
        category: 'Simulator',
        icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        badge: 'EV Math',
        description: 'Mathematical expected value, break-even threshold and financial exposure modeling',
        keywords: ['risk', 'simulator', 'ev', 'expected value', 'exposure', 'stake', 'payout', 'odds'],
      },
      {
        id: 'daily-data',
        label: 'Daily Draw Data',
        category: 'Data',
        icon: <FileSpreadsheet className="w-4 h-4 text-slate-300" />,
        badge: `${records.length} Records`,
        description: 'Manual 4-market draw entry (Deshawar, Faridabad, Gali, Ghaziabad) & verification',
        keywords: ['daily', 'data', 'entry', 'market', 'record', 'faridabad', 'deshawar', 'gali', 'ghaziabad'],
      },
      {
        id: 'scraper-import',
        label: 'Import / Backup',
        category: 'Data',
        icon: <ExternalLink className="w-4 h-4 text-slate-300" />,
        description: 'Synthetic generator, CSV/JSON data backup, seed restore & batch import',
        keywords: ['import', 'scraper', 'backup', 'restore', 'csv', 'json', 'export'],
      },
      {
        id: 'restore-points',
        label: 'Safe Restore Points Manager',
        category: 'Data',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        badge: 'SAFE RESTORE',
        description: 'Save settings, parameters, calculations & records as safe checkpoints or rollback',
        keywords: ['restore', 'point', 'backup', 'snapshot', 'rollback', 'save', 'checkpoint', 'settings', 'parameters', 'calculations'],
      },
      {
        id: 'history',
        label: 'History Archive',
        category: 'Data',
        icon: <History className="w-4 h-4 text-slate-300" />,
        description: 'Searchable database of recorded market outcomes and historical verification',
        keywords: ['history', 'archive', 'records', 'database', 'search'],
      },
      {
        id: 'mathematics',
        label: 'Mathematics & Guide',
        category: 'Data',
        icon: <BookOpen className="w-4 h-4 text-slate-300" />,
        description: 'Combinatorics, permutations, probability laws & Gambler’s Fallacy guide',
        keywords: ['mathematics', 'math', 'guide', 'combinatorics', 'probability', 'fallacy', 'formulas'],
      },
      {
        id: 'unit-tests',
        label: 'Automated Unit Tests',
        category: 'Data',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        description: 'Automated verification test runner confirming mathematical determinism',
        keywords: ['tests', 'unit tests', 'verification', 'runner', 'integrity'],
      },
    ],
    [records.length]
  );

  // Check if query is a 2-digit number (e.g. "58", "07", "3")
  const isNumberQuery = useMemo(() => {
    const trimmed = query.trim();
    return /^\d{1,2}$/.test(trimmed);
  }, [query]);

  const targetNumber = useMemo(() => {
    if (!isNumberQuery) return null;
    const trimmed = query.trim();
    return trimmed.length === 1 ? `0${trimmed}` : trimmed;
  }, [isNumberQuery, query]);

  // If a number query is typed, compute historical appearances for that number
  const numberStats = useMemo(() => {
    if (!targetNumber) return null;

    let totalHits = 0;
    let dsHits = 0;
    let fbHits = 0;
    let glHits = 0;
    let gbHits = 0;
    const dates: string[] = [];

    records.forEach((r) => {
      let matchedInRecord = false;
      if (r.deshawar === targetNumber) {
        dsHits += 1;
        matchedInRecord = true;
      }
      if (r.faridabad === targetNumber) {
        fbHits += 1;
        matchedInRecord = true;
      }
      if (r.gali === targetNumber) {
        glHits += 1;
        matchedInRecord = true;
      }
      if (r.ghaziabad === targetNumber || r.gzb === targetNumber) {
        gbHits += 1;
        matchedInRecord = true;
      }
      if (matchedInRecord) {
        totalHits += 1;
        dates.push(r.date);
      }
    });

    const tens = parseInt(targetNumber[0], 10);
    const ones = parseInt(targetNumber[1], 10);
    const reverseNumber = `${ones}${tens}`;

    return {
      number: targetNumber,
      reverseNumber,
      totalHits,
      dsHits,
      fbHits,
      glHits,
      gbHits,
      lastDate: dates.length > 0 ? dates[0] : null,
      appearanceRate: records.length > 0 ? ((totalHits / records.length) * 100).toFixed(1) : '0.0',
    };
  }, [targetNumber, records]);

  // Filter nav items based on text query
  const filteredNavItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return navItems;

    return navItems.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.description.toLowerCase().includes(q)) return true;
      if (item.category.toLowerCase().includes(q)) return true;
      return item.keywords.some((kw) => kw.toLowerCase().includes(q));
    });
  }, [query, navItems]);

  if (!isOpen) return null;

  return (
    <div
      id="quick-search-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quick-search-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any 2-digit number (e.g. 58) or jump to any module (e.g. backtest, delta)..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-slate-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 transition"
          >
            ESC
          </button>
        </div>

        {/* Modal Body / Results */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* NUMBER INSPECTOR QUICK CARD (If 2-digit number entered) */}
          {numberStats && (
            <div className="bg-gradient-to-r from-cyan-950/50 via-slate-950 to-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-3xl font-black text-cyan-300 bg-slate-900 px-3 py-1 rounded-lg border border-cyan-500/30">
                    {numberStats.number}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Pair Quick Inspector &bull; Reverse: <span className="font-mono text-cyan-400">{numberStats.reverseNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Historical Draws Recorded: <strong className="text-emerald-400">{numberStats.totalHits} times</strong> ({numberStats.appearanceRate}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSendPairToSimulator && (
                    <button
                      type="button"
                      onClick={() => {
                        onSendPairToSimulator(numberStats.number);
                        onClose();
                      }}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Simulate</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('heatmap');
                      onClose();
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Matrix</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 4 Houses Distribution breakdown */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-xs">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">DS</span>
                  <strong className="text-slate-200">{numberStats.dsHits}</strong>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">FB</span>
                  <strong className="text-slate-200">{numberStats.fbHits}</strong>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">GL</span>
                  <strong className="text-slate-200">{numberStats.glHits}</strong>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">GB</span>
                  <strong className="text-slate-200">{numberStats.gbHits}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Nav Items List Grouped by Stage */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider px-1">
              Analytical Modules ({filteredNavItems.length})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'restore-points') {
                      onOpenRestorePointModal?.();
                    } else {
                      onSelectTab(item.id as NavigationTab);
                    }
                    onClose();
                  }}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700 text-left transition group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-bold bg-slate-800 text-cyan-400 px-1.5 py-0.2 rounded border border-slate-700 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Tip: Press <strong>Ctrl+K</strong> or <strong>/</strong> anytime to open quick search</span>
          <span className="hidden sm:inline">5-Stage Workflow Engine</span>
        </div>
      </div>
    </div>
  );
};
