import { API_URL } from './config';

export async function fetchPrices(ticker, interval, signal) {
  const res = await fetch(
    `${API_URL}/api/prices?ticker=${encodeURIComponent(ticker)}&interval=${interval}`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
