import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TradingChart from './components/TradingChart';
import Fundamentals from './components/Fundamentals';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [viewMode, setViewMode] = useState('chart');
  
  // État pour tes données brutes issues de l'API
  const [fundamentalsData, setFundamentalsData] = useState([]); 

  // (Ici tu as normalement ton useEffect qui fait le fetch pour remplir fundamentalsData)
  // ...

  return (
    <div style={{ backgroundColor: '#0b0e11', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* HEADER : On lui passe directement toutes les données, c'est lui qui fera le tri */}
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