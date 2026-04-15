import React from 'react';

function Header({ selectedSymbol, setSelectedSymbol, fundamentalsData, viewMode, setViewMode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
      <h1 style={{ margin: 0, color: '#fff' }}>Boursicot Pro 📈</h1>
      <div style={{ display: 'flex', gap: '15px' }}>
        
        <select 
          value={selectedSymbol} 
          onChange={(e) => setSelectedSymbol(e.target.value)} 
          style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e222d', color: 'white', border: '1px solid #2B2B43', outline: 'none', cursor: 'pointer' }}
        >
          {fundamentalsData.length === 0 ? <option disabled>Chargement...</option> : 
            fundamentalsData.map((company) => (
              <option key={company.ticker} value={company.ticker}>{company.name} ({company.ticker})</option>
            ))
          }
        </select>

        <div style={{ display: 'flex', backgroundColor: '#1e222d', borderRadius: '6px' }}>
          <button 
            onClick={() => setViewMode('chart')} 
            style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
          >
            Données de marché
          </button>
          <button 
            onClick={() => setViewMode('fundamentals')} 
            style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
          >
            Infos Entreprise
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;