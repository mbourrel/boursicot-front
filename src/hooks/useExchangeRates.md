# useExchangeRates.js

## Rôle
Charge les taux de change forex (EURUSD, GBPUSD, JPYUSD, CHFUSD) depuis la DB via l'API.

## Dépendances
- `fetchExchangeRates` (api/exchange_rates.js) — GET /api/exchange-rates

## Fonctionnement
`useEffect` avec `AbortController`. En cas d'erreur (endpoint indisponible, table vide), fail silencieux avec `console.warn` — l'app reste fonctionnelle en mode LOCAL.

Retourne `{ rates: { EURUSD: 1.085, ... } | null, updatedAt: "2026-04-30" | null }`.

## Utilisé par
- `CurrencyContext.jsx` — distribue les rates globalement à toute l'app

## Points d'attention
- `rates` peut être `null` si la table `exchange_rates` est vide (avant le premier run du workflow)
- Le fail silencieux est intentionnel : l'absence de rates → mode LOCAL automatique dans `formatFinancialValue`
