# ThemeContext.jsx

## Rôle
Contexte React gérant le thème dark/light de l'application : expose les palettes de couleurs, les variables CSS injectées sur `:root`, et le toggle.

## Dépendances
- **Externes** : `react` (createContext, useContext, useState, useEffect)

## Fonctionnement

### Palettes (`DARK`, `LIGHT`)
Objets exportés définissant toutes les couleurs applicatives :
- `bg0–bg3` : niveaux de fond (page, carte, panneau intérieur, input)
- `border` : couleur des bordures
- `text1–text3` : niveaux de texte (primaire, secondaire, atténué)
- `chartBg`, `chartGrid`, `chartText` : valeurs JS pour `lightweight-charts` (ne supporte pas `var()`)

### `CSS_VARS`
Mapping variable CSS → clé de palette. Appliqué sur `document.documentElement` via `useEffect` à chaque changement de thème. Permet aux styles statiques (hors `useTheme`) de réagir au thème.

### `ThemeProvider`
- État `isDark` (défaut `true` — dark mode par défaut).
- À chaque changement : injecte les variables CSS sur `<html>`.
- Expose `{ isDark, toggleTheme, theme }` via contexte.

### `useTheme()`
Hook de consommation. Pas de guard d'erreur (contrairement à `useCurrency`).

## Utilisé par
- `index.jsx` (provider)
- `Header.jsx` (toggle dark/light + `isDark`)
- `TradingChart.jsx`, `SimpleChart.jsx`, `LiquidityMonitor.jsx`, `YieldCurveChart.jsx`, `SovereignSpreadsChart.jsx` (couleurs des charts lightweight-charts)

## Props / API
### `ThemeProvider`
| Prop | Type | Description |
|---|---|---|
| `children` | ReactNode | Arbre React enfant |

### `useTheme()` — valeurs exposées
| Clé | Type | Description |
|---|---|---|
| `isDark` | boolean | Mode sombre actif |
| `toggleTheme` | function | Bascule dark/light |
| `theme` | object | Palette active (`DARK` ou `LIGHT`) |

### Exports nommés
`DARK`, `LIGHT` — importables directement pour les valeurs JS dans les charts.

## Points d'attention
- `lightweight-charts` ne supporte pas les variables CSS (`var()`) — les composants graphiques doivent utiliser `theme.chartBg`, `theme.chartGrid`, `theme.chartText` en valeurs JS.
- Le dark mode est activé par défaut — préférence utilisateur non persistée (pas de `localStorage`).
- Les variables CSS `--bg0` à `--text3` sont injectées sur `<html>` et disponibles dans tous les styles CSS statiques.
