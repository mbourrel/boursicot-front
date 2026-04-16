import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TradingChart from './components/TradingChart';
import Fundamentals from './components/Fundamentals';

function App() {
  // On démarre par exemple sur le CAC40 ou Apple
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [viewMode, setViewMode] = useState('chart');
  const [fundamentalsData, setFundamentalsData] = useState([]); 

  useEffect(() => {
    const loadData = () => {
      // Ta véritable base de données de tickers
      const rawTickers = [
        "AC.PA", "AI.PA", "AIR.PA", "MT.AS", "CS.PA", "BNP.PA", "EN.PA", "BVI.PA", 
        "CAP.PA", "CA.PA", "ACA.PA", "BN.PA", "DSY.PA", "EDF.PA", "ENGI.PA", "EL.PA", 
        "ERF.PA", "ENX.PA", "RMS.PA", "KER.PA", "OR.PA", "LR.PA", "MC.PA", "ML.PA", 
        "ORA.PA", "RI.PA", "PUB.PA", "RNO.PA", "SAF.PA", "SGO.PA", "SAN.PA", "SU.PA", 
        "GLE.PA", "STLAP.PA", "STMPA.PA", "HO.PA", "TTE.PA", "URW.PA", "VIE.PA", "DG.PA",
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA",
        "^FCHI", "^GSPC", "^IXIC", "^DJI", "^STOXX50E", "^N225", "^VIX", "BTC-USD",
        "GC=F", "SI=F", "CL=F", "BZ=F", "NG=F", "ZC=F", "ZW=F", "CT=F"
      ];

      // On transforme ta liste de strings en objets pour le composant Header
      const formattedData = rawTickers.map(ticker => ({
        ticker: ticker,
        name: '' // On laisse vide si tu n'as pas les noms complets, le Header affichera juste le ticker
      }));

      setFundamentalsData(formattedData);
    };

    loadData();
  }, []);

  return (
    <div style={{ backgroundColor: '#0b0e11', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      
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
        <Fundamentals selectedSymbol={selectedSymbol} fundamentalsData={fundamentalsData} />
      )}
      
    </div>
  );
}

export default App;