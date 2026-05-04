# fundamentals/CompareTable.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Tableau de comparaison multi-actifs avec première colonne sticky. Rendu générique : reçoit les noms de lignes et une fonction `renderRow` qui produit les `<tr>` concrets. Gère l'ombre de scroll sur la colonne label.

## Dépendances
- **Internes** : `../CompareBar (ASSET_COLORS)`, `./styles (h3Style)`
- **Externes** : `react (useState, memo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Titre de section affiché au-dessus du tableau |
| `rows` | `string[]` | Noms des métriques à afficher (une ligne par nom) |
| `renderRow` | `(name, rowIdx, scrolled) => JSX` | Callback qui produit le `<tr>` pour chaque ligne |
| `allSymbols` | `string[]` | Tickers (pour les en-têtes de colonnes) |
| `dataMap` | `object` | Map ticker → données (pour afficher les noms dans les en-têtes) |
| `colWidth` | `string` | Largeur CSS des colonnes de données (ex: `'26%'`) |
| `isMobile` | `boolean` | Active les largeurs fixes et le scroll horizontal |

## Fonctionnement
- `scrolled` (state interne) : `true` si `scrollLeft > 4px` — active l'ombre portée `3px 0 8px -2px rgba(0,0,0,0.55)` et la bordure droite sur la colonne sticky.
- Largeurs fixes sur mobile : `LABEL_W = 130px`, `DATA_W = 120px` — `tableMin` = somme totale pour forcer le scroll horizontal.
- En-têtes de colonnes colorés avec `ASSET_COLORS[i]` pour identifier chaque actif visuellement.
- La prop `scrolled` est passée à `renderRow` pour que `MetricNameCell` (dans `ComparisonView`) synchronise son ombre avec celle du header.
- Retourne `null` si `rows.length === 0`.

## Utilisé par
`ComparisonView.jsx` — rendu de chaque catégorie de métriques et de chaque état financier

## Points d'attention
- Enveloppé dans `memo()` — ne se re-render que si ses props changent (optimisation clé en mode comparaison avec potentiellement 5 actifs × 9 tableaux).
- Le scroll horizontal est `overscrollBehaviorX: 'contain'` pour éviter que le swipe latéral ne déclenche la navigation arrière/avant sur mobile.
