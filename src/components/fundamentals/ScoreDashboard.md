# ScoreDashboard.jsx

## Rôle
Dashboard de scores Boursicot en layout "Orbit" : 6 jauges circulaires SVG (3 piliers financiers + 3 piliers stratégiques), une Master Gauge centrale (note globale), verdict, complexité, modales détaillées au clic.

## Dépendances
- **Internes** : `./MethodologyModal`, `../../constants/pillars` (PILLARS), `../../hooks/useBreakpoint`
- **Externes** : `react` (useState, createPortal)

## Fonctionnement

### `CircularGauge`
Jauge SVG circulaire animée (strokeDasharray progressif). Cliquable si `onPillarClick` fourni. Couleur : ≥ 7 vert, ≥ 4 ambre, < 4 rouge.

### `MasterGauge`
Version plus grande, non cliquable, utilisée pour la note globale centrale.

### `GlobalScoreModal`
Portal sur `document.body`. Décomposition pondérée des 6 piliers avec barres de progression et contributions numériques.

### `GaugePillarModal`
Portal sur `document.body`. Titre, score, et liste des indicateurs du pilier (depuis `PILLARS`).

### Layout (composant principal)

**Desktop** : 4 colonnes CSS Grid — piliers financiers | Master Gauge | piliers stratégiques | légende.

**Mobile** : `SwipeableContainer` avec 3 slides — colonne gauche / Master Gauge + piliers droite / légende + bouton méthodologie.

- **Note globale** : utilise `scores.global_score` si disponible, sinon recalcule avec `WEIGHTS`.
- **Complexité** : badge Simple/Modéré/Avancé depuis `scores.complexity`.
- **Micro-explication** : message contextuel bêta > 1.5 (volatilité élevée) ou cap < 2 Md$ (petite cap).
- **Bouton "Voir les métriques détaillées"** : visible en mode Explorateur uniquement.
- **Contexte sectoriel** : avertissement si `companyCount < 3`.

### Pondérations `WEIGHTS`
`{ health: 0.25, valuation: 0.20, growth: 0.20, efficiency: 0.15, dividend: 0.10, momentum: 0.10 }` — miroir du backend.

## Utilisé par
`Fundamentals.jsx` (vue solo uniquement)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `scores` | object | `{ health, valuation, growth, dividend, momentum, efficiency, global_score, complexity, verdict }` |
| `sector` | string | Nom du secteur |
| `companyCount` | number | Nb d'entreprises dans le secteur |
| `beta` | number | Bêta de l'action |
| `marketCap` | number | Capitalisation en $ |
| `onShowAdvanced` | function | Callback : bascule en mode avancé + scroll |

## Points d'attention
- Retourne `null` si `scores` est null/undefined.
- Scores manquants → fallback `5.0` (valeur neutre).
- Modales via `createPortal` pour échapper au stacking context.
- `PILLARS` dans `../../constants/pillars` — ajouter un pilier = modifier ce fichier ET le backend.
- Disclaimer "Scores indicatifs uniquement" en pleine largeur sous la grille, toujours visible.
- Mobile : layout 3 slides carousel via `SwipeableContainer` + `useBreakpoint`.
