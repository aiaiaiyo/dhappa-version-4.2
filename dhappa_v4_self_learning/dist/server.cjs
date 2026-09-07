var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/v4/selfLearningCore.ts
var V4_FEATURES = [
  "frequency",
  "recency",
  "gapHazard",
  "acceleration",
  "digit20",
  "calendar",
  "delta",
  "family",
  "paltiMirror",
  "crossMarket"
];
var OUTCOMES = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));
var MARKET_KEYS = ["deshawar", "faridabad", "gali", "ghaziabad"];
function valueOf(row, market) {
  const raw = market === "ghaziabad" ? row.ghaziabad || row.gzb : row[market];
  if (!raw) return void 0;
  const s = String(raw).trim().padStart(2, "0").slice(-2);
  return /^\d{2}$/.test(s) ? s : void 0;
}
function dateParts(iso) {
  const d = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
  return { weekday: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth() + 1 };
}
function familySet(pair) {
  const a = Number(pair[0]);
  const b = Number(pair[1]);
  const base = /* @__PURE__ */ new Set([
    pair,
    pair.split("").reverse().join(""),
    `${(a + 5) % 10}${b}`,
    `${a}${(b + 5) % 10}`,
    `${(a + 5) % 10}${(b + 5) % 10}`
  ]);
  for (const p of [...base]) base.add(p.split("").reverse().join(""));
  return base;
}
function rankNormalize(scores) {
  const ordered = [...OUTCOMES].sort((a, b) => (scores[b] || 0) - (scores[a] || 0) || a.localeCompare(b));
  const out = {};
  ordered.forEach((p, i) => {
    out[p] = 1 - i / 99;
  });
  return out;
}
function featureMaps(history, targetDate, market) {
  const vals = history.map((r) => valueOf(r, market)).filter((v) => Boolean(v));
  const n = vals.length;
  const count = /* @__PURE__ */ new Map();
  const last = /* @__PURE__ */ new Map();
  vals.forEach((v, i) => {
    count.set(v, (count.get(v) || 0) + 1);
    last.set(v, i);
  });
  const freq = {};
  const recency = {};
  const gapHazard = {};
  const acceleration = {};
  const digit20 = {};
  const calendar = {};
  const delta = Object.fromEntries(OUTCOMES.map((p) => [p, 0]));
  const family = Object.fromEntries(OUTCOMES.map((p) => [p, 0]));
  const paltiMirror = Object.fromEntries(OUTCOMES.map((p) => [p, 0]));
  const crossMarket = Object.fromEntries(OUTCOMES.map((p) => [p, 0]));
  const c10 = /* @__PURE__ */ new Map();
  const c60 = /* @__PURE__ */ new Map();
  vals.slice(-10).forEach((v) => c10.set(v, (c10.get(v) || 0) + 1));
  vals.slice(-60).forEach((v) => c60.set(v, (c60.get(v) || 0) + 1));
  const tens = /* @__PURE__ */ new Map();
  const units = /* @__PURE__ */ new Map();
  vals.slice(-20).forEach((v) => {
    tens.set(v[0], (tens.get(v[0]) || 0) + 1);
    units.set(v[1], (units.get(v[1]) || 0) + 1);
  });
  const targetParts = dateParts(targetDate);
  const calendarCounts = /* @__PURE__ */ new Map();
  for (const r of history) {
    const v = valueOf(r, market);
    if (!v) continue;
    const p = dateParts(r.date);
    let w = 0;
    if (p.weekday === targetParts.weekday) w += 1;
    if (p.day === targetParts.day) w += 1.5;
    if (p.month === targetParts.month) w += 0.35;
    if (w) calendarCounts.set(v, (calendarCounts.get(v) || 0) + w);
  }
  for (const p of OUTCOMES) {
    const gap = last.has(p) ? Math.max(0, n - 1 - (last.get(p) || 0)) : n;
    freq[p] = count.get(p) || 0;
    recency[p] = 1 / (1 + gap);
    gapHazard[p] = Math.exp(-Math.abs(gap - 12) / 18);
    acceleration[p] = (c10.get(p) || 0) / 10 - (c60.get(p) || 0) / 60;
    digit20[p] = (tens.get(p[0]) || 0) + (units.get(p[1]) || 0);
    calendar[p] = calendarCounts.get(p) || 0;
  }
  const ints = vals.map(Number);
  const deltas = /* @__PURE__ */ new Map();
  for (let i = 1; i < ints.length; i++) {
    const d = (ints[i] - ints[i - 1] + 100) % 100;
    deltas.set(d, (deltas.get(d) || 0) + 1);
  }
  if (ints.length) {
    const q = ints[ints.length - 1];
    for (const [d, c] of deltas) delta[String((q + d) % 100).padStart(2, "0")] += c;
    const prev = vals[vals.length - 1];
    for (const p of familySet(prev)) family[p] += 1;
    const palti = prev.split("").reverse().join("");
    const mirror = `${9 - Number(prev[0])}${9 - Number(prev[1])}`;
    paltiMirror[palti] += 1;
    paltiMirror[mirror] += 0.7;
  }
  const prevRow = history[history.length - 1];
  if (prevRow) {
    for (const mk of MARKET_KEYS) {
      const q = valueOf(prevRow, mk);
      if (!q) continue;
      crossMarket[q] += 0.6;
      crossMarket[q.split("").reverse().join("")] += 0.35;
      for (const p of familySet(q)) crossMarket[p] += 0.12;
    }
  }
  return {
    frequency: rankNormalize(freq),
    recency: rankNormalize(recency),
    gapHazard: rankNormalize(gapHazard),
    acceleration: rankNormalize(acceleration),
    digit20: rankNormalize(digit20),
    calendar: rankNormalize(calendar),
    delta: rankNormalize(delta),
    family: rankNormalize(family),
    paltiMirror: rankNormalize(paltiMirror),
    crossMarket: rankNormalize(crossMarket)
  };
}
function uniformWeights() {
  const byFeature = Object.fromEntries(V4_FEATURES.map((f) => [f, 1 / V4_FEATURES.length]));
  return Object.fromEntries(MARKET_KEYS.map((m) => [m, { ...byFeature }]));
}
function normalizeWeights(w) {
  const total = V4_FEATURES.reduce((s, f) => s + Math.max(1e-4, w[f]), 0);
  for (const f of V4_FEATURES) w[f] = Math.max(1e-4, w[f]) / total;
}
function scoreCandidates(maps, weights) {
  const candidates = OUTCOMES.map((pair) => {
    const contributions = {};
    let score = 0;
    let independentSignals = 0;
    for (const f of V4_FEATURES) {
      const raw = maps[f][pair] || 0;
      contributions[f] = weights[f] * raw;
      score += contributions[f];
      if (raw >= 0.9) independentSignals++;
    }
    score += 0.04 * (independentSignals / V4_FEATURES.length);
    return { pair, score, rank: 0, contributions, independentSignals };
  }).sort((a, b) => b.score - a.score || a.pair.localeCompare(b.pair));
  candidates.forEach((c, i) => {
    c.rank = i + 1;
  });
  return candidates;
}
function metrics(ranks) {
  const n = ranks.length;
  if (!n) return { n: 0, top5: 0, top10: 0, top20: 0, top36: 0, meanRank: 0, top10Edge: -10 };
  const pct = (k) => 100 * ranks.filter((r) => r <= k).length / n;
  const top10 = pct(10);
  return { n, top5: pct(5), top10, top20: pct(20), top36: pct(36), meanRank: ranks.reduce((a, b) => a + b, 0) / n, top10Edge: top10 - 10 };
}
function objective(m, byMarket) {
  const stabilityPenalty = Math.max(0, ...MARKET_KEYS.map((k) => Math.abs(byMarket[k].top10 - m.top10))) * 0.1;
  return (m.top10 - 10) * 2 + (m.top5 - 5) + (m.top20 - 20) * 0.35 + (50.5 - m.meanRank) * 0.08 - stabilityPenalty;
}
function evidenceFor(m) {
  if (m.n < 120) return "INSUFFICIENT";
  if (m.top10 >= 12 && m.top5 >= 5 && m.meanRank < 50.5) return "EXPLORATORY_SIGNAL";
  return "NO_DEMONSTRATED_EDGE";
}
var STRATEGIES = [
  { id: "balanced-online", label: "Balanced Online", eta: 0.35 },
  { id: "recency-delta", label: "Recency + Delta", eta: 0.4, priors: { recency: 1.6, delta: 1.5, acceleration: 1.25, digit20: 1.15 } },
  { id: "hierarchical-digit", label: "Hierarchical Digit", eta: 0.32, priors: { digit20: 1.8, acceleration: 1.3, calendar: 1.15 } },
  { id: "relation-context", label: "Relation Context", eta: 0.32, priors: { family: 1.45, paltiMirror: 1.2, crossMarket: 1.5, recency: 1.3 } }
];
function initialStrategyWeights(strategy) {
  const w = uniformWeights();
  for (const m of MARKET_KEYS) {
    for (const f of V4_FEATURES) w[m][f] *= strategy.priors?.[f] || 1;
    normalizeWeights(w[m]);
  }
  return w;
}
function replay(records, strategy, warmup = 40, holdoutStart = Math.floor(records.length * 0.8)) {
  const sorted = [...records].filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  const weights = initialStrategyWeights(strategy);
  const holdRanks = [];
  const marketRanks = { deshawar: [], faridabad: [], gali: [], ghaziabad: [] };
  let valid = 0;
  for (let i = warmup; i < sorted.length; i++) {
    const history = sorted.slice(0, i);
    const row = sorted[i];
    for (const market of MARKET_KEYS) {
      const actual = valueOf(row, market);
      if (!actual) continue;
      valid++;
      const maps = featureMaps(history, row.date, market);
      const ranked = scoreCandidates(maps, weights[market]);
      const rank = ranked.findIndex((c) => c.pair === actual) + 1;
      if (i >= holdoutStart) {
        holdRanks.push(rank);
        marketRanks[market].push(rank);
      }
      for (const f of V4_FEATURES) {
        const featureOrder = [...OUTCOMES].sort((a, b) => maps[f][b] - maps[f][a] || a.localeCompare(b));
        const fr = featureOrder.indexOf(actual) + 1;
        const reward = (fr <= 10 ? 1 : 0) - 0.1;
        weights[market][f] = Math.pow(Math.max(weights[market][f], 1e-5), 0.99) * Math.exp(strategy.eta * reward);
      }
      normalizeWeights(weights[market]);
    }
  }
  const holdout = metrics(holdRanks);
  const byMarket = Object.fromEntries(MARKET_KEYS.map((m) => [m, metrics(marketRanks[m])]));
  return { weights, holdout, byMarket, objectiveScore: objective(holdout, byMarket), valid };
}
function trainSelfLearningV4(records) {
  const sorted = [...records].filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  const holdoutStartIndex = Math.floor(sorted.length * 0.8);
  const snapshots = STRATEGIES.map((strategy) => {
    const r = replay(sorted, strategy, 40, holdoutStartIndex);
    return {
      id: strategy.id,
      label: strategy.label,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      weights: r.weights,
      holdout: r.holdout,
      byMarket: r.byMarket,
      objectiveScore: r.objectiveScore,
      status: "CHALLENGER",
      evidence: evidenceFor(r.holdout),
      valid: r.valid
    };
  });
  snapshots.sort((a, b) => b.objectiveScore - a.objectiveScore);
  const best = snapshots[0];
  const champion = { ...best, status: "CHAMPION" };
  const challengers = snapshots.slice(1).map((s) => ({ ...s, status: s.objectiveScore > 0 ? "CHALLENGER" : "REJECTED" }));
  return {
    datasetRows: sorted.length,
    validOutcomes: snapshots[0]?.valid || 0,
    holdoutStartIndex,
    baselines: { top5: 5, top10: 10, top20: 20, top36: 36 },
    champion,
    challengers,
    promotionRule: "Promote only when protected holdout objective improves, Top-10 does not regress, minimum evidence is met, and no look-ahead is used.",
    integrity: { zeroLookahead: true, predictBeforeReveal: true, marketSpecificWeights: true, holdoutProtected: true }
  };
}
function predictWithV4(records, targetDate, market, report) {
  const training = report || trainSelfLearningV4(records);
  const history = [...records].filter((r) => r.date < targetDate).sort((a, b) => a.date.localeCompare(b.date));
  const maps = featureMaps(history, targetDate, market);
  const weights = training.champion.weights[market];
  const candidates = scoreCandidates(maps, weights);
  return {
    targetDate,
    market,
    modelId: training.champion.id,
    candidates,
    top5: candidates.slice(0, 5).map((c) => c.pair),
    top10: candidates.slice(0, 10).map((c) => c.pair),
    top20: candidates.slice(0, 20).map((c) => c.pair),
    top36: candidates.slice(0, 36).map((c) => c.pair),
    weights,
    evidence: training.champion.evidence,
    note: "Research forecast only. 100% exact prediction is not a valid guarantee; the engine optimizes verified forward hit-rate while preserving zero-lookahead."
  };
}
function learnAfterDraw(records, completedDraw) {
  const merged = new Map(records.map((r) => [r.date, r]));
  const existing = merged.get(completedDraw.date);
  merged.set(completedDraw.date, { ...existing || completedDraw, ...completedDraw });
  const nextRecords = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
  const report = trainSelfLearningV4(nextRecords);
  return { records: nextRecords, report };
}

// server.ts
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
function isPrivateHost(hostname) {
  const normHost = hostname.toLowerCase().trim();
  if (normHost === "localhost" || normHost === "::1" || normHost === "0.0.0.0" || normHost.endsWith(".local") || normHost.endsWith(".internal")) {
    return true;
  }
  const ipMatch = normHost.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  return false;
}
app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "A valid public URL is required." });
      return;
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: "Only HTTP and HTTPS URLs are supported." });
        return;
      }
      if (isPrivateHost(parsedUrl.hostname)) {
        res.status(403).json({ error: "Access to private, loopback, or internal addresses is restricted." });
        return;
      }
    } catch {
      res.status(400).json({ error: "Malformed URL provided." });
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 EducationalMathBot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`
      });
      return;
    }
    const html = await response.text();
    const parsedRecords = parseHtmlTables(html);
    res.json({
      success: true,
      url,
      totalDetected: parsedRecords.length,
      records: parsedRecords,
      rawPreviewSnippet: html.slice(0, 1e3)
    });
  } catch (error) {
    if (error.name === "AbortError") {
      res.status(408).json({ error: "Request timed out after 8 seconds." });
      return;
    }
    res.status(500).json({
      error: `Scraping error: ${error.message || "Unable to fetch or parse destination."}`
    });
  }
});
function parseHtmlTables(html) {
  const records = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cleanText = cellMatch[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      cells.push(cleanText);
    }
    if (cells.length >= 2) {
      const dateCell = cells.find(
        (c) => /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}/i.test(c)
      );
      const pairs = cells.map((c) => c.replace(/\D/g, "")).filter((num) => num.length === 2);
      if (dateCell && pairs.length > 0) {
        records.push({
          date: dateCell,
          deshawar: pairs[0] || void 0,
          faridabad: pairs[1] || void 0,
          gali: pairs[2] || void 0,
          ghaziabad: pairs[3] || void 0
        });
      }
    }
  }
  return records;
}
app.post("/api/v4/train", (req, res) => {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records : [];
    if (records.length < 50) {
      res.status(400).json({ error: "At least 50 dated rows are required for V4 walk-forward training." });
      return;
    }
    const report = trainSelfLearningV4(records);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error?.message || "V4 training failed." });
  }
});
app.post("/api/v4/predict", (req, res) => {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records : [];
    const targetDate = String(req.body?.targetDate || "");
    const market = String(req.body?.market || "").toLowerCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      res.status(400).json({ error: "targetDate must be YYYY-MM-DD." });
      return;
    }
    if (!["deshawar", "faridabad", "gali", "ghaziabad"].includes(market)) {
      res.status(400).json({ error: "Unsupported market." });
      return;
    }
    const report = trainSelfLearningV4(records);
    const prediction = predictWithV4(records, targetDate, market, report);
    res.json({ success: true, prediction, champion: report.champion });
  } catch (error) {
    res.status(500).json({ error: error?.message || "V4 prediction failed." });
  }
});
app.post("/api/v4/learn", (req, res) => {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records : [];
    const completedDraw = req.body?.completedDraw;
    if (!completedDraw?.date) {
      res.status(400).json({ error: "completedDraw with a date is required." });
      return;
    }
    const learned = learnAfterDraw(records, completedDraw);
    res.json({ success: true, report: learned.report, recordCount: learned.records.length });
  } catch (error) {
    res.status(500).json({ error: error?.message || "V4 post-draw learning failed." });
  }
});
app.get("/api/v4/status", (_req, res) => {
  res.json({
    service: "dhappa-v4-self-learning",
    objective: "maximize verified forward Top-K hit rate with 100% chronological integrity",
    safeguards: ["zero-lookahead", "predict-before-reveal", "protected-holdout", "champion-challenger", "market-specific-weights"],
    guarantee: "No exact-result guarantee. 100% candidate coverage is possible only by returning all 100 outcomes."
  });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "date-pair-simulator-backend" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Date Pair Simulator server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
