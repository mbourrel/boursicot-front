# fundamentals/ValuationMethodCard.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Composant accordéon réutilisable pour chaque méthode de valorisation dans `ValuationLab`. Gère le Progressive Disclosure (collapsed/expanded), l'affichage du verdict dans le header, et le bouton Reset.

## Props
| Prop | Type | Description |
|------|------|-------------|
| `categoryLabel` | `string` | Label de la catégorie (ex: "Intrinsèque") |
| `categoryColor` | `string` | Couleur CSS de la catégorie |
| `title` | `string` | Nom de la méthode |
| `verdict` | `{ diff, theoreticalPrice, currency }` \| `null` | Résultat pour le badge % header |
| `unavailable` | `string` \| `null` | Raison de non-disponibilité (désactive le contenu) |
| `isOpen` | `bool` | État contrôlé depuis le parent |
| `onToggle` | `function` | Callback toggle (géré par ValuationLab) |
| `isDirty` | `bool` | Affiche le bouton Reset si true |
| `onReset` | `function` | Callback reset des sliders |
| `formulaNode` | `ReactNode` | JSX de la formule mathématique |
| `usageText` | `string` | Texte pédagogique sur l'usage de la méthode |
| `warningText` | `string` | Avertissement affiché en orange |
| `children` | `ReactNode` | Sliders + inputs de la méthode |

## Comportement
- **Header** (toujours visible) : category badge · titre · badge % verdict · chevron
- **Expanded** : formulaNode + usageText + warningText + children + PriceResult + Reset
- Si `unavailable` : seul le message d'erreur est affiché en lieu des sliders
- Le `PriceResult` est rendu dans la carte (pas dans ValuationLab) à partir du `verdict`

## Utilisé par
`ValuationLab.jsx` — 5 instances (DCF, DDM, EV/EBITDA, P/E, ANCC)
