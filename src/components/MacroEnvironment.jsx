import EconomicClock from './EconomicClock';
import LiquidityMonitor from './LiquidityMonitor';
import AssetWindMatrix from './AssetWindMatrix';
import CentralBanksThermometer from './CentralBanksThermometer';
import YieldCurveChart from './YieldCurveChart';
import SovereignSpreadsChart from './SovereignSpreadsChart';
import { useMacro } from '../hooks/useMacro';
import { useRates } from '../hooks/useRates';

function MacroEnvironment() {
  const { cycleData, cycleHistory, liquidityData, loading, error } = useMacro();
  const { data: ratesData, loading: ratesLoading, error: ratesError } = useRates();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
            Cycle économique · Liquidité mondiale · Taux directeurs · Dettes souveraines
          </div>
        </div>
      </div>

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
    </div>
  );
}

export default MacroEnvironment;
