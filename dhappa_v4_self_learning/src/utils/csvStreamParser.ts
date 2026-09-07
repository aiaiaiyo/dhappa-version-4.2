/**
 * Asynchronous Non-Blocking Chunked Stream Parser for Large Datasets (CSV & JSON)
 * Prevents UI freezes / hanging when uploading large dataset files (1,000 to 100,000+ rows).
 * Processes records in asynchronous microtask chunks while providing 60fps live progress feedback.
 */

import { DayMarketEntry } from '../types';

export interface ParseProgress {
  processedRows: number;
  totalRows: number;
  percentage: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  isComplete: boolean;
  isCancelled: boolean;
}

export interface ParseOptions {
  chunkSize?: number;
  existingDates?: Set<string>;
  onProgress?: (progress: ParseProgress) => void;
}

export interface ParseResult {
  validRecords: DayMarketEntry[];
  duplicateCount: number;
  errors: string[];
  totalRowsProcessed: number;
  cancelled: boolean;
}

/**
 * Parses large CSV text content in non-blocking asynchronous chunks
 */
export async function parseCsvStreamAsync(
  rawCsvText: string,
  options: ParseOptions = {},
  cancellationRef = { isCancelled: false }
): Promise<ParseResult> {
  const chunkSize = options.chunkSize || 1000;
  const existingDates = options.existingDates || new Set<string>();

  const lines = rawCsvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const totalRows = Math.max(0, lines.length - 1); // Exclude header

  const errors: string[] = [];
  const validRecords: DayMarketEntry[] = [];
  let duplicateCount = 0;

  if (lines.length < 2) {
    return {
      validRecords: [],
      duplicateCount: 0,
      errors: ['CSV must contain at least a header row and one data row.'],
      totalRowsProcessed: 0,
      cancelled: false,
    };
  }

  // Parse header
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const dateIdx = header.findIndex((h) => h.includes('date'));
  const deshIdx = header.findIndex((h) => h.includes('deshawar'));
  const fariIdx = header.findIndex((h) => h.includes('faridabad'));
  const galiIdx = header.findIndex((h) => h.includes('gali'));
  const ghazIdx = header.findIndex((h) => h.includes('ghaziabad'));
  const notesIdx = header.findIndex((h) => h.includes('note'));

  if (dateIdx === -1) {
    return {
      validRecords: [],
      duplicateCount: 0,
      errors: ['CSV header must contain a "date" column.'],
      totalRowsProcessed: 0,
      cancelled: false,
    };
  }

  const dateSeenInFile = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    if (cancellationRef.isCancelled) {
      return {
        validRecords,
        duplicateCount,
        errors,
        totalRowsProcessed: i - 1,
        cancelled: true,
      };
    }

    const row = lines[i];
    // Basic CSV line splitter respecting quoted fields
    const cols = splitCsvRow(row);
    const dateVal = cols[dateIdx]?.trim();

    if (!dateVal) {
      if (i <= 50) errors.push(`Row ${i + 1}: Missing date value.`);
      continue;
    }

    if (existingDates.has(dateVal) || dateSeenInFile.has(dateVal)) {
      duplicateCount++;
    }

    dateSeenInFile.add(dateVal);

    const cleanPair = (val?: string) => {
      if (!val) return undefined;
      const num = val.trim().replace(/\D/g, '');
      return num ? num.padStart(2, '0').slice(-2) : undefined;
    };

    validRecords.push({
      id: `csv-${Date.now()}-${i}`,
      date: dateVal,
      deshawar: cleanPair(cols[deshIdx]),
      faridabad: cleanPair(cols[fariIdx]),
      gali: cleanPair(cols[galiIdx]),
      ghaziabad: cleanPair(cols[ghazIdx]),
      notes: notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : 'Imported via Stream CSV',
      createdAt: new Date().toISOString(),
      source: 'import',
    });

    // Yield control to UI thread every chunkSize records
    if (i % chunkSize === 0 || i === lines.length - 1) {
      const processedRows = i;
      const percentage = Math.round((processedRows / totalRows) * 100);

      if (options.onProgress) {
        options.onProgress({
          processedRows,
          totalRows,
          percentage: Math.min(100, percentage),
          validCount: validRecords.length,
          duplicateCount,
          errorCount: errors.length,
          isComplete: i === lines.length - 1,
          isCancelled: false,
        });
      }

      // Yield main thread execution to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    validRecords,
    duplicateCount,
    errors,
    totalRowsProcessed: totalRows,
    cancelled: false,
  };
}

/**
 * Parses JSON content asynchronously with batching for large arrays
 */
export async function parseJsonStreamAsync(
  rawJsonText: string,
  options: ParseOptions = {},
  cancellationRef = { isCancelled: false }
): Promise<ParseResult> {
  const chunkSize = options.chunkSize || 1000;
  const existingDates = options.existingDates || new Set<string>();

  const errors: string[] = [];
  const validRecords: DayMarketEntry[] = [];
  let duplicateCount = 0;

  let parsed: any[];
  try {
    const rawParsed = JSON.parse(rawJsonText);
    parsed = Array.isArray(rawParsed)
      ? rawParsed
      : Array.isArray(rawParsed?.records)
      ? rawParsed.records
      : [];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        validRecords: [],
        duplicateCount: 0,
        errors: ['JSON does not contain a valid non-empty array of record objects.'],
        totalRowsProcessed: 0,
        cancelled: false,
      };
    }
  } catch (err: any) {
    return {
      validRecords: [],
      duplicateCount: 0,
      errors: [`JSON Syntax Error: ${err.message}`],
      totalRowsProcessed: 0,
      cancelled: false,
    };
  }

  const totalRows = parsed.length;
  const dateSeenInFile = new Set<string>();

  for (let i = 0; i < parsed.length; i++) {
    if (cancellationRef.isCancelled) {
      return {
        validRecords,
        duplicateCount,
        errors,
        totalRowsProcessed: i,
        cancelled: true,
      };
    }

    const item = parsed[i];
    if (!item || !item.date || typeof item.date !== 'string') {
      if (i <= 50) errors.push(`Item ${i + 1}: Missing valid "date" string.`);
      continue;
    }

    if (existingDates.has(item.date) || dateSeenInFile.has(item.date)) {
      duplicateCount++;
    }

    dateSeenInFile.add(item.date);

    const formatPair = (val: any) => {
      if (val === undefined || val === null || val === '') return undefined;
      const str = String(val).replace(/\D/g, '');
      return str ? str.padStart(2, '0').slice(-2) : undefined;
    };

    validRecords.push({
      id: item.id || `json-${Date.now()}-${i}`,
      date: item.date,
      deshawar: formatPair(item.deshawar),
      faridabad: formatPair(item.faridabad),
      gali: formatPair(item.gali),
      ghaziabad: formatPair(item.ghaziabad),
      notes: item.notes || 'Imported via JSON',
      createdAt: item.createdAt || new Date().toISOString(),
      source: item.source || 'import',
    });

    if ((i + 1) % chunkSize === 0 || i === parsed.length - 1) {
      const processedRows = i + 1;
      const percentage = Math.round((processedRows / totalRows) * 100);

      if (options.onProgress) {
        options.onProgress({
          processedRows,
          totalRows,
          percentage: Math.min(100, percentage),
          validCount: validRecords.length,
          duplicateCount,
          errorCount: errors.length,
          isComplete: i === parsed.length - 1,
          isCancelled: false,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    validRecords,
    duplicateCount,
    errors,
    totalRowsProcessed: totalRows,
    cancelled: false,
  };
}

/**
 * Fast helper to split CSV row handling quotes correctly
 */
function splitCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}
