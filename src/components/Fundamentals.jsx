import { useState } from 'react';
import { ASSET_COLORS } from './CompareBar';
import { useCurrency } from '../context/CurrencyContext';
import { useProfile } from '../context/ProfileContext';
import { formatFinancialValue } from '../utils/formatFinancialValue';
import SourceTag from './SourceTag';

const LOWER_IS_BETTER = new Set([
  'PER', 'Forward PE', 'Price to Book', 'EV / EBITDA', 'PEG Ratio',
  'Dette/Fonds Propres', 'Actions Shortées',
]);
const NEUTRAL_METRICS = new Set([
  'Capitalisation', 'Beta', 'Plus Haut 52w', 'Plus Bas 52w',
]);
import MetricInfo from './fundamentals/MetricInfo';
import MetricCard from './fundamentals/MetricCard';
import FinancialStatement from './fundamentals/FinancialStatement';
import ScoreDashboard from './fundamentals/ScoreDashboard';
import MethodologyModal from './fundamentals/MethodologyModal';
import { useFundamentals } from '../hooks/useFundamentals';
import { useSectorAverages } from '../hooks/useSectorAverages';
import { useSectorHistory } from '../hooks/useSectorHistory';

// Métriques clés affichées en mode Explorateur (solo uniquement)
const METRIQUES_REINES = [
  { cat: 'market_analysis',  name: 'PER',                label: 'Valorisation' },
  { cat: 'financial_health', name: 'Marge Nette',        label: 'Rentabilité' },
  { cat: 'financial_health', name: 'ROE',                label: 'Efficacité' },
  { cat: 'financial_health', name: 'Dette/Fonds Propres',label: 'Endettement' },
  { cat: 'income_growth',    name: 'Croissance CA',      label: 'Croissance' },
];

// ── Composant principal ────────────────────────────────────────────────────
function Fundamentals({ selectedSymbol, compareSymbols = [] }) {
  const { profile, setProfile } = useProfile();
  const isExplorateur = profile === 'explorateur';

  const allSymbols = [selectedSymbol, ...compareSymbols];
  const { dataMap, loading, errors } = useFundamentals(allSymbols);
  const [showMethodology, setShowMethodology] = useState(false);
  const isSoloMode = allSymbols.length === 1;
  const primarySector = isSoloMode ? dataMap[selectedSymbol]?.sector : null;
  const sectorAvg     = useSectorAverages(primarySector);
  // useSectorHistory est coûteux — réservé au profil Stratège
  const sectorHistory = useSectorHistory(isExplorateur ? null : primarySector);
  const { targetCurrency, rates } = useCurrency();

  // ── Formateur de base (sans conversion devise) ─────────────────────────────
  // Utilisé pour les moyennes sectorielles (devise mixte non convertible).
  // En mode solo, fmt est redéfini plus bas avec la devise du ticker courant.
  let fmt = (val, unit) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text3)' }}>—</span>;
    if (val === 0) return <span style={{ color: 'var(--text3)' }}>—</span>;
    if (unit === '%') return `${val.toFixed(2)}%`;
    if (unit === 'x') return `${val.toFixed(2)}x`;
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} Md$`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)} M$`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)} k$`;
    return `${sign}${abs.toFixed(2)} $`;
  };

  // fmtRaw : toujours sans conversion (moyennes sectorielles)
  const fmtRaw = (val, unit) => {
    const r = fmt(val, unit);
    return typeof r === 'string' ? r : '—';
  };

  if (loading) return <p style={{ color: 'var(--text3)' }}>Chargement...</p>;

  const isSolo = isSoloMode;
  const primaryData = dataMap[selectedSymbol];

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE SOLO
  // ══════════════════════════════════════════════════════════════════════════
  if (isSolo) {
    if (errors[selectedSymbol]) return <p style={{ color: '#ef5350' }}>Aucune donnée disponible pour {selectedSymbol}</p>;
    if (!primaryData)           return <p style={{ color: 'var(--text3)' }}>Aucune donnée disponible.</p>;

    const renderCategory = (title, dataArray, catKey, sectionId) => {
      if (!dataArray || dataArray.length === 0) return null;
      // Exclure les métriques sans valeur pour éviter les colonnes vides
      const visible = dataArray.filter(m => m.val !== null && m.val !== undefined && m.val !== 0);
      if (visible.length === 0) return null;
      return (
        <div id={sectionId}>
          <h3 style={h3Style}>{title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visible.length}, 1fr)`, gap: '8px' }}>
            {visible.map((metric, i) => {
              const avg = sectorAvg?.[catKey]?.[metric.name] ?? undefined;
              return <MetricCard key={i} metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} />;
            })}
          </div>
        </div>
      );
    };

    const d = primaryData;

    // ── Formateur currency-aware pour le ticker courant ──────────────────────
    // Remplace le fmt de base : convertit les valeurs monétaires selon targetCurrency.
    // fmtRaw reste non-converti pour les moyennes sectorielles (devise mixte).
    const sourceCurrency = d.currency || 'USD';
    fmt = (val, unit) => {
      if (val === null || val === undefined || val === 0)
        return <span style={{ color: 'var(--text3)' }}>—</span>;
      const str = formatFinancialValue(val, unit, sourceCurrency, targetCurrency, rates);
      return str === '—' ? <span style={{ color: 'var(--text3)' }}>—</span> : str;
    };

    const dd = d.dividends_data || {};
    const divSectorAvg = sectorAvg?.dividends_data || {};

    // Formatage effectif
    const fmtEmployees = (n) => {
      if (!n) return null;
      if (n >= 1000) return `${(n / 1000).toFixed(0)} k`;
      return n.toString();
    };

    const identityItems = [
      d.industry    && { icon: '🏭', label: 'Industrie',       value: d.industry },
      d.country     && { icon: '📍', label: 'Siège',           value: [d.city, d.country].filter(Boolean).join(', ') },
      d.ipo_date    && { icon: '📅', label: 'Introduction',    value: new Date(d.ipo_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) },
      d.employees   && { icon: '👥', label: 'Effectif',        value: `${fmtEmployees(d.employees)} employés` },
      d.exchange    && { icon: '🏦', label: 'Bourse',          value: d.exchange },
      d.currency    && { icon: '💱', label: 'Devise',          value: d.currency },
      d.website     && { icon: '🔗', label: 'Site web',        value: d.website, isLink: true },
    ].filter(Boolean);

    const scores = d.scores ?? null;

    // Libellés pour le badge complexité dans l'en-tête
    const complexityLabel = scores?.complexity >= 6.5 ? 'Avancé' : scores?.complexity >= 4.0 ? 'Modéré' : 'Simple';
    const complexityColor = scores?.complexity >= 6.5 ? '#ef5350' : scores?.complexity >= 4.0 ? '#ff9800' : '#26a69a';
    const verdictColor    = { 'Profil Fort': '#26a69a', 'Profil Solide': '#26a69a', 'Profil Neutre': '#ff9800', 'Profil Prudent': '#ef5350', 'Profil Fragile': '#ef5350' }[scores?.verdict] ?? 'var(--text1)';

    // ── VUE EXPLORATEUR SOLO ────────────────────────────────────────────────
    if (isExplorateur) {
      return (
        <div>
          {/* En-tête simplifié */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ color: 'var(--text1)', fontSize: '26px', margin: 0 }}>{d.name}</h2>
              {scores && (
                <span style={{
                  fontSize: '13px', fontWeight: 'bold', padding: '3px 10px',
                  borderRadius: '5px', backgroundColor: verdictColor + '22',
                  color: verdictColor, border: `1px solid ${verdictColor}55`,
                }}>{scores.verdict}</span>
              )}
            </div>
            <div style={{ color: '#2962FF', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>
              {d.sector}{d.industry && d.industry !== d.sector ? ` — ${d.industry}` : ''}
            </div>
            <p style={{ color: 'var(--text3)', lineHeight: '1.7', fontSize: '13px', margin: 0, maxWidth: '720px' }}>{d.description}</p>
          </div>

          {/* ScoreDashboard complet */}
          {(() => {
            const beta      = d.risk_market?.find(m => m.name === 'Beta')?.val ?? null;
            const marketCap = d.market_analysis?.find(m => m.name === 'Capitalisation')?.val ?? null;
            return (
              <ScoreDashboard
                scores={scores}
                sector={d.sector}
                companyCount={sectorAvg?.company_count ?? null}
                beta={beta}
                marketCap={marketCap}
                isBeginnerMode={true}
                onShowAdvanced={() => setProfile('stratege')}
              />
            );
          })()}

          {/* Métriques Reines */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Indicateurs clés
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${METRIQUES_REINES.length}, 1fr)`, gap: '10px' }}>
              {METRIQUES_REINES.map(({ cat, name }) => {
                const metric = d[cat]?.find(m => m.name === name);
                if (!metric || metric.val === null || metric.val === undefined) return null;
                const avg = sectorAvg?.[cat]?.[name] ?? undefined;
                return <MetricCard key={name} metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} />;
              })}
            </div>
          </div>

          {/* CTA vers Stratège */}
          <div style={{
            marginTop: '28px', padding: '16px 20px', borderRadius: '10px',
            backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '14px', marginBottom: '3px' }}>
                Aller plus loin ?
              </div>
              <div style={{ color: 'var(--text3)', fontSize: '12px' }}>
                Le mode Stratège affiche les tableaux financiers historiques, le radar de comparaison et toutes les métriques avancées.
              </div>
            </div>
            <button
              onClick={() => setProfile('stratege')}
              style={{
                padding: '9px 18px', borderRadius: '6px', cursor: 'pointer',
                border: '1px solid #2962FF', backgroundColor: '#2962FF',
                color: 'white', fontSize: '13px', fontWeight: 'bold',
                whiteSpace: 'nowrap', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              📈 Passer en mode Stratège
            </button>
          </div>

          <SourceTag label="Yahoo Finance · FMP (prix live)" />
        </div>
      );
    }

    // ── VUE STRATÈGE SOLO (inchangée) ───────────────────────────────────────
    return (
      <div>
        {/* ── EN-TÊTE : description + fiche d'identité ── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <h2 style={{ color: 'var(--text1)', fontSize: '26px', margin: 0 }}>{d.name}</h2>
            {/* Badge verdict */}
            {scores && (
              <span style={{
                fontSize: '13px', fontWeight: 'bold', padding: '3px 10px',
                borderRadius: '5px', backgroundColor: verdictColor + '22',
                color: verdictColor, border: `1px solid ${verdictColor}55`,
              }}>
                {scores.verdict}
              </span>
            )}
            {/* Badge complexité */}
            {scores && (
              <span style={{
                fontSize: '11px', fontWeight: 'bold', padding: '3px 10px',
                borderRadius: '5px', backgroundColor: complexityColor + '22',
                color: complexityColor, border: `1px solid ${complexityColor}55`,
                letterSpacing: '0.04em',
              }}>
                {complexityLabel}
              </span>
            )}
          </div>
          <div style={{ color: '#2962FF', fontWeight: 'bold', marginBottom: '18px', fontSize: '13px' }}>
            {d.sector}{d.industry && d.industry !== d.sector ? ` — ${d.industry}` : ''}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '24px', alignItems: 'stretch' }}>
            {/* Description */}
            <p style={{ color: 'var(--text3)', lineHeight: '1.7', fontSize: '13px', margin: 0 }}>{d.description}</p>

            {/* Fiche d'identité */}
            <div style={{
              backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.08em',
                color: 'var(--text3)', textTransform: 'uppercase',
              }}>
                Informations générales
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {identityItems.map(({ icon, label, value, isLink }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 18px', borderBottom: '1px solid var(--border)',
                    flex: 1, gap: '16px',
                  }}>
                    <span style={{ color: 'var(--text3)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: '15px' }}>{icon}</span>{label}
                    </span>
                    {isLink
                      ? <a href={value} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#2962FF', fontSize: '14px', fontWeight: '500', textDecoration: 'none', textAlign: 'right', wordBreak: 'break-all' }}>
                          {value.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      : <span style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{value}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SCORE DASHBOARD ── */}
        {(() => {
          const beta      = d.risk_market?.find(m => m.name === 'Beta')?.val ?? null;
          const marketCap = d.market_analysis?.find(m => m.name === 'Capitalisation')?.val ?? null;
          return (
            <ScoreDashboard
              scores={scores}
              sector={d.sector}
              companyCount={sectorAvg?.company_count ?? null}
              beta={beta}
              marketCap={marketCap}
              isBeginnerMode={false}
            />
          );
        })()}

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 3fr 4fr', gap: '20px 24px', alignItems: 'start', marginBottom: '32px' }}>
          {renderCategory('1. Analyse de Marché',               d.market_analysis,    'market_analysis',    'section-market')}
          {renderCategory('2. Santé Financière',                d.financial_health,   'financial_health',   'section-health')}
          {renderCategory('3. Valorisation Avancée',            d.advanced_valuation, 'advanced_valuation', 'section-valuation')}
          {renderCategory('4. Risque & Marché',                 d.risk_market,        'risk_market',        'section-risk')}
          {renderCategory('5. Bilan & Liquidité',               d.balance_cash,       'balance_cash',       'section-balance')}
          {renderCategory('6. Compte de Résultat & Croissance', d.income_growth,      'income_growth',      'section-growth')}
        </div>

        {/* ── TABLEAUX FINANCIERS — mode Stratège uniquement ── */}
        <>
          <FinancialStatement title="7. Compte de Résultat — Historique"  stmtData={d.income_stmt_data}   fmt={fmt} stmtAvg={sectorAvg?.income_stmt_data}   stmtAvgHistory={sectorHistory?.income_stmt_data}   companyName={d.name} />
          <FinancialStatement title="8. Bilan Comptable — Historique"     stmtData={d.balance_sheet_data} fmt={fmt} stmtAvg={sectorAvg?.balance_sheet_data} stmtAvgHistory={sectorHistory?.balance_sheet_data} companyName={d.name} />
          <FinancialStatement title="9. Flux de Trésorerie — Historique"  stmtData={d.cashflow_data}      fmt={fmt} stmtAvg={sectorAvg?.cashflow_data}      stmtAvgHistory={sectorHistory?.cashflow_data}      companyName={d.name} />
        </>
        {dd.annual?.items?.length > 0 && (() => {
          const scalarRows = [
            dd.dividend_yield      && { name: 'Rendement Div.',     vals: [dd.dividend_yield],      unit: '%' },
            dd.dividend_rate       && { name: 'Dividende/Action',   vals: [dd.dividend_rate],       unit: '$' },
            dd.payout_ratio        && { name: 'Ratio Distribution', vals: [dd.payout_ratio],        unit: '%' },
            dd.five_year_avg_yield && { name: 'Rend. Moy. 5 ans',   vals: [dd.five_year_avg_yield], unit: '%' },
          ].filter(Boolean);
          const dividendStmtData = {
            years: dd.annual.years,
            items: [...dd.annual.items, ...scalarRows],
          };
          const dividendStmtAvg = {
            'Dividende Annuel':  divSectorAvg.dividend_rate,
            'Rendement Div.':    divSectorAvg.dividend_yield,
            'Dividende/Action':  divSectorAvg.dividend_rate,
            'Ratio Distribution':divSectorAvg.payout_ratio,
            'Rend. Moy. 5 ans':  divSectorAvg.five_year_avg_yield,
          };
          return (
            <FinancialStatement
              title="10. Politique de Dividende — Historique"
              stmtData={dividendStmtData}
              fmt={fmt}
              stmtAvg={dividendStmtAvg}
              stmtAvgHistory={{ 'Dividende Annuel': sectorHistory?.dividends_data?.annual_dividend }}
              companyName={d.name}
            />
          );
        })()}
        <SourceTag label="Yahoo Finance · FMP (prix live)" />
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

  // ── Radar Chart SVG 6 axes (pur, sans librairie) ─────────────────────────
  const RadarChart = () => {
    const size      = 280;
    const cx        = size / 2;
    const cy        = size / 2;
    const maxRadius = 88;
    const labelGap  = 20;
    const axes      = ['health', 'valuation', 'growth', 'efficiency', 'dividend', 'momentum'];
    const axisLabels= ['Santé', 'Valorisation', 'Croissance', 'Efficacité', 'Dividende', 'Momentum'];
    // 6 axes à 60° d'intervalle, départ à 12h (-90°)
    const angles = axes.map((_, i) => ((i * 60 - 90) * Math.PI) / 180);
    const pt = (angle, value) => ({
      x: cx + ((value / 10) * maxRadius) * Math.cos(angle),
      y: cy + ((value / 10) * maxRadius) * Math.sin(angle),
    });
    // anchor déduit de la position angulaire
    const anchor = (a) => {
      const deg = (a * 180 / Math.PI + 360) % 360;
      if (deg < 30 || deg > 330) return 'middle';
      if (deg < 150) return 'start';
      if (deg < 210) return 'middle';
      return 'end';
    };

    return (
      <svg width={size} height={size} style={{ display: 'block' }}>
        {/* Grilles */}
        {[0.25, 0.5, 0.75, 1].map(level => (
          <polygon key={level}
            points={angles.map(a => `${cx + level * maxRadius * Math.cos(a)},${cy + level * maxRadius * Math.sin(a)}`).join(' ')}
            fill="none" stroke="var(--border)" strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {angles.map((a, i) => (
          <line key={i} x1={cx} y1={cy}
            x2={cx + maxRadius * Math.cos(a)} y2={cy + maxRadius * Math.sin(a)}
            stroke="var(--border)" strokeWidth="1"
          />
        ))}
        {/* Libellés */}
        {angles.map((a, i) => {
          const r = maxRadius + labelGap;
          return (
            <text key={i}
              x={cx + r * Math.cos(a)} y={cy + r * Math.sin(a)}
              textAnchor={anchor(a)} dominantBaseline="middle"
              fill="var(--text3)" fontSize="9" fontFamily="sans-serif"
            >
              {axisLabels[i]}
            </text>
          );
        })}
        {/* Polygones par entreprise */}
        {allSymbols.map((sym, si) => {
          const s = dataMap[sym]?.scores;
          if (!s) return null;
          const vals   = [s.health, s.valuation, s.growth, s.efficiency ?? 5, s.dividend ?? 5, s.momentum ?? 5];
          const points = angles.map((a, i) => pt(a, vals[i]));
          const pStr   = points.map(p => `${p.x},${p.y}`).join(' ');
          const clr    = ASSET_COLORS[si];
          return (
            <g key={sym}>
              <polygon points={pStr} fill={clr + '28'} stroke={clr} strokeWidth="1.5" strokeLinejoin="round" />
              {points.map((p, pi) => <circle key={pi} cx={p.x} cy={p.y} r="3" fill={clr} />)}
            </g>
          );
        })}
      </svg>
    );
  };

  const MetricNameCell = ({ name }) => (
    <td style={{ ...tdStyle, color: 'var(--text3)' }}>
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
        <h3 style={{ ...h3Style, borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>{label}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '20%', padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontSize: '11px', borderBottom: '1px solid var(--border)', fontWeight: 'normal' }}>
                MÉTRIQUE
              </th>
              {allSymbols.map((sym, i) => (
                <th key={sym} style={{ width: colWidth, padding: '10px 12px', textAlign: 'right', color: ASSET_COLORS[i], fontSize: '12px', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
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

  const scoreColor = s => s >= 7 ? '#26a69a' : s >= 4 ? '#ff9800' : '#ef5350';

  return (
    <div>
      {/* En-têtes actifs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {allSymbols.map((sym, i) => {
          const d = dataMap[sym];
          const color = ASSET_COLORS[i];
          return (
            <div key={sym} style={{ flex: 1, minWidth: '160px', backgroundColor: 'var(--bg3)', padding: '14px 16px', borderRadius: '10px', borderTop: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '15px' }}>{d?.name || sym}</span>
              </div>
              {d ? (
                <>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>{sym}</div>
                  {/* Prix + variation journalière */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '5px 0 3px' }}>
                    <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '13px' }}>
                      {d.close_price != null
                        ? `${d.close_price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${d.currency || '$'}`
                        : '-- ' + (d.currency || '$')
                      }
                    </span>
                    {d.daily_change_pct != null && (
                      <span style={{
                        fontSize: '11px', fontWeight: '600',
                        color: d.daily_change_pct >= 0 ? '#26a69a' : '#ef5350',
                      }}>
                        {d.daily_change_pct >= 0 ? '+' : ''}{d.daily_change_pct.toFixed(2)} %
                      </span>
                    )}
                  </div>
                  <div style={{ color, fontSize: '11px' }}>{d.sector}</div>
                </>
              ) : (
                <div style={{ color: '#ef5350', fontSize: '12px' }}>Données indisponibles</div>
              )}
            </div>
          );
        })}

        {/* Bouton Définition des indicateurs */}
        <button
          onClick={() => setShowMethodology(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg3)',
            color: 'var(--text3)',
            fontSize: '12px', fontWeight: '500',
            transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text1)'; e.currentTarget.style.color = 'var(--text1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
        >
          <span style={{ fontSize: '14px' }}>📖</span>
          Définition des indicateurs
        </button>
      </div>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}

      {/* ── Synthèse des Scores Boursicot ── */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ ...h3Style, borderBottom: '2px solid var(--border)', paddingBottom: '10px', marginBottom: '16px' }}>
          Synthèse des Scores Boursicot
        </h3>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Cartes de scores par actif */}
          <div style={{ flex: 1, display: 'flex', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
            {allSymbols.map((sym, i) => {
              const d = dataMap[sym];
              const s = d?.scores;
              const color = ASSET_COLORS[i];
              const globalScore = s?.global_score ?? null;
              const verdictColor = { 'Profil Fort': '#26a69a', 'Profil Solide': '#26a69a', 'Profil Neutre': '#ff9800', 'Profil Prudent': '#ef5350', 'Profil Fragile': '#ef5350' }[s?.verdict] ?? 'var(--text3)';
              const METRICS = [
                { label: 'Santé',        icon: '❤️',  key: 'health' },
                { label: 'Valorisation', icon: '📊',  key: 'valuation' },
                { label: 'Croissance',   icon: '📈',  key: 'growth' },
                { label: 'Dividende',    icon: '💰',  key: 'dividend' },
                { label: 'Momentum',     icon: '⚡',  key: 'momentum' },
                { label: 'Efficacité',   icon: '⚙️', key: 'efficiency' },
              ];
              return (
                <div key={sym} style={{
                  flex: 1, minWidth: '160px',
                  backgroundColor: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  borderTop: `3px solid ${color}`,
                  padding: '14px',
                }}>
                  {/* En-tête carte */}
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color, marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d?.name || sym}
                  </div>

                  {s ? (
                    <>
                      {/* Note globale + verdict */}
                      {globalScore != null && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px', marginBottom: '10px',
                          background: scoreColor(globalScore) + '18',
                          border: `1px solid ${scoreColor(globalScore)}44`,
                          borderRadius: '7px',
                        }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 'bold' }}>Note Globale</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {s.verdict && (
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: verdictColor }}>{s.verdict}</span>
                            )}
                            <span style={{
                              fontSize: '14px', fontWeight: '900',
                              color: scoreColor(globalScore),
                            }}>
                              {globalScore.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 6 métriques */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {METRICS.map(({ label, icon, key }) => {
                          const value = s[key] ?? 5;
                          const c = scoreColor(value);
                          const barW = `${(value / 10) * 100}%`;
                          return (
                            <div key={key}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '12px' }}>{icon}</span>{label}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: c }}>{value.toFixed(1)}</span>
                              </div>
                              <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: barW, height: '100%', background: c, borderRadius: '2px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text3)', fontSize: '11px' }}>Scores indisponibles</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Radar Chart */}
          <div style={{
            backgroundColor: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px',
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <RadarChart />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
              {allSymbols.map((sym, i) => (
                <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text3)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ASSET_COLORS[i], flexShrink: 0 }} />
                  {dataMap[sym]?.name || sym}
                </div>
              ))}
            </div>
          </div>
        </div>
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
          const isNeutral = NEUTRAL_METRICS.has(name);
          const lowerBetter = LOWER_IS_BETTER.has(name);
          const bestVal  = lowerBetter ? minVal : maxVal;
          const worstVal = lowerBetter ? maxVal : minVal;
          return (
            <tr key={name} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)' }}>
              <MetricNameCell name={name} />
              {allSymbols.map(sym => {
                const metric = getSimpleMetric(sym, cat.key, name);
                const val = metric?.val ?? null;
                let color = 'white';
                if (!isNeutral && bestVal !== null && val !== null && val !== 0) {
                  if (val === bestVal)  color = '#26a69a';
                  else if (val === worstVal) color = '#ef5350';
                }
                const symCurrency = dataMap[sym]?.currency || 'USD';
                return (
                  <td key={sym} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color }}>
                    {val !== null && val !== 0
                      ? formatFinancialValue(val, unit, symCurrency, targetCurrency, rates)
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
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
            <tr key={name} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)' }}>
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
                const symCurrency = dataMap[sym]?.currency || 'USD';
                return (
                  <td key={sym} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: valueColor }}>
                    {val !== null && val !== 0
                      ? formatFinancialValue(val, '$', symCurrency, targetCurrency, rates)
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
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
      <SourceTag label="Yahoo Finance · FMP (prix live)" />
    </div>
  );
}

// ── Styles partagés ────────────────────────────────────────────────────────
const h3Style = {
  margin: '0 0 14px', color: '#2962FF', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em',
};
const tdStyle = {
  padding: '9px 12px', fontSize: '12px', borderBottom: '1px solid var(--border)',
};

export default Fundamentals;
