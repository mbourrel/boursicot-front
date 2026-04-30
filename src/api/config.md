# api/config.js

## Rôle
Configuration centrale de l'API : URL du backend et wrapper `authFetch` avec injection automatique du token Clerk.

## Dépendances
- `import.meta.env.VITE_API_URL` — variable d'environnement Vite (prod)
- `window.location.hostname` — détection locale

## Fonctionnement
- `API_URL` : `http://127.0.0.1:8000` en local, `VITE_API_URL` en production
- `registerTokenGetter(fn)` : appelé une fois dans `App.jsx` avec `getToken` de Clerk
- `authFetch(url, options)` : wrapper autour de `fetch` qui ajoute `Authorization: Bearer <token>` si un token est disponible. Fonctionne sans token (guest mode)

## Utilisé par
Tous les fichiers `api/*.js` importent `API_URL` et `authFetch`.

## Points d'attention
- Sans appel à `registerTokenGetter`, tous les appels partent sans token (mode guest — accepté par le backend via `verify_aud=False`)
- `VITE_API_URL` doit être défini dans `.env.production` ou dans les variables d'environnement Render/Vercel
