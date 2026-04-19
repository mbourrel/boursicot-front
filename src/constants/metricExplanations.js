// Explications affichées au survol du bouton ⓘ sur chaque métrique financière.
// Clé = nom affiché dans l'UI (tel que stocké en base).

const EXPLANATIONS = {
  // ── Analyse de marché ────────────────────────────────────────────────────
  'Capitalisation':
    "Valeur totale de l'entreprise en bourse (cours × nombre d'actions). Donne une idée de la taille de la société : < 2 Md$ = small cap, 2-10 Md$ = mid cap, > 10 Md$ = large cap.",
  'PER':
    "Price/Earnings. Combien les investisseurs paient pour €1 de bénéfice. Élevé (> 25) = marché anticipe forte croissance. Bas (< 12) = valeur décotée ou secteur cyclique. À comparer avec la moyenne du secteur.",
  'Rendement Div':
    "Dividende annuel rapporté au cours. Ex : 3% = l'action verse 3€ pour 100€ investis. Intéressant pour les revenus passifs, mais un rendement trop élevé peut signaler une entreprise en difficulté.",

  // ── Santé financière ─────────────────────────────────────────────────────
  'Marge Nette':
    "% du chiffre d'affaires qui devient bénéfice net après toutes les charges. Une marge nette de 20% signifie que sur 100€ de ventes, 20€ sont du profit pur.",
  'ROE':
    "Return on Equity. Bénéfice net / Capitaux propres. Mesure l'efficacité avec laquelle la direction utilise l'argent des actionnaires. > 15% est généralement bon. Warren Buffett cible des ROE > 20%.",
  'Dette/Fonds Propres':
    "Total des dettes / Capitaux propres. < 50% = peu endetté, entre 50-150% = modéré, > 200% = risque élevé. Très variable selon les secteurs (les banques ont des ratios naturellement élevés).",

  // ── Valorisation avancée ─────────────────────────────────────────────────
  'Forward PE':
    "PER calculé sur les bénéfices anticipés par les analystes (exercice suivant). Plus fiable que le PER historique pour évaluer les perspectives réelles de l'entreprise.",
  'Price to Book':
    "Cours / Valeur comptable par action. < 1 = l'action vaut moins que ses actifs nets (potentiellement sous-évaluée). > 3 = prime de marché importante. Très utilisé pour les banques.",
  'EV / EBITDA':
    "Valeur d'entreprise / EBITDA. Permet de comparer des sociétés indépendamment de leur structure de capital et de leur fiscalité. 8-12x est souvent considéré comme raisonnable selon le secteur.",
  'PEG Ratio':
    "PER / Taux de croissance des bénéfices. Un PEG < 1 suggère que la croissance n'est pas encore intégrée dans le cours. Inventé par Peter Lynch pour trouver des \"growth at reasonable price\".",

  // ── Compte de résultat & croissance ─────────────────────────────────────
  "Chiffre d'Affaires":
    "Revenus totaux générés par l'activité principale de l'entreprise. La \"ligne du haut\" du compte de résultat.",
  'EBITDA':
    "Earnings Before Interest, Taxes, Depreciation & Amortization. Proxy du flux de trésorerie opérationnel, souvent utilisé pour valoriser une entreprise ou comparer des acteurs d'un même secteur.",
  'Croissance CA':
    "Variation annuelle du chiffre d'affaires. Indique le dynamisme commercial. > 10%/an = forte croissance. Négatif = contraction de l'activité.",
  'Croissance Bénéfices':
    "Variation annuelle des bénéfices nets. Une croissance des bénéfices supérieure à celle du CA indique une amélioration de la rentabilité et de l'efficacité opérationnelle.",

  // ── Bilan & liquidité ────────────────────────────────────────────────────
  'Trésorerie Totale':
    "Cash et équivalents de trésorerie disponibles immédiatement. Un coussin de sécurité essentiel pour traverser les crises ou saisir des opportunités d'acquisition.",
  'Free Cash Flow':
    "Flux de trésorerie opérationnel - CapEx. L'argent \"libre\" réellement généré. C'est lui qui finance les dividendes, les rachats d'actions et la croissance future. Plus fiable que le bénéfice net.",
  'Ratio Liquidité':
    "Actifs courants / Passifs courants. > 1 = l'entreprise peut couvrir ses dettes à court terme. < 1 = risque de problème de trésorerie à court terme.",

  // ── Risque & marché ──────────────────────────────────────────────────────
  'Beta':
    "Mesure la sensibilité de l'action aux mouvements du marché. Beta = 1 : suit le marché. > 1 : plus volatil (amplifie les hausses ET les baisses). < 1 : moins volatil. Négatif : évolue à contre-courant.",
  'Plus Haut 52w':
    "Plus haut cours atteint sur les 52 dernières semaines. Permet de situer le cours actuel par rapport à son récent sommet.",
  'Plus Bas 52w':
    "Plus bas cours atteint sur les 52 dernières semaines. Permet d'évaluer le potentiel de rebond ou la résistance du titre dans les crises.",
  'Actions Shortées':
    "% du flottant vendu à découvert par des investisseurs pariant sur une baisse. > 10% = fort intérêt baissier. Peut créer un \"short squeeze\" violent si le cours monte.",

  // ── Bilan comptable historique ───────────────────────────────────────────
  'Actif Total':
    "Ensemble des ressources possédées par l'entreprise : immobilisations (usines, brevets) + actifs courants (stocks, créances, cash). Le total du côté \"emplois\" du bilan.",
  'Passif Total':
    "Ensemble des dettes et obligations envers des tiers (banques, fournisseurs, obligations). Le total du côté \"ressources\" hors capitaux propres.",
  'Capitaux Propres':
    "Actif Total - Passif Total. Ce qui appartient réellement aux actionnaires. Aussi appelé \"valeur nette comptable\" ou \"book value\". La croissance des capitaux propres reflète la création de valeur.",
  'Dette Totale':
    "Somme de toutes les dettes financières (court + long terme). À comparer à l'EBITDA : un ratio Dette/EBITDA > 4x est souvent considéré comme élevé.",
  'Dette Long Terme':
    "Emprunts et obligations à rembourser au-delà d'un an. Finance les investissements structurels. Une dette LT stable ou en baisse est un signe de désendettement.",
  'Actif Courant':
    "Actifs convertibles en cash en moins d'un an : trésorerie, créances clients, stocks. L'actif courant doit idéalement dépasser le passif courant (ratio de liquidité > 1).",
  'Passif Courant':
    "Dettes exigibles en moins d'un an : fournisseurs, portion CT des emprunts, dettes fiscales. Un passif courant trop élevé par rapport à l'actif courant est un signal de vigilance.",
  'Trésorerie & Équivalents':
    "Cash disponible immédiatement et placements très court terme (bons du Trésor < 3 mois). La réserve de liquidité immédiate de l'entreprise.",
  'Créances Clients':
    "Montants dus par les clients pour des livraisons ou services déjà effectués mais pas encore encaissés. Une augmentation peut signaler des problèmes de recouvrement.",
  'Stocks':
    "Valeur des matières premières, produits en cours et produits finis. Des stocks qui gonflent peuvent indiquer des difficultés de vente ou une préparation à une hausse d'activité.",
  'Goodwill':
    "Survaleur payée lors d'acquisitions par rapport à la valeur comptable des actifs acquis. Représente la marque, les clients, les synergies attendues. Peut être déprécié si l'acquisition déçoit.",
  'Bénéfices Non Distribués':
    "Cumul historique des bénéfices réinvestis dans l'entreprise (non versés en dividendes). Une accumulation régulière témoigne d'une création de valeur sur le long terme.",
  'Immobilisations Nettes':
    "Valeur nette des actifs physiques (usines, machines, équipements) après déduction des amortissements cumulés. Reflète la capacité productive de l'entreprise.",
  'Besoin en Fonds de Roulement':
    "Capital nécessaire pour financer le cycle opérationnel (stocks + créances clients - dettes fournisseurs). Un BFR négatif (rare) signifie que l'entreprise se finance via ses clients.",

  // ── Compte de résultat historique ────────────────────────────────────────
  'Coût des Ventes':
    "Coûts directement liés à la production : matières premières, main-d'œuvre directe, amortissement des machines. Soustrait du CA pour obtenir le bénéfice brut.",
  'Bénéfice Brut':
    "CA - Coût des Ventes. La marge brute (Bénéfice Brut / CA) est un indicateur clé de l'efficacité productive. > 40% est souvent associé à un avantage concurrentiel durable.",
  'Résultat Opérationnel (EBIT)':
    "Bénéfice avant intérêts et impôts. Mesure la performance pure de l'activité, avant l'effet de levier financier et la fiscalité. C'est le vrai \"profit du métier\".",
  'Résultat Net':
    "Le bénéfice final après toutes les charges : opérationnelles, financières et fiscales. La \"ligne du bas\". Sert au calcul du BPA et potentiellement aux dividendes.",
  'BPA Basique':
    "Bénéfice par Action basique = Résultat Net / Nombre d'actions en circulation. Mesure combien chaque action \"gagne\" sur l'exercice.",
  'BPA Dilué':
    "Bénéfice par Action dilué = Résultat Net / (Actions + options + convertibles potentiels). Plus conservateur que le BPA basique car tient compte de la dilution potentielle.",
  'Charges Financières':
    "Intérêts payés sur les dettes. À comparer au résultat opérationnel pour évaluer la charge de la dette. Un ratio Charges Financières / EBIT > 30% peut être préoccupant.",
  'Impôt sur les Bénéfices':
    "Charge fiscale effective de l'exercice. Le taux d'imposition effectif (Impôts / Résultat avant impôts) peut varier significativement selon la structure fiscale de la société.",
  'Recherche & Développement (R&D)':
    "Investissements dans l'innovation et les nouveaux produits. Charge P&L mais aussi investissement dans la compétitivité future. Crucial dans la tech, la pharma et l'industrie.",
  'Frais Généraux & Admin. (SG&A)':
    "Selling, General & Administrative. Coûts de vente, marketing et administration. À surveiller : une hausse plus rapide que le CA érode la rentabilité.",

  // ── Flux de trésorerie historique ────────────────────────────────────────
  'Flux de Trésorerie Opérationnel':
    "Cash réellement généré par l'activité principale, après ajustements non-cash. Considéré comme le vrai indicateur de santé d'une entreprise, car difficile à manipuler contrairement au bénéfice net.",
  'Dépenses d\'Investissement (CapEx)':
    "Cash dépensé pour acquérir ou entretenir des actifs physiques. Négatif par convention. Un CapEx / CA élevé indique un secteur capitalistique. CapEx > Flux opérationnel = l'entreprise brûle du cash.",
  'Flux d\'Investissement Total':
    "Cash total utilisé pour les investissements et acquisitions. Inclut le CapEx, les achats de titres de participation et les acquisitions d'entreprises. Généralement négatif.",
  'Flux de Financement Total':
    "Cash lié aux opérations financières : nouveaux emprunts, remboursements, émissions d'actions, dividendes, rachats d'actions. Négatif = l'entreprise rend de l'argent aux apporteurs de capitaux.",
  'Dividendes Versés':
    "Cash distribué aux actionnaires sous forme de dividendes. Négatif par convention dans le tableau des flux. À comparer au FCF pour évaluer la soutenabilité du dividende.",
  'Rachats d\'Actions':
    "Cash utilisé pour racheter les propres actions de l'entreprise sur le marché. Réduit le nombre d'actions, ce qui augmente mécaniquement le BPA. Alternative aux dividendes, souvent fiscalement avantageuse.",
  'Amortissements (D&A)':
    "Charge comptable non-cash liée à l'usure des actifs (immobilisations). Réduit le bénéfice net mais pas la trésorerie. Réintégrée dans le flux opérationnel. Amortissements élevés = secteur capitalistique.",
  'Variation du BFR':
    "Impact du cycle d'exploitation sur la trésorerie. Négatif = le BFR augmente (croissance de l'activité consomme du cash). Positif = compression du BFR (libère du cash).",
};

export default EXPLANATIONS;
