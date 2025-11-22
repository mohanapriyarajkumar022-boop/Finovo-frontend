//hook/useAssets.js
import { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';

export const useAssets = (filters = {}) => {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssets();
  }, [filters]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await assetService.getAssets(filters);
      setAssets(response.assets);
      setSummary(response.summary);
    } catch (err) {
      setError('Failed to load assets');
      console.error('Load assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadAssets();
  };

  return {
    assets,
    summary,
    loading,
    error,
    refresh
  };
};