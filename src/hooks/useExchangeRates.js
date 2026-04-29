import { useState, useEffect } from 'react';
import { fetchExchangeRates } from '../api/exchange_rates';

export function useExchangeRates() {
  const [rates, setRates]         = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchExchangeRates(controller.signal)
      .then(data => {
        setRates(data.rates || {});
        setUpdatedAt(data.updated_at || null);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('Exchange rates unavailable — affichage en devise locale', err);
        }
      });
    return () => controller.abort();
  }, []);

  return { rates, updatedAt };
}
