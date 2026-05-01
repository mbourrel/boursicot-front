# Header.jsx

## Rôle
Barre de navigation principale : logo + titre, recherche d'actif avec filtres multicritères (type, pays, secteur), navigation entre les vues, contrôles de préférences (devise, profil, thème), et bouton d'installation PWA sur mobile.

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `../context/CurrencyContext` (useCurrency), `../context/ProfileContext` (useProfile), `../context/PWAContext` (usePWA), `../hooks/useBreakpoint`, `../utils/analytics` (captureEvent)
- **Externes** : `react` (useState, useRef, useEffect, useMemo), `@clerk/clerk-react` (UserButton)

## Fonctionnement

### `FilterDropdown`
Composant interne générique : bouton déclencheur + liste de cases à cocher avec boutons "Tous"/"Aucun". Fermeture automatique au clic en dehors via `mousedown` sur `document`.

### `ThemeToggle`
Toggle animé dark/light (pill CSS, pas SVG).

### `Controls`
Composant interne réutilisé dans le header desktop ET le panneau burger mobile. Contient : toggle devise, toggle profil Explorateur/Stratège, toggle dark/light, `UserButton` Clerk.

### `Header` (composant principal)

**Desktop** : tous les contrôles et la barre de recherche affichés inline.

**Mobile** :
- Logo + titre à gauche.
- Barre de recherche pleine largeur + bouton burger ☰ à droite.
- Boutons de navigation vue (📈/📊/🌐) compacts à gauche de la barre de recherche.
- Panneau burger (overlay fixed slide-down) : `Controls` + bouton d'installation PWA.
- Coach mark : toast bas d'écran affiché 5 s après changement de profil.

### Bouton d'installation PWA
Visible dans le panneau burger uniquement si `installPrompt && !isInstalled` (event `beforeinstallprompt` capturé via `PWAContext`). Appelle `triggerInstall()` puis ferme le menu.

### Filtres
Trois `FilterDropdown` (TYPE, PAYS, SECTEUR). Pays et secteurs dérivés de `fundamentalsData` via `useMemo`. Les pays sont inférés du suffixe ticker (`.PA` → France, `.AS` → Pays-Bas, sans suffixe → États-Unis, `^`/`-USD`/`=F` → International).

## Utilisé par
`App.jsx` (Dashboard)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `selectedSymbol` | string | Ticker actuellement sélectionné |
| `setSelectedSymbol` | function | Callback de sélection |
| `fundamentalsData` | array | Liste des actifs `{ ticker, name, sector }` |
| `viewMode` | string | `'chart'` \| `'fundamentals'` \| `'macro'` |
| `setViewMode` | function | Bascule de vue |

## Points d'attention
- Les filtres pays et secteur sont initialisés à `null` et remplis après le premier chargement de `fundamentalsData`.
- La dérivation du pays est une heuristique sur le suffixe du ticker.
- Disclaimer MIF2 affiché en bas sur toute la largeur, toutes vues confondues.
- Le logo est affiché comme icône arrondie (carré 34–42 px, `borderRadius: 10px`, `object-fit: cover`) à côté du titre "Boursicot Pro".
