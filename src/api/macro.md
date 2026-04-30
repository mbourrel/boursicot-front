# api/macro.js

## Rôle
Fonctions de fetch pour les données macroéconomiques (cycle, liquidité, taux).

## Dépendances
- `api/config.js` — API_URL, authFetch

## Exports
- `fetchMacroAll(signal)` — 3 appels en parallèle (cycle + history + liquidity) → `{cycle, history, liquidity}`
- `fetchMacroRates(signal)` — GET /macro/rates → `{central_banks, yield_curve, bond_yields, history}`

## Utilisé par
- `hooks/useMacro.js` — cycle + liquidity
- `hooks/useRates.js` — taux directeurs

## Points d'attention
- `fetchMacroAll` utilise `Promise.all` → un seul signal d'abort pour les 3 requêtes
- Le backend met en cache 24h (cycle/liquidity) et 6h (rates). Premier appel peut être lent si FRED doit être re-fetché
- `fetchWithDetail` : parse le détail de l'erreur FastAPI (`body.detail`) pour remonter un message clair
