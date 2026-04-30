# YieldCurveChart.jsx

## Rôle
Widget "Indicateur de Récession" : visualise le spread 10Y–2Y des bons du Trésor américain (courbe des taux) via un graphique `BaselineSeries` lightweight-charts et un snapshot SVG de la courbe actuelle.

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `./SourceTag`
- **Externes** : `react` (useMemo, useState, useRef, useEffect), `lightweight-charts` (createChart, BaselineSeries)

## Fonctionnement

### `CurveSnapshot` (SVG)
- Mini-graphique SVG statique représentant la courbe actuelle (US 2Y, 10Y, 30Y).
- Calcule l'inversion (2Y > 10Y) et colore la courbe en rouge si inversée, bleu sinon.
- Affiche le spread 10Y–2Y courant.

### `SpreadHistory` (Canvas lightweight-charts)
- Crée un chart `BaselineSeries` (zone verte au-dessus de 0, zone rouge en dessous) représentant l'historique du spread 10Y–2Y.
- Filtrage de la plage via `idxForRange` : découpe le tableau de dates/valeurs selon la plage sélectionnée.
- Boutons de plage : 3M, 6M, 1Y, 2Y, 5Y, 10Y, Max + bouton Reset.
- Statistiques calculées via `useMemo` : min, max et nombre de mois en inversion sur la plage.
- Thème réactif via un `useEffect` séparé sur `theme`.

### `YieldCurveChart` (composant principal)
- Badge "Courbe Inversée" / "Courbe Normale" basé sur le spread courant.
- Panneau info rétractable : historique des 6 inversions/récessions depuis 1978, délai moyen inversion → récession.
- Layout : graphique historique (flex 1) + snapshot SVG (flex shrink 0).

### `idxForRange(dates, range)`
Utilitaire partagé (aussi présent dans `SovereignSpreadsChart`) : retourne `[startIndex, endIndex]` pour une plage temporelle.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
| Prop | Type | Description |
|---|---|---|
| `yieldCurve` | object | `{ dates: string[], values: number[] }` — spread historique 10Y–2Y |
| `bondYields` | array | `[{ name, rate }]` — taux courants (US 2Y, 10Y, 30Y…) |
| `loading` | boolean | Affiche "Chargement…" |
| `error` | string | Affiche le message en rouge |

## Points d'attention
- Le chart `SpreadHistory` n'est créé qu'une fois (`if (chartRef.current) return`). La plage est appliquée séparément via un `useEffect` sur `range`.
- `BaselineSeries` est l'API lightweight-charts pour les graphiques avec zone colorée au-dessus/en-dessous d'une valeur de référence.
- `eslint-disable-line` intentionnel pour les dépendances du useEffect de création du chart (thème et plage gérés séparément).
