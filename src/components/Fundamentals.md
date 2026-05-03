# Fundamentals.jsx

## Rôle
Vue principale d'analyse fondamentale. Gère deux modes : **Solo** (un actif sélectionné) et **Comparaison** (jusqu'à 5 actifs via `CompareBar`). Affiche les scores, métriques, états financiers, momentum et données de dividendes. S'affiche en **pleine largeur** sans contrainte `maxWidth` (App.jsx retire cette contrainte quand `viewMode === 'fundamentals'`).

## Dépendances
- **Contextes** : `CurrencyContext` (`targetCurrency, setTargetCurrency, updatedAt, rates`), `ProfileContext`
- **Hooks** : `useFundamentals`, `useSectorAverages`, `useSectorHistory`, `useBreakpoint`
- **Sous-composants** : `ScoreDashboard`, `MetricCard`, `MetricInfo`, `MetricHistoryModal`, `MomentumDashboard`, `FinancialStatement`, `MethodologyModal`, `RadarChart`, `ScoreCompareCard`, `FundamentalsSkeleton`
- **Utilitaires** : `formatFinancialValue`, `captureEvent`, `LOWER_IS_BETTER`, `NEUTRAL_METRICS`, `METRIQUES_REINES`
- **Externes** : `react (useState, useMemo, memo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `selectedSymbol` | `string` | Ticker principal |
| `compareSymbols` | `string[]` | Tickers en comparaison (défaut `[]`) |

## Fonctionnement

### Barre devise (currencyBar)
`div` avec le toggle LOCAL/EUR/USD aligné à droite (`justifyContent: 'flex-end'`). Défini comme constante JSX **avant** les branches `isSolo`, injecté comme premier enfant dans chaque branche de retour (Explorateur solo, Stratège solo, Comparaison). L'indicateur de date de taux s'affiche uniquement si `updatedAt && targetCurrency !== 'LOCAL'`.

### Mode Solo — Explorateur
Vue simplifiée : currencyBar + ScoreDashboard + 5 métriques clés + MomentumDashboard. États financiers masqués.

### Mode Solo — Stratège
Vue complète : currencyBar + description entreprise (tronquée 3 lignes mobile, toggle "Voir plus") + ScoreDashboard + toutes les catégories de métriques (6) + FinancialStatement (3 tableaux) + MomentumDashboard.

### Mode Comparaison
currencyBar + RadarChart 6 axes (masqué mobile < 768px) + CompareTable multi-colonnes triable avec coloration meilleur/pire + ScoreCompareCard par actif.

### CompareTable
Composant défini au niveau module (non inline) pour pouvoir avoir ses propres hooks (`useState` pour l'ombre scroll sticky). Première colonne `position: sticky; left: 0`.

### Conversion devise
`fmt(val, unit)` → `formatFinancialValue(val, unit, sourceCurrency, targetCurrency, rates)`. `sourceCurrency` = `company.currency` (EUR pour CAC 40, USD pour Mag7).

### getAssetType
Priorité : `company.asset_class` (API). Fallback : pattern ticker (`-USD` → crypto, `^` → index, `=F` → commodity, sinon stock).

## Points d'attention
- `useSectorHistory` reçoit `null` si profil Explorateur — requête coûteuse évitée.
- `currencyBar` est défini avant le `if (isSolo)` pour être partagé sans duplication dans toutes les branches.
- Vue **pleine largeur** depuis 2026-05-03 : App.jsx utilise `{ width: '100%' }` au lieu de `{ maxWidth: '1600px', margin: '0 auto' }` pour cette vue.
- `fmt` et `fmtRaw` sont deux helpers distincts : `fmt` convertit et retourne du JSX, `fmtRaw` retourne une string formatée sans conversion devise.
- `Fundamentals.jsx` dépasse 700 lignes — dette technique identifiée, refactoring en `SoloView`/`ComparisonView` planifié.
