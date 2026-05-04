# components/ConsentBanner.jsx

## Rôle
Bandeau de consentement RGPD affiché au premier lancement. Permet à l'utilisateur d'accepter ou refuser le tracking analytics PostHog.

## Fonctionnement
Contrôlé par un flag `localStorage`. Si l'utilisateur refuse, PostHog est désactivé via `posthog.opt_out_capturing()`. Si l'utilisateur accepte, les événements sont capturés normalement.

## Utilisé par
- `App.jsx` — rendu au-dessus de tout le contenu, position fixe en bas d'écran.

## Points d'attention
- Le consentement doit être recueilli avant tout event PostHog — s'assurer que l'initialisation PostHog respecte le choix initial.
- Conserver le flag sous une clé stable (`boursicot_consent`) pour ne pas ré-afficher le bandeau après mise à jour.
