# components/ProtectedRoute.jsx

## Rôle
Guard d'authentification Clerk. Redirige vers `/sign-in` si l'utilisateur n'est pas authentifié, laisse passer sinon.

## Fonctionnement
Utilise `useAuth()` de Clerk React pour vérifier l'état d'authentification. Pendant le chargement Clerk, affiche un écran de chargement pour éviter un flash non authentifié.

## Utilisé par
- `App.jsx` — wrappé autour du Dashboard et des vues protégées.

## Points d'attention
- Le backend implémente un guest fallback (JWT absent → user anonyme) — la protection est donc côté frontend uniquement. Un utilisateur technique peut appeler les endpoints API sans authentification.
- Cohérent avec la stratégie Clerk : Boursicot est en accès libre au-delà du guest, l'authentification déverrouille les fonctionnalités avancées.
