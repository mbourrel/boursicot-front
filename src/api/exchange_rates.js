import { API_URL, authFetch } from './config';

export async function fetchExchangeRates(signal) {
  const res = await authFetch(`${API_URL}/api/exchange-rates`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
