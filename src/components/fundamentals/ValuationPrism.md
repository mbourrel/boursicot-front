# fundamentals/ValuationPrism.jsx

**Dernière mise à jour :** 2026-05-04 (UI v2 — sliders in-card, reset, dynamic defaults)

## Rôle
Module interactif d'estimation de la valeur théorique d'une action via 3 modèles financiers classiques. Les sliders modifient les hypothèses en temps réel (côté client uniquement). Affiché uniquement pour les stocks en vue Solo Stratège.

## Dépendances
- **Hooks** : `useBreakpoint`
- **Sous-composants** : `MetricInfo` (tooltips pédagogiques sur chaque slider)
- **Icônes** : `RotateCcw` (lucide-react)
- **Constantes** : `h3Style` (styles.js)
- **Externes** : `react (useState, useMemo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `data` | `object` | Données fondamentales de la company (objet `d` de SoloView, inclut `valuation_defaults`) |

> **Clé de remontage** : SoloView passe `key={d.ticker}` pour forcer le re-mount lors d'un changement de ticker (les `useState` initiaux resteraient figés sinon).

## Modèles de calcul

### DCF Simplifié
```
EV = ∑(i=1→5) FCF·(1+g)ⁱ/(1+WACC)ⁱ  +  FCF₅·(1+g_terminal)/(WACC−g_terminal) / (1+WACC)⁵
Prix/action = EV / sharesOutstanding
```
- `FCF` → `balance_cash["Free Cash Flow"]`
- `sharesOutstanding` → dérivé : `marketCap / close_price`
- `g_terminal` = 2.5% (fixe)
- Sliders : Croissance annuelle, WACC

### Nombre de Graham
```
Prix Graham = √(22.5 × BPA × Valeur Comptable par Action)
```
- `BPA` → `income_stmt_data.items["BPA Dilué"]` (fallback "BPA Basique")
- `Valeur Comptable/Action` → `close_price / priceToBook`
- Aucun slider (formule déterministe)

### Valorisation par P/E
```
Prix P/E = BPA × Multiple P/E Cible
```
- Slider : Multiple P/E Cible (5x – 50x)

## Valeurs par défaut des sliders

Les defaults sont fournis par le backend (`data.valuation_defaults`) avec fallback local :

| Champ | Source API | Fallback local |
|-------|-----------|----------------|
| `default_growth` | FCF CAGR historique (0–15%) | `Croissance Bénéfices` / 100, capé, ou 5% |
| `default_wacc` | CAPM : `rf + β × 5.5%`, capé 5–15% | 8% |
| `default_pe` | Moyenne P/E sectorielle, capée 5–50 | PER actuel capé ou 15x |

Le taux sans risque `rf` est lu depuis `macro_cache["macro_rates_v6"].bond_yields`
(US 10Y pour USD, Bund 10Y pour EUR, Gilt 10Y pour GBP) avec fallback hardcodé.

## Reset button
Le bouton "Réinitialiser" (icône `RotateCcw`) apparaît dès que `isDirty` est vrai,
c'est-à-dire dès qu'au moins un slider diffère de sa valeur par défaut.
Il restaure les 3 sliders simultanément aux defaults.

## Affichage

- **Sliders à l'intérieur de chaque carte** : DCF embarque Croissance + WACC ; P/E embarque Multiple P/E Cible ; Graham n'a pas de slider.
- **Inputs bruts affichés** sous le titre de chaque carte (FCF compact pour DCF, BPA + VCpA pour Graham/P/E).
- **Résultat séparé** par un `borderTop` en bas de carte : prix théorique en `var(--text1)` + badge % coloré (vert/rouge).
- **"Écart théorique"** : label neutre — la couleur du % pill est le seul signal directionnel.
- **Disclaimer MIF2** neutre (bg3 + border standard, sans orange).

## Cas dégradés
| Condition | Comportement |
|-----------|-------------|
| `eps <= 0` (pertes) | Graham et P/E affichent "Modèle indisponible — bénéfices négatifs" |
| `eps === null` | Graham et P/E affichent "Données BPA introuvables" |
| `fcf === 0 \|\| null` | DCF affiche "Free Cash Flow introuvable" |
| `priceToBook === null` | Graham affiche "Valeur comptable introuvable" |
| `assetType !== 'stock'` | Le composant n'est pas rendu (filtrage dans SoloView) |

## Utilisé par
`SoloView.jsx` — vue Stratège, branche `assetType === 'stock'`, entre ScoreDashboard et la grille de métriques

## Points d'attention
- Tous les calculs sont **100% côté client** — aucun appel API.
- Les prix théoriques sont dans la **devise locale** de l'action. Pas de conversion.
- `sharesOutstanding` est une **approximation** (`marketCap / close_price`).
- `bookValuePerShare` est **dérivée** du `Price to Book`.
- Les 3 entrées dans `metricExplanations.js` : `'Taux de Croissance Annuel'`, `'WACC'`, `'Multiple P/E Cible'`.
