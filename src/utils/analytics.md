# utils/analytics.js

## Rôle
Encapsule PostHog : initialisation RGPD-compliant (cookieless par défaut), identification utilisateur, opt-in explicite, envoi d'événements.

## Dépendances
- `posthog-js` — SDK PostHog

## Exports
- `initAnalytics()` — à appeler une seule fois dans `index.jsx` avant le premier render
- `captureEvent(name, properties)` — envoie un événement custom (silencieux si non initialisé)
- `optInTracking()` — passe de `memory` à `localStorage+cookie` (sur consentement explicite via `ConsentBanner`)
- `identifyUser(clerkUserId)` — réconcilie session anonyme avec compte Clerk, active la persistance

## Fonctionnement
Singleton `initialized` : `posthog.init` n'est appelé qu'une fois. Sans `VITE_POSTHOG_KEY`, toutes les fonctions sont silencieuses.

Mode par défaut : `persistence: 'memory'` (cookieless, RGPD-compliant CNIL). L'opt-in explicite migre vers `localStorage+cookie`.

`autocapture: false` et `capture_pageview: false` — seuls les événements explicites sont tracés :
- `symbol_selected`, `view_changed`, `currency_changed`, `profile_changed`, `theme_toggled`, `chart_mode_changed`, `signup_completed`

## Utilisé par
- `index.jsx` — `initAnalytics()`
- `App.jsx` — `identifyUser`, `captureEvent('signup_completed')`, `captureEvent('chart_mode_changed')`
- `Header.jsx` — `captureEvent('symbol_selected')`, `captureEvent('view_changed')`, `captureEvent('currency_changed')`, `captureEvent('profile_changed')`, `captureEvent('theme_toggled')`
- `components/ConsentBanner.jsx` — `optInTracking()` sur acceptation

## Points d'attention
- `VITE_POSTHOG_KEY` absent → module entièrement silencieux, aucune erreur.
- `identifyUser` appelle `optInTracking` automatiquement — l'utilisateur connecté accepte implicitement le tracking par son inscription.
