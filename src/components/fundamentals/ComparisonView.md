# fundamentals/ComparisonView.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Rendu de la vue multi-actifs de l'analyse fondamentale. Affiche la synthèse des scores (cartes + radar SVG), puis des tableaux comparatifs côte à côte pour toutes les catégories de métriques et les états financiers.

## Dépendances
- **Contextes** : `CurrencyContext` (`targetCurrency, rates`)
- **Hooks** : `useBreakpoint`
- **Sous-composants** : `CurrencyBar`, `CompareTable`, `RadarChart`, `ScoreCompareCard`, `MetricInfo`, `MethodologyModal`, `SourceTag`
- **Constantes** : `LOWER_IS_BETTER`, `NEUTRAL_METRICS` (coloration meilleur/pire), `ASSET_COLORS` (CompareBar)
- **Utilitaires** : `formatFinancialValue`
- **Externes** : `react (useState, useMemo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `allSymbols` | `string[]` | Tickers à comparer (selectedSymbol + compareSymbols) |
| `dataMap` | `object` | Map `ticker → données fondamentales` |

## Fonctionnement

### `SIMPLE_CATEGORIES` / `STMT_CATEGORIES`
Constantes module définissant les 6 catégories de métriques simples (market_analysis, financial_health…) et les 3 états financiers (income_stmt_data, balance_sheet_data, cashflow_data). Déclarées hors composant.

### Helpers (définis avant les `useMemo`)
- `getSimpleMetricNames(catKey)` : union des noms de métriques présents dans tous les tickers pour une catégorie.
- `getStmtMetricNames(stmtKey)` : idem pour les lignes d'états financiers.
- `getSimpleMetric(sym, catKey, name)` : récupère un objet métrique `{val, unit}` pour un ticker/catégorie/nom.
- `getStmtMetric(sym, stmtKey, name)` : idem pour les états financiers, retourne `{val, prev, unit, year}`.

### `simpleMetricNames` / `stmtMetricNames`
Mémorisés avec `useMemo([dataMap, allSymbols])` — recalculés uniquement si les données ou les tickers changent. Les helpers sont définis **avant** les useMemo pour éviter la zone morte temporelle.

### `MetricNameCell`
Composant local (non exporté) : cellule `<td>` sticky à gauche, avec `MetricInfo` inline. L'ombre portée (`boxShadow`) s'active via la prop `scrolled` passée depuis `CompareTable`.

### Coloration meilleur/pire
Pour chaque ligne, calcule `maxVal` et `minVal` parmi les valeurs non-nulles. Colore en vert (`#26a69a`) la meilleure valeur et en rouge (`#ef5350`) la pire. Respecte `LOWER_IS_BETTER` (ex: PER, dette) et `NEUTRAL_METRICS` (ex: Beta) qui désactivent la coloration.

### YoY (Year-over-Year)
Dans les états financiers, affiche un indicateur `▲/▼ X% vs N-1` sous la valeur principale si `val` et `prev` sont tous les deux non-null.

## Utilisé par
`Fundamentals.jsx` — branche `isSoloMode === false`

## Points d'attention
- `RadarChart` est masqué sur mobile (`display: isMobile ? 'none' : 'flex'`) — illisible en dessous de 768px.
- `MethodologyModal` est géré localement (`showMethodology` state) — bouton "Définition des indicateurs" dans l'en-tête de comparaison (distinct du bouton dans `ScoreDashboard`).
- Le `yearLabel` dans les titres des états financiers est extrait du premier ticker disponible ayant la donnée.
- `ASSET_COLORS` importé depuis `CompareBar.jsx` — source unique de vérité pour les couleurs par position.
- La colonne label est sticky (`position: sticky; left: 0`) via `CompareTable` — l'ombre s'active à partir de `scrollLeft > 4px`.
