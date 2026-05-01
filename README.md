# Boursicot Pro

Application web d'analyse boursière fondamentale et graphique — SPA React déployée sur Vercel, backend FastAPI sur Render.

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | React 19, Vite 8, React Router 7 |
| Auth | Clerk |
| Charts | lightweight-charts 5 |
| Analytics | PostHog (cookieless RGPD) |
| PWA | vite-plugin-pwa 1.2 (Workbox) |
| Déploiement | Vercel (frontend), Render (backend) |

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:3000
```

Créer un `.env.local` avec :
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://127.0.0.1:8000
VITE_POSTHOG_KEY=phc_...   # optionnel — silencieux si absent
```

## Build & preview

```bash
npm run build      # compile + vérifie les artifacts PWA
npm run preview    # sert le dist sur http://localhost:4173
```

Le script `scripts/verify-pwa.js` s'exécute automatiquement après le build et échoue explicitement si `sw.js`, `workbox-*.js` ou `manifest.webmanifest` sont manquants.

## PWA

L'app est installable sur Android (Chrome) et iOS (Safari → Partager → Sur l'écran d'accueil).

- Nom : **Boursicot Pro**
- Icônes : 11 tailles dans `public/icons/` dont une variante maskable Android
- Service worker : Workbox `generateSW`
  - API `/api/*` → NetworkFirst (5 min cache, 5 s timeout réseau)
  - Icônes → CacheFirst (1 an)
  - JS/CSS → StaleWhileRevalidate (7 jours)
- Install prompt : capturé dans `index.html` avant montage React, exposé via `PWAContext`, bouton dans le menu burger mobile

## Structure des sources

```
src/
  api/            Appels HTTP vers le backend FastAPI
  components/     Composants UI (Header, Fundamentals, charts macro…)
    fundamentals/ Sous-composants de l'analyse fondamentale
  context/        Providers React (Theme, Currency, Profile, PWA)
  hooks/          Hooks de chargement de données
  pages/          LoginPage, RegisterPage
  utils/          analytics, formatFinancialValue
  constants/      pillars, metricExplanations
scripts/
  verify-pwa.js   Vérification post-build des artifacts PWA
public/
  icons/          Icônes PWA (72px → 512px + maskable)
```

## Dépendance connue

`vite-plugin-pwa@1.2.0` ne déclare pas encore le support de vite 8 dans ses peer deps.
Contournement : `.npmrc` avec `legacy-peer-deps=true`.
À retirer dès qu'une version du plugin déclare officiellement `vite@^8`.
Voir `.npmrc` pour le contexte et `scripts/verify-pwa.js` pour la détection de régression.
