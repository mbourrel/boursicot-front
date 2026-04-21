export const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.VITE_API_URL;

let _getToken = null;
export function registerTokenGetter(fn) { _getToken = fn; }

export async function authFetch(url, options = {}) {
  const token = _getToken ? await _getToken() : null;
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
