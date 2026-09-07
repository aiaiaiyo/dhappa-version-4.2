import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { trainSelfLearningV4, predictWithV4, learnAfterDraw } from './src/v4/selfLearningCore';
import type { DayMarketEntry } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

function isPrivateHost(hostname: string): boolean {
  const normHost = hostname.toLowerCase().trim();
  if (
    normHost === 'localhost' ||
    normHost === '::1' ||
    normHost === '0.0.0.0' ||
    normHost.endsWith('.local') ||
    normHost.endsWith('.internal')
  ) {
    return true;
  }
  const ipMatch = normHost.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 127) return true; // loopback 127.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true;
  }
  return false;
}

// Educational Web Scraper Endpoint (for public educational datasets/tables)
app.post('/api/scrape', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'A valid public URL is required.' });
      return;
    }

    // Basic URL validation & SSRF check
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: 'Only HTTP and HTTPS URLs are supported.' });
        return;
      }
      if (isPrivateHost(parsedUrl.hostname)) {
        res.status(403).json({ error: 'Access to private, loopback, or internal addresses is restricted.' });
        return;
      }
    } catch {
      res.status(400).json({ error: 'Malformed URL provided.' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 EducationalMathBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`,
      });
      return;
    }

    const html = await response.text();

    // Educational Table Parser
    // Extract table rows, parse columns for Date, Gali, Faridabad, Deshawar, Ghaziabad
    const parsedRecords = parseHtmlTables(html);

    res.json({
      success: true,
      url,
      totalDetected: parsedRecords.length,
      records: parsedRecords,
      rawPreviewSnippet: html.slice(0, 1000),
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      res.status(408).json({ error: 'Request timed out after 8 seconds.' });
      return;
    }
    res.status(500).json({
      error: `Scraping error: ${error.message || 'Unable to fetch or parse destination.'}`,
    });
  }
});

// Helper function to extract potential date and 2-digit pairs from HTML tables
function parseHtmlTables(html: string) {
  const records: Array<{
    date: string;
    gali?: string;
    faridabad?: string;
    deshawar?: string;
    ghaziabad?: string;
  }> = [];

  // Match table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cleanText = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      cells.push(cleanText);
    }

    if (cells.length >= 2) {
      // Look for a date string in the first or second cell
      const dateCell = cells.find((c) =>
        /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}/i.test(c)
      );

      // Find 2-digit numbers
      const pairs = cells
        .map((c) => c.replace(/\D/g, ''))
        .filter((num) => num.length === 2);

      if (dateCell && pairs.length > 0) {
        records.push({
          date: dateCell,
          deshawar: pairs[0] || undefined,
          faridabad: pairs[1] || undefined,
          gali: pairs[2] || undefined,
          ghaziabad: pairs[3] || undefined,
        });
      }
    }
  }

  return records;
}


// DHAPPA V4 self-learning research API.
// All prediction functions enforce their own target-date cutoff; callers cannot opt out.
app.post('/api/v4/train', (req: Request, res: Response) => {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records as DayMarketEntry[] : [];
    if (records.length < 50) {
      res.status(400).json({ error: 'At least 50 dated rows are required for V4 walk-forward training.' });
      return;
    }
    const report = trainSelfLearningV4(records);
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'V4 training failed.' });
  }
});

app.post('/api/v4/predict', (req: Request, res: Response) => {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records as DayMarketEntry[] : [];
    const targetDate = String(req.body?.targetDate || '');
    const market = String(req.body?.market || '').toLowerCase() as any;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      res.status(400).json({ error: 'targetDate must be YYYY-MM-DD.' });
      return;
    }
    if (!['deshawar','faridabad','gali','ghaziabad'].includes(market)) {
      res.status(400).json({ error: 'Unsupported market.' });
      return;
    }
    const report = trainSelfLearningV4(records);
    const prediction = predictWithV4(records, targetDate, market, report);
    res.json({ success: true, prediction, champion: report.champion });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'V4 prediction failed.' });
  }
});

app.post('/api/v4/learn', (req: Request, res: Response) => {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records as DayMarketEntry[] : [];
    const completedDraw = req.body?.completedDraw as DayMarketEntry | undefined;
    if (!completedDraw?.date) {
      res.status(400).json({ error: 'completedDraw with a date is required.' });
      return;
    }
    const learned = learnAfterDraw(records, completedDraw);
    res.json({ success: true, report: learned.report, recordCount: learned.records.length });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'V4 post-draw learning failed.' });
  }
});

app.get('/api/v4/status', (_req: Request, res: Response) => {
  res.json({
    service: 'dhappa-v4-self-learning',
    objective: 'maximize verified forward Top-K hit rate with 100% chronological integrity',
    safeguards: ['zero-lookahead','predict-before-reveal','protected-holdout','champion-challenger','market-specific-weights'],
    guarantee: 'No exact-result guarantee. 100% candidate coverage is possible only by returning all 100 outcomes.'
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'date-pair-simulator-backend' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Date Pair Simulator server running on port ${PORT}`);
  });
}

startServer();
