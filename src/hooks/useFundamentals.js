import { useState, useEffect } from 'react';
import { fetchFundamentals } from '../api/fundamentals';

export function useFundamentals(symbols) {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const key = symbols.join(',');

  useEffect(() => {
    if (symbols.length === 0) return;
    const controller = new AbortController();
    setLoading(true);
    setErrors({});

    Promise.all(
      symbols.map(sym =>
        fetchFundamentals(sym, controller.signal)
          .then(data => ({ sym, data }))
          .catch(() => ({ sym, data: null }))
      )
    ).then(results => {
      const newMap = {}, newErrors = {};
      results.forEach(({ sym, data }) => {
        if (data) newMap[sym] = data;
        else newErrors[sym] = true;
      });
      setDataMap(newMap);
      setErrors(newErrors);
      setLoading(false);
    });

    return () => controller.abort();
  }, [key]);

  return { dataMap, loading, errors };
}
