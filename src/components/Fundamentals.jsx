import React from 'react';

function Fundamentals({ currentData }) {
  const formatVal = (val, unit) => {
    if (val === null || val === undefined) return "N/A";
    if (val > 1000000000) return (val / 1000000000).toFixed(2) + ' Md' + (unit === '$' ? ' $' : '');
    if (val > 1000000) return (val / 1000000).toFixed(2) + ' M' + (unit === '$' ? ' $' : '');
    return val + (unit === '%' ? '%' : unit === 'x' ? 'x' : unit === '$' ? ' $' : '');
  };

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

  if (!currentData) {
    return <p>Chargement ou données introuvables pour cette action...</p>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '5px' }}>{currentData.name}</h2>
        <div style={{ color: '#2962FF', fontWeight: 'bold', marginBottom: '15px' }}>Secteur: {currentData.sector}</div>
        <p style={{ color: '#8a919e', maxWidth: '1000px', lineHeight: '1.5' }}>{currentData.description}</p>
      </div>

      {renderCategory("1. Analyse de Marché", currentData.market_analysis)}
      {renderCategory("2. Santé Financière", currentData.financial_health)}
      {renderCategory("3. Valorisation Avancée", currentData.advanced_valuation)}
      {renderCategory("4. Compte de Résultat & Croissance", currentData.income_growth)}
      {renderCategory("5. Bilan & Liquidité", currentData.balance_cash)}
      {renderCategory("6. Risque & Marché", currentData.risk_market)}
    </div>
  );
}

export default Fundamentals;