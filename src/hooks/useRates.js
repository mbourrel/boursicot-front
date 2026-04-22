import { useRetryFetch } from './useRetryFetch';
import { fetchMacroRates } from '../api/macro';

export function useRates() {
  const { data, loading, error } = useRetryFetch(fetchMacroRates, {
    maxRetries: 4,
    retryDelay: 5000,
  });
  return { data, loading, error };
}
