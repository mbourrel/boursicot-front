# Screener.jsx

## Rôle
Screener Pédagogique — permet de filtrer les 64 actifs de l'univers Boursicot selon des critères de santé financière, valorisation, secteur et géographie. Vue par défaut au lancement de l'application. Contient un système d'onboarding unique pour les Explorateurs.

## Dépendances
- **Contextes** : `ProfileContext` (`useProfile`)
- **Hooks** : `useScreener` (fetch + filtrage), `useBreakpoint`
- **Utilitaires** : `captureEvent (analytics)`
- **API** : `GET /api/screener` via `useScreener`
- **Externes** : `react (useState, useEffect, useRef, useMemo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `onSelectTicker` | `function` | Callback quand l'utilisateur clique sur un actif — App.jsx l'utilise pour naviguer vers `'fundamentals'` |

## Fonctionnement

### Onboarding Explorateur
Popup unique affichée à la première ouverture pour les utilisateurs Explorateur. Persisté via `localStorage` (clé `boursicot_screener_onboarding_seen`).
```jsx
const [showOnboarding, setShowOnboarding] = useState(false);
useEffect(() => {
  if (profile === 'explorateur' && !localStorage.getItem(ONBOARDING_KEY)) {
    setShowOnboarding(true);
  }
}, [profile]);
```
`useEffect([profile])` est indispensable car le Screener monte **avant** que l'utilisateur sélectionne son profil dans le WelcomeModal — un `useState` lazy initializer aurait lu `profile === null` et ne se serait jamais re-déclenché.

Overlay : `position: fixed, inset: 0, zIndex: 500`, backdrop `rgba(0,0,0,0.52)`. CTA "Trouver ma première action →" : ferme le popup + force la Vue Liste.

### Mode Guidé (défaut Explorateur)
Phrase en langage naturel composée d'`<InlineSelect>` groupés avec `whiteSpace: nowrap` :
> "Je cherche une entreprise **[internationale]** dans le secteur **[Tous]**, avec une santé financière **[Peu importe]** et une valorisation **[Peu importe]**."

### Mode Avancé (défaut Stratège) — AdvancedFilters
Filtres organisés en **2 rangées** avec séparateur visuel :
- **Rangée 1 — Dropdowns** (`grid minmax(180px, 1fr)`) : Géographie, Secteur, Verdict
- Séparateur `borderTop` avec `marginBottom: 18px`
- **Rangée 2 — Sliders** (`grid minmax(160px, 1fr)`) : 6 dimensions ADV_DIMS (Santé, Valorisation, Croissance, Efficacité, Dividende, Momentum)

`selectStyle` et `labelStyle` sont extraits comme constantes pour éviter la répétition inline.

### Vue Matrice (QuadrantMatrix)
Scatter plot SVG. Labels de quadrant rendus dans un `<g>` avec `opacity="0.18"` — discrets pour ne pas surcharger la visualisation.

### Vue Liste
Table desktop / cards mobile (`ResultCard`). Tri par score global décroissant.

### Profil-aware
```jsx
const [mode, setMode] = useState(() => profile === 'stratege' ? 'advanced' : 'guided');
useEffect(() => { setMode(profile === 'stratege' ? 'advanced' : 'guided'); }, [profile]);
```

### Filtre géographique
```jsx
function getGeoRegion(country) {
  if (!country) return null;
  if (country === 'United States') return 'us';
  return 'europe';
}
```
`null` = région inconnue → inclus dans le filtre "Monde entier".

## Points d'attention
- Conteneur `width: '100%'` (sans `maxWidth`) — pleine largeur depuis 2026-05-03.
- Vue Matrice masquée sur mobile — illisible, points chevauchés. L'onglet "Vue Matrice" n'est pas rendu sur mobile (pas juste caché via CSS).
- Le filtrage est entièrement côté client — `useScreener` charge tous les actifs une seule fois.
- `InlineSelect` est un `<select>` stylisé inline pour s'intégrer dans la phrase guidée.
- `ONBOARDING_KEY = 'boursicot_screener_onboarding_seen'` — effacer manuellement pour re-tester.
