import MetricInfo from './MetricInfo';

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

function FinancialStatement({ title, stmtData, fmt, stmtAvg }) {
  if (!stmtData?.items?.length) return null;
  const { years, items } = stmtData;
  const cols = years.slice(0, 4);
  const hasAvg = stmtAvg && Object.keys(stmtAvg).length > 0;

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={h3Style}>{title}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
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
                  Moy. Secteur
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => {
              const vals = item.vals.slice(0, 4);
              const avgVal = stmtAvg?.[item.name] ?? null;
              const mostRecentVal = vals[0] ?? null;
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
                  {hasAvg && (
                    <td style={{ ...tdStyle, textAlign: 'right', borderLeft: '1px solid var(--border)', color: avgVal !== null ? (mostRecentVal !== null && mostRecentVal >= avgVal ? '#26a69a' : '#ef5350') : 'var(--text3)', fontStyle: avgVal === null ? 'italic' : 'normal' }}>
                      {avgVal !== null ? fmt(avgVal, item.unit) : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FinancialStatement;
