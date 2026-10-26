import { toNumber } from './analytics.js';

export function fitLinearRegression(rows, xColumn, yColumn) {
  const pairs = rows.map(row => ({ x: toNumber(row[xColumn]), y: toNumber(row[yColumn]) })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (pairs.length < 3) throw new Error('Choose two numeric columns with at least 3 complete rows.');
  const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / pairs.length;
  const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / pairs.length;
  const denominator = pairs.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
  if (denominator === 0) throw new Error(`The input column “${xColumn}” must contain at least two different values.`);
  const slope = pairs.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0) / denominator;
  const intercept = meanY - slope * meanX;
  const predict = x => intercept + slope * x;
  const sse = pairs.reduce((sum, p) => sum + (p.y - predict(p.x)) ** 2, 0);
  const sst = pairs.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0);
  const mae = pairs.reduce((sum, p) => sum + Math.abs(p.y - predict(p.x)), 0) / pairs.length;
  const rmse = Math.sqrt(sse / pairs.length);
  return { pairs, slope, intercept, predict, r2: sst === 0 ? (sse === 0 ? 1 : 0) : 1 - sse / sst, mae, rmse };
}

export function evaluateLinearRegression(rows, xColumn, yColumn) {
  const pairs = rows.map(row => ({ x: toNumber(row[xColumn]), y: toNumber(row[yColumn]) })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (pairs.length < 5) return { mode: 'training', ...fitLinearRegression(pairs.map(p => ({ x: p.x, y: p.y })), 'x', 'y') };
  const split = Math.max(2, Math.floor(pairs.length * 0.8));
  const trainRows = pairs.slice(0, split).map(p => ({ x: p.x, y: p.y }));
  const testRows = pairs.slice(split).map(p => ({ x: p.x, y: p.y }));
  const model = fitLinearRegression(trainRows, 'x', 'y');
  const actualMean = testRows.reduce((sum, p) => sum + p.y, 0) / testRows.length;
  const sse = testRows.reduce((sum, p) => sum + (p.y - model.predict(p.x)) ** 2, 0);
  const sst = testRows.reduce((sum, p) => sum + (p.y - actualMean) ** 2, 0);
  const mae = testRows.reduce((sum, p) => sum + Math.abs(p.y - model.predict(p.x)), 0) / testRows.length;
  const rmse = Math.sqrt(sse / testRows.length);
  return { mode: 'holdout', r2: sst === 0 ? null : 1 - sse / sst, mae, rmse, trainCount: trainRows.length, testCount: testRows.length };
}
