import { useState, useEffect } from 'react';
import { fetchSectorAverages } from '../api/fundamentals';

export function useSectorAverages(sector) {
  const [averages, setAverages] = useState(null);

  useEffect(() => {
    if (!sector) { setAverages(null); return; }
    const controller = new AbortController();
    fetchSectorAverages(sector, controller.signal)
      .then(data => setAverages(data))
      .catch(() => setAverages(null));
    return () => controller.abort();
  }, [sector]);

  return averages;
}
