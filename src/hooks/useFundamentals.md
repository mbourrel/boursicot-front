# useFundamentals.js

## Rôle
Hook React chargeant en parallèle les données fondamentales d'un ou plusieurs tickers via l'API, avec gestion des erreurs par ticker.

## Dépendances
- **Internes** : `../api/fundamentals` (fetchFundamentals)
- **Externes** : `react` (useState, useEffect)

## Fonctionnement
- Prend un tableau `symbols` de tickers.
- Crée une clé de dépendance `key = symbols.join(',')` pour déclencher le rechargement à chaque changement de la liste.
- Lance `Promise.all` sur tous les tickers en parallèle : chaque fetchFundamentals est individuel avec un `AbortController` partagé.
- Les résultats sont accumulés dans `dataMap` (ticker → data) et `errors` (ticker → true si échec).
- Cleanup : `controller.abort()` au démontage ou avant le prochain effet.

## Utilisé par
`Fundamentals.jsx`

## Props / API
**Paramètre** : `symbols` — `string[]`

**Retour** :
| Clé | Type | Description |
|---|---|---|
| `dataMap` | object | `{ [ticker]: fundamentalsData }` |
| `loading` | boolean | `true` pendant le chargement |
| `errors` | object | `{ [ticker]: true }` pour les tickers en erreur |

## Points d'attention
- Un seul `AbortController` est partagé pour tous les fetches en parallèle — l'annulation annule toutes les requêtes.
- Si un ticker échoue, les autres sont quand même retournés dans `dataMap`.
- `setLoading(false)` est appelé uniquement quand TOUS les fetches sont terminés (success ou error).
