const COLOR_UP      = '#26a69a';
const COLOR_NEUTRAL = '#ff9800';

export const PILLARS = [
  {
    key: 'health',
    icon: '❤️',
    title: 'Santé Financière',
    color: COLOR_UP,
    metrics: [
      { name: 'Marge Nette',           desc: "Indique la part de profit réel sur chaque euro vendu." },
      { name: 'ROE',                   desc: "Capacité de l'entreprise à générer du profit avec l'argent des actionnaires." },
      { name: 'Dette / Fonds Propres', desc: "Mesure si l'entreprise utilise trop d'emprunts par rapport à son propre capital." },
      { name: 'Ratio de Liquidité',    desc: 'Capacité à payer ses factures et dettes urgentes sans difficulté.' },
    ],
  },
  {
    key: 'valuation',
    icon: '📊',
    title: 'Valorisation',
    color: '#2962FF',
    metrics: [
      { name: 'PER vs secteur', desc: "Compare le prix de l'action aux bénéfices. Un PER bas peut indiquer une action bon marché." },
      { name: 'Forward PE',     desc: "Estimation du prix par rapport aux bénéfices attendus l'année prochaine." },
    ],
  },
  {
    key: 'growth',
    icon: '📈',
    title: 'Croissance',
    color: COLOR_NEUTRAL,
    metrics: [
      { name: "Chiffre d'Affaires", desc: "Évolution de l'activité commerciale sur les 5 dernières années." },
      { name: 'Bénéfices (EPS)',    desc: "Capacité de l'entreprise à faire progresser ses profits réels." },
    ],
  },
  {
    key: 'dividend',
    icon: '💰',
    title: 'Dividende',
    color: '#26a69a',
    metrics: [
      { name: 'Payout Ratio',           desc: "Ratio optimal entre 40 % et 60 % : l'entreprise rémunère ses actionnaires tout en conservant des ressources pour investir." },
      { name: 'Rendement Div. (yield)', desc: "Mesure la générosité et la sécurité du versement aux actionnaires comparé à la moyenne du secteur." },
    ],
  },
  {
    key: 'momentum',
    icon: '⚡',
    title: 'Momentum',
    color: '#ff9800',
    metrics: [
      { name: 'Prix vs MM50',       desc: "Indique si l'action évolue au-dessus de sa moyenne mobile court terme (50 jours) — signal haussier." },
      { name: 'Prix vs MM200',      desc: "Indicateur de tendance long terme. Un prix au-dessus de la MM200 reflète une dynamique structurellement positive." },
      { name: 'Golden/Death Cross', desc: "Croisement MM50/MM200 : Golden Cross (MM50 > MM200) = signal haussier fort ; Death Cross = signal baissier." },
    ],
  },
  {
    key: 'efficiency',
    icon: '⚙️',
    title: 'Efficacité',
    color: '#ab47bc',
    metrics: [
      { name: 'ROE vs secteur',         desc: "Évalue la capacité du management à générer du rendement avec les fonds propres, comparé aux pairs." },
      { name: 'Marge Nette vs secteur', desc: "Mesure la rentabilité commerciale de l'entreprise par rapport à la concurrence." },
      { name: 'Tendance marge (5 ans)', desc: "Évalue si le management améliore ou dégrade la capacité à transformer chaque euro de CA en profit net sur la durée." },
    ],
  },
];
