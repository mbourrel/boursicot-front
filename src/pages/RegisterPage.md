# pages/RegisterPage.jsx

## Rôle
Page d'inscription Clerk à la route `/register/*`. Affiche uniquement le composant `<SignUp>` de Clerk.

## Dépendances
- **Externes** : `@clerk/clerk-react (SignUp)`

## Fonctionnement
`<SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/" />` — délègue entièrement le formulaire à Clerk. Redirige vers `/` après inscription réussie.

## Points d'attention
- La détection d'un nouveau compte (pour l'événement PostHog `signup_completed`) est faite dans `App.jsx` en comparant `user.createdAt` à `Date.now()` — pas dans ce composant.
