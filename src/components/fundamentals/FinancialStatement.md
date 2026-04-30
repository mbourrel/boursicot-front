# FinancialStatement.jsx

## Rôle
Tableau financier historique (compte de résultat, bilan, flux de trésorerie, dividendes) avec colonnes annuelles, moyenne sectorielle, flèche de tendance YoY et bouton d'historique détaillé par ligne.

## Dépendances
- **Internes** : `./MetricInfo`, `./MetricHistoryModal`
- **Externes** : `react` (useState)

## Fonctionnement
- Reçoit `stmtData = { years: string[], items: [{ name, vals, unit }] }`.
- Retourne `null` si `stmtData?.items` est vide.
- Affiche jusqu'à 4 colonnes annuelles (les plus récentes en premier).
- **Colonne "Moy. Secteur"** : visible si `stmtAvg` est fourni. Coloration verte si `mostRecentVal >= avgVal`, rouge sinon.
- **Flèche de tendance** : calculée sur la colonne la plus récente vs la précédente (N vs N-1). Affichée en ▲/▼ avec % de variation.
- **Bouton ↗** : visible si l'item a un historique (> 1 année dans `years` ou données dans `stmtAvgHistory`). Ouvre `MetricHistoryModal` via `setModal({ item })`.
- Lignes alternées fond clair/foncé (`--bg1` / `--bg2`).

## Utilisé par
`Fundamentals.jsx` (vue solo, sections 7-10)

## Props / API
| Prop | Type | Description |
|---|---|---|
| `title` | string | Titre du tableau (ex: "7. Compte de Résultat — Historique") |
| `stmtData` | object | `{ years, items }` |
| `fmt` | function | Formateur devise-aware `(val, unit) → string\|JSX` |
| `stmtAvg` | object | `{ [name]: avgVal }` — moyennes sectorielles par ligne |
| `stmtAvgHistory` | object | `{ [name]: { [year]: avgVal } }` — historique des moyennes sectorielles |
| `companyName` | string | Nom de l'entreprise (passé à `MetricHistoryModal`) |

## Points d'attention
- `cols = years.slice(0, 4)` : limite à 4 colonnes même si le backend renvoie plus d'années.
- Le `modal` state stocke `{ item }` — `MetricHistoryModal` reçoit les données brutes de l'item et les mappe lui-même.
- `hasHistory` est un bool : `years.length > 1 || stmtAvgHistory[item.name] a ≥ 2 entrées`. Si faux, le bouton ↗ est masqué.
- `overflowX: auto` sur le wrapper du tableau pour la compatibilité mobile.
