import test from 'node:test';
import assert from 'node:assert/strict';
import { fitLinearRegression, evaluateLinearRegression } from './regression.js';

test('linear regression fits a perfect line', () => {
  const model = fitLinearRegression([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }], 'x', 'y');
  assert.equal(model.slope, 2);
  assert.equal(model.intercept, 1);
  assert.equal(model.predict(4), 9);
  assert.equal(model.r2, 1);
});
test('linear regression rejects a constant input column', () => {
  assert.throws(() => fitLinearRegression([{ x: 2, y: 1 }, { x: 2, y: 3 }, { x: 2, y: 5 }], 'x', 'y'), /different values/);
});
test('evaluation uses a held-out test set for at least five rows', () => {
  const rows = Array.from({ length: 10 }, (_, index) => ({ x: index + 1, y: 2 * (index + 1) + 1 }));
  const result = evaluateLinearRegression(rows, 'x', 'y');
  assert.equal(result.mode, 'holdout');
  assert.equal(result.trainCount, 8);
  assert.equal(result.testCount, 2);
  assert.equal(result.mae, 0);
});
