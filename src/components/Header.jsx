import React, { useState, useRef, useEffect } from 'react';

function Header({ selectedSymbol, setSelectedSymbol, fundamentalsData, viewMode, setViewMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // 1. Mettre à jour l'affichage de l'input quand l'action sélectionnée change
  useEffect(() => {
    const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
    if (selectedCompany) {
      setSearchTerm(`${selectedCompany.name} (${selectedCompany.ticker})`);
    }
  }, [selectedSymbol, fundamentalsData]);

  // 2. Fermer le menu si l'utilisateur clique en dehors du champ de recherche
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // On remet le texte par défaut (l'action sélectionnée) si on quitte sans rien choisir
        const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
        if (selectedCompany) {
          setSearchTerm(`${selectedCompany.name} (${selectedCompany.ticker})`);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSymbol, fundamentalsData]);

  // 3. Logique de filtrage (cherche dans le nom OU dans le ticker)
  const filteredData = fundamentalsData.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    company.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Action quand on clique sur une action dans la liste
  const handleSelect = (ticker) => {
    setSelectedSymbol(ticker);
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
      <h1 style={{ margin: 0, color: '#fff' }}>Boursicot Pro 📈</h1>
      <div style={{ display: 'flex', gap: '15px' }}>
        
        {/* === NOUVELLE BARRE DE RECHERCHE === */}
        <div ref={dropdownRef} style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onClick={() => {
              setSearchTerm(''); // Vide le champ pour faciliter la nouvelle recherche
              setIsOpen(true);
            }}
            placeholder={fundamentalsData.length === 0 ? "Chargement..." : "Rechercher une action..."}
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
                  Aucun résultat pour "{searchTerm}"
                </li>
              )}
            </ul>
          )}
        </div>
        {/* === FIN DE LA BARRE DE RECHERCHE === */}

        <div style={{ display: 'flex', backgroundColor: '#1e222d', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('chart')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Données de marché</button>
          <button onClick={() => setViewMode('fundamentals')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Infos Entreprise</button>
        </div>
      </div>
    </div>
  );
}

export default Header;