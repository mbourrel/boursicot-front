# useRates.js

## Rôle
Charge les taux directeurs des banques centrales et les rendements obligataires depuis l'API macro.

## Dépendances
- `useRetryFetch` — gestion retry automatique
- `fetchMacroRates` (api/macro.js) — GET /macro/rates

## Fonctionnement
Wrapper minimal autour de `useRetryFetch` avec `fetchMacroRates`. Retourne `{ data, loading, error }` où `data` contient `central_banks`, `yield_curve`, `bond_yields`, `history`.

## Utilisé par
- `MacroEnvironment.jsx` → distribue les props à `CentralBanksThermometer`, `YieldCurveChart`, `SovereignSpreadsChart`

## Points d'attention
Données mises en cache côté backend 6h (TTL plus court que cycle/liquidity, car les taux changent plus fréquemment).
