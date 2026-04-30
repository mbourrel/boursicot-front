# TradingChart.jsx

## Rôle
Graphique de cours avancé en mode chandeliers japonais (OHLCV) avec indicateurs techniques (MA10/100/200, Bollinger Bands, ATR, volume) et outils de dessin interactifs superposés via un overlay SVG.

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `../api/prices` (fetchPrices), `./chart/ChartControls`, `./chart/DrawingToolbar`, `./SourceTag`
- **Externes** : `react` (useEffect, useRef, useState), `lightweight-charts` (createChart, CandlestickSeries, LineSeries, HistogramSeries)

## Fonctionnement

### Initialisation du chart (useEffect sur `selectedSymbol`, `candleInterval`, `isDark`)
- Crée un chart `lightweight-charts` avec fond de thème dynamique.
- Ajoute les séries : chandelier principal, volume (histogramme), MA10 (cyan), MA100 (orange), MA200 (violet), Bollinger Upper/Lower (bleu transparent), ATR (rose sur échelle séparée).
- Récupère les données via `fetchPrices` et calcule côté client : MA10/100/200 (moyennes mobiles simples), Bollinger Bands (SMA20 ± 2σ), True Range et ATR(14) Wilder.
- Abonne au scroll du timeScale pour déclencher un ré-render de l'overlay SVG (`setSvgTick`) et pour auto-upgrader l'intervalle (15m → 1h → 1D) si le dézoom dépasse le début des données.
- Cleanup : abort fetch, removeEventListener, `chart.remove()`.

### Indicateurs (useEffect sur `indicators`)
- Applique `applyOptions({ visible })` sur chaque série ref sans recréer le chart.

### Overlay SVG de dessin
- **Outils** : `trend` (ligne de tendance prolongée), `hline` (horizontale), `vline` (verticale), `zone` (rectangle semi-transparent), `fib` (niveaux de Fibonacci 0–100%).
- Clic 1 : `setPendingPoint` ; clic 2 : finalise le tracé dans `drawings`.
- `handleSvgClick` / `handleSvgMouseMove` / `handleSvgRightClick` gèrent les interactions sur l'overlay.
- Les coordonnées sont converties pixel ↔ {time, price} via `toPixel` / `fromPixel` (API `lightweight-charts`).
- `svgTick` force un re-render de l'overlay au scroll pour que les annotations restent synchronisées avec le zoom.
- Touche Escape annule l'outil en cours.

### Légende crosshair
- Abonnement `subscribeCrosshairMove` → mise à jour de `legendData` (close, volume, MAs, BB, ATR).

### `applyTimeRange`
Applique une plage temporelle (1W, 1M, 3M, 6M, 1Y, 5Y, ALL) sur la timeScale, avec gestion du format de temps (ISO pour journalier, timestamp UNIX pour intraday).

## Utilisé par
`App.jsx` (Dashboard, vue `chart`, mode `trading`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `selectedSymbol` | string | Ticker à afficher |
| `allAssets` | array | Liste `{ ticker, name }` pour la légende |

## Points d'attention
- `candleIntervalRef` maintient la valeur courante de l'intervalle dans les callbacks du chart pour éviter les closures périmées.
- L'overlay SVG a `pointerEvents: none` quand aucun outil n'est actif, laissant `lightweight-charts` gérer le scroll/zoom.
- Le chart est entièrement détruit et recréé à chaque changement de `selectedSymbol`, `candleInterval` ou `isDark`.
- Les niveaux Fibonacci sont calculés sur la plage de prix sélectionnée (p1.price, p2.price), indépendamment du temps.
