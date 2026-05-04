# fundamentals/ValuationPrism.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Module interactif d'estimation de la valeur théorique d'une action via 3 modèles financiers classiques. Les sliders modifient les hypothèses en temps réel (côté client uniquement). Affiché uniquement pour les stocks en vue Solo Stratège.

## Dépendances
- **Hooks** : `useBreakpoint`
- **Sous-composants** : `MetricInfo` (tooltips pédagogiques sur chaque slider)
- **Constantes** : `h3Style` (styles.js)
- **Externes** : `react (useState, useMemo)`

## Props
| Prop | Type | Description |
|------|------|-------------|
| `data` | `object` | Données fondamentales de la company (objet `d` de SoloView) |

## Modèles de calcul

### DCF Simplifié
```
EV = ∑(i=1→5) FCF·(1+g)ⁱ/(1+WACC)ⁱ  +  FCF₅·(1+g_terminal)/(WACC−g_terminal) / (1+WACC)⁵
Prix/action = EV / sharesOutstanding
```
- `FCF` → `balance_cash["Free Cash Flow"]`
- `sharesOutstanding` → dérivé : `marketCap / close_price`
- `g_terminal` = 2.5% (fixe — croissance long terme du PIB)
- Sliders actifs : Taux de Croissance Annuel, WACC

### Nombre de Graham
```
Prix Graham = √(22.5 × BPA × Valeur Comptable par Action)
```
- `BPA` → `income_stmt_data.items["BPA Dilué"].vals[0]` (fallback "BPA Basique")
- `Valeur Comptable/Action` → dérivée : `close_price / priceToBook`
- Aucun slider (formule déterministe)

### Valorisation par P/E
```
Prix P/E = BPA × Multiple P/E Cible
```
- Slider actif : Multiple P/E Cible (5x – 50x)
- Valeur par défaut = PER actuel de l'entreprise (capé 5–50)

## Valeurs par défaut des sliders
| Slider | Min | Max | Défaut |
|--------|-----|-----|--------|
| Taux de Croissance Annuel | -5% | +20% | `Croissance Bénéfices` de la company (capé) ou 5% |
| WACC | 5% | 15% | 10% |
| Multiple P/E Cible | 5x | 50x | PER actuel (capé) ou 15x |

## Cas dégradés
| Condition | Comportement |
|-----------|-------------|
| `eps <= 0` (pertes) | Graham et P/E affichent "Modèle indisponible — bénéfices négatifs" |
| `eps === null` | Graham et P/E affichent "Données BPA introuvables" |
| `fcf === 0 \|\| null` | DCF affiche "Free Cash Flow introuvable" |
| `priceToBook === null` | Graham affiche "Valeur comptable introuvable" |
| `assetType !== 'stock'` | Le composant n'est pas rendu (filtrage dans SoloView) |

## Conformité MIF2
Disclaimer obligatoire affiché sous les cartes : *"Ceci est un outil de simulation mathématique. Les résultats dépendent de vos hypothèses et ne constituent en aucun cas une recommandation d'achat ou de vente."*

## Utilisé par
`SoloView.jsx` — vue Stratège, branche `assetType === 'stock'`, entre ScoreDashboard et la grille de métriques

## Points d'attention
- Tous les calculs sont **100% côté client** — aucun appel API.
- Les prix théoriques sont dans la **devise locale** de l'action (même devise que `close_price`). Pas de conversion devise (les inputs DCF/Graham/PE sont tous dans la même devise que les états financiers).
- `sharesOutstanding` est une **approximation** (`marketCap / close_price`). La valeur exacte n'est pas stockée en DB.
- `bookValuePerShare` est **dérivée** du `Price to Book` : si `PtB = 0`, la carte Graham est indisponible.
- Les 3 nouvelles entrées dans `metricExplanations.js` : `'Taux de Croissance Annuel'`, `'WACC'`, `'Multiple P/E Cible'`.
