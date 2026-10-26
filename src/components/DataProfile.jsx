import { useMemo } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { getColumns, isNumericColumn, isDateLike, isIdentifierColumn, toNumber } from '../lib/analytics.js';

export default function DataProfile({ rows, onCleanDuplicates, onDropMissing, duplicateCount = 0 }) {
  const profile = useMemo(() => {
    const columns = getColumns(rows);
    return columns.map(name => {
      const values = rows.map(row => row[name]);
      const present = values.filter(value => value !== null && value !== undefined && String(value).trim() !== '');
      const numeric = isNumericColumn(rows, name);
      const unique = new Set(present.map(value => String(value))).size;
      const missing = rows.length - present.length;
      const missingPct = rows.length ? ((missing / rows.length) * 100).toFixed(1) : '0';
      const numbers = numeric ? present.map(toNumber).sort((a, b) => a - b) : [];
      const type = isIdentifierColumn(name)
        ? 'Identifier'
        : numeric
        ? 'Numeric'
        : present.filter(isDateLike).length >= Math.max(2, Math.ceil(present.length * 0.7))
        ? 'Date'
        : 'Text / Category';

      return {
        name,
        type,
        missing,
        missingPct,
        unique,
        min: numbers.length ? numbers[0] : null,
        max: numbers.length ? numbers[numbers.length - 1] : null
      };
    });
  }, [rows]);

  const typeColor = type => {
    switch (type) {
      case 'Numeric':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'Identifier':
        return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'Date':
        return 'text-blue-700 bg-blue-50 border-blue-100';
      default:
        return 'text-violet-700 bg-violet-50 border-violet-100';
    }
  };

  return (
    <section id="profile" className="panel-card scroll-mt-28">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="section-title">Automatic data profile</h2>
          <p className="section-subtitle">
            Column types, completeness, distinct counts, and numeric ranges detected automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {duplicateCount > 0 && onCleanDuplicates && (
            <Tooltip title="Remove identical duplicate rows from the dataset">
              <Button
                size="small"
                onClick={onCleanDuplicates}
                icon={<i className="ri-delete-bin-5-line" />}
              >
                Remove {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}
              </Button>
            </Tooltip>
          )}

          {onDropMissing && (
            <Tooltip title="Remove rows containing null or empty cells">
              <Button
                size="small"
                onClick={onDropMissing}
                icon={<i className="ri-filter-line" />}
              >
                Drop incomplete rows
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-3 py-3">Column name</th>
              <th className="px-3 py-3">Detected type</th>
              <th className="px-3 py-3">Missing</th>
              <th className="px-3 py-3">Distinct values</th>
              <th className="px-3 py-3">Minimum</th>
              <th className="px-3 py-3">Maximum</th>
            </tr>
          </thead>
          <tbody>
            {profile.map(item => (
              <tr key={item.name} className="border-b border-slate-50 transition hover:bg-slate-50/50 last:border-0">
                <td className="px-3 py-3 font-semibold text-slate-700">{item.name}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeColor(item.type)}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {item.missing > 0 ? (
                    <span className="font-medium text-amber-600">
                      {item.missing} ({item.missingPct}%)
                    </span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-slate-600">{item.unique}</td>
                <td className="px-3 py-3 font-mono text-slate-600">
                  {item.min == null ? '—' : item.min.toLocaleString()}
                </td>
                <td className="px-3 py-3 font-mono text-slate-600">
                  {item.max == null ? '—' : item.max.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
