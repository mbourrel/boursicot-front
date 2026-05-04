# components/fundamentals/MetricHistoryModal.jsx

## Rôle
Modal affichant l'évolution historique d'une métrique fondamentale sur 4 années, sous forme de graphique en barres ou en ligne, avec comparaison à la moyenne sectorielle.

## Dépendances
- **Hooks** : `useSectorHistory` (historique sectoriel — activé uniquement en mode Stratège)
- **Données** : `income_stmt_data`, `balance_sheet_data` ou `cashflow_data` de la company courante

## Fonctionnement
Reçoit le nom de la métrique et les valeurs annuelles en props. Affiche :
- Graphique SVG inline (barres ou ligne) avec les 4 dernières années
- Valeur sectorielle moyenne par année (si disponible via `useSectorHistory`)
- Delta year-over-year

## Utilisé par
- `FinancialStatement.jsx` — déclenchée par un clic sur une ligne du tableau financier.

## Points d'attention
- `useSectorHistory` n'est activé qu'en mode Stratège pour éviter un appel API superflu en mode Explorateur.
- Les années peuvent avoir des trous (`null`) si la donnée n'est pas disponible pour un exercice donné.
