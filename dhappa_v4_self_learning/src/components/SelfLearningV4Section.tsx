import React, { useMemo, useState } from 'react';
import { BrainCircuit, ShieldCheck, Trophy, RefreshCw, Target, Activity, AlertTriangle } from 'lucide-react';
import type { DayMarketEntry } from '../types';
import { predictWithV4, type V4Market, type V4TrainingReport } from '../v4/selfLearningCore';
import { trainV4OffMainThread } from '../utils/v4TrainingWorkerClient';

interface Props { records: DayMarketEntry[]; selectedDate: string; }
const markets: V4Market[] = ['deshawar','faridabad','gali','ghaziabad'];

export function SelfLearningV4Section({ records, selectedDate }: Props) {
  const [report, setReport] = useState<V4TrainingReport | null>(() => {
    try {
      const cached = localStorage.getItem('dhappa.v4.latestTraining');
      return cached ? JSON.parse(cached) as V4TrainingReport : null;
    } catch { return null; }
  });
  const [market, setMarket] = useState<V4Market>('deshawar');
  const [running, setRunning] = useState(false);

  const prediction = useMemo(() => report ? predictWithV4(records, selectedDate, market, report) : null, [records, selectedDate, market, report]);

  const runTraining = async () => {
    setRunning(true);
    try {
      const next = await trainV4OffMainThread(records);
      setReport(next);
      try { localStorage.setItem('dhappa.v4.latestTraining', JSON.stringify(next)); } catch { /* optional cache */ }
    } catch (error) {
      console.warn('V4 worker training failed:', error);
    } finally {
      setRunning(false);
    }
  };

  const m = report?.champion.holdout;
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300"><BrainCircuit size={22}/><span className="font-semibold">DHAPPA V4 Self-Learning Lab</span></div>
            <h2 className="mt-2 text-2xl font-bold text-white">Champion–Challenger Prediction Framework</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">Continuously learns from completed draws, protects future dates from leakage, and promotes only models that improve protected forward metrics.</p>
          </div>
          <button onClick={runTraining} disabled={running || records.length < 50} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
            <RefreshCw size={17} className={running ? 'animate-spin' : ''}/>{running ? 'Training…' : 'Train & Verify'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Top-5 Holdout" value={m ? `${m.top5.toFixed(2)}%` : '—'} baseline="Random 5%"/>
        <Metric title="Top-10 Holdout" value={m ? `${m.top10.toFixed(2)}%` : '—'} baseline="Random 10%"/>
        <Metric title="Top-20 Holdout" value={m ? `${m.top20.toFixed(2)}%` : '—'} baseline="Random 20%"/>
        <Metric title="Mean Rank" value={m ? m.meanRank.toFixed(2) : '—'} baseline="Random ≈ 50.5"/>
      </div>

      {report && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-emerald-300"><Trophy size={18}/><b>Current Champion</b></div>
              <div className="text-xl font-bold text-white">{report.champion.label}</div>
              <div className="mt-1 text-sm text-slate-400">Objective score {report.champion.objectiveScore.toFixed(3)} · {report.champion.evidence.replaceAll('_',' ')}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {(Object.entries(report.champion.byMarket) as Array<[V4Market, V4TrainingReport['champion']['holdout']]>).map(([mk,v]) => <div key={mk} className="rounded-xl bg-slate-950 p-3"><div className="capitalize text-slate-400">{mk}</div><div className="font-semibold text-white">Top-10 {v.top10.toFixed(2)}%</div></div>)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-cyan-300"><ShieldCheck size={18}/><b>Integrity Contract</b></div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>✓ Target/future rows excluded before feature generation.</li>
                <li>✓ Prediction is frozen before actual draw is used for learning.</li>
                <li>✓ Four markets learn separate feature weights.</li>
                <li>✓ Final 20% history remains a protected holdout during comparison.</li>
                <li>✓ Weak challengers are rejected instead of inflating confidence.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white"><Target size={18}/><b>Forward Ranking for {selectedDate}</b></div>
              <select value={market} onChange={e=>setMarket(e.target.value as V4Market)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                {markets.map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
            {prediction && <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><div className="text-xs uppercase tracking-wide text-slate-500">Top 10</div><div className="mt-2 flex flex-wrap gap-2">{prediction.top10.map((p,i)=><span key={p} className="rounded-lg bg-cyan-500/10 px-3 py-2 font-mono font-bold text-cyan-200">#{i+1} {p}</span>)}</div></div>
              <div><div className="text-xs uppercase tracking-wide text-slate-500">Learned weights</div><div className="mt-2 grid grid-cols-2 gap-2 text-xs">{(Object.entries(prediction.weights) as Array<[string, number]>).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div key={k} className="flex justify-between rounded-lg bg-slate-950 px-3 py-2 text-slate-300"><span>{k}</span><b>{(v*100).toFixed(1)}%</b></div>)}</div></div>
            </div>}
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
            <div className="flex gap-2"><AlertTriangle size={18} className="mt-0.5 shrink-0"/><div><b>Objective definition:</b> the platform maximizes verified forward Top-K hit rate and stability. It does not represent historical fit as a guaranteed probability. Exact 100% forecasting would require outputting all 100 outcomes, which is coverage rather than prediction.</div></div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ title, value, baseline }: { title: string; value: string; baseline: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Activity size={14}/>{title}</div><div className="mt-2 text-2xl font-bold text-white">{value}</div><div className="text-xs text-slate-500">{baseline}</div></div>;
}
