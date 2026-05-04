# components/ErrorBoundary.jsx

## Rôle
Capture les erreurs React non gérées dans l'arbre de composants enfants et affiche un fallback UI à la place d'un crash total de l'application.

## Fonctionnement
Composant classe React avec `componentDidCatch` et `getDerivedStateFromError`. En cas d'erreur, affiche un message d'erreur générique sans exposer les détails techniques à l'utilisateur.

## Utilisé par
- `App.jsx` — wrappé autour des routes principales pour protéger l'ensemble de l'UI.

## Points d'attention
- N'intercepte pas les erreurs dans les gestionnaires d'événements (onClick, etc.) — seulement les erreurs de rendu.
- Loguer l'erreur dans PostHog ou la console en production pour le monitoring.
