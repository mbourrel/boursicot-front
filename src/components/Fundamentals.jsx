import { ASSET_COLORS } from './CompareBar';

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
import { useFundamentals } from '../hooks/useFundamentals';
import { useSectorAverages } from '../hooks/useSectorAverages';

// ── Composant principal ────────────────────────────────────────────────────
function Fundamentals({ selectedSymbol, compareSymbols = [] }) {
  const allSymbols = [selectedSymbol, ...compareSymbols];
  const { dataMap, loading, errors } = useFundamentals(allSymbols);
  const isSoloMode = allSymbols.length === 1;
  const primarySector = isSoloMode ? dataMap[selectedSymbol]?.sector : null;
  const sectorAvg = useSectorAverages(primarySector);

  // ── Formateur de valeurs ───────────────────────────────────────────────────
  const fmt = (val, unit) => {
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

    const renderCategory = (title, dataArray, catKey) => {
      if (!dataArray || dataArray.length === 0) return null;
      return (
        <div>
          <h3 style={h3Style}>{title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dataArray.length}, 1fr)`, gap: '8px' }}>
            {dataArray.map((metric, i) => {
              const avg = sectorAvg?.[catKey]?.[metric.name] ?? undefined;
              return <MetricCard key={i} metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} />;
            })}
          </div>
        </div>
      );
    };

    const d = primaryData;

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

    return (
      <div>
        {/* ── EN-TÊTE : description + fiche d'identité ── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--text1)', fontSize: '26px', marginBottom: '2px' }}>{d.name}</h2>
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

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 3fr 4fr', gap: '20px 24px', alignItems: 'start', marginBottom: '32px' }}>
          {renderCategory('1. Analyse de Marché',               d.market_analysis,    'market_analysis')}
          {renderCategory('2. Santé Financière',                d.financial_health,   'financial_health')}
          {renderCategory('3. Valorisation Avancée',            d.advanced_valuation, 'advanced_valuation')}
          {renderCategory('4. Risque & Marché',                 d.risk_market,        'risk_market')}
          {renderCategory('5. Bilan & Liquidité',               d.balance_cash,       'balance_cash')}
          {renderCategory('6. Compte de Résultat & Croissance', d.income_growth,      'income_growth')}
        </div>

        <FinancialStatement title="7. Compte de Résultat — Historique (4 ans)" stmtData={d.income_stmt_data}   fmt={fmt} stmtAvg={sectorAvg?.income_stmt_data} />
        <FinancialStatement title="8. Bilan Comptable — Historique (4 ans)"     stmtData={d.balance_sheet_data} fmt={fmt} stmtAvg={sectorAvg?.balance_sheet_data} />
        <FinancialStatement title="9. Flux de Trésorerie — Historique (4 ans)"  stmtData={d.cashflow_data}     fmt={fmt} stmtAvg={sectorAvg?.cashflow_data} />
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

  return (
    <div>
      {/* En-têtes actifs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
const tdStyle = {
  padding: '9px 12px', fontSize: '12px', borderBottom: '1px solid var(--border)',
};

export default Fundamentals;
