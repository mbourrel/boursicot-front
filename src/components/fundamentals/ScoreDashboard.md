# ScoreDashboard.jsx

## Rôle
Dashboard de scores Boursicot en layout "Orbit" : 6 jauges circulaires SVG (3 piliers financiers + 3 piliers stratégiques), une Master Gauge centrale (note globale), verdict et complexité, avec modales détaillées au clic.

## Dépendances
- **Internes** : `./MethodologyModal`, `../../constants/pillars` (PILLARS)
- **Externes** : `react` (useState, createPortal)

## Fonctionnement

### `CircularGauge`
Jauge SVG circulaire animée (strokeDasharray progressif). Cliquable si `onPillarClick` est fourni. Couleur dépend du score : ≥ 7 vert, ≥ 4 ambre, < 4 rouge.

### `MasterGauge`
Version plus grande de `CircularGauge`, non cliquable, utilisée pour la note globale au centre.

### `GlobalScoreModal`
Modale portée via `createPortal` (monté sur `document.body`). Affiche la décomposition pondérée des 6 piliers avec barres de progression et contributions numériques. Fermeture par clic en dehors.

### `GaugePillarModal`
Modale portée via `createPortal`. Affiche le titre du pilier, le score, et la liste des indicateurs pris en compte (depuis `PILLARS` constants). Fermeture par clic en dehors.

### Layout (composant principal)
- 4 colonnes en CSS Grid : piliers financiers gauche | Master Gauge centrale | piliers stratégiques droite | légende + bouton méthodologie.
- **Note globale** : utilise `scores.global_score` si disponible (calculé par le backend), sinon recalcule côté frontend avec `WEIGHTS`.
- **Complexité** : badge Simple/Modéré/Avancé basé sur `scores.complexity`.
- **Micro-explication** : message contextuel basé sur le bêta (`> 1.5` → volatilité élevée) ou la capitalisation (`< 2 Md$` → petite cap).
- **Bouton "Voir les métriques détaillées"** : visible en mode débutant (`isBeginnerMode`) uniquement — appelle `onShowAdvanced` pour basculer en mode avancé et scroller vers la section métriques.
- **Contexte sectoriel** : avertissement si `companyCount < 3` (échantillon faible).

### Pondérations `WEIGHTS`
`{ health: 0.25, valuation: 0.20, growth: 0.20, efficiency: 0.15, dividend: 0.10, momentum: 0.10 }` — miroir exact du backend.

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
| `isBeginnerMode` | boolean | Affiche/masque le bouton CTA |
| `onShowAdvanced` | function | Callback : bascule en mode avancé + scroll |

## Points d'attention
- Retourne `null` si `scores` est null/undefined.
- Les scores manquants ont un fallback à `5.0` (valeur neutre) pour éviter les jauges à zéro avant le re-seed des données.
- Les modales utilisent `createPortal` pour échapper au stacking context du composant parent.
- `PILLARS` est défini dans `../../constants/pillars` — contient le titre, l'icône, la couleur et la liste des métriques de chaque pilier.
- **Disclaimer MIF2 (2026-04-30)** : une ligne "Scores indicatifs uniquement — ne constituent pas un conseil en investissement." est affichée en pleine largeur (`gridColumn: 1 / -1`) sous la grille de scores, toujours visible sans clic.
- Les verdicts affichés (Profil Fort/Fragile…) sont mappés côté frontend dans les couleurs `COLOR_UP`/`COLOR_DOWN` — synchronisés avec les valeurs retournées par `scoring_logic.py`.
