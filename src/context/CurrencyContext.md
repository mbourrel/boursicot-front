# CurrencyContext.jsx

## Rôle
Contexte React gérant la devise d'affichage des données financières (`LOCAL`, `EUR`, `USD`) et les taux de change en temps réel.

## Dépendances
- **Internes** : `../hooks/useExchangeRates`
- **Externes** : `react` (createContext, useContext, useState)

## Fonctionnement
- `CurrencyProvider` : wraps les enfants et expose via le contexte :
  - `targetCurrency` : devise cible sélectionnée par l'utilisateur (défaut `'LOCAL'`).
  - `setTargetCurrency` : setter.
  - `rates` : objet `{ EURUSD, GBPUSD, ... }` chargé via `useExchangeRates`.
  - `updatedAt` : timestamp ISO de la dernière mise à jour des taux.
- `useCurrency()` : hook de consommation du contexte avec guard (erreur si utilisé hors `CurrencyProvider`).

## Utilisé par
- `index.jsx` (provider wrappant l'app)
- `Header.jsx` (toggle de devise + date des taux)
- `Fundamentals.jsx` (formatage des valeurs monétaires)

## Props / API
### `CurrencyProvider`
| Prop | Type | Description |
|---|---|---|
| `children` | ReactNode | Arbre React enfant |

### `useCurrency()` — valeurs exposées
| Clé | Type | Description |
|---|---|---|
| `targetCurrency` | `'LOCAL'\|'EUR'\|'USD'` | Devise cible actuelle |
| `setTargetCurrency` | function | Change la devise |
| `rates` | object\|null | Taux de change `{ EURUSD, GBPUSD, ... }` |
| `updatedAt` | string\|null | Date ISO de mise à jour des taux |

## Points d'attention
- En mode `LOCAL`, aucune conversion n'est effectuée — `formatFinancialValue` affiche la devise source du ticker.
- `rates` peut être `null` si l'API échoue : `formatFinancialValue` retombe sur la devise locale sans erreur.
- Le contexte ne gère pas l'erreur de chargement des taux — l'échec est silencieux (warn en console).
