import { useState, useEffect } from 'react';
import Header from './components/Header';
import TradingChart from './components/TradingChart';
import SimpleChart from './components/SimpleChart';
import Fundamentals from './components/Fundamentals';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [viewMode, setViewMode] = useState('chart');
  const [chartMode, setChartMode] = useState('trading');
  const [fundamentalsData, setFundamentalsData] = useState([]);

  useEffect(() => {
    const loadData = () => {
      // Dictionnaire associant chaque ticker à son vrai nom
      const assetDictionary = {
        // --- CAC 40 ---
        "AC.PA": "Accor", "AI.PA": "Air Liquide", "AIR.PA": "Airbus", "MT.AS": "ArcelorMittal", "CS.PA": "AXA", 
        "BNP.PA": "BNP Paribas", "EN.PA": "Bouygues", "BVI.PA": "Bureau Veritas", "CAP.PA": "Capgemini", "CA.PA": "Carrefour", 
        "ACA.PA": "Crédit Agricole", "BN.PA": "Danone", "DSY.PA": "Dassault Systèmes", "EDF.PA": "EDF", "ENGI.PA": "Engie", 
        "EL.PA": "EssilorLuxottica", "ERF.PA": "Eurofins Scientific", "ENX.PA": "Euronext", "RMS.PA": "Hermès", "KER.PA": "Kering", 
        "OR.PA": "L'Oréal", "LR.PA": "Legrand", "MC.PA": "LVMH", "ML.PA": "Michelin", "ORA.PA": "Orange", 
        "RI.PA": "Pernod Ricard", "PUB.PA": "Publicis", "RNO.PA": "Renault", "SAF.PA": "Safran", "SGO.PA": "Saint-Gobain", 
        "SAN.PA": "Sanofi", "SU.PA": "Schneider Electric", "GLE.PA": "Société Générale", "STLAP.PA": "Stellantis", "STMPA.PA": "STMicroelectronics", 
        "HO.PA": "Thales", "TTE.PA": "TotalEnergies", "URW.PA": "Unibail-Rodamco-Westfield", "VIE.PA": "Veolia", "DG.PA": "Vinci",

        // --- LES 7 FANTASTIQUES ---
        "AAPL": "Apple", "MSFT": "Microsoft", "GOOGL": "Alphabet", "AMZN": "Amazon", "META": "Meta", "NVDA": "NVIDIA", "TSLA": "Tesla",

        // --- INDICES ET CRYPTOS ---
        "^FCHI": "CAC 40", "^GSPC": "S&P 500", "^IXIC": "Nasdaq Composite", "^DJI": "Dow Jones", 
        "^STOXX50E": "Euro Stoxx 50", "^N225": "Nikkei 225", "^VIX": "VIX Volatility Index", 
        "BTC-USD": "Bitcoin",

        // --- MATIÈRES PREMIÈRES ET ÉNERGIE ---
        "GC=F": "Or (Gold)", "SI=F": "Argent (Silver)", "CL=F": "Pétrole Brut WTI", "BZ=F": "Pétrole Brent", 
        "NG=F": "Gaz Naturel", "ZC=F": "Maïs (Corn)", "ZW=F": "Blé (Wheat)", "CT=F": "Coton"
      };

      // On transforme ce dictionnaire en un tableau d'objets pour le composant Header
      const formattedData = Object.keys(assetDictionary).map(ticker => ({
        ticker: ticker,
        name: assetDictionary[ticker]
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
        <>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            <button
              onClick={() => setChartMode('trading')}
              style={{
                padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '6px 0 0 6px', border: '1px solid #2B2B43', transition: 'all 0.2s',
                background: chartMode === 'trading' ? '#2962FF' : '#1e222d',
                color: chartMode === 'trading' ? 'white' : '#8a919e',
              }}>
              Trading
            </button>
            <button
              onClick={() => setChartMode('simple')}
              style={{
                padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '0 6px 6px 0', border: '1px solid #2B2B43', borderLeft: 'none', transition: 'all 0.2s',
                background: chartMode === 'simple' ? '#2962FF' : '#1e222d',
                color: chartMode === 'simple' ? 'white' : '#8a919e',
              }}>
              Simple
            </button>
          </div>
          {chartMode === 'trading'
            ? <TradingChart selectedSymbol={selectedSymbol} />
            : <SimpleChart selectedSymbol={selectedSymbol} />
          }
        </>
      ) : (
        <Fundamentals selectedSymbol={selectedSymbol} />
      )}
      
    </div>
  );
}

export default App;