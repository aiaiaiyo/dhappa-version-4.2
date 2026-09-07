import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Save,
  RotateCcw,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  X,
  Layers,
  Sparkles,
  Sliders,
  Database,
  Trash2,
  FileSpreadsheet,
  Check,
  HelpCircle,
  Copy,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { DayMarketEntry, Currency, DisplayMode, NavigationTab } from '../types';
import {
  SafeRestorePoint,
  RestorePointManifestItem,
  harvestSystemState,
  saveSafeRestorePoint,
  loadAllSafeRestorePoints,
  loadSafeRestorePointById,
  deleteSafeRestorePoint,
  executeRestorePoint,
  exportRestorePointAsJson,
  parseAndValidateRestorePointFile,
  getRestorePointsManifest,
} from '../utils/safeRestorePointManager';

interface SafeRestorePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecords: DayMarketEntry[];
  currentCurrency: Currency;
  currentDisplayMode: DisplayMode;
  currentSelectedDate: string;
  currentActiveTab: NavigationTab;
  onStateRestored: (restored: {
    records: DayMarketEntry[];
    currency: Currency;
    displayMode: DisplayMode;
    selectedDate: string;
    activeTab?: NavigationTab;
  }) => void;
  onNotify: (msg: string) => void;
}

export const SafeRestorePointModal: React.FC<SafeRestorePointModalProps> = ({
  isOpen,
  onClose,
  currentRecords,
  currentCurrency,
  currentDisplayMode,
  currentSelectedDate,
  currentActiveTab,
  onStateRestored,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'CREATE' | 'SAVED' | 'IMPORT_EXPORT'>('CREATE');

  // Creation State
  const [pointName, setPointName] = useState<string>('');
  const [pointDescription, setPointDescription] = useState<string>('');
  const [pointTag, setPointTag] = useState<'MANUAL' | 'BASELINE' | 'POST_ML' | 'PRE_DRAW'>('MANUAL');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  // Saved points list
  const [savedPoints, setSavedPoints] = useState<SafeRestorePoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState<boolean>(false);
  const [confirmRestorePoint, setConfirmRestorePoint] = useState<SafeRestorePoint | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // File import state
  const [importedPoint, setImportedPoint] = useState<SafeRestorePoint | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize point name with timestamp default
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const defaultTitle = `Safe Point • ${now.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })} ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
      setPointName(defaultTitle);
      setPointDescription('');
      setJustSavedId(null);
      setConfirmRestorePoint(null);
      setImportedPoint(null);
      setImportError(null);
      loadSavedPointsList();
    }
  }, [isOpen]);

  const loadSavedPointsList = async () => {
    setIsLoadingPoints(true);
    try {
      const points = await loadAllSafeRestorePoints();
      setSavedPoints(points);
    } catch (err) {
      console.warn('Could not load points list', err);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  if (!isOpen) return null;

  // Handle Creating a new Restore Point
  const handleCreateRestorePoint = async () => {
    if (!pointName.trim()) {
      onNotify('Please enter a name for the restore point.');
      return;
    }

    setIsSaving(true);
    try {
      const restorePoint = await harvestSystemState({
        currentRecords,
        currentCurrency,
        currentDisplayMode,
        currentSelectedDate,
        currentActiveTab,
        customName: pointName.trim(),
        customDescription: pointDescription.trim(),
        tag: pointTag,
      });

      const success = await saveSafeRestorePoint(restorePoint);
      if (success) {
        setJustSavedId(restorePoint.metadata.id);
        onNotify(`Safe Restore Point "${restorePoint.metadata.name}" captured and sealed successfully!`);
        await loadSavedPointsList();
      } else {
        onNotify('Warning: Could not write restore point to persistent storage.');
      }
    } catch (err: any) {
      onNotify(`Error creating restore point: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Executing Rollback / Restore
  const handleExecuteRollback = async (point: SafeRestorePoint) => {
    setIsRestoring(true);
    try {
      const success = await executeRestorePoint(point, {
        setRecords: (recs) => onStateRestored({ records: recs, currency: currentCurrency, displayMode: currentDisplayMode, selectedDate: currentSelectedDate }),
        setCurrency: (curr) => onStateRestored({ records: currentRecords, currency: curr, displayMode: currentDisplayMode, selectedDate: currentSelectedDate }),
        setDisplayMode: (mode) => onStateRestored({ records: currentRecords, currency: currentCurrency, displayMode: mode, selectedDate: currentSelectedDate }),
        setSelectedDate: (dt) => onStateRestored({ records: currentRecords, currency: currentCurrency, displayMode: currentDisplayMode, selectedDate: dt }),
        setActiveTab: (tab) => onStateRestored({ records: currentRecords, currency: currentCurrency, displayMode: currentDisplayMode, selectedDate: currentSelectedDate, activeTab: tab }),
        onSuccessNotification: (msg) => onNotify(msg),
      });

      if (success) {
        setConfirmRestorePoint(null);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      onNotify(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Delete Restore Point
  const handleDeletePoint = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete restore point "${name}"?`)) {
      const deleted = await deleteSafeRestorePoint(id);
      if (deleted) {
        onNotify(`Deleted restore point "${name}".`);
        await loadSavedPointsList();
      }
    }
  };

  // Handle File Drag & Upload
  const handleProcessFile = (file: File) => {
    setImportError(null);
    setImportedPoint(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseAndValidateRestorePointFile(text);
      if (result.isValid && result.restorePoint) {
        setImportedPoint(result.restorePoint);
      } else {
        setImportError(result.error || 'Failed to parse restore point JSON file.');
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Quick export current state directly as file
  const handleQuickExportCurrentState = async () => {
    try {
      const point = await harvestSystemState({
        currentRecords,
        currentCurrency,
        currentDisplayMode,
        currentSelectedDate,
        currentActiveTab,
        customName: `Offline_Backup_${new Date().toISOString().slice(0, 10)}`,
        tag: 'MANUAL',
      });
      exportRestorePointAsJson(point);
      onNotify('Master Safe Restore Point JSON downloaded.');
    } catch (err: any) {
      onNotify(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Safe Restore Points & System Snapshot Manager
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Loss Safe State
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Seals 100% of settings, parameters, calculations, ML weights & historical draw records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('CREATE')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'CREATE'
                ? 'border-emerald-400 text-emerald-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Create Safe Restore Point</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SAVED')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'SAVED'
                ? 'border-emerald-400 text-emerald-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Saved Checkpoints ({savedPoints.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IMPORT_EXPORT')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'IMPORT_EXPORT'
                ? 'border-emerald-400 text-emerald-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import / Offline Backup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-200">
          {/* TAB 1: CREATE SAFE RESTORE POINT */}
          {activeTab === 'CREATE' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>State Elements to be Captured & Sealed:</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Live Session Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Settings</div>
                    <div className="font-bold text-white mt-0.5">
                      {currentCurrency} • {currentDisplayMode}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Date: {currentSelectedDate}</div>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Parameters</div>
                    <div className="font-bold text-cyan-300 mt-0.5">36 ML Weights</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Ensemble / Attention</div>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Calculations</div>
                    <div className="font-bold text-emerald-300 mt-0.5">Consensus & Miss</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Pattern Dash Snapshot</div>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Draw History</div>
                    <div className="font-bold text-purple-300 mt-0.5">{currentRecords.length} Records</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">4-Market Archive</div>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Restore Point Name / Label
                  </label>
                  <input
                    type="text"
                    value={pointName}
                    onChange={(e) => setPointName(e.target.value)}
                    placeholder="e.g. Pre-Draw Baseline • Sep 4, 2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Checkpoint Notes / Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={pointDescription}
                    onChange={(e) => setPointDescription(e.target.value)}
                    placeholder="e.g. Captured right after training on 37 miss-day diagnostics with 94.6% accuracy..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Checkpoint Tag
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['MANUAL', 'BASELINE', 'POST_ML', 'PRE_DRAW'] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPointTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          pointTag === tag
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {justSavedId && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Restore point created and saved into persistent storage!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('SAVED')}
                    className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-[11px] hover:bg-emerald-400 transition cursor-pointer"
                  >
                    View in Checkpoints List
                  </button>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCreateRestorePoint}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>{isSaving ? 'Sealing & Saving Point...' : 'SAVE SAFE RESTORE POINT NOW'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED CHECKPOINTS & ROLLBACK */}
          {activeTab === 'SAVED' && (
            <div className="space-y-4">
              {confirmRestorePoint && (
                <div className="p-4 bg-amber-950/50 border border-amber-500/60 rounded-xl space-y-3 shadow-xl animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Confirm System Rollback & State Restoration</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You are about to roll back the entire application state to{' '}
                    <strong className="text-amber-300 font-mono">
                      "{confirmRestorePoint.metadata.name}"
                    </strong>{' '}
                    (created {new Date(confirmRestorePoint.metadata.createdAt).toLocaleString()}). This will overwrite current records with{' '}
                    <strong>{confirmRestorePoint.metadata.totalRecords} historical records</strong>, restore all 33 ML weights, calculation states, and active date.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => setConfirmRestorePoint(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleExecuteRollback(confirmRestorePoint)}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? 'Restoring System...' : 'Yes, Restore This Point Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {isLoadingPoints ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  Loading saved restore points...
                </div>
              ) : savedPoints.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80 p-6">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Saved Restore Points Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create your first safe restore point to bookmark all current settings, calculations, and ML weights.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE')}
                    className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Create Restore Point Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPoints.map((point) => (
                    <div
                      key={point.metadata.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              #{point.metadata.tag || 'MANUAL'}
                            </span>
                            <h4 className="text-sm font-bold text-white">{point.metadata.name}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {point.metadata.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 self-start sm:self-auto text-right">
                          <div>{new Date(point.metadata.createdAt).toLocaleString()}</div>
                          <div className="text-slate-500">{point.metadata.checksum}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850 text-xs">
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                          <span>{point.metadata.totalRecords} Records</span>
                          <span>&bull;</span>
                          <span>{point.settings?.currency || 'USD'}</span>
                          <span>&bull;</span>
                          <span className="text-cyan-400">
                            {point.parameters?.consensusWeights36?.length ||
                              point.parameters?.consensusWeights33?.length ||
                              36}{' '}
                            ML Weights
                          </span>
                          <span>&bull;</span>
                          <span className="text-emerald-400">Calculations Sealed</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => exportRestorePointAsJson(point)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                            title="Export this point as JSON file"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>Export</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePoint(point.metadata.id, point.metadata.name)}
                            className="p-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-700 transition cursor-pointer"
                            title="Delete restore point"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmRestorePoint(point)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore This Point</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT & OFFLINE BACKUP */}
          {activeTab === 'IMPORT_EXPORT' && (
            <div className="space-y-5">
              {/* Direct Offline Backup Master Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 border border-cyan-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">
                        Direct Export
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        Download Comprehensive Master Backup File
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Instantly saves current settings, parameters, calculations, and {currentRecords.length} records into a downloadable JSON file for offline archival.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickExportCurrentState}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>DOWNLOAD BACKUP (.JSON)</span>
                  </button>
                </div>
              </div>

              {/* Upload External Restore Point File */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Import & Restore from Saved JSON File
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Pre-Flight Verification</span>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    isDraggingFile
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-200">
                    Click to browse or drag & drop a restore point JSON file
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts Safe Restore Point files (.json) and Master v4.0 snapshots
                  </p>
                </div>

                {importError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{importError}</span>
                  </div>
                )}

                {importedPoint && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>File Verified & Ready to Restore</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {importedPoint.metadata.checksum}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-white font-bold">{importedPoint.metadata.name}</div>
                      <div className="text-slate-400 text-[11px]">{importedPoint.metadata.description}</div>
                      <div className="text-[11px] font-mono text-slate-300 pt-1">
                        Records: {importedPoint.metadata.totalRecords} | Currency: {importedPoint.settings?.currency || 'USD'} | ML Weights: 33
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setImportedPoint(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={() => handleExecuteRollback(importedPoint)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isRestoring ? 'Restoring System...' : 'RESTORE FROM THIS FILE'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Web Crypto & IndexedDB Persistence</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
