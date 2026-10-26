import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate,
  filterRows,
  getSummary,
  groupRows,
  toNumber,
  isNumericColumn,
  detectBestCategoryColumn,
  detectBestMetricColumn,
  detectBestDateColumn,
  getHistogramData,
  calculateCorrelation,
  cleanDuplicates,
  cleanDropMissing
} from './analytics.js';
import { parseTextData } from './data.js';

const rows = [{ group: 'A', value: 10 }, { group: 'B', value: 20 }, { group: 'A', value: 30 }];

test('toNumber handles formatted numeric strings', () => {
  assert.equal(toNumber('₹1,200'), 1200);
  assert.equal(toNumber('$3,450.50'), 3450.5);
  assert.equal(toNumber(' 15% '), 15);
});

test('calculate supports sum, average, median and standard deviation', () => {
  assert.equal(calculate(rows, 'value', 'sum'), 60);
  assert.equal(calculate(rows, 'value', 'average'), 20);
  assert.equal(calculate(rows, 'value', 'median'), 20);
  assert.equal(calculate(rows, 'value', 'stddev'), Math.sqrt(200 / 3));
});

test('groupRows aggregates rows by category', () => {
  assert.deepEqual(
    groupRows(rows, 'group', 'value').map(item => [item.name, item.value]),
    [['A', 40], ['B', 20]]
  );
});

test('filterRows applies text search and category filter', () => {
  assert.equal(filterRows(rows, { search: '30', category: 'group', categoryValue: 'A' }).length, 1);
});

test('getSummary counts rows, columns and missing values', () => {
  const summary = getSummary([{ a: 1, b: '' }, { a: 2, b: 3 }]);
  assert.equal(summary.rowCount, 2);
  assert.equal(summary.columnCount, 2);
  assert.equal(summary.missingCount, 1);
});

test('identifier columns are not treated as numeric measures', () => {
  const records = [{ mobile: '9876543210', sales: 150 }, { mobile: '9123456780', sales: 220 }];
  assert.equal(isNumericColumn(records, 'mobile'), false);
  assert.equal(isNumericColumn(records, 'sales'), true);
});

test('date range filtering includes both boundary days', () => {
  const dated = [{ Date: '2026-01-01', value: 1 }, { Date: '2026-01-15', value: 2 }, { Date: '2026-02-01', value: 3 }];
  assert.deepEqual(
    filterRows(dated, { dateColumn: 'Date', minDate: '2026-01-01', maxDate: '2026-01-15' }).map(row => row.value),
    [1, 2]
  );
});

test('detectBestCategoryColumn prioritizes categorical columns over identifiers and numbers', () => {
  const sample = [
    { OrderId: '1001', Category: 'Electronics', Date: '2026-01-01', Revenue: 500 },
    { OrderId: '1002', Category: 'Furniture', Date: '2026-01-02', Revenue: 800 }
  ];
  assert.equal(detectBestCategoryColumn(sample), 'Category');
});

test('detectBestMetricColumn chooses the first numeric column', () => {
  const sample = [
    { Name: 'Alice', Age: 30, Salary: 90000 },
    { Name: 'Bob', Age: 25, Salary: 75000 }
  ];
  assert.equal(detectBestMetricColumn(sample), 'Age');
});

test('detectBestDateColumn finds the date field', () => {
  const sample = [
    { Item: 'Widget', CreatedAt: '2026-03-01', Qty: 5 },
    { Item: 'Gadget', CreatedAt: '2026-03-02', Qty: 8 }
  ];
  assert.equal(detectBestDateColumn(sample), 'CreatedAt');
});

test('getHistogramData correctly bins numeric intervals', () => {
  const sample = [{ v: 10 }, { v: 20 }, { v: 30 }, { v: 40 }];
  const bins = getHistogramData(sample, 'v', 2);
  assert.equal(bins.length, 2);
  assert.equal(bins[0].count + bins[1].count, 4);
});

test('calculateCorrelation computes positive correlation', () => {
  const sample = [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
    { x: 3, y: 30 },
    { x: 4, y: 40 }
  ];
  const corr = calculateCorrelation(sample, 'x', 'y');
  assert.ok(corr);
  assert.equal(Math.round(corr.r), 1);
  assert.equal(corr.label, 'Strong positive');
});

test('cleanDuplicates filters identical rows', () => {
  const sample = [
    { a: 1, b: 'x' },
    { a: 2, b: 'y' },
    { a: 1, b: 'x' }
  ];
  const cleaned = cleanDuplicates(sample);
  assert.equal(cleaned.length, 2);
});

test('cleanDropMissing removes rows with null or empty values', () => {
  const sample = [
    { a: 1, b: 'valid' },
    { a: 2, b: '' },
    { a: null, b: 'test' }
  ];
  const cleaned = cleanDropMissing(sample);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].a, 1);
});

test('parseTextData parses CSV and JSON text seamlessly', () => {
  const csv = 'City,Population\nTokyo,37000000\nDelhi,30000000';
  const csvParsed = parseTextData(csv);
  assert.equal(csvParsed.rows.length, 2);
  assert.equal(csvParsed.rows[0].City, 'Tokyo');

  const json = JSON.stringify([{ Name: 'Alpha', Score: 95 }, { Name: 'Beta', Score: 88 }]);
  const jsonParsed = parseTextData(json);
  assert.equal(jsonParsed.rows.length, 2);
  assert.equal(jsonParsed.rows[1].Score, 88);
});
