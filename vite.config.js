
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Required for GitHub Pages repository deployment
  base: '/DataLens/',

  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 1200,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-excel';
          }

          if (
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/jspdf-autotable') ||
            id.includes('node_modules/html2canvas')
          ) {
            return 'vendor-pdf';
          }

          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }

          if (
            id.includes('node_modules/antd') ||
            id.includes('node_modules/@rc-component')
          ) {
            return 'vendor-antd';
          }
        }
      }
    }
  }
});
