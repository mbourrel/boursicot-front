// Explications affichées au clic du bouton ⓘ sur chaque métrique financière.
// Format : { what: "C'est quoi ?", why: "Pourquoi est-ce important ?" }
// Clé = nom affiché dans l'UI (tel que stocké en base).

const EXPLANATIONS = {
  // ── Analyse de marché ────────────────────────────────────────────────────
  'Capitalisation': {
    what: "Valeur totale de l'entreprise en bourse : cours × nombre d'actions en circulation.",
    why:  "Indique la taille de la société. < 2 Md$ = small cap (plus risqué, plus de potentiel), > 10 Md$ = large cap (plus stable, moins de surprises).",
  },
  'PER': {
    what: "Rapport entre le prix de l'action et le bénéfice net par action. Indique combien vous payez pour €1 de profit.",
    why:  "Un PER élevé (> 25) signifie que le marché anticipe une forte croissance future. Un PER bas (< 12) peut signaler une action décotée ou un secteur cyclique. À toujours comparer à la **moyenne du secteur**.",
  },
  'Rendement Div': {
    what: "Pourcentage du prix de l'action reversé chaque année aux actionnaires en cash.",
    why:  "C'est votre 'loyer' d'investisseur. Un rendement régulier et stable est souvent le signe d'une entreprise mature. Attention : un rendement très élevé (> 8 %) peut signaler une entreprise en difficulté.",
  },

  // ── Santé financière ─────────────────────────────────────────────────────
  'Marge Nette': {
    what: "Pourcentage du chiffre d'affaires qui se transforme en bénéfice net après avoir payé toutes les charges.",
    why:  "C'est le juge de paix de l'efficacité. Une entreprise à 15 % de marge nette est souvent plus solide face aux crises qu'une entreprise à 2 %, qui n'a aucun coussin de sécurité.",
  },
  'ROE': {
    what: "Bénéfice net divisé par les capitaux propres. Mesure combien l'entreprise gagne pour chaque euro appartenant aux actionnaires.",
    why:  "Un ROE > 15 % est généralement bon. Warren Buffett cible des ROE > 20 % sur la durée. Un ROE faible indique que le management crée peu de valeur avec votre argent.",
  },
  'Dette/Fonds Propres': {
    what: "Compare ce que l'entreprise doit aux banques par rapport à ce qu'elle possède en propre.",
    why:  "Trop de dettes augmentent le risque de faillite, surtout quand les taux montent. Une entreprise peu endettée est plus libre de ses décisions et traverse mieux les crises.",
  },

  // ── Valorisation avancée ─────────────────────────────────────────────────
  'Forward PE': {
    what: "PER calculé sur les bénéfices attendus par les analystes pour l'exercice à venir.",
    why:  "Plus pertinent que le PER historique car orienté vers l'avenir. S'il est bien inférieur au PER actuel, le marché anticipe une forte hausse des profits.",
  },
  'Price to Book': {
    what: "Cours de l'action divisé par la valeur comptable par action (actifs nets).",
    why:  "Un ratio < 1 signifie que vous achetez l'entreprise sous sa valeur d'inventaire — potentiellement une aubaine ou un signal de méfiance du marché. Très utilisé pour les banques.",
  },
  'EV / EBITDA': {
    what: "Valeur totale de l'entreprise (dette incluse) rapportée à ses profits opérationnels bruts.",
    why:  "Permet de comparer des entreprises indépendamment de leur dette et de leur fiscalité. Un ratio de 8-12x est souvent raisonnable ; au-delà, l'action est chère.",
  },
  'PEG Ratio': {
    what: "PER divisé par le taux de croissance des bénéfices. Ajuste la valorisation à la dynamique de croissance.",
    why:  "Un PEG < 1 suggère que la croissance n'est pas encore reflétée dans le cours — une idée popularisée par Peter Lynch pour dénicher des 'growth at reasonable price'.",
  },

  // ── Compte de résultat & croissance ─────────────────────────────────────
  "Chiffre d'Affaires": {
    what: "Total des revenus générés par l'activité principale sur l'exercice. La 'ligne du haut' du compte de résultat.",
    why:  "La croissance du CA indique si l'entreprise gagne des parts de marché. Un CA stagnant ou en baisse est un signal d'alarme sur la compétitivité.",
  },
  'EBITDA': {
    what: "Résultat avant intérêts, impôts, dépréciation et amortissement. Proxy du flux de trésorerie opérationnel.",
    why:  "Utilisé pour comparer des entreprises d'un même secteur indépendamment de leur structure financière et fiscale. Un EBITDA croissant montre une amélioration de l'efficacité opérationnelle.",
  },
  'Croissance CA': {
    what: "Variation annuelle du chiffre d'affaires en pourcentage.",
    why:  "> 10 %/an = forte dynamique commerciale. Une croissance négative indique une contraction de l'activité — à surveiller sur plusieurs années pour distinguer une tendance d'un accident.",
  },
  'Croissance Bénéfices': {
    what: "Variation annuelle des bénéfices nets en pourcentage.",
    why:  "Si les bénéfices croissent plus vite que le CA, l'entreprise améliore son efficacité. L'inverse indique que les coûts s'envolent, ce qui érode la rentabilité.",
  },

  // ── Bilan & liquidité ────────────────────────────────────────────────────
  'Trésorerie Totale': {
    what: "Cash et équivalents disponibles immédiatement dans les caisses de l'entreprise.",
    why:  "Un coussin de sécurité essentiel pour traverser les crises, payer les salaires ou saisir des opportunités d'acquisition sans s'endetter.",
  },
  'Free Cash Flow': {
    what: "Cash généré par l'activité moins les investissements nécessaires au maintien de l'outil de production (CapEx).",
    why:  "C'est l'argent 'libre' et réel. C'est lui qui finance les dividendes, les rachats d'actions et la croissance future. Plus difficile à manipuler que le bénéfice net.",
  },
  'Ratio Liquidité': {
    what: "Actifs à court terme divisés par les dettes à court terme. Mesure la capacité à payer ses factures immédiates.",
    why:  "Un ratio > 1 signifie que l'entreprise peut faire face à ses obligations à court terme. < 1 = signal de vigilance sur un potentiel problème de trésorerie.",
  },

  // ── Risque & marché ──────────────────────────────────────────────────────
  'Beta': {
    what: "Mesure la sensibilité de l'action aux mouvements du marché global.",
    why:  "Beta = 1 : suit le marché. > 1 : amplifie les hausses ET les baisses (plus risqué, plus de potentiel). < 1 : amortit les chocs (actions défensives comme les utilities).",
  },
  'Plus Haut 52w': {
    what: "Plus haut cours atteint sur les 52 dernières semaines.",
    why:  "Permet de situer le cours actuel par rapport à son récent sommet. Un cours proche du plus haut indique une forte dynamique haussière.",
  },
  'Plus Bas 52w': {
    what: "Plus bas cours atteint sur les 52 dernières semaines.",
    why:  "Permet d'évaluer la résistance du titre en période de stress. Un cours proche du plus bas peut indiquer une opportunité d'achat — ou un problème fondamental.",
  },
  'Actions Shortées': {
    what: "Pourcentage du flottant vendu à découvert par des investisseurs qui parient sur une baisse du cours.",
    why:  "> 10 % = fort intérêt baissier, signe que des professionnels anticipent des difficultés. Peut aussi créer un 'short squeeze' violent si les vendeurs doivent racheter en urgence.",
  },

  // ── Bilan comptable historique ───────────────────────────────────────────
  'Actif Total': {
    what: "Ensemble des ressources possédées par l'entreprise : usines, brevets, stocks, créances et cash.",
    why:  "Donne la taille du bilan. Sa croissance indique que l'entreprise investit et se développe ; une baisse peut signaler une cession d'actifs ou une contraction.",
  },
  'Passif Total': {
    what: "Ensemble des dettes et obligations envers des tiers (banques, fournisseurs, obligataires).",
    why:  "À comparer à l'actif total et aux capitaux propres pour évaluer l'endettement global de l'entreprise et sa solidité structurelle.",
  },
  'Capitaux Propres': {
    what: "Ce qui appartient réellement aux actionnaires : actif total moins toutes les dettes.",
    why:  "C'est la 'valeur nette' de l'entreprise. Une croissance régulière des capitaux propres est un signal fort de création de richesse sur le long terme.",
  },
  'Dette Totale': {
    what: "Somme de toutes les dettes financières de l'entreprise (court terme + long terme).",
    why:  "Un ratio Dette / EBITDA > 4x est souvent considéré comme élevé. Une dette croissante sans hausse proportionnelle du résultat fragilise l'entreprise.",
  },
  'Dette Long Terme': {
    what: "Emprunts et obligations à rembourser au-delà d'un an.",
    why:  "Finance les investissements stratégiques. Une dette long terme stable ou en baisse indique que l'entreprise se désendette — signal positif.",
  },
  'Actif Courant': {
    what: "Actifs convertibles en cash en moins d'un an : trésorerie, créances clients, stocks.",
    why:  "Doit idéalement dépasser le passif courant pour garantir la solvabilité à court terme. Un actif courant faible peut signaler des tensions de trésorerie.",
  },
  'Passif Courant': {
    what: "Dettes exigibles en moins d'un an : fournisseurs, portion court terme des emprunts, charges à payer.",
    why:  "Un passif courant supérieur à l'actif courant (ratio < 1) est un signal de vigilance sur la capacité à honorer les paiements immédiats.",
  },
  'Trésorerie & Équivalents': {
    what: "Cash disponible immédiatement et placements très court terme (bons du Trésor < 3 mois).",
    why:  "La réserve de liquidité immédiate. Cruciale en période de crise — une entreprise avec beaucoup de cash peut saisir des opportunités quand les concurrents sont à court.",
  },
  'Créances Clients': {
    what: "Montants dus par les clients pour des livraisons déjà effectuées mais pas encore encaissées.",
    why:  "Une augmentation rapide des créances peut signaler des difficultés de recouvrement ou une politique commerciale trop laxiste avec les délais de paiement.",
  },
  'Stocks': {
    what: "Valeur des matières premières, produits en cours et produits finis détenus par l'entreprise.",
    why:  "Des stocks qui gonflent peuvent indiquer des difficultés à vendre — ou une préparation à une hausse d'activité. À analyser en tendance sur plusieurs trimestres.",
  },
  'Goodwill': {
    what: "Survaleur payée lors d'acquisitions, au-delà de la valeur comptable des actifs acquis.",
    why:  "Représente la marque, les clients et les synergies espérées. Peut être déprécié si l'acquisition déçoit — une dépréciation de goodwill pèse lourdement sur le résultat net.",
  },
  'Bénéfices Non Distribués': {
    what: "Cumul historique des bénéfices réinvestis dans l'entreprise (non versés en dividendes).",
    why:  "Une accumulation régulière sur de nombreuses années témoigne d'une création de valeur durable — c'est le signe d'une entreprise qui 'capitalise' sur ses succès.",
  },
  'Immobilisations Nettes': {
    what: "Valeur nette des actifs physiques (usines, machines, équipements) après amortissements cumulés.",
    why:  "Reflète la capacité productive. Un secteur avec de fortes immobilisations (industrie lourde) a besoin de plus de capital mais génère aussi des barrières à l'entrée.",
  },
  'Besoin en Fonds de Roulement': {
    what: "Capital nécessaire pour financer le cycle opérationnel : stocks + créances clients - dettes fournisseurs.",
    why:  "Un BFR en hausse consomme du cash même si l'entreprise est rentable. Un BFR négatif (grande distribution, abonnements) est un avantage concurrentiel rare.",
  },

  // ── Compte de résultat historique ────────────────────────────────────────
  'Coût des Ventes': {
    what: "Coûts directement liés à la production : matières premières, main-d'œuvre directe, amortissements machines.",
    why:  "Son rapport au CA donne la marge brute. Un coût des ventes en hausse plus rapide que le CA signale une pression sur la rentabilité (inflation, concurrence).",
  },
  'Bénéfice Brut': {
    what: "Chiffre d'affaires moins le coût des ventes. Mesure l'efficacité productive de base.",
    why:  "Une marge brute > 40 % est souvent associée à un avantage concurrentiel solide (marque, brevets, effet réseau). C'est la base sur laquelle se construit toute la rentabilité.",
  },
  'Résultat Opérationnel (EBIT)': {
    what: "Bénéfice avant intérêts et impôts. Mesure la performance pure de l'activité.",
    why:  "C'est le vrai 'profit du métier', avant l'effet de la dette et de la fiscalité. Idéal pour comparer deux entreprises du même secteur avec des structures financières différentes.",
  },
  'Résultat Net': {
    what: "Le bénéfice final après toutes les charges : opérationnelles, financières et fiscales.",
    why:  "La 'ligne du bas'. C'est ce qui peut être distribué en dividendes ou réinvesti. Attention : il peut être influencé par des éléments exceptionnels non récurrents.",
  },
  'BPA Basique': {
    what: "Bénéfice net divisé par le nombre d'actions en circulation. Mesure combien chaque action 'gagne'.",
    why:  "C'est la base du PER. Un BPA en hausse régulière sur 5-10 ans est un des meilleurs signaux d'une entreprise de qualité sur le long terme.",
  },
  'BPA Dilué': {
    what: "BPA calculé en tenant compte des options, bons de souscription et obligations convertibles potentiels.",
    why:  "Plus conservateur que le BPA basique. Si l'écart entre BPA basique et dilué est important, la dilution potentielle est un risque à surveiller pour les actionnaires.",
  },
  'Charges Financières': {
    what: "Intérêts payés sur les emprunts et obligations de l'entreprise.",
    why:  "Un ratio Charges Financières / EBIT > 30 % signifie que la dette 'mange' une part significative du profit opérationnel — fragilisant l'entreprise en cas de retournement.",
  },
  'Impôt sur les Bénéfices': {
    what: "Charge fiscale effective de l'exercice payée par l'entreprise.",
    why:  "Un taux d'imposition effectif très bas peut indiquer une optimisation fiscale agressive — pratique risquée si les régulations évoluent (OCDE, réforme mondiale).",
  },
  'Recherche & Développement (R&D)': {
    what: "Montant investi dans l'innovation, les nouveaux produits et la propriété intellectuelle.",
    why:  "Charge présente mais aussi investissement dans la compétitivité future. Crucial en tech et pharma — une R&D insuffisante peut condamner une entreprise à terme.",
  },
  'Frais Généraux & Admin. (SG&A)': {
    what: "Coûts de vente, marketing et frais administratifs (non liés à la production).",
    why:  "Une hausse des SG&A plus rapide que le CA est un signal d'alerte : les coûts de structure s'alourdissent et érodent la marge nette.",
  },

  // ── Flux de trésorerie historique ────────────────────────────────────────
  'Flux de Trésorerie Opérationnel': {
    what: "Cash réellement généré par l'activité principale, après ajustements pour les éléments non-cash.",
    why:  "Considéré comme l'indicateur de santé le plus fiable, car difficile à 'maquiller' contrairement au bénéfice net. Un FCF opérationnel négatif est préoccupant.",
  },
  "Dépenses d'Investissement (CapEx)": {
    what: "Cash dépensé pour acquérir ou entretenir les actifs physiques nécessaires à l'activité.",
    why:  "Un CapEx élevé signifie un secteur capitalistique (industrie, telecom). Si le CapEx dépasse le flux opérationnel, l'entreprise brûle du cash et dépend du financement externe.",
  },
  "Flux d'Investissement Total": {
    what: "Cash total utilisé pour les investissements, acquisitions et cessions d'actifs.",
    why:  "Généralement négatif (on dépense). Des acquisitions fréquentes et importantes sont risquées : elles intègrent du goodwill qui peut devoir être déprécié.",
  },
  'Flux de Financement Total': {
    what: "Cash lié aux opérations financières : emprunts, remboursements, émissions d'actions, dividendes.",
    why:  "Négatif = l'entreprise rend de l'argent aux investisseurs (dividendes, rachats). Positif = elle lève des fonds — signal que le business ne s'autofinance pas.",
  },
  'Dividendes Versés': {
    what: "Cash distribué aux actionnaires sous forme de dividendes sur l'exercice.",
    why:  "À comparer au Free Cash Flow : si les dividendes dépassent le FCF sur plusieurs années, le dividende n'est pas soutenable et risque d'être coupé.",
  },
  "Rachats d'Actions": {
    what: "Cash utilisé par l'entreprise pour racheter ses propres actions sur le marché.",
    why:  "Réduit le nombre d'actions, augmentant mécaniquement le BPA. Alternative aux dividendes, souvent plus flexible fiscalement — signal que la direction juge l'action sous-valorisée.",
  },
  'Amortissements (D&A)': {
    what: "Charge comptable non-cash représentant l'usure progressive des actifs au fil du temps.",
    why:  "Réduit le bénéfice net sans impacter la trésorerie. Des amortissements élevés signalent un secteur très capitalistique, avec des besoins constants de renouvellement.",
  },
  'Variation du BFR': {
    what: "Impact du cycle d'exploitation (stocks, créances, dettes fournisseurs) sur la trésorerie.",
    why:  "Négatif = la croissance de l'activité consomme du cash. Positif = l'entreprise libère de la trésorerie en optimisant son cycle opérationnel.",
  },

  'Moy. Secteur': {
    what: "Moyenne calculée en temps réel à partir des données de toutes les entreprises du même secteur présentes dans notre base.",
    why:  "Valeurs nulles ou manquantes exclues du calcul. Sert de référence pour évaluer si une métrique est au-dessus ou en dessous de la norme sectorielle.",
  },
};

export default EXPLANATIONS;
