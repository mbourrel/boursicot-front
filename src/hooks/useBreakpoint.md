# useBreakpoint.js

## Rôle
Hook React retournant le breakpoint courant basé sur la largeur de fenêtre, avec listener resize passif.

## Dépendances
- **Externes** : `react` (useState, useEffect)

## Fonctionnement
- Initialise `width` à `window.innerWidth` (ou `1280` en SSR).
- Écoute `resize` avec `{ passive: true }` pour mettre à jour `width`.
- Cleanup : supprime le listener au démontage.

## Utilisé par
Utilisé dans tous les composants qui adaptent leur layout selon le breakpoint :
- `App.jsx`, `Header.jsx`, `Fundamentals.jsx`, `ScoreDashboard.jsx`, `MomentumDashboard.jsx`, `MetricCard.jsx`, `SimpleChart.jsx`, `WelcomeModal.jsx`

## Props / API
Aucun paramètre.

**Retour** :
| Clé | Type | Description |
|---|---|---|
| `width` | number | Largeur courante en px |
| `isMobile` | boolean | `width < 768` |
| `isTablet` | boolean | `768 <= width < 1024` |
| `isDesktop` | boolean | `width >= 1024` |

## Points d'attention
- Les breakpoints (`768`, `1024`) sont des constantes figées dans le hook — si on les change, tous les composants consommateurs sont affectés.
- Ne pas utiliser dans des composants très nombreux et très fréquemment rerenderés — le resize listener se déclenche à chaque px de redimensionnement. Pour les composants lourds, préférer `CSS media queries` quand possible.
