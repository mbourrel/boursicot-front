import { useState, useEffect } from 'react';
import { fetchAssets } from '../api/assets';

export function useAssets() {
  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets()
      .then(data => setAssets(data))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  return { assets, loading };
}
