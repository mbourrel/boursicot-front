# SourceTag.jsx

## Rôle
Composant utilitaire minimaliste : affiche en bas à droite d'un widget la source des données.

## Dépendances
- Aucune dépendance interne ou externe.

## Fonctionnement
Rend un `<div>` stylé avec le texte `"Source : {label}"` en bas à droite, en police 10px, gris atténué (`var(--text3)`), opacité 65%.

## Utilisé par
Pratiquement tous les widgets : `TradingChart`, `SimpleChart`, `Fundamentals`, `EconomicClock`, `LiquidityMonitor`, `CentralBanksThermometer`, `YieldCurveChart`, `SovereignSpreadsChart`, `AssetWindMatrix`.

## Props / API
| Prop | Type | Description |
|---|---|---|
| `label` | string | Texte de la source (ex: `"Yahoo Finance · FMP (prix live)"`) |

## Points d'attention
- Le style est défini comme constante `S` en dehors du composant (pas de re-création à chaque rendu).
- N'utilise pas de variables d'état ni de hooks — composant purement présentationnel.
