import { useState, useEffect } from 'react';
import { fetchPrices } from '../api/prices';

export function usePrices(ticker, interval) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!ticker) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchPrices(ticker, interval, controller.signal)
      .then(setData)
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [ticker, interval]);

  return { data, loading, error };
}
