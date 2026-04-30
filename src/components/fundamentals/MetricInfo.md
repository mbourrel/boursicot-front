# MetricInfo.jsx

## Rôle
Bouton "i" inline qui affiche une bulle d'explication d'une métrique financière via un portal React, positionné intelligemment pour rester dans la fenêtre.

## Dépendances
- **Internes** : `../../constants/metricExplanations` (EXPLANATIONS)
- **Externes** : `react` (useState, useRef, createPortal)

## Fonctionnement
- Si le nom de la métrique n'est pas dans `EXPLANATIONS`, le composant retourne `null` (invisible).
- Au clic sur le bouton `i` : calcule la position de la bulle en fonction de l'espace disponible à droite et en bas de la fenêtre, puis `setPos` pour afficher la bulle.
- Un clic sur l'overlay transparent (en position fixed inset 0) ferme la bulle.
- `e.stopPropagation()` empêche le clic de propager et de déclencher des actions parentes.
- Le contenu peut être une string simple ou un objet `{ what, why }` (format structuré) :
  - String → texte brut en gris.
  - Objet → deux sections "C'est quoi ?" (bleu) et "Pourquoi c'est important ?" (vert).

## Utilisé par
`MetricCard.jsx`, `FinancialStatement.jsx`, et indirectement partout où une métrique est affichée.

## Props / API
| Prop | Type | Description |
|---|---|---|
| `name` | string | Nom de la métrique, clé de lookup dans `EXPLANATIONS` |

## Points d'attention
- La bulle est portée via `createPortal(document.body)` pour échapper à tout `overflow: hidden` parent.
- La logique de positionnement (`spaceBelow >= 180`, `spaceRight >= tooltipWidth + 8`) préfère afficher en bas à droite ; si pas de place, se repositionne au-dessus ou à gauche.
- `EXPLANATIONS` est dans `../../constants/metricExplanations` — ajouter une explication = ajouter une clé dans ce fichier.
