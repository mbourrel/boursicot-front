import { useState, useEffect } from 'react';
import { ASSET_COLORS } from './CompareBar';

function Fundamentals({ selectedSymbol, compareSymbols = [] }) {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
          .then(res => {
            if (!res.ok) throw new Error(res.status);
            return res.json();
          })
          .then(data => ({ sym, data }))
          .catch(() => ({ sym, data: null }))
      )
    ).then(results => {
      const newMap = {};
      const newErrors = {};
      results.forEach(({ sym, data }) => {
        if (data) newMap[sym] = data;
        else newErrors[sym] = true;
      });
      setDataMap(newMap);
      setErrors(newErrors);
      setLoading(false);
    });
  }, [allSymbols.join(','), API_URL]);

  const formatVal = (val, unit) => {
    if (val === null || val === undefined || val === 0) return <span style={{ color: '#4a5568' }}>—</span>;
    let display;
    if (val > 1000000000) display = (val / 1000000000).toFixed(2) + ' Md' + (unit === '$' ? ' $' : '');
    else if (val > 1000000) display = (val / 1000000).toFixed(2) + ' M' + (unit === '$' ? ' $' : '');
    else display = val + (unit === '%' ? '%' : unit === 'x' ? 'x' : unit === '$' ? ' $' : '');
    return display;
  };

  if (loading) return <p style={{ color: '#8a919e' }}>Chargement...</p>;

  const isSolo = allSymbols.length === 1;
  const primaryData = dataMap[selectedSymbol];

  // --- VUE SOLO ---
  if (isSolo) {
    if (errors[selectedSymbol]) return <p style={{ color: '#ef5350' }}>Aucune donnée fondamentale disponible pour {selectedSymbol}</p>;
    if (!primaryData) return <p style={{ color: '#8a919e' }}>Aucune donnée disponible.</p>;

    const renderCategory = (title, dataArray) => {
      if (!dataArray || dataArray.length === 0) return null;
      return (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ borderBottom: '2px solid #2B2B43', paddingBottom: '10px', color: '#2962FF' }}>{title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {dataArray.map((metric, i) => (
              <div key={i} style={{ backgroundColor: '#1e222d', padding: '15px', borderRadius: '8px', border: '1px solid #2B2B43', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ color: '#8a919e', fontSize: '12px', textTransform: 'uppercase' }}>{metric.name}</span>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{formatVal(metric.val, metric.unit)}</span>
                  {metric.avg !== 0 && metric.avg !== undefined && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: '#8a919e' }}>Moy. Secteur</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: metric.val >= metric.avg ? '#26a69a' : '#ef5350' }}>{formatVal(metric.avg, metric.unit)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '5px' }}>{primaryData.name}</h2>
          <div style={{ color: '#2962FF', fontWeight: 'bold', marginBottom: '15px' }}>Secteur : {primaryData.sector}</div>
          <p style={{ color: '#8a919e', maxWidth: '1000px', lineHeight: '1.5' }}>{primaryData.description}</p>
        </div>
        {renderCategory('1. Analyse de Marché', primaryData.market_analysis)}
        {renderCategory('2. Santé Financière', primaryData.financial_health)}
        {renderCategory('3. Valorisation Avancée', primaryData.advanced_valuation)}
        {renderCategory('4. Compte de Résultat & Croissance', primaryData.income_growth)}
        {renderCategory('5. Bilan & Liquidité', primaryData.balance_cash)}
        {renderCategory('6. Risque & Marché', primaryData.risk_market)}
      </div>
    );
  }

  // --- VUE COMPARAISON ---
  const CATEGORIES = [
    { key: 'market_analysis', label: '1. Analyse de Marché' },
    { key: 'financial_health', label: '2. Santé Financière' },
    { key: 'advanced_valuation', label: '3. Valorisation Avancée' },
    { key: 'income_growth', label: '4. Compte de Résultat & Croissance' },
    { key: 'balance_cash', label: '5. Bilan & Liquidité' },
    { key: 'risk_market', label: '6. Risque & Marché' },
  ];

  // Collecter toutes les métriques possibles par catégorie
  const getMetricNames = (catKey) => {
    const names = new Set();
    allSymbols.forEach(sym => {
      const d = dataMap[sym];
      if (d && d[catKey]) d[catKey].forEach(m => names.add(m.name));
    });
    return Array.from(names);
  };

  const getMetricVal = (sym, catKey, metricName) => {
    const d = dataMap[sym];
    if (!d || !d[catKey]) return null;
    return d[catKey].find(m => m.name === metricName) || null;
  };

  const colWidth = `${Math.floor(80 / allSymbols.length)}%`;

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
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{sym}</span>
              </div>
              {d ? (
                <>
                  <div style={{ color: '#8a919e', fontSize: '12px' }}>{d.name}</div>
                  <div style={{ color: color, fontSize: '11px', marginTop: '2px' }}>{d.sector}</div>
                </>
              ) : (
                <div style={{ color: '#ef5350', fontSize: '12px' }}>Données indisponibles</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tableau comparatif par catégorie */}
      {CATEGORIES.map(cat => {
        const metricNames = getMetricNames(cat.key);
        if (metricNames.length === 0) return null;
        return (
          <div key={cat.key} style={{ marginBottom: '36px' }}>
            <h3 style={{ borderBottom: '2px solid #2B2B43', paddingBottom: '10px', color: '#2962FF', marginBottom: '0' }}>
              {cat.label}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%', padding: '10px 12px', textAlign: 'left', color: '#8a919e', fontSize: '11px', borderBottom: '1px solid #2B2B43', fontWeight: 'normal' }}>
                    MÉTRIQUE
                  </th>
                  {allSymbols.map((sym, i) => (
                    <th key={sym} style={{ width: colWidth, padding: '10px 12px', textAlign: 'right', color: ASSET_COLORS[i], fontSize: '12px', borderBottom: '1px solid #2B2B43', fontWeight: 'bold' }}>
                      {sym}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricNames.map((name, rowIdx) => {
                  // Trouver la valeur max/min pour colorer les extremes
                  const vals = allSymbols.map(sym => getMetricVal(sym, cat.key, name)?.val ?? null);
                  const numericVals = vals.filter(v => v !== null && v !== 0);
                  const maxVal = numericVals.length > 1 ? Math.max(...numericVals) : null;
                  const minVal = numericVals.length > 1 ? Math.min(...numericVals) : null;

                  return (
                    <tr key={name} style={{ backgroundColor: rowIdx % 2 === 0 ? '#131722' : '#1a1e2e' }}>
                      <td style={{ padding: '10px 12px', color: '#8a919e', fontSize: '12px', borderBottom: '1px solid #2B2B4322' }}>
                        {name}
                      </td>
                      {allSymbols.map((sym) => {
                        const metric = getMetricVal(sym, cat.key, name);
                        const val = metric?.val ?? null;
                        const unit = metric?.unit ?? '';
                        let valueColor = 'white';
                        if (maxVal !== null && val !== null && val !== 0) {
                          if (val === maxVal) valueColor = '#26a69a';
                          else if (val === minVal) valueColor = '#ef5350';
                        }
                        return (
                          <td key={sym} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: valueColor, borderBottom: '1px solid #2B2B4322' }}>
                            {formatVal(val, unit)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default Fundamentals;
