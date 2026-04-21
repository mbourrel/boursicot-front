import { API_URL, authFetch } from './config';

export async function fetchAssets() {
  const res = await authFetch(`${API_URL}/api/assets`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // [{ ticker, name }, ...]
}
