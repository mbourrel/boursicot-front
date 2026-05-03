# pages/LoginPage.jsx

## Rôle
Page de connexion Clerk à la route `/login/*`. Affiche le composant `<SignIn>` de Clerk et un bouton "Continuer sans compte" pour les sessions invitées.

## Dépendances
- **Externes** : `@clerk/clerk-react (SignIn)`, `react-router-dom (useNavigate)`, `../utils/analytics (captureEvent)`

## Fonctionnement
- `<SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl="/" />` — délègue entièrement le formulaire à Clerk.
- Bouton "Continuer sans compte →" : stocke un timestamp dans `sessionStorage` (`guestSession`) + redirige vers `/`. Le backend accepte les requêtes sans token JWT (guest fallback dans `dependencies.py`).

## Points d'attention
- `guestSession` est stocké dans `sessionStorage` (durée de session uniquement, pas `localStorage`).
- Événement PostHog `guest_mode_clicked` envoyé au clic.
