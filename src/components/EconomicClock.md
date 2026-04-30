# EconomicClock.jsx

## Rôle
Widget "Horloge Économique" : visualise la phase du cycle économique (Expansion / Surchauffe / Contraction / Récession) via une jauge semi-circulaire SVG, et affiche l'historique des phases depuis 1948 avec un graphique lightweight-charts coloré par phase.

## Dépendances
- **Internes** : `./SourceTag`
- **Externes** : `react` (useMemo, useState, useRef, useEffect), `lightweight-charts` (createChart, LineSeries)

## Fonctionnement

### Géométrie de la jauge (`arcPath`, `PHASES`, `CX/CY/OUTER_R/INNER_R`)
- Arc semi-circulaire divisé en 4 quadrants de 45° chacun.
- La phase active est mise en pleine couleur, les autres sont en opacité réduite.
- L'aiguille est un `<line>` + `<polygon>` SVG rotatif via CSS transform, animé en cubic-bezier spring.

### Phase active
- `activePhase` est trouvé par correspondance sur `phase` (string).
- `cssRotation = 90 - needleAngle` convertit l'angle géométrique (0° = droite) en rotation CSS (0° = haut).

### `CycleHistoryChart`
- Crée un chart `lightweight-charts` avec `LineSeries` segmentées par phase (une série par segment continu de même phase) grâce à `splitByPhase`.
- Ligne de référence à 0% en pointillés.
- `ResizeObserver` pour la réactivité.
- Cleanup complet au démontage.

### `YoYBlock`
Mini-composant affichant la valeur YoY + flèche tendance (↑/↓) colorée selon si c'est bon ou mauvais pour la variable (croissance : vert si ↑, inflation : vert si ↓).

### Panneau d'info (`showInfo`)
Explication complète de la méthodologie (Fidelity / Dalio), des 4 phases, des indicateurs INDPRO et CPIAUCSL, et de la lecture du graphique historique.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
| Prop | Type | Description |
|---|---|---|
| `phase` | string | Phase actuelle : `'Expansion'` \| `'Surchauffe'` \| `'Contraction'` \| `'Récession'` |
| `growth_yoy` | number | Variation YoY de l'INDPRO (%) |
| `inflation_yoy` | number | Variation YoY du CPI (%) |
| `growth_trend` | string | `'up'` \| `'down'` |
| `inflation_trend` | string | `'up'` \| `'down'` |
| `loading` | boolean | Affiche un placeholder pendant le chargement |
| `error` | string | Message d'erreur |
| `history` | array | `[{ date, phase, growth_yoy }]` — historique depuis 1948 |
| `historyLoading` | boolean | Affiche "Chargement…" dans la colonne droite |

## Points d'attention
- Le chart historique est créé une seule fois et ne se recrée pas si le thème change — le thème est hardcodé en valeurs sombres (`#2a2f3a`).
- `splitByPhase` ajoute un point de chevauchement à chaque transition de phase pour éviter les gaps visuels entre segments.
- Si `history` est vide ou null, le composant affiche un message de remplacement sans erreur.
