import { useState, useEffect } from 'react';
import EconomicClock from './EconomicClock';
import LiquidityMonitor from './LiquidityMonitor';
import AssetWindMatrix from './AssetWindMatrix';

function MacroEnvironment() {
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.VITE_API_URL;

  const [cycleData,       setCycleData]       = useState(null);
  const [liquidityData,   setLiquidityData]   = useState(null);
  const [cycleHistory,    setCycleHistory]    = useState(null);
  const [cycleLoading,    setCycleLoading]    = useState(true);
  const [liquidityLoading,setLiquidityLoading]= useState(true);
  const [historyLoading,  setHistoryLoading]  = useState(true);
  const [cycleError,      setCycleError]      = useState(null);
  const [liquidityError,  setLiquidityError]  = useState(null);

  useEffect(() => {
    const fetchWithDetail = (url) =>
      fetch(url).then(async (r) => {
        if (!r.ok) {
          // Lire le detail FastAPI pour avoir le vrai message d'erreur
          let detail = `HTTP ${r.status}`;
          try { const body = await r.json(); detail = body.detail ?? detail; } catch {}
          throw new Error(detail);
        }
        return r.json();
      });

    // ── Cycle économique ──────────────────────────────────────────────────
    fetchWithDetail(`${API_URL}/macro/cycle`)
      .then((data) => { setCycleData(data); setCycleLoading(false); })
      .catch((err) => { setCycleError(err.message); setCycleLoading(false); });

    // ── Historique du cycle économique ───────────────────────────────────
    fetchWithDetail(`${API_URL}/macro/cycle/history`)
      .then((data) => { setCycleHistory(data.history); setHistoryLoading(false); })
      .catch(() => { setHistoryLoading(false); });

    // ── Liquidité M2 vs BTC ───────────────────────────────────────────────
    fetchWithDetail(`${API_URL}/macro/liquidity`)
      .then((data) => { setLiquidityData(data); setLiquidityLoading(false); })
      .catch((err) => { setLiquidityError(err.message); setLiquidityLoading(false); });
  }, [API_URL]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── En-tête de section ── */}
      <div style={{
        backgroundColor: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)',
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🌐</span>
        <div>
          <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '15px' }}>
            Environnement Macro Global
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px' }}>
            Cycle économique · Liquidité mondiale · Positionnement recommandé par classe d'actifs
          </div>
        </div>
      </div>

      {/* ── Horloge économique ── */}
      <EconomicClock
        phase={cycleData?.phase}
        growth_yoy={cycleData?.growth_yoy}
        inflation_yoy={cycleData?.inflation_yoy}
        growth_trend={cycleData?.growth_trend}
        inflation_trend={cycleData?.inflation_trend}
        loading={cycleLoading}
        error={cycleError}
        history={cycleHistory}
        historyLoading={historyLoading}
      />

      {/* ── Moniteur de liquidité ── */}
      <LiquidityMonitor
        dates={liquidityData?.dates}
        m2_normalized={liquidityData?.m2_normalized}
        btc_normalized={liquidityData?.btc_normalized}
        loading={liquidityLoading}
        error={liquidityError}
      />

      {/* ── Matrice des vents porteurs ── */}
      <AssetWindMatrix
        phase={cycleData?.phase}
        loading={cycleLoading}
      />
    </div>
  );
}

export default MacroEnvironment;
