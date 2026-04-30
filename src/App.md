# App.jsx

## Rôle
Composant racine de l'application : gère le routing, l'enregistrement du token Clerk, l'identification PostHog, et orchestre le dashboard principal.

## Dépendances
- **Internes** : `./api/config` (registerTokenGetter), `./utils/analytics` (identifyUser, captureEvent), `./components/ProtectedRoute`, `./pages/LoginPage`, `./pages/RegisterPage`, `./components/Header`, `./components/CompareBar`, `./components/TradingChart`, `./components/SimpleChart`, `./components/Fundamentals`, `./components/MacroEnvironment`, `./components/ErrorBoundary`, `./hooks/useAssets`, `./components/ConsentBanner`
- **Externes** : `react` (useState, useEffect), `react-router-dom` (Routes, Route), `@clerk/clerk-react` (useAuth, useUser)

## Fonctionnement

### `App` (composant racine)
- Récupère `getToken` via `useAuth()` et l'enregistre dans `api/config` via `registerTokenGetter` dès que Clerk est prêt.
- Identifie l'utilisateur dans PostHog à la connexion ; si le compte a moins de 5 minutes, envoie un événement `signup_completed`.
- Rend la `ConsentBanner` (RGPD) puis les routes : `/login/*`, `/register/*` et `/*` (protégée par `ProtectedRoute`).

### `Dashboard` (contenu protégé)
- État local : `selectedSymbol` (défaut `AI.PA`), `compareSymbols`, `viewMode` (`chart` | `fundamentals` | `macro`), `chartMode` (`simple` | `trading`), `isBeginnerMode`.
- Charge la liste des actifs via `useAssets()` pour alimenter `Header` et `CompareBar`.
- Zone sticky en haut : bannière bêta + `Header`.
- Zone scrollable : affiche conditionnellement `CompareBar`, puis selon `viewMode` : `MacroEnvironment`, `SimpleChart`/`TradingChart`, ou `Fundamentals`. Chaque bloc est enveloppé dans un `ErrorBoundary`.

## Utilisé par
Point d'entrée monté dans `index.jsx`.

## Props / API
Aucune prop externe. Exporte `App` en default.

## Points d'attention
- `handleSelectSymbol` réinitialise `compareSymbols` à chaque changement de ticker principal.
- `CompareBar` est masqué en vue `macro` (pas de comparaison sur la macro).
- Le toggle Simple/Trading n'est visible qu'en vue `chart`.
