import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import TradingChart from './components/TradingChart';
import Fundamentals from './components/Fundamentals';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [viewMode, setViewMode] = useState('chart');
  const [fundamentalsData, setFundamentalsData] = useState([]);

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : import.meta.env.VITE_API_URL;

  // Récupération initiale des fondamentaux (une seule fois au chargement)
  useEffect(() => {
    fetch(`${API_URL}/api/fundamentals`)
      .then(res => res.json())
      .then(data => { 
        if (!data.error && Array.isArray(data)) {
          setFundamentalsData(data);
          if (data.length > 0) setSelectedSymbol(data[0].ticker);
        } 
      })
      .catch(err => console.error("Erreur fondamentaux:", err));
  }, [API_URL]);

  // Extraction des données de l'entreprise actuellement sélectionnée
  const currentData = Array.isArray(fundamentalsData) 
    ? fundamentalsData.find(f => f.ticker === selectedSymbol) 
    : null;

  return (
    <div style={{ padding: '30px', backgroundColor: '#0b0e14', minHeight: '100vh', color: '#d1d4dc', fontFamily: 'Inter, sans-serif' }}>
      
      <Header 
        selectedSymbol={selectedSymbol} 
        setSelectedSymbol={setSelectedSymbol} 
        fundamentalsData={fundamentalsData} 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
      />

      {viewMode === 'chart' ? (
        <TradingChart selectedSymbol={selectedSymbol} />
      ) : (
        <Fundamentals currentData={currentData} />
      )}

    </div>
  );
}

export default App;