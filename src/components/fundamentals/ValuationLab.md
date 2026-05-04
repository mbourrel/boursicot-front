# fundamentals/ValuationLab.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Module principal du Laboratoire d'Évaluation. Regroupe 5 méthodes de valorisation en 3 approches (intrinsèque, relative, patrimoniale) sous forme d'accordéon à Progressive Disclosure. Affiché uniquement pour les stocks en vue Solo Stratège. Remplace `ValuationPrism`.

## Dépendances
- **Hooks** : `useBreakpoint`
- **Sous-composants** : `ValuationMethodCard`, `MetricInfo`
- **Constantes** : `h3Style` (styles.js)
- **Externes** : `react (useState, useMemo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `data` | `object` | Données fondamentales (`d` de SoloView, inclut `valuation_defaults`) |

> **Clé de remontage** : SoloView passe `key={d.ticker}` — les états de sliders sont réinitialisés à chaque changement de ticker.

## Méthodes implémentées

### Approche Intrinsèque
| Méthode | Formule | Sliders | Données requises |
|---------|---------|---------|-----------------|
| DCF | ∑ FCFt/(1+WACC)^t + VT/(1+WACC)^n | Croissance (−5%→+20%), WACC (5%→20%), g∞ (0%→4%) | FCF, marketCap, closePrice |
| DDM | D₁/(Kₑ−g) | Kₑ (4%→20%), g (0%→8%) | dividends_data.dividend_rate |

### Approche Relative
| Méthode | Formule | Sliders | Données requises |
|---------|---------|---------|-----------------|
| EV/EBITDA | VE = EBITDA × Multiple, P = (VE−DN)/N | Multiple (3x→30x) | income_stmt_data["EBITDA"], balance_sheet_data |
| P/E | BPA × P/E cible | P/E (5x→50x) | income_stmt_data["BPA Dilué"] |

### Approche Patrimoniale
| Méthode | Formule | Sliders | Données requises |
|---------|---------|---------|-----------------|
| ANCC | (CP/Action) × (1+Ajustement) | Ajustement (−20%→+50%) | advanced_valuation["Price to Book"] |

## Valeurs par défaut des sliders
Toutes proviennent de `data.valuation_defaults` (calculé côté backend) :
- `default_wacc` → WACC et Kₑ
- `default_growth` → taux de croissance DCF
- `default_pe` → P/E cible (moyenne sectorielle)
- `sector_ev_ebitda` → multiple EV/EBITDA (moyenne sectorielle)
- g∞ = 2.5% fixe ; g DDM = 3.0% fixe

## Progressive Disclosure
- Par défaut, toutes les cartes sont fermées — seul le titre + l'écart % sont visibles.
- L'état `open` (Set) gère les cartes ouvertes. Plusieurs peuvent être ouvertes simultanément.
- Le badge % est calculé en permanence (même carte fermée) à partir de l'état courant des sliders.

## Rendering des formules
CSS fractions via les composants `Frac` et `Sigma` définis inline — aucune dépendance LaTeX externe.

## Cas dégradés
| Condition | Comportement |
|-----------|-------------|
| FCF nul/absent | DCF : "Free Cash Flow introuvable" |
| Dividende ≤ 0 | DDM : "Aucun dividende versé" |
| Ke ≤ g | DDM : warning interactif inline |
| EBITDA absent | EV/EBITDA : "EBITDA introuvable" |
| BPA ≤ 0 | P/E : "Bénéfices négatifs" |
| Price to Book absent | ANCC : indisponible |

## Utilisé par
`SoloView.jsx` — vue Stratège, branche `assetType === 'stock'`, entre ScoreDashboard et la grille de métriques
