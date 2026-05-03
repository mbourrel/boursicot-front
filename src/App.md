# App.jsx

## Rôle
Composant racine : gère le routing, l'enregistrement du token Clerk, l'identification PostHog, et orchestre le dashboard principal.

## Dépendances
- **Internes** : `./api/config (registerTokenGetter)`, `./utils/analytics (identifyUser, captureEvent)`, `./components/ProtectedRoute`, `./pages/LoginPage`, `./pages/RegisterPage`, `./components/Header`, `./components/CompareBar`, `./components/TradingChart`, `./components/SimpleChart`, `./components/Fundamentals`, `./components/MacroEnvironment`, `./components/Screener`, `./components/WelcomeModal`, `./components/ErrorBoundary`, `./components/ConsentBanner`, `./hooks/useAssets`, `./hooks/useBreakpoint`, `./context/ProfileContext`
- **Externes** : `react (useState, useEffect)`, `react-router-dom (Routes, Route)`, `@clerk/clerk-react (useAuth, useUser)`

## Fonctionnement

### `App` (composant racine)
- Enregistre `getToken` dans `api/config` via `registerTokenGetter` (une fois Clerk chargé).
- Identifie l'utilisateur dans PostHog à la connexion ; si le compte a moins de 5 minutes, envoie `signup_completed`.
- Rend `ConsentBanner` (RGPD) puis les routes : `/login/*`, `/register/*` et `/*` (protégée par `ProtectedRoute`).

### `Dashboard` (contenu protégé)
- État local : `selectedSymbol` (défaut `'AI.PA'`), `compareSymbols`, `viewMode` (défaut `'screener'`).
- Charge la liste des actifs via `useAssets()` pour alimenter `Header` et `CompareBar`.
- Zone sticky en haut : bannière bêta + `Header`.
- Zone scrollable : affiche conditionnellement selon `viewMode` :
  - `'screener'` → `<Screener>`
  - `'macro'` → `<MacroEnvironment>`
  - `'chart'` → `<ChartWithToggle>` (Stratège) ou `<SimpleChart>` (Explorateur)
  - `'fundamentals'` → `<Fundamentals>`
  - Chaque bloc est enveloppé dans un `ErrorBoundary`.

### Layout conditionnel selon viewMode
```jsx
<div style={{ padding: isMobile ? '6px' : viewMode === 'fundamentals' ? '10px 16px' : '10px 32px' }}>
<div style={viewMode === 'fundamentals' ? { width: '100%' } : { maxWidth: '1600px', margin: '0 auto' }}>
```
- `'fundamentals'` → pleine largeur, padding latéral `10px 16px`
- Toutes les autres vues → `maxWidth: 1600px`, padding `10px 32px`

### WelcomeModal
Affiché si `profile === null`. Reçoit `setViewMode` via `onProfileSelected` pour naviguer vers la bonne vue après la sélection du profil.

### `ChartWithToggle`
Composant interne visible uniquement profil Stratège. Toggle Simple/Trading + le graphique correspondant.

## Points d'attention
- `viewMode` démarre à `'screener'` (plus `'home'` depuis suppression du HeroSection, 2026-05-03).
- `handleSelectSymbol` réinitialise `compareSymbols` à chaque changement de ticker principal.
- `CompareBar` est masqué en vues `'macro'` et `'screener'` (pas de comparaison pertinente dans ces contextes).
- Le wrapper Dashboard a `overflowX: 'hidden'` et `maxWidth: '100vw'` pour éviter les débordements horizontaux sur mobile.
