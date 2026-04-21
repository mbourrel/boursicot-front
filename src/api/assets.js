import { API_URL } from './config';

export async function fetchAssets() {
  const res = await fetch(`${API_URL}/api/assets`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // [{ ticker, name }, ...]
}
