# LiquidityMonitor.jsx

## Rôle
Widget "Liquidité Globale" : affiche la corrélation entre la masse monétaire M2 USA et le Bitcoin via un graphique lightweight-charts, les deux séries normalisées à 100 en janvier 2020. **Double axe Y** depuis 2026-05-01.

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `./SourceTag`
- **Externes** : `react` (useState, useRef, useEffect), `lightweight-charts` (createChart, LineSeries)

## Fonctionnement

### Double axe Y (ajout 2026-05-01)
M2 normalisé a une plage étroite (85–130), BTC normalisé a une plage large (100–1000+). L'axe Y partagé écrasait visuellement la courbe M2. Solution : double axe Y avec `priceScaleId: 'left'` pour M2 et `priceScaleId: 'right'` pour BTC.

```js
const chart = createChart(containerRef.current, {
  leftPriceScale:  { visible: true, borderColor: theme.chartGrid },
  rightPriceScale: { visible: true, borderColor: theme.chartGrid },
});
m2Series  = chart.addSeries(LineSeries, { priceScaleId: 'left',  ... });
btcSeries = chart.addSeries(LineSeries, { priceScaleId: 'right', ... });
```

Le `applyOptions` de thème inclut également `leftPriceScale` et `rightPriceScale`.

### Création du chart (`useEffect` sur `dates`, `m2_normalized`, `btc_normalized`)
- Crée le chart uniquement quand les trois tableaux sont disponibles et si aucun chart n'existe déjà (`chartRef.current`).
- Ajoute une `priceLine` à 100 sur l'axe gauche (base de référence, en pointillés).
- `ResizeObserver` pour la réactivité de la largeur.
- Cleanup : `ro.disconnect()`, `chart.remove()`, reset des refs.

### Texte MIF2-compliant (ajout 2026-05-01)
Le texte d'origine mentionnait M2 comme "signal précurseur d'un rallye Bitcoin" — langage proscrit MIF2. Remplacé par un encadré observationnel :
> "Les cycles d'expansion de M2 ont souvent coïncidé avec des périodes d'appréciation des actifs risqués, dont les crypto-actifs. Ces corrélations passées ne préjugent pas des comportements futurs et **ne constituent pas un signal d'investissement.**"

### Légende
Badge "Double axe Y" en haut à droite pour indiquer à l'utilisateur que les deux échelles sont indépendantes. Flèches directionnelles (← M2 USA / Bitcoin →) pour identifier visuellement quel axe correspond à quelle série.

## Utilisé par
`MacroEnvironment.jsx`

## Props
| Prop | Type | Description |
|---|---|---|
| `dates` | string[] | Dates ISO YYYY-MM-DD |
| `m2_normalized` | number[] | Valeurs M2 normalisées base 100 |
| `btc_normalized` | number[] | Valeurs BTC normalisées base 100 |
| `loading` | boolean | État de chargement |
| `error` | string | Message d'erreur |

## Points d'attention
- Le chart n'est créé qu'une seule fois — si les données changent après la création, elles ne sont pas rechargées (acceptable : les données macro sont quasi-statiques côté frontend).
- Le thème est mis à jour via un `useEffect` dédié sur `theme` — doit inclure `leftPriceScale` et `rightPriceScale` pour éviter un retour aux couleurs par défaut.
- `eslint-disable-line react-hooks/exhaustive-deps` intentionnel sur la dépendance theme dans le premier useEffect.
- Le double axe Y est un choix définitif sur des données normalisées base 100 : l'échelle log n'aide pas ici car le problème est la dispersion des plages (85–130 vs 100–1000), pas l'amplitude.
