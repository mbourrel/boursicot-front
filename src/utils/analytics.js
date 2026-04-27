import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  console.log('[Analytics] initAnalytics called — key:', key ? 'present' : 'MISSING', '| initialized:', initialized);

  if (!key || initialized) return;

  posthog.init(key, {
    api_host: host || 'https://eu.i.posthog.com',
    persistence: 'memory',
    autocapture: false,
    capture_pageview: false,
    loaded: (ph) => {
      console.log('[Analytics] PostHog loaded, distinct_id:', ph.get_distinct_id());
      console.log('[Analytics] PostHog config — api_host:', ph.config.api_host, '| token:', ph.config.token);
      ph.debug();
    },
  });

  initialized = true;
  console.log('[Analytics] PostHog initialized successfully');
}

export function captureEvent(name, properties = {}) {
  console.log('[Analytics] captureEvent called — name:', name, '| initialized:', initialized);
  if (!initialized) return;
  posthog.capture(name, properties);
  console.log('[Analytics] Event sent:', name);
}

export function optInTracking() {
  if (!initialized) return;
  posthog.set_config({ persistence: 'localStorage+cookie' });
}

export function identifyUser(clerkUserId) {
  if (!initialized || !clerkUserId) return;
  posthog.identify(clerkUserId);
  optInTracking();
}
