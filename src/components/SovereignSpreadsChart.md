# SovereignSpreadsChart.jsx

## Rôle
Widget "Baromètre de Confiance — Dettes Souveraines" : graphique multi-séries des rendements obligataires souverains (US, Allemagne, France, UK) en 3M/2Y/10Y/30Y, avec légende toggleable, tooltip au survol et affichage des spreads US–DE et FR–DE.

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `./SourceTag`
- **Externes** : `react` (useMemo, useState, useRef, useEffect), `lightweight-charts` (createChart, LineSeries)

## Fonctionnement

### Constantes
- `SERIES` : tableau de 10 séries (clé, label, couleur, drapeau, `dashed`). Les séries 3M sont en tirets.
- `SERIES_DEFINITIONS` : descriptions pédagogiques de chaque série (affiché dans le panneau info).
- `NAME_BY_KEY` : correspondance key → nom tel qu'il apparaît dans `bondYields`.

### `buildAlignedDates(history)`
Fusionne les dates de toutes les séries en un tableau unique trié, et construit pour chaque série un `map { date → value }` pour l'alignement.

### Création du chart (`useEffect` sur `aligned`)
- Crée un chart avec 10 `LineSeries` (toutes les séries).
- Initialise la visibilité via `visibleKeys` (défaut : `us2y`, `us10y`, `oat10y`).
- Abonnement `subscribeCrosshairMove` → tooltip personnalisé (`hoverData`) avec les valeurs des séries visibles et les spreads US–DE / FR–DE calculés à la volée.

### Réactivité (sans recréer le chart)
- `useEffect` sur `theme` : `applyOptions` pour les couleurs.
- `useEffect` sur `visibleKeys` : `applyOptions({ visible })` sur chaque série.
- `useEffect` sur `range` : `setVisibleRange` ou `fitContent`.

### Statistiques
- `visibleStats` (useMemo) : min/max de chaque série visible sur la plage active.
- `rateByKey` (useMemo) : taux courant de chaque série depuis `bondYields`.

### Toggles de séries
- `toggleSeries(key)` : ajoute ou retire une clé de `visibleKeys`, avec garde : au moins 1 série visible.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
| Prop | Type | Description |
|---|---|---|
| `history` | object | `{ us2y: { dates, values }, us10y: ..., ... }` — une entrée par clé de série |
| `bondYields` | array | `[{ name, rate }]` — taux courants |
| `loading` | boolean | Affiche "Chargement…" |
| `error` | string | Affiche le message en rouge |

## Points d'attention
- `buildAlignedDates` aligne les séries qui n'ont pas forcément les mêmes dates (fréquences différentes : quotidien FRED vs mensuel OCDE).
- Les drapeaux nationaux sont chargés depuis `flagcdn.com` — nécessite une connexion internet.
- Le tooltip `hoverData` est un div `position: absolute` en haut à droite du canvas, pas un élément `lightweight-charts`.
- `eslint-disable-line` intentionnel sur la dépendance `aligned` dans le useEffect de création.
