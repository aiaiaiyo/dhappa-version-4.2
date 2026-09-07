import React, { useEffect, useState } from 'react';

type Tier = { hits: number; rate: number; random_baseline: number; lift: number; p_value: number };
type Summary = { n: number; mean_rank: number; top5: Tier; top10: Tier; top20: Tier; top36: Tier };
type Report = {
  dataset: { rows: number; date_min: string; date_max: string; markets: string[]; missing: Record<string, number> };
  method: string;
  pooled: Summary;
  markets: Record<string, { summary: Summary }>;
};

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export function RationalMLAuditSection() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let alive = true;
    fetch('/data/ml_walkforward_report.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((j) => { if (alive) setReport(j); })
      .catch((e) => { if (alive) setError(String(e)); });
    return () => { alive = false; };
  }, []);

  if (error) return <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-200">ML audit could not load: {error}</div>;
  if (!report) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-300">Loading rational walk-forward audit…</div>;

  const tiers: Array<[string, Tier]> = [['Top 5', report.pooled.top5], ['Top 10', report.pooled.top10], ['Top 20', report.pooled.top20], ['Top 36', report.pooled.top36]];
  const credible = tiers.some(([, t]) => t.p_value < 0.05 && t.rate > t.random_baseline);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">V3 Scientific Validation</div>
            <h2 className="mt-1 text-2xl font-black text-white">Rational ML & Zero-Lookahead Walk-Forward Audit</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${credible ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
            {credible ? 'OUT-OF-SAMPLE EDGE DETECTED' : 'NO DEMONSTRATED POOLED EDGE'}
          </span>
        </div>
        <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-300">{report.method}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Rows" value={String(report.dataset.rows)} />
          <Metric label="Walk-forward predictions" value={String(report.pooled.n)} />
          <Metric label="Mean actual rank" value={report.pooled.mean_rank.toFixed(2)} />
          <Metric label="Date range" value={`${report.dataset.date_min} → ${report.dataset.date_max}`} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map(([name, t]) => <TierCard key={name} name={name} tier={t} />)}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <h3 className="font-bold text-white">Market-by-market out-of-sample comparison</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Market</th><th className="p-2">N</th><th className="p-2">Mean rank</th><th className="p-2">Top 5</th><th className="p-2">Top 10</th><th className="p-2">Top 20</th><th className="p-2">Top 36</th></tr></thead>
            <tbody>
              {(Object.entries(report.markets) as Array<[string, { summary: Summary }]>).map(([market, x]) => <tr key={market} className="border-t border-slate-800 text-slate-300"><td className="p-2 font-semibold text-white">{market}</td><td className="p-2">{x.summary.n}</td><td className="p-2">{x.summary.mean_rank.toFixed(2)}</td><td className="p-2">{pct(x.summary.top5.rate)}</td><td className="p-2">{pct(x.summary.top10.rate)}</td><td className="p-2">{pct(x.summary.top20.rate)}</td><td className="p-2">{pct(x.summary.top36.rate)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5 text-sm leading-6 text-amber-100">
        <strong>Interpretation:</strong> fitted historical patterns are not automatically predictive. V3 should promote an engine only when a zero-lookahead result beats its matching random baseline with adequate sample size and survives repeated testing. With the supplied 230-row dataset, the pooled ML ranking does not currently satisfy that standard.
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 font-mono text-sm font-bold text-slate-100">{value}</div></div>;
}
function TierCard({ name, tier }: { name: string; tier: Tier; key?: React.Key }) {
  const delta = tier.rate - tier.random_baseline;
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">{name}</div><div className="mt-2 text-3xl font-black text-white">{pct(tier.rate)}</div><div className="mt-2 text-xs text-slate-400">Baseline {pct(tier.random_baseline)} · {tier.hits} hits</div><div className={`mt-3 text-sm font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Δ {(delta * 100).toFixed(2)} pp · p={tier.p_value.toFixed(3)}</div></div>;
}
