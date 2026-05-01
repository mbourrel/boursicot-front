# ProfileContext.jsx

## Rôle
Contexte React gérant le profil utilisateur (Explorateur / Stratège), sa persistance locale et sa synchronisation avec Clerk, ainsi que l'affichage du coach mark de confirmation.

## Dépendances
- **Externes** : `react` (createContext, useContext, useState, useEffect), `@clerk/clerk-react` (useUser)

## Fonctionnement

### Profils
- `'explorateur'` : vue simplifiée — métriques reines, ScoreDashboard, EconomicClock uniquement. Masque les tableaux financiers avancés.
- `'stratege'` : vue complète — tous les composants, tableaux FinancialStatement, MomentumDashboard, etc.
- `null` : aucun profil défini → `WelcomeModal` s'affiche pour inviter l'utilisateur à choisir.

### Persistance
Double persistance :
1. `localStorage` (`boursicot_profile`) — lecture immédiate au montage, écriture à chaque changement.
2. `user.unsafeMetadata.boursicot_profile` Clerk — sync asynchrone silencieuse. Permet de retrouver le profil sur un nouvel appareil après reconnexion.

### Priorité
`localStorage` fait foi. Si localStorage est vide et que Clerk a un profil → import depuis Clerk. En cas de conflit, localStorage gagne.

### Coach mark
`showCoachMark` est passé à `true` à chaque appel de `setProfile` — `Header.jsx` affiche un toast de confirmation pendant 5 secondes.

## Utilisé par
- `index.jsx` (provider)
- `Header.jsx` — toggle profil + coach mark
- `Fundamentals.jsx` — conditionne l'affichage des tableaux avancés
- `ScoreDashboard.jsx` — conditionne le CTA "Voir les métriques détaillées"
- `App.jsx` — `WelcomeModal` si `profile === null`

## Props / API
### `ProfileProvider`
| Prop | Type | Description |
|---|---|---|
| `children` | ReactNode | Arbre React enfant |

### `useProfile()` — valeurs exposées
| Clé | Type | Description |
|---|---|---|
| `profile` | `'explorateur'\|'stratege'\|null` | Profil actif |
| `setProfile` | function | Change le profil (persiste + coach mark) |
| `showCoachMark` | boolean | Coach mark visible |
| `setShowCoachMark` | function | Masque le coach mark |

## Points d'attention
- La sync Clerk est silencieuse (`catch(() => {})`) — localStorage reste la source de vérité.
- `useProfile()` lève une erreur si utilisé hors `ProfileProvider`.
- Ne pas confondre avec le `UserButton` Clerk (authentification) — `ProfileContext` gère uniquement la préférence d'affichage UX.
