# AssetWindMatrix.jsx

## Rôle
Widget "Vents Porteurs par Classe d'Actifs" : tableau statique phase → actifs affichant les classes d'actifs favorisées ou pénalisées selon la phase du cycle économique actuel, avec raisons dépliables au clic.

## Dépendances
- **Internes** : `./SourceTag`
- **Externes** : `react` (useState)

## Fonctionnement

### `PHASE_MATRIX`
Objet statique (pas d'API) mappant chaque phase à un tableau de 5 classes d'actifs avec `{ label, status: 'strong'|'weak'|'neutral', reason }`.

### `STATUS`
Mappings visuels des 3 statuts : couleur, fond, bordure, label (Favorable/Défavorable/Neutre), icône (↑/↓/→).

### `PHASE_CONTEXT`
Description textuelle courte du contexte macroéconomique de chaque phase, affichée en intro de la matrice.

### Composant principal
- Récupère `assets = PHASE_MATRIX[phase]` — retourne `[]` si la phase est inconnue.
- Chaque ligne est cliquable : `expandedAsset === label` déclenche l'affichage de la raison détaillée en panneau dépliable (accordéon).
- Panneau info général (`showInfo`) : explique la méthodologie et invite à cliquer sur les lignes.
- Légende en bas : 3 points colorés Favorable/Neutre/Défavorable.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
| Prop | Type | Description |
|---|---|---|
| `phase` | string | Phase actuelle (`'Expansion'`, `'Surchauffe'`, `'Contraction'`, `'Récession'`) |
| `loading` | boolean | Affiche "Chargement…" |

## Points d'attention
- Les données sont entièrement statiques (basées sur la recherche historique Fidelity/Dalio) — aucun appel API.
- Si `phase` ne correspond à aucune clé de `PHASE_MATRIX`, le composant affiche "Phase indéterminée".
- L'accordéon ne permet d'ouvrir qu'un seul item à la fois (`expandedAsset` est une string).
- `SourceTag` affiche "Boursicot · modèle de cycle" (pas une source externe).
