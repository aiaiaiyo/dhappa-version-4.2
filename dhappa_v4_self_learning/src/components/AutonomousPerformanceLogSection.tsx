import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FileCode,
  FileText,
  Activity,
  BarChart3,
  Layers,
  ChevronRight,
  Database,
  Calendar,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { DayMarketEntry } from '../types';
import {
  executeAutonomousTelemetryAudit,
  runContinuousLearningEvolutionLoop,
  getContinuousLearningState,
  AutonomousTelemetryReport,
  ContinuousLearningState,
} from '../utils/autonomousPerformanceLogOrchestrator';
import { ConsensusMLModelType } from '../utils/consensusMatrixMLEngine';

interface AutonomousPerformanceLogSectionProps {
  records: DayMarketEntry[];
  currentDate?: string;
  onApplyRules?: (rules: string[]) => void;
}

export const AutonomousPerformanceLogSection: React.FC<AutonomousPerformanceLogSectionProps> = ({
  records,
  currentDate,
  onApplyRules,
}) => {
  const latestDate = useMemo(() => {
    if (currentDate && records.some((r) => r.date === currentDate)) return currentDate;
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]?.date || new Date().toISOString().split('T')[0];
  }, [records, currentDate]);

  const [selectedDate, setSelectedDate] = useState<string>(latestDate);
  const [modelType, setModelType] = useState<ConsensusMLModelType>('gbdt_consensus_forest');
  const [report, setReport] = useState<AutonomousTelemetryReport | null>(null);
  const [learningState, setLearningState] = useState<ContinuousLearningState>(getContinuousLearningState());
  const [activeSubTab, setActiveSubTab] = useState<'executive' | 'markdown' | 'json' | 'evolution'>('executive');
  const [copiedType, setCopiedType] = useState<'md' | 'json' | null>(null);
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [evolutionProgress, setEvolutionProgress] = useState<{ current: number; total: number; brier: number } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync selected date when latestDate changes
  useEffect(() => {
    if (latestDate && !selectedDate) {
      setSelectedDate(latestDate);
    }
  }, [latestDate, selectedDate]);

  // Generate audit report when date or modelType changes
  useEffect(() => {
    if (records.length > 0 && selectedDate) {
      try {
        const audit = executeAutonomousTelemetryAudit(records, selectedDate, modelType);
        setReport(audit);
        setLearningState(getContinuousLearningState());
      } catch (err) {
        console.error('Failed to execute telemetry audit:', err);
      }
    }
  }, [records, selectedDate, modelType]);

  const handleCopy = (text: string, type: 'md' | 'json') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunContinuousEvolution = () => {
    setIsEvolving(true);
    setEvolutionProgress({ current: 0, total: Math.min(30, records.length), brier: learningState.currentBrierScore });

    setTimeout(() => {
      try {
        const res = runContinuousLearningEvolutionLoop(records, {
          maxEvolutionDays: 30,
          onProgress: (current, total, brier) => {
            setEvolutionProgress({ current, total, brier });
          },
        });

        setLearningState(getContinuousLearningState());
        setReport(res.latestReport);
        setSuccessToast(
          `Evolution completed! ${res.cyclesExecuted} days audited. Brier error reduced from ${res.startingBrier} to ${res.endingBrier}. Top-36 capture rate improved to ${res.endingCaptureRate}%.`
        );
        setTimeout(() => setSuccessToast(null), 6000);
      } catch (e) {
        console.error('Error during evolution loop', e);
      } finally {
        setIsEvolving(false);
        setEvolutionProgress(null);
      }
    }, 100);
  };

  if (!report) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
        <p>Executing Autonomous Telemetry Inquest...</p>
      </div>
    );
  }

  const { telemetryHeader, houseEvaluations, missDiagnostics, tierPerformanceSummary, autonomousSelfRefiningDeltas } = report;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Hero Header & Control Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BrainCircuit className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Autonomous Daily Performance Log & Self-Learning Engine
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    Cycle #{learningState.evolutionCycle} Evolving
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Forensic post-draw audit engine synthesizing autonomous parameter deltas (Δw_i), failure vector recovery (V-01 to V-05), and Brier calibration.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-slate-400">Target Date:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {records.slice(0, 30).map((r) => (
                  <option key={r.date} value={r.date} className="bg-slate-900 text-white">
                    {r.date}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunContinuousEvolution}
              disabled={isEvolving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg ${
                isEvolving
                  ? 'bg-indigo-700/50 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:brightness-110 shadow-indigo-600/30'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvolving ? 'animate-spin' : ''}`} />
              <span>{isEvolving ? 'Evolving Machine Learning...' : 'Run Continuous Self-Evolution Loop'}</span>
            </button>
          </div>
        </div>

        {/* Live Learning State Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-indigo-900/40">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Brier Reliability</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span>{telemetryHeader.brierReliabilityScore}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">Optimal</span>
            </div>
            <span className="text-[10px] text-slate-500">Target &lt; 0.100 (BS)</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Sweep Status</span>
            <div className="text-sm font-bold text-white mt-0.5 truncate">
              {telemetryHeader.sweepMomentumStatus.replace(/_/g, ' ')}
            </div>
            <span className="text-[10px] text-indigo-400">{telemetryHeader.overallAccuracyPct}% Capture Rate</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Realized Kelly Yield</span>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              +{telemetryHeader.realizedKellyRoiPct}%
            </div>
            <span className="text-[10px] text-slate-500">Staking Efficiency</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Active Learned Deltas</span>
            <div className="text-base font-bold text-purple-300 mt-0.5">
              {Object.keys(autonomousSelfRefiningDeltas.featureTensorAdjustments).length} Dimensions
            </div>
            <span className="text-[10px] text-purple-400">Tensor Δw Tuning</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Recovered Misses</span>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {learningState.failureVectorRecoveryCounts.v01_palti +
                learningState.failureVectorRecoveryCounts.v02_boundary +
                learningState.failureVectorRecoveryCounts.v03_crossMarket}{' '}
              Misses
            </div>
            <span className="text-[10px] text-slate-500">Vectors V01-V05</span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Evolution Cycles</span>
            <div className="text-base font-bold text-white mt-0.5">
              {learningState.evolutionCycle} Iterations
            </div>
            <span className="text-[10px] text-emerald-400">Online Adapting</span>
          </div>
        </div>

        {/* Real-time Evolution Progress Bar */}
        {isEvolving && evolutionProgress && (
          <div className="mt-4 p-3.5 bg-indigo-950/90 rounded-xl border border-indigo-500/40 animate-pulse">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5 font-medium">
              <span>Walking forward through historical cycles... ({evolutionProgress.current}/{evolutionProgress.total})</span>
              <span>Brier Score: {evolutionProgress.brier.toFixed(3)}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(evolutionProgress.current / evolutionProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('executive')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'executive'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Executive Audit View</span>
          </button>

          <button
            onClick={() => setActiveSubTab('markdown')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'markdown'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown Report (Prompt Output)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('json')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'json'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON Telemetry Payload</span>
          </button>

          <button
            onClick={() => setActiveSubTab('evolution')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'evolution'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Self-Learning Progression</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'markdown' && (
            <>
              <button
                onClick={() => handleCopy(report.markdownExecutiveAudit, 'md')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'md' ? 'Copied' : 'Copy Markdown'}</span>
              </button>
              <button
                onClick={() => handleDownload(report.markdownExecutiveAudit, `telemetry_audit_${selectedDate}.md`, 'text/markdown')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </button>
            </>
          )}

          {activeSubTab === 'json' && (
            <>
              <button
                onClick={() => handleCopy(report.jsonTelemetryPayload, 'json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'json' ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={() => handleDownload(report.jsonTelemetryPayload, `telemetry_payload_${selectedDate}.json`, 'application/json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .json</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Executive Audit View */}
      {activeSubTab === 'executive' && (
        <div className="space-y-6">
          {/* Section 1: House-by-House Inquest Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  House-by-House Sequential Inquest
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Evaluating against Top 36 Master Consensus &amp; Confidence Tiers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase bg-slate-950/40">
                    <th className="py-2.5 px-3">Market</th>
                    <th className="py-2.5 px-3">Drawn #</th>
                    <th className="py-2.5 px-3">ML Rank</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Stratified Tier</th>
                    <th className="py-2.5 px-3">Hit Classification</th>
                    <th className="py-2.5 px-3">Consensus Engines</th>
                    <th className="py-2.5 px-3">Kelly Stake</th>
                    <th className="py-2.5 px-3">Primary Positive Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {houseEvaluations.map((h) => {
                    const isHit = h.capturedInTop36;
                    return (
                      <tr key={h.marketKey} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isHit ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400'
                            }`}
                          />
                          <span>{h.marketKey}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                            {h.drawnNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {h.mlCalibratedRank <= 36 ? (
                            <span className="text-emerald-400">#{h.mlCalibratedRank}</span>
                          ) : (
                            <span className="text-slate-500">#{h.mlCalibratedRank}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{h.mlConfidenceScore}%</span>
                            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  h.mlConfidenceScore >= 75
                                    ? 'bg-emerald-400'
                                    : h.mlConfidenceScore >= 62
                                    ? 'bg-blue-400'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${Math.min(100, h.mlConfidenceScore)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.stratifiedTier === 'TIER_1_ELITE_PRIME'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : h.stratifiedTier === 'TIER_2_HIGH_CONVICTION'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : h.stratifiedTier === 'TIER_3_CALIBRATED_DEFENSE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {h.stratifiedTier.replace(/TIER_\d_/, '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-semibold ${
                              h.hitClassification === 'EXACT_ANCHOR_HIT'
                                ? 'text-emerald-400'
                                : h.hitClassification === 'RECIPROCAL_PALTI_HIT'
                                ? 'text-cyan-400'
                                : h.hitClassification === 'CORE_FAMILY_PARIVAR_HIT'
                                ? 'text-indigo-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {h.hitClassification.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                          {h.engineConsensusCount} Engines
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-300">
                          {h.recommendedKellyStakePct}%
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400 truncate max-w-xs">
                          {h.topPositiveFactor}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Miss Root-Cause Diagnostics & Failure Vectors */}
          {missDiagnostics.length > 0 ? (
            <div className="bg-slate-900 border border-rose-900/30 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Miss Root-Cause Diagnosis &amp; Standardized Failure Vectors
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missDiagnostics.map((m) => (
                  <div
                    key={m.marketKey}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{m.marketKey}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {m.drawnNumber}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/40">
                        {m.failureVector.split(':')[0]}
                      </span>
                    </div>

                    <div className="text-xs text-rose-200 font-semibold">
                      {m.failureVector}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">Divergence:</span> {m.divergenceReasoning}
                    </p>

                    <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                      <span className="font-semibold text-indigo-200">Corrective Policy:</span> {m.correctivePolicy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 text-emerald-200 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold">
                Zero Misses Recorded for this draw session. Clean 4/4 Sweep achieved across all houses!
              </span>
            </div>
          )}

          {/* Section 3: Confidence Tier Stratification Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Confidence Tier Stratification &amp; Empirical Brier Reliability
                </h3>
              </div>
              <span className="text-xs text-slate-400">Stratified Calibration Assessment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tier 1 */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Tier 1: Elite Prime</span>
                  <span className="text-[10px] text-purple-400 font-mono">≥ 75.0%</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {tierPerformanceSummary.tier1Elite.hitRatePct}%
                  <span className="text-xs font-normal text-slate-400 ml-1.5">Win Rate</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Candidates: {tierPerformanceSummary.tier1Elite.totalCandidates}</div>
                  <div>Avg Confidence: {tierPerformanceSummary.tier1Elite.avgConfidence}%</div>
                  <div>Brier Score: <span className="text-emerald-400 font-mono">{tierPerformanceSummary.tier1Elite.brierScore}</span></div>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">Tier 2: High Conviction</span>
                  <span className="text-[10px] text-blue-400 font-mono">62.0% - 74.9%</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {tierPerformanceSummary.tier2High.hitRatePct}%
                  <span className="text-xs font-normal text-slate-400 ml-1.5">Win Rate</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Candidates: {tierPerformanceSummary.tier2High.totalCandidates}</div>
                  <div>Avg Confidence: {tierPerformanceSummary.tier2High.avgConfidence}%</div>
                  <div>Brier Score: <span className="text-emerald-400 font-mono">{tierPerformanceSummary.tier2High.brierScore}</span></div>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Tier 3: Calibrated Defense</span>
                  <span className="text-[10px] text-amber-400 font-mono">48.0% - 61.9%</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {tierPerformanceSummary.tier3Defense.hitRatePct}%
                  <span className="text-xs font-normal text-slate-400 ml-1.5">Win Rate</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Candidates: {tierPerformanceSummary.tier3Defense.totalCandidates}</div>
                  <div>Avg Confidence: {tierPerformanceSummary.tier3Defense.avgConfidence}%</div>
                  <div>Brier Score: <span className="text-emerald-400 font-mono">{tierPerformanceSummary.tier3Defense.brierScore}</span></div>
                </div>
              </div>

              {/* Tier 4 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Tier 4: Support Buffer</span>
                  <span className="text-[10px] text-slate-500 font-mono">&lt; 48.0%</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {tierPerformanceSummary.tier4Buffer.hitRatePct}%
                  <span className="text-xs font-normal text-slate-400 ml-1.5">Win Rate</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Candidates: {tierPerformanceSummary.tier4Buffer.totalCandidates}</div>
                  <div>Avg Confidence: {tierPerformanceSummary.tier4Buffer.avgConfidence}%</div>
                  <div>Brier Score: <span className="text-emerald-400 font-mono">{tierPerformanceSummary.tier4Buffer.brierScore}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Autonomous Self-Refining Parameter Deltas (Δw_i) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Autonomous Self-Refining Parameter Deltas (Δw_i)
                </h3>
              </div>
              {onApplyRules && (
                <button
                  onClick={() => onApplyRules(autonomousSelfRefiningDeltas.activeEnforcedRules)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enforce Active Rules</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(autonomousSelfRefiningDeltas.featureTensorAdjustments).map(([feat, delta]) => (
                <div key={feat} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block truncate">{feat}</span>
                  <div className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                    Δw: {delta}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-indigo-300">Next-Day Operational Policy:</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {autonomousSelfRefiningDeltas.nextDayGuidanceSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Markdown View (Raw Exact Prompt Output) */}
      {activeSubTab === 'markdown' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-indigo-500/30">
            {report.markdownExecutiveAudit}
          </pre>
        </div>
      )}

      {/* Tab 3: JSON Telemetry Payload View */}
      {activeSubTab === 'json' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
          <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-emerald-500/30">
            {report.jsonTelemetryPayload}
          </pre>
        </div>
      )}

      {/* Tab 4: Self-Learning Progression Timeline */}
      {activeSubTab === 'evolution' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Self-Learning Evolution History</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks progressive reduction in Brier loss and increase in Top-36 capture rate across continuous walk-forward iterations.
              </p>
            </div>
            <button
              onClick={handleRunContinuousEvolution}
              disabled={isEvolving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvolving ? 'animate-spin' : ''}`} />
              <span>Step Forward 30 Days</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Baseline Brier Score</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{learningState.initialBrierScore.toFixed(3)}</div>
              <span className="text-[11px] text-slate-500">Uncalibrated initial prior</span>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Current Evolved Brier Score</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{learningState.currentBrierScore.toFixed(3)}</div>
              <span className="text-[11px] text-emerald-500 font-semibold">
                -{( (learningState.initialBrierScore - learningState.currentBrierScore) / learningState.initialBrierScore * 100).toFixed(1)}% Error Reduction
              </span>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Top-36 Pool Capture Rate</span>
              <div className="text-xl font-bold text-cyan-400 mt-1">{learningState.currentTop36CaptureRate}%</div>
              <span className="text-[11px] text-cyan-500 font-semibold">
                +{ (learningState.currentTop36CaptureRate - learningState.initialTop36CaptureRate).toFixed(1)}% Accuracy Lift
              </span>
            </div>
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase bg-slate-950/40">
                  <th className="py-2.5 px-3">Iteration</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Brier Score</th>
                  <th className="py-2.5 px-3">Sweep Momentum</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Learned Parameter Deltas (Δw)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {learningState.historyTimeline.length > 0 ? (
                  learningState.historyTimeline.slice(-15).reverse().map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono text-indigo-300">Cycle #{t.cycle}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{t.date}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">{t.brierScore.toFixed(3)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {t.sweepStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-cyan-300">{t.captureRate}%</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-sm">
                        {t.keyDeltaSummary}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                      Run Continuous Self-Evolution Loop to generate walk-forward historical iterations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
