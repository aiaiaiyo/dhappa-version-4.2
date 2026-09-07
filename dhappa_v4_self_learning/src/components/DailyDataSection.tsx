import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Calendar,
  Save,
  X,
  AlertCircle,
  Search,
  Filter,
  Bot,
  Sparkles,
} from 'lucide-react';
import { DayMarketEntry, Market, MARKETS } from '../types';
import { generatePairsForDate, formatDateISO, getTodayDateISO } from '../utils/mathEngine';
import {
  evaluateDrawResultForMLAndPerformance,
  getLatestDrawAssessment,
  MLDrawTrainingAssessment,
} from '../utils/mlDrawPerformanceAssessmentEngine';
import { DrawMLTrainingAssessmentCard } from './DrawMLTrainingAssessmentCard';

interface DailyDataSectionProps {
  records: DayMarketEntry[];
  onAddRecord: (entry: Omit<DayMarketEntry, 'id' | 'createdAt'>) => void;
  onUpdateRecord: (entry: DayMarketEntry) => void;
  onDeleteRecord: (id: string) => void;
  onClearAllRecords?: () => void;
  onPruneToLastThreeMonths?: () => void;
  onNavigateToPerformanceLog?: () => void;
}

export const DailyDataSection: React.FC<DailyDataSectionProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onClearAllRecords,
  onPruneToLastThreeMonths,
  onNavigateToPerformanceLog,
}) => {
  const [formDate, setFormDate] = useState<string>(() => getTodayDateISO());
  const [deshawar, setDeshawar] = useState<string>('');
  const [faridabad, setFaridabad] = useState<string>('');
  const [gali, setGali] = useState<string>('');
  const [ghaziabad, setGhaziabad] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [latestAssessment, setLatestAssessment] = useState<MLDrawTrainingAssessment | null>(() => getLatestDrawAssessment());
  const [isRetraining, setIsRetraining] = useState<boolean>(false);

  // Synchronize with external draw evaluations if fired
  useEffect(() => {
    const handleDrawEvaluated = (e: any) => {
      if (e?.detail?.assessment) {
        setLatestAssessment(e.detail.assessment);
      }
    };
    window.addEventListener('ml_draw_result_evaluated', handleDrawEvaluated);
    return () => window.removeEventListener('ml_draw_result_evaluated', handleDrawEvaluated);
  }, []);

  // Initialize assessment if none exists yet but records are present
  useEffect(() => {
    if (!latestAssessment && records.length > 0) {
      const newest = records[0];
      const { assessment } = evaluateDrawResultForMLAndPerformance(records, newest);
      setLatestAssessment(assessment);
    }
  }, [records, latestAssessment]);

  // Validate strict 2-digit format preserving leading zeroes (00-99)
  const sanitizePairInput = (val: string): string => {
    const digitsOnly = val.replace(/\D/g, '');
    return digitsOnly.slice(0, 2);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate date
    if (!formDate) {
      setFormError('Please select a valid date.');
      return;
    }

    // Validate that at least one market is provided and has exact 2-digit format if present
    const fields = [
      { name: 'Deshawar', val: deshawar },
      { name: 'Faridabad', val: faridabad },
      { name: 'Gali', val: gali },
      { name: 'Ghaziabad', val: ghaziabad },
    ];

    const filled = fields.filter((f) => f.val.trim().length > 0);
    if (filled.length === 0) {
      setFormError('Please provide at least one market pair value (00–99).');
      return;
    }

    for (const f of filled) {
      if (!/^\d{2}$/.test(f.val)) {
        setFormError(`${f.name} value must be exactly 2 digits (00–99), e.g. "03" or "42".`);
        return;
      }
    }

    if (editingId) {
      const existing = records.find((r) => r.id === editingId);
      if (existing) {
        const updatedEntry: DayMarketEntry = {
          ...existing,
          date: formDate,
          deshawar: deshawar ? deshawar.padStart(2, '0') : undefined,
          faridabad: faridabad ? faridabad.padStart(2, '0') : undefined,
          gali: gali ? gali.padStart(2, '0') : undefined,
          ghaziabad: ghaziabad ? ghaziabad.padStart(2, '0') : undefined,
          notes,
        };
        onUpdateRecord(updatedEntry);

        // Run Performance Log and ML Training Assessment upon draw update
        const updatedRecords = records.map((r) => (r.id === editingId ? updatedEntry : r));
        const { assessment } = evaluateDrawResultForMLAndPerformance(updatedRecords, updatedEntry);
        setLatestAssessment(assessment);
      }
      setEditingId(null);
    } else {
      const newEntryData = {
        date: formDate,
        deshawar: deshawar ? deshawar.padStart(2, '0') : undefined,
        faridabad: faridabad ? faridabad.padStart(2, '0') : undefined,
        gali: gali ? gali.padStart(2, '0') : undefined,
        ghaziabad: ghaziabad ? ghaziabad.padStart(2, '0') : undefined,
        notes,
        source: 'manual' as const,
      };
      onAddRecord(newEntryData);

      // Run Performance Log and ML Training Assessment upon new draw result entry
      const syntheticRecord: DayMarketEntry = {
        ...newEntryData,
        id: `rec-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updatedRecords = [syntheticRecord, ...records.filter((r) => r.date !== formDate)];
      const { assessment } = evaluateDrawResultForMLAndPerformance(updatedRecords, syntheticRecord);
      setLatestAssessment(assessment);
    }

    // Reset fields
    setDeshawar('');
    setFaridabad('');
    setGali('');
    setGhaziabad('');
    setNotes('');
  };

  const handleEvaluateHistoricalRecord = (rec: DayMarketEntry) => {
    const { assessment } = evaluateDrawResultForMLAndPerformance(records, rec);
    setLatestAssessment(assessment);
  };

  const handleRetrainModel = () => {
    if (!latestAssessment) return;
    setIsRetraining(true);
    setTimeout(() => {
      const targetRecord = records.find((r) => r.date === latestAssessment.date) || records[0];
      if (targetRecord) {
        const { assessment } = evaluateDrawResultForMLAndPerformance(records, targetRecord);
        setLatestAssessment(assessment);
      }
      setIsRetraining(false);
    }, 450);
  };

  const handleStartEdit = (rec: DayMarketEntry) => {
    setEditingId(rec.id);
    setFormDate(rec.date);
    setDeshawar(rec.deshawar || '');
    setFaridabad(rec.faridabad || '');
    setGali(rec.gali || '');
    setGhaziabad(rec.ghaziabad || '');
    setNotes(rec.notes || '');
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDeshawar('');
    setFaridabad('');
    setGali('');
    setGhaziabad('');
    setNotes('');
    setFormError(null);
  };

  // Section 30: Daily Validation against date's generated 12 pairs
  const currentFormGeneratedPairs = useMemo(() => {
    if (!formDate) return [];
    return generatePairsForDate(formDate).pairs;
  }, [formDate]);

  const checkMatchStatus = (date: string, pairVal?: string) => {
    if (!pairVal) return null;
    const generated = generatePairsForDate(date).pairs;
    const isMatch = generated.includes(pairVal);
    return {
      isMatch,
      label: isMatch ? 'Generated Pair Match' : 'Not Present in Generated Pair Set',
    };
  };

  // Filtered records
  const filteredRecords = records
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.date.includes(q) ||
        (r.deshawar && r.deshawar.includes(q)) ||
        (r.faridabad && r.faridabad.includes(q)) ||
        (r.gali && r.gali.includes(q)) ||
        (r.ghaziabad && r.ghaziabad.includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div id="section-daily-data" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sections 29–31 — Daily Historical Data Entry</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Local Market Record Entry & Strict Verification
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Maintains strict 2-digit format <code className="text-emerald-300">00–99</code> with leading zero preservation (e.g. "03" is never converted to "3").
          Compares inputs against deterministic generated pairs using neutral scientific labels.
        </p>
      </div>

      {/* 3-Month Data Retention Policy Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>3-Month Data Retention Policy: Active</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-mono">
                {records.length} Records In Storage
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Only the last 3 months of dataset entries are kept active for analysis. Older historical records are automatically pruned to maintain model execution speed and system performance.
            </div>
          </div>
        </div>

        {onPruneToLastThreeMonths && (
          <button
            type="button"
            onClick={onPruneToLastThreeMonths}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Keep Last 3 Months Only</span>
          </button>
        )}
      </div>

      {/* Post-Draw ML Training Assessment & Performance Log Card */}
      {latestAssessment && (
        <DrawMLTrainingAssessmentCard
          assessment={latestAssessment}
          onRetrainModel={handleRetrainModel}
          onNavigateToPerformanceLog={onNavigateToPerformanceLog}
          isRetraining={isRetraining}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Entry / Edit Form */}
        <form
          onSubmit={handleSave}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md h-fit"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              {editingId ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
              <span>{editingId ? 'Edit Daily Entry' : 'Add Daily Record'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label htmlFor="daily-record-date" className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Record Date</span>
            </label>
            <input
              id="daily-record-date"
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <div className="text-[11px] text-slate-500">
              Generated set for this date: <span className="text-indigo-300 font-mono">{currentFormGeneratedPairs.join(', ')}</span>
            </div>
          </div>

          {/* 4 Market 2-digit inputs */}
          <div className="grid grid-cols-2 gap-3">
            {/* Deshawar */}
            <div className="space-y-1">
              <label htmlFor="input-deshawar" className="text-[11px] font-semibold text-slate-400">
                Deshawar (00–99)
              </label>
              <input
                id="input-deshawar"
                type="text"
                maxLength={2}
                placeholder="03"
                value={deshawar}
                onChange={(e) => setDeshawar(sanitizePairInput(e.target.value))}
                className="w-full bg-slate-950 text-white font-mono font-bold text-center text-sm py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              {deshawar.length === 2 && (
                <div className="text-[10px] font-medium flex items-center gap-1">
                  {currentFormGeneratedPairs.includes(deshawar) ? (
                    <span className="text-indigo-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Generated Match
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <XCircle className="w-2.5 h-2.5" /> Not in Set
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Faridabad */}
            <div className="space-y-1">
              <label htmlFor="input-faridabad" className="text-[11px] font-semibold text-slate-400">
                Faridabad (00–99)
              </label>
              <input
                id="input-faridabad"
                type="text"
                maxLength={2}
                placeholder="47"
                value={faridabad}
                onChange={(e) => setFaridabad(sanitizePairInput(e.target.value))}
                className="w-full bg-slate-950 text-white font-mono font-bold text-center text-sm py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              {faridabad.length === 2 && (
                <div className="text-[10px] font-medium flex items-center gap-1">
                  {currentFormGeneratedPairs.includes(faridabad) ? (
                    <span className="text-indigo-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Generated Match
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <XCircle className="w-2.5 h-2.5" /> Not in Set
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Gali */}
            <div className="space-y-1">
              <label htmlFor="input-gali" className="text-[11px] font-semibold text-slate-400">
                Gali (00–99)
              </label>
              <input
                id="input-gali"
                type="text"
                maxLength={2}
                placeholder="90"
                value={gali}
                onChange={(e) => setGali(sanitizePairInput(e.target.value))}
                className="w-full bg-slate-950 text-white font-mono font-bold text-center text-sm py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              {gali.length === 2 && (
                <div className="text-[10px] font-medium flex items-center gap-1">
                  {currentFormGeneratedPairs.includes(gali) ? (
                    <span className="text-indigo-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Generated Match
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <XCircle className="w-2.5 h-2.5" /> Not in Set
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Ghaziabad */}
            <div className="space-y-1">
              <label htmlFor="input-ghaziabad" className="text-[11px] font-semibold text-slate-400">
                Ghaziabad (00–99)
              </label>
              <input
                id="input-ghaziabad"
                type="text"
                maxLength={2}
                placeholder="18"
                value={ghaziabad}
                onChange={(e) => setGhaziabad(sanitizePairInput(e.target.value))}
                className="w-full bg-slate-950 text-white font-mono font-bold text-center text-sm py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              {ghaziabad.length === 2 && (
                <div className="text-[10px] font-medium flex items-center gap-1">
                  {currentFormGeneratedPairs.includes(ghaziabad) ? (
                    <span className="text-indigo-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Generated Match
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <XCircle className="w-2.5 h-2.5" /> Not in Set
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes input */}
          <div className="space-y-1">
            <label htmlFor="daily-record-notes" className="text-[11px] font-medium text-slate-300">
              Notes / Observation (Optional)
            </label>
            <input
              id="daily-record-notes"
              type="text"
              placeholder="e.g. Standard August cycle observation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            id="btn-save-daily-record"
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{editingId ? 'Update Record' : 'Save Daily Record'}</span>
          </button>
        </form>

        {/* Existing Records Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Saved Historical Records ({filteredRecords.length})
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {onClearAllRecords && records.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAllRecords}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-700/70 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 text-[11px] font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All
                </button>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search date, pair or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 w-full sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 bg-slate-950 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2 text-center">Deshawar</th>
                  <th className="py-2.5 px-2 text-center">Faridabad</th>
                  <th className="py-2.5 px-2 text-center">Gali</th>
                  <th className="py-2.5 px-2 text-center">Ghaziabad</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((rec) => {
                    return (
                      <tr key={rec.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-2.5 px-3 font-mono font-medium text-white whitespace-nowrap">
                          {rec.date}
                        </td>

                        {/* Deshawar */}
                        <td className="py-2.5 px-2 text-center">
                          {rec.deshawar ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${
                                checkMatchStatus(rec.date, rec.deshawar)?.isMatch
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-slate-950 text-slate-300'
                              }`}
                              title={checkMatchStatus(rec.date, rec.deshawar)?.label}
                            >
                              {rec.deshawar}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Faridabad */}
                        <td className="py-2.5 px-2 text-center">
                          {rec.faridabad ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${
                                checkMatchStatus(rec.date, rec.faridabad)?.isMatch
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-slate-950 text-slate-300'
                              }`}
                              title={checkMatchStatus(rec.date, rec.faridabad)?.label}
                            >
                              {rec.faridabad}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Gali */}
                        <td className="py-2.5 px-2 text-center">
                          {rec.gali ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${
                                checkMatchStatus(rec.date, rec.gali)?.isMatch
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-slate-950 text-slate-300'
                              }`}
                              title={checkMatchStatus(rec.date, rec.gali)?.label}
                            >
                              {rec.gali}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Ghaziabad */}
                        <td className="py-2.5 px-2 text-center">
                          {rec.ghaziabad ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${
                                checkMatchStatus(rec.date, rec.ghaziabad)?.isMatch
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-slate-950 text-slate-300'
                              }`}
                              title={checkMatchStatus(rec.date, rec.ghaziabad)?.label}
                            >
                              {rec.ghaziabad}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-400 max-w-[140px] truncate text-[11px]">
                          {rec.notes || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEvaluateHistoricalRecord(rec)}
                              className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono flex items-center gap-1 transition"
                              title="Audit Performance Log & ML Assessment for this draw"
                            >
                              <Bot className="w-3 h-3 text-cyan-400" />
                              <span className="hidden sm:inline">Assess ML</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(rec)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition"
                              title="Edit record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(rec.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      No records match your query. Use the form to record daily observations or load demo datasets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
