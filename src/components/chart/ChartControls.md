# components/chart/ChartControls.jsx

## Rôle
Contrôles de configuration du `TradingChart` : sélection de l'intervalle (15m / 1h / 1D / 1W) et activation des indicateurs techniques (MA10/100/200, Bollinger Bands, ATR).

## Dépendances
- **Parent** : `TradingChart.jsx` (props onChange + état courant)

## Fonctionnement
Composant purement présentationnel — expose des boutons d'intervalle et des toggles d'indicateurs. L'état est géré dans `TradingChart.jsx` (ou `App.jsx`). Déclenche un changement de fetch via `usePrices` lorsque l'intervalle change.

## Utilisé par
- `TradingChart.jsx`

## Points d'attention
- Le changement d'intervalle déclenche un nouvel appel API (`/api/prices?ticker=X&interval=Y`) — prévoir un état de chargement pour éviter un flash de données vides.
- Les indicateurs (MA, BB, ATR) sont calculés côté client dans `usePrices.js` — pas d'appel supplémentaire.
