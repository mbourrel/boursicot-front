import { useRetryFetch } from './useRetryFetch';
import { fetchMacroAll } from '../api/macro';

export function useMacro() {
  const { data, loading, error } = useRetryFetch(fetchMacroAll, {
    maxRetries: 4,
    retryDelay: 5000,
  });

  return {
    cycleData:     data?.cycle     ?? null,
    cycleHistory:  data?.history   ?? null,
    liquidityData: data?.liquidity ?? null,
    loading,
    error,
  };
}
