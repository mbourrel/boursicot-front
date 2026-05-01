# Fundamentals.jsx

## Rôle
Affiche l'analyse fondamentale d'un ou plusieurs actifs : en mode solo, une fiche complète avec scores, métriques par catégorie et tableaux financiers historiques ; en mode comparaison, des tableaux côte-à-côte avec radar chart SVG.

## Dépendances
- **Internes** : `./CompareBar` (ASSET_COLORS), `../context/CurrencyContext` (useCurrency), `../utils/formatFinancialValue`, `./SourceTag`, `./fundamentals/MetricInfo`, `./fundamentals/MetricCard`, `./fundamentals/FinancialStatement`, `./fundamentals/ScoreDashboard`, `./fundamentals/MethodologyModal`, `../hooks/useFundamentals`, `../hooks/useSectorAverages`, `../hooks/useSectorHistory`, `../hooks/useBreakpoint`, `./SwipeableContainer`
- **Externes** : `react` (useState)

## Fonctionnement

### Mode Solo (`isSolo === true`)
- Charge les données via `useFundamentals([selectedSymbol])`.
- Charge les moyennes sectorielles (`useSectorAverages`) et l'historique sectoriel (`useSectorHistory`).
- Affiche : en-tête (nom, badge verdict, badge complexité, description avec truncature mobile "Voir plus/Voir moins", fiche d'identité), puis `ScoreDashboard`, puis métriques par catégorie.
- **Mobile** : description tronquée à 3 lignes (`-webkit-line-clamp: 3`) avec toggle. Grille identité → colonne. Métriques en carousel scroll-snap (cartes 44% + spacer `calc(56% - 10px)`). Catégories en colonne unique.
- **Desktop** : grille 3 colonnes, layout habituel.
- Mode avancé (`profil === 'stratege'`) : 3 `FinancialStatement` (compte de résultat, bilan, flux) + dividendes si disponibles.

### Mode Comparaison (`isSolo === false`)
- Charge les données de tous les symboles en parallèle.
- Affiche scores avec barres de progression et radar chart SVG 6 axes.
- Tableaux via `CompareTable` (composant module-level) : métriques avec coloration meilleur/pire, états financiers avec sous-ligne YoY.
- **Mobile** : scores au-dessus du radar, radar pleine largeur, `CompareTable` avec colonne gauche sticky + scroll horizontal isolé.

### `CompareTable`
Composant React au niveau module (non inline) pour pouvoir utiliser `useState` (état `scrolled` pour l'ombre sur la colonne sticky). Reçoit `allSymbols`, `dataMap`, `colWidth`, `isMobile` en props. La première colonne est `position: sticky; left: 0` avec ombre conditionnelle au scroll.

### Constantes
- `LOWER_IS_BETTER` : métriques où une valeur basse est positive (PER, EV/EBITDA…).
- `NEUTRAL_METRICS` : métriques sans signal directionnel (Bêta, Capitalisation…).

## Utilisé par
`App.jsx` (Dashboard, vue `fundamentals`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `selectedSymbol` | string | Ticker principal |
| `compareSymbols` | string[] | Tickers en comparaison (défaut `[]`) |

## Points d'attention
- `fmt` est réassigné dans le corps du composant selon la devise — ne pas capturer avant réassignation.
- `fmtRaw` reste sans conversion (moyennes sectorielles en devise mixte).
- Le radar chart est un SVG pur sans librairie — scores manquants → série non rendue.
- `CompareTable` doit rester au niveau module (pas inline) pour pouvoir avoir ses propres hooks.
- `overscrollBehaviorX: 'contain'` sur les wrappers de tableaux pour isoler le scroll horizontal.
- Spacer carousel = `calc(56% - 10px)` : formule mathématique fixe indépendante du nombre de cartes (100% − card 44% − gap 10px).
