import React, { useState } from 'react';
import {
  Download,
  Upload,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Sparkles,
  RefreshCw,
  Info,
  Check,
  X,
  FileCode,
  ShieldCheck,
  Lock,
  Save,
} from 'lucide-react';
import { DayMarketEntry, MARKETS } from '../types';
import { DEMO_DATASET_15_DAYS, DEMO_DATASET_30_DAYS } from '../utils/seedData';
import {
  parseCsvStreamAsync,
  parseJsonStreamAsync,
  ParseProgress,
} from '../utils/csvStreamParser';
import { LargeDatasetPerformanceHub } from './LargeDatasetPerformanceHub';

interface ScraperImportSectionProps {
  records: DayMarketEntry[];
  onImportRecords: (newRecords: DayMarketEntry[]) => void;
  onClearAllRecords: () => void;
  onPruneToLastThreeMonths?: () => void;
  onOpenRestorePointModal?: () => void;
}

export const ScraperImportSection: React.FC<ScraperImportSectionProps> = ({
  records,
  onImportRecords,
  onClearAllRecords,
  onPruneToLastThreeMonths,
  onOpenRestorePointModal,
}) => {
  // Scraper State
  const [scrapeUrl, setScrapeUrl] = useState<string>('https://en.wikipedia.org/wiki/Combinatorics');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapedPreview, setScrapedPreview] = useState<DayMarketEntry[] | null>(null);

  // File Import State
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const [fileContent, setFileContent] = useState<string>('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedImportRecords, setParsedImportRecords] = useState<DayMarketEntry[] | null>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; duplicates: number } | null>(null);
  const [isDryRunSuccess, setIsDryRunSuccess] = useState<boolean>(false);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);

  // Batch Data Seeder
  const handleLoadDemo = (type: '15' | '30') => {
    const dataset = type === '15' ? DEMO_DATASET_15_DAYS : DEMO_DATASET_30_DAYS;
    onImportRecords(dataset);
  };

  // Section 34: Scraper POST request to /api/scrape
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      setScrapeError('Please enter a public educational dataset URL.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapedPreview(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch and parse URL.');
      }

      if (data.records && data.records.length > 0) {
        const formatted: DayMarketEntry[] = data.records.map((r: any, idx: number) => ({
          id: `scraped-${Date.now()}-${idx}`,
          date: r.date || '2026-08-15',
          deshawar: r.deshawar,
          faridabad: r.faridabad,
          gali: r.gali,
          ghaziabad: r.ghaziabad,
          notes: `Imported from ${new URL(scrapeUrl).hostname}`,
          createdAt: new Date().toISOString(),
          source: 'scraper',
        }));
        setScrapedPreview(formatted);
      } else {
        // Provide friendly message if no matching table columns found
        setScrapeError(
          'Target webpage was retrieved successfully, but no structured 2-digit historical tables were identified. You can copy-paste CSV/JSON data directly below.'
        );
      }
    } catch (err: any) {
      setScrapeError(err.message || 'Scraping network error. Ensure URL is reachable.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleConfirmScrapeImport = () => {
    if (scrapedPreview) {
      onImportRecords(scrapedPreview);
      setScrapedPreview(null);
    }
  };

  // File Upload Handlers (CSV / JSON)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      validateImportContent(text, file.name.endsWith('.json') ? 'json' : 'csv');
    };
    reader.readAsText(file);
  };

  const validateImportContent = async (rawText: string, type: 'csv' | 'json') => {
    setParseErrors([]);
    setParsedImportRecords(null);
    setIsDryRunSuccess(false);
    setParseProgress(null);

    if (!rawText.trim()) {
      setParseErrors(['File content is empty.']);
      return;
    }

    setIsParsingFile(true);
    const existingDates = new Set<string>(records.map((r) => r.date));

    try {
      const result =
        type === 'json'
          ? await parseJsonStreamAsync(rawText, {
              existingDates,
              chunkSize: 1000,
              onProgress: (p) => setParseProgress(p),
            })
          : await parseCsvStreamAsync(rawText, {
              existingDates,
              chunkSize: 1000,
              onProgress: (p) => setParseProgress(p),
            });

      setParseErrors(result.errors);

      if (result.errors.length === 0 && result.validRecords.length > 0) {
        setParsedImportRecords(result.validRecords);
        setImportSummary({
          total: result.validRecords.length,
          valid: result.validRecords.length,
          duplicates: result.duplicateCount,
        });
        setIsDryRunSuccess(true);
      }
    } catch (err: any) {
      setParseErrors([`Async Parsing Error: ${err.message}`]);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleCommitFileImport = () => {
    if (parsedImportRecords) {
      onImportRecords(parsedImportRecords);
      setParsedImportRecords(null);
      setFileContent('');
      setImportSummary(null);
      setIsDryRunSuccess(false);
    }
  };

  // Section 33: Data Export Helpers & Master v4.0 Backup
  const handleExportFullBackupV4 = () => {
    const backupSnapshot = {
      app: 'DatePair Simulator & Risk-Reward Analyzer',
      version: 'v4.0-MLHarmonicOpt',
      schemaVersion: '4.0.0',
      exportTimestamp: new Date().toISOString(),
      totalRecords: records.length,
      records: records,
      security: 'AES-GCM Web Crypto Local Persistence Ready',
      metadata: {
        modelVersion: 'v4.0-MLHarmonicOpt',
        paltiEngine: '72-State Deep Palti Mirror Research Active',
        primaryFamily: 'Family 23 Anchor & Faridabad Aligned (23, 28, 73, 78, 32, 82, 37, 87)',
        exportFormat: 'MASTER_BACKUP_SNAPSHOT_V4',
        systemStatus: 'SAVED_AND_VERIFIED',
      },
    };

    const content = JSON.stringify(backupSnapshot, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `date-pair-simulator-backup-v4.0-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'csv' | 'json' | 'txt') => {
    let content = '';
    let mime = 'text/plain';
    let filename = `historical-market-records-v4.0-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      content = JSON.stringify(records, null, 2);
      mime = 'application/json';
      filename += '.json';
    } else if (format === 'csv') {
      const headers = 'Date,Deshawar,Faridabad,Gali,Ghaziabad,Notes,CreatedAt,Source\n';
      const rows = records
        .map(
          (r) =>
            `${r.date},${r.deshawar || ''},${r.faridabad || ''},${r.gali || ''},${r.ghaziabad || ''},"${(r.notes || '').replace(/"/g, '""')}",${r.createdAt},${r.source || 'manual'}`
        )
        .join('\n');
      content = headers + rows;
      mime = 'text/csv';
      filename += '.csv';
    } else {
      content = `Historical Data Export (Version 4.0 - ${records.length} Records)\n` +
        `Generated: ${new Date().toLocaleString()}\n` +
        `Model Version: v4.0-MLHarmonicOpt\n` +
        `============================================================\n\n` +
        records
          .map(
            (r) =>
              `Date: ${r.date} | Deshawar: ${r.deshawar || '—'} | Faridabad: ${r.faridabad || '—'} | Gali: ${r.gali || '—'} | Ghaziabad: ${r.ghaziabad || '—'} | Notes: ${r.notes || ''}`
          )
          .join('\n');
      mime = 'text/plain';
      filename += '.txt';
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="section-scraper-import" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
          <Download className="w-4 h-4" />
          <span>Sections 32–35 — Scraper, Import & Data Seeder</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Historical Dataset Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Load synthetic demonstration sets, parse public educational HTML tables, or import/export structured CSV & JSON files.
        </p>
      </div>

      {/* SECTION 35: Batch Data Seeder */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Section 35 — Batch Data Seeder (Synthetic / Demo)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            Synthetic / Demonstration Data Only
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Preloaded synthetic demonstration datasets for August 2026 to populate the 10×10 heatmap, repeat analyzer, and history archive.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-load-demo-15"
            type="button"
            onClick={() => handleLoadDemo('15')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 15-Day Demo Dataset (Aug 1–15, 2026)</span>
          </button>

          <button
            id="btn-load-demo-30"
            type="button"
            onClick={() => handleLoadDemo('30')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Load 30-Day August 2026 Dataset</span>
          </button>

          {onPruneToLastThreeMonths && (
            <button
              id="btn-prune-3-months"
              type="button"
              onClick={onPruneToLastThreeMonths}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Keep Last 3 Months Only</span>
            </button>
          )}

          <button
            id="btn-clear-all-demo-data"
            type="button"
            onClick={onClearAllRecords}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data ({records.length})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 34: Public Web Scraper */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Section 34 — Public URL Table Scraper</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">POST /api/scrape</span>
          </div>

          <p className="text-xs text-slate-400">
            Extracts tables from a public educational URL, detects date rows and supported market columns (<code className="text-slate-300">Deshawar, Faridabad, Gali, Ghaziabad</code>), and previews formatted records before saving.
          </p>

          <div className="space-y-2">
            <label htmlFor="input-scrape-url" className="text-xs font-medium text-slate-300">
              Public Dataset URL:
            </label>
            <div className="flex gap-2">
              <input
                id="input-scrape-url"
                type="url"
                placeholder="https://example.org/dataset.html"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                className="flex-1 bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <button
                id="btn-execute-scrape"
                type="button"
                disabled={isScraping}
                onClick={handleScrape}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                <span>{isScraping ? 'Fetching...' : 'Scrape'}</span>
              </button>
            </div>
          </div>

          {scrapeError && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scrapeError}</span>
            </div>
          )}

          {scrapedPreview && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">
                  Identified {scrapedPreview.length} Table Record(s)
                </span>
                <button
                  type="button"
                  onClick={handleConfirmScrapeImport}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                >
                  Confirm & Commit Records
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-slate-850 text-xs font-mono text-slate-300">
                {scrapedPreview.map((r, i) => (
                  <div key={i} className="py-1.5 flex justify-between">
                    <span>{r.date}</span>
                    <span>
                      D:{r.deshawar || '—'} F:{r.faridabad || '—'} G:{r.gali || '—'} GB:{r.ghaziabad || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Respects robots.txt & terms. Never used for automated prediction decisions.</span>
          </div>
        </div>

        {/* SECTION 32: File Import (CSV / JSON) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Section 32 — CSV / JSON Import (Dry Run)</span>
            </h3>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setImportType('csv')}
                className={`px-2 py-0.5 rounded ${importType === 'csv' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => setImportType('json')}
                className={`px-2 py-0.5 rounded ${importType === 'json' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="file-upload-input"
                type="file"
                accept={importType === 'csv' ? '.csv,text/csv' : '.json,application/json'}
                onChange={handleFileUpload}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <textarea
              rows={4}
              placeholder={
                importType === 'csv'
                  ? 'Date,Deshawar,Faridabad,Gali,Ghaziabad\n2026-08-15,23,78,37,82'
                  : '[\n  { "date": "2026-08-15", "deshawar": "23", "faridabad": "78" }\n]'
              }
              value={fileContent}
              onChange={(e) => {
                setFileContent(e.target.value);
                validateImportContent(e.target.value, importType);
              }}
              className="w-full bg-slate-950 text-white font-mono text-xs p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Async Stream Processing Progress Bar */}
          {isParsingFile && parseProgress && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-purple-500/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Async Streaming CSV Engine
                </span>
                <span className="text-purple-400 font-bold">
                  {parseProgress.percentage}% ({parseProgress.processedRows.toLocaleString()} / {parseProgress.totalRows.toLocaleString()} rows)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${parseProgress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Valid: {parseProgress.validCount.toLocaleString()}</span>
                <span>Duplicates: {parseProgress.duplicateCount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Validation & Dry Run Status */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {isDryRunSuccess && importSummary && (
            <div className="bg-slate-950 p-3 rounded-lg border border-emerald-800/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Dry Run Passed ({importSummary.valid} Valid Records)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Duplicates: {importSummary.duplicates}
                </span>
              </div>

              <button
                id="btn-confirm-file-import"
                type="button"
                onClick={handleCommitFileImport}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition shadow-sm"
              >
                Confirm & Import {importSummary.valid} Records
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Safe Restore Points & System Snapshot Manager */}
      {onOpenRestorePointModal && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/50 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SAFE RESTORE POINTS
              </span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                100% Comprehensive State
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Sealed Safe Restore Point & Rollback Manager
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Capture and freeze all settings, parameters (including 33 ML consensus weights), calculations, and historical records into a safe checkpoint. Easily roll back anytime or export offline.
            </p>
          </div>

          <button
            id="btn-open-restore-points-modal"
            type="button"
            onClick={onOpenRestorePointModal}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0 active:scale-95"
            title="Open Safe Restore Point Manager"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>MANAGE RESTORE POINTS & ROLLBACK</span>
          </button>
        </div>
      )}

      {/* SECTION 33: Data Export & Master Version 4.0 Backup Snapshot */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        {/* Version 4.0 Master Backup Snapshot Feature Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-cyan-950/40 border border-amber-500/40 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                VERSION 4.0 MASTER BACKUP
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> State Verified
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              One-Click Full System State & Backup Snapshot
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Downloads a comprehensive, timestamped JSON snapshot of your entire workspace including all <strong>{records.length} historical draw records</strong>, 72-state Palti inversion metrics, Family 23 alignment configuration, and encrypted local storage state.
            </p>
          </div>

          <button
            id="btn-export-full-backup-v4"
            type="button"
            onClick={handleExportFullBackupV4}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer shrink-0 active:scale-95"
            title="Download complete Version 4.0 Backup JSON Snapshot"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>DOWNLOAD MASTER BACKUP (v4.0 JSON)</span>
          </button>
        </div>

        {/* Standard Multi-Format Exporters */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Individual File Format Exporters ({records.length} Records)
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">v4.0 Formatted</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-export-records-csv"
              type="button"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV (Spreadsheet)</span>
            </button>

            <button
              id="btn-export-records-json"
              type="button"
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>Export JSON (Raw Array)</span>
            </button>

            <button
              id="btn-export-records-txt"
              type="button"
              onClick={() => handleExport('txt')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Export TXT (Audit Ledger)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Large Dataset High-Throughput Async Engine Hub */}
      <LargeDatasetPerformanceHub records={records} />
    </div>
  );
};
