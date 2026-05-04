# components/chart/DrawingToolbar.jsx

## Rôle
Barre d'outils de dessin pour le `TradingChart`. Permet d'ajouter des annotations manuelles sur le graphique OHLCV : lignes de tendance, rectangles, niveaux horizontaux.

## Dépendances
- **Parent** : `TradingChart.jsx` (passe la référence au chart instance lightweight-charts)

## Fonctionnement
Expose des boutons d'outil (ligne, rectangle, niveau horizontal, gomme). L'outil actif est mémorisé localement. La logique de dessin est déléguée à lightweight-charts via les handlers `onClick` sur le canvas du chart.

## Utilisé par
- `TradingChart.jsx`

## Points d'attention
- Les dessins ne sont pas persistés — ils disparaissent au rechargement de la page.
- lightweight-charts 5.x a changé l'API de dessin vs 4.x — vérifier la compatibilité si la lib est mise à jour.
