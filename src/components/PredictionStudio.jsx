import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, InputNumber, Select, Tooltip, Tag } from 'antd';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { fitLinearRegression, evaluateLinearRegression } from '../lib/regression.js';
import { toNumber, calculateCorrelation } from '../lib/analytics.js';

const fmt = value => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—';

export default function PredictionStudio({ rows, numericColumns }) {
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [model, setModel] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [inputValue, setInputValue] = useState(null);
  const [error, setError] = useState('');
  const [trained, setTrained] = useState(false);

  // Sync state whenever numeric columns or dataset rows change
  useEffect(() => {
    if (!numericColumns || !numericColumns.length) {
      setXColumn('');
      setYColumn('');
    } else {
      const nextX = numericColumns.includes(xColumn) ? xColumn : numericColumns[0];
      const nextY = numericColumns.includes(yColumn) && yColumn !== nextX
        ? yColumn
        : (numericColumns.find(c => c !== nextX) || numericColumns[1] || numericColumns[0]);

      setXColumn(nextX);
      setYColumn(nextY);
    }
    setModel(null);
    setEvaluation(null);
    setInputValue(null);
    setTrained(false);
    setError('');
  }, [numericColumns, rows]);

  const options = numericColumns.map(value => ({ label: value, value }));

  const pairs = useMemo(() => {
    if (!xColumn || !yColumn) return [];
    return rows
      .map(row => ({ x: toNumber(row[xColumn]), y: toNumber(row[yColumn]) }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  }, [rows, xColumn, yColumn]);

  const correlation = useMemo(() => {
    if (!xColumn || !yColumn || xColumn === yColumn) return null;
    return calculateCorrelation(rows, xColumn, yColumn);
  }, [rows, xColumn, yColumn]);

  const chartData = useMemo(() => {
    if (!model) return [];
    const actual = pairs.map(p => ({ x: p.x, actual: p.y })).sort((a, b) => a.x - b.x);
    return actual.map(point => ({ ...point, fitted: model.predict(point.x) }));
  }, [pairs, model]);

  const prediction = model && inputValue !== null && Number.isFinite(Number(inputValue)) ? model.predict(Number(inputValue)) : null;

  const train = () => {
    setError('');
    setModel(null);
    setEvaluation(null);
    setTrained(false);
    try {
      if (!xColumn || !yColumn) throw new Error('Select both an input feature and a target column.');
      if (xColumn === yColumn) throw new Error('Choose different input and target columns.');
      const nextModel = fitLinearRegression(rows, xColumn, yColumn);
      setModel(nextModel);
      setEvaluation(evaluateLinearRegression(rows, xColumn, yColumn));
      setInputValue(nextModel.pairs[0]?.x ?? null);
      setTrained(true);
    } catch (err) {
      setError(err.message || 'Could not train the model.');
    }
  };

  const resetModel = () => {
    setModel(null);
    setEvaluation(null);
    setInputValue(null);
    setTrained(false);
    setError('');
  };

  return (
    <section id="prediction" className="panel-card scroll-mt-28">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="section-title">Prediction Studio</h2>
          <p className="section-subtitle">Train regression models on your numeric data and predict target values in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          {correlation && (
            <Tag color={Math.abs(correlation.r) >= 0.5 ? 'purple' : 'default'} className="px-3 py-1 text-xs">
              Correlation r = {correlation.r.toFixed(2)} ({correlation.label})
            </Tag>
          )}
          <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Simple Linear Regression
          </span>
        </div>
      </div>

      {numericColumns.length < 2 && (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="At least two numeric columns are needed"
          description="Upload or choose a dataset with two numeric measure columns to use the prediction model."
        />
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="field-label">
          Input feature (X)
          <Select
            className="mt-1 w-full"
            value={xColumn || undefined}
            options={options}
            onChange={value => {
              setXColumn(value);
              resetModel();
            }}
            placeholder="Select X column"
            showSearch
            disabled={numericColumns.length < 2}
          />
        </label>
        <label className="field-label">
          Target to predict (Y)
          <Select
            className="mt-1 w-full"
            value={yColumn || undefined}
            options={options}
            onChange={value => {
              setYColumn(value);
              resetModel();
            }}
            placeholder="Select Y column"
            showSearch
            disabled={numericColumns.length < 2}
          />
        </label>
        <div className="flex items-end gap-2">
          <Button
            type="primary"
            className="w-full"
            onClick={train}
            disabled={numericColumns.length < 2 || !xColumn || !yColumn || xColumn === yColumn}
          >
            Train model
          </Button>
          {trained && (
            <Tooltip title="Clear model">
              <Button onClick={resetModel} icon={<i className="ri-close-line" />} />
            </Tooltip>
          )}
        </div>
      </div>

      {error && <Alert className="mt-4" type="error" showIcon message={error} />}

      {model && trained && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Metric
              label="R² Score (Accuracy)"
              value={evaluation?.r2 == null ? 'N/A' : fmt(evaluation.r2)}
              hint={evaluation?.r2 != null && evaluation.r2 >= 0.7 ? 'Strong predictive power' : 'Moderate or weak correlation'}
            />
            <Metric
              label="MAE (Mean Absolute Error)"
              value={fmt(evaluation?.mae)}
              hint={`Average deviation in ${yColumn}`}
            />
            <Metric
              label="RMSE"
              value={fmt(evaluation?.rmse)}
              hint="Root mean squared error"
            />
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Model Equation</p>
              <p className="mt-1 text-sm font-bold text-violet-950">
                {yColumn} = {fmt(model.slope)} × ({xColumn}) {model.intercept < 0 ? '−' : '+'} {fmt(Math.abs(model.intercept))}
              </p>
              <p className="mt-1 text-[11px] text-violet-700">
                Each 1 unit change in {xColumn} shifts {yColumn} by ~{fmt(model.slope)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.85fr)]">
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Actual values vs fitted line</h3>
                  <p className="text-xs text-slate-400">
                    {pairs.length} complete row pairs analyzed
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-600"/> Actual</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-3.5 bg-emerald-600"/> Fitted</span>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 12, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={xColumn}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <RechartsTooltip
                      formatter={(val, name) => [fmt(Number(val)), name === 'actual' ? `Actual ${yColumn}` : `Fitted ${yColumn}`]}
                    />
                    <Scatter dataKey="actual" fill="#625bf6" name="actual" />
                    <Line dataKey="fitted" type="linear" stroke="#16a34a" strokeWidth={2.5} dot={false} name="fitted" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-800">Predict a value</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Enter any value for <strong className="text-slate-600">{xColumn}</strong> to forecast <strong className="text-slate-600">{yColumn}</strong>.
              </p>
              <label className="field-label mt-4 block">
                {xColumn} value
                <InputNumber
                  className="mt-1 w-full"
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder={`Enter ${xColumn}…`}
                />
              </label>
              <div className="mt-4 rounded-xl bg-violet-50/80 border border-violet-100 p-4">
                <p className="text-xs font-semibold text-violet-700">Predicted {yColumn}</p>
                <p className="mt-1 break-words text-2xl font-extrabold text-violet-950">
                  {prediction == null || !Number.isFinite(prediction) ? '—' : fmt(prediction)}
                </p>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-slate-400">
                {evaluation?.mode === 'holdout'
                  ? `${evaluation.trainCount} rows used for training, evaluated on ${evaluation.testCount} held-out test rows.`
                  : 'Sample size < 5 rows; metrics calculated on training data.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
