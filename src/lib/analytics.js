export function getColumns(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];
  return [...new Set(rows.flatMap(row => (row && typeof row === 'object' ? Object.keys(row) : [])))].filter(Boolean);
}

export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string') return NaN;
  const cleaned = value.trim().replace(/[₹$€£,%\s]/g, '').replace(/,/g, '');
  if (!cleaned) return NaN;
  return Number(cleaned);
}

// Numeric-looking identifiers must not be treated as quantities or model features.
const IDENTIFIER_COLUMN = /mobile|phone|telephone|contact|whats?app|aadhaar|aadhar|ssn|passport|account\s*(?:no|number)?|customer\s*id|user\s*id|order\s*id|invoice\s*id|postal|zip\s*code|pin\s*code|pincode|employee\s*id|(^|\b)id(\b|$)/i;

export function isIdentifierColumn(key) {
  return IDENTIFIER_COLUMN.test(String(key).replace(/[_-]+/g, ' '));
}

export function isNumericColumn(rows, key, { includeIdentifiers = false } = {}) {
  if (!includeIdentifiers && isIdentifierColumn(key)) return false;
  if (!Array.isArray(rows) || !rows.length || !key) return false;
  const values = rows.map(row => row?.[key]).filter(value => value !== null && value !== undefined && String(value).trim() !== '');
  return values.length > 0 && values.every(value => Number.isFinite(toNumber(value)));
}

export function isDateLike(value) {
  if (value === null || value === undefined || String(value).trim() === '' || typeof value === 'number') return false;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  const raw = String(value).trim();
  if (/^\d{4}$/.test(raw) || /^\d{1,2}$/.test(raw)) return false;
  return /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(raw) || /^\d{4}-\d{2}-\d{2}T/.test(raw) || (!Number.isNaN(Date.parse(raw)) && /[a-z]/i.test(raw));
}

export function dateKey(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const raw = String(value ?? '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

export function getSummary(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return { rowCount: 0, columnCount: 0, numericCount: 0, missingCount: 0, missingPercent: 0, duplicateCount: 0, numeric: [], dateColumns: [] };
  }
  const columns = getColumns(rows);
  const numeric = columns.filter(column => isNumericColumn(rows, column));
  const cellCount = rows.length * columns.length;
  const missing = rows.reduce((sum, row) => sum + columns.filter(column => row?.[column] === null || row?.[column] === undefined || String(row[column]).trim() === '').length, 0);
  const duplicateCount = rows.length - new Set(rows.map(row => JSON.stringify(columns.map(column => row?.[column] ?? null)))).size;
  const dateColumns = columns.filter(column => /date|time|created|updated|timestamp/i.test(column) || rows.filter(row => isDateLike(row?.[column])).length >= Math.max(2, Math.ceil(rows.length * 0.7)));
  return { rowCount: rows.length, columnCount: columns.length, numericCount: numeric.length, missingCount: missing, missingPercent: cellCount ? (missing / cellCount) * 100 : 0, duplicateCount, numeric, dateColumns };
}

export function calculate(rows, column, operation = 'sum') {
  if (!column || !Array.isArray(rows) || !rows.length) return null;
  const values = rows.map(row => toNumber(row?.[column])).filter(Number.isFinite).sort((a, b) => a - b);
  if (operation === 'count') return rows.filter(row => row?.[column] !== null && row?.[column] !== undefined && String(row[column]).trim() !== '').length;
  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  if (operation === 'average' || operation === 'mean') return sum / values.length;
  if (operation === 'min') return values[0];
  if (operation === 'max') return values[values.length - 1];
  if (operation === 'median') return values.length % 2 ? values[(values.length - 1) / 2] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
  if (operation === 'stddev') {
    const mean = sum / values.length;
    return Math.sqrt(values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length);
  }
  return sum;
}

export function groupRows(rows, category, metric, operation = 'sum') {
  if (!Array.isArray(rows) || !rows.length || !category) return [];
  const groups = new Map();
  rows.forEach(row => {
    const key = String(row?.[category] ?? '(blank)');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()].map(([name, group]) => ({ name, value: metric ? calculate(group, metric, operation) ?? 0 : group.length })).sort((a, b) => b.value - a.value);
}

export function filterRows(rows, { search = '', category = '', categoryValue = 'All', minDate = '', maxDate = '', dateColumn = '' } = {}) {
  if (!Array.isArray(rows)) return [];
  const query = search.trim().toLowerCase();
  return rows.filter(row => {
    if (!row) return false;
    const matchesSearch = !query || Object.values(row).some(value => String(value ?? '').toLowerCase().includes(query));
    const matchesCategory = !category || categoryValue === 'All' || String(row[category] ?? '(blank)') === categoryValue;
    const key = dateColumn ? dateKey(row[dateColumn]) : '';
    // If a selected date column has an invalid/blank value, exclude that row only while a date bound is active.
    const matchesMin = !minDate || (key && key >= minDate);
    const matchesMax = !maxDate || (key && key <= maxDate);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });
}

/**
 * Intelligent category column detector:
 * Prefers columns that have categorical cardinality (2 to 60 unique values),
 * are not purely numeric, not identifiers, and not date columns.
 */
export function detectBestCategoryColumn(rows, columns = getColumns(rows)) {
  if (!Array.isArray(rows) || !rows.length || !columns.length) return '';
  const numericSet = new Set(columns.filter(col => isNumericColumn(rows, col)));
  const candidates = columns.filter(col => !numericSet.has(col) && !isIdentifierColumn(col) && !/date|time|created|updated|timestamp/i.test(col));

  for (const col of candidates) {
    const uniqueCount = new Set(rows.map(r => r?.[col]).filter(v => v !== null && v !== undefined && String(v).trim() !== '')).size;
    if (uniqueCount >= 2 && uniqueCount <= 60) return col;
  }
  if (candidates.length) return candidates[0];

  // Fallback to first non-numeric column if any
  const nonNumeric = columns.filter(col => !numericSet.has(col));
  if (nonNumeric.length) return nonNumeric[0];

  return columns[0] || '';
}

/**
 * Intelligent numeric metric column detector:
 * Picks the first valid numeric measure column (excluding identifiers).
 */
export function detectBestMetricColumn(rows, columns = getColumns(rows)) {
  if (!Array.isArray(rows) || !rows.length) return '';
  const numericColumns = columns.filter(col => isNumericColumn(rows, col));
  return numericColumns[0] || '';
}

/**
 * Intelligent date column detector:
 */
export function detectBestDateColumn(rows, columns = getColumns(rows)) {
  if (!Array.isArray(rows) || !rows.length) return '';
  const dateCols = columns.filter(column => /date|time|created|updated|timestamp/i.test(column) || rows.filter(row => isDateLike(row?.[column])).length >= Math.max(2, Math.ceil(rows.length * 0.7)));
  return dateCols[0] || '';
}

/**
 * Generates histogram bin data for numeric distribution charts
 */
export function getHistogramData(rows, column, binCount = 8) {
  if (!column || !Array.isArray(rows) || !rows.length) return [];
  const numbers = rows.map(r => toNumber(r?.[column])).filter(Number.isFinite).sort((a, b) => a - b);
  if (!numbers.length) return [];

  const min = numbers[0];
  const max = numbers[numbers.length - 1];
  if (min === max) {
    return [{ bin: `${min}`, count: numbers.length, min, max }];
  }

  const range = max - min;
  const step = range / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const binMin = min + i * step;
    const binMax = i === binCount - 1 ? max : min + (i + 1) * step;
    const label = `${Number(binMin.toFixed(1)).toLocaleString()} - ${Number(binMax.toFixed(1)).toLocaleString()}`;
    return { bin: label, count: 0, min: binMin, max: binMax };
  });

  for (const num of numbers) {
    let index = Math.floor((num - min) / step);
    if (index >= binCount) index = binCount - 1;
    if (index < 0) index = 0;
    bins[index].count++;
  }

  return bins;
}

/**
 * Calculates Pearson correlation coefficient (r) between two numeric columns
 */
export function calculateCorrelation(rows, xCol, yCol) {
  if (!xCol || !yCol || !Array.isArray(rows) || rows.length < 2) return null;
  const pairs = rows
    .map(r => ({ x: toNumber(r?.[xCol]), y: toNumber(r?.[yCol]) }))
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

  if (pairs.length < 2) return null;

  const n = pairs.length;
  const sumX = pairs.reduce((acc, p) => acc + p.x, 0);
  const sumY = pairs.reduce((acc, p) => acc + p.y, 0);
  const sumXY = pairs.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumX2 = pairs.reduce((acc, p) => acc + p.x * p.x, 0);
  const sumY2 = pairs.reduce((acc, p) => acc + p.y * p.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return { r: 0, label: 'No variance' };
  const r = numerator / denominator;

  let label = 'No correlation';
  const absR = Math.abs(r);
  if (absR >= 0.8) label = r > 0 ? 'Strong positive' : 'Strong negative';
  else if (absR >= 0.5) label = r > 0 ? 'Moderate positive' : 'Moderate negative';
  else if (absR >= 0.2) label = r > 0 ? 'Weak positive' : 'Weak negative';

  return { r, label, sampleCount: pairs.length };
}

/**
 * Clean dataset helper: Remove duplicate rows
 */
export function cleanDuplicates(rows) {
  if (!Array.isArray(rows)) return [];
  const columns = getColumns(rows);
  const seen = new Set();
  return rows.filter(row => {
    const key = JSON.stringify(columns.map(c => row?.[c] ?? null));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Clean dataset helper: Drop rows with any blank/null value
 */
export function cleanDropMissing(rows) {
  if (!Array.isArray(rows)) return [];
  const columns = getColumns(rows);
  return rows.filter(row => columns.every(col => row?.[col] !== null && row?.[col] !== undefined && String(row[col]).trim() !== ''));
}
