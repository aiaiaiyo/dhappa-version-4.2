import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Database,
  Zap,
  Play,
  Square,
  RefreshCw,
  HardDrive,
  BarChart2,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Trash2,
} from 'lucide-react';
import { DayMarketEntry } from '../types';
import {
  runLargeDatasetTrainingAsync,
  TrainingProgress,
  ModelTrainingResult,
} from '../utils/largeDataWorkerEngine';
import { clearIndexedDBRecords, loadRecordsFromIndexedDB } from '../utils/indexedDbStorage';

interface LargeDatasetPerformanceHubProps {
  records: DayMarketEntry[];
  onReloadRecords?: () => void;
}

export const LargeDatasetPerformanceHub: React.FC<LargeDatasetPerformanceHubProps> = ({
  records,
  onReloadRecords,
}) => {
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResult | null>(null);
  const [idbCount, setIdbCount] = useState<number>(0);
  const [activeWindowDays, setActiveWindowDays] = useState<number>(records.length || 365);

  const cancellationRef = useMemo(() => ({ isCancelled: false }), []);

  // Check IndexedDB record count
  useEffect(() => {
    loadRecordsFromIndexedDB().then((idbRecords) => {
      setIdbCount(idbRecords.length);
    });
  }, [records]);

  const handleStartTraining = async () => {
    if (records.length < 15) {
      alert('Requires at least 15 historical draw records to perform Walk-Forward model training.');
      return;
    }

    cancellationRef.isCancelled = false;
    setIsTraining(true);
    setTrainingProgress(null);
    setTrainingResult(null);

    try {
      const slicedRecords = activeWindowDays >= records.length
        ? records
        : records.slice(0, activeWindowDays);

      const result = await runLargeDatasetTrainingAsync(
        slicedRecords,
        {
          minHistoryDays: 15,
          onProgress: (p) => setTrainingProgress(p),
        },
        cancellationRef
      );

      if (!cancellationRef.isCancelled) {
        setTrainingResult(result);
      }
    } catch (err: any) {
      console.error('Model training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleStopTraining = () => {
    cancellationRef.isCancelled = true;
    setIsTraining(false);
  };

  const handlePurgeIndexedDB = async () => {
    if (confirm('Are you sure you want to clear IndexedDB local storage cache?')) {
      await clearIndexedDBRecords();
      setIdbCount(0);
      if (onReloadRecords) onReloadRecords();
    }
  };

  const estimatedStorageMb = useMemo(() => {
    const recordsToMeasure = records.length > 0 ? records.length : idbCount;
    // Approx 250 bytes per record
    return ((recordsToMeasure * 250) / (1024 * 1024)).toFixed(2);
  }, [records.length, idbCount]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono space-y-5 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Cpu className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Large Dataset Async ML Engine & Storage Hub
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                High Throughput
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Train neural consensus models, run asynchronous backtesting, and inspect IndexedDB storage throughput without UI lag.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isTraining ? (
            <button
              type="button"
              onClick={handleStartTraining}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Train Model ({records.length.toLocaleString()} Records)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopTraining}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Async Training</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Records Active */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Dataset</span>
            <span className="text-lg font-black text-cyan-300">{records.length.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block">Dates in memory</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
        </div>

        {/* IndexedDB Storage Health */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">IndexedDB Engine</span>
            <span className="text-lg font-black text-emerald-400">{idbCount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block">~{estimatedStorageMb} MB storage size</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>

        {/* Active Window Slicing */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="space-y-1 w-full">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Training Window Slice</span>
            <select
              value={activeWindowDays}
              onChange={(e) => setActiveWindowDays(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value={records.length}>Full Historical Corpus ({records.length})</option>
              <option value={365}>Last 365 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Throughput Speed Meter */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Processing Engine Speed</span>
            <span className="text-lg font-black text-amber-300">
              {trainingProgress ? trainingProgress.throughputRecordsPerSec : trainingResult ? trainingResult.throughput : 'Instant'}
            </span>
            <span className="text-[10px] text-slate-400 block">Records / second speed</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Live Async Training Progress */}
      {isTraining && trainingProgress && (
        <div className="bg-purple-950/30 border border-purple-500/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="font-bold text-purple-200">
                Training Multi-Engine Consensus Models...
              </span>
            </div>
            <span className="font-bold text-purple-300">
              {trainingProgress.percentage}% ({trainingProgress.currentStep.toLocaleString()} / {trainingProgress.totalSteps.toLocaleString()} steps)
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-purple-900">
            <div
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-full transition-all duration-150"
              style={{ width: `${trainingProgress.percentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block">Current Date:</span>
              <span className="font-bold text-cyan-300">{trainingProgress.currentDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Throughput:</span>
              <span className="font-bold text-amber-300">{trainingProgress.throughputRecordsPerSec.toLocaleString()} records/sec</span>
            </div>
            <div>
              <span className="text-slate-400 block">Accuracy (Top 36):</span>
              <span className="font-bold text-emerald-400">{trainingProgress.accuracyRate}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Training Loss:</span>
              <span className="font-bold text-purple-300">{trainingProgress.currentLoss}</span>
            </div>
          </div>
        </div>
      )}

      {/* Completed Training Report */}
      {trainingResult && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Model Training Complete ({trainingResult.totalTestedDates.toLocaleString()} backtested dates)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold">
              Duration: {(trainingResult.totalDurationMs / 1000).toFixed(2)}s | Throughput: {trainingResult.throughput.toLocaleString()} rec/s
            </span>
          </div>

          {/* Calibrated Engine Weights Grid */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Calibrated Multi-Engine Weight Vectors</span>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(trainingResult.calibratedEngineWeights).map(([engine, weight]) => (
                <div
                  key={engine}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                >
                  <span className="text-slate-400 uppercase font-bold text-[10px]">{engine}:</span>
                  <span className="font-bold text-cyan-300 font-mono">{(weight as number).toFixed(2)}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Database Storage Management Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Large datasets automatically persist in high-performance IndexedDB without 5MB limits.</span>
        </div>
        <button
          type="button"
          onClick={handlePurgeIndexedDB}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Vacuum IndexedDB Cache</span>
        </button>
      </div>
    </div>
  );
};
