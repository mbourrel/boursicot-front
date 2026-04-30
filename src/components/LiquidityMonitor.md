# LiquidityMonitor.jsx

## Rôle
Widget "Liquidité Globale" : affiche la corrélation entre la masse monétaire M2 USA et le Bitcoin via un graphique lightweight-charts, les deux séries normalisées à 100 en janvier 2020.

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `./SourceTag`
- **Externes** : `react` (useState, useRef, useEffect), `lightweight-charts` (createChart, LineSeries)

## Fonctionnement

### Création du chart (`useEffect` sur `dates`, `m2_normalized`, `btc_normalized`)
- Crée le chart uniquement quand les trois tableaux de données sont disponibles et non vides, et seulement si aucun chart n'existe déjà (`chartRef.current`).
- Ajoute deux `LineSeries` : M2 (bleu `#60A5FA`) et Bitcoin (orange `#F97316`).
- Ajoute une `priceLine` à 100 (base de référence, en pointillés gris).
- Aligne M2 et BTC via `dates.map((d, i) => ({ time: d, value: série[i] }))`.
- `ResizeObserver` pour la réactivité de la largeur.
- Cleanup : `ro.disconnect()`, `chart.remove()`, reset des refs.

### Réactivité au thème
- `useEffect` sur `theme` : appelle `applyOptions` pour mettre à jour les couleurs de fond, grille et texte sans recréer le chart.

### Panneau d'info
- Explication en 3 colonnes (M2, corrélation M2/BTC, lecture base 100) + encadré "signal à surveiller".
- Toggle `showInfo` (bouton `i`).

### États
- `loading` : cache le canvas (hauteur `0px`) et affiche un texte centré.
- `error` : affiche le message en rouge.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
| Prop | Type | Description |
|---|---|---|
| `dates` | string[] | Dates ISO YYYY-MM-DD |
| `m2_normalized` | number[] | Valeurs M2 normalisées base 100 |
| `btc_normalized` | number[] | Valeurs BTC normalisées base 100 |
| `loading` | boolean | État de chargement |
| `error` | string | Message d'erreur |

## Points d'attention
- Le chart n'est créé qu'une seule fois (`if (chartRef.current) return`). Si les données changent après la création, elles ne sont pas rechargées — à prévoir si le composant doit être dynamique.
- Le thème est géré séparément via un `useEffect` dédié pour éviter la recréation du chart.
- `eslint-disable-line react-hooks/exhaustive-deps` intentionnel sur la dépendance theme dans le premier useEffect.
