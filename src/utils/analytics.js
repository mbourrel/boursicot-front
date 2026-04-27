import posthog from 'posthog-js';

let initialized = false;

/**
 * À appeler une seule fois au démarrage de l'app (dans index.jsx).
 * Mode cookieless par défaut (persistence: 'memory') — RGPD-compliant CNIL.
 * Ne pose aucun cookie ni localStorage sans consentement explicite.
 */
export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (!key || initialized) return;

  posthog.init(key, {
    api_host: host || 'https://eu.i.posthog.com',
    persistence: 'memory',    // cookieless — aucun stockage sans opt-in
    autocapture: false,       // on contrôle manuellement les événements
    capture_pageview: false,  // idem pour les pageviews
  });

  initialized = true;
}

/**
 * Envoie un événement custom à PostHog.
 * Silencieux si analytics non initialisé (env var absente, ex: dev sans .env.local).
 */
export function captureEvent(name, properties = {}) {
  if (!initialized) return;
  posthog.capture(name, properties);
}

/**
 * À appeler sur opt-in explicite (bannière de consentement).
 * Passe de 'memory' à 'localStorage+cookie' pour la persistance inter-sessions.
 */
export function optInTracking() {
  if (!initialized) return;
  posthog.set_config({ persistence: 'localStorage+cookie' });
}

/**
 * À appeler dès qu'un utilisateur Clerk est authentifié.
 * Réconcilie la session anonyme (guest) avec l'ID du compte,
 * et active automatiquement la persistance.
 */
export function identifyUser(clerkUserId) {
  if (!initialized || !clerkUserId) return;
  posthog.identify(clerkUserId);
  optInTracking();
}
