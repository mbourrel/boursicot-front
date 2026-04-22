import { useState, useEffect } from 'react';
import { fetchSectorHistory } from '../api/fundamentals';

export function useSectorHistory(sector) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!sector) { setHistory(null); return; }
    const controller = new AbortController();
    fetchSectorHistory(sector, controller.signal)
      .then(data => setHistory(data))
      .catch(() => setHistory(null));
    return () => controller.abort();
  }, [sector]);

  return history;
}
