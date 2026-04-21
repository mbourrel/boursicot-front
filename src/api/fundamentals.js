import { API_URL } from './config';

export async function fetchFundamentals(ticker, signal) {
  const res = await fetch(
    `${API_URL}/api/fundamentals/${encodeURIComponent(ticker)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
