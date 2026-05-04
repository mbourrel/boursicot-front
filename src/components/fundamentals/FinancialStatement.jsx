import { useState } from 'react';
import MetricInfo from './MetricInfo';
import MetricHistoryModal from './MetricHistoryModal';

const thStyle = {
  padding: '10px 12px', color: 'var(--text3)', fontSize: '11px',
  borderBottom: '1px solid var(--border)', fontWeight: 'bold', letterSpacing: '0.04em',
};
const tdStyle = {
  padding: '9px 12px', fontSize: '12px', borderBottom: '1px solid var(--border)',
};
const h3Style = {
  margin: '0 0 14px', color: '#2962FF', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em',
};

function FinancialStatement({ title, stmtData, fmt, stmtAvg, stmtAvgHistory, companyName, maxCols = 4, sidePanel }) {
  const [modal, setModal] = useState(null); // { item } | null

  if (!stmtData?.items?.length) return null;
  const { years, items } = stmtData;
  const cols = years.slice(0, maxCols);
  const hasAvg = stmtAvg && Object.keys(stmtAvg).length > 0;

  return (
    <>
      <div style={{ marginBottom: '36px', position: sidePanel ? 'relative' : undefined }}>
        <h3 style={h3Style}>{title}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${Math.max(560, 300 + cols.length * 75)}px` }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg2)' }}>
                <th style={{ ...thStyle, textAlign: 'left', width: '34%' }}>Indicateur</th>
                {cols.map((y, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: 'right' }}>
                    {y.slice(0, 4)}
                    {i === 0 && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#2962FF', fontWeight: 'normal' }}>↑ récent</span>}
                  </th>
                ))}
                {hasAvg && (
                  <th style={{ ...thStyle, textAlign: 'right', color: '#8c7ae6', borderLeft: '1px solid var(--border)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      Moy. Secteur
                      <MetricInfo name="Moy. Secteur" />
                    </span>
                  </th>
                )}
                <th style={{ ...thStyle, width: '32px' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, rowIdx) => {
                const vals = item.vals.slice(0, maxCols);
                const avgVal = stmtAvg?.[item.name] ?? null;
                const mostRecentVal = vals[0] ?? null;
                const hasHistory = years.length > 1 || (stmtAvgHistory?.[item.name] && Object.keys(stmtAvgHistory[item.name]).length > 1);
                return (
                  <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)' }}>
                    <td style={{ ...tdStyle, color: 'var(--text2)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
                        {item.name}
                        <MetricInfo name={item.name} />
                      </span>
                    </td>
                    {vals.map((val, colIdx) => {
                      const next = vals[colIdx + 1];
                      let trend = null;
                      if (colIdx === 0 && val != null && next != null && next !== 0) {
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
                    {hasAvg && (
                      <td style={{ ...tdStyle, textAlign: 'right', borderLeft: '1px solid var(--border)', color: avgVal !== null ? (mostRecentVal !== null && mostRecentVal >= avgVal ? '#26a69a' : '#ef5350') : 'var(--text3)', fontStyle: avgVal === null ? 'italic' : 'normal' }}>
                        {avgVal !== null ? fmt(avgVal, item.unit) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                    )}
                    {/* Bouton voir plus */}
                    <td style={{ ...tdStyle, textAlign: 'center', padding: '0 8px' }}>
                      {hasHistory && (
                        <button
                          onClick={() => setModal({ item })}
                          title="Voir l'évolution historique"
                          style={{
                            background: 'none', border: '1px solid var(--border)',
                            borderRadius: '4px', cursor: 'pointer', color: '#2962FF',
                            padding: '2px 6px', fontSize: '11px', fontWeight: 'bold',
                            lineHeight: 1, whiteSpace: 'nowrap',
                          }}
                        >
                          ↗
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sidePanel && (
          <div style={{ position: 'absolute', top: '108px', right: '10px', zIndex: 1, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>{sidePanel}</div>
          </div>
        )}
      </div>

      {modal && (
        <MetricHistoryModal
          metricName={modal.item.name}
          unit={modal.item.unit}
          companyName={companyName || ''}
          years={years}
          companyVals={modal.item.vals}
          sectorYearMap={stmtAvgHistory?.[modal.item.name] ?? null}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

export default FinancialStatement;
