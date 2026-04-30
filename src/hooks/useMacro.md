# useMacro.js

## Rôle
Hook React chargeant toutes les données macro (cycle économique, historique des phases, liquidité) en un seul appel, avec mécanisme de retry automatique.

## Dépendances
- **Internes** : `./useRetryFetch`, `../api/macro` (fetchMacroAll)
- **Externes** : aucune

## Fonctionnement
- Délègue à `useRetryFetch(fetchMacroAll, { maxRetries: 4, retryDelay: 5000 })`.
- `fetchMacroAll` fait 3 appels en parallèle (`/macro/cycle`, `/macro/cycle/history`, `/macro/liquidity`) et retourne un objet `{ cycle, history, liquidity }`.
- Déstructure le résultat et expose des clés nommées avec fallback `null`.

## Utilisé par
`MacroEnvironment.jsx`

## Props / API
Aucun paramètre.

**Retour** :
| Clé | Type | Description |
|---|---|---|
| `cycleData` | object\|null | `{ phase, growth_yoy, inflation_yoy, growth_trend, inflation_trend }` |
| `cycleHistory` | array\|null | `[{ date, phase, growth_yoy }]` depuis 1948 |
| `liquidityData` | object\|null | `{ dates, m2_normalized, btc_normalized }` |
| `loading` | boolean | `true` pendant les tentatives |
| `error` | string\|null | Message d'erreur après épuisement des tentatives |

## Points d'attention
- Le backend FastAPI calcule ces données en arrière-plan au premier appel et les met en cache. Les premières tentatives peuvent donc timeout — d'où les 4 retries de 5s.
- Si `fetchMacroAll` réussit partiellement (un des 3 appels internes échoue), l'erreur remonte et déclenche un retry global.
