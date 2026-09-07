const fs = require('fs');
const path = require('path');

const rawInput = `Date,Deshawar,Faridabad,Gali,Ghaziabad
2026-01-01,,42,58,66
2026-01-02,65,96,92,5
2026-01-03,63,81,99,91
2026-01-04,44,28,23,13
2026-01-05,88,36,40,5
2026-01-06,18,86,78,13
2026-01-07,61,28,11,44
2026-01-08,6,49,25,4
2026-01-09,95,66,21,28
2026-01-10,24,43,52,33
2026-01-11,5,51,78,73
2026-01-12,33,4,14,21
2026-01-13,51,7,58,88
2026-01-14,5,89,70,84
2026-01-15,56,55,2,79
2026-01-16,42,89,74,97
2026-01-17,54,46,34,37
2026-01-18,97,1,20,67
2026-01-19,65,24,31,87
2026-01-20,68,57,97,6
2026-01-21,2,48,50,46
2026-01-22,82,6,35,79
2026-01-23,7,17,2,71
2026-01-24,81,67,42,42
2026-01-25,36,55,82,31
2026-01-26,94,18,51,17
2026-01-27,10,72,47,78
2026-01-28,89,71,79,0
2026-01-29,51,33,34,65
2026-01-30,56,74,12,81
2026-02-01,,39,5,17
2026-02-02,93,90,4,99
2026-02-03,78,8,37,42
2026-02-04,94,40,95,84
2026-02-05,18,4,40,76
2026-02-06,20,35,92,35
2026-02-07,99,25,28,13
2026-02-08,31,10,71,84
2026-02-09,94,21,7,95
2026-02-10,53,30,0,83
2026-02-11,99,72,90,52
2026-02-12,83,14,57,47
2026-02-13,29,46,88,95
2026-02-14,28,84,35,59
2026-02-15,54,31,18,19
2026-02-16,7,59,95,0
2026-02-17,97,36,49,98
2026-02-18,33,1,88,81
2026-02-19,63,86,88,50
2026-02-20,81,29,34,78
2026-02-21,78,70,36,40
2026-02-22,95,89,52,54
2026-02-23,61,64,66,29
2026-02-24,27,12,84,44
2026-02-25,68,86,12,83
2026-02-26,57,99,75,18
2026-02-27,53,70,83,68
2026-02-28,27,,,
2026-03-01,,2,92,10
2026-03-02,68,91,30,10
2026-03-03,49,6,17,13
2026-03-04,19,66,90,65
2026-03-05,54,7,74,46
2026-03-06,36,36,45,2
2026-03-07,38,62,22,60
2026-03-08,45,29,51,78
2026-03-09,65,46,99,26
2026-03-10,49,79,64,74
2026-03-11,9,28,24,58
2026-03-12,25,90,9,18
2026-03-13,3,49,20,72
2026-03-14,95,82,74,75
2026-03-15,39,39,82,27
2026-03-16,28,68,17,12
2026-03-17,47,58,45,26
2026-03-18,82,90,76,76
2026-03-19,50,87,43,26
2026-03-20,12,74,85,23
2026-03-21,16,49,1,17
2026-03-22,70,40,70,28
2026-03-23,27,59,86,10
2026-03-24,66,28,82,75
2026-03-25,13,48,30,70
2026-03-26,92,43,68,34
2026-03-27,26,82,83,43
2026-03-28,40,35,26,5
2026-03-29,93,0,21,14
2026-03-30,23,84,39,20
2026-04-01,,35,97,12
2026-04-02,81,33,63,78
2026-04-03,41,99,62,0
2026-04-04,97,59,75,77
2026-04-05,71,29,59,17
2026-04-06,47,39,46,59
2026-04-07,44,7,1,26
2026-04-08,5,91,42,88
2026-04-09,67,47,47,97
2026-04-10,85,5,11,77
2026-04-11,85,4,24,53
2026-04-12,92,65,6,52
2026-04-13,82,33,39,14
2026-04-14,0,4,2,73
2026-04-15,49,64,82,19
2026-04-16,93,3,15,14
2026-04-17,99,44,40,47
2026-04-18,15,21,69,62
2026-04-19,93,60,46,79
2026-04-20,87,64,62,34
2026-04-21,41,4,25,8
2026-04-22,62,60,95,21
2026-04-23,44,68,33,51
2026-04-24,79,91,14,20
2026-04-25,11,59,38,76
2026-04-26,88,31,9,35
2026-04-27,15,65,19,54
2026-04-28,44,25,8,3
2026-04-29,56,13,85,11
2026-04-30,56,,,
2026-05-01,,63,54,15
2026-05-02,79,72,42,79
2026-05-03,0,84,74,93
2026-05-04,27,8,14,78
2026-05-05,6,12,87,15
2026-05-06,3,70,38,92
2026-05-07,84,69,33,47
2026-05-08,6,48,97,33
2026-05-09,19,86,64,44
2026-05-10,62,46,56,86
2026-05-11,10,22,83,43
2026-05-12,8,28,47,43
2026-05-13,46,1,58,8
2026-05-14,76,5,58,27
2026-05-15,74,9,35,17
2026-05-16,73,80,72,6
2026-05-17,76,69,85,54
2026-05-18,88,13,46,81
2026-05-19,39,49,86,83
2026-05-20,74,79,19,10
2026-05-21,96,53,60,17
2026-05-22,71,1,43,0
2026-05-23,16,77,23,18
2026-05-24,97,21,21,88
2026-05-25,73,54,72,86
2026-05-26,9,13,79,8
2026-05-27,83,45,17,45
2026-05-28,64,25,81,41
2026-05-29,53,76,6,65
2026-05-30,71,43,78,76
2026-06-01,,3,53,52
2026-06-02,11,51,50,29
2026-06-03,48,65,2,85
2026-06-04,47,4,16,78
2026-06-05,78,72,16,72
2026-06-06,10,32,55,66
2026-06-07,28,88,78,32
2026-06-08,62,39,66,70
2026-06-09,26,35,0,21
2026-06-10,65,85,31,33
2026-06-11,31,75,7,0
2026-06-12,52,79,59,20
2026-06-13,71,58,10,91
2026-06-14,40,23,XX,52
2026-07-01,,97,78,69
2026-07-02,24,69,33,11
2026-07-03,39,73,49,31
2026-07-04,91,34,39,72
2026-07-05,23,92,36,91
2026-07-06,6,19,50,54
2026-07-07,19,4,41,48
2026-07-08,53,41,21,71
2026-07-09,2,88,75,29
2026-07-10,26,74,35,42
2026-07-11,53,32,4,4
2026-07-12,26,91,77,15
2026-07-13,66,5,45,87
2026-07-14,73,93,52,75
2026-07-15,16,60,8,77
2026-07-16,28,15,90,5
2026-07-17,32,30,14,30
2026-07-18,85,7,80,51
2026-07-19,16,83,57,45
2026-07-20,83,47,54,32
2026-07-21,73,6,11,82
2026-07-22,5,34,40,9
2026-07-23,20,39,43,54
2026-07-24,69,76,72,73
2026-07-25,89,32,58,70
2026-07-26,65,22,39,84
2026-07-27,6,74,72,7
2026-07-28,75,27,2,67
2026-07-29,16,60,16,9
2026-07-30,67,40,86,52
2026-07-31,5,,,
2026-08-01,,57,92,23
2026-08-02,31,6,31,15
2026-08-03,74,95,59,60
2026-08-04,31,12,27,24
2026-08-05,93,57,85,22
2026-08-06,51,22,80,89
2026-08-07,83,26,35,60
2026-08-08,96,81,93,99
2026-08-09,16,63,97,53
2026-08-10,64,58,57,69
2026-08-11,88,58,92,31
2026-08-12,19,75,36,63
2026-08-13,79,54,61,79
2026-08-14,12,49,71,38
2026-08-15,49,58,71,40
2026-08-16,57,90,59,99
2026-08-17,40,46,15,20
2026-08-18,29,22,88,32
2026-08-19,40,59,56,58
2026-08-20,8,91,53,22
2026-08-21,18,34,34,50
2026-08-22,8,41,82,11
2026-08-23,41,88,83,99
2026-08-24,16,77,75,95
2026-08-25,36,71,89,53
2026-08-26,80,49,77,90
2026-08-27,99,61,63,93
2026-08-28,27,23,86,59
2026-08-29,31,62,45,64
2026-08-30,96,7,87,21
2026-08-31,90,,,`;

function fmt(val) {
  if (!val || val.trim() === '' || val.trim().toUpperCase() === 'XX') return '';
  const n = parseInt(val.trim(), 10);
  if (isNaN(n)) return '';
  return String(n).padStart(2, '0');
}

// Parse lines into cleaned array
const rawLines = rawInput.trim().split('\n').slice(1);
const recordsMap = new Map();

rawLines.forEach(line => {
  const parts = line.split(',');
  const date = parts[0].trim();
  const d = fmt(parts[1]);
  const f = fmt(parts[2]);
  const g = fmt(parts[3]);
  const gb = fmt(parts[4]);

  recordsMap.set(date, {
    date,
    deshawar: d,
    faridabad: f,
    gali: g,
    ghaziabad: gb
  });
});

const records = Array.from(recordsMap.values()).sort((a,b) => a.date.localeCompare(b.date));

// Generate normalized CSV string
let cleanCsv = 'Date,Deshawar,Faridabad,Gali,Ghaziabad\n';
records.forEach(r => {
  cleanCsv += `${r.date},${r.deshawar},${r.faridabad},${r.gali},${r.ghaziabad}\n`;
});

// Save to public and src/data
fs.writeFileSync(path.join(process.cwd(), 'public', 'latest_combined_draws.csv'), cleanCsv, 'utf8');
fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'latest_combined_draws.csv'), cleanCsv, 'utf8');

console.log(`Saved clean CSV with ${records.length} dates (2026-01-01 to 2026-08-31)`);

// Now perform the Miss Analysis
function simulateConsensus(targetDate, priorRecs) {
  const dateNum = parseInt(targetDate.replace(/-/g, ''), 10);
  const dayVal = dateNum % 100;

  // E1: Date Triad
  const e1 = new Set([
    String(dayVal % 100).padStart(2, '0'),
    String((dayVal + 7) % 100).padStart(2, '0'),
    String((dayVal * 3) % 100).padStart(2, '0'),
    String(Math.abs(dayVal - 15) % 100).padStart(2, '0'),
    String((dayVal + 50) % 100).padStart(2, '0')
  ]);

  // E2: Prev Day
  const e2 = new Set();
  const prevDay = priorRecs[priorRecs.length - 1];
  if (prevDay) {
    [prevDay.deshawar, prevDay.faridabad, prevDay.gali, prevDay.ghaziabad].filter(Boolean).forEach(p => {
      e2.add(p);
      e2.add(p.split('').reverse().join(''));
    });
  }

  // E3: Sir Abhishek 15-pair
  const e3 = new Set(['12','24','48','69','35','57','79','18','82','29','38','47','56','65','90']);

  // E4: Delta Transitions
  const e4 = new Set();
  if (priorRecs.length >= 2) {
    const r0 = priorRecs[priorRecs.length - 1];
    const r1 = priorRecs[priorRecs.length - 2];
    ['deshawar', 'faridabad', 'gali', 'ghaziabad'].forEach(k => {
      if (r0[k] && r1[k]) {
        const v0 = parseInt(r0[k], 10);
        const v1 = parseInt(r1[k], 10);
        const diff = Math.abs(v0 - v1);
        e4.add(String(diff).padStart(2, '0'));
        e4.add(String((v0 + diff) % 100).padStart(2, '0'));
      }
    });
  }

  // E5: Haruf Ank
  const e5 = new Set();
  const digitFreqs = Array(10).fill(0);
  priorRecs.slice(-5).forEach(r => {
    ['deshawar', 'faridabad', 'gali', 'ghaziabad'].forEach(k => {
      if (r[k]) {
        digitFreqs[parseInt(r[k][0], 10)]++;
        digitFreqs[parseInt(r[k][1], 10)]++;
      }
    });
  });
  const topDigits = digitFreqs.map((f, i) => ({ d: i, f })).sort((a,b) => b.f - a.f).slice(0, 3).map(x => x.d);
  topDigits.forEach(d1 => topDigits.forEach(d2 => e5.add(`${d1}${d2}`)));

  // E6: Markov Flow
  const e6 = new Set();
  if (prevDay) {
    ['deshawar', 'faridabad', 'gali', 'ghaziabad'].forEach(k => {
      if (prevDay[k]) {
        const num = parseInt(prevDay[k], 10);
        e6.add(String((num * 2 + 1) % 100).padStart(2, '0'));
        e6.add(String(Math.abs(num - 7) % 100).padStart(2, '0'));
      }
    });
  }

  // Briquette Engine Pairs
  const briquettePairs = new Set();
  if (prevDay) {
    const list = [prevDay.deshawar, prevDay.gali, prevDay.faridabad, prevDay.ghaziabad].filter(Boolean);
    let N1 = '64', N2 = '45', found = false;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const u = list[i], v = list[j];
        if (u[0] === v[0] || u[0] === v[1] || u[1] === v[0] || u[1] === v[1]) {
          N1 = u; N2 = v; found = true; break;
        }
      }
      if (found) break;
    }
    const d1 = N1.split(''), d2 = N2.split('');
    const C_str = d1.find(d => d2.includes(d)) || d1[1] || '4';
    const C = parseInt(C_str, 10);
    const A = parseInt(d1.find(d => d !== C_str) || C_str, 10);
    const B = parseInt(d2.find(d => d !== C_str) || C_str, 10);
    const DA = `${C}${A}`, DB = `${C}${B}`, RA = (A + B) % 10, DAR = `${C}${RA}`, RB = (B + C) % 10, DBR = `${C}${RB}`, RC = (C + B) % 10;
    [DA, DB, DAR, DBR, `${RC}${A}`, `${RC}${B}`, `${RC}${RA}`, `${RC}${RB}`].forEach(p => briquettePairs.add(p.padStart(2, '0')));
  }

  // Score all 100 pairs
  const scores = Array.from({ length: 100 }, (_, idx) => {
    const pair = String(idx).padStart(2, '0');
    let score = 0;
    const engines = [];
    if (e1.has(pair)) { score += 15; engines.push('E1 (Date Triad)'); }
    if (e2.has(pair)) { score += 20; engines.push('E2 (Prev Echo)'); }
    if (e3.has(pair)) { score += 18; engines.push('E3 (Abhishek)'); }
    if (e4.has(pair)) { score += 14; engines.push('E4 (Delta Trans)'); }
    if (e5.has(pair)) { score += 16; engines.push('E5 (Haruf Ank)'); }
    if (e6.has(pair)) { score += 12; engines.push('E6 (Markov Flow)'); }

    const rev = pair.split('').reverse().join('');
    if (rev !== pair && (e1.has(rev) || e2.has(rev) || e3.has(rev))) {
      score += 6;
    }

    // Rules 101-108
    let boost = 1.0;
    if (engines.length >= 3) boost *= 1.35; // 101
    if (score >= 80) boost *= 1.20; // 102
    if (prevDay && prevDay.deshawar) {
      const desh = prevDay.deshawar;
      const rashi = desh.split('').map(c => String((parseInt(c) + 5) % 10)).join('');
      if (pair === rashi || pair === desh.split('').reverse().join('') || pair === desh) boost *= 1.28; // 103
    }
    const targetMod = String(dayVal % 5);
    if (pair[0] === targetMod || pair[1] === targetMod) boost *= 1.18; // 105
    if (pair[0] === pair[1]) boost *= 1.15; // 108

    // Rules 201-204
    if (pair === rev) boost *= 1.45; // 201
    if (['12','17','62','67','34','39','84','89'].includes(pair)) boost *= 1.40; // 202
    if (['99','88'].includes(pair)) boost *= 1.38; // 203
    if (['14','19','64','69','41','46','91','96'].includes(pair)) boost *= 1.52; // 204

    score = Math.round(score * boost);
    return { pair, score, engines, inBriquette: briquettePairs.has(pair) };
  });

  scores.sort((a,b) => b.score - a.score || a.pair.localeCompare(b.pair));
  const top36 = scores.slice(0, 36).map(s => s.pair);
  const top36Set = new Set(top36);

  return { top36, top36Set, scores, e1, e2, e3, e4, e5, e6, briquettePairs };
}

// Evaluate days
const evaluationList = [];
let totalDays = 0, hitDays = 0, missDays = 0;

for (let i = 1; i < records.length; i++) {
  const current = records[i];
  const prior = records.slice(0, i);
  const actuals = [
    { market: 'Deshawar', val: current.deshawar },
    { market: 'Faridabad', val: current.faridabad },
    { market: 'Gali', val: current.gali },
    { market: 'Ghaziabad', val: current.ghaziabad }
  ].filter(x => Boolean(x.val));

  if (actuals.length === 0) continue;
  totalDays++;

  const sim = simulateConsensus(current.date, prior);
  const matched = actuals.filter(act => sim.top36Set.has(act.val));

  const isHit = matched.length > 0;
  if (isHit) hitDays++;
  else missDays++;

  evaluationList.push({
    date: current.date,
    actuals,
    matched,
    isHit,
    sim
  });
}

const missList = evaluationList.filter(e => !e.isHit);

console.log(`\n========================================`);
console.log(`TOTAL DAYS EVALUATED: ${totalDays}`);
console.log(`HIT DAYS (1+ draws in 36 pool): ${hitDays} (${(hitDays/totalDays*100).toFixed(1)}%)`);
console.log(`MISS DAYS (0 draws in 36 pool): ${missDays} (${(missDays/totalDays*100).toFixed(1)}%)`);
console.log(`========================================\n`);

const assessmentReport = [];

missList.forEach((m, idx) => {
  const dayReport = {
    index: idx + 1,
    date: m.date,
    actualDraws: m.actuals.map(a => `${a.market}: ${a.val}`),
    details: []
  };

  m.actuals.forEach(act => {
    const pair = act.val;
    const rank = m.sim.scores.findIndex(s => s.pair === pair) + 1;
    const scoreObj = m.sim.scores.find(s => s.pair === pair);
    const score = scoreObj ? scoreObj.score : 0;
    const engines = scoreObj ? scoreObj.engines : [];

    // Check Palti
    const palti = pair.split('').reverse().join('');
    const paltiRank = m.sim.scores.findIndex(s => s.pair === palti) + 1;
    const paltiIn36 = m.sim.top36Set.has(palti);

    // Check Rashi
    const rashi = pair.split('').map(c => String((parseInt(c) + 5) % 10)).join('');
    const rashiRank = m.sim.scores.findIndex(s => s.pair === rashi) + 1;
    const rashiIn36 = m.sim.top36Set.has(rashi);

    // Check Briquette
    const inBriquette = m.sim.briquettePairs.has(pair);

    // Near miss classification
    let classification = 'COLD_DISPERSED';
    let diagnosis = '';

    if (rank <= 45) {
      classification = 'BOUNDARY_NEAR_MISS';
      diagnosis = `Ranked #${rank} (just outside the top-36 threshold by ${rank - 36} spots). Had active engine score of ${score}.`;
    } else if (paltiIn36) {
      classification = 'PALTI_INVERSION_MISS';
      diagnosis = `The exact reverse pair (${palti}) was locked in the top 36 at Rank #${paltiRank}, but direct inversion was not prioritized.`;
    } else if (rashiIn36) {
      classification = 'RASHI_HARMONIC_MISS';
      diagnosis = `The companion Rashi pair (${rashi}) was locked in the top 36 at Rank #${rashiRank}.`;
    } else if (inBriquette) {
      classification = 'BRIQUETTE_DERIVATIVE_MISS';
      diagnosis = `Pair was directly flagged by the Briquette Derivative Engine, but consensus weight placed it at Rank #${rank}.`;
    } else {
      classification = 'EXTREME_DISPERSION';
      diagnosis = `Anomalous low-frequency pair; no base engines triggered direct resonance.`;
    }

    dayReport.details.push({
      market: act.market,
      pair,
      rank,
      score,
      engines,
      palti,
      paltiRank,
      paltiIn36,
      rashi,
      rashiRank,
      rashiIn36,
      inBriquette,
      classification,
      diagnosis
    });
  });

  assessmentReport.push(dayReport);
});

fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'miss_assessment_report.json'), JSON.stringify({
  totalDays,
  hitDays,
  missDays,
  hitRatePercent: (hitDays/totalDays*100).toFixed(2),
  assessmentReport
}, null, 2), 'utf8');

console.log(`Saved miss assessment report JSON with ${assessmentReport.length} missed days.`);
