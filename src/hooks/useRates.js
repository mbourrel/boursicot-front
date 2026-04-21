import { useState, useEffect } from 'react';
import { fetchMacroRates } from '../api/macro';

export function useRates() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMacroRates(controller.signal)
      .then(setData)
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
