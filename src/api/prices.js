import { API_URL, authFetch } from './config';

export async function fetchPrices(ticker, interval, signal) {
  const res = await authFetch(
    `${API_URL}/api/prices?ticker=${encodeURIComponent(ticker)}&interval=${interval}`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
