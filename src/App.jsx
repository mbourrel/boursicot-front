import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { registerTokenGetter } from './api/config';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/Header';
import CompareBar from './components/CompareBar';
import TradingChart from './components/TradingChart';
import SimpleChart from './components/SimpleChart';
import Fundamentals from './components/Fundamentals';
import MacroEnvironment from './components/MacroEnvironment';
import ErrorBoundary from './components/ErrorBoundary';
import { useAssets } from './hooks/useAssets';

// ── Dashboard (contenu protégé) ──────────────────────────────────────────────
function Dashboard() {
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
    <div style={{ backgroundColor: 'var(--bg0)', minHeight: '100vh', color: 'var(--text1)', fontFamily: 'sans-serif' }}>

      {/* ── ZONE STICKY : bannière + header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'var(--bg0)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px 10px',
      }}>
        <div style={{
          backgroundColor: '#1a1400', border: '1px solid #f59e0b40',
          borderRadius: '6px', padding: '6px 14px', marginBottom: '10px',
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
      </div>

      {/* ── CONTENU SCROLLABLE ── */}
      <div style={{ padding: '20px' }}>

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
    </div>
  );
}

// ── Router racine ─────────────────────────────────────────────────────────────
function App() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) registerTokenGetter(getToken);
  }, [getToken, isLoaded]);

  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/*"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
