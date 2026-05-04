# api/fundamentals.js

## Rôle
Fonctions de fetch pour les données fondamentales d'un ticker et les moyennes sectorielles.

## Dépendances
- `api/config.js` — API_URL, authFetch

## Exports
- `fetchFundamentals(ticker, signal)` — GET /api/fundamentals/{ticker} → Company + scores + close_price + `valuation_defaults: { default_wacc, default_growth, default_pe, sector_ev_ebitda }`
- `fetchSectorAverages(sector, signal)` — GET /api/fundamentals/sector-averages/{sector}
- `fetchSectorHistory(sector, signal)` — GET /api/fundamentals/sector-averages/{sector}/history

## Utilisé par
- `hooks/useFundamentals.js`
- `hooks/useSectorAverages.js`
- `hooks/useSectorHistory.js`

## Points d'attention
Toutes les fonctions propagent les erreurs HTTP (throw si !res.ok). Le hook appelant est responsable du retry/gestion d'erreur.
