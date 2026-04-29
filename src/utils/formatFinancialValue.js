/**
 * Utilitaire de formatage financier avec conversion de devise optionnelle.
 *
 * Règle critique : les ratios et pourcentages (%, x) sont TOUJOURS affichés
 * en valeur brute — jamais convertis. Seules les valeurs monétaires ($) sont
 * converties selon la devise cible.
 *
 * @param {number|null} value          - Valeur brute
 * @param {string}      unit           - Unité du champ : '$', '%', 'x'
 * @param {string}      sourceCurrency - Devise originale du ticker (ex: 'EUR', 'USD')
 * @param {string}      targetCurrency - Devise cible : 'LOCAL' | 'EUR' | 'USD'
 * @param {object|null} rates          - { EURUSD: 1.08, GBPUSD: 1.27, ... } ou null
 * @returns {string}                   - Valeur formatée prête à l'affichage
 */

const ADIMENSIONAL = new Set(['%', 'x']);

const CURRENCY_SYMBOL = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'Fr' };

function formatAmount(value, currency) {
  const sym  = CURRENCY_SYMBOL[currency] ?? '$';
  const abs  = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} Md${sym}`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)} M${sym}`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)} k${sym}`;
  return `${sign}${abs.toFixed(2)} ${sym}`;
}

function toUSD(value, currency, rates) {
  if (!rates || !currency || currency === 'USD') return value;
  const rate = rates[`${currency}USD`];
  return rate ? value * rate : value; // paire inconnue → valeur inchangée
}

export function formatFinancialValue(value, unit, sourceCurrency, targetCurrency, rates) {
  if (value === null || value === undefined || value === 0) return '—';

  // Ratios et pourcentages — jamais de conversion
  if (ADIMENSIONAL.has(unit)) {
    return unit === '%' ? `${value.toFixed(2)}%` : `${value.toFixed(2)}x`;
  }

  const src = sourceCurrency || 'USD';

  // Mode devise locale ou taux indisponibles — affichage brut dans la devise source
  if (targetCurrency === 'LOCAL' || !rates || Object.keys(rates).length === 0) {
    return formatAmount(value, src);
  }

  const valueInUSD = toUSD(value, src, rates);

  if (targetCurrency === 'USD') {
    return formatAmount(valueInUSD, 'USD');
  }

  if (targetCurrency === 'EUR') {
    const eurRate = rates['EURUSD'];
    if (!eurRate) return formatAmount(valueInUSD, 'USD'); // fallback si EURUSD absent
    return formatAmount(valueInUSD / eurRate, 'EUR');
  }

  return formatAmount(value, src); // fallback générique
}
