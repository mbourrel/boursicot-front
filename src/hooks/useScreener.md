# hooks/useScreener.js

## Rôle
Récupère les données du screener depuis `/api/screener` et expose la logique de filtrage client-side pour le `Screener.jsx`.

## Dépendances
- **API** : `GET /api/screener` via `authFetch`
- **Contexte** : aucun

## Fonctionnement
Fetch unique au mount (`/api/screener`) — retourne `{ticker, name, sector, country, is_scorable, scores, live_price, live_change_pct}` pour les 64 actifs.

Expose les fonctions de filtrage :
- `filterByGeo(assets, geo)` — 'all' | 'europe' | 'us' via `getGeoRegion(country)`
- `filterBySector(assets, sector)`
- `filterByHealth(assets, healthLevel)` — compare `scores.health` aux seuils définis
- `filterByValuation(assets, valuationLevel)` — compare `scores.valuation` aux seuils

Retourne : `{ assets, filteredAssets, loading, error }`.

## Utilisé par
- `Screener.jsx`

## Points d'attention
- Le filtrage est entièrement côté client — pas de nouvel appel API à chaque changement de filtre.
- Les actifs non-scorables (`is_scorable: false`) ont `scores: null` — les traiter comme "filtre non applicable" et les inclure par défaut dans tous les filtres de score.
- `getGeoRegion(country)` retourne `null` pour les pays inconnus — inclus dans "Monde entier" mais exclus de "Europe" et "États-Unis".
