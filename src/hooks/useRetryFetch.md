# useRetryFetch.js

## Rôle
Hook générique de fetch avec retry automatique à délai fixe — conçu pour les endpoints qui calculent en arrière-plan (ex : macro FRED).

## Dépendances
- React `useState`, `useEffect`, `useRef`

## Fonctionnement
Lance `fetchFn(signal)` et réessaie jusqu'à `maxRetries` fois avec `retryDelay` ms entre chaque tentative. Utilise une `ref` sur `fetchFn` pour stabiliser l'effet (évite les boucles infinies si la fonction change à chaque render).

- `maxRetries` défaut : 3
- `retryDelay` défaut : 5000ms (5s)
- Retourne `{ data, loading, error, attempt }`

Cas typique : la première requête `/macro/cycle` peut timeout si FRED est en cours de calcul. La 2ème touche le cache PostgreSQL.

## Utilisé par
- `useMacro.js` — cycle + liquidity (4 retries, 5s)
- `useRates.js` — taux directeurs (4 retries, 5s)

## Points d'attention
- Ne pas utiliser pour les endpoints rapides (fundamentals, prices) — ajoute une latence perçue inutile
- `AbortController` + `clearTimeout` propres au unmount : pas de memory leak
