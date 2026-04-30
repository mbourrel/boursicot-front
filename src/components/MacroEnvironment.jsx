import EconomicClock from './EconomicClock';
import LiquidityMonitor from './LiquidityMonitor';
import AssetWindMatrix from './AssetWindMatrix';
import CentralBanksThermometer from './CentralBanksThermometer';
import YieldCurveChart from './YieldCurveChart';
import SovereignSpreadsChart from './SovereignSpreadsChart';
import { useMacro } from '../hooks/useMacro';
import { useRates } from '../hooks/useRates';
import { useProfile } from '../context/ProfileContext';

function MacroEnvironment() {
  const { cycleData, cycleHistory, liquidityData, loading, error } = useMacro();
  const { data: ratesData, loading: ratesLoading, error: ratesError } = useRates();
  const { profile, setProfile } = useProfile();
  const isExplorateur = profile === 'explorateur';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{
        backgroundColor: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)',
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🌐</span>
          <div>
            <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '15px' }}>
              Environnement Macro Global
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px' }}>
              {isExplorateur
                ? 'Cycle économique — vue simplifiée'
                : 'Cycle économique · Liquidité mondiale · Taux directeurs · Dettes souveraines'}
            </div>
          </div>
        </div>
        {isExplorateur && (
          <button
            onClick={() => setProfile('stratege')}
            style={{
              padding: '7px 14px', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid var(--border)', backgroundColor: 'var(--bg3)',
              color: 'var(--text3)', fontSize: '12px', fontWeight: 'bold',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2962FF'; e.currentTarget.style.color = '#2962FF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
          >
            📈 Vue complète (Stratège)
          </button>
        )}
      </div>

      {/* EconomicClock — visible par tous les profils */}
      <EconomicClock
        phase={cycleData?.phase}
        growth_yoy={cycleData?.growth_yoy}
        inflation_yoy={cycleData?.inflation_yoy}
        growth_trend={cycleData?.growth_trend}
        inflation_trend={cycleData?.inflation_trend}
        loading={loading}
        error={error}
        history={cycleHistory}
        historyLoading={loading}
      />

      {/* Widgets avancés — Stratège uniquement */}
      {!isExplorateur && (
        <>
          <CentralBanksThermometer
            centralBanks={ratesData?.central_banks}
            loading={ratesLoading}
            error={ratesError}
          />

          <YieldCurveChart
            yieldCurve={ratesData?.yield_curve}
            bondYields={ratesData?.bond_yields}
            loading={ratesLoading}
            error={ratesError}
          />

          <SovereignSpreadsChart
            history={ratesData?.history}
            bondYields={ratesData?.bond_yields}
            loading={ratesLoading}
            error={ratesError}
          />

          <LiquidityMonitor
            dates={liquidityData?.dates}
            m2_normalized={liquidityData?.m2_normalized}
            btc_normalized={liquidityData?.btc_normalized}
            loading={loading}
            error={error}
          />

          <AssetWindMatrix
            phase={cycleData?.phase}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}

export default MacroEnvironment;
