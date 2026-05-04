# fundamentals/SoloView.jsx

**Dernière mise à jour :** 2026-05-04 (ValuationPrism → ValuationLab)

## Rôle
Rendu de la vue analyse fondamentale pour un actif unique. Gère les deux profils utilisateur en un seul composant : **Explorateur** (vue simplifiée avec métriques clés et CTA Stratège) et **Stratège** (vue complète avec métriques avancées, tableaux financiers et dividendes).

## Dépendances
- **Contextes** : `ProfileContext` (`profile, setProfile`), `CurrencyContext` (`targetCurrency, rates`)
- **Hooks** : `useBreakpoint`
- **Sous-composants** : `CurrencyBar`, `MetricCard`, `FinancialStatement`, `ScoreDashboard`, `MomentumDashboard`, `ValuationLab`, `SourceTag`
- **Constantes** : `METRIQUES_REINES`
- **Utilitaires** : `formatFinancialValue`, `captureEvent`
- **Externes** : `react (useState)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `selectedSymbol` | `string` | Ticker affiché (utilisé pour `getAssetType` et les guards d'erreur) |
| `data` | `object` | Données fondamentales de la company (`dataMap[selectedSymbol]`) |
| `error` | `any` | Erreur de fetch pour ce ticker (`errors[selectedSymbol]`) |
| `sectorAvg` | `object` | Moyennes sectorielles pour les benchmarks MetricCard |
| `sectorHistory` | `object` | Historique sectoriel pour FinancialStatement (null en mode Explorateur) |

## Fonctionnement

### Guards d'entrée
Affiche un message d'erreur si `error` est défini, ou "Aucune donnée disponible" si `data` est null.

### `fmt` / `fmtRaw`
- `fmt(val, unit)` : convertit et retourne du JSX (`—` stylé si absent)
- `fmtRaw(val, unit)` : retourne une string formatée (utilisé par MetricCard pour les tooltips)
- `sourceCurrency` = `data.currency` (EUR pour CAC 40, USD pour Mag7)

### `getAssetType`
Priorité : `data.asset_class` (API). Fallback pattern ticker : `-USD` → crypto, `^` → index, `=F` → commodity, sinon stock.

### `renderCategory(title, dataArray, catKey, sectionId)`
Grille de MetricCard pour une catégorie de métriques. Sur mobile : carousel horizontal avec snap. Filtre les métriques sans valeur (`null / undefined / 0`).

### `renderFlatMetrics(categories)`
Grille plate multi-catégories sans titres séparateurs — utilisée pour les non-stocks (crypto, indices, commodités) où les sections n'ont pas de sens.

### Vue Explorateur
`CurrencyBar` + en-tête (nom, verdict, secteur, description) + `ScoreDashboard` (isBeginnerMode) ou `MomentumDashboard` (non-stock) + 5 métriques reines + CTA "Passer en mode Stratège".

### Vue Stratège
`CurrencyBar` + en-tête complet (description + fiche d'identité en grid 2 colonnes) + `ScoreDashboard` ou `MomentumDashboard` + **`ValuationLab`** (stocks uniquement, entre le dashboard et les métriques) + 6 catégories de métriques en grid 3 colonnes + 3 `FinancialStatement` (compte de résultat, bilan, trésorerie) + dividendes si disponibles.

## Utilisé par
`Fundamentals.jsx` — branche `isSoloMode === true`

## Points d'attention
- `isDescExpanded` gère le troncage de la description sur mobile (3 lignes max, toggle "Voir plus/moins").
- La fiche d'identité (prix actuel, industrie, siège…) est construite dynamiquement via `identityItems.filter(Boolean)` — les champs absents sont simplement omis.
- Le tableau des dividendes n'est rendu que si `dd.annual?.items?.length > 0`.
- Les sections 7/8/9 (FinancialStatement) sont exclusives au mode Stratège et uniquement pour les stocks.
- `sectorHistory` est `null` en mode Explorateur (passé depuis `Fundamentals.jsx`) — `FinancialStatement` doit gérer gracieusement ce cas.
