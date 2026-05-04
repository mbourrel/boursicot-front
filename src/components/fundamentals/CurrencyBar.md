# fundamentals/CurrencyBar.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Sélecteur de devise LOCAL / EUR / USD aligné à droite, affiché en tête de chaque vue fondamentale. Autonome : appelle directement `useCurrency()` sans recevoir de props.

## Dépendances
- **Contextes** : `CurrencyContext` (`targetCurrency, setTargetCurrency, updatedAt`)
- **Utilitaires** : `captureEvent` (analytics)
- **Externes** : aucune

## Fonctionnement
- 3 boutons inline dans un groupe (style pill) : LOCAL, EUR, USD.
- Le bouton actif (`targetCurrency === cur`) est mis en évidence en bleu `#2962FF`.
- Chaque clic appelle `captureEvent('currency_changed', { currency })` puis `setTargetCurrency`.
- La date de mise à jour du taux (`updatedAt`) s'affiche en 9px si `targetCurrency !== 'LOCAL'` et `updatedAt` est non-null.

## Utilisé par
- `SoloView.jsx` — en tête de chaque branche de retour (Explorateur et Stratège)
- `ComparisonView.jsx` — en tête de la vue comparaison

## Points d'attention
- Extrait de `Fundamentals.jsx` le 2026-05-04 — était précédemment défini comme constante JSX (`currencyBar`) à l'intérieur du composant.
- Le toggle devise est délibérément dans la vue Fondamentaux et non dans le Header global — déplacement effectué le 2026-05-03 pour éviter le layout shift entre vues (voir architecture.md §7).
