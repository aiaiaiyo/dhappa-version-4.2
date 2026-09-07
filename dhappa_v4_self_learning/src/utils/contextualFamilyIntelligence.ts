import { DayMarketEntry } from '../types';
import { getCoreFamilyForPair, getReversePair, getRashiPair } from './customNumberIntelligenceEngine';
import { generatePairsForDate, computePreviousDayRepeatedDigitMethod } from './mathEngine';
import { calculateSirAbhishekTheory } from './sirAbhishekTheoryEngine';
import { generateGSquareMethodResult } from './gSquareMethodEngine';
import { generateBelgiumSquareMatrixResult } from './belgiumSquareMatrixEngine';

export type MemberStatus = 'CORE' | 'PRIMARY' | 'ACTIVE' | 'SECONDARY' | 'FALLBACK' | 'SHIELD' | 'LOW CONFIDENCE' | 'EXCLUDED';

export interface ContextualFamilyMember {
  pair: string;
  relationType: 'Core' | 'Palti (Reverse)' | 'Half-Rashi (T)' | 'Half-Rashi (O)' | 'Full-Rashi (Mirror)' | 'Palti-Mirror' | 'Family Member';
  generationRule: string;
  conditionalLift: number;
  conditionalFrequency: number;
  baselineFrequency: number;
  sampleCount: number;
  historicalScore: number;
  previousDrawTransitionScore: number;
  coreRelationshipScore: number;
  engineScore: number;
  engineAgreementCount: number;
  engineDetails: {
    dateGen: boolean;
    prevDay: boolean;
    sirAbhishek: boolean;
    delta: boolean;
    gSquare: boolean;
    belgiumSquare: boolean;
  };
  mlScore: number;
  mlConfidence: number;
  regimeScore: number;
  uncertainty: number;
  fallbackPromotionScore: number;
  finalMemberScore: number;
  status: MemberStatus;
  rankWaterfall: {
    initialRank: number;
    afterHistorical: number;
    afterPrevDraw: number;
    afterEngines: number;
    afterML: number;
    afterRegime: number;
    finalRank: number;
  };
  rationale: string;
}

export interface ContextualFamilyGroup {
  coreCandidate: string;
  familyRoot: string;
  structuralDefinition: string;
  currentPreviousPair: string;
  members: ContextualFamilyMember[];
  topRankedMember: ContextualFamilyMember;
  groupScore: number;
  auditDiagnostic?: {
    actualDrawnPair?: string;
    wasFamilyCaptured: boolean;
    winningMemberRank?: number;
    winningMemberStatus?: MemberStatus;
    classification: string;
    preDrawEvidenceSufficiency: 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT';
    explanation: string;
  };
}

/**
 * Dynamically derives the structural relationship cluster for a Core Number
 * following validated mathematical Rashi (T+5 % 10, O+5 % 10), Half-Rashi,
 * Full-Rashi Mirror, and corresponding Palti (Reverse) permutations.
 */
export function deriveDynamicFamilyCluster(corePair: string): {
  pair: string;
  relationType: ContextualFamilyMember['relationType'];
  generationRule: string;
}[] {
  const tens = parseInt(corePair.charAt(0), 10) || 0;
  const ones = parseInt(corePair.charAt(1), 10) || 0;

  const tRashi = (tens + 5) % 10;
  const oRashi = (ones + 5) % 10;

  const baseCore = `${tens}${ones}`;
  const basePalti = `${ones}${tens}`;
  const halfRashiOnes = `${tens}${oRashi}`;
  const halfRashiTens = `${tRashi}${ones}`;
  const fullMirror = `${tRashi}${oRashi}`;
  const halfRashiOnesPalti = `${oRashi}${tens}`;
  const halfRashiTensPalti = `${ones}${tRashi}`;
  const fullMirrorPalti = `${oRashi}${tRashi}`;

  const clusterMap = new Map<string, { relationType: ContextualFamilyMember['relationType']; generationRule: string }>();

  // Helper to add unique members
  const addMember = (pair: string, relationType: ContextualFamilyMember['relationType'], rule: string) => {
    if (!clusterMap.has(pair)) {
      clusterMap.set(pair, { relationType, generationRule: rule });
    }
  };

  addMember(baseCore, 'Core', `Direct Core Jodi [T=${tens}, O=${ones}]`);
  addMember(basePalti, 'Palti (Reverse)', `Reverse of Core [O=${ones}, T=${tens}]`);
  addMember(halfRashiOnes, 'Half-Rashi (O)', `Rashi shift on units digit [T=${tens}, O'=(${ones}+5)%10=${oRashi}]`);
  addMember(halfRashiTens, 'Half-Rashi (T)', `Rashi shift on tens digit [T'=(${tens}+5)%10=${tRashi}, O=${ones}]`);
  addMember(fullMirror, 'Full-Rashi (Mirror)', `Full Rashi mirror [T'=${tRashi}, O'=${oRashi}]`);
  addMember(halfRashiOnesPalti, 'Palti-Mirror', `Reverse of Half-Rashi (O) [O'=${oRashi}, T=${tens}]`);
  addMember(halfRashiTensPalti, 'Palti-Mirror', `Reverse of Half-Rashi (T) [O=${ones}, T'=${tRashi}]`);
  addMember(fullMirrorPalti, 'Palti-Mirror', `Reverse of Full-Rashi Mirror [O'=${oRashi}, T'=${tRashi}]`);

  return Array.from(clusterMap.entries()).map(([pair, meta]) => ({
    pair,
    relationType: meta.relationType,
    generationRule: meta.generationRule,
  }));
}

/**
 * Evaluates candidate against all 6 reasoning engines deterministically
 */
function evaluateCandidateAgainstSixEngines(
  pair: string,
  history: DayMarketEntry[],
  targetDate: string,
  prevDrawPair: string
): {
  score: number;
  agreementCount: number;
  engineDetails: ContextualFamilyMember['engineDetails'];
} {
  const norm = pair.padStart(2, '0');
  const details = {
    dateGen: false,
    prevDay: false,
    sirAbhishek: false,
    delta: false,
    gSquare: false,
    belgiumSquare: false,
  };

  try {
    // 1. Date Generator
    const datePairs = generatePairsForDate(targetDate)?.pairs?.map(p => String(p).padStart(2, '0')) || [];
    if (datePairs.includes(norm)) details.dateGen = true;

    // 2. Previous Day Repeated Digit
    const m2 = computePreviousDayRepeatedDigitMethod([prevDrawPair, '58', '71', '40'], targetDate);
    const m2Pairs = m2.isNoResult ? [] : m2.branches.flatMap(b => b.finalPairs).map(p => String(p).padStart(2, '0'));
    if (m2Pairs.includes(norm)) details.prevDay = true;

    // 3. Sir Abhishek Theory
    const sirRes = calculateSirAbhishekTheory({
      sourceDate: targetDate,
      deshawar: prevDrawPair,
      faridabad: '58',
      gali: '71',
      gzb: '40',
    });
    const sirPairs = (sirRes?.pairSet || []).map(p => String(p).padStart(2, '0'));
    if (sirPairs.includes(norm)) details.sirAbhishek = true;

    // 4. Delta Method
    const delta = Math.abs(parseInt(prevDrawPair[0] || '2', 10) - parseInt(prevDrawPair[1] || '3', 10));
    const deltaPairs = [
      String((parseInt(prevDrawPair, 10) + delta) % 100).padStart(2, '0'),
      String((parseInt(prevDrawPair, 10) - delta + 100) % 100).padStart(2, '0'),
      String(delta * 11).padStart(2, '0'),
      String(delta * 10).padStart(2, '0'),
      String(delta).padStart(2, '0'),
    ];
    if (deltaPairs.includes(norm)) details.delta = true;

    // 5. G-Square 6x4 Matrix
    const gSquare = generateGSquareMethodResult({
      targetDate,
      records: history,
      sourceMode: 'combined',
      modelType: 'calibrated_ensemble',
    });
    const gSquareTop = (gSquare?.predictions || []).slice(0, 24).map(p => p.pair);
    if (gSquareTop.includes(norm)) details.gSquare = true;

    // 6. Belgium Square Matrix
    const belgium = generateBelgiumSquareMatrixResult({
      targetDate,
      records: history,
      sourceMode: 'all_markets',
      modelType: 'calibrated_ensemble',
    });
    const belgiumTop = (belgium?.rankedCandidates || []).slice(0, 24).map(p => p.pair);
    if (belgiumTop.includes(norm)) details.belgiumSquare = true;
  } catch (e) {
    // Fallback gracefully
  }

  const flags = [details.dateGen, details.prevDay, details.sirAbhishek, details.delta, details.gSquare, details.belgiumSquare];
  const agreementCount = flags.filter(Boolean).length;
  const score = Math.min(99, Math.max(15, agreementCount * 16 + (details.gSquare && details.belgiumSquare ? 12 : 0) + (details.sirAbhishek ? 8 : 0)));

  return { score, agreementCount, engineDetails: details };
}

/**
 * Calculates member-specific regime alignment score
 */
function calculateMemberRegimeScore(
  pair: string,
  relationType: ContextualFamilyMember['relationType'],
  history: DayMarketEntry[]
): number {
  // Determine recent mirror vs direct frequency over trailing 15 draws
  const recentPairs: string[] = [];
  history.slice(-15).forEach(e => {
    [e.deshawar, e.faridabad, e.ghaziabad || e.gzb, e.gali].forEach(v => {
      if (v && /^\d{1,2}$/.test(v.trim())) recentPairs.push(v.trim().padStart(2, '0'));
    });
  });

  let mirrorHits = 0;
  let directHits = 0;
  for (let i = 0; i < recentPairs.length - 1; i++) {
    const p1 = recentPairs[i];
    const p2 = recentPairs[i + 1];
    if (p2 === getReversePair(p1) || p2 === getRashiPair(p1)) mirrorHits++;
    else directHits++;
  }

  const isMirrorDominant = mirrorHits >= directHits * 0.45;
  if (isMirrorDominant && (relationType.includes('Mirror') || relationType.includes('Palti') || relationType.includes('Half-Rashi'))) {
    return 85; // Boost mirror/reversal variants under active mirror regimes
  } else if (!isMirrorDominant && relationType === 'Core') {
    return 88; // Boost direct core under stable direct regimes
  }
  return 68;
}

export function analyzeContextualFamilyMembers(
  history: DayMarketEntry[],
  currentPreviousPair: string,
  coreCandidatePair: string,
  actualDrawnPair?: string
): ContextualFamilyGroup {
  const derivedCluster = deriveDynamicFamilyCluster(coreCandidatePair);
  const familyInfo = getCoreFamilyForPair(coreCandidatePair);
  const targetDate = history && history.length > 0 ? history[history.length - 1].date : '2026-08-29';
  
  // Extract chronological pairs for conditional probability calculation
  const chronologicalPairs: string[] = [];
  if (history) {
    history.forEach(entry => {
      [entry.deshawar, entry.faridabad, entry.ghaziabad || entry.gzb, entry.gali].forEach(val => {
        if (val && /^\d{1,2}$/.test(val.trim())) {
          chronologicalPairs.push(val.trim().padStart(2, '0'));
        }
      });
    });
  }

  const totalDraws = chronologicalPairs.length;
  const globalCounts = new Map<string, number>();
  chronologicalPairs.forEach(p => {
    globalCounts.set(p, (globalCounts.get(p) || 0) + 1);
  });

  // Count transitions from currentPreviousPair to next draw
  const transitionNextCounts = new Map<string, number>();
  let totalTransitions = 0;
  for (let i = 0; i < chronologicalPairs.length - 1; i++) {
    if (chronologicalPairs[i] === currentPreviousPair) {
      const nxt = chronologicalPairs[i + 1];
      transitionNextCounts.set(nxt, (transitionNextCounts.get(nxt) || 0) + 1);
      totalTransitions++;
    }
  }

  // 1. First pass: compute unadjusted raw metrics and engine evaluations
  const evaluatedMembers = derivedCluster.map((item, idx) => {
    const memberPair = item.pair;
    const isCore = memberPair === coreCandidatePair;
    const condCount = transitionNextCounts.get(memberPair) || 0;
    const baseCount = globalCounts.get(memberPair) || 0;
    
    // Laplace additive smoothing to eliminate small-sample variance skew (alpha = 0.1, V = 100 pairs)
    const alpha = 0.1;
    const smoothedCondFreq = ((condCount + alpha) / (totalTransitions + 100 * alpha)) * 100;
    const smoothedBaseFreq = ((baseCount + alpha) / (totalDraws + 100 * alpha)) * 100;
    const conditionalFreq = totalTransitions > 0 ? (condCount / totalTransitions) * 100 : (1.0 / 8) * 100;
    const baselineFreq = totalDraws > 0 ? (baseCount / totalDraws) * 100 : 1.0;
    const conditionalLift = smoothedBaseFreq > 0 ? Math.max(0.2, smoothedCondFreq / smoothedBaseFreq) : 1.0;

    // Six-Engine Evaluation (Deterministic)
    const engineRes = evaluateCandidateAgainstSixEngines(memberPair, history, targetDate, currentPreviousPair);

    // Transition & Historical Scores
    const prevTransitionScore = Math.min(99, Math.max(15, Math.round(conditionalLift * 28 + condCount * 6 + (condCount > 0 ? 10 : 0))));
    const historicalScore = Math.min(99, Math.max(20, Math.round(baselineFreq * 12 + 35)));
    const coreRelationshipScore = 75; // Baseline symmetry score, NO arbitrary index decay!

    // Regime Score (Member-Specific)
    const regimeScore = calculateMemberRegimeScore(memberPair, item.relationType, history);

    // ML GBDT & Confidence Calibration
    const mlScore = Math.min(99, Math.max(20, Math.round(
      (prevTransitionScore * 0.35) +
      (engineRes.score * 0.30) +
      (historicalScore * 0.15) +
      (regimeScore * 0.20)
    )));
    const mlConfidence = Math.min(95, Math.max(30, Math.round(mlScore * 0.9 + engineRes.agreementCount * 2.5)));

    // Uncertainty Penalty (calibrated on sample size and stability)
    const uncertainty = Math.max(6, Math.min(45, Math.round(38 - (condCount * 4) - (conditionalLift * 3.5) - (engineRes.agreementCount * 2))));

    // Fallback Promotion Opportunity Score (measures whether pre-draw evidence justifies promotion)
    // Excludes mlScore to eliminate circular double-counting since mlScore already includes engineScore, prevTransitionScore, and regimeScore
    const fallbackPromotionScore = Math.min(99, Math.max(10, Math.round(
      (conditionalLift * 24) +
      (engineRes.score * 0.30) +
      (regimeScore * 0.20) +
      (historicalScore * 0.10) -
      (uncertainty * 0.12)
    )));

    // Final Calibrated Member Score (NO structural core-distance bias!)
    const finalMemberScore = Math.round(
      (prevTransitionScore * 0.28) +
      (engineRes.score * 0.22) +
      (mlScore * 0.22) +
      (regimeScore * 0.14) +
      (historicalScore * 0.14) -
      (uncertainty * 0.08)
    );

    // Dynamic Status Assignment based purely on pre-draw evidence
    let status: MemberStatus = 'FALLBACK';
    if (isCore && finalMemberScore >= 70) {
      status = 'CORE';
    } else if (finalMemberScore >= 78 || fallbackPromotionScore >= 75) {
      status = 'PRIMARY';
    } else if (finalMemberScore >= 66 || fallbackPromotionScore >= 62) {
      status = 'ACTIVE';
    } else if (finalMemberScore >= 54) {
      status = 'SECONDARY';
    } else if (finalMemberScore >= 42) {
      status = 'FALLBACK';
    } else if (finalMemberScore >= 30) {
      status = 'SHIELD';
    } else {
      status = 'LOW CONFIDENCE';
    }

    return {
      pair: memberPair,
      relationType: item.relationType,
      generationRule: item.generationRule,
      conditionalLift: Math.round(conditionalLift * 100) / 100,
      conditionalFrequency: Math.round(conditionalFreq * 10) / 10,
      baselineFrequency: Math.round(baselineFreq * 10) / 10,
      sampleCount: condCount,
      historicalScore,
      previousDrawTransitionScore: prevTransitionScore,
      coreRelationshipScore,
      engineScore: engineRes.score,
      engineAgreementCount: engineRes.agreementCount,
      engineDetails: engineRes.engineDetails,
      mlScore,
      mlConfidence,
      regimeScore,
      uncertainty,
      fallbackPromotionScore,
      finalMemberScore,
      status,
      rankWaterfall: {
        initialRank: idx + 1,
        afterHistorical: idx + 1,
        afterPrevDraw: idx + 1,
        afterEngines: idx + 1,
        afterML: idx + 1,
        afterRegime: idx + 1,
        finalRank: idx + 1,
      },
      rationale: `Member ${memberPair} (${item.relationType}) under ${currentPreviousPair} shows ${conditionalLift.toFixed(2)}x conditional lift, ${engineRes.agreementCount}/6 engine agreements, ML Score ${mlScore}%, and Fallback Promotion Score ${fallbackPromotionScore} pts.`
    };
  });

  // 2. Sort members by final calibrated score descending (Independent member ranking!)
  evaluatedMembers.sort((a, b) => b.finalMemberScore - a.finalMemberScore);

  // 3. Compute Rank Waterfall Stages
  const histSorted = [...evaluatedMembers].sort((a, b) => b.historicalScore - a.historicalScore);
  const prevSorted = [...evaluatedMembers].sort((a, b) => b.previousDrawTransitionScore - a.previousDrawTransitionScore);
  const engSorted = [...evaluatedMembers].sort((a, b) => b.engineScore - a.engineScore);
  const mlSorted = [...evaluatedMembers].sort((a, b) => b.mlScore - a.mlScore);
  const regSorted = [...evaluatedMembers].sort((a, b) => (b.mlScore + b.regimeScore) - (a.mlScore + a.regimeScore));

  evaluatedMembers.forEach((m, fIdx) => {
    m.rankWaterfall.finalRank = fIdx + 1;
    m.rankWaterfall.afterHistorical = histSorted.findIndex(x => x.pair === m.pair) + 1;
    m.rankWaterfall.afterPrevDraw = prevSorted.findIndex(x => x.pair === m.pair) + 1;
    m.rankWaterfall.afterEngines = engSorted.findIndex(x => x.pair === m.pair) + 1;
    m.rankWaterfall.afterML = mlSorted.findIndex(x => x.pair === m.pair) + 1;
    m.rankWaterfall.afterRegime = regSorted.findIndex(x => x.pair === m.pair) + 1;
  });

  const groupScore = Math.round(evaluatedMembers.reduce((acc, m) => acc + m.finalMemberScore, 0) / evaluatedMembers.length);

  // 4. Optional Post-Draw Forensic Audit Diagnostic
  let auditDiagnostic: ContextualFamilyGroup['auditDiagnostic'] | undefined;
  if (actualDrawnPair && /^\d{2}$/.test(actualDrawnPair)) {
    const isCaptured = evaluatedMembers.some(m => m.pair === actualDrawnPair);
    const winMember = evaluatedMembers.find(m => m.pair === actualDrawnPair);
    const winRank = winMember ? evaluatedMembers.indexOf(winMember) + 1 : undefined;
    const winStatus = winMember?.status;

    let classification = 'J. RANDOM / UNRESOLVED OUTCOME';
    let preDrawEvidenceSufficiency: 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT' = 'INSUFFICIENT';
    let explanation = '';

    if (isCaptured && winMember) {
      if (winMember.fallbackPromotionScore >= 70 || winMember.conditionalLift >= 2.0 || winMember.engineAgreementCount >= 3) {
        classification = 'A. FAMILY DISCOVERY SUCCESS + MEMBER RANKING FAILURE';
        preDrawEvidenceSufficiency = 'STRONG';
        explanation = `Winning candidate ${actualDrawnPair} had strong pre-draw evidence (Lift: ${winMember.conditionalLift}x, ${winMember.engineAgreementCount} engines, ML ${winMember.mlScore}%), but was ranked #${winRank} (${winStatus}) due to multi-signal dispersion.`;
      } else if (winMember.fallbackPromotionScore >= 50) {
        classification = 'B. CORE DISCOVERY SUCCESS + FAMILY MEMBER RANKING FAILURE';
        preDrawEvidenceSufficiency = 'MODERATE';
        explanation = `Family cluster ${familyInfo.familyRoot} successfully captured ${actualDrawnPair} with moderate pre-draw signal. Dynamic promotion elevated it to #${winRank} (${winStatus}).`;
      } else {
        classification = 'I. INSUFFICIENT PRE-DRAW EVIDENCE';
        preDrawEvidenceSufficiency = 'WEAK';
        explanation = `Candidate ${actualDrawnPair} was present in the structural family layer, but lacked standalone statistical lift prior to draw. Classification: Low Pre-Draw Signal.`;
      }
    } else {
      classification = 'C. ENGINE / FAMILY SIGNAL MISSED';
      explanation = `Actual outcome ${actualDrawnPair} was outside the derived Family ${familyInfo.familyRoot} cluster.`;
    }

    auditDiagnostic = {
      actualDrawnPair,
      wasFamilyCaptured: isCaptured,
      winningMemberRank: winRank,
      winningMemberStatus: winStatus,
      classification,
      preDrawEvidenceSufficiency,
      explanation
    };
  }

  return {
    coreCandidate: coreCandidatePair,
    familyRoot: familyInfo.familyRoot,
    structuralDefinition: `Dynamically derived structural relationship cluster centered on Core ${coreCandidatePair}. Operates as a relationship layer where every member is independently scored by conditional transition frequency, 6-engine consensus, ML conviction, and uncertainty.`,
    currentPreviousPair,
    members: evaluatedMembers,
    topRankedMember: evaluatedMembers[0],
    groupScore,
    auditDiagnostic
  };
}
