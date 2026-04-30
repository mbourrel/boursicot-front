# useAssets.js

## Rôle
Charge le catalogue complet des actifs (ticker + name + country + sector) au démarrage.

## Dépendances
- `fetchAssets` (api/assets.js) — GET /api/assets

## Fonctionnement
`useEffect` unique au mount. En cas d'erreur, retourne un tableau vide (pas de blocage). Retourne `{ assets: [{ticker, name, country, sector}], loading }`.

## Utilisé par
- `App.jsx` → passe `fundamentalsData` à `Header` (recherche), `CompareBar`, `SimpleChart`, `TradingChart`

## Points d'attention
Chargé une seule fois au montage du Dashboard. Si le backend est en cold start, `assets` sera vide temporairement — le Header affiche simplement moins de résultats dans la recherche.
