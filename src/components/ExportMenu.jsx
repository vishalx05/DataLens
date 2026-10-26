import { Button, Dropdown, message } from 'antd';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportMenu({ rows, columns, fileName = 'datalens-report' }) {
  const exportCsv = () => {
    if (!rows.length) {
      message.warning('No records to export.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
    message.success('CSV report downloaded');
  };

  const exportExcel = () => {
    if (!rows.length) {
      message.warning('No records to export.');
      return;
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Filtered Data');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    message.success('Excel workbook downloaded');
  };

  const exportJson = () => {
    if (!rows.length) {
      message.warning('No records to export.');
      return;
    }
    const jsonStr = JSON.stringify(rows, null, 2);
    saveAs(new Blob([jsonStr], { type: 'application/json;charset=utf-8;' }), `${fileName}.json`);
    message.success('JSON file downloaded');
  };

  const exportPdf = () => {
    if (!rows.length) {
      message.warning('No records to export.');
      return;
    }
    const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
    doc.setFontSize(18);
    doc.text('DataLens Analytics Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Rows included: ${rows.length} | Generated: ${new Date().toLocaleDateString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [columns],
      body: rows.slice(0, 500).map(row => columns.map(column => String(row[column] ?? ''))),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [98, 91, 246] }
    });
    doc.save(`${fileName}.pdf`);
    if (rows.length > 500) {
      message.info('PDF contains the first 500 filtered rows. Export CSV or Excel for larger datasets.');
    }
  };

  const items = [
    { key: 'csv', label: 'Download CSV', icon: <i className="ri-file-text-line text-emerald-600" />, onClick: exportCsv },
    { key: 'excel', label: 'Download Excel (.xlsx)', icon: <i className="ri-file-excel-2-line text-green-600" />, onClick: exportExcel },
    { key: 'json', label: 'Download JSON (.json)', icon: <i className="ri-code-s-slash-line text-amber-600" />, onClick: exportJson },
    { key: 'pdf', label: 'Download PDF Report', icon: <i className="ri-file-pdf-2-line text-rose-600" />, onClick: exportPdf }
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button type="primary" icon={<i className="ri-download-2-line" />}>
        Export report
      </Button>
    </Dropdown>
  );
}
