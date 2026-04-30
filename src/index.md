# index.jsx

## Rôle
Point d'entrée React de l'application : monte le composant `App` dans le DOM et initialise les providers globaux et les outils transversaux.

## Dépendances
- **Internes** : `./App`, `./context/ThemeContext` (ThemeProvider), `./context/CurrencyContext` (CurrencyProvider), `./utils/analytics` (initAnalytics), `./reportWebVitals`
- **Externes** : `react`, `react-dom/client`, `@clerk/clerk-react` (ClerkProvider), `react-router-dom` (BrowserRouter), `./index.css`

## Fonctionnement
1. Appelle `initAnalytics()` en dehors du rendu — une seule fois au démarrage — pour configurer PostHog sans bloquer le rendu.
2. Monte l'arbre de providers dans cet ordre strict :
   - `ClerkProvider` (auth, token) — clé lue depuis `VITE_CLERK_PUBLISHABLE_KEY`
   - `BrowserRouter` (routing)
   - `ThemeProvider` (dark/light + variables CSS)
   - `CurrencyProvider` (devise locale/EUR/USD + taux de change)
   - `App` (logique applicative)
3. Lance `reportWebVitals()` pour mesurer les performances Core Web Vitals.

## Utilisé par
Fichier racine, importé par Vite comme entry point (`index.html` → `index.jsx`).

## Props / API
Aucune export. Fichier d'initialisation pur.

## Points d'attention
- L'ordre des providers est important : Clerk doit envelopper tout le reste pour que `useAuth` soit disponible dans `App`.
- `initAnalytics()` est silencieux si `VITE_POSTHOG_KEY` est absent (dev sans `.env.local`).
- `afterSignOutUrl="/login"` garantit la redirection correcte après déconnexion Clerk.
