import { useEffect, useMemo, useState } from 'react';
import { Input, Select, Table, Tag } from 'antd';

export default function DataTable({ rows, columns }) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 whenever rows change
  useEffect(() => {
    setCurrentPage(1);
    setSearch('');
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row =>
      Object.values(row).some(value => String(value ?? '').toLowerCase().includes(query))
    );
  }, [rows, search]);

  const tableColumns = useMemo(() => {
    return columns.map(key => ({
      title: (
        <span className="font-semibold text-slate-700">
          {key}
        </span>
      ),
      dataIndex: key,
      key,
      sorter: (a, b) => {
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        return typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      },
      render: value => (
        <span className="whitespace-nowrap">
          {value === null || value === undefined || value === '' ? (
            <span className="text-slate-300">—</span>
          ) : typeof value === 'number' ? (
            <span className="font-mono text-slate-700">{value.toLocaleString()}</span>
          ) : (
            String(value)
          )}
        </span>
      )
    }));
  }, [columns]);

  return (
    <section className="panel-card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title">Data explorer</h2>
            <Tag className="rounded-full border-none bg-slate-100 text-xs text-slate-600">
              {filtered.length.toLocaleString()} row{filtered.length === 1 ? '' : 's'}
            </Tag>
          </div>
          <p className="section-subtitle">Search, sort, and inspect individual records in the active dataset.</p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            allowClear
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            prefix={<i className="ri-search-line text-slate-400" />}
            placeholder="Search rows…"
            className="sm:w-56"
          />
          <Select
            value={pageSize}
            onChange={value => {
              setPageSize(value);
              setCurrentPage(1);
            }}
            options={[
              { label: '8 rows', value: 8 },
              { label: '15 rows', value: 15 },
              { label: '30 rows', value: 30 },
              { label: '50 rows', value: 50 }
            ]}
            className="w-28"
          />
        </div>
      </div>

      <Table
        className="mt-4"
        columns={tableColumns}
        dataSource={filtered.map((row, index) => ({ ...row, key: index }))}
        pagination={{
          current: currentPage,
          pageSize,
          onChange: page => setCurrentPage(page),
          showSizeChanger: false,
          showTotal: total => `Total ${total} records`
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
        locale={{ emptyText: 'No data matches your search query' }}
      />
    </section>
  );
}
