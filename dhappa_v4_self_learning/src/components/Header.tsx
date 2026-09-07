import React, { useRef, useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Layers,
  Flame,
  Calculator,
  Zap,
  TrendingUp,
  Grid,
  History as HistoryIcon,
  BookOpen,
  Download,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Target,
  LayoutDashboard,
  Search,
  ExternalLink,
  Boxes,
  Activity,
  BrainCircuit,
} from 'lucide-react';
import { CurrencyCode, CURRENCIES, NavigationTab, DayMarketEntry } from '../types';
import { QuickSearchModal } from './QuickSearchModal';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  recordsCount?: number;
  records?: DayMarketEntry[];
  onSendSinglePairToSimulator?: (pair: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenRestorePointModal?: () => void;
}

export type NavigationCategory =
  | 'predictions'
  | 'theories'
  | 'coverage'
  | 'simulator'
  | 'data';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  category: NavigationCategory;
  icon: React.ReactNode;
  badge?: string | number;
  description: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  recordsCount = 0,
  records = [],
  onSendSinglePairToSimulator,
  selectedDate,
  onDateChange,
  onOpenRestorePointModal,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const navItems: NavItemConfig[] = [
    // 1. Predictions & Consensus
    {
      id: 'daily-generator',
      label: 'Daily Generator',
      category: 'predictions',
      icon: <Target className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: 'MAIN',
      description: 'Zero-lookahead daily generator, Jodi DNA, and 00-99 House ranking',
    },
    {
      id: 'self-learning-v4',
      label: 'V4 Self-Learning Lab',
      category: 'predictions',
      icon: <BrainCircuit className="w-4 h-4 shrink-0 text-cyan-300" />,
      badge: 'NEW',
      description: 'Champion–challenger market-specific learning with protected holdout validation and automatic rejection of weak models',
    },
    {
      id: 'engine-performance-log',
      label: 'Daily Performance Log',
      category: 'predictions',
      icon: <Activity className="w-4 h-4 shrink-0 text-indigo-400" />,
      badge: 'LOG & ML',
      description: 'Daily performance log for every engine & ML model, exact hit conditions, synergy matrix, & self-refinement',
    },
    {
      id: 'consensus-roadmap',
      label: '36-Pool Consensus Roadmap',
      category: 'predictions',
      icon: <Layers className="w-4 h-4 shrink-0 text-cyan-400" />,
      badge: 'ROADMAP & ML',
      description: 'System Assessment, Signal vs Noise Audit, Engine Ablation, Monte Carlo Permutation Null Check & 36-Pool Optimizer',
    },
    {
      id: 'pattern-dashboard',
      label: 'Pattern Dashboard Engine',
      category: 'predictions',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0 text-cyan-400" />,
      badge: 'MASTER ENGINE',
      description: 'Unified Multi-Method Consensus Engine: Complete 36 Candidate Pool, Top 5/10/21 Ranking, Walk-Forward Validation & Replay',
    },
    {
      id: 'rules-vault',
      label: 'Saved & Secured Rules Vault',
      category: 'predictions',
      icon: <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: 'VAULT',
      description: 'Codified Rule Engine Storage, AES Backup, Write Safeguards & Security PIN Protection',
    },
    {
      id: 'precision-intelligence',
      label: 'Precision Intelligence',
      category: 'predictions',
      icon: <Target className="w-4 h-4 shrink-0 text-violet-400" />,
      badge: 'PIPELINE',
      description: 'Structured data → feature engineering → independent engines → consensus → ranking → validation',
    },
    {
      id: 'quant-research',
      label: 'Quantitative Research Suite',
      category: 'predictions',
      icon: <Layers className="w-4 h-4 shrink-0 text-indigo-400" />,
      badge: 'PROD',
      description: 'Zero-lookahead prediction-validation, Monte Carlo null significance, and Platt probability calibration.',
    },
    {
      id: 'rational-ml-audit',
      label: 'Rational ML Audit',
      category: 'predictions',
      icon: <Activity className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: 'V3 OOS',
      description: 'Strict zero-lookahead walk-forward ML validation against random baselines and significance tests.',
    },
    {
      id: 'date-intelligence',
      label: 'Date Pair Intelligence',
      category: 'predictions',
      icon: <Target className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: '+75%',
      description: 'Dataset Learning, Date Generator Audit, Prev-Day Adaptive Training & +75% OOS Engine',
    },
    {
      id: 'beta-testing',
      label: 'Beta Testing',
      category: 'predictions',
      icon: <Zap className="w-4 h-4 shrink-0 text-purple-400" />,
      badge: 'Beta',
      description: '7-Layer empirical scoring, signal lift, Markov transitions & calibrated EV',
    },

    // 2. Theories & Pattern Engines
    {
      id: 'belgium-square-matrix',
      label: 'Belgium Square Matrix',
      category: 'theories',
      icon: <Boxes className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: 'Common Digit',
      description: 'Historical Pattern Detection + Common-Digit Extraction + Square Matrix + ML Ranking',
    },
    {
      id: 'g-square-method',
      label: 'G Square Method',
      category: 'theories',
      icon: <Calculator className="w-4 h-4 shrink-0 text-indigo-400" />,
      badge: '6×4 ML',
      description: 'Deterministic 6 Vertical × 4 Horizontal Matrix & ML Walk-Forward Prediction Engine',
    },
    {
      id: 'g-square-harmonics',
      label: 'G Square Harmonics',
      category: 'theories',
      icon: <Grid className="w-4 h-4 shrink-0 text-violet-400" />,
      badge: 'Walk-Forward',
      description: 'Formal 6×4 harmonic grid derived from ones-digit Gali/Ghaziabad base values and walk-forward empirical testing',
    },
    {
      id: 'sir-abhishek-theory',
      label: 'Sir Abhishek Theory',
      category: 'theories',
      icon: <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />,
      badge: 'Method 3',
      description: 'Four-House Single-Digit Convergence & 15-Pair Vertical Expansion Theorem',
    },
    {
      id: 'sir-theory-pattern',
      label: 'Sir Theory Pattern',
      category: 'theories',
      icon: <Layers className="w-4 h-4 shrink-0 text-violet-400" />,
      badge: '562 Hits',
      description: 'Deep Historical Pattern Engine across 562 hits: Primary Set S, 15 Pairs, Non-Hits & 00-99 Coverage',
    },
    {
      id: 'previous-day-repeated',
      label: 'Previous Day Method',
      category: 'theories',
      icon: <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: 'Method 2',
      description: 'Independent single-digit frequency peak assessment (X-digit expansion)',
    },
    {
      id: 'generator',
      label: 'Date Generator',
      category: 'theories',
      icon: <Calendar className="w-4 h-4 shrink-0 text-slate-300" />,
      badge: '12 Pairs',
      description: 'Generate 12 deterministic pairs for any date via calendar triad arithmetic',
    },
    {
      id: 'relation-hot-numbers',
      label: 'Hot Numbers & Relation',
      category: 'theories',
      icon: <Flame className="w-4 h-4 shrink-0 text-amber-400 fill-amber-400" />,
      badge: 'HOT',
      description: 'Cross-method intersection, core digits & historical digit pairings',
    },
    {
      id: 'arithmetic-pattern-engine',
      label: 'Arithmetic Pattern Engine',
      category: 'theories',
      icon: <Calculator className="w-4 h-4 shrink-0 text-indigo-400" />,
      badge: 'Ranked',
      description: 'Actual outcomes arithmetic decomposition & walk-forward precision evaluation',
    },
    {
      id: 'rashi-intelligence',
      label: 'Rashi Intelligence',
      category: 'theories',
      icon: <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />,
      badge: 'Complement',
      description: 'Vedic 5-decade complement correlation & complementary digit transition tracking',
    },
    {
      id: 'doubles-lab',
      label: 'Doubles Lab',
      category: 'theories',
      icon: <Layers className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: '00–99',
      description: 'Specialized frequency, skip, Haruf, Markov, Rashi & Core-X compatibility for all double numbers',
    },
    {
      id: 'briquette-engine',
      label: 'Briquette & ML Rules Engine',
      category: 'theories',
      icon: <Boxes className="w-4 h-4 shrink-0 text-indigo-400" />,
      badge: 'NEW',
      description: 'Core-Derivative-Rashi-Complement transformation matrices, interactive GBDT rule extraction, & adaptive consensus lab',
    },

    // 3. Coverage & Matrix Analytics
    {
      id: 'heatmap',
      label: '10×10 Universe Matrix',
      category: 'coverage',
      icon: <Grid className="w-4 h-4 shrink-0 text-cyan-400" />,
      badge: 'Walk-Forward',
      description: 'Historical 00–99 frequency matrix & sequential Walk-Forward Backtesting table',
    },
    {
      id: 'monthly-coverage',
      label: '00–99 Coverage Ledger',
      category: 'coverage',
      icon: <Layers className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: 'Ledger',
      description: 'Monthly 00–99 universe coverage, decile ranges, and due-number empirical audits',
    },
    {
      id: 'previous-date',
      label: 'Repeat Analyzer',
      category: 'coverage',
      icon: <CalendarDays className="w-4 h-4 shrink-0 text-slate-300" />,
      description: 'Multi-day histogram & repeated digit analysis across previous draw sequences',
    },

    // 4. Risk Simulator
    {
      id: 'risk-simulator',
      label: 'Quant Risk Strategist',
      category: 'simulator',
      icon: <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: 'Roadmap',
      description: 'Expert probabilistic bankroll allocation, Flat Bet & Step-Up 1.15x Recovery Roadmaps',
    },

    // 5. Data & Settings
    {
      id: 'daily-data',
      label: 'Daily Draw Data',
      category: 'data',
      icon: <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-300" />,
      badge: recordsCount > 0 ? recordsCount : undefined,
      description: 'Manual 4-market draw entry (Deshawar, Faridabad, Gali, Ghaziabad) & verification',
    },
    {
      id: 'scraper-import',
      label: 'Import / Backup',
      category: 'data',
      icon: <Download className="w-4 h-4 shrink-0 text-slate-300" />,
      description: 'Synthetic generator, CSV/JSON backup & restore',
    },
    {
      id: 'history',
      label: 'History Archive',
      category: 'data',
      icon: <HistoryIcon className="w-4 h-4 shrink-0 text-slate-300" />,
      description: 'Searchable database of recorded market outcomes',
    },
    {
      id: 'mathematics',
      label: 'Mathematics & Guide',
      category: 'data',
      icon: <BookOpen className="w-4 h-4 shrink-0 text-slate-300" />,
      description: 'Combinatorics, permutations & Gambler’s Fallacy guide',
    },
    {
      id: 'unit-tests',
      label: 'Unit Tests',
      category: 'data',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />,
      description: 'Automated test suite verifying algorithmic rules & determinism',
    },
  ];

  // Active Category detection based on activeTab
  const currentCategory: NavigationCategory =
    navItems.find((n) => n.id === activeTab)?.category || 'predictions';

  const categoryLabels: Record<
    NavigationCategory,
    { label: string; icon: string; desc: string; defaultTab: NavigationTab }
  > = {
    predictions: {
      label: 'Predictions & Consensus',
      icon: '🎯',
      desc: 'Top 5/10 Rankings & Multi-Engine Consensus',
      defaultTab: 'daily-generator',
    },
    theories: {
      label: 'Theory & Pattern Engines',
      icon: '🔬',
      desc: 'Sir Abhishek 15-Pairs, Previous-Day, Date Generator & Arithmetic',
      defaultTab: 'sir-abhishek-theory',
    },
    coverage: {
      label: 'Coverage & Universe Matrix',
      icon: '📊',
      desc: '00-99 Universe Heatmap & Repeat Frequency',
      defaultTab: 'heatmap',
    },
    simulator: {
      label: 'Risk & EV Simulator',
      icon: '🎲',
      desc: 'Expected Value & Financial Exposure Modeling',
      defaultTab: 'risk-simulator',
    },
    data: {
      label: 'Data & Settings',
      icon: '💾',
      desc: 'Daily 4-House Entry, History Archive & Tests',
      defaultTab: 'daily-data',
    },
  };

  // Keyboard shortcut Ctrl+K or / for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  const handleSelectTab = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Top Bar: Brand, Category Selector, Quick Search, Currency */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Left: Mobile Toggle & Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                onClick={() => handleSelectTab('pattern-dashboard')}
                className="bg-gradient-to-br from-emerald-500 to-cyan-500 w-8 h-8 rounded-lg flex items-center justify-center text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer hover:opacity-90 transition"
                title="Go to Pattern Dashboard"
              >
                <Target className="w-4 h-4 text-slate-950" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => handleSelectTab('pattern-dashboard')}
                    className="text-base sm:text-lg font-bold text-slate-100 tracking-tight cursor-pointer hover:text-emerald-400 transition"
                  >
                    DatePair <span className="text-emerald-400 font-extrabold">Simulator</span>
                  </span>
                  <span
                    onClick={() => handleSelectTab('scraper-import')}
                    className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition shadow-sm"
                    title="Version 4.0 Active - Click for Backup & Data Management"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>v4.0 ML</span>
                  </span>
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Lock className="w-2.5 h-2.5" /> AES-GCM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Analytical Combinatorics, Consensus Modeling & Risk Exposure Engine
                </p>
              </div>
            </div>

            {/* Right: Quick Search Button & Currency Switcher */}
            <div className="flex items-center gap-2.5">
              {/* Universal Date Selector (Common Date Change Across All) */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 select-none">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-slate-400 font-bold uppercase hidden xl:inline">Active Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-slate-100 text-xs font-mono font-bold focus:outline-none w-28 sm:w-30 cursor-pointer text-center"
                  title="Universal Active Date: Changes selected analytical day across all tabs"
                />
              </div>

              {/* Safe Restore Point Action Button */}
              {onOpenRestorePointModal && (
                <button
                  id="btn-safe-restore-point"
                  type="button"
                  onClick={onOpenRestorePointModal}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400 transition cursor-pointer text-xs font-bold shadow-sm"
                  title="Save settings, parameters, calculations & records as safe restore point or rollback"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Restore Point</span>
                </button>
              )}

              {/* Quick Search Button (Cmd+K / Number Lookup) */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition cursor-pointer text-xs font-medium"
                title="Search any 2-digit number (00-99) or jump to any module (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline text-slate-400">Search / Pair Lookup</span>
                <span className="hidden md:inline-flex items-center text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                  Ctrl+K
                </span>
              </button>

              {/* Currency Switcher */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    id={`btn-currency-${c}`}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-2 sm:px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      currency === c
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={CURRENCIES[c].name}
                  >
                    {CURRENCIES[c].symbol} <span className="hidden sm:inline">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow Pillar Stage Navigation Bar (Desktop) */}
          <div className="hidden lg:flex items-center justify-between border-t border-slate-800/80 pt-1.5 pb-1 gap-2">
            {/* 5 Stage Workflow Pillar Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              {(Object.keys(categoryLabels) as NavigationCategory[]).map((catKey) => {
                const isCatActive = currentCategory === catKey;
                const cat = categoryLabels[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleSelectTab(cat.defaultTab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                      isCatActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Context Tracker */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-cyan-400 font-semibold">
                {categoryLabels[currentCategory].label}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-400">
                {recordsCount} Historical Records
              </span>
            </div>
          </div>

          {/* Sub-Navigation Tabs Bar (Scrollable with Arrow Controls) */}
          <div className="relative border-t border-slate-800/60 py-1.5 hidden lg:block">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-r-lg bg-slate-900/95 border border-l-0 border-slate-700 text-slate-300 hover:text-white shadow-lg cursor-pointer"
                aria-label="Scroll navigation left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <nav
              ref={scrollContainerRef}
              onScroll={checkScrollability}
              aria-label="Module Navigation"
              className="flex space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const isSameCategory = item.category === currentCategory;

                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer select-none ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : isSameCategory
                        ? 'text-slate-200 hover:bg-slate-900 border border-slate-800/80'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isActive
                            ? 'bg-slate-950 text-emerald-400 font-bold'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-l-lg bg-slate-900/95 border border-r-0 border-slate-700 text-slate-300 hover:text-white shadow-lg cursor-pointer"
                aria-label="Scroll navigation right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Quick Swipeable Tabs Bar (< lg screens) */}
          <div className="lg:hidden border-t border-slate-800/60 py-2">
            <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-mobile-${item.id}`}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                          isActive
                            ? 'bg-slate-950 text-emerald-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Grouped Drawer Menu (< lg screens) */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-4 max-h-[75vh] overflow-y-auto animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Analytical Navigation Hub
                </span>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="text-xs text-cyan-400 font-mono flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"
                >
                  <Search className="w-3 h-3" /> Quick Lookup
                </button>
              </div>

              {/* Grouped by 5 Stages */}
              {(Object.keys(categoryLabels) as NavigationCategory[]).map((catKey) => {
                const cat = categoryLabels[catKey];
                const catItems = navItems.filter((n) => n.category === catKey);

                return (
                  <div key={catKey} className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectTab(item.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isActive
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-100 truncate">
                                  {item.label}
                                </span>
                                {item.badge !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-emerald-400 font-mono shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Global Quick Search & Number Inspector Modal */}
      <QuickSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        records={records}
        onSelectTab={handleSelectTab}
        onSendPairToSimulator={onSendSinglePairToSimulator}
        onOpenRestorePointModal={onOpenRestorePointModal}
      />
    </>
  );
};
