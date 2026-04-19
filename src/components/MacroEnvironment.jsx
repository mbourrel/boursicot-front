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
  const [cycleLoading,    setCycleLoading]    = useState(true);
  const [liquidityLoading,setLiquidityLoading]= useState(true);
  const [cycleError,      setCycleError]      = useState(null);
  const [liquidityError,  setLiquidityError]  = useState(null);

  useEffect(() => {
    // ── Cycle économique ──────────────────────────────────────────────────
    fetch(`${API_URL}/macro/cycle`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setCycleData(data); setCycleLoading(false); })
      .catch((err) => {
        setCycleError(`Impossible de charger le cycle économique (${err.message})`);
        setCycleLoading(false);
      });

    // ── Liquidité M2 vs BTC ───────────────────────────────────────────────
    fetch(`${API_URL}/macro/liquidity`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setLiquidityData(data); setLiquidityLoading(false); })
      .catch((err) => {
        setLiquidityError(`Impossible de charger les données de liquidité (${err.message})`);
        setLiquidityLoading(false);
      });
  }, [API_URL]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── En-tête de section ── */}
      <div style={{
        backgroundColor: '#1a1e2e', borderRadius: '10px', border: '1px solid #2B2B43',
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🌐</span>
        <div>
          <div style={{ color: '#d1d4dc', fontWeight: 'bold', fontSize: '15px' }}>
            Environnement Macro Global
          </div>
          <div style={{ color: '#8a919e', fontSize: '12px', marginTop: '2px' }}>
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
