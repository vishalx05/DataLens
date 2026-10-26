import { useMemo, useState, useEffect, useCallback } from 'react';
import { Alert, Button, message, Modal, Input, Select, Spin, Tooltip, Dropdown, Tag } from 'antd';
import FileUploader from './components/FileUploader.jsx';
import MetricCard from './components/MetricCard.jsx';
import ChartPanel from './components/ChartPanel.jsx';
import DataTable from './components/DataTable.jsx';
import FilterBar from './components/FilterBar.jsx';
import ExportMenu from './components/ExportMenu.jsx';
import DataProfile from './components/DataProfile.jsx';
import PredictionStudio from './components/PredictionStudio.jsx';
import {
  calculate,
  filterRows,
  getColumns,
  getSummary,
  isNumericColumn,
  parseFile,
  parseWorkbookSheet,
  detectBestCategoryColumn,
  detectBestMetricColumn,
  detectBestDateColumn,
  cleanDuplicates,
  cleanDropMissing,
  sampleDatasets,
  demoRows
} from './lib/data.js';
import useSavedDatasets from './hooks/useSavedDatasets.js';

const currency = value =>
  value == null || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);

export default function App() {
  const [rows, setRows] = useState(demoRows);
  const [fileName, setFileName] = useState('sample-sales-data.csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Product');
  const [categoryValue, setCategoryValue] = useState('All');
  const [dateColumn, setDateColumn] = useState('Date');
  const [dateRange, setDateRange] = useState(['', '']);
  const [chartType, setChartType] = useState('bar');
  const [metric, setMetric] = useState('Sales');
  const [operation, setOperation] = useState('sum');
  const [showUpload, setShowUpload] = useState(false);

  // Excel multi-sheet support
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [workbook, setWorkbook] = useState(null);

  // Saved datasets library
  const { savedDatasets, saveCurrentDataset, deleteDataset } = useSavedDatasets();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [datasetSaveName, setDatasetSaveName] = useState('');

  // Column calculations
  const columns = useMemo(() => getColumns(rows), [rows]);
  const numericColumns = useMemo(
    () => columns.filter(column => isNumericColumn(rows, column)),
    [rows, columns]
  );
  const filteredRows = useMemo(
    () =>
      filterRows(rows, {
        search,
        category,
        categoryValue,
        dateColumn,
        minDate: dateRange[0],
        maxDate: dateRange[1]
      }),
    [rows, search, category, categoryValue, dateColumn, dateRange]
  );
  const summary = useMemo(() => getSummary(filteredRows), [filteredRows]);

  /**
   * Central dataset application helper.
   * Auto-refreshes all category, metric, and date fields immediately
   * so no stale columns from the previous dataset remain.
   */
  const applyDataset = useCallback((newRows, newFileName, meta = {}) => {
    if (!newRows || !newRows.length) return;
    const newCols = getColumns(newRows);
    const bestCategory = detectBestCategoryColumn(newRows, newCols);
    const bestMetric = detectBestMetricColumn(newRows, newCols);
    const bestDate = detectBestDateColumn(newRows, newCols);

    setRows(newRows);
    setFileName(newFileName || 'dataset.csv');
    setCategory(bestCategory);
    setCategoryValue('All');
    setMetric(bestMetric);
    setDateColumn(bestDate);
    setDateRange(['', '']);
    setSearch('');
    setSheets(meta.sheets || []);
    setActiveSheet(meta.activeSheet || '');
    setWorkbook(meta.workbook || null);
    setShowUpload(false);
    setError('');
  }, []);

  /**
   * Safety effect: Whenever columns or numericColumns change, ensure
   * current category and metric point to valid fields in the active dataset.
   */
  useEffect(() => {
    if (!columns.length) return;

    if (!columns.includes(category)) {
      const bestCat = detectBestCategoryColumn(rows, columns);
      setCategory(bestCat);
      setCategoryValue('All');
    }

    if (numericColumns.length && !numericColumns.includes(metric)) {
      const bestMet = detectBestMetricColumn(rows, columns);
      setMetric(bestMet);
    } else if (!numericColumns.length) {
      setMetric('');
    }

    if (dateColumn && !summary.dateColumns.includes(dateColumn)) {
      setDateColumn(summary.dateColumns[0] || '');
      setDateRange(['', '']);
    }
  }, [columns, numericColumns, category, metric, dateColumn, summary.dateColumns, rows]);

  // Handle uploaded file
  const handleFile = async file => {
    setLoading(true);
    setError('');
    try {
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File exceeds 50 MB. Please upload a smaller file for browser-based analysis.');
      }
      const parsed = await parseFile(file);
      applyDataset(parsed.rows, file.name, {
        sheets: parsed.sheets,
        activeSheet: parsed.sheetName,
        workbook: parsed.workbook
      });
      message.success(`Loaded ${parsed.rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (err) {
      setError(err.message || 'Unable to read this file.');
    } finally {
      setLoading(false);
    }
  };

  // Switch Excel worksheet
  const handleSheetChange = sheetName => {
    if (!workbook || !sheetName) return;
    try {
      const { rows: sheetRows, sheetName: active } = parseWorkbookSheet(workbook, sheetName);
      applyDataset(sheetRows, `${fileName.replace(/\[.*?\]/, '')} [${active}]`, {
        sheets,
        activeSheet: active,
        workbook
      });
      message.success(`Switched to worksheet: ${active}`);
    } catch (err) {
      message.error(err.message || 'Could not load worksheet.');
    }
  };

  // Switch to a preset sample dataset
  const handleSelectSample = sampleId => {
    const found = sampleDatasets.find(s => s.id === sampleId);
    if (!found) return;
    applyDataset(found.rows, found.fileName);
    message.success(`Loaded sample: ${found.name}`);
  };

  // Load saved dataset
  const handleLoadSaved = saved => {
    applyDataset(saved.rows, saved.fileName);
    message.success(`Loaded saved dataset: ${saved.name}`);
  };

  // Clean duplicates action
  const handleCleanDuplicates = () => {
    const cleaned = cleanDuplicates(rows);
    const removedCount = rows.length - cleaned.length;
    if (removedCount > 0) {
      applyDataset(cleaned, fileName, { sheets, activeSheet, workbook });
      message.success(`Removed ${removedCount} duplicate row${removedCount > 1 ? 's' : ''}`);
    } else {
      message.info('No duplicate rows detected in this dataset.');
    }
  };

  // Drop missing rows action
  const handleDropMissing = () => {
    const cleaned = cleanDropMissing(rows);
    const removedCount = rows.length - cleaned.length;
    if (removedCount > 0) {
      applyDataset(cleaned, fileName, { sheets, activeSheet, workbook });
      message.success(`Removed ${removedCount} incomplete row${removedCount > 1 ? 's' : ''}`);
    } else {
      message.info('All rows are already complete (zero missing cells).');
    }
  };

  // Save current dataset to local library
  const handleSaveCurrent = () => {
    if (!datasetSaveName.trim()) {
      message.warning('Please enter a name for the dataset.');
      return;
    }
    saveCurrentDataset(datasetSaveName.trim(), rows, fileName);
    message.success(`Saved "${datasetSaveName.trim()}" to My Datasets.`);
    setSaveModalOpen(false);
    setDatasetSaveName('');
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryValue('All');
    setDateRange(['', '']);
  };

  const selectedMetric = numericColumns.includes(metric) ? metric : '';
  const total = selectedMetric ? calculate(filteredRows, selectedMetric, operation) : null;
  const average = selectedMetric ? calculate(filteredRows, selectedMetric, 'average') : null;
  const operationLabel =
    ({
      sum: 'Sum',
      average: 'Average',
      count: 'Count',
      min: 'Minimum',
      max: 'Maximum',
      median: 'Median',
      stddev: 'Std. deviation'
    })[operation] || 'Calculation';

  // Dataset switcher dropdown menu
  const datasetMenuItems = [
    {
      key: 'samples-header',
      type: 'group',
      label: 'Sample Datasets',
      children: sampleDatasets.map(s => ({
        key: s.id,
        label: (
          <div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-[11px] text-slate-400">{s.rows.length} rows · {s.description.substring(0, 45)}…</p>
          </div>
        ),
        onClick: () => handleSelectSample(s.id)
      }))
    },
    ...(savedDatasets.length
      ? [
          {
            key: 'saved-header',
            type: 'group',
            label: `My Saved Datasets (${savedDatasets.length})`,
            children: savedDatasets.map(s => ({
              key: s.id,
              label: (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-[11px] text-slate-400">{s.rowCount} rows</p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteDataset(s.id);
                      message.info('Deleted dataset');
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              ),
              onClick: () => handleLoadSaved(s)
            }))
          }
        ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-xl text-white shadow-lg shadow-violet-200">
            <i className="ri-bar-chart-grouped-line" />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-900">DataLens</p>
            <p className="text-[11px] font-medium text-slate-400">DATA STUDIO</p>
          </div>
        </div>

        <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
          Workspace
        </p>
        <a className="sidebar-link sidebar-link-active" href="#overview">
          <i className="ri-dashboard-3-line text-lg" /> Overview
        </a>
        <button
          className="sidebar-link"
          onClick={() => {
            setShowUpload(true);
            setTimeout(
              () => document.getElementById('import-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              0
            );
          }}
        >
          <i className="ri-upload-cloud-2-line text-lg" /> Import data
        </button>
        <a className="sidebar-link" href="#profile">
          <i className="ri-scan-line text-lg" /> Data profile
        </a>
        <a className="sidebar-link" href="#visuals">
          <i className="ri-pie-chart-2-line text-lg" /> Visualizations
        </a>
        <a className="sidebar-link" href="#prediction">
          <i className="ri-line-chart-line text-lg" /> Prediction Studio
        </a>
        <a className="sidebar-link" href="#data-explorer">
          <i className="ri-table-line text-lg" /> Data explorer
        </a>

        <div className="mt-auto rounded-2xl bg-violet-50 p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600">
            <i className="ri-shield-check-line text-lg" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Private by design</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Files are parsed 100% locally in your browser. No data ever leaves your device.
          </p>
        </div>
      </aside>

      <main className="min-w-0 lg:ml-[248px]">
        <header className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-xl text-violet-700 lg:hidden">
              <i className="ri-bar-chart-grouped-line" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">Workspace / Analytics</p>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Overview dashboard</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dropdown menu={{ items: datasetMenuItems }} trigger={['click']}>
              <Button icon={<i className="ri-database-2-line" />}>
                Switch dataset <i className="ri-arrow-down-s-line ml-1" />
              </Button>
            </Dropdown>

            <Button
              onClick={() => {
                setDatasetSaveName(fileName.replace(/\.[^.]+$/, ''));
                setSaveModalOpen(true);
              }}
              icon={<i className="ri-bookmark-line" />}
            >
              Save dataset
            </Button>

            <Button
              onClick={() => setShowUpload(val => !val)}
              type={showUpload ? 'default' : 'primary'}
              icon={<i className="ri-upload-2-line" />}
            >
              {showUpload ? 'Close uploader' : 'Import data'}
            </Button>

            <ExportMenu
              rows={filteredRows}
              columns={columns}
              fileName={`${fileName.replace(/\.[^.]+$/, '')}-report`}
            />
          </div>
        </header>

        <nav
          className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
          aria-label="Dashboard sections"
        >
          {[
            ['overview', 'Overview'],
            ['profile', 'Profile'],
            ['visuals', 'Charts'],
            ['prediction', 'Prediction'],
            ['data-explorer', 'Data']
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700"
            >
              {label}
            </a>
          ))}
          <button
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
            onClick={() => {
              setShowUpload(true);
              setTimeout(
                () => document.getElementById('import-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                0
              );
            }}
          >
            Import
          </button>
        </nav>

        <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8" id="overview">
          {showUpload && (
            <section id="import-data" className="panel-card scroll-mt-28">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="section-title">Import a dataset</h2>
                  <p className="section-subtitle">
                    Upload CSV, TSV, JSON, or Excel files, or paste raw data directly.
                  </p>
                </div>
                <Button type="text" onClick={() => setShowUpload(false)} icon={<i className="ri-close-line" />} />
              </div>
              <FileUploader
                onFile={handleFile}
                onDataLoaded={(pRows, pName) => applyDataset(pRows, pName)}
                loading={loading}
              />
              {loading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Spin size="small" /> Reading and analyzing your file…
                </div>
              )}
              {error && <Alert className="mt-3" type="error" showIcon message="Import failed" description={error} />}
            </section>
          )}

          {!showUpload && error && (
            <Alert
              type="error"
              showIcon
              message="Import notice"
              description={error}
              closable
              onClose={() => setError('')}
            />
          )}

          {/* Active Dataset Banner & Sheet Switcher */}
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Dataset active
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-600">
                  <i className="ri-file-line mr-1 text-slate-400" />
                  {fileName}
                </span>
                {sheets.length > 1 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">Sheet:</span>
                    <Select
                      size="small"
                      value={activeSheet}
                      onChange={handleSheetChange}
                      options={sheets.map(s => ({ label: s, value: s }))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Your data, made clear.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Explore patterns, compare categories, and compute instant predictions from your dataset.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm border border-slate-100">
                <i className="ri-database-2-line mr-1 text-violet-500" />
                {rows.length.toLocaleString()} total rows
              </span>
              <span className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm border border-slate-100">
                <i className="ri-layout-column-line mr-1 text-emerald-500" />
                {columns.length} columns ({numericColumns.length} numeric)
              </span>
            </div>
          </section>

          {/* Filter Bar */}
          <FilterBar
            rows={rows}
            columns={columns}
            category={category}
            setCategory={setCategory}
            categoryValue={categoryValue}
            setCategoryValue={setCategoryValue}
            search={search}
            setSearch={setSearch}
            dateColumn={dateColumn}
            setDateColumn={setDateColumn}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onReset={resetFilters}
          />

          {/* KPIs */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="section-title">Key performance indicators</h2>
                <p className="section-subtitle">Calculated dynamically from current filtered results.</p>
              </div>
              <span className="text-xs text-slate-400">
                {filteredRows.length.toLocaleString()} matching rows
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Records analyzed"
                value={filteredRows.length.toLocaleString()}
                hint={`${summary.columnCount} columns · ${summary.numericCount} numeric measures`}
                icon="ri-database-2-line"
                tone="violet"
              />
              <MetricCard
                label={selectedMetric ? `${operationLabel}: ${selectedMetric}` : 'Select a numeric field'}
                value={currency(total)}
                hint={selectedMetric ? `${operationLabel} calculated from ${selectedMetric}` : 'Pick a field in the chart panel'}
                icon="ri-calculator-line"
                tone="blue"
              />
              <MetricCard
                label="Average of selected field"
                value={currency(average)}
                hint={selectedMetric ? `Average ${selectedMetric} per valid record` : 'No numeric measure selected'}
                icon="ri-line-chart-line"
                tone="green"
              />
              <MetricCard
                label="Data completeness"
                value={`${(100 - summary.missingPercent).toFixed(1)}%`}
                hint={`${summary.missingCount} missing cells · ${summary.duplicateCount} duplicates`}
                icon="ri-shield-check-line"
                tone="amber"
              />
            </div>
          </section>

          {/* Data Profile & Cleaning */}
          <DataProfile
            rows={filteredRows}
            onCleanDuplicates={summary.duplicateCount > 0 ? handleCleanDuplicates : null}
            onDropMissing={summary.missingCount > 0 ? handleDropMissing : null}
            duplicateCount={summary.duplicateCount}
          />

          {/* Visualizations & Health */}
          <div
            id="visuals"
            className="scroll-mt-28 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]"
          >
            <ChartPanel
              rows={filteredRows}
              columns={columns}
              numericColumns={numericColumns}
              category={category}
              setCategory={setCategory}
              metric={metric}
              setMetric={setMetric}
              operation={operation}
              setOperation={setOperation}
              chartType={chartType}
              setChartType={setChartType}
            />

            <section className="panel-card">
              <div>
                <h2 className="section-title">Dataset health & quick actions</h2>
                <p className="section-subtitle">Real-time data quality checks on active records.</p>
              </div>
              <div className="mt-5 space-y-4">
                <HealthRow
                  label="Data completeness"
                  value={100 - summary.missingPercent}
                  color="bg-emerald-500"
                />
                <HealthRow
                  label="Missing cells"
                  value={summary.missingPercent}
                  color="bg-amber-400"
                />

                <div className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Exact duplicate rows</span>
                    <span className="font-bold text-slate-800">{summary.duplicateCount}</span>
                  </div>
                  {summary.duplicateCount > 0 && (
                    <Button
                      size="small"
                      type="link"
                      onClick={handleCleanDuplicates}
                      className="p-0 mt-1 text-xs text-violet-600 hover:text-violet-700"
                    >
                      <i className="ri-delete-bin-line mr-1" /> Remove duplicates now
                    </Button>
                  )}
                </div>

                <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                  <div className="flex items-center gap-2 text-violet-700">
                    <i className="ri-lightbulb-flash-line text-lg" />
                    <p className="text-sm font-semibold">Real-world analysis tip</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Switch chart view to <strong>Distribution</strong> to spot outliers, or <strong>Scatter</strong> to see correlation between numeric columns.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Prediction Studio */}
          <PredictionStudio rows={filteredRows} numericColumns={numericColumns} />

          {/* Data Explorer Table */}
          <div id="data-explorer" className="scroll-mt-28">
            <DataTable rows={filteredRows} columns={columns} />
          </div>

          {/* Footer */}
          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-4 text-xs text-slate-400 sm:flex-row">
            <span>© 2026 DataLens Analytics · Private in-browser data intelligence</span>
            <span>
              <i className="ri-lock-2-line mr-1" />
              100% Client-side · Zero telemetry · LocalStorage dataset library
            </span>
          </footer>
        </div>
      </main>

      {/* Save Dataset Modal */}
      <Modal
        title="Save dataset to local library"
        open={saveModalOpen}
        onOk={handleSaveCurrent}
        onCancel={() => setSaveModalOpen(false)}
        okText="Save dataset"
      >
        <p className="mb-3 text-xs text-slate-500">
          Save your current data and any applied cleaning to your browser's private storage for quick access anytime.
        </p>
        <Input
          placeholder="Dataset name (e.g. Cleaned Q1 Sales)"
          value={datasetSaveName}
          onChange={e => setDatasetSaveName(e.target.value)}
          onPressEnter={handleSaveCurrent}
        />
      </Modal>
    </div>
  );
}

function HealthRow({ label, value, color }) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-800">{safeValue.toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
