import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { sampleDatasets, demoRows } from './sampleDatasets.js';

export { sampleDatasets, demoRows };

export const normalizeRows = rows => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => row && typeof row === 'object' && Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== ''));
};

/**
 * Strips UTF-8 Byte Order Mark (BOM) if present.
 */
function stripBOM(text) {
  if (typeof text !== 'string') return text;
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

/**
 * Extracts rows from a specific worksheet in an XLSX workbook.
 */
export function parseWorkbookSheet(workbook, sheetName) {
  if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) {
    throw new Error('Invalid Excel workbook.');
  }
  const selected = sheetName && workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[selected];
  if (!worksheet) throw new Error(`Worksheet "${selected}" not found.`);

  // Parse rows with defval: null and cellDates: true
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
  const rows = normalizeRows(rawRows).map(row => {
    const cleaned = {};
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = String(key).trim();
      if (cleanKey && !cleanKey.startsWith('__EMPTY')) {
        cleaned[cleanKey] = val;
      }
    }
    return cleaned;
  });

  if (!rows.length) throw new Error(`Worksheet "${selected}" has no tabular data.`);
  return { rows, sheetName: selected };
}

/**
 * Parses raw text input (CSV, TSV, or JSON) directly.
 */
export function parseTextData(rawText, formatHint = 'auto') {
  const text = stripBOM(rawText.trim());
  if (!text) throw new Error('Input text is empty.');

  // Check if it's JSON
  if (formatHint === 'json' || (formatHint === 'auto' && (text.startsWith('[') || text.startsWith('{')))) {
    try {
      const parsed = JSON.parse(text);
      let data = [];
      if (Array.isArray(parsed)) {
        data = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (arrayKey) data = parsed[arrayKey];
      }
      const rows = normalizeRows(data);
      if (!rows.length || !Object.keys(rows[0]).length) {
        throw new Error('No valid tabular array found in JSON.');
      }
      return { rows, sheets: [], sheetName: '' };
    } catch (e) {
      if (formatHint === 'json') throw new Error(`JSON parse error: ${e.message}`);
    }
  }

  // Parse as CSV / Delimited
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
    transformHeader: h => (h ? h.trim() : '')
  });

  if (parsed.errors.length && !parsed.data.length) {
    throw new Error(parsed.errors[0]?.message || 'Could not parse delimited text.');
  }

  const rows = normalizeRows(parsed.data);
  if (!rows.length || !Object.keys(rows[0]).length) {
    throw new Error('No tabular data found in input.');
  }

  return { rows, sheets: [], sheetName: '' };
}

/**
 * Parses user-uploaded file (CSV, TSV, TXT, JSON, XLS, XLSX).
 */
export async function parseFile(file, sheetName) {
  if (!file) throw new Error('No file provided.');
  const ext = (file.name || '').split('.').pop()?.toLowerCase();

  // JSON files
  if (ext === 'json') {
    const text = await file.text();
    return parseTextData(text, 'json');
  }

  // Delimited text files (CSV, TSV, TXT)
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const text = await file.text();
    return parseTextData(text, 'csv');
  }

  // Excel files
  if (['xlsx', 'xls'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    if (!workbook.SheetNames || !workbook.SheetNames.length) {
      throw new Error('No worksheets found in this Excel file.');
    }
    const { rows, sheetName: activeSheet } = parseWorkbookSheet(workbook, sheetName);
    return { rows, sheets: workbook.SheetNames, sheetName: activeSheet, workbook };
  }

  throw new Error('Choose a CSV, TSV, JSON, XLS, or XLSX file.');
}

export {
  getColumns,
  isNumericColumn,
  isIdentifierColumn,
  isDateLike,
  dateKey,
  toNumber,
  getSummary,
  calculate,
  groupRows,
  filterRows,
  detectBestCategoryColumn,
  detectBestMetricColumn,
  detectBestDateColumn,
  getHistogramData,
  calculateCorrelation,
  cleanDuplicates,
  cleanDropMissing
} from './analytics.js';
