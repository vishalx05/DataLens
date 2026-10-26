import { useMemo } from 'react';
import { DatePicker, Input, Select, Button, Badge } from 'antd';
import dayjs from 'dayjs';
import { isDateLike } from '../lib/analytics.js';

const { RangePicker } = DatePicker;

export default function FilterBar({
  rows,
  columns,
  category,
  setCategory,
  categoryValue,
  setCategoryValue,
  search,
  setSearch,
  dateColumn,
  setDateColumn,
  dateRange,
  setDateRange,
  onReset
}) {
  const activeCategory = columns.includes(category) ? category : '';

  const categoryOptions = useMemo(() => {
    if (!activeCategory || !rows.length) return [];
    return [...new Set(rows.map(row => String(row[activeCategory] ?? '(blank)')))]
      .sort()
      .map(value => ({ label: value, value }));
  }, [rows, activeCategory]);

  const dateColumns = useMemo(() => {
    return columns.filter(
      column =>
        /date|time|created|updated|timestamp/i.test(column) ||
        rows.filter(row => isDateLike(row[column])).length >= Math.max(2, Math.ceil(rows.length * 0.7))
    );
  }, [rows, columns]);

  const activeDateCol = dateColumns.includes(dateColumn) ? dateColumn : '';

  const validRange =
    dateRange?.[0] &&
    dateRange?.[1] &&
    dayjs(dateRange[0]).isValid() &&
    dayjs(dateRange[1]).isValid();

  const activeFiltersCount =
    (search ? 1 : 0) +
    (categoryValue !== 'All' ? 1 : 0) +
    (validRange ? 1 : 0);

  return (
    <div className="panel-card grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="xl:col-span-2">
        <label className="field-label">Search dataset</label>
        <Input
          className="mt-1"
          allowClear
          value={search}
          onChange={event => setSearch(event.target.value)}
          prefix={<i className="ri-search-line text-slate-400" />}
          placeholder="Search any text, number, date…"
        />
      </div>

      <div>
        <label className="field-label">Category column</label>
        <Select
          className="mt-1 w-full"
          value={activeCategory || undefined}
          options={columns.map(value => ({ label: value, value }))}
          onChange={value => {
            setCategory(value);
            setCategoryValue('All');
          }}
          showSearch
          placeholder="Filter by column"
        />
      </div>

      <div>
        <label className="field-label">Category value</label>
        <Select
          className="mt-1 w-full"
          value={categoryValue}
          options={[{ label: 'All values', value: 'All' }, ...categoryOptions]}
          onChange={setCategoryValue}
          showSearch
          disabled={!activeCategory}
        />
      </div>

      <div>
        <label className="field-label">Date range filter</label>
        <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row">
          <Select
            className="min-w-0 flex-1"
            placeholder="Date column"
            value={activeDateCol || undefined}
            options={dateColumns.map(value => ({ label: value, value }))}
            onChange={value => {
              setDateColumn(value || '');
              if (!value) setDateRange(['', '']);
            }}
            allowClear
            showSearch
          />
          <RangePicker
            className="w-full sm:min-w-[210px]"
            value={validRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={values =>
              setDateRange(
                values && values[0] && values[1]
                  ? [values[0].format('YYYY-MM-DD'), values[1].format('YYYY-MM-DD')]
                  : ['', '']
              )
            }
            disabled={!activeDateCol}
            allowClear
          />
        </div>
      </div>

      <div className="md:col-span-2 xl:col-span-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          {activeFiltersCount > 0 ? (
            <span className="font-medium text-violet-600">
              <i className="ri-filter-3-line mr-1" />
              {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''} applied
            </span>
          ) : (
            'Showing unfiltered records'
          )}
        </span>
        <Button onClick={onReset} icon={<i className="ri-refresh-line" />}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
