export const LOWER_IS_BETTER = new Set([
  'PER', 'Forward PE', 'Price to Book', 'EV / EBITDA', 'PEG Ratio',
  'Dette/Fonds Propres', 'Actions Shortées',
]);

export const NEUTRAL_METRICS = new Set([
  'Capitalisation', 'Beta', 'Plus Haut 52w', 'Plus Bas 52w',
]);

export const METRIQUES_REINES = [
  { cat: 'market_analysis',  name: 'PER',                 label: 'Valorisation' },
  { cat: 'financial_health', name: 'Marge Nette',         label: 'Rentabilité'  },
  { cat: '_dividends',       name: 'Rendement Div.',      label: 'Dividende'    },
  { cat: 'financial_health', name: 'Dette/Fonds Propres', label: 'Endettement'  },
  { cat: 'income_growth',    name: 'Croissance CA',       label: 'Croissance'   },
];
