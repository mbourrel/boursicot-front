import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useBreakpoint } from './hooks/useBreakpoint';
import { useAuth, useUser } from '@clerk/clerk-react';
import { registerTokenGetter } from './api/config';
import { identifyUser, captureEvent } from './utils/analytics';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/Header';
import CompareBar from './components/CompareBar';
import TradingChart from './components/TradingChart';
import SimpleChart from './components/SimpleChart';
import Fundamentals from './components/Fundamentals';
import MacroEnvironment from './components/MacroEnvironment';
import WelcomeModal from './components/WelcomeModal';
import ErrorBoundary from './components/ErrorBoundary';
import { useAssets } from './hooks/useAssets';
import ConsentBanner from './components/ConsentBanner';
import { useProfile } from './context/ProfileContext';

// ── Dashboard (contenu protégé) ──────────────────────────────────────────────
function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('AI.PA');
  const [compareSymbols, setCompareSymbols] = useState([]);
  const [viewMode,       setViewMode]       = useState('chart');

  const { profile } = useProfile();
  const isExplorateur = profile === 'explorateur';
  const { isMobile } = useBreakpoint();

  const { assets: fundamentalsData } = useAssets();

  const handleSelectSymbol = (ticker) => {
    setSelectedSymbol(ticker);
    setCompareSymbols([]);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg0)', minHeight: '100vh', color: 'var(--text1)', fontFamily: 'sans-serif', overflowX: 'hidden', maxWidth: '100vw' }}>

      {/* Onboarding — affiché en overlay si aucun profil n'est encore choisi */}
      {profile === null && <WelcomeModal />}

      {/* ── ZONE STICKY : bannière + header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'var(--bg0)',
        borderBottom: '1px solid var(--border)',
        padding: isMobile ? '8px 12px 8px' : '12px 20px 10px',
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
      <div style={{ padding: isMobile ? '12px' : '20px' }}>

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
          <ErrorBoundary label="Graphique">
            {/* Explorateur : SimpleChart uniquement. Stratège : toggle Simple / Trading */}
            {isExplorateur ? (
              <SimpleChart selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
            ) : (
              <ChartWithToggle selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} fundamentalsData={fundamentalsData} />
            )}
          </ErrorBoundary>
        ) : (
          <ErrorBoundary label="Fondamentaux">
            <Fundamentals selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

// Toggle Simple/Trading — visible uniquement pour le profil Stratège
function ChartWithToggle({ selectedSymbol, compareSymbols, fundamentalsData }) {
  const [chartMode, setChartMode] = useState('trading');

  const toggleBtnStyle = (active) => ({
    padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
    border: '1px solid var(--border)', transition: 'all 0.2s',
    background: active ? '#2962FF' : 'var(--bg3)',
    color: active ? 'white' : 'var(--text3)',
  });

  return (
    <>
      <div style={{ display: 'flex', gap: '0', marginBottom: '12px' }}>
        <button
          onClick={() => { captureEvent('chart_mode_changed', { mode: 'simple' }); setChartMode('simple'); }}
          style={{ ...toggleBtnStyle(chartMode === 'simple'), borderRadius: '6px 0 0 6px' }}
        >
          Simple
        </button>
        <button
          onClick={() => { captureEvent('chart_mode_changed', { mode: 'trading' }); setChartMode('trading'); }}
          style={{ ...toggleBtnStyle(chartMode === 'trading'), borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
        >
          Trading
        </button>
      </div>
      {chartMode === 'simple'
        ? <SimpleChart  selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
        : <TradingChart selectedSymbol={selectedSymbol} compareSymbols={compareSymbols} allAssets={fundamentalsData} />
      }
    </>
  );
}

// ── Router racine ─────────────────────────────────────────────────────────────
function App() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isLoaded) registerTokenGetter(getToken);
  }, [getToken, isLoaded]);

  useEffect(() => {
    if (!user?.id) return;
    identifyUser(user.id);
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    if (accountAgeMs < 5 * 60 * 1000) captureEvent('signup_completed');
  }, [user?.id]);

  return (
    <>
      <ConsentBanner />
      <Routes>
        <Route path="/login/*"    element={<LoginPage />} />
        <Route path="/register/*" element={<RegisterPage />} />
        <Route path="/*"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
