# DataLens Analytics Studio

A fast, private, browser-based data analytics and visualization studio built with React 19, Tailwind CSS, Ant Design 5, and Recharts.

All data parsing, statistical computations, and machine learning models execute 100% locally in your browser. Zero telemetry, zero uploads to external servers.

---

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL in your browser (e.g. `http://localhost:5173`).

### Run Unit Tests & Build

```bash
# Run unit tests for data analysis, filtering, and regression
npm run test:logic

# Run production build with optimized vendor chunking
npm run build
```

---

## Core Features & Fixes

### 1. Instant Dataset Switching & Auto-Refresh
- **Zero Stale Fields**: Changing or uploading a dataset immediately refreshes all category selections, numeric measures, date columns, filters, and prediction studio models without retaining orphaned column names from previous datasets.
- **Intelligent Field Detection**: Automatically selects the most meaningful categorical column (avoiding IDs and dates), first valid numeric measure, and primary date column upon dataset load.

### 2. Multi-Format & Multi-Sheet Import
- **Supported Formats**: CSV, TSV, JSON (array of objects or nested `{ data: [...] }`), XLS, XLSX.
- **Multi-Sheet Excel Support**: Excel files with multiple sheets now display an interactive sheet switcher directly in the workspace banner.
- **BOM & Header Sanitization**: Strips UTF-8 BOM (`\uFEFF`), trims extraneous header whitespace, and detects custom delimiters (comma, semicolon, tab, pipe).
- **Direct Paste Tab**: Paste raw CSV or JSON data directly into the browser without saving a file to disk.

### 3. Real-World Datasets & Offline Library
- **Pre-Configured Scenarios**: 1-click switcher between curated datasets:
  - *Sales & Revenue Performance*
  - *Employee & HR Analytics*
  - *SaaS Subscription Metrics*
  - *E-Commerce Store Orders*
- **"My Saved Datasets"**: Save cleaned or custom datasets directly to your browser's `localStorage` for offline access across sessions.

### 4. Interactive Visualizations & Distribution
- **Chart Types**: Bar, Line, Area, Donut/Pie, **Distribution (Histogram)**, and **Scatter Plot**.
- **Histogram Binning**: Automatic frequency distribution of any numeric measure into adaptive bins.
- **Scatter & Correlation**: Dynamic scatter plotting between any two numeric columns with Pearson correlation ($r$) calculation.
- **Controls**: Limit to Top 5, Top 10, Top 20, or All items; Sort by Value (High to Low, Low to High) or Category Name.

### 5. Automated Data Cleaning & Profiling
- **Column Profiling**: Detected column types (*Numeric*, *Identifier*, *Date*, *Text/Category*), missing cell counts, and min/max ranges.
- **One-Click Cleaning**:
  - *Remove Duplicates*: Detects and eliminates identical rows.
  - *Drop Incomplete Rows*: Removes rows with missing or blank values.

### 6. Prediction Studio (Linear Regression)
- Fits simple linear regression ($y = mx + b$) on any two numeric measures.
- Held-out test evaluation (80/20 train/test split) with $R^2$, MAE, and RMSE metrics.
- Interactive value forecasting input with immediate predicted output.
- Auto-resets and reconfigures when switching datasets.

### 7. Export Options
- Export currently filtered datasets as **CSV**, **Excel (.xlsx)**, **JSON (.json)**, or formatted **PDF Reports**.
