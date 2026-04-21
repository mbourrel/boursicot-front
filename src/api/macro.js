import { API_URL, authFetch } from './config';

async function fetchWithDetail(url, signal) {
  const res = await authFetch(url, { signal });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const body = await res.json(); detail = body.detail ?? detail; } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchMacroAll(signal) {
  const [cycle, historyResult, liquidity] = await Promise.all([
    fetchWithDetail(`${API_URL}/macro/cycle`,         signal),
    fetchWithDetail(`${API_URL}/macro/cycle/history`, signal),
    fetchWithDetail(`${API_URL}/macro/liquidity`,     signal),
  ]);
  return { cycle, history: historyResult.history, liquidity };
}

export async function fetchMacroRates(signal) {
  return fetchWithDetail(`${API_URL}/macro/rates`, signal);
}
