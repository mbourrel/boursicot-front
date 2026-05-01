# MetricCard.jsx

## Rôle
Carte individuelle d'une métrique fondamentale : affiche le nom, la valeur formatée et la moyenne sectorielle colorée (vert si meilleur, rouge sinon).

## Dépendances
- **Internes** : `./MetricInfo`, `../../hooks/useBreakpoint`
- **Externes** : aucune

## Fonctionnement
- Reçoit un objet `metric` avec `{ name, val, unit, avg }`.
- Retourne `null` si ni `val` ni `avg` ne sont disponibles.
- `getAvgColor()` : couleur de la moyenne sectorielle selon la logique directionnelle :
  - `LOWER_IS_BETTER` (PER, EV/EBITDA…) : vert si `val <= avg`.
  - `NEUTRAL` (Bêta, Capitalisation…) : toujours gris.
  - Autres : vert si `val >= avg`.

### Layout adaptatif
- **Desktop** : valeur principale + moyenne sectorielle côte-à-côte.
- **Mobile** : valeur principale en haut, séparateur fin, "Moy. Secteur" en dessous — évite l'écrasement sur les cartes à 44% de largeur dans les carousels.
- Tailles de police réduites sur mobile (`15px` valeur, `11px` label).
- `padding` réduit sur mobile (`8px 10px`).

## Utilisé par
`Fundamentals.jsx` (vue solo, dans `renderCategory` et `renderFlatMetrics`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `metric` | object | `{ name: string, val: number\|null, unit: string, avg: number\|null }` |
| `fmt` | function | Formateur devise-aware `(val, unit) → string\|JSX` |
| `fmtRaw` | function | Formateur sans conversion `(val, unit) → string` (pour la moyenne sectorielle) |
| `large` | boolean | Variante grande taille (MÉTRIQUES REINES) |

## Points d'attention
- `fmt` et `fmtRaw` sont deux formateurs distincts : `fmt` convertit selon la devise cible, `fmtRaw` reste en devise source (les moyennes sectorielles agrègent des entreprises de devises différentes).
- `LOWER_IS_BETTER` et `NEUTRAL` sont des `Set` locaux — synchronisés avec les mêmes constantes dans `Fundamentals.jsx`.
- `overflow: hidden` sur la carte pour éviter tout débordement dans les carousels mobiles.
