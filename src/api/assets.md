# api/assets.js

## Rôle
Fetch du catalogue complet des actifs disponibles dans l'app.

## Dépendances
- `api/config.js` — API_URL, authFetch

## Exports
- `fetchAssets()` — GET /api/assets → `[{ticker, name, country, sector}]`

## Utilisé par
- `hooks/useAssets.js`

## Points d'attention
Retourne tous les actifs de la table `companies` (64 tickers). Utilisé pour alimenter la recherche dans le Header et la CompareBar.
