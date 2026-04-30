# usePrices.js

## Rôle
Hook React chargeant les données de prix OHLCV d'un ticker pour un intervalle donné.

## Dépendances
- **Internes** : `../api/prices` (fetchPrices)
- **Externes** : `react` (useState, useEffect)

## Fonctionnement
- S'arrête si `ticker` est falsy.
- Crée un `AbortController` par effet pour annuler le fetch si le ticker ou l'intervalle changent.
- Gère `loading`, `error` et `data` (tableau de candles OHLCV).
- Les `AbortError` sont silencieusement ignorées.

## Utilisé par
Importé dans l'app mais non utilisé directement par les graphiques principaux (`TradingChart` et `SimpleChart` font leurs propres fetches en local). Disponible pour d'éventuels usages futurs.

## Props / API
**Paramètres** : `ticker` (string), `interval` (string : `'15m'`, `'1h'`, `'1D'`, `'1W'`)

**Retour** :
| Clé | Type | Description |
|---|---|---|
| `data` | array | Tableau de candles `{ time, open, high, low, close, volume }` |
| `loading` | boolean | `true` pendant le chargement |
| `error` | string\|null | Message d'erreur |

## Points d'attention
- `TradingChart` et `SimpleChart` n'utilisent pas ce hook — ils appellent `fetchPrices` directement pour garder le contrôle sur la gestion des séries lightweight-charts.
- Si `ticker` change, l'ancien fetch est annulé via `controller.abort()`.
