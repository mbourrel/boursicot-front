# fundamentals/RadarChart.jsx

## Rôle
Graphique radar SVG pur (sans librairie) affichant les 6 scores fondamentaux (Santé, Valorisation, Croissance, Efficacité, Dividende, Momentum) pour un ou plusieurs actifs en mode Comparaison.

## Dépendances
- **Internes** : `../CompareBar (ASSET_COLORS)`
- **Externes** : `react (memo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `allSymbols` | `string[]` | Tickers à afficher (jusqu'à 5) |
| `dataMap` | `object` | Map `ticker → { scores }` |

## Fonctionnement
- Taille fixe : SVG `280×280`, `cx = cy = 140`, `maxRadius = 88`, labels à `maxRadius + 20px`.
- 6 axes à 60° d'intervalle, décalés de -90° (axe 0 = sommet).
- Grilles hexagonales à 25%/50%/75%/100% du rayon.
- Chaque ticker : polygone rempli (`fill = couleur + '28'`, opacité 16%) + contour coloré + cercles aux sommets.
- Valeurs manquantes (`efficiency`, `dividend`, `momentum`) fallback à `5` (note neutre) — ne bloque pas le rendu.
- `anchor(a)` : fonction qui retourne `'middle'|'start'|'end'` selon l'angle pour aligner les labels SVG.

## Points d'attention
- Masqué sur mobile dans `Fundamentals.jsx` (`!isMobile` via `useBreakpoint`) — illisible en dessous de 768px.
- Enveloppé dans `memo()` — pas de re-render si `allSymbols` et `dataMap` ne changent pas.
- `ASSET_COLORS` importé depuis `CompareBar.jsx` — source unique de vérité pour les couleurs par position de comparaison.
