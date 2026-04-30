# CentralBanksThermometer.jsx

## Rôle
Widget "Thermomètre de l'Économie" : affiche les taux directeurs des 4 grandes banques centrales (Fed, BCE, BoE, BoJ) sous forme de jauges colorées et de badges d'interprétation.

## Dépendances
- **Internes** : `./SourceTag`
- **Externes** : `react` (useState)

## Fonctionnement

### `rateColor(rate)` / `rateLabel(rate)`
Fonctions utilitaires qui mappent le taux directeur à une couleur et un label selon les seuils : < 1% = bleu (Accommodant), 1–3% = vert (Neutre), 3–5% = ambre (Restrictif), > 5% = rouge (Très restrictif).

### `GaugeBar`
Barre horizontale proportionnelle au taux sur une échelle 0–8%, avec couleur dynamique.

### `BankRow`
Ligne de tableau pour une banque centrale :
- Drapeau emoji + nom (colonne 1)
- `GaugeBar` (colonne 2)
- Taux numérique (colonne 3)
- Badge label (colonne 4)
- Indicateur `stale` : si la donnée est ancienne, affiche un avertissement en ambre et préfixe le label de `~`.

### `CentralBanksThermometer` (composant principal)
- Itère sur `centralBanks` (array) et rend un `BankRow` par banque.
- Panneau info rétractable (`showInfo`) : explique les 4 zones de taux avec contexte (post-COVID, BCE vs Fed, BoJ).
- Légende des 4 zones en haut à droite.
- Échelle numérique 0–8% sous les lignes.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
| Prop | Type | Description |
|---|---|---|
| `centralBanks` | array | `[{ name, rate, last_update, stale }]` |
| `loading` | boolean | Affiche "Chargement…" |
| `error` | string | Affiche le message en rouge |

## Points d'attention
- Les drapeaux sont des emojis mappés par nom de banque — si un nouveau nom est ajouté depuis le backend, le flag par défaut est `🏦`.
- `stale` provient du backend (données non rafraîchies récemment) : l'affichage change visuellement (opacité réduite, badge ambre avec `~`).
- Le composant est exporté en `export default` (pas en named export).
