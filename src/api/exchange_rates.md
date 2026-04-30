# api/exchange_rates.js

## Rôle
Fetch des taux de change forex depuis la table `exchange_rates` du backend.

## Dépendances
- `api/config.js` — API_URL, authFetch

## Exports
- `fetchExchangeRates(signal)` — GET /api/exchange-rates → `{rates: {EURUSD, GBPUSD, ...}, updated_at}`

## Utilisé par
- `hooks/useExchangeRates.js`

## Points d'attention
- Source : frankfurter.app (taux BCE), seedé quotidiennement en DB
- Si la table est vide (avant le 1er run du workflow), retourne `{rates: {}, updated_at: null}` — l'app gère ce cas en restant en mode LOCAL
