import React, { useState, useEffect } from 'react';
// Attention : on respecte la casse exacte de tes fichiers !
import Header from './component/header';
import TradingChart from './component/TradingChart';
import Fundamentals from './component/fundamentals';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [viewMode, setViewMode] = useState('chart');
  
  // État pour tes données de la barre de recherche
  const [fundamentalsData, setFundamentalsData] = useState([]); 

  // === CHARGEMENT DES DONNÉES ===
  // J'ai mis des données factices avec des "types" différents pour que tu puisses tester tes filtres.
  // Si tu as déjà un vrai "fetch" vers une API, remplace ce bloc par ton code !
  useEffect(() => {
    const loadData = () => {
      const mockData = [
        { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
        { ticker: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
        { ticker: 'SPY', name: 'S&P 500 ETF', type: 'index' },
        { ticker: 'QQQ', name: 'Nasdaq 100 ETF', type: 'index' },
        { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
        { ticker: 'ETH', name: 'Ethereum', type: 'crypto' },
        { ticker: 'GLD', name: 'Gold Trust', type: 'commodity' },
        { ticker: 'USO', name: 'US Oil Fund', type: 'commodity' }
      ];
      setFundamentalsData(mockData);
    };

    // On simule un petit délai réseau de 0.5s pour voir le "Chargement..."
    setTimeout(loadData, 500);
  }, []);

  return (
    <div style={{ backgroundColor: '#0b0e11', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* HEADER : On lui passe directement toutes les données, c'est lui qui gère les filtres */}
      <Header 
        selectedSymbol={selectedSymbol} 
        setSelectedSymbol={setSelectedSymbol}
        fundamentalsData={fundamentalsData} 
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