# MacroEnvironment.jsx

## Rôle
Page "Macro" : agrège et dispose verticalement tous les widgets macroéconomiques en une seule vue scrollable.

## Dépendances
- **Internes** : `./EconomicClock`, `./LiquidityMonitor`, `./AssetWindMatrix`, `./CentralBanksThermometer`, `./YieldCurveChart`, `./SovereignSpreadsChart`, `../hooks/useMacro`, `../hooks/useRates`
- **Externes** : aucune lib externe directe

## Fonctionnement
- Charge les données macro en deux appels hooks :
  - `useMacro()` → `cycleData` (phase, YoY croissance/inflation, tendances), `cycleHistory` (historique depuis 1948), `liquidityData` (M2 + BTC normalisés).
  - `useRates()` → `ratesData` (taux directeurs banques centrales, courbe des taux, spreads souverains historiques, yields obligataires).
- Les deux hooks utilisent `useRetryFetch` avec 4 tentatives espacées de 5 secondes (backend potentiellement en démarrage à froid).
- Distribue les données en props à chaque widget enfant. Chaque widget gère lui-même ses états de chargement et d'erreur.
- Bannière descriptive en haut de la page.

## Utilisé par
`App.jsx` (Dashboard, vue `macro`)

## Props / API
Aucune prop externe.

## Points d'attention
- `MacroEnvironment` ne gère pas lui-même les erreurs globales : chaque widget enfant affiche son propre message d'erreur/chargement.
- Si `useMacro` et `useRates` échouent après les 4 tentatives, les props passées aux widgets sont `null`/`undefined` → les widgets doivent gérer le cas `null`.
- Le layout est une simple colonne flex avec `gap: 16px` — ajouter un widget = ajouter une ligne ici et son hook de données correspondant.
