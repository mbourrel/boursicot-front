import { useState } from 'react';
import Header from './components/Header';
import CompareBar from './components/CompareBar';
import TradingChart from './components/TradingChart';
import SimpleChart from './components/SimpleChart';
import Fundamentals from './components/Fundamentals';
import MacroEnvironment from './components/MacroEnvironment';
import ErrorBoundary from './components/ErrorBoundary';
import { useAssets } from './hooks/useAssets';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('AI.PA');
  const [compareSymbols, setCompareSymbols] = useState([]);
  const [viewMode,       setViewMode]       = useState('chart');
  const [chartMode,      setChartMode]      = useState('trading');

  const { assets: fundamentalsData } = useAssets();

  const handleSelectSymbol = (ticker) => {
    setSelectedSymbol(ticker);
    setCompareSymbols([]);
  };

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

      {viewMode !== 'macro' && (
        <CompareBar
          primarySymbol={selectedSymbol}
          compareSymbols={compareSymbols}
          setCompareSymbols={setCompareSymbols}
          allAssets={fundamentalsData}
        />
      )}

      {viewMode === 'macro' ? (
        <ErrorBoundary label="Macro">
          <MacroEnvironment />
        </ErrorBoundary>
      ) : viewMode === 'chart' ? (
        <>
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

          <ErrorBoundary label="Graphique">
            {chartMode === 'trading'
              ? <TradingChart selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
              : <SimpleChart  selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
            }
          </ErrorBoundary>
        </>
      ) : (
        <ErrorBoundary label="Fondamentaux">
          <Fundamentals selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;
