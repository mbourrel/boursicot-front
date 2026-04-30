# utils/formatFinancialValue.js

## Rôle
Convertit et formate une valeur financière selon la devise cible. Règle absolue : jamais de conversion pour les ratios (%, x).

## Dépendances
Aucune (module pur).

## Fonctionnement

### Exports
- `formatFinancialValue(value, unit, sourceCurrency, targetCurrency, rates)` → string

### Pipeline interne
1. `value` null/undefined/0 → `'—'`
2. `unit` dans `{'%', 'x'}` → formatage brut sans conversion (`2.34%` ou `2.34x`)
3. `targetCurrency === 'LOCAL'` ou `rates` vide → `formatAmount(value, sourceCurrency)`
4. `targetCurrency === 'USD'` → `toUSD(value, src, rates)` puis formatage
5. `targetCurrency === 'EUR'` → `toUSD` puis `/= rates['EURUSD']` puis formatage

### Helpers internes
- `formatAmount(value, currency)` — format lisible (`1.23 Md€`, `456 M$`, `12.3 k£`)
- `toUSD(value, currency, rates)` — multiplie par la paire `{currency}USD` (ex: `EURUSD`)

### CURRENCY_SYMBOL
`USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'Fr'`

## Utilisé par
- `components/Fundamentals.jsx` — `fmt` et `formatFinancialValue` par cellule en mode comparaison
- `context/CurrencyContext.jsx` — indirectement via Fundamentals

## Points d'attention
- Si la paire forex est inconnue dans `rates` (ex: CHF ticker vers EUR cible), `toUSD` retourne la valeur inchangée — pas d'erreur, pas de conversion silencieuse incorrecte
- Le fallback `formatAmount(value, src)` s'active si `targetCurrency` ne correspond à aucun cas connu
- Ne jamais passer `unit='$'` pour un ratio — les métriques DB utilisent `'x'` et `'%'` correctement
