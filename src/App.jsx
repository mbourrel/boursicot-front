import React, { useState, useEffect } from 'react';
import Header from './component/Header';
import TradingChart from './component/TradingChart';
import Fundamentals from './component/Fundamentals';
// PAS de import App ici !
function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [viewMode, setViewMode] = useState('chart');
  
  // On imagine que tu as déjà un état pour tes données brutes issues de l'API
  const [fundamentalsData, setFundamentalsData] = useState([]); 

  // === 1. NOUVEL ÉTAT POUR LES FILTRES (Tous cochés par défaut) ===
  const [assetFilters, setAssetFilters] = useState({
    stock: true,
    index: true,
    crypto: true,
    commodity: true
  });

  // (Ici tu as normalement ton useEffect qui fait le fetch(".../api/companies") pour remplir fundamentalsData)
  // ...

  // === 2. FONCTION POUR BASCULER L'ÉTAT D'UNE CASE ===
  const handleFilterChange = (assetType) => {
    setAssetFilters(prev => ({
      ...prev,
      [assetType]: !prev[assetType]
    }));
  };

  // === 3. FILTRAGE DES DONNÉES ===
  // On crée une nouvelle liste qui ne contient que les actifs dont la case correspondante est cochée.
  const filteredData = fundamentalsData.filter(asset => {
    // Note: On suppose que tes objets ont une propriété "type" ('stock', 'index', 'crypto', 'commodity').
    // Si la propriété est absente, on peut décider de la considérer comme une action par défaut.
    const type = asset.type || 'stock'; 
    return assetFilters[type];
  });

  return (
    <div style={{ backgroundColor: '#0b0e11', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* === NOUVELLE BARRE DE FILTRES AU DESSUS DU HEADER === */}
      <div style={{ 
        display: 'flex', gap: '20px', marginBottom: '15px', padding: '10px 15px', 
        backgroundColor: '#1e222d', borderRadius: '8px', border: '1px solid #2B2B43',
        alignItems: 'center'
      }}>
        <span style={{ color: '#8a919e', fontSize: '12px', fontWeight: 'bold', marginRight: '10px' }}>
          FILTRER LA RECHERCHE :
        </span>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={assetFilters.stock} 
            onChange={() => handleFilterChange('stock')} 
            style={{ cursor: 'pointer', accentColor: '#2962FF' }} 
          />
          Actions
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={assetFilters.index} 
            onChange={() => handleFilterChange('index')} 
            style={{ cursor: 'pointer', accentColor: '#2962FF' }} 
          />
          Indices
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={assetFilters.crypto} 
            onChange={() => handleFilterChange('crypto')} 
            style={{ cursor: 'pointer', accentColor: '#2962FF' }} 
          />
          Cryptos
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={assetFilters.commodity} 
            onChange={() => handleFilterChange('commodity')} 
            style={{ cursor: 'pointer', accentColor: '#2962FF' }} 
          />
          Matières Premières
        </label>
      </div>

      {/* HEADER : On lui passe "filteredData" au lieu de "fundamentalsData" */}
      <Header 
        selectedSymbol={selectedSymbol} 
        setSelectedSymbol={setSelectedSymbol}
        fundamentalsData={filteredData} 
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      
      {/* CORPS DE L'APPLICATION */}
      {viewMode === 'chart' ? (
        <TradingChart selectedSymbol={selectedSymbol} />
      ) : (
        <Fundamentals selectedSymbol={selectedSymbol} fundamentalsData={fundamentalsData} />
      )}
      
    </div>
  );
}

export default App;