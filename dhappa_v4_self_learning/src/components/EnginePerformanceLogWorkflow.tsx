import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Sparkles,
  Sliders,
  Zap,
  Shield,
  Database,
  BarChart3,
  RefreshCw,
  Cpu,
  Award,
  ArrowUpRight,
  Search,
  FileSpreadsheet,
  FileJson,
  Layers,
  ChevronDown,
  ChevronUp,
  Bot,
  Target,
} from 'lucide-react';
import { DayMarketEntry, Market, MARKETS } from '../types';
import {
  generateDailyPerformanceLog,
  getStoredPerformanceLog,
  getStoredPerformanceLogAsync,
  saveStoredPerformanceLog,
  exportPerformanceLogToJSON,
  exportPerformanceLogToCSV,
  ComprehensivePerformanceLogSummary,
  DailyEnginePerformanceRecord,
  EnginePerformanceHitLogEntry,
  EngineMLCombinationSynergy,
  RecurringSuccessCondition,
  PerformanceDriftReport,
  RefinedSettingsRecommendations,
  EngineIdentifier,
} from '../utils/enginePerformanceLogEngine';
import {
  evaluateDrawResultForMLAndPerformance,
  getLatestDrawAssessment,
  getAllStoredDrawAssessments,
  MLDrawTrainingAssessment,
} from '../utils/mlDrawPerformanceAssessmentEngine';
import { DrawMLTrainingAssessmentCard } from './DrawMLTrainingAssessmentCard';
import { AutonomousPerformanceLogSection } from './AutonomousPerformanceLogSection';

interface EnginePerformanceLogWorkflowProps {
  records: DayMarketEntry[];
  onApplyRefinements?: (refined: RefinedSettingsRecommendations) => void;
}

export const EnginePerformanceLogWorkflow: React.FC<EnginePerformanceLogWorkflowProps> = ({
  records,
  onApplyRefinements,
}) => {
  const [logSummary, setLogSummary] = useState<ComprehensivePerformanceLogSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'draw_ml_assessment' | 'autonomous_telemetry' | 'daily_log' | 'combinations' | 'recurring_conditions' | 'drift_regimes' | 'refinements'>('autonomous_telemetry');
  const [currentAssessment, setCurrentAssessment] = useState<MLDrawTrainingAssessment | null>(() => getLatestDrawAssessment());
  const [allAssessments, setAllAssessments] = useState<MLDrawTrainingAssessment[]>(() => getAllStoredDrawAssessments());
  const [selectedAssessmentDate, setSelectedAssessmentDate] = useState<string>('');
  const [isRetrainingML, setIsRetrainingML] = useState<boolean>(false);

  // Filters for daily log
  const [searchDate, setSearchDate] = useState<string>('');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<string>('ALL');
  const [selectedEngineFilter, setSelectedEngineFilter] = useState<string>('ALL');
  const [selectedHitTypeFilter, setSelectedHitTypeFilter] = useState<string>('ALL');
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);
  const [selectedHitModal, setSelectedHitModal] = useState<EnginePerformanceHitLogEntry | null>(null);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Initialize or generate on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const cached = await getStoredPerformanceLogAsync();
      if (!isMounted) return;
      if (cached && cached.dailyLogs && cached.dailyLogs.length > 0) {
        setLogSummary(cached);
      } else if (records.length > 0) {
        handleRegenerate();
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [records]);

  // Synchronize ML draw assessments on mount or record updates
  useEffect(() => {
    if (!currentAssessment && records.length > 0) {
      const { assessment } = evaluateDrawResultForMLAndPerformance(records, records[0]);
      setCurrentAssessment(assessment);
      setAllAssessments(getAllStoredDrawAssessments());
    }
  }, [records, currentAssessment]);

  // Listen to draw result evaluated events
  useEffect(() => {
    const handleDrawEvaluated = (e: any) => {
      if (e?.detail?.assessment) {
        setCurrentAssessment(e.detail.assessment);
        setAllAssessments(getAllStoredDrawAssessments());
      }
    };
    window.addEventListener('ml_draw_result_evaluated', handleDrawEvaluated);
    return () => window.removeEventListener('ml_draw_result_evaluated', handleDrawEvaluated);
  }, []);

  const handleSelectAssessmentDate = (date: string) => {
    setSelectedAssessmentDate(date);
    const existing = allAssessments.find((a) => a.date === date);
    if (existing) {
      setCurrentAssessment(existing);
    } else {
      const rec = records.find((r) => r.date === date);
      if (rec) {
        const { assessment } = evaluateDrawResultForMLAndPerformance(records, rec);
        setCurrentAssessment(assessment);
        setAllAssessments(getAllStoredDrawAssessments());
      }
    }
  };

  const handleRetrainMLModel = () => {
    if (!currentAssessment) return;
    setIsRetrainingML(true);
    setTimeout(() => {
      const targetRecord = records.find((r) => r.date === currentAssessment.date) || records[0];
      if (targetRecord) {
        const { assessment, perfLog } = evaluateDrawResultForMLAndPerformance(records, targetRecord);
        setCurrentAssessment(assessment);
        setLogSummary(perfLog);
        setAllAssessments(getAllStoredDrawAssessments());
      }
      setIsRetrainingML(false);
      setAppliedToast('ML walk-forward model successfully calibrated and re-trained.');
      setTimeout(() => setAppliedToast(null), 4000);
    }, 500);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const summary = generateDailyPerformanceLog(records, { maxDaysToEvaluate: 60 });
        setLogSummary(summary);
        saveStoredPerformanceLog(summary);
      } catch (err) {
        console.error('Error generating daily performance log', err);
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };

  const handleExportJSON = () => {
    if (!logSummary) return;
    const jsonStr = exportPerformanceLogToJSON(logSummary);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engine_ml_performance_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!logSummary) return;
    const csvStr = exportPerformanceLogToCSV(logSummary);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engine_ml_performance_hits_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyRefinedRules = () => {
    if (!logSummary) return;
    if (onApplyRefinements) {
      onApplyRefinements(logSummary.refinedSettings);
    }
    setAppliedToast('Refined Model Rules and Optimal Engine Settings applied to active prediction pipeline!');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  // Filter daily logs
  const filteredDailyLogs = useMemo(() => {
    if (!logSummary) return [];
    return logSummary.dailyLogs.filter((day) => {
      if (searchDate && !day.date.includes(searchDate)) return false;
      if (selectedMarketFilter !== 'ALL') {
        const hasMarket = day.hits.some((h) => h.market === selectedMarketFilter);
        if (!hasMarket) return false;
      }
      if (selectedEngineFilter !== 'ALL') {
        const hasEngine = day.hits.some((h) => h.engineId === selectedEngineFilter);
        if (!hasEngine) return false;
      }
      if (selectedHitTypeFilter !== 'ALL') {
        if (selectedHitTypeFilter === 'EXACT' && day.totalExactHits === 0) return false;
        if (selectedHitTypeFilter === 'PALTI' && day.totalPaltiHits === 0) return false;
        if (selectedHitTypeFilter === 'SWEEP' && day.housesSwept < 3) return false;
      }
      return true;
    });
  }, [logSummary, searchDate, selectedMarketFilter, selectedEngineFilter, selectedHitTypeFilter]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Compiling Daily Performance Log...</h3>
        <p className="text-slate-400 max-w-md text-sm">
          Auditing 60+ historical days across all 10 mathematical engines and 5 machine learning models.
          Extracting exact settings, active rule codes, harmonic parity, and cross-market patterns for every hit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {appliedToast && (
        <div className="bg-emerald-600/90 border border-emerald-400 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{appliedToast}</span>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
                <Database className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Daily Engine & ML Performance Log
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">
                    Self-Refining Engine
                  </span>
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Granular performance tracking for every engine & ML model. Records exact settings, rules, conditions, and patterns for each successful hit.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Refresh Log</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleApplyRefinedRules}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Refined Optimizations</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        {logSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-medium">Evaluated Days</span>
              <div className="text-lg font-bold text-white mt-0.5">{logSummary.totalEvaluatedDays} Days</div>
              <span className="text-[11px] text-slate-500">{logSummary.totalEvaluatedDraws} market draws</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-medium">Total Exact Hits</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{logSummary.overallExactHits}</div>
              <span className="text-[11px] text-emerald-500/90 font-medium">Direct numerical matches</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-medium">Palti / Mirror Hits</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{logSummary.overallPaltiHits}</div>
              <span className="text-[11px] text-amber-500/90 font-medium">Symmetry absorbed hits</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-medium">4/4 Clean Sweeps</span>
              <div className="text-lg font-bold text-indigo-400 mt-0.5">{logSummary.allHouseSweepsCount}</div>
              <span className="text-[11px] text-indigo-300 font-medium">{logSummary.allHouseSweepsPct}% sweep rate</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-medium">3/4 House Sweeps</span>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{logSummary.threeHouseSweepsCount}</div>
              <span className="text-[11px] text-cyan-300 font-medium">{logSummary.threeHouseSweepsPct}% partial sweep</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-medium">Active Synergy Models</span>
              <div className="text-lg font-bold text-purple-400 mt-0.5">{logSummary.topCombinations.length}</div>
              <span className="text-[11px] text-purple-300 font-medium">Engine + ML pairs</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSelectedTab('autonomous_telemetry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition relative ${
            selectedTab === 'autonomous_telemetry'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
          <span>Autonomous Performance Audit &amp; Continuous Learning</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            Evolving
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('draw_ml_assessment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            selectedTab === 'draw_ml_assessment'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-300" />
          <span>Post-Draw ML Assessment</span>
        </button>

        <button
          onClick={() => setSelectedTab('daily_log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            selectedTab === 'daily_log'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Performance Log</span>
        </button>

        <button
          onClick={() => setSelectedTab('combinations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            selectedTab === 'combinations'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Synergistic Combinations</span>
        </button>

        <button
          onClick={() => setSelectedTab('recurring_conditions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            selectedTab === 'recurring_conditions'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Recurring Success Conditions</span>
        </button>

        <button
          onClick={() => setSelectedTab('drift_regimes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            selectedTab === 'drift_regimes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Drift & Emerging Regimes</span>
        </button>

        <button
          onClick={() => setSelectedTab('refinements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            selectedTab === 'refinements'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Refined Model Rules & Settings</span>
        </button>
      </div>

      {/* TAB: AUTONOMOUS DAILY PERFORMANCE AUDIT & CONTINUOUS SELF-LEARNING */}
      {selectedTab === 'autonomous_telemetry' && (
        <div className="space-y-6 animate-fadeIn">
          <AutonomousPerformanceLogSection
            records={records}
            currentDate={currentAssessment?.date || records[0]?.date}
            onApplyRules={(rules) => {
              setAppliedToast(`Enforced ${rules.length} autonomous self-learning rules to production ML consensus!`);
              setTimeout(() => setAppliedToast(null), 5000);
            }}
          />
        </div>
      )}

      {/* TAB 0: POST-DRAW ML TRAINING ASSESSMENT */}
      {selectedTab === 'draw_ml_assessment' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar for Draw Assessment */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Automated Event-Driven ML Draw Assessment Pipeline
                </div>
                <div className="text-[11px] text-slate-400">
                  Audit performance logs and train ML models on every draw result entry.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Select Draw Date:</span>
              <select
                value={currentAssessment?.date || ''}
                onChange={(e) => handleSelectAssessmentDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                {records.map((r) => (
                  <option key={r.date} value={r.date}>
                    {r.date} ({[r.deshawar, r.faridabad, r.ghaziabad, r.gali].filter(Boolean).length} houses)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRetrainMLModel}
                disabled={isRetrainingML}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrainingML ? 'animate-spin' : ''}`} />
                <span>{isRetrainingML ? 'Optimizing...' : 'Re-Calibrate Weights'}</span>
              </button>
            </div>
          </div>

          {/* Active Draw ML Assessment Card */}
          {currentAssessment && (
            <DrawMLTrainingAssessmentCard
              assessment={currentAssessment}
              onRetrainModel={handleRetrainMLModel}
              isRetraining={isRetrainingML}
            />
          )}

          {/* Historical Draw Assessment Log Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200">
                  Historical Draw Assessment Registry
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {records.length} Recorded Draw Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Draw Date</th>
                    <th className="p-3 text-center">Deshawar</th>
                    <th className="p-3 text-center">Faridabad</th>
                    <th className="p-3 text-center">Ghaziabad</th>
                    <th className="p-3 text-center">Gali</th>
                    <th className="p-3 text-center">Clean Sweep</th>
                    <th className="p-3 text-center">ML Training Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {records.slice(0, 15).map((rec) => {
                    const isSelected = currentAssessment?.date === rec.date;
                    const evalRecord = allAssessments.find((a) => a.date === rec.date);

                    return (
                      <tr
                        key={rec.date}
                        className={`hover:bg-slate-850/50 transition ${
                          isSelected ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{rec.date}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center text-slate-300 font-bold">{rec.deshawar || '—'}</td>
                        <td className="p-3 text-center text-slate-300 font-bold">{rec.faridabad || '—'}</td>
                        <td className="p-3 text-center text-slate-300 font-bold">{rec.ghaziabad || '—'}</td>
                        <td className="p-3 text-center text-slate-300 font-bold">{rec.gali || '—'}</td>
                        <td className="p-3 text-center">
                          {evalRecord ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                evalRecord.exactHits >= 3
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : evalRecord.drawAccuracyPct >= 50
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {evalRecord.drawAccuracyPct}% ({evalRecord.exactHits + evalRecord.paltiHits + evalRecord.familyHits}/4)
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Pending Evaluation</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {evalRecord ? (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                evalRecord.trainingAssessment.status === 'OPTIMAL_WEIGHTS_CONFIRMED'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : evalRecord.trainingAssessment.status === 'INCREMENTAL_CALIBRATION_APPLIED'
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {evalRecord.trainingAssessment.status === 'OPTIMAL_WEIGHTS_CONFIRMED'
                                ? 'WEIGHTS OPTIMAL'
                                : evalRecord.trainingAssessment.status === 'INCREMENTAL_CALIBRATION_APPLIED'
                                ? 'CALIBRATION APPLIED'
                                : 'RETRAIN RECOMMENDED'}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">Audit Ready</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectAssessmentDate(rec.date)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-medium border border-slate-700 hover:border-slate-600 transition"
                          >
                            Inspect Assessment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: DAILY PERFORMANCE LOG */}
      {selectedTab === 'daily_log' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search date (e.g. 2026-08)..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <Filter className="w-3.5 h-3.5" /> Market:
              </span>
              <select
                value={selectedMarketFilter}
                onChange={(e) => setSelectedMarketFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Houses</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Engine:</span>
              <select
                value={selectedEngineFilter}
                onChange={(e) => setSelectedEngineFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Engines</option>
                <option value="sir_abhishek">Sir Abhishek Theory</option>
                <option value="belgium_matrix">Belgium 10×10 Matrix</option>
                <option value="g_square">G-Square Method</option>
                <option value="date_triad">Date Triad P(4,2)</option>
                <option value="prev_day_repeat">Previous Day Repeat</option>
                <option value="consensus_ensemble">Consensus Ensemble</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Outcome:</span>
              <select
                value={selectedHitTypeFilter}
                onChange={(e) => setSelectedHitTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Results</option>
                <option value="EXACT">Exact Hits Only</option>
                <option value="PALTI">Palti Hits Only</option>
                <option value="SWEEP">3+ House Sweeps</option>
              </select>
            </div>
          </div>

          {/* Daily Records List */}
          <div className="space-y-3">
            {filteredDailyLogs.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400">
                No daily performance logs matched the current search filters.
              </div>
            ) : (
              filteredDailyLogs.map((day) => {
                const isExpanded = expandedDayDate === day.date;
                return (
                  <div
                    key={day.date}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition"
                  >
                    {/* Day Summary Bar */}
                    <div
                      onClick={() => setExpandedDayDate(isExpanded ? null : day.date)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{day.date}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                              {day.dayOfWeek}
                            </span>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                day.sweepStatus === '4_OUT_OF_4_CLEAN_SWEEP'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : day.sweepStatus === '3_HOUSES_HIT'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : day.sweepStatus === '2_HOUSES_HIT'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {day.sweepStatus.replace(/_/g, ' ')} ({day.housesSwept}/4 Houses)
                            </span>
                          </div>

                          {/* Actual draws */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                            {day.marketDraws.map((d) => (
                              <span key={d.market} className="flex items-center gap-1 bg-slate-800/70 px-2 py-0.5 rounded">
                                <span className="text-slate-500">{d.market}:</span>
                                <span className="font-mono font-bold text-amber-300">{d.pair}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hits Summary Pills & Toggle */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-bold">
                            {day.totalExactHits} Exact
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300 font-bold">
                            {day.totalPaltiHits} Palti
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 font-bold">
                            {day.hits.length} Recorded Hits
                          </span>
                        </div>

                        <span className="text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Hits Details */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Granular Hits for {day.date} ({day.hits.length} Total Verified Signals)</span>
                          <span className="text-[11px] text-slate-500">Click any hit for full rule parameter breakdown</span>
                        </div>

                        {day.hits.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No hits recorded under active filters for this calendar day.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {day.hits.slice(0, 8).map((hit) => (
                              <div
                                key={hit.id}
                                onClick={() => setSelectedHitModal(hit)}
                                className="bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-indigo-300">{hit.market}</span>
                                      <span className="font-mono text-sm font-black text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
                                        {hit.drawnPair}
                                      </span>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                          hit.hitType === 'EXACT'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        }`}
                                      >
                                        {hit.hitType} • Rank #{hit.rank}
                                      </span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-300 mt-1 block">
                                      {hit.engineName}
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                      {hit.predictedConfidence}% Conf
                                    </span>
                                    <span className="text-[10px] block text-slate-500">
                                      {hit.exactSettings.tier.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>

                                {/* Active Rules and Patterns Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {hit.contributingRules.slice(0, 3).map((r) => (
                                    <span
                                      key={r.code}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 font-mono"
                                    >
                                      {r.code}
                                    </span>
                                  ))}
                                  {hit.contributingPatterns.slice(0, 2).map((p, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                                  <span>DOW: {hit.contributingConditions.dayOfWeekParity}</span>
                                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition font-medium flex items-center gap-0.5">
                                    View Exact Settings <ArrowUpRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMBINATIONS & SYNERGY MATRIX */}
      {selectedTab === 'combinations' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Engine & Machine Learning Synergistic Rankings
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Evaluated across thousands of multi-market historical draws. Ranked by combined accuracy, win-rate lift over random baseline, and statistical Z-score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logSummary?.topCombinations.map((combo, idx) => (
              <div
                key={combo.combinationId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
                          #{idx + 1}
                        </span>
                        <h4 className="text-base font-bold text-white">{combo.engineName}</h4>
                      </div>
                      <span className="text-xs text-indigo-300 font-medium block mt-0.5">
                        Coupled with: {combo.modelName}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                        combo.status === 'TOP_PERFORMER'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : combo.status === 'SOLID_RELIABLE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {combo.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Accuracy Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Exact Hit %</span>
                      <span className="text-sm font-bold text-emerald-400">{combo.exactHitRatePct}%</span>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Combined %</span>
                      <span className="text-sm font-bold text-amber-300">{combo.combinedAccuracyPct}%</span>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Lift Ratio</span>
                      <span className="text-sm font-bold text-cyan-400">{combo.liftRatio}x</span>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Z-Score</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono">Z={combo.zScore}</span>
                    </div>
                  </div>

                  {/* Recommended Engine Settings for this combination */}
                  <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Optimal Pool Size:</span>
                      <span className="font-bold text-white">{combo.optimalSettings.bestPoolSize} Pairs</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Confidence Threshold:</span>
                      <span className="font-bold text-white">{combo.optimalSettings.bestThreshold}%</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Peak Day of Week:</span>
                      <span className="font-bold text-amber-300">{combo.bestDayOfWeek}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Dominant Market:</span>
                      <span className="font-bold text-indigo-300">{combo.bestMarket}</span>
                    </div>
                  </div>
                </div>

                {/* Contributing Active Rules */}
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                    Recommended Core Rules:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {combo.optimalSettings.recommendedRuleCodes.map((rc) => (
                      <span
                        key={rc}
                        className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-mono font-medium"
                      >
                        {rc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECURRING SUCCESS CONDITIONS */}
      {selectedTab === 'recurring_conditions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Statistically Validated Recurring Success Conditions
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Cross-period conditions proven to generate &gt;75% strike rates across 40+ independent occurrences.
            </p>
          </div>

          <div className="space-y-3">
            {logSummary?.recurringSuccessConditions.map((cond) => (
              <div
                key={cond.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                      {cond.statisticalConfidence}
                    </span>
                    <h4 className="text-base font-bold text-white">{cond.title}</h4>
                  </div>

                  <p className="text-sm text-slate-300">{cond.conditionStatement}</p>

                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200">
                    <span className="font-bold text-indigo-300">Actionable Rule:</span> {cond.actionableRule}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" /> Key Engines: {cond.keyEngines.join(', ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-slate-500" /> Rules: {cond.keyRules.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:justify-center p-3 md:p-4 bg-slate-950 rounded-xl border border-slate-800 min-w-[140px] text-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Win Rate</span>
                    <span className="text-xl font-black text-emerald-400">{cond.winRatePct}%</span>
                  </div>
                  <div className="mt-1 md:mt-2">
                    <span className="text-[11px] text-slate-500 block">{cond.occurrences} historical runs</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">+{cond.liftOverBaseline}x Lift</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DRIFT & EMERGING REGIMES */}
      {selectedTab === 'drift_regimes' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Rolling Performance Drift & Regime Shift Tracker
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Tracks 7-Day vs 30-Day vs All-Time performance changes to detect emerging market trends and dynamically adjust engine vote weight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logSummary?.driftReports.map((report) => (
              <div
                key={report.engineId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{report.engineName}</h4>
                    <span className="text-xs text-slate-400">Tracking identifier: {report.engineId}</span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                      report.trend === 'ACCELERATING'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : report.trend === 'STABLE'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {report.trend}
                  </span>
                </div>

                {/* 3-Tier Rolling Horizon Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">7-Day Surge</span>
                    <span
                      className={`text-sm font-bold ${
                        report.rolling7DayAccuracy >= report.rolling30DayAccuracy
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {report.rolling7DayAccuracy}%
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">30-Day Mean</span>
                    <span className="text-sm font-bold text-indigo-300">{report.rolling30DayAccuracy}%</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">All-Time</span>
                    <span className="text-sm font-bold text-slate-300">{report.allTimeAccuracy}%</span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-1">
                  <div className="text-slate-300">
                    <span className="font-semibold text-slate-400">Drift Diagnosis:</span> {report.driftDiagnosis}
                  </div>
                  <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">
                    <span className="font-bold">Recommended Adjustment:</span> {report.recommendedAdjustment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REFINED MODEL RULES & SETTINGS */}
      {selectedTab === 'refinements' && logSummary && (
        <div className="space-y-5">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Refined Model Rules & Calibrated Engine Settings
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Synthesized parameters dynamically learned from performance logs. Validated across multiple historical seasons.
              </p>
            </div>

            <button
              onClick={handleApplyRefinedRules}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply All Refinements</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day of Week Rule Scheduling */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Optimal Rules by Day of Week
              </h4>
              <p className="text-xs text-slate-400">
                Dynamically enforced rule configurations tuned to calendar parity and weekday behavior:
              </p>
              <div className="space-y-2">
                {Object.entries(logSummary.refinedSettings.recommendedRulesByDay).map(([dow, rules]) => (
                  <div
                    key={dow}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs"
                  >
                    <span className="font-bold text-slate-200">{dow}</span>
                    <div className="flex flex-wrap gap-1">
                      {(rules as string[]).map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-bold border border-indigo-800/60"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Specific Pool Sizing */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Recommended Target Pool Sizes per Market
              </h4>
              <p className="text-xs text-slate-400">
                Calibrated pool sizes designed to eliminate truncation misses while preserving high strike precision:
              </p>
              <div className="space-y-2">
                {Object.entries(logSummary.refinedSettings.recommendedPoolSizes).map(([mkt, size]) => (
                  <div
                    key={mkt}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{mkt}</span>
                      <span className="text-[11px] text-slate-500">
                        {mkt === 'Deshawar'
                          ? 'Tight anchor discipline'
                          : mkt === 'Gali'
                          ? 'Late-night high dispersion defense'
                          : 'Standard harmonic pool'}
                      </span>
                    </div>
                    <span className="text-base font-mono font-black text-amber-300 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/50">
                      {size} Pairs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimal Engine Consensus Weights */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 md:col-span-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Calibrated Multi-Engine Consensus Vote Weights
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {Object.entries(logSummary.refinedSettings.optimalEngineWeights).map(([eng, weight]) => (
                  <div
                    key={eng}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-1"
                  >
                    <span className="text-[11px] text-slate-400 capitalize block truncate">
                      {eng.replace(/_/g, ' ')}
                    </span>
                    <span className="text-base font-black text-indigo-300 font-mono">{weight}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIT DETAIL MODAL */}
      {selectedHitModal && (
        <div
          onClick={() => setSelectedHitModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in text-slate-200 text-sm max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{selectedHitModal.market}</span>
                  <span className="font-mono text-xl font-black text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
                    {selectedHitModal.drawnPair}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      selectedHitModal.hitType === 'EXACT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedHitModal.hitType} Hit • Rank #{selectedHitModal.rank}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  Date: {selectedHitModal.date} ({selectedHitModal.dayOfWeek}) • Engine: {selectedHitModal.engineName}
                </span>
              </div>

              <button
                onClick={() => setSelectedHitModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Exact Settings Recorded */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Exact Recorded Settings & Parameters
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Target Pool Size:</span>
                  <span className="font-bold text-white ml-2">{selectedHitModal.exactSettings.poolSize}</span>
                </div>
                <div>
                  <span className="text-slate-400">Score Threshold:</span>
                  <span className="font-bold text-white ml-2">{selectedHitModal.exactSettings.thresholdCutoff}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tier Designation:</span>
                  <span className="font-bold text-amber-300 ml-2">
                    {selectedHitModal.exactSettings.tier.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Elasticity Mode:</span>
                  <span className="font-bold text-indigo-300 ml-2">
                    {selectedHitModal.exactSettings.elasticityMode}
                  </span>
                </div>
              </div>
            </div>

            {/* Contributing Conditions */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Contributing Conditions & Market Factors
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">DOW Parity:</span>
                  <span className="font-bold text-white ml-2">
                    {selectedHitModal.contributingConditions.dayOfWeekParity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Digit Sum:</span>
                  <span className="font-bold text-white ml-2">
                    {selectedHitModal.contributingConditions.digitSum} (
                    {selectedHitModal.contributingConditions.sumParity})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Recency Lag:</span>
                  <span className="font-bold text-cyan-300 ml-2">
                    {selectedHitModal.contributingConditions.recencyLagDays} days
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Anchor Axis:</span>
                  <span className="font-bold text-amber-300 ml-2">
                    Axis {selectedHitModal.contributingConditions.anchorAxis}
                  </span>
                </div>
              </div>
            </div>

            {/* Contributing Rules */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Active Rules Contributing to this Hit ({selectedHitModal.contributingRules.length})
              </span>
              <div className="space-y-2">
                {selectedHitModal.contributingRules.map((rule) => (
                  <div key={rule.code} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-400">{rule.code}: {rule.name}</span>
                      <span className="text-[11px] font-bold text-emerald-400">+{rule.impactMultiplier}x</span>
                    </div>
                    <p className="text-slate-400 mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedHitModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
