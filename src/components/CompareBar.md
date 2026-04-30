# CompareBar.jsx

## Rôle
Barre de comparaison multi-actifs : affiche les chips des actifs sélectionnés (primaire + jusqu'à 4 actifs en comparaison) et permet d'ajouter ou supprimer des actifs de comparaison via un dropdown de recherche.

## Dépendances
- **Internes** : `../utils/analytics` (captureEvent)
- **Externes** : `react` (useState, useRef, useEffect)

## Fonctionnement

### `ASSET_COLORS` (export nommé)
Tableau de 5 couleurs utilisé pour identifier les actifs de façon cohérente dans tous les composants de l'app (`#2962FF`, `#26a69a`, `#e91e63`, `#ff9800`, `#9c27b0`). Le premier est toujours le primaire (bleu).

### `CompareBar`
- `allSelected = [primarySymbol, ...compareSymbols]` — liste complète pour exclure les déjà-sélectionnés du dropdown.
- `canAdd = allSelected.length < 5` — limite à 5 actifs total.
- **Dropdown de recherche** : filtré sur `allAssets` (exclusion des déjà-sélectionnés + recherche textuelle), limité à 12 résultats. Fermeture au clic en dehors via `mousedown`.
- `handleAdd` : vérifie les doublons et la limite, envoie `compare_add` à PostHog.
- `handleRemove` : retire le ticker, envoie `compare_remove` à PostHog.

### `Chip`
Composant interne : badge coloré arrondi avec point de couleur, label et bouton de suppression (sauf pour le primaire). Le primaire affiche `"primaire"` en petit.

## Utilisé par
`App.jsx` (Dashboard, affiché dans toutes les vues sauf `macro`)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `primarySymbol` | string | Ticker principal (non supprimable) |
| `compareSymbols` | string[] | Tickers en comparaison |
| `setCompareSymbols` | function | Setter de l'état de comparaison |
| `allAssets` | array | Liste complète `{ ticker, name }` pour la recherche |

### Export nommé
```js
export const ASSET_COLORS = ['#2962FF', '#26a69a', '#e91e63', '#ff9800', '#9c27b0'];
```

## Points d'attention
- `ASSET_COLORS` est importé dans `Fundamentals.jsx`, `SimpleChart.jsx` et tout composant qui colore des actifs — ne pas modifier l'ordre sans mettre à jour tous les importeurs.
- Le dropdown affiche au maximum 12 résultats pour des raisons de performance.
- Le primaire change quand l'utilisateur sélectionne un nouveau symbole depuis le Header, ce qui réinitialise `compareSymbols` à `[]` (géré dans `App.jsx`).
