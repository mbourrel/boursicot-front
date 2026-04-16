import React, { useState, useRef, useEffect } from 'react';

function Header({ selectedSymbol, setSelectedSymbol, fundamentalsData, viewMode, setViewMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // 1. ÉTAT DES FILTRES
  const [assetFilters, setAssetFilters] = useState({
    stock: true,
    index: true,
    crypto: true,
    commodity: true
  });

  useEffect(() => {
    const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
    if (selectedCompany) {
      setSearchTerm(`${selectedCompany.name} (${selectedCompany.ticker})`);
    }
  }, [selectedSymbol, fundamentalsData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
        if (selectedCompany) {
          setSearchTerm(`${selectedCompany.name} (${selectedCompany.ticker})`);
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

  // === NOUVEAUTÉ : Fonction pour deviner le type grâce au Ticker ===
  const getAssetType = (ticker) => {
    if (!ticker) return 'stock';
    if (ticker.includes('=F')) return 'commodity'; // ex: GC=F, CL=F
    if (ticker.startsWith('^')) return 'index';    // ex: ^FCHI, ^GSPC
    if (ticker.includes('-USD')) return 'crypto';  // ex: BTC-USD
    return 'stock'; // Par défaut (ex: AAPL, LVMH.PA)
  };

  // 3. LOGIQUE DE FILTRAGE COMBINÉE
  const filteredData = fundamentalsData.filter(company => {
    // On utilise notre nouvelle fonction pour catégoriser l'actif
    const type = getAssetType(company.ticker); 
    
    // Si la case de cette catégorie n'est pas cochée, on exclut
    if (!assetFilters[type]) return false;

    // Sinon, on vérifie si ça correspond au texte tapé (recherche par nom ou par ticker)
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
        
        {/* === BARRE DE FILTRES === */}
        <div style={{ 
          display: 'flex', gap: '12px', padding: '8px 12px', 
          backgroundColor: '#1e222d', borderRadius: '6px', border: '1px solid #2B2B43',
          alignItems: 'center'
        }}>
          <span style={{ color: '#8a919e', fontSize: '11px', fontWeight: 'bold' }}>FILTRER :</span>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.stock} onChange={() => handleFilterChange('stock')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} />
            Actions
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.index} onChange={() => handleFilterChange('index')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} />
            Indices
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.crypto} onChange={() => handleFilterChange('crypto')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} />
            Cryptos
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
            <input type="checkbox" checked={assetFilters.commodity} onChange={() => handleFilterChange('commodity')} style={{ cursor: 'pointer', accentColor: '#2962FF' }} />
            Matières
          </label>
        </div>

        {/* === BARRE DE RECHERCHE === */}
        <div ref={dropdownRef} style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onClick={() => {
              setSearchTerm(''); 
              setIsOpen(true);
            }}
            placeholder={fundamentalsData.length === 0 ? "Chargement..." : "Rechercher..."}
            disabled={fundamentalsData.length === 0}
            style={{ 
              width: '100%', padding: '8px 12px', borderRadius: '6px', 
              backgroundColor: '#1e222d', color: 'white', border: '1px solid #2B2B43', 
              outline: 'none', boxSizing: 'border-box', cursor: 'text'
            }}
          />
          
          {/* Menu déroulant des résultats */}
          {isOpen && (
            <ul style={{ 
              position: 'absolute', top: '100%', left: 0, width: '100%', 
              backgroundColor: '#1e222d', border: '1px solid #2B2B43', 
              borderRadius: '6px', marginTop: '4px', padding: 0, 
              listStyle: 'none', maxHeight: '300px', overflowY: 'auto', 
              zIndex: 50, color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}>
              {filteredData.length > 0 ? (
                filteredData.map((company) => (
                  <li 
                    key={company.ticker} 
                    onClick={() => handleSelect(company.ticker)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2962FF'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    style={{ 
                      padding: '10px 12px', cursor: 'pointer', 
                      borderBottom: '1px solid #2B2B43', transition: 'background-color 0.2s' 
                    }}
                  >
                    <strong style={{ color: '#00bcd4', marginRight: '8px' }}>{company.ticker}</strong> 
                    <span style={{ fontSize: '13px' }}>{company.name}</span>
                  </li>
                ))
              ) : (
                <li style={{ padding: '10px 12px', color: '#8a919e', fontStyle: 'italic', fontSize: '13px' }}>
                  Aucun résultat
                </li>
              )}
            </ul>
          )}
        </div>

        {/* === BOUTONS DE NAVIGATION === */}
        <div style={{ display: 'flex', backgroundColor: '#1e222d', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('chart')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Graphique</button>
          <button onClick={() => setViewMode('fundamentals')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Infos</button>
        </div>
        
      </div>
    </div>
  );
}

export default Header;