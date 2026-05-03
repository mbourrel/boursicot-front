# WelcomeModal.jsx

## Rôle
Modal d'accueil affiché au premier lancement (tant que `profile === null` dans `ProfileContext`). Permet à l'utilisateur de choisir son profil Explorateur ou Stratège. Déclenche une **navigation différenciée** selon le choix.

## Dépendances
- **Contextes** : `ProfileContext`
- **Hooks** : `useBreakpoint`
- **Externes** : `react (useEffect)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `onProfileSelected` | `function` | Callback appelé avec `'screener'` (Explorateur) ou `'chart'` (Stratège) — permet à `Dashboard` de naviguer vers la bonne vue. Défaut `() => {}` |

## Fonctionnement

### handleSelect(p)
1. `setProfile(p)` — persiste le profil dans `ProfileContext` (localStorage + Clerk unsafeMetadata)
2. `onProfileSelected(p === 'stratege' ? 'chart' : 'screener')` — change `viewMode` dans `Dashboard`

Appelé par :
- Clic sur la carte **Explorateur** → Screener
- Clic sur la carte **Stratège** → Graphique
- Clic sur le backdrop → Explorateur par défaut
- Touche Escape → Explorateur par défaut

### ProfileCard
Composant bouton interne avec hover effect (border colorée + `translateY(-2px)`). Affiche icône, titre, sous-titre et liste de fonctionnalités.

### Affichage conditionnel (dans App.jsx/Dashboard)
```jsx
{profile === null && <WelcomeModal onProfileSelected={setViewMode} />}
```
Disparaît automatiquement quand `setProfile` met à jour le contexte (`profile` passe de `null` à une valeur).

## Points d'attention
- `position: fixed, inset: 0, zIndex: 1000` — bloque toute interaction sous-jacente jusqu'au choix.
- Le `useEffect` ESC a `[]` comme dépendances (`handleSelect` est stable) — le `// eslint-disable-line` est intentionnel.
- `onProfileSelected` est optionnel (défaut `() => {}`), mais en pratique toujours fourni par `Dashboard` via `setViewMode`.
- Avant 2026-05-03, le modal n'avait pas de callback de navigation — il se contentait d'appeler `setProfile`. Le callback `onProfileSelected` a été ajouté pour l'onboarding différencié.
