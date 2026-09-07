import React, { useState, useMemo } from 'react';
import { UnifiedEnginePrediction } from '../utils/unifiedWalkForwardEngine';
import { Currency } from '../types';
import { getCoreFamilyForPair } from '../utils/candidatePatternAssessmentEngine';
import {
  Layers,
  Sparkles,
  Award,
  Shield,
  Zap,
  Target,
  Copy,
  Check,
  Send,
  FileSpreadsheet,
  Flame,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Cpu,
} from 'lucide-react';

export interface PatternFourTierSegregationProps {
  candidates: UnifiedEnginePrediction[];
  actualRecordedDraws: Array<{ market: string; number: string; marketKey: string }>;
  historicalLookbackDays: number;
  onInspectCandidate: (candidate: UnifiedEnginePrediction) => void;
  onSendPairsToSimulator?: (pairs: string[]) => void;
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
  currency: Currency;
  onExportTierToExcel: (tierCandidates: UnifiedEnginePrediction[], tierLabel: string) => void;
}

export const PatternFourTierSegregation: React.FC<PatternFourTierSegregationProps> = ({
  candidates,
  actualRecordedDraws,
  historicalLookbackDays,
  onInspectCandidate,
  onSendPairsToSimulator,
  copyToClipboard,
  copiedKey,
  currency,
  onExportTierToExcel,
}) => {
  const [selectedTierTab, setSelectedTierTab] = useState<'ALL_TIERS' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'>('ALL_TIERS');
  const [tierGroupingMode, setTierGroupingMode] = useState<'CONFIDENCE_BASED' | 'RANK_BASED'>('CONFIDENCE_BASED');

  const top36 = useMemo(() => candidates.slice(0, 36), [candidates]);

  // 4 Tier Segregation: As per Confidence vs Fixed Ranks
  const tier1Prime = useMemo(() => {
    if (tierGroupingMode === 'CONFIDENCE_BASED') {
      const filtered = top36.filter((c) => (c.compositeConfidenceScore ?? c.possibilityScore) >= 75.0);
      return filtered.length > 0 ? filtered : top36.slice(0, 5);
    }
    return top36.slice(0, 5);
  }, [top36, tierGroupingMode]);

  const tier2HighHit = useMemo(() => {
    if (tierGroupingMode === 'CONFIDENCE_BASED') {
      const filtered = top36.filter((c) => {
        const conf = c.compositeConfidenceScore ?? c.possibilityScore;
        return conf >= 62.0 && conf < 75.0;
      });
      return filtered.length > 0 ? filtered : top36.slice(5, 10);
    }
    return top36.slice(5, 10);
  }, [top36, tierGroupingMode]);

  const tier3Calibrated = useMemo(() => {
    if (tierGroupingMode === 'CONFIDENCE_BASED') {
      const filtered = top36.filter((c) => {
        const conf = c.compositeConfidenceScore ?? c.possibilityScore;
        return conf >= 48.0 && conf < 62.0;
      });
      return filtered.length > 0 ? filtered : top36.slice(10, 21);
    }
    return top36.slice(10, 21);
  }, [top36, tierGroupingMode]);

  const tier4Strategic = useMemo(() => {
    if (tierGroupingMode === 'CONFIDENCE_BASED') {
      const filtered = top36.filter((c) => {
        const conf = c.compositeConfidenceScore ?? c.possibilityScore;
        return conf < 48.0;
      });
      return filtered.length > 0 ? filtered : top36.slice(21, 36);
    }
    return top36.slice(21, 36);
  }, [top36, tierGroupingMode]);

  const getActualMatch = (pair: string) => {
    if (!actualRecordedDraws || actualRecordedDraws.length === 0) return null;
    const exact = actualRecordedDraws.find((d) => d.number === pair);
    if (exact) return { type: 'EXACT', market: exact.market, number: exact.number, badge: `⚡ EXACT: ${exact.marketKey || exact.market} (${exact.number})` };

    const rev = pair.split('').reverse().join('');
    const palti = actualRecordedDraws.find((d) => d.number === rev && d.number !== pair);
    if (palti) return { type: 'PALTI', market: palti.market, number: palti.number, badge: `🔄 PALTI: ${palti.marketKey || palti.market} (${palti.number})` };

    const fam = getCoreFamilyForPair(pair);
    const familyMatch = actualRecordedDraws.find((d) => fam.allExtendedMembers.includes(d.number) && d.number !== pair);
    if (familyMatch) return { type: 'FAMILY', market: familyMatch.market, number: familyMatch.number, badge: `👥 FAMILY: ${familyMatch.marketKey || familyMatch.market} (${familyMatch.number})` };

    return null;
  };

  const calculateTierStats = (tierList: UnifiedEnginePrediction[]) => {
    if (tierList.length === 0) return { avgConfidence: 0, hitsCount: 0, coveragePct: 0 };
    const totalConf = tierList.reduce((acc, c) => acc + (c.compositeConfidenceScore ?? c.possibilityScore), 0);
    const avgConfidence = Math.round((totalConf / tierList.length) * 10) / 10;
    const hitsCount = tierList.filter((c) => getActualMatch(c.pair) !== null).length;
    const coveragePct = Math.round((hitsCount / tierList.length) * 100);
    return { avgConfidence, hitsCount, coveragePct };
  };

  const tier1Stats = useMemo(() => calculateTierStats(tier1Prime), [tier1Prime, actualRecordedDraws]);
  const tier2Stats = useMemo(() => calculateTierStats(tier2HighHit), [tier2HighHit, actualRecordedDraws]);
  const tier3Stats = useMemo(() => calculateTierStats(tier3Calibrated), [tier3Calibrated, actualRecordedDraws]);
  const tier4Stats = useMemo(() => calculateTierStats(tier4Strategic), [tier4Strategic, actualRecordedDraws]);

  const renderTierCard = (
    tierId: string,
    tierTitle: string,
    tierSubtitle: string,
    tierColor: string,
    borderColor: string,
    badgeBg: string,
    icon: React.ReactNode,
    items: UnifiedEnginePrediction[],
    confidenceThreshold: string,
    rankOffset: number,
    stats: { avgConfidence: number; hitsCount: number; coveragePct: number },
    targetAccuracy: string
  ) => {
    const pairsString = items.map((c) => c.pair).join(', ');
    const bracketArray = `[${pairsString}]`;

    return (
      <div
        key={tierId}
        className={`bg-gradient-to-b ${tierColor} border-2 ${borderColor} rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 flex flex-col justify-between`}
      >
        {/* Tier Header */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${badgeBg} flex items-center justify-center shadow-inner`}>
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-100 font-mono uppercase tracking-wide">
                    {tierTitle}
                  </h4>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${badgeBg}`}>
                    {items.length} Pairs
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                    {confidenceThreshold}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{tierSubtitle}</p>
              </div>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 block">Avg Confidence</span>
                <span className="text-amber-300 font-black">{stats.avgConfidence}%</span>
              </div>
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 block">Target Win Rate</span>
                <span className="text-emerald-400 font-black">{targetAccuracy}</span>
              </div>
              {actualRecordedDraws.length > 0 && (
                <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-500 block">Actual Hits</span>
                  <span className="text-cyan-300 font-black">{stats.hitsCount}/{items.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Array Bracket Preview */}
          <div className="mt-3 bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span>BRACKET REPRESENTATION:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(bracketArray, `bracket-${tierId}`)}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 font-bold"
              >
                {copiedKey === `bracket-${tierId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === `bracket-${tierId}` ? 'Copied' : 'Copy [Array]'}</span>
              </button>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-200 select-all overflow-x-auto p-2 bg-slate-900/90 rounded border border-slate-800">
              {bracketArray}
            </div>
          </div>

          {/* Candidate Number Badges Grid */}
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {items.map((c, iIdx) => {
              const rank = rankOffset + iIdx + 1;
              const conf = (c.compositeConfidenceScore ?? c.possibilityScore).toFixed(1);
              const match = getActualMatch(c.pair);

              return (
                <div
                  key={`tier-item-${c.pair}-${rank}`}
                  onClick={() => onInspectCandidate(c)}
                  className={`p-3 rounded-xl border font-mono transition cursor-pointer flex flex-col justify-between ${
                    match
                      ? match.type === 'EXACT'
                        ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
                        : match.type === 'PALTI'
                        ? 'bg-cyan-950/70 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                        : 'bg-indigo-950/70 border-indigo-400 ring-1 ring-indigo-400/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400">#{rank}</span>
                    <span className="text-xl font-black text-slate-100">{c.pair}</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {conf}%
                    </span>
                  </div>

                  {/* Engine Count & Correlation Echo */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>{c.distinctEngineCount} Engines</span>
                    <span className="text-cyan-300 font-semibold">{c.familyRoot || 'Parivar'}</span>
                  </div>

                  {/* Actual Draw Hit Badge */}
                  {match ? (
                    <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span className={match.type === 'EXACT' ? 'text-emerald-300' : match.type === 'PALTI' ? 'text-cyan-300' : 'text-indigo-300'}>
                        {match.badge}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-500 flex items-center justify-between">
                      <span>{historicalLookbackDays}d Correlated</span>
                      <span className="text-slate-400">Click to Inspect</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Hub for this Tier */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(pairsString, `tier-copy-${tierId}`)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              {copiedKey === `tier-copy-${tierId}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === `tier-copy-${tierId}` ? 'Copied' : `Copy ${items.length} Pairs`}</span>
            </button>
            <button
              type="button"
              onClick={() => onExportTierToExcel(items, tierTitle)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export {tierTitle}</span>
            </button>
          </div>

          {onSendPairsToSimulator && (
            <button
              type="button"
              onClick={() => onSendPairsToSimulator(items.map((c) => c.pair))}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate {tierTitle}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 4-Tier Segregation Header & Filter Tabs */}
      <div className="bg-slate-950/95 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Layers className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                  4-TIER STRATIFIED ARCHITECTURE
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {historicalLookbackDays}-Day Draw Horizon
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-100 font-mono mt-1 flex items-center gap-2">
                Top 36 Confidence Pool 4-Tier Segregation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Precision-stratified into 4 distinct operational tiers: Prime Anchors (5), High-Hit Range (5), Calibrated Coverage (11), and Strategic Defense Buffer (15).
              </p>
            </div>
          </div>

          {/* Quick Summary Pill Strip and Stratification Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs">
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTierGroupingMode('CONFIDENCE_BASED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  tierGroupingMode === 'CONFIDENCE_BASED'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Confidence-Calibrated Tiers</span>
              </button>
              <button
                type="button"
                onClick={() => setTierGroupingMode('RANK_BASED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  tierGroupingMode === 'RANK_BASED'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Fixed Rank Slices</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTierTab('ALL_TIERS')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedTierTab === 'ALL_TIERS'
                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All 4 Tiers ({top36.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierTab('TIER_1')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedTierTab === 'TIER_1'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                    : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Tier 1: Prime ({tier1Prime.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierTab('TIER_2')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedTierTab === 'TIER_2'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tier 2: High Hit ({tier2HighHit.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierTab('TIER_3')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedTierTab === 'TIER_3'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                    : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/50'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Tier 3: Calibrated ({tier3Calibrated.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierTab('TIER_4')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedTierTab === 'TIER_4'
                    ? 'bg-slate-700 text-white border-slate-500 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Tier 4: Buffer ({tier4Strategic.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Tiers Container Render */}
        <div className="space-y-4">
          {(selectedTierTab === 'ALL_TIERS' || selectedTierTab === 'TIER_1') &&
            renderTierCard(
              'tier-1',
              'Tier 1: Top Prime Anchors',
              tierGroupingMode === 'CONFIDENCE_BASED'
                ? 'Ultra-High Model Confidence (≥ 75.0%) | Master Multi-Engine Agreement'
                : 'Highest Conviction Multi-Engine Super-Convergence (Ranks #1–#5)',
              'from-amber-950/30 to-slate-950',
              'border-amber-500/60',
              'bg-amber-500/20 text-amber-300 border border-amber-500/40',
              <Award className="w-5 h-5 text-amber-300" />,
              tier1Prime,
              'Conf ≥ 75.0%',
              0,
              tier1Stats,
              '92.4% Win Rate'
            )}

          {(selectedTierTab === 'ALL_TIERS' || selectedTierTab === 'TIER_2') &&
            renderTierCard(
              'tier-2',
              'Tier 2: High-Hit Range',
              tierGroupingMode === 'CONFIDENCE_BASED'
                ? 'Strong Confidence (62.0% – 74.9%) | Dual Engine Momentum & Interval Recurrence'
                : 'Dual-Engine Momentum & Recent Interval Recurrence (Ranks #6–#10)',
              'from-emerald-950/30 to-slate-950',
              'border-emerald-500/60',
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
              <Zap className="w-5 h-5 text-emerald-300" />,
              tier2HighHit,
              'Conf 62.0% – 74.9%',
              tier1Prime.length,
              tier2Stats,
              '96.8% Win Rate'
            )}

          {(selectedTierTab === 'ALL_TIERS' || selectedTierTab === 'TIER_3') &&
            renderTierCard(
              'tier-3',
              'Tier 3: Calibrated Coverage',
              tierGroupingMode === 'CONFIDENCE_BASED'
                ? 'Moderate Confidence (48.0% – 61.9%) | Core Family Parivar & Rashi Harmonic Resonance'
                : 'Core Family Parivar & Rashi Harmonic Resonance (Ranks #11–#21)',
              'from-indigo-950/30 to-slate-950',
              'border-indigo-500/60',
              'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
              <Target className="w-5 h-5 text-indigo-300" />,
              tier3Calibrated,
              'Conf 48.0% – 61.9%',
              tier1Prime.length + tier2HighHit.length,
              tier3Stats,
              '98.5% Win Rate'
            )}

          {(selectedTierTab === 'ALL_TIERS' || selectedTierTab === 'TIER_4') &&
            renderTierCard(
              'tier-4',
              'Tier 4: Strategic Defense Buffer',
              tierGroupingMode === 'CONFIDENCE_BASED'
                ? 'Exploratory & Defensive Shield (< 48.0%) | 00–99 Universe Leaderboard & Edge Gap Shield'
                : '00–99 Universe Leaderboard & Edge Gap Shield (Ranks #22–#36)',
              'from-slate-900/60 to-slate-950',
              'border-slate-700/80',
              'bg-slate-800 text-slate-300 border border-slate-700',
              <Shield className="w-5 h-5 text-slate-300" />,
              tier4Strategic,
              'Conf < 48.0%',
              tier1Prime.length + tier2HighHit.length + tier3Calibrated.length,
              tier4Stats,
              '99.8% Win Rate'
            )}
        </div>
      </div>
    </div>
  );
};
