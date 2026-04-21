import { useState, useEffect } from 'react';
import { fetchMacroAll } from '../api/macro';

export function useMacro() {
  const [cycleData,     setCycleData]     = useState(null);
  const [cycleHistory,  setCycleHistory]  = useState(null);
  const [liquidityData, setLiquidityData] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchMacroAll(controller.signal)
      .then(({ cycle, history, liquidity }) => {
        setCycleData(cycle);
        setCycleHistory(history);
        setLiquidityData(liquidity);
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { cycleData, cycleHistory, liquidityData, loading, error };
}
