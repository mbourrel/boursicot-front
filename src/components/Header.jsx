import React, { useState, useRef, useEffect } from 'react';

function Header({ selectedSymbol, setSelectedSymbol, fundamentalsData, viewMode, setViewMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const [assetFilters, setAssetFilters] = useState({
    stock: true,
    index: true,
    crypto: true,
    commodity: true
  });

  useEffect(() => {
    const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
    if (selectedCompany) {
      setSearchTerm(`${selectedCompany.name || selectedCompany.ticker} (${selectedCompany.ticker})`);
    }
  }, [selectedSymbol, fundamentalsData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
        if (selectedCompany) {
          setSearchTerm(`${selectedCompany.name || selectedCompany.ticker} (${selectedCompany.ticker})`);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSymbol, fundamentalsData]);

  const handleFilterChange = (assetType) => {
    setAssetFilters(prev => ({
      ...prev,
      [assetType]: !prev[assetType]
    }));
  };

  const getAssetType = (ticker) => {
    if (!ticker) return 'stock';
    const t = ticker.toUpperCase();
    if (t.includes('-USD')) return 'crypto';
    if (t.startsWith('^')) return 'index';
    if (t.endsWith('=F')) return 'commodity';
    return 'stock';
  };

  const filteredData = fundamentalsData.filter(company => {
    const type = getAssetType(company.ticker); 
    
    if (!assetFilters[type]) return false;

    const companyName = company.name || '';
    const companyTicker = company.ticker || '';
    
    return companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           companyTicker.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (ticker) => {
    setSelectedSymbol(ticker);
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <h1 style={{ margin: 0, color: '#fff' }}>Boursicot Pro 📈</h1>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* BARRE DE FILTRES */}
        <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', backgroundColor: '#1e222d', borderRadius: '6px', border: '1px solid #2B2B43', alignItems: 'center' }}>
          <span style={{ color: '#8a919e', fontSize: '11px', fontWeight: 'bold' }}>FILTRER :</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.stock} onChange={() => handleFilterChange('stock')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} /> Actions
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.index} onChange={() => handleFilterChange('index')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} /> Indices
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.crypto} onChange={() => handleFilterChange('crypto')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} /> Cryptos
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.commodity} onChange={() => handleFilterChange('commodity')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} /> Matières
          </label>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div ref={dropdownRef} style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
            onClick={() => { setSearchTerm(''); setIsOpen(true); }}
            placeholder={fundamentalsData.length === 0 ? "Chargement..." : "Rechercher..."}
            disabled={fundamentalsData.length === 0}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1e222d', color: 'white', border: '1px solid #2B2B43', outline: 'none', boxSizing: 'border-box' }}
          />
          
          {isOpen && (
            <ul style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: '#1e222d', border: '1px solid #2B2B43', borderRadius: '6px', marginTop: '4px', padding: 0, listStyle: 'none', maxHeight: '300px', overflowY: 'auto', zIndex: 50, color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
              {filteredData.length > 0 ? (
                filteredData.map((company) => (
                  <li 
                    key={company.ticker} 
                    onClick={() => handleSelect(company.ticker)} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2962FF'} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} 
                    style={{ 
                      padding: '10px 12px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #2B2B43',
                      display: 'flex',
                      alignItems: 'baseline', // Permet d'aligner le texte sur la même ligne de base même s'ils ont des tailles différentes
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {/* LE NOM EN GRAND ET EN GRAS */}
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginRight: '8px' }}>
                      {company.name || company.ticker}
                    </span>
                    
                    {/* LE TICKER EN PLUS PETIT ET EN CYAN */}
                    <span style={{ fontSize: '12px', color: '#00bcd4' }}>
                      ({company.ticker})
                    </span>
                  </li>
                ))
              ) : (
                <li style={{ padding: '10px 12px', color: '#8a919e', fontStyle: 'italic', fontSize: '13px' }}>Aucun résultat</li>
              )}
            </ul>
          )}
        </div>

        {/* BOUTONS DE NAVIGATION */}
        <div style={{ display: 'flex', backgroundColor: '#1e222d', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('chart')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px 0 0 6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Graphique</button>
          <button onClick={() => setViewMode('fundamentals')} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid #2B2B43', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '0', cursor: 'pointer', transition: 'background-color 0.2s' }}>Infos</button>
          <button onClick={() => setViewMode('macro')} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid #2B2B43', backgroundColor: viewMode === 'macro' ? '#26a69a' : 'transparent', color: 'white', borderRadius: '0 6px 6px 0', cursor: 'pointer', transition: 'background-color 0.2s' }}>🌐 Macro</button>
        </div>
      </div>
    </div>
  );
}

export default Header;