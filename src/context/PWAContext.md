# PWAContext.jsx

## Rôle
Contexte React gérant l'état d'installation PWA : capture du prompt natif du navigateur (`beforeinstallprompt`), état d'installation, et déclenchement du prompt utilisateur.

## Dépendances
- **Externes** : `react` (createContext, useContext, useEffect, useState)

## Fonctionnement

### Capture de l'événement
`beforeinstallprompt` peut se déclencher **avant** le montage de `PWAContext` (SPA montée après le chargement initial). Pour éviter ce timing miss :
1. Un script inline dans `index.html` capture l'événement dès le chargement dans `window.__pwaInstallPrompt`.
2. Au premier `useEffect` de `PWAContext`, si `window.__pwaInstallPrompt` est défini, il est consommé et passé dans le state.
3. L'event listener reste en place pour capturer d'éventuels re-déclenchements.

### État exposé
- `installPrompt` : l'événement natif `BeforeInstallPromptEvent` ou `null`.
- `isInstalled` : `true` si l'app tourne en mode `standalone` (déjà installée) ou si `appinstalled` a été déclenché.
- `triggerInstall()` : appelle `installPrompt.prompt()`, attend le choix utilisateur, met `isInstalled` à `true` si accepté.

## Utilisé par
- `index.jsx` (provider)
- `Header.jsx` — affiche le bouton "📲 Installer Boursicot Pro" dans le burger menu si `installPrompt && !isInstalled`

## Props / API
### `PWAProvider`
| Prop | Type | Description |
|---|---|---|
| `children` | ReactNode | Arbre React enfant |

### `usePWA()` — valeurs exposées
| Clé | Type | Description |
|---|---|---|
| `installPrompt` | event\|null | Événement `BeforeInstallPromptEvent` capturé |
| `isInstalled` | boolean | App déjà installée |
| `triggerInstall` | function | Déclenche le prompt natif d'installation |

## Points d'attention
- `beforeinstallprompt` n'est disponible que sur Chrome Android (et quelques Chromium desktop) — pas sur Safari iOS.
- Chrome ne déclenche l'événement que si toutes les conditions PWA sont remplies (manifest valide, SW actif, HTTPS, pas déjà installé) et selon ses propres heuristiques d'engagement.
- Après un refus utilisateur, Chrome applique un cooldown avant de redéclencher l'événement.
- Le bouton d'installation disparaît automatiquement une fois l'app installée (`isInstalled = true`).
