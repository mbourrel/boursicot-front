# SimpleChart.jsx

## Rôle
Graphique de cours simplifié (ligne / aire) avec support multi-actifs pour la comparaison, moyennes mobiles (MM10/100/200) en mode solo, et statistiques dynamiques sur la fenêtre visible.

## Dépendances
- **Internes** : `./CompareBar` (ASSET_COLORS), `../context/ThemeContext` (useTheme), `../api/config` (API_URL, authFetch), `./SourceTag`
- **Externes** : `react` (useEffect, useRef, useState), `lightweight-charts` (createChart, AreaSeries, LineSeries)

## Fonctionnement

### Création du chart (useEffect sur `selectedSymbol`, `compareSymbols`, `candleInterval`, `individualScales`, `isDark`)
- Détruit et recrée le chart à chaque changement de ces dépendances.
- **Mode solo** : série `AreaSeries` avec dégradé couleur.
- **Mode comparaison** : `LineSeries` par actif. L'actif principal et les actifs en mode normalisé partagent l'échelle principale ; chaque actif en mode individuel (`individualScales`) obtient sa propre `priceScaleId` cachée.
- Récupère les données via `authFetch` directement (sans passer par `fetchPrices`) pour paralléliser les requêtes.
- En mode solo, calcule MA10/100/200 sur les données brutes et ajoute 3 `LineSeries` dédiées (cyan, orange, violet).

### Statistiques dynamiques
- Abonnement `subscribeVisibleLogicalRangeChange` : recalcule les stats (prix courant + variation % sur la fenêtre visible) avec un debounce de 50 ms.
- `setAssetStats` met à jour les badges en temps réel.

### Auto-upgrade d'intervalle
- Si le dézoom dépasse le début des données (15m → 1h → 1D), l'intervalle est upgrader automatiquement via `setCandleInterval`.

### Toggles MA
- `useEffect` réactifs sur `showMa10/100/200` : appellent `applyOptions({ visible })` sans recréer le chart.

### `applyTimeRange`
Même logique que `TradingChart` : plage temporelle sur la timeScale.

## Utilisé par
`App.jsx` (Dashboard, vue `chart`, mode `simple`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `selectedSymbol` | string | Ticker principal |
| `compareSymbols` | string[] | Tickers en comparaison (défaut `[]`) |
| `allAssets` | array | Liste `{ ticker, name }` pour la légende |

## Points d'attention
- Le bouton "Cours réels / Échelle normalisée" est visible uniquement en mode comparaison (`isComparing`).
- Les MAs ne sont calculées et affichées qu'en mode solo (sans comparaison).
- `compareSymbols.join(',')` est utilisé comme dépendance du useEffect pour détecter le changement de tableau.
- `authFetch` est appelé directement ici (pas via `fetchPrices`) — si l'API des prix change, les deux fichiers doivent être mis à jour.
