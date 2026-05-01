# index.jsx

## Rôle
Point d'entrée React : monte `App` dans le DOM et initialise tous les providers globaux et outils transversaux.

## Dépendances
- **Internes** : `./App`, `./context/ThemeContext` (ThemeProvider), `./context/CurrencyContext` (CurrencyProvider), `./context/ProfileContext` (ProfileProvider), `./context/PWAContext` (PWAProvider), `./utils/analytics` (initAnalytics), `./reportWebVitals`
- **Externes** : `react`, `react-dom/client`, `@clerk/clerk-react` (ClerkProvider), `react-router-dom` (BrowserRouter), `./index.css`

## Fonctionnement
1. Appelle `initAnalytics()` avant le premier render — une seule fois, sans bloquer le rendu.
2. Monte l'arbre de providers dans cet ordre strict :
   - `ClerkProvider` (auth + token Clerk) — clé `VITE_CLERK_PUBLISHABLE_KEY`
   - `BrowserRouter` (routing React Router)
   - `ThemeProvider` (dark/light + variables CSS)
   - `CurrencyProvider` (devise LOCAL/EUR/USD + taux de change)
   - `ProfileProvider` (profil Explorateur/Stratège + coach mark)
   - `PWAProvider` (capture du `beforeinstallprompt` + état d'installation)
   - `App`
3. Lance `reportWebVitals()` (Core Web Vitals).

## Utilisé par
Entry point Vite — référencé dans `index.html` via `<script type="module" src="/src/index.jsx">`.

## Points d'attention
- L'ordre des providers est important : `ClerkProvider` doit envelopper tout le reste pour que `useAuth` soit disponible partout.
- `initAnalytics()` est silencieux si `VITE_POSTHOG_KEY` est absent.
- `afterSignOutUrl="/login"` redirige correctement après déconnexion Clerk.
- `PWAProvider` capture `beforeinstallprompt` via `PWAContext` — mais l'événement est aussi capturé très tôt dans `index.html` (script inline) pour éviter un timing miss avant le montage React.
