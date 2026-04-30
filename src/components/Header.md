# Header.jsx

## Rôle
Barre de navigation principale : recherche d'actif avec filtres multicritères (type, pays, secteur), navigation entre les vues, et contrôles de préférences (devise, thème dark/light, mode débutant/avancé).

## Dépendances
- **Internes** : `../context/ThemeContext` (useTheme), `../context/CurrencyContext` (useCurrency), `../utils/analytics` (captureEvent)
- **Externes** : `react` (useState, useRef, useEffect, useMemo), `@clerk/clerk-react` (UserButton)

## Fonctionnement

### `FilterDropdown`
Composant interne générique : bouton déclencheur + liste de cases à cocher avec boutons "Tous"/"Aucun". Fermeture automatique au clic en dehors via `mousedown` sur `document`.

### `ThemeToggle`
Bouton toggle SVG animé dark/light, positionné à droite.

### `Header` (composant principal)
- **Filtres** : trois `FilterDropdown` (TYPE, PAYS, SECTEUR). Les listes de pays et de secteurs sont dérivées de `fundamentalsData` via `useMemo`. Les pays sont déduits du suffixe du ticker (`.PA` → France, `.AS` → Pays-Bas, sans suffixe → États-Unis).
- **Synchronisation** : quand `selectedSymbol` change, le champ texte se met à jour avec le nom + ticker de l'actif sélectionné.
- **Barre de recherche** : filtre `filteredData` en temps réel selon le texte saisi et les filtres actifs. Dropdown fermé au clic en dehors.
- **Navigation** : trois boutons (Cours de bourse / Analyse Fondamentale / Macro), envoient un événement `view_changed` à PostHog.
- **Mode débutant** : bouton "Analyse Avancée" visible uniquement en vue `fundamentals`.
- **Sélecteur de devise** : `LOCAL` / `EUR` / `USD`, visible uniquement en vue `fundamentals`, avec date du taux affiché en dessous si applicable.
- **Profil** : `UserButton` Clerk en dernier.

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
| `isBeginnerMode` | boolean | Mode débutant actif |
| `setIsBeginnerMode` | function | Toggle mode débutant |

## Points d'attention
- Les filtres pays et secteur sont initialisés à `null` et remplis de façon asynchrone après le premier chargement de `fundamentalsData` : ne pas présupposer qu'ils sont prêts à t=0.
- La dérivation du pays depuis le ticker est une heuristique (suffixe) — ne reflète pas nécessairement le pays du siège.
- Le `dropdownRef` de la barre de recherche et les `typeFilterRef/countryFilterRef/sectorFilterRef` sont des refs séparées pour éviter les conflits de fermeture.
- **Disclaimer MIF2 (2026-04-30)** : une ligne en 10px est affichée sous la barre principale ("Informations à titre indicatif uniquement — ne constituent pas un conseil en investissement. Tout investissement comporte un risque de perte en capital."). Visible sur toutes les vues, pas seulement Fundamentals.
