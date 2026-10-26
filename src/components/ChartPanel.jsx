import { useState, useMemo, useEffect } from 'react';
import { Select, Segmented, Radio, Tooltip } from 'antd';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { calculate, getHistogramData, toNumber } from '../lib/analytics.js';

const COLORS = ['#625bf6', '#22a06b', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
const operations = [
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'average' },
  { label: 'Count', value: 'count' },
  { label: 'Minimum', value: 'min' },
  { label: 'Maximum', value: 'max' },
  { label: 'Median', value: 'median' },
  { label: 'Std. deviation', value: 'stddev' }
];

export default function ChartPanel({
  rows,
  columns,
  numericColumns,
  category,
  setCategory,
  metric,
  setMetric,
  operation,
  setOperation,
  chartType,
  setChartType
}) {
  const [topLimit, setTopLimit] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [secondaryMetric, setSecondaryMetric] = useState('');

  // Validate active category and metric against incoming columns
  const activeCategory = columns.includes(category) ? category : (columns[0] || '');
  const activeMetric = numericColumns.includes(metric) ? metric : (numericColumns[0] || '');
  const activeSecondary = numericColumns.includes(secondaryMetric) && secondaryMetric !== activeMetric
    ? secondaryMetric
    : (numericColumns.find(c => c !== activeMetric) || numericColumns[1] || '');

  // Synchronize parent state if current values are invalid
  useEffect(() => {
    if (category && !columns.includes(category) && columns.length > 0) {
      setCategory(columns[0]);
    }
  }, [columns, category, setCategory]);

  useEffect(() => {
    if (metric && !numericColumns.includes(metric) && numericColumns.length > 0) {
      setMetric(numericColumns[0]);
    }
  }, [numericColumns, metric, setMetric]);

  // Aggregate grouped data
  const data = useMemo(() => {
    if (!rows.length || !activeCategory) return [];
    const groups = new Map();
    rows.forEach(row => {
      const name = String(row[activeCategory] ?? '(blank)');
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(row);
    });

    let items = [...groups.entries()]
      .map(([name, group]) => ({
        name,
        value: activeMetric ? calculate(group, activeMetric, operation) : group.length,
        count: group.length
      }))
      .filter(item => Number.isFinite(item.value));

    // Sorting
    if (sortOrder === 'desc') items.sort((a, b) => b.value - a.value);
    else if (sortOrder === 'asc') items.sort((a, b) => a.value - b.value);
    else items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Limit
    if (topLimit === '5') return items.slice(0, 5);
    if (topLimit === '10') return items.slice(0, 10);
    if (topLimit === '20') return items.slice(0, 20);
    return items;
  }, [rows, activeCategory, activeMetric, operation, sortOrder, topLimit]);

  // Histogram data
  const histogramData = useMemo(() => {
    if (chartType !== 'distribution' || !activeMetric) return [];
    return getHistogramData(rows, activeMetric, 8);
  }, [rows, activeMetric, chartType]);

  // Scatter data
  const scatterData = useMemo(() => {
    if (chartType !== 'scatter' || !activeMetric || !activeSecondary) return [];
    return rows
      .map(r => ({
        x: toNumber(r[activeMetric]),
        y: toNumber(r[activeSecondary]),
        name: r[activeCategory] || ''
      }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  }, [rows, activeMetric, activeSecondary, activeCategory, chartType]);

  const chartOptions = [
    { label: 'Bar', value: 'bar' },
    { label: 'Line', value: 'line' },
    { label: 'Area', value: 'area' },
    { label: 'Pie', value: 'pie' },
    { label: 'Distribution', value: 'distribution' },
    { label: 'Scatter', value: 'scatter' }
  ];

  const formatNumber = val => {
    if (!Number.isFinite(val)) return '—';
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return Number(val.toFixed(2)).toLocaleString();
  };

  const sharedAxes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis
        dataKey="name"
        tickLine={false}
        axisLine={{ stroke: '#cbd5e1' }}
        tick={{ fill: '#64748b', fontSize: 11 }}
      />
      <YAxis
        tickLine={false}
        axisLine={{ stroke: '#cbd5e1' }}
        tick={{ fill: '#64748b', fontSize: 11 }}
        tickFormatter={formatNumber}
        width={55}
      />
      <RechartsTooltip
        formatter={val => [Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }), activeMetric || 'Records']}
        contentStyle={{ borderRadius: 12, border: '1px solid #e9edf5', boxShadow: '0 8px 24px #0f172a0d' }}
      />
    </>
  );

  const renderChart = () => {
    if (!rows.length) {
      return <div className="grid h-full place-items-center text-sm text-slate-400">No data available for the current filter.</div>;
    }

    if (chartType === 'distribution') {
      if (!histogramData.length) {
        return <div className="grid h-full place-items-center text-sm text-slate-400">Select a numeric metric to view frequency distribution.</div>;
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="bin" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#64748b', fontSize: 11 }} />
            <RechartsTooltip formatter={val => [`${val} rows`, 'Frequency']} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'scatter') {
      if (!scatterData.length) {
        return <div className="grid h-full place-items-center text-sm text-slate-400">Requires at least two numeric measures.</div>;
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" dataKey="x" name={activeMetric} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: activeMetric, position: 'insideBottom', offset: -10, fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name={activeSecondary} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: activeSecondary, angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val, name) => [Number(val).toLocaleString(), name]} />
            <Scatter name="Points" data={scatterData} fill="#625bf6" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    if (!data.length) {
      return <div className="grid h-full place-items-center text-sm text-slate-400">No numeric values match these settings.</div>;
    }

    if (chartType === 'pie') {
      const pieData = data.slice(0, 8);
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={3}
            >
              {pieData.map((item, index) => (
                <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={val => [Number(val).toLocaleString(), activeMetric || 'Total']} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {sharedAxes}
            <Line type="monotone" dataKey="value" stroke="#625bf6" strokeWidth={3} dot={{ r: 3, fill: '#625bf6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            {sharedAxes}
            <Area type="monotone" dataKey="value" stroke="#625bf6" fill="#625bf6" fillOpacity={0.16} strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          {sharedAxes}
          <Bar dataKey="value" fill="#625bf6" radius={[6, 6, 0, 0]} maxBarSize={46} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <section className="panel-card">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-center">
        <div>
          <h2 className="section-title">Visual exploration</h2>
          <p className="section-subtitle">
            Aggregate data across categories, inspect distributions, or compare metrics.
          </p>
        </div>
        <Segmented
          options={chartOptions}
          value={chartType}
          onChange={setChartType}
          className="w-fit"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {chartType !== 'distribution' && chartType !== 'scatter' && (
          <label className="field-label">
            Group by
            <Select
              className="mt-1 w-full"
              value={activeCategory || undefined}
              options={columns.map(value => ({ label: value, value }))}
              onChange={setCategory}
              showSearch
              placeholder="Choose category"
            />
          </label>
        )}

        <label className="field-label">
          {chartType === 'scatter' ? 'X Axis measure' : chartType === 'distribution' ? 'Numeric column to distribute' : 'Numeric field'}
          <Select
            className="mt-1 w-full"
            value={activeMetric || undefined}
            options={numericColumns.map(value => ({ label: value, value }))}
            onChange={setMetric}
            showSearch
            disabled={!numericColumns.length}
            placeholder="Choose field"
          />
        </label>

        {chartType === 'scatter' ? (
          <label className="field-label">
            Y Axis measure
            <Select
              className="mt-1 w-full"
              value={activeSecondary || undefined}
              options={numericColumns.map(value => ({ label: value, value }))}
              onChange={setSecondaryMetric}
              showSearch
              disabled={numericColumns.length < 2}
              placeholder="Choose Y axis"
            />
          </label>
        ) : chartType !== 'distribution' ? (
          <label className="field-label">
            Math operation
            <Select
              className="mt-1 w-full"
              value={operation}
              onChange={setOperation}
              options={operations}
            />
          </label>
        ) : null}

        {chartType !== 'distribution' && chartType !== 'scatter' && (
          <div className="flex items-end gap-2">
            <label className="field-label flex-1">
              Limit
              <Select
                className="mt-1 w-full"
                value={topLimit}
                onChange={setTopLimit}
                options={[
                  { label: 'All items', value: 'all' },
                  { label: 'Top 5', value: '5' },
                  { label: 'Top 10', value: '10' },
                  { label: 'Top 20', value: '20' }
                ]}
              />
            </label>
            <label className="field-label flex-1">
              Sort
              <Select
                className="mt-1 w-full"
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: 'High → Low', value: 'desc' },
                  { label: 'Low → High', value: 'asc' },
                  { label: 'Name (A-Z)', value: 'name' }
                ]}
              />
            </label>
          </div>
        )}
      </div>

      <div className="mt-5 h-[320px] w-full">{renderChart()}</div>
    </section>
  );
}
