# api/prices.js

## Rôle
Fetch de l'historique OHLCV depuis la table `prices` du backend.

## Dépendances
- `api/config.js` — API_URL, authFetch

## Exports
- `fetchPrices(ticker, interval, signal)` — GET /api/prices?ticker=&interval= → tableau de bougies OHLCV

## Utilisé par
- `hooks/usePrices.js` — calcule ensuite MA, BB, ATR côté client

## Points d'attention
- Source : Yahoo Finance (données historiques seedées en DB)
- `interval` : `15m` | `1h` | `1D` | `1W`
- Données disponibles sur 5 jours glissants pour 15m/1h, 10 ans pour 1D/1W (si seed_prices_init a été lancé)
