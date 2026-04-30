# Fundamentals.jsx

## Rôle
Affiche l'analyse fondamentale d'un ou plusieurs actifs : en mode solo, une fiche complète avec scores, métriques par catégorie et tableaux financiers historiques ; en mode comparaison, des tableaux côte-à-côte avec radar chart SVG.

## Dépendances
- **Internes** : `./CompareBar` (ASSET_COLORS), `../context/CurrencyContext` (useCurrency), `../utils/formatFinancialValue`, `./SourceTag`, `./fundamentals/MetricInfo`, `./fundamentals/MetricCard`, `./fundamentals/FinancialStatement`, `./fundamentals/ScoreDashboard`, `./fundamentals/MethodologyModal`, `../hooks/useFundamentals`, `../hooks/useSectorAverages`, `../hooks/useSectorHistory`
- **Externes** : `react` (useState)

## Fonctionnement

### Mode Solo (`isSolo === true`)
- Charge les données via `useFundamentals([selectedSymbol])`.
- Charge les moyennes sectorielles (`useSectorAverages`) et l'historique sectoriel (`useSectorHistory`) pour la comparaison avec la moyenne du secteur.
- Affiche : en-tête (nom, badge verdict, badge complexité, description, fiche d'identité), puis `ScoreDashboard`, puis 6 catégories de métriques en grille via `renderCategory` → `MetricCard`.
- En mode avancé (`!isBeginnerMode`) : 3 tableaux `FinancialStatement` (compte de résultat, bilan, flux) + tableau dividendes si disponible.
- `fmt` est redéfini dynamiquement selon la devise source du ticker et la devise cible choisie dans `CurrencyContext`.

### Mode Comparaison (`isSolo === false`)
- Charge les données de tous les symboles en parallèle.
- Affiche des en-têtes colorés par actif, une synthèse des scores Boursicot avec barres de progression, et un radar chart SVG 6 axes (Santé, Valorisation, Croissance, Efficacité, Dividende, Momentum) dessiné à la main sans librairie.
- Tableaux de comparaison : métriques simples par catégorie (coloration vert/rouge meilleur/pire), puis états financiers (N-1 YoY en sous-ligne).
- Bouton "Définition des indicateurs" ouvre `MethodologyModal`.

### Constantes
- `LOWER_IS_BETTER` : métriques où une valeur basse est un signal positif (PER, EV/EBITDA…).
- `NEUTRAL_METRICS` : métriques sans signal directionnel (Bêta, Capitalisation…).

## Utilisé par
`App.jsx` (Dashboard, vue `fundamentals`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `selectedSymbol` | string | Ticker principal |
| `compareSymbols` | string[] | Tickers en comparaison (défaut `[]`) |
| `isBeginnerMode` | boolean | Masque les tableaux avancés si `true` |
| `setIsBeginnerMode` | function | Passé à `ScoreDashboard` pour le bouton CTA |

## Points d'attention
- `fmt` est une fonction locale réassignée dans le corps du composant selon la devise — ne pas la capturer dans une closure avant la réassignation.
- `fmtRaw` reste toujours non converti (moyennes sectorielles en devise mixte).
- Le radar chart est un SVG pur calculé à partir de `dataMap[sym]?.scores` — les scores manquants retournent `null` et la série n'est pas rendue.
- Les tableaux financiers sont conditionnels à `!isBeginnerMode` ET à la présence de données.
