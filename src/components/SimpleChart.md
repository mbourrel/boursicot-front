# SimpleChart.jsx

## Rôle
Graphique de cours simplifié (ligne / aire) avec support multi-actifs pour la comparaison, moyennes mobiles (MM10/100/200) en mode solo, et statistiques dynamiques sur la fenêtre visible.

## Dépendances
- **Internes** : `./CompareBar` (ASSET_COLORS), `../context/ThemeContext` (useTheme), `../api/config` (API_URL, authFetch), `./SourceTag`, `../hooks/useBreakpoint`
- **Externes** : `react` (useEffect, useRef, useState), `lightweight-charts` (createChart, AreaSeries, LineSeries)

## Fonctionnement

### Création du chart
Détruit et recrée le chart à chaque changement de `selectedSymbol`, `compareSymbols`, `candleInterval`, `individualScales`, `isDark`.
- **Mode solo** : série `AreaSeries` avec dégradé.
- **Mode comparaison** : `LineSeries` par actif. En mode normalisé → même échelle ; en mode individuel → `priceScaleId` cachée par actif.
- Récupère les données via `authFetch` directement (sans passer par `fetchPrices`) pour paralléliser.
- En mode solo, calcule MA10/100/200 et ajoute 3 `LineSeries` (cyan, orange, violet).

### Statistiques dynamiques
Abonnement `subscribeVisibleLogicalRangeChange` — recalcule les stats (prix + variation %) avec debounce 50 ms.

### Auto-upgrade d'intervalle
Si le dézoom dépasse le début des données : 15m → 1h → 1D.

### Hauteur responsive
`CHART_HEIGHT = isMobile ? 300 : 500` via `useBreakpoint`. Le wrapper a `overflow: hidden` et `maxWidth: 100%`.

## Utilisé par
`App.jsx` (Dashboard, vue `chart`, mode `simple`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `selectedSymbol` | string | Ticker principal |
| `compareSymbols` | string[] | Tickers en comparaison (défaut `[]`) |
| `allAssets` | array | Liste `{ ticker, name }` pour la légende |

## Points d'attention
- MAs calculées uniquement en mode solo.
- `authFetch` appelé directement ici — si l'API des prix change, mettre à jour aussi ce fichier.
- `compareSymbols.join(',')` sert de dépendance au useEffect pour détecter les changements.
