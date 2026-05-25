import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig.js';

export const useInventory = (storeId = null) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const url = storeId ? `/inventory/store/${storeId}` : '/inventory/items';
      const { data } = await api.get(url);
      setInventory(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { inventory, loading, error, refetch: fetch };
};

export const useRecommendations = (params = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/inventory/recommendations', { params });
      setRecommendations(data.data);
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { recommendations, loading, refetch: fetch };
};

export const useOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory/overview');
      setOverview(data.data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetch]);

  return { overview, loading, refetch: fetch };
};
