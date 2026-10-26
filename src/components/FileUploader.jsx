import { useState } from 'react';
import { Upload, Tabs, Input, Button, message } from 'antd';
import { sampleDatasets } from '../lib/sampleDatasets.js';
import { parseTextData } from '../lib/data.js';

const { Dragger } = Upload;
const { TextArea } = Input;

export default function FileUploader({ onFile, onDataLoaded, loading = false }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [pastedText, setPastedText] = useState('');
  const [pasting, setPasting] = useState(false);

  const handlePasteImport = () => {
    if (!pastedText.trim()) {
      message.warning('Please paste CSV or JSON data first.');
      return;
    }
    setPasting(true);
    try {
      const parsed = parseTextData(pastedText);
      onDataLoaded(parsed.rows, 'pasted-data.csv');
      message.success(`Imported ${parsed.rows.length.toLocaleString()} rows from text.`);
      setPastedText('');
    } catch (e) {
      message.error(e.message || 'Could not parse the pasted text.');
    } finally {
      setPasting(false);
    }
  };

  const loadSample = sample => {
    onDataLoaded(sample.rows, sample.fileName);
    message.success(`Loaded sample: ${sample.name}`);
  };

  const uploadTab = (
    <div>
      <Dragger
        accept=".csv,.tsv,.txt,.xlsx,.xls,.json,text/csv,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        multiple={false}
        showUploadList={false}
        customRequest={({ file, onSuccess }) => {
          onFile(file);
          setTimeout(() => onSuccess('ok'), 0);
        }}
        disabled={loading}
        className="upload-dragger"
      >
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
          <i className="ri-upload-cloud-2-line" />
        </div>
        <p className="font-semibold text-slate-800">
          Drop your data file here, or <span className="text-violet-600">browse</span>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Supports CSV, TSV, JSON, XLS, and XLSX · processed 100% locally in your browser
        </p>
      </Dragger>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">Or start with a pre-configured scenario:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sampleDatasets.map(sample => (
            <button
              key={sample.id}
              onClick={() => loadSample(sample)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              <i className="ri-sparkling-fill text-violet-500" />
              {sample.name} ({sample.rows.length} rows)
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const pasteTab = (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Paste CSV lines, tab-separated values, or a JSON array of objects below:
      </p>
      <TextArea
        rows={6}
        value={pastedText}
        onChange={e => setPastedText(e.target.value)}
        placeholder={`Product,Region,Sales,Quantity\nLaptop,North,52000,2\nPhone,West,31000,5`}
        className="font-mono text-xs"
      />
      <div className="flex justify-end">
        <Button
          type="primary"
          onClick={handlePasteImport}
          loading={pasting}
          icon={<i className="ri-file-text-line" />}
        >
          Parse & load data
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'upload', label: 'File Upload', children: uploadTab },
          { key: 'paste', label: 'Paste CSV / JSON', children: pasteTab }
        ]}
      />
    </div>
  );
}
