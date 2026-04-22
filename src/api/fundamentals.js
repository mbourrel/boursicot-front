import { API_URL, authFetch } from './config';

export async function fetchFundamentals(ticker, signal) {
  const res = await authFetch(
    `${API_URL}/api/fundamentals/${encodeURIComponent(ticker)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSectorAverages(sector, signal) {
  const res = await authFetch(
    `${API_URL}/api/fundamentals/sector-averages/${encodeURIComponent(sector)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSectorHistory(sector, signal) {
  const res = await authFetch(
    `${API_URL}/api/fundamentals/sector-averages/${encodeURIComponent(sector)}/history`,
    { signal }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
