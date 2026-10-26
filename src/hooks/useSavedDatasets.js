import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'datalens_saved_datasets_v1';

export default function useSavedDatasets() {
  const [savedDatasets, setSavedDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedDatasets(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to read saved datasets from localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = useCallback(datasets => {
    setSavedDatasets(datasets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, []);

  const saveCurrentDataset = useCallback((name, rows, fileName) => {
    if (!name || !rows || !rows.length) return false;
    const newEntry = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      fileName: fileName || `${name.trim()}.csv`,
      rows,
      rowCount: rows.length,
      savedAt: new Date().toISOString()
    };
    persist([newEntry, ...savedDatasets]);
    return newEntry;
  }, [savedDatasets, persist]);

  const deleteDataset = useCallback(id => {
    persist(savedDatasets.filter(d => d.id !== id));
  }, [savedDatasets, persist]);

  return {
    savedDatasets,
    isLoading,
    saveCurrentDataset,
    deleteDataset
  };
}
