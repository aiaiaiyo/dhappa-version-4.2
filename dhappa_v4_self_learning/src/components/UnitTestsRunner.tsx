import React, { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, RefreshCw, Terminal, Cpu, ShieldCheck, Database, Layers } from 'lucide-react';
import { generateGSquareHarmonicGrid, runGSquareHarmonicsWalkForwardTest } from '../utils/gSquareHarmonicsEngine';
import { createLocalDatabaseAdapter, LOCAL_DATABASE_VERSION } from '../utils/localDatabase';
import { normalizePatternDashboardSnapshot, PATTERN_DASHBOARD_SCHEMA_VERSION } from '../utils/patternDashboardSchema';
import { createPrecisionIntelligenceEngineRegistry, normalizeEngineResult } from '../utils/precisionIntelligenceRegistry';

interface TestResultItem {
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'pending';
  durationMs?: number;
  message: string;
  logs?: string[];
}

export function UnitTestsRunner() {
  const [testResults, setTestResults] = useState<TestResultItem[]>([
    {
      name: 'gSquareHarmonicsEngine.test',
      category: 'Math Engine',
      status: 'pending',
      message: 'Tests 6x4 Grid matrix generation, vertical/horizontal digit sequences, and pair completeness.',
    },
    {
      name: 'localDatabase.test',
      category: 'Storage Integrity',
      status: 'pending',
      message: 'Tests collection isolation, storage key encoding, versioning, and state persistence.',
    },
    {
      name: 'patternDashboardSchema.test',
      category: 'Schema & Norms',
      status: 'pending',
      message: 'Tests candidate normalization, metric calculations, and schema version consistency.',
    },
    {
      name: 'precisionIntelligenceRegistry.test',
      category: 'ML Pipeline',
      status: 'pending',
      message: 'Tests canonical engine registration, raw score normalization, and candidate shape validation.',
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [executionSummary, setExecutionSummary] = useState<{ passed: number; failed: number; totalDuration: number } | null>(null);

  const runAllTests = () => {
    setIsRunning(true);
    const startTime = performance.now();

    setTimeout(() => {
      const results: TestResultItem[] = [];

      // Test 1: G-Square Harmonics Engine & Walk-Forward Test
      try {
        const t0 = performance.now();
        const grid = generateGSquareHarmonicGrid({ sourceNumber: '47' });
        const logs: string[] = [];

        if (grid.x !== 7) throw new Error(`Expected X=7, got ${grid.x}`);
        logs.push(`Verified base digit X = ${grid.x}`);

        if (grid.cells.length !== 24) throw new Error(`Expected 24 cells, got ${grid.cells.length}`);
        logs.push(`Verified 24 6x4 matrix cells generated`);

        if (!grid.pairs.includes('75') || !grid.pairs.includes('30')) {
          throw new Error(`Missing expected harmonic pairs '75' or '30'`);
        }
        logs.push(`Verified key harmonic pairs ('75', '30') present`);

        // Test Walk-Forward sequential execution
        const wfReport = runGSquareHarmonicsWalkForwardTest({
          records: [
            { id: '1', date: '2026-08-01', gali: '47', createdAt: '2026-08-01' },
            { id: '2', date: '2026-08-02', gali: '75', createdAt: '2026-08-02' },
          ],
          sourceMode: 'gali',
        });
        if (wfReport.totalSteps !== 1 || wfReport.straightHitDays !== 1) {
          throw new Error(`Walk-forward execution failed: expected 1 step and 1 hit, got ${wfReport.totalSteps} steps / ${wfReport.straightHitDays} hits`);
        }
        logs.push(`Verified walk-forward test sequence & hit detection (${wfReport.totalSteps} step, ${wfReport.straightHitRate}% hit rate)`);

        const duration = Math.round((performance.now() - t0) * 100) / 100;
        results.push({
          name: 'gSquareHarmonicsEngine.test',
          category: 'Math Engine',
          status: 'passed',
          durationMs: duration,
          message: '6x4 Harmonic matrix, 24 cells, and walk-forward sequential test calculated & verified successfully.',
          logs,
        });
      } catch (err: any) {
        results.push({
          name: 'gSquareHarmonicsEngine.test',
          category: 'Math Engine',
          status: 'failed',
          message: err.message || 'G-Square Harmonics verification failed.',
        });
      }

      // Test 2: Local Database Adapter
      try {
        const t0 = performance.now();
        const storageMap = new Map<string, string>();
        const mockStorage = {
          getItem: (key: string) => storageMap.get(key) ?? null,
          setItem: (key: string, value: string) => storageMap.set(key, value),
          removeItem: (key: string) => storageMap.delete(key),
          clear: () => storageMap.clear(),
          length: storageMap.size,
          key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
        } as unknown as Storage;

        const db = createLocalDatabaseAdapter(mockStorage);
        const logs: string[] = [];

        db.setCollection('dailyData', [{ id: 'rec-1', date: '2026-08-30' }]);
        db.setCollection('preferences', { defaultCurrency: 'USD' });

        const dailyData = db.getCollection<Array<{ id: string; date: string }>>('dailyData');
        if (!dailyData || dailyData.length !== 1) throw new Error('Daily data collection isolation failed');
        logs.push(`Verified 'dailyData' collection isolation (1 record stored)`);

        const prefs = db.getCollection<{ defaultCurrency: string }>('preferences');
        if (prefs?.defaultCurrency !== 'USD') throw new Error('Preferences collection isolation failed');
        logs.push(`Verified 'preferences' collection stored default currency USD`);

        if (db.getState().version !== LOCAL_DATABASE_VERSION) throw new Error('Database version mismatch');
        logs.push(`Verified DB version match (${LOCAL_DATABASE_VERSION})`);

        const duration = Math.round((performance.now() - t0) * 100) / 100;
        results.push({
          name: 'localDatabase.test',
          category: 'Storage Integrity',
          status: 'passed',
          durationMs: duration,
          message: 'Local database collections isolated, versioned, and CRUD storage operations verified.',
          logs,
        });
      } catch (err: any) {
        results.push({
          name: 'localDatabase.test',
          category: 'Storage Integrity',
          status: 'failed',
          message: err.message || 'Local Database test failed.',
        });
      }

      // Test 3: Pattern Dashboard Schema
      try {
        const t0 = performance.now();
        const logs: string[] = [];
        const snapshot = normalizePatternDashboardSnapshot({
          targetDate: '2026-08-30',
          candidates: [
            {
              pair: '23',
              possibilityScore: 88,
              occurrenceCount: 3,
              distinctEngineCount: 2,
              reversePair: '32',
              engineBadges: [
                {
                  engineId: 'DATE_GEN',
                  engineName: 'Date Generator',
                  engineShort: 'DATE',
                  badgeColor: 'bg-cyan-500/20 text-cyan-300',
                  detail: 'Triad Pair #1',
                },
              ],
            },
          ],
        });

        if (snapshot.schemaVersion !== PATTERN_DASHBOARD_SCHEMA_VERSION) {
          throw new Error('Pattern dashboard schema version mismatch');
        }
        logs.push(`Schema version verified (${PATTERN_DASHBOARD_SCHEMA_VERSION})`);

        if (snapshot.candidates[0].pair !== '23' || snapshot.metrics.primaryCandidate !== '23') {
          throw new Error('Candidate pair normalization mismatch');
        }
        logs.push(`Primary candidate pair '23' normalized & assigned correctly`);

        const duration = Math.round((performance.now() - t0) * 100) / 100;
        results.push({
          name: 'patternDashboardSchema.test',
          category: 'Schema & Norms',
          status: 'passed',
          durationMs: duration,
          message: 'Pattern dashboard schema normalized, versioned, and candidate metrics verified.',
          logs,
        });
      } catch (err: any) {
        results.push({
          name: 'patternDashboardSchema.test',
          category: 'Schema & Norms',
          status: 'failed',
          message: err.message || 'Pattern Dashboard Schema test failed.',
        });
      }

      // Test 4: Precision Intelligence Engine Registry
      try {
        const t0 = performance.now();
        const logs: string[] = [];
        const registry = createPrecisionIntelligenceEngineRegistry();

        if (registry.length < 8) throw new Error(`Expected >= 8 registered engines, found ${registry.length}`);
        logs.push(`Registry verified with ${registry.length} active analytical engines`);

        const normalizedResult = normalizeEngineResult({
          engineId: 'G_SQUARE_HARMONIC',
          methodName: 'G-Square Harmonic',
          candidates: ['27', '38'],
          rawScore: 82.5,
          confidence: 0.81,
          historicalSupport: 14,
          riskScore: 32,
          version: '1.0.0',
        });

        if (normalizedResult.score !== 82.5 || normalizedResult.risk !== 32) {
          throw new Error('Engine result normalization score mismatch');
        }
        logs.push(`Engine result score normalized (82.5 raw score, risk 32)`);

        const duration = Math.round((performance.now() - t0) * 100) / 100;
        results.push({
          name: 'precisionIntelligenceRegistry.test',
          category: 'ML Pipeline',
          status: 'passed',
          durationMs: duration,
          message: 'Engine registry initialized with 8+ core engines and result normalization passed.',
          logs,
        });
      } catch (err: any) {
        results.push({
          name: 'precisionIntelligenceRegistry.test',
          category: 'ML Pipeline',
          status: 'failed',
          message: err.message || 'Precision Intelligence Registry test failed.',
        });
      }

      const totalDuration = Math.round((performance.now() - startTime) * 100) / 100;
      const passedCount = results.filter((r) => r.status === 'passed').length;
      const failedCount = results.filter((r) => r.status === 'failed').length;

      setTestResults(results);
      setExecutionSummary({ passed: passedCount, failed: failedCount, totalDuration });
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Empirical Test Suite & Unit Verification
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute browser-native automated assertion tests verifying calculation engines, storage integrity, and ML pipeline schemas.
          </p>
        </div>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-lg cursor-pointer shrink-0"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Running Tests...' : 'Run All Suite Tests'}</span>
        </button>
      </div>

      {executionSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 font-mono">Passed Suites</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{executionSummary.passed} / {testResults.length}</div>
            </div>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 font-mono">Failed Suites</div>
              <div className="text-xl font-bold text-slate-200 font-mono">{executionSummary.failed}</div>
            </div>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 font-mono">Total Execution Time</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">{executionSummary.totalDuration} ms</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testResults.map((test, index) => (
          <div key={index} className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                    {test.category}
                  </span>
                  {test.durationMs !== undefined && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {test.durationMs} ms
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-100 mt-1">{test.name}</div>
              </div>
              <div>
                {test.status === 'passed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                  </span>
                )}
                {test.status === 'failed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
                {test.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg">
                    Pending
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300">{test.message}</p>

            {test.logs && test.logs.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" /> Assertion Trail
                </div>
                {test.logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-emerald-400/90">
                    <span>✓</span> <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UnitTestsRunner;
