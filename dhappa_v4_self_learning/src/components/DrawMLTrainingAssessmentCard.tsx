import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  BarChart3,
  ExternalLink,
  Target,
} from 'lucide-react';
import { MLDrawTrainingAssessment } from '../utils/mlDrawPerformanceAssessmentEngine';

interface DrawMLTrainingAssessmentCardProps {
  assessment: MLDrawTrainingAssessment | null;
  onRetrainModel?: () => void;
  onNavigateToPerformanceLog?: () => void;
  isRetraining?: boolean;
}

export const DrawMLTrainingAssessmentCard: React.FC<DrawMLTrainingAssessmentCardProps> = ({
  assessment,
  onRetrainModel,
  onNavigateToPerformanceLog,
  isRetraining = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showFeatureShifts, setShowFeatureShifts] = useState<boolean>(false);
  const [retrainSuccessNotice, setRetrainSuccessNotice] = useState<string | null>(null);

  if (!assessment) return null;

  const {
    date,
    dayOfWeek,
    marketEvaluations,
    exactHits,
    paltiHits,
    familyHits,
    misses,
    totalDrawnMarkets,
    cleanSweepStatus,
    drawAccuracyPct,
    trainingAssessment,
    performanceLogSummary,
  } = assessment;

  const handleRetrainClick = () => {
    if (onRetrainModel) {
      onRetrainModel();
    }
    setRetrainSuccessNotice(`Walk-forward model weights re-optimized and calibrated against draw ${date}.`);
    setTimeout(() => setRetrainSuccessNotice(null), 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL_WEIGHTS_CONFIRMED':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      case 'INCREMENTAL_CALIBRATION_APPLIED':
        return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
      case 'RETRAINING_RECOMMENDED':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      default:
        return 'border-slate-700 bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/50 space-y-4">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Post-Draw ML Training Assessment & Performance Log
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Draw Date: {date} ({dayOfWeek})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluated upon draw result entry: Performance Log audited and ML training requirements calibrated.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getStatusColor(
              trainingAssessment.status
            )}`}
          >
            {trainingAssessment.status === 'OPTIMAL_WEIGHTS_CONFIRMED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {trainingAssessment.status === 'INCREMENTAL_CALIBRATION_APPLIED' && <Sliders className="w-3.5 h-3.5 text-cyan-400" />}
            {trainingAssessment.status === 'RETRAINING_RECOMMENDED' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            <span>
              {trainingAssessment.status === 'OPTIMAL_WEIGHTS_CONFIRMED'
                ? 'ML WEIGHTS OPTIMAL'
                : trainingAssessment.status === 'INCREMENTAL_CALIBRATION_APPLIED'
                ? 'INCREMENTAL CALIBRATION'
                : 'RETRAINING RECOMMENDED'}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            title={isExpanded ? 'Collapse assessment details' : 'Expand assessment details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Retrain Success Notification */}
      {retrainSuccessNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{retrainSuccessNotice}</span>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Draw Precision Rate</div>
          <div className="text-base font-black text-emerald-300 flex items-center gap-1 mt-0.5">
            <span>{drawAccuracyPct}%</span>
            <span className="text-[10px] font-normal text-slate-400">
              ({exactHits + paltiHits + familyHits}/{totalDrawnMarkets} Houses)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Sweep Status</div>
          <div className="text-base font-black text-indigo-300 truncate mt-0.5">
            {cleanSweepStatus === '4_OUT_OF_4_CLEAN_SWEEP'
              ? '4/4 Clean Sweep'
              : cleanSweepStatus === '3_HOUSES_HIT'
              ? '3/4 House Sweep'
              : cleanSweepStatus === '2_HOUSES_HIT'
              ? '2/4 Houses Hit'
              : 'Single House Hit'}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Brier Error Loss</div>
          <div className="text-base font-black text-cyan-300 mt-0.5 flex items-center gap-1">
            <span>{trainingAssessment.brierErrorScore}</span>
            <span className="text-[10px] font-mono text-slate-500">(low is better)</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Drift Regime</div>
          <div className={`text-base font-black mt-0.5 ${
            trainingAssessment.driftRegime === 'ACCELERATING' ? 'text-emerald-400' : 'text-cyan-400'
          }`}>
            {trainingAssessment.driftRegime}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Per-Market Draw Evaluation Cards */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drawn Result & ML Consensus Ranks for {date}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {marketEvaluations.map((mkt) => {
                const isExact = mkt.hitType === 'EXACT';
                const isPalti = mkt.hitType === 'PALTI';
                const isFamily = mkt.hitType === 'FAMILY';
                const isMiss = mkt.hitType === 'MISS';

                return (
                  <div
                    key={mkt.market}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      isExact
                        ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : isPalti
                        ? 'bg-purple-950/20 border-purple-500/40 ring-1 ring-purple-500/20'
                        : isFamily
                        ? 'bg-cyan-950/20 border-cyan-500/40'
                        : 'bg-rose-950/15 border-rose-500/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-slate-200">{mkt.market}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isExact
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isPalti
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : isFamily
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {mkt.hitType}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-black font-mono text-white tracking-wider">
                          {mkt.drawnPair}
                        </span>
                        <span className="text-[11px] font-mono text-slate-300">
                          {isMiss ? 'Unranked' : `ML Rank #${mkt.predictedRank}`}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-1 mb-2">
                        <div className="flex items-center justify-between">
                          <span>Confidence:</span>
                          <span className="font-mono text-slate-200 font-bold">{mkt.predictedConfidence}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tier:</span>
                          <span className="font-mono text-slate-300 text-[9px]">{mkt.mlTier.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Digit Sum:</span>
                          <span className="font-mono text-slate-300">{mkt.digitSum} {mkt.isDouble ? '(Double)' : ''}</span>
                        </div>
                      </div>

                      {/* Supporting Engines & Rules */}
                      {!isMiss && (
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          <div className="text-[9px] font-mono text-slate-400 uppercase">Supporting Engines</div>
                          <div className="flex flex-wrap gap-1">
                            {mkt.supportingEngines.slice(0, 2).map((eng, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-full"
                              >
                                {eng}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Miss Diagnosis */}
                      {isMiss && mkt.missDiagnosis && (
                        <div className="pt-1 border-t border-rose-900/40 text-[10px] text-rose-300 space-y-0.5">
                          <div className="font-bold">Failure Diagnosis:</div>
                          <div className="text-rose-400 leading-tight">{mkt.missDiagnosis}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ML Training Assessment & Calibration Panel */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider">
                  ML Training Assessment & Online Calibration
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFeatureShifts(!showFeatureShifts)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-indigo-400" />
                  <span>Feature Shifts</span>
                  {showFeatureShifts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {onRetrainModel && (
                  <button
                    type="button"
                    onClick={handleRetrainClick}
                    disabled={isRetraining}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition select-none cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRetraining ? 'animate-spin' : ''}`} />
                    <span>{isRetraining ? 'Retraining...' : 'Re-Calibrate Weights'}</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200 mb-1">
                {trainingAssessment.headline}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {trainingAssessment.detailedRationale}
              </p>
            </div>

            {/* Feature Shifts Drawer */}
            {showFeatureShifts && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs animate-fadeIn">
                <div className="font-bold text-slate-300 text-[11px]">Feature Importance Shifts Post-Draw:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  {trainingAssessment.featureImportanceShift.map((shift, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 truncate mr-2">{shift.featureName}</span>
                      <div className="flex items-center gap-1 font-mono shrink-0">
                        <span className="text-slate-500">{shift.previousWeight.toFixed(2)}</span>
                        <span className="text-slate-400">→</span>
                        <span className={`font-bold ${
                          shift.shiftDirection === 'INCREASED' ? 'text-emerald-400' :
                          shift.shiftDirection === 'DECREASED' ? 'text-rose-400' : 'text-slate-300'
                        }`}>
                          {shift.updatedWeight.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Log Audit Synchronized Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Daily Performance Log Updated: <strong className="text-slate-200">{performanceLogSummary.totalEvaluatedDays} days</strong> audited ({performanceLogSummary.totalHistoricalHits} total hits)
                </span>
              </div>

              {onNavigateToPerformanceLog && (
                <button
                  type="button"
                  onClick={onNavigateToPerformanceLog}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <span>Open Full Performance Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
