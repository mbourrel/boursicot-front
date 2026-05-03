# fundamentals/ScoreCompareCard.jsx

## Rôle
Carte de résumé des scores pour un actif en mode Comparaison. Affiche la note globale, le verdict et les 6 scores piliers avec barres de progression.

## Dépendances
- **Externes** : `react (memo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `sym` | `string` | Ticker (affiché si `name` absent) |
| `color` | `string` | Couleur de l'actif (depuis `ASSET_COLORS`) |
| `name` | `string` | Nom de l'entreprise |
| `scores` | `object` | `{ global_score, verdict, health, valuation, growth, efficiency, dividend, momentum }` |

## Fonctionnement
- Bordure supérieure colorée (`borderTop: 3px solid color`) pour identifier visuellement l'actif.
- `scoreColor(s)` : teal `#26a69a` si ≥ 7, orange `#ff9800` si ≥ 4, rouge `#ef5350` sinon.
- `VERDICT_COLORS` : mapping verdict → couleur (identique à `ScoreDashboard`).
- Bloc note globale : fond coloré semi-transparent (`scoreColor + '18'`), bordure (`+ '44'`).
- 6 piliers avec barre de progression : largeur `(value/10) * 100%`.
- Si `scores` est null : message "Scores indisponibles".

## Points d'attention
- Enveloppé dans `memo()` — optimisation rendu dans la liste de comparaison.
- `efficiency`, `dividend`, `momentum` peuvent être `null` pour certains actifs — pas de fallback ici (contrairement à `RadarChart`), la barre sera à 0.
