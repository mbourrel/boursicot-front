# SimpleChart.jsx

## Rôle
Graphique de cours simplifié (ligne / aire) avec support multi-actifs pour la comparaison, moyennes mobiles (MM10/100/200) en mode solo, et statistiques dynamiques sur la fenêtre visible.

## Dépendances
- **Internes** : `./CompareBar` (ASSET_COLORS), `../context/ThemeContext` (useTheme, SEMANTIC_COLORS), `../api/config` (API_URL, authFetch), `./SourceTag`, `../hooks/useBreakpoint`, `../context/CurrencyContext` (useCurrency), `./fundamentals/CurrencyBar`
- **Externes** : `react` (useEffect, useRef, useState), `lightweight-charts` (createChart, AreaSeries, LineSeries)

## Fonctionnement

### Création du chart
Détruit et recrée le chart à chaque changement de `selectedSymbol`, `compareSymbols`, `candleInterval`, `individualScales`, `isDark`, `targetCurrency` ou taux de change.
- **Mode solo** : série `AreaSeries` avec dégradé.
- **Mode comparaison** : `LineSeries` par actif. En mode normalisé → même échelle ; en mode individuel → `priceScaleId` cachée par actif.
- Récupère les données via `authFetch` directement (sans passer par `fetchPrices`) pour paralléliser.
- En mode solo, calcule MA10/100/200 et ajoute 3 `LineSeries` (cyan, orange-amber, violet).

### Conversion de devise (ajout 2026-05-07)
`CurrencyBar` est rendu en haut du composant (même contrôle que l'onglet Analyse Fondamentale).

Deux helpers top-level :
- `currencyFromTicker(ticker)` : dérive la devise source depuis le suffixe du ticker (`.PA`/`.AS`/… → EUR, `.L` → GBP, `.T` → JPY, `.SW`/`.VX` → CHF, `.AX` → AUD, sans suffixe → USD).
- `getMultiplier(source, target, rates)` : retourne le facteur numérique source → target via l'USD comme pivot. Retourne `1` si `target === 'LOCAL'` ou si les devises sont identiques.

Les données brutes (`allDataRef`) sont toujours stockées en devise locale. Le multiplicateur est appliqué **au moment de `setData()`** sur chaque série lightweight-charts, donc le canvas affiche directement les valeurs converties. Les stats (prix + %) et la légende de survol sont calculés de la même façon. `formatPrice()` préfixe `€` ou `$` selon `targetCurrency`.

Dépendances du useEffect : `targetCurrency`, `rates?.EURUSD`, `rates?.GBPUSD`, `rates?.JPYUSD`, `rates?.CHFUSD` — le chart se recrée automatiquement à chaque changement de devise ou de taux.

### Statistiques dynamiques
Abonnement `subscribeVisibleLogicalRangeChange` — recalcule les stats (prix + variation %) avec debounce 50 ms. Le multiplicateur est recalculé dans la closure à chaque rebond.

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
- Les données brutes en devise locale sont toujours conservées dans `allDataRef` — la conversion est appliquée uniquement à la sortie (canvas + stats). Ne jamais stocker des données déjà converties dans `allDataRef`.
