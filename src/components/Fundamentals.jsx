import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ASSET_COLORS } from './CompareBar';
import EXPLANATIONS from '../constants/metricExplanations';

// ── Composant tooltip réutilisable ─────────────────────────────────────────
function MetricInfo({ name }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const text = EXPLANATIONS[name];
  if (!text) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Tooltip en dessous si assez de place, sinon au-dessus
    setPos({
      left: Math.min(rect.left, window.innerWidth - 276),
      ...(spaceBelow >= 180
        ? { top: rect.bottom + 6 }
        : { top: rect.top - 6, transform: 'translateY(-100%)' }),
    });
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '5px' }}>
      <button
        ref={btnRef}
        onClick={handleClick}
        style={{
          background: pos ? '#2962FF22' : 'transparent',
          border: `1px solid ${pos ? '#2962FF88' : 'var(--border)'}`,
          color: pos ? '#2962FF' : 'var(--text3)',
          borderRadius: '50%', width: '14px', height: '14px',
          fontSize: '9px', fontWeight: 'bold', cursor: 'pointer',
          padding: 0, lineHeight: 1, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        i
      </button>

      {pos && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={() => setPos(null)}
          />
          {/* Tooltip */}
          <div style={{
            position: 'fixed',
            top: pos.top, left: pos.left,
            transform: pos.transform ?? 'none',
            zIndex: 999, width: '260px',
            backgroundColor: 'var(--bg2)', border: '1px solid #2962FF44',
            borderRadius: '8px', padding: '10px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '11px', color: '#b0b8c4', lineHeight: '1.65',
          }}>
            <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>{name}</div>
            {text}
          </div>
        </>,
        document.body
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

  const isSolo      = allSymbols.length === 1;
  const primaryData = dataMap[selectedSymbol];

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE SOLO
  // ══════════════════════════════════════════════════════════════════════════
  if (isSolo) {
    if (errors[selectedSymbol]) return <p style={{ color: '#ef5350' }}>Aucune donnée disponible pour {selectedSymbol}</p>;
    if (!primaryData)           return <p style={{ color: 'var(--text3)' }}>Aucune donnée disponible.</p>;

    const renderCategory = (title, dataArray) => {
      if (!dataArray || dataArray.length === 0) return null;
      return (
        <div style={{ marginBottom: '36px' }}>
          <h3 style={h3Style}>{title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {dataArray.map((metric, i) => (
              <div key={i} style={cardStyle}>
                <span style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                  {metric.name}
                  <MetricInfo name={metric.name} />
                </span>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text1)' }}>{fmt(metric.val, metric.unit)}</span>
                  {metric.avg !== 0 && metric.avg !== undefined && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Moy. Secteur</span>
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
                <tr style={{ backgroundColor: 'var(--bg2)' }}>
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
                    <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)' }}>
                      <td style={{ ...tdStyle, color: 'var(--text2)' }}>
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
                          <td key={colIdx} style={{ ...tdStyle, textAlign: 'right', fontWeight: colIdx === 0 ? 'bold' : 'normal', color: colIdx === 0 ? 'var(--text1)' : 'var(--text3)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'stretch' }}>
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

        {renderCategory('1. Analyse de Marché',               d.market_analysis)}
        {renderCategory('2. Santé Financière',                d.financial_health)}
        {renderCategory('3. Valorisation Avancée',            d.advanced_valuation)}
        {renderCategory('4. Compte de Résultat & Croissance', d.income_growth)}
        {renderCategory('5. Bilan & Liquidité',               d.balance_cash)}
        {renderCategory('6. Risque & Marché',                 d.risk_market)}

        {renderStatement('7. Compte de Résultat — Historique (4 ans)', d.income_stmt_data)}
        {renderStatement('8. Bilan Comptable — Historique (4 ans)',     d.balance_sheet_data)}
        {renderStatement('9. Flux de Trésorerie — Historique (4 ans)',  d.cashflow_data)}
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
          return (
            <tr key={name} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)' }}>
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
const cardStyle = {
  backgroundColor: 'var(--bg3)', padding: '15px', borderRadius: '8px',
  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};
const thStyle = {
  padding: '10px 12px', color: 'var(--text3)', fontSize: '11px',
  borderBottom: '1px solid var(--border)', fontWeight: 'bold', letterSpacing: '0.04em',
};
const tdStyle = {
  padding: '9px 12px', fontSize: '12px', borderBottom: '1px solid var(--border)',
};

export default Fundamentals;
