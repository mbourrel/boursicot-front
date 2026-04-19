import { useState, useEffect } from 'react';
import { ASSET_COLORS } from './CompareBar';

// ── Dictionnaire d'explications ────────────────────────────────────────────
const EXPLANATIONS = {
  // --- Analyse de marché ---
  'Capitalisation':       'Valeur totale de l\'entreprise en bourse (cours × nombre d\'actions). Donne une idée de la taille de la société : < 2 Md$ = small cap, 2-10 Md$ = mid cap, > 10 Md$ = large cap.',
  'PER':                  'Price/Earnings. Combien les investisseurs paient pour €1 de bénéfice. Élevé (> 25) = marché anticipe forte croissance. Bas (< 12) = valeur décotée ou secteur cyclique. À comparer avec la moyenne du secteur.',
  'Rendement Div':        'Dividende annuel rapporté au cours. Ex : 3% = l\'action verse 3€ pour 100€ investis. Intéressant pour les revenus passifs, mais un rendement trop élevé peut signaler une entreprise en difficulté.',

  // --- Santé financière ---
  'Marge Nette':          '% du chiffre d\'affaires qui devient bénéfice net après toutes les charges. Une marge nette de 20% signifie que sur 100€ de ventes, 20€ sont du profit pur.',
  'ROE':                  'Return on Equity. Bénéfice net / Capitaux propres. Mesure l\'efficacité avec laquelle la direction utilise l\'argent des actionnaires. > 15% est généralement bon. Warren Buffett cible des ROE > 20%.',
  'Dette/Fonds Propres':  'Total des dettes / Capitaux propres. < 50% = peu endetté, entre 50-150% = modéré, > 200% = risque élevé. Très variable selon les secteurs (les banques ont des ratios naturellement élevés).',

  // --- Valorisation avancée ---
  'Forward PE':           'PER calculé sur les bénéfices anticipés par les analystes (exercice suivant). Plus fiable que le PER historique pour évaluer les perspectives réelles de l\'entreprise.',
  'Price to Book':        'Cours / Valeur comptable par action. < 1 = l\'action vaut moins que ses actifs nets (potentiellement sous-évaluée). > 3 = prime de marché importante. Très utilisé pour les banques.',
  'EV / EBITDA':          'Valeur d\'entreprise / EBITDA. Permet de comparer des sociétés indépendamment de leur structure de capital et de leur fiscalité. 8-12x est souvent considéré comme raisonnable selon le secteur.',
  'PEG Ratio':            'PER / Taux de croissance des bénéfices. Un PEG < 1 suggère que la croissance n\'est pas encore intégrée dans le cours. Inventé par Peter Lynch pour trouver des "growth at reasonable price".',

  // --- Compte de résultat & croissance ---
  'Chiffre d\'Affaires':  'Revenus totaux générés par l\'activité principale de l\'entreprise. La "ligne du haut" du compte de résultat.',
  'EBITDA':               'Earnings Before Interest, Taxes, Depreciation & Amortization. Proxy du flux de trésorerie opérationnel, souvent utilisé pour valoriser une entreprise ou comparer des acteurs d\'un même secteur.',
  'Croissance CA':        'Variation annuelle du chiffre d\'affaires. Indique le dynamisme commercial. > 10%/an = forte croissance. Négatif = contraction de l\'activité.',
  'Croissance Bénéfices': 'Variation annuelle des bénéfices nets. Une croissance des bénéfices supérieure à celle du CA indique une amélioration de la rentabilité et de l\'efficacité opérationnelle.',

  // --- Bilan & liquidité ---
  'Trésorerie Totale':    'Cash et équivalents de trésorerie disponibles immédiatement. Un coussin de sécurité essentiel pour traverser les crises ou saisir des opportunités d\'acquisition.',
  'Free Cash Flow':       'Flux de trésorerie opérationnel - CapEx. L\'argent "libre" réellement généré. C\'est lui qui finance les dividendes, les rachats d\'actions et la croissance future. Plus fiable que le bénéfice net.',
  'Ratio Liquidité':      'Actifs courants / Passifs courants. > 1 = l\'entreprise peut couvrir ses dettes à court terme. < 1 = risque de problème de trésorerie à court terme.',

  // --- Risque & marché ---
  'Beta':                 'Mesure la sensibilité de l\'action aux mouvements du marché. Beta = 1 : suit le marché. > 1 : plus volatil (amplifie les hausses ET les baisses). < 1 : moins volatil. Négatif : évolue à contre-courant.',
  'Plus Haut 52w':        'Plus haut cours atteint sur les 52 dernières semaines. Permet de situer le cours actuel par rapport à son récent sommet.',
  'Plus Bas 52w':         'Plus bas cours atteint sur les 52 dernières semaines. Permet d\'évaluer le potentiel de rebond ou la résistance du titre dans les crises.',
  'Actions Shortées':     '% du flottant vendu à découvert par des investisseurs pariant sur une baisse. > 10% = fort intérêt baissier. Peut créer un "short squeeze" violent si le cours monte.',

  // --- Bilan comptable historique ---
  'Actif Total':                    'Ensemble des ressources possédées par l\'entreprise : immobilisations (usines, brevets) + actifs courants (stocks, créances, cash). Le total du côté "emplois" du bilan.',
  'Passif Total':                   'Ensemble des dettes et obligations envers des tiers (banques, fournisseurs, obligations). Le total du côté "ressources" hors capitaux propres.',
  'Capitaux Propres':               'Actif Total - Passif Total. Ce qui appartient réellement aux actionnaires. Aussi appelé "valeur nette comptable" ou "book value". La croissance des capitaux propres reflète la création de valeur.',
  'Dette Totale':                   'Somme de toutes les dettes financières (court + long terme). À comparer à l\'EBITDA : un ratio Dette/EBITDA > 4x est souvent considéré comme élevé.',
  'Dette Long Terme':               'Emprunts et obligations à rembourser au-delà d\'un an. Finance les investissements structurels. Une dette LT stable ou en baisse est un signe de désendettement.',
  'Actif Courant':                  'Actifs convertibles en cash en moins d\'un an : trésorerie, créances clients, stocks. L\'actif courant doit idéalement dépasser le passif courant (ratio de liquidité > 1).',
  'Passif Courant':                 'Dettes exigibles en moins d\'un an : fournisseurs, portion CT des emprunts, dettes fiscales. Un passif courant trop élevé par rapport à l\'actif courant est un signal de vigilance.',
  'Trésorerie & Équivalents':       'Cash disponible immédiatement et placements très court terme (bons du Trésor < 3 mois). La réserve de liquidité immédiate de l\'entreprise.',
  'Créances Clients':               'Montants dus par les clients pour des livraisons ou services déjà effectués mais pas encore encaissés. Une augmentation peut signaler des problèmes de recouvrement.',
  'Stocks':                         'Valeur des matières premières, produits en cours et produits finis. Des stocks qui gonflent peuvent indiquer des difficultés de vente ou une préparation à une hausse d\'activité.',
  'Goodwill':                       'Survaleur payée lors d\'acquisitions par rapport à la valeur comptable des actifs acquis. Représente la marque, les clients, les synergies attendues. Peut être déprécié si l\'acquisition déçoit.',
  'Bénéfices Non Distribués':       'Cumul historique des bénéfices réinvestis dans l\'entreprise (non versés en dividendes). Une accumulation régulière témoigne d\'une création de valeur sur le long terme.',
  'Immobilisations Nettes':         'Valeur nette des actifs physiques (usines, machines, équipements) après déduction des amortissements cumulés. Reflète la capacité productive de l\'entreprise.',
  'Besoin en Fonds de Roulement':   'Capital nécessaire pour financer le cycle opérationnel (stocks + créances clients - dettes fournisseurs). Un BFR négatif (rare) signifie que l\'entreprise se finance via ses clients.',

  // --- Compte de résultat historique ---
  'Chiffre d\'Affaires (hist.)':    'Revenus totaux de l\'exercice. La ligne de départ du compte de résultat.',
  'Coût des Ventes':                'Coûts directement liés à la production : matières premières, main-d\'œuvre directe, amortissement des machines. Soustrait du CA pour obtenir le bénéfice brut.',
  'Bénéfice Brut':                  'CA - Coût des Ventes. La marge brute (Bénéfice Brut / CA) est un indicateur clé de l\'efficacité productive. > 40% est souvent associé à un avantage concurrentiel durable.',
  'Résultat Opérationnel (EBIT)':   'Bénéfice avant intérêts et impôts. Mesure la performance pure de l\'activité, avant l\'effet de levier financier et la fiscalité. C\'est le vrai "profit du métier".',
  'Résultat Net':                   'Le bénéfice final après toutes les charges : opérationnelles, financières et fiscales. La "ligne du bas". Sert au calcul du BPA et potentiellement aux dividendes.',
  'BPA Basique':                    'Bénéfice par Action basique = Résultat Net / Nombre d\'actions en circulation. Mesure combien chaque action "gagne" sur l\'exercice.',
  'BPA Dilué':                      'Bénéfice par Action dilué = Résultat Net / (Actions + options + convertibles potentiels). Plus conservateur que le BPA basique car tient compte de la dilution potentielle.',
  'Charges Financières':            'Intérêts payés sur les dettes. À comparer au résultat opérationnel pour évaluer la charge de la dette. Un ratio Charges Financières / EBIT > 30% peut être préoccupant.',
  'Impôt sur les Bénéfices':        'Charge fiscale effective de l\'exercice. Le taux d\'imposition effectif (Impôts / Résultat avant impôts) peut varier significativement selon la structure fiscale de la société.',
  'Recherche & Développement (R&D)':'Investissements dans l\'innovation et les nouveaux produits. Charge P&L mais aussi investissement dans la compétitivité future. Crucial dans la tech, la pharma et l\'industrie.',
  'Frais Généraux & Admin. (SG&A)': 'Selling, General & Administrative. Coûts de vente, marketing et administration. À surveiller : une hausse plus rapide que le CA érode la rentabilité.',

  // --- Flux de trésorerie historique ---
  'Flux de Trésorerie Opérationnel':'Cash réellement généré par l\'activité principale, après ajustements non-cash. Considéré comme le vrai indicateur de santé d\'une entreprise, car difficile à manipuler contrairement au bénéfice net.',
  'Dépenses d\'Investissement (CapEx)':'Cash dépensé pour acquérir ou entretenir des actifs physiques. Négatif par convention. Un CapEx / CA élevé indique un secteur capitalistique. CapEx > Flux opérationnel = l\'entreprise brûle du cash.',
  'Free Cash Flow':                 'Flux Opérationnel + CapEx (FCF = Flux Op. - |CapEx|). L\'argent réellement libre pour les actionnaires, les dividendes, les rachats d\'actions. La métrique préférée des investisseurs long terme.',
  'Flux d\'Investissement Total':   'Cash total utilisé pour les investissements et acquisitions. Inclut le CapEx, les achats de titres de participation et les acquisitions d\'entreprises. Généralement négatif.',
  'Flux de Financement Total':      'Cash lié aux opérations financières : nouveaux emprunts, remboursements, émissions d\'actions, dividendes, rachats d\'actions. Négatif = l\'entreprise rend de l\'argent aux apporteurs de capitaux.',
  'Dividendes Versés':              'Cash distribué aux actionnaires sous forme de dividendes. Négatif par convention dans le tableau des flux. À comparer au FCF pour évaluer la soutenabilité du dividende.',
  'Rachats d\'Actions':             'Cash utilisé pour racheter les propres actions de l\'entreprise sur le marché. Réduit le nombre d\'actions, ce qui augmente mécaniquement le BPA. Alternative aux dividendes, souvent fiscalement avantageuse.',
  'Amortissements (D&A)':           'Charge comptable non-cash liée à l\'usure des actifs (immobilisations). Réduit le bénéfice net mais pas la trésorerie. Réintégrée dans le flux opérationnel. Amortissements élevés = secteur capitalistique.',
  'Variation du BFR':               'Impact du cycle d\'exploitation sur la trésorerie. Négatif = le BFR augmente (croissance de l\'activité consomme du cash). Positif = compression du BFR (libère du cash).',
};

// ── Composant tooltip réutilisable ─────────────────────────────────────────
function MetricInfo({ name }) {
  const [open, setOpen] = useState(false);
  const text = EXPLANATIONS[name];
  if (!text) return null;

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '5px' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          background: open ? '#2962FF22' : 'transparent',
          border: `1px solid ${open ? '#2962FF88' : '#3a3f5a'}`,
          color: open ? '#2962FF' : '#8a919e',
          borderRadius: '50%', width: '14px', height: '14px',
          fontSize: '9px', fontWeight: 'bold', cursor: 'pointer',
          padding: 0, lineHeight: 1, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        title="En savoir plus"
      >
        i
      </button>
      {open && (
        <>
          <span
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
            zIndex: 99, width: '260px',
            backgroundColor: '#1a1e2e', border: '1px solid #2962FF44',
            borderRadius: '8px', padding: '10px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '11px', color: '#b0b8c4', lineHeight: '1.65',
            pointerEvents: 'none',
          }}>
            <div style={{ color: '#d1d4dc', fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>{name}</div>
            {text}
          </div>
        </>
      )}
    </span>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
function Fundamentals({ selectedSymbol, compareSymbols = [] }) {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.VITE_API_URL;

  const allSymbols = [selectedSymbol, ...compareSymbols];

  useEffect(() => {
    if (allSymbols.length === 0) return;
    setLoading(true);
    setErrors({});
    Promise.all(
      allSymbols.map(sym =>
        fetch(`${API_URL}/api/fundamentals/${encodeURIComponent(sym)}`)
          .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
          .then(data => ({ sym, data }))
          .catch(() => ({ sym, data: null }))
      )
    ).then(results => {
      const newMap = {}, newErrors = {};
      results.forEach(({ sym, data }) => {
        if (data) newMap[sym] = data;
        else newErrors[sym] = true;
      });
      setDataMap(newMap);
      setErrors(newErrors);
      setLoading(false);
    });
  }, [allSymbols.join(','), API_URL]);

  // ── Formateur de valeurs ───────────────────────────────────────────────────
  const fmt = (val, unit) => {
    if (val === null || val === undefined) return <span style={{ color: '#4a5568' }}>—</span>;
    if (val === 0) return <span style={{ color: '#4a5568' }}>—</span>;
    if (unit === '%') return `${val.toFixed(2)}%`;
    if (unit === 'x') return `${val.toFixed(2)}x`;
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} Md$`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)} M$`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)} k$`;
    return `${sign}${abs.toFixed(2)} $`;
  };

  const fmtRaw = (val, unit) => {
    const r = fmt(val, unit);
    return typeof r === 'string' ? r : '—';
  };

  if (loading) return <p style={{ color: '#8a919e' }}>Chargement...</p>;

  const isSolo      = allSymbols.length === 1;
  const primaryData = dataMap[selectedSymbol];

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE SOLO
  // ══════════════════════════════════════════════════════════════════════════
  if (isSolo) {
    if (errors[selectedSymbol]) return <p style={{ color: '#ef5350' }}>Aucune donnée disponible pour {selectedSymbol}</p>;
    if (!primaryData)           return <p style={{ color: '#8a919e' }}>Aucune donnée disponible.</p>;

    const renderCategory = (title, dataArray) => {
      if (!dataArray || dataArray.length === 0) return null;
      return (
        <div style={{ marginBottom: '36px' }}>
          <h3 style={h3Style}>{title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {dataArray.map((metric, i) => (
              <div key={i} style={cardStyle}>
                <span style={{ color: '#8a919e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                  {metric.name}
                  <MetricInfo name={metric.name} />
                </span>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{fmt(metric.val, metric.unit)}</span>
                  {metric.avg !== 0 && metric.avg !== undefined && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '10px', color: '#8a919e' }}>Moy. Secteur</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: metric.val >= metric.avg ? '#26a69a' : '#ef5350' }}>
                        {fmtRaw(metric.avg, metric.unit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderStatement = (title, stmtData) => {
      if (!stmtData || !stmtData.items || stmtData.items.length === 0) return null;
      const { years, items } = stmtData;
      const cols = years.slice(0, 4);
      return (
        <div style={{ marginBottom: '36px' }}>
          <h3 style={h3Style}>{title}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a1e2e' }}>
                  <th style={{ ...thStyle, textAlign: 'left', width: '38%' }}>Indicateur</th>
                  {cols.map((y, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: 'right' }}>
                      {y.slice(0, 4)}
                      {i === 0 && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#2962FF', fontWeight: 'normal' }}>↑ récent</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, rowIdx) => {
                  const vals = item.vals.slice(0, 4);
                  return (
                    <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#131722' : '#1a1e2e' }}>
                      <td style={{ ...tdStyle, color: '#d1d4dc' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0' }}>
                          {item.name}
                          <MetricInfo name={item.name} />
                        </span>
                      </td>
                      {vals.map((val, colIdx) => {
                        const next = vals[colIdx + 1];
                        let trend = null;
                        if (colIdx === 0 && val !== null && next !== null && next !== 0) {
                          const pct = ((val - next) / Math.abs(next)) * 100;
                          trend = { pct, up: pct >= 0 };
                        }
                        return (
                          <td key={colIdx} style={{ ...tdStyle, textAlign: 'right', fontWeight: colIdx === 0 ? 'bold' : 'normal', color: colIdx === 0 ? 'white' : '#8a919e' }}>
                            {fmt(val, item.unit)}
                            {trend && (
                              <span style={{ marginLeft: '6px', fontSize: '10px', color: trend.up ? '#26a69a' : '#ef5350' }}>
                                {trend.up ? '▲' : '▼'} {Math.abs(trend.pct).toFixed(1)}%
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ color: '#fff', fontSize: '26px', marginBottom: '4px' }}>{primaryData.name}</h2>
          <div style={{ color: '#2962FF', fontWeight: 'bold', marginBottom: '12px', fontSize: '13px' }}>
            Secteur : {primaryData.sector}
          </div>
          <p style={{ color: '#8a919e', maxWidth: '960px', lineHeight: '1.6', fontSize: '13px' }}>{primaryData.description}</p>
        </div>

        {renderCategory('1. Analyse de Marché',               primaryData.market_analysis)}
        {renderCategory('2. Santé Financière',                primaryData.financial_health)}
        {renderCategory('3. Valorisation Avancée',            primaryData.advanced_valuation)}
        {renderCategory('4. Compte de Résultat & Croissance', primaryData.income_growth)}
        {renderCategory('5. Bilan & Liquidité',               primaryData.balance_cash)}
        {renderCategory('6. Risque & Marché',                 primaryData.risk_market)}

        {renderStatement('7. Compte de Résultat — Historique (4 ans)', primaryData.income_stmt_data)}
        {renderStatement('8. Bilan Comptable — Historique (4 ans)',     primaryData.balance_sheet_data)}
        {renderStatement('9. Flux de Trésorerie — Historique (4 ans)',  primaryData.cashflow_data)}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE COMPARAISON
  // ══════════════════════════════════════════════════════════════════════════
  const SIMPLE_CATEGORIES = [
    { key: 'market_analysis',    label: '1. Analyse de Marché' },
    { key: 'financial_health',   label: '2. Santé Financière' },
    { key: 'advanced_valuation', label: '3. Valorisation Avancée' },
    { key: 'income_growth',      label: '4. Compte de Résultat & Croissance' },
    { key: 'balance_cash',       label: '5. Bilan & Liquidité' },
    { key: 'risk_market',        label: '6. Risque & Marché' },
  ];

  const STMT_CATEGORIES = [
    { key: 'income_stmt_data',   label: '7. Compte de Résultat — Historique' },
    { key: 'balance_sheet_data', label: '8. Bilan Comptable — Historique' },
    { key: 'cashflow_data',      label: '9. Flux de Trésorerie — Historique' },
  ];

  const getSimpleMetricNames = (catKey) => {
    const names = new Set();
    allSymbols.forEach(sym => { const d = dataMap[sym]; if (d && d[catKey]) d[catKey].forEach(m => names.add(m.name)); });
    return Array.from(names);
  };

  const getSimpleMetric = (sym, catKey, metricName) => {
    const d = dataMap[sym];
    if (!d || !d[catKey]) return null;
    return d[catKey].find(m => m.name === metricName) || null;
  };

  const getStmtMetricNames = (stmtKey) => {
    const names = new Set();
    allSymbols.forEach(sym => { const d = dataMap[sym]; if (d && d[stmtKey]?.items) d[stmtKey].items.forEach(m => names.add(m.name)); });
    return Array.from(names);
  };

  const getStmtMetric = (sym, stmtKey, metricName) => {
    const d = dataMap[sym];
    if (!d || !d[stmtKey]?.items) return null;
    const item = d[stmtKey].items.find(m => m.name === metricName);
    if (!item) return null;
    return { val: item.vals[0] ?? null, prev: item.vals[1] ?? null, unit: item.unit, year: d[stmtKey].years?.[0]?.slice(0, 4) ?? '' };
  };

  const colWidth = `${Math.floor(80 / allSymbols.length)}%`;

  const MetricNameCell = ({ name }) => (
    <td style={{ ...tdStyle, color: '#8a919e' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {name}
        <MetricInfo name={name} />
      </span>
    </td>
  );

  const renderCompareTable = (label, rows, renderRow) => {
    if (rows.length === 0) return null;
    return (
      <div style={{ marginBottom: '36px' }}>
        <h3 style={{ ...h3Style, borderBottom: '2px solid #2B2B43', paddingBottom: '10px' }}>{label}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '20%', padding: '10px 12px', textAlign: 'left', color: '#8a919e', fontSize: '11px', borderBottom: '1px solid #2B2B43', fontWeight: 'normal' }}>
                MÉTRIQUE
              </th>
              {allSymbols.map((sym, i) => (
                <th key={sym} style={{ width: colWidth, padding: '10px 12px', textAlign: 'right', color: ASSET_COLORS[i], fontSize: '12px', borderBottom: '1px solid #2B2B43', fontWeight: 'bold' }}>
                  {dataMap[sym]?.name || sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((name, rowIdx) => renderRow(name, rowIdx))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {/* En-têtes actifs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {allSymbols.map((sym, i) => {
          const d = dataMap[sym];
          const color = ASSET_COLORS[i];
          return (
            <div key={sym} style={{ flex: 1, minWidth: '160px', backgroundColor: '#1e222d', padding: '14px 16px', borderRadius: '10px', borderTop: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{d?.name || sym}</span>
              </div>
              {d ? (
                <>
                  <div style={{ color: '#8a919e', fontSize: '11px' }}>{sym}</div>
                  <div style={{ color, fontSize: '11px', marginTop: '2px' }}>{d.sector}</div>
                </>
              ) : (
                <div style={{ color: '#ef5350', fontSize: '12px' }}>Données indisponibles</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Catégories simples */}
      {SIMPLE_CATEGORIES.map(cat => {
        const metricNames = getSimpleMetricNames(cat.key);
        return renderCompareTable(cat.label, metricNames, (name, rowIdx) => {
          const vals = allSymbols.map(sym => getSimpleMetric(sym, cat.key, name));
          const numerics = vals.map(m => m?.val ?? null).filter(v => v !== null && v !== 0);
          const maxVal = numerics.length > 1 ? Math.max(...numerics) : null;
          const minVal = numerics.length > 1 ? Math.min(...numerics) : null;
          const unit = vals.find(Boolean)?.unit ?? '';
          return (
            <tr key={name} style={{ backgroundColor: rowIdx % 2 === 0 ? '#131722' : '#1a1e2e' }}>
              <MetricNameCell name={name} />
              {allSymbols.map(sym => {
                const metric = getSimpleMetric(sym, cat.key, name);
                const val = metric?.val ?? null;
                let color = 'white';
                if (maxVal !== null && val !== null && val !== 0) {
                  if (val === maxVal) color = '#26a69a';
                  else if (val === minVal) color = '#ef5350';
                }
                return (
                  <td key={sym} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color }}>
                    {fmt(val, unit)}
                  </td>
                );
              })}
            </tr>
          );
        });
      })}

      {/* États financiers */}
      {STMT_CATEGORIES.map(cat => {
        const metricNames = getStmtMetricNames(cat.key);
        const yearLabel = (() => {
          for (const sym of allSymbols) {
            const y = dataMap[sym]?.[cat.key]?.years?.[0]?.slice(0, 4);
            if (y) return ` (exercice ${y})`;
          }
          return '';
        })();
        return renderCompareTable(`${cat.label}${yearLabel}`, metricNames, (name, rowIdx) => {
          const metrics = allSymbols.map(sym => getStmtMetric(sym, cat.key, name));
          const numerics = metrics.map(m => m?.val ?? null).filter(v => v !== null && v !== 0);
          const maxVal = numerics.length > 1 ? Math.max(...numerics) : null;
          const minVal = numerics.length > 1 ? Math.min(...numerics) : null;
          return (
            <tr key={name} style={{ backgroundColor: rowIdx % 2 === 0 ? '#131722' : '#1a1e2e' }}>
              <MetricNameCell name={name} />
              {allSymbols.map((sym, i) => {
                const m = metrics[i];
                const val = m?.val ?? null;
                let valueColor = 'white';
                if (maxVal !== null && val !== null && val !== 0) {
                  if (val === maxVal) valueColor = '#26a69a';
                  else if (val === minVal) valueColor = '#ef5350';
                }
                let yoy = null;
                if (m && m.val !== null && m.prev !== null && m.prev !== 0) {
                  yoy = ((m.val - m.prev) / Math.abs(m.prev)) * 100;
                }
                return (
                  <td key={sym} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: valueColor }}>
                    {fmt(val, '$')}
                    {yoy !== null && (
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 'normal', color: yoy >= 0 ? '#26a69a' : '#ef5350' }}>
                        {yoy >= 0 ? '▲' : '▼'} {Math.abs(yoy).toFixed(1)}% vs N-1
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        });
      })}
    </div>
  );
}

// ── Styles partagés ────────────────────────────────────────────────────────
const h3Style = {
  margin: '0 0 14px', color: '#2962FF', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em',
};
const cardStyle = {
  backgroundColor: '#1e222d', padding: '15px', borderRadius: '8px',
  border: '1px solid #2B2B43', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};
const thStyle = {
  padding: '10px 12px', color: '#8a919e', fontSize: '11px',
  borderBottom: '1px solid #2B2B43', fontWeight: 'bold', letterSpacing: '0.04em',
};
const tdStyle = {
  padding: '9px 12px', fontSize: '12px', borderBottom: '1px solid #2B2B4322',
};

export default Fundamentals;
