import { useState, useEffect } from 'react';
import { fetchScreener } from '../api/screener';

export function useScreener() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchScreener(controller.signal)
      .then(d  => { setData(d);    setLoading(false); })
      .catch(e => {
        if (e.name !== 'AbortError') { setError(e); setLoading(false); }
      });

    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
