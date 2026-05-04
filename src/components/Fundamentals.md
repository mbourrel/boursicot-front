# Fundamentals.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Orchestrateur de l'analyse fondamentale. Charge les données, calcule les dépendances sectorielles, puis délègue le rendu à `SoloView` (actif unique) ou `ComparisonView` (multi-actifs). Depuis le refactoring du 2026-05-04, ce fichier ne contient plus aucun JSX de rendu direct (935 lignes → 38 lignes).

## Dépendances
- **Internes** : `../context/ProfileContext`, `../hooks/useFundamentals`, `../hooks/useSectorAverages`, `../hooks/useSectorHistory`, `./fundamentals/FundamentalsSkeleton`, `./fundamentals/SoloView`, `./fundamentals/ComparisonView`
- **Externes** : aucune

## Fonctionnement
1. Construit `allSymbols = [selectedSymbol, ...compareSymbols]`.
2. Appelle `useFundamentals(allSymbols)` → `{ dataMap, loading, errors }`.
3. Détermine `isSoloMode` (`allSymbols.length === 1`).
4. Appelle `useSectorAverages(primarySector)` et `useSectorHistory` (ce dernier uniquement si profil Stratège, coûteux).
5. Si `loading` → `<FundamentalsSkeleton />`.
6. Si solo → `<SoloView data={dataMap[selectedSymbol]} error={errors[selectedSymbol]} sectorAvg sectorHistory />`.
7. Sinon → `<ComparisonView allSymbols dataMap />`.

## Utilisé par
`App.jsx` — vue `'fundamentals'`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `selectedSymbol` | `string` | Ticker principal |
| `compareSymbols` | `string[]` | Tickers supplémentaires (défaut `[]`) |

## Points d'attention
- `useSectorHistory` reçoit `null` si profil Explorateur — évite un appel API superflu.
- La logique de rendu (métriques, tableaux financiers, comparaison) est désormais dans `SoloView.jsx` et `ComparisonView.jsx`.
- Vue **pleine largeur** : App.jsx utilise `{ width: '90%', margin: '0 auto' }` pour `viewMode === 'fundamentals'`.
