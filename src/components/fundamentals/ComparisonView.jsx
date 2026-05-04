import { useState, useMemo } from 'react';
import { ASSET_COLORS } from '../CompareBar';
import { useCurrency } from '../../context/CurrencyContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { formatFinancialValue } from '../../utils/formatFinancialValue';
import SourceTag from '../SourceTag';
import { LOWER_IS_BETTER, NEUTRAL_METRICS } from '../../constants/metrics';
import RadarChart from './RadarChart';
import ScoreCompareCard from './ScoreCompareCard';
import MetricInfo from './MetricInfo';
import MethodologyModal from './MethodologyModal';
import CompareTable from './CompareTable';
import CurrencyBar from './CurrencyBar';
import { h3Style, tdStyle } from './styles';

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

export default function ComparisonView({ allSymbols, dataMap }) {
  const { targetCurrency, rates } = useCurrency();
  const { isMobile } = useBreakpoint();
  const [showMethodology, setShowMethodology] = useState(false);

  const getSimpleMetricNames = (catKey) => {
    const names = new Set();
    allSymbols.forEach(sym => { const d = dataMap[sym]; if (d && d[catKey]) d[catKey].forEach(m => names.add(m.name)); });
    return Array.from(names);
  };

  const getStmtMetricNames = (stmtKey) => {
    const names = new Set();
    allSymbols.forEach(sym => { const d = dataMap[sym]; if (d && d[stmtKey]?.items) d[stmtKey].items.forEach(m => names.add(m.name)); });
    return Array.from(names);
  };

  const getSimpleMetric = (sym, catKey, metricName) => {
    const d = dataMap[sym];
    if (!d || !d[catKey]) return null;
    return d[catKey].find(m => m.name === metricName) || null;
  };

  const getStmtMetric = (sym, stmtKey, metricName) => {
    const d = dataMap[sym];
    if (!d || !d[stmtKey]?.items) return null;
    const item = d[stmtKey].items.find(m => m.name === metricName);
    if (!item) return null;
    return { val: item.vals[0] ?? null, prev: item.vals[1] ?? null, unit: item.unit, year: d[stmtKey].years?.[0]?.slice(0, 4) ?? '' };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const simpleMetricNames = useMemo(() => Object.fromEntries(SIMPLE_CATEGORIES.map(c => [c.key, getSimpleMetricNames(c.key)])), [dataMap, allSymbols]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stmtMetricNames   = useMemo(() => Object.fromEntries(STMT_CATEGORIES.map(c => [c.key, getStmtMetricNames(c.key)])),   [dataMap, allSymbols]);

  const colWidth = `${Math.floor(80 / allSymbols.length)}%`;

  const MetricNameCell = ({ name, scrolled = false, rowBg = 'var(--bg1)' }) => (
    <td style={{
      ...tdStyle, color: 'var(--text3)',
      position: 'sticky', left: 0, zIndex: 1,
      backgroundColor: rowBg,
      whiteSpace: 'nowrap', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis',
      boxShadow: scrolled ? '3px 0 8px -2px rgba(0,0,0,0.55)' : 'none',
      borderRight: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {name}
        <MetricInfo name={name} />
      </span>
    </td>
  );

  return (
    <div>
      <CurrencyBar />

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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '5px 0 3px' }}>
                    <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '13px' }}>
                      {d.close_price != null
                        ? `${d.close_price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${d.currency || '$'}`
                        : '-- ' + (d.currency || '$')
                      }
                    </span>
                    {d.daily_change_pct != null && (
                      <span style={{ fontSize: '11px', fontWeight: '600', color: d.daily_change_pct >= 0 ? '#26a69a' : '#ef5350' }}>
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

        <button
          onClick={() => setShowMethodology(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
            border: '1px solid var(--border)', backgroundColor: 'var(--bg3)',
            color: 'var(--text3)', fontSize: '12px', fontWeight: '500',
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

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ ...h3Style, borderBottom: '2px solid var(--border)', paddingBottom: '10px', marginBottom: '16px' }}>
          Synthèse des Scores Boursicot
        </h3>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', gap: '10px', flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
            {allSymbols.map((sym, i) => (
              <ScoreCompareCard
                key={sym}
                sym={sym}
                color={ASSET_COLORS[i]}
                name={dataMap[sym]?.name}
                scores={dataMap[sym]?.scores}
              />
            ))}
          </div>

          <div style={{
            backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px', flexShrink: 0,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column', alignItems: 'center',
          }}>
            <RadarChart allSymbols={allSymbols} dataMap={dataMap} />
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

      {SIMPLE_CATEGORIES.map(cat => {
        const metricNames = simpleMetricNames[cat.key];
        return (
          <CompareTable
            key={cat.key}
            label={cat.label}
            rows={metricNames}
            allSymbols={allSymbols}
            dataMap={dataMap}
            colWidth={colWidth}
            isMobile={isMobile}
            renderRow={(name, rowIdx, scrolled) => {
              const rowBg = rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)';
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
                <tr key={name} style={{ backgroundColor: rowBg }}>
                  <MetricNameCell name={name} scrolled={scrolled} rowBg={rowBg} />
                  {allSymbols.map(sym => {
                    const metric = getSimpleMetric(sym, cat.key, name);
                    const val = metric?.val ?? null;
                    let color = 'white';
                    if (!isNeutral && bestVal !== null && val !== null && val !== 0) {
                      if (val === bestVal)       color = '#26a69a';
                      else if (val === worstVal) color = '#ef5350';
                    }
                    const symCurrency = dataMap[sym]?.currency || 'USD';
                    return (
                      <td key={sym} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color, minWidth: isMobile ? '120px' : undefined }}>
                        {val !== null && val !== 0
                          ? formatFinancialValue(val, unit, symCurrency, targetCurrency, rates)
                          : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            }}
          />
        );
      })}

      {STMT_CATEGORIES.map(cat => {
        const metricNames = stmtMetricNames[cat.key];
        const yearLabel = (() => {
          for (const sym of allSymbols) {
            const y = dataMap[sym]?.[cat.key]?.years?.[0]?.slice(0, 4);
            if (y) return ` (exercice ${y})`;
          }
          return '';
        })();
        return (
          <CompareTable
            key={cat.key}
            label={`${cat.label}${yearLabel}`}
            rows={metricNames}
            allSymbols={allSymbols}
            dataMap={dataMap}
            colWidth={colWidth}
            isMobile={isMobile}
            renderRow={(name, rowIdx, scrolled) => {
              const rowBg = rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)';
              const metrics = allSymbols.map(sym => getStmtMetric(sym, cat.key, name));
              const numerics = metrics.map(m => m?.val ?? null).filter(v => v !== null && v !== 0);
              const maxVal = numerics.length > 1 ? Math.max(...numerics) : null;
              const minVal = numerics.length > 1 ? Math.min(...numerics) : null;
              return (
                <tr key={name} style={{ backgroundColor: rowBg }}>
                  <MetricNameCell name={name} scrolled={scrolled} rowBg={rowBg} />
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
                      <td key={sym} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: valueColor, minWidth: isMobile ? '120px' : undefined }}>
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
            }}
          />
        );
      })}

      <SourceTag label="Yahoo Finance · FMP (prix live)" />
    </div>
  );
}
