# Header.jsx

## Rôle
Barre de navigation principale : bloc marque (logo + titre + slogan), filtres actifs (TYPE / PAYS / SECTEUR), barre de recherche, boutons de vue, sélecteur de profil, thème dark/light, UserButton Clerk et disclaimer MIF2. Sticky en haut de page via App.jsx.

## Dépendances
- **Contextes** : `ThemeContext`, `ProfileContext`, `PWAContext`
- **Hooks** : `useBreakpoint`
- **Externes** : `@clerk/clerk-react (UserButton)`, `captureEvent (analytics)`, `react (useState, useRef, useEffect, useMemo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `selectedSymbol` | `string` | Ticker actuellement sélectionné |
| `setSelectedSymbol` | `function` | Callback sélection d'un actif |
| `fundamentalsData` | `array` | Liste des `Company` — alimente les filtres et la recherche |
| `viewMode` | `string` | Vue active : `'screener'|'chart'|'fundamentals'|'macro'` |
| `setViewMode` | `function` | Change la vue active |

## Fonctionnement

### Bloc marque (logo + titre)
Disposition en colonne (`flexDirection: 'column'`). Clic → `setViewMode('screener')`.
- Desktop : titre "Boursicot" + slogan "Votre intuition, validée par les chiffres." (13px, `var(--text3)`, `whiteSpace: nowrap`)
- Mobile : titre uniquement (slogan masqué)

### FilterDropdown
Composant interne générique : bouton déclencheur + liste de cases à cocher avec boutons "Tous"/"Aucun". Fermeture automatique au clic en dehors via `mousedown` sur `document`.

### Filtres
Trois instances : TYPE, PAYS, SECTEUR (desktop uniquement).
- TYPE : déduit de `company.asset_class` (fallback pattern ticker pour la transition pré-re-seed)
- PAYS : déduit du suffixe ticker (`.PA` → France, `.AS` → Pays-Bas, sans suffixe → États-Unis, `^`/`-USD`/`=F` → International)
- SECTEUR : liste dynamique extraite de `fundamentalsData` via `useMemo`
- Les filtres démarrent à `null` et s'initialisent via `useEffect` quand `fundamentalsData` est chargé

### ThemeToggle
Toggle animé dark/light (pill CSS, `44×24px`, transition left).

### Controls (composant interne)
Réutilisé desktop inline et mobile menu. Contient : toggle profil Explorateur/Stratège + coach mark, toggle dark/light, `UserButton` Clerk.

### Barre de recherche
Filtrage live sur `name` et `ticker`. Dropdown liste au clic — se ferme au clic extérieur.

### Boutons de navigation
Desktop : groupe de 4 boutons (Cours de bourse / Analyse Fondamentale / 🔍 Screener / 🌐 Macro). Couleurs actives : Screener violet `#7c3aed`, Macro teal `#26a69a`, autres bleu `#2962FF`.
Mobile : icônes compacts dans un groupe de boutons.

### Mobile menu
Panneau slide-down overlay (bouton ☰). Contient : Controls + bouton d'installation PWA si `installPrompt && !isInstalled`. Coach Mark : toast bas d'écran, auto-dismiss 5s.

### Disclaimer MIF2
`div` 10px pleine largeur en bas du Header, toujours visible.

## Points d'attention
- Le sélecteur devise LOCAL/EUR/USD **n'est plus dans le Header** (retiré 2026-05-03) — il est dans la sous-barre de `Fundamentals.jsx`.
- `assetFilters`, `countryFilters`, `sectorFilters` démarrent à `null` et sont initialisés par `useEffect` pour éviter une réinitialisation à chaque render.
- `Controls` est un composant interne non exporté — à maintenir en ligne pour éviter le props drilling.
- Clic sur le logo/titre navigue vers `'screener'` (plus `'home'` depuis suppression du HeroSection).
