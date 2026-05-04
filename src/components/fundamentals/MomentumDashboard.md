# components/fundamentals/MomentumDashboard.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Affiche les indicateurs de momentum d'un actif : MM50, MM200, Performance 1 an, positionnement du prix par rapport aux moyennes mobiles, et signal Golden/Death Cross.

## Dépendances
- **Données** : `risk_market` JSON depuis `GET /api/fundamentals/{ticker}` (champs MM50, MM200, Performance 1an, Prix Actuel)
- **Contexte** : `useCurrency` (conversion devise), `useTheme`

## Fonctionnement
Lit les champs `MM50`, `MM200`, `Prix Actuel` et `Performance 1an` dans le JSON `risk_market` de la company. Ces valeurs sont mises à jour par `seed_live_prices` 2×/jour (via `_update_risk_market` + `flag_modified`).

Calcule et affiche :
- Position du prix vs MM50 et MM200 (au-dessus/en-dessous, en %)
- Signal de croix dorée (MM50 > MM200) ou croix de la mort (MM50 < MM200)
- Performance 1 an depuis yfinance

## Utilisé par
- `SoloView.jsx` — section momentum dans la vue solo (stocks non-cotés : crypto, indices, commodités).

## Points d'attention
- Les valeurs MM50/MM200 peuvent être `null` si l'historique yfinance est insuffisant (< 50 ou < 200 jours).
- `Prix Actuel` dans `risk_market` est synchronisé avec `live_price` par `seed_live_prices` — les deux valeurs doivent être cohérentes.
