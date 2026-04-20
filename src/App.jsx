import { useState, useEffect } from 'react';
import Header from './components/Header';
import CompareBar from './components/CompareBar';
import TradingChart from './components/TradingChart';
import SimpleChart from './components/SimpleChart';
import Fundamentals from './components/Fundamentals';
import MacroEnvironment from './components/MacroEnvironment';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('^FCHI');
  const [compareSymbols, setCompareSymbols] = useState([]);
  const [viewMode, setViewMode] = useState('chart');
  const [chartMode, setChartMode] = useState('trading');
  const [fundamentalsData, setFundamentalsData] = useState([]);

  // Réinitialiser les comparaisons quand on change d'actif primaire
  const handleSelectSymbol = (ticker) => {
    setSelectedSymbol(ticker);
    setCompareSymbols([]);
  };

  useEffect(() => {
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
      "NG=F": "Gaz Naturel", "ZC=F": "Maïs (Corn)", "ZW=F": "Blé (Wheat)", "CT=F": "Coton",
    };

    setFundamentalsData(
      Object.keys(assetDictionary).map(ticker => ({ ticker, name: assetDictionary[ticker] }))
    );
  }, []);

  const toggleBtnStyle = (active) => ({
    padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
    border: '1px solid var(--border)', transition: 'all 0.2s',
    background: active ? '#2962FF' : 'var(--bg3)',
    color: active ? 'white' : 'var(--text3)',
  });

  return (
    <div style={{ backgroundColor: 'var(--bg0)', minHeight: '100vh', padding: '20px', color: 'var(--text1)', fontFamily: 'sans-serif' }}>

      <div style={{
        backgroundColor: '#1a1400', border: '1px solid #f59e0b40',
        borderRadius: '6px', padding: '8px 14px', marginBottom: '14px',
        fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span>⚠</span>
        <span>Version bêta gratuite — si les données ne s'affichent pas, patientez environ une minute le temps que le serveur démarre.</span>
      </div>

      <Header
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={handleSelectSymbol}
        fundamentalsData={fundamentalsData}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Barre de comparaison — masquée sur la vue Macro */}
      {viewMode !== 'macro' && (
        <CompareBar
          primarySymbol={selectedSymbol}
          compareSymbols={compareSymbols}
          setCompareSymbols={setCompareSymbols}
          allAssets={fundamentalsData}
        />
      )}

      {viewMode === 'macro' ? (
        <MacroEnvironment />
      ) : viewMode === 'chart' ? (
        <>
          {/* Toggle Trading / Simple */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '12px' }}>
            <button
              onClick={() => setChartMode('trading')}
              style={{ ...toggleBtnStyle(chartMode === 'trading'), borderRadius: '6px 0 0 6px' }}
            >
              Trading
            </button>
            <button
              onClick={() => setChartMode('simple')}
              style={{ ...toggleBtnStyle(chartMode === 'simple'), borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
            >
              Simple
            </button>
          </div>

          {chartMode === 'trading'
            ? <TradingChart selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
            : <SimpleChart selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
          }
        </>
      ) : (
        <Fundamentals selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} />
      )}
    </div>
  );
}

export default App;
