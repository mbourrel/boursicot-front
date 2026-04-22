import { useState, useEffect, useRef } from 'react';

/**
 * Lance `fetchFn(signal)` et réessaie automatiquement jusqu'à `maxRetries` fois
 * avec un délai de `retryDelay` ms entre chaque tentative, si la requête échoue.
 * Typiquement utile quand le backend calcule en arrière-plan et met en cache :
 * la 1ère requête peut timeout, mais la 2ème touche le cache.
 */
export function useRetryFetch(fetchFn, { maxRetries = 3, retryDelay = 5000 } = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Garde une ref stable sur fetchFn pour éviter des boucles si la fn change
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer = null;

    const run = (attemptIndex) => {
      setLoading(true);
      setError(null);

      fetchRef.current(controller.signal)
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          if (attemptIndex < maxRetries) {
            // Réessai automatique après retryDelay ms
            setAttempt(attemptIndex + 1);
            retryTimer = setTimeout(() => run(attemptIndex + 1), retryDelay);
          } else {
            setError(err.message);
            setLoading(false);
          }
        });
    };

    run(0);

    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxRetries, retryDelay]);

  return { data, loading, error, attempt };
}
