# MetricCard.jsx

## Rôle
Carte individuelle d'une métrique fondamentale : affiche le nom, la valeur formatée et la moyenne sectorielle colorée (vert si meilleur que la moyenne, rouge sinon).

## Dépendances
- **Internes** : `./MetricInfo`
- **Externes** : aucune

## Fonctionnement
- Reçoit un objet `metric` avec `{ name, val, unit, avg }`.
- Retourne `null` si ni `val` ni `avg` ne sont disponibles.
- `getAvgColor()` : détermine la couleur de la moyenne sectorielle selon la logique directionnelle :
  - `LOWER_IS_BETTER` (PER, EV/EBITDA, etc.) : vert si `val <= avg`.
  - `NEUTRAL` (Bêta, Capitalisation, etc.) : toujours gris.
  - Autres : vert si `val >= avg`.
- Le nom de la métrique est cliquable via `MetricInfo` (icône `i` inline).
- La valeur principale est affichée en 17px gras ; la moyenne sectorielle en 12px alignée à droite avec label "Moy. Secteur".

## Utilisé par
`Fundamentals.jsx` (vue solo, dans `renderCategory`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `metric` | object | `{ name: string, val: number\|null, unit: string, avg: number\|null }` |
| `fmt` | function | Formateur devise-aware `(val, unit) → string\|JSX` |
| `fmtRaw` | function | Formateur sans conversion `(val, unit) → string` (pour la moyenne sectorielle) |

## Points d'attention
- `fmt` et `fmtRaw` sont deux formateurs distincts : `fmt` convertit selon la devise cible, `fmtRaw` reste dans la devise source (les moyennes sectorielles agrègent des entreprises de devises différentes).
- `LOWER_IS_BETTER` et `NEUTRAL` sont des `Set` définis localement — cohérents avec les mêmes constantes dans `Fundamentals.jsx`.
