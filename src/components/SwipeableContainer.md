# SwipeableContainer.jsx

## Rôle
Conteneur carousel scroll-snap mobile avec pagination par points. Sur desktop, affiche les enfants en flex-row sans scroll.

## Dépendances
- **Internes** : `../hooks/useBreakpoint`
- **Externes** : `react` (useState, useRef)

## Fonctionnement

### Desktop
`display: flex; flex-direction: row` — les enfants s'affichent côte-à-côte sans aucun mécanisme de scroll.

### Mobile
- Wrapper horizontal avec `overflow-x: auto`, `scrollSnapType: 'x mandatory'`, `overscrollBehaviorX: 'contain'`, scrollbar masquée (classe `carousel-track`).
- Chaque enfant reçoit automatiquement `scrollSnapAlign: 'start'` via un wrapper interne `slide`.
- Pagination : points en bas, le point actif est calculé via `IntersectionObserver` sur chaque slide (threshold 0.5).
- Pas de boutons de navigation — navigation par swipe uniquement.

## Utilisé par
- `ScoreDashboard.jsx` — 3 slides : piliers gauche / Master Gauge / piliers droite + légende
- (Peut être réutilisé dans tout composant nécessitant un carousel mobile)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `children` | ReactNode[] | Slides du carousel (chaque enfant = 1 slide) |
| `gap` | number | Espacement entre slides en px (défaut `12`) |
| `slideWidth` | string | Largeur d'une slide CSS (défaut `'85vw'`) |

## Points d'attention
- Sur mobile, chaque slide est wrappée dans un div avec `flex: 0 0 {slideWidth}` et `scrollSnapAlign: 'start'`.
- Pour permettre au dernier slide d'atteindre sa position snap, un spacer `calc(100% - slideWidth - gap)` est ajouté en fin de track — cette formule doit être cohérente avec `slideWidth`.
- `overscrollBehaviorX: 'contain'` isole le scroll horizontal du carousel du scroll vertical de la page.
- Le composant ne gère pas le cas où les slides ont des hauteurs différentes — prévoir un `minHeight` si nécessaire.
