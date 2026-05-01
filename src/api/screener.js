import { API_URL, authFetch } from './config';

export async function fetchScreener(signal) {
  const res = await authFetch(`${API_URL}/api/screener`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
