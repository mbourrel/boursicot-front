import { captureEvent } from '../../utils/analytics';

/**
 * Barre de contrôle du TradingChart :
 * sélection d'intervalle de bougies, zoom temporel, et toggle des indicateurs.
 */
function ChartControls({ candleInterval, setCandleInterval, timeRange, onTimeRangeChange, indicators, toggleIndicator, showDrawTools, onToggleDrawTools }) {
  const filterBtnStyle = (isActive, activeColor = '#2962FF') => ({
    padding: '6px 10px', background: isActive ? activeColor : 'transparent',
    color: isActive ? 'white' : 'var(--text3)',
    border: `1px solid ${isActive ? activeColor : 'var(--border)'}`,
    borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>

      {/* Ligne 1 : Bougies + Zoom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '5px' }}>BOUGIES :</span>
            {['15m', '1h', '1D', '1W'].map(iv => (
              <button key={iv} style={filterBtnStyle(candleInterval === iv)} onClick={() => { captureEvent('candle_interval_changed', { interval: iv }); setCandleInterval(iv); }}>
                {iv === '15m' ? '15 Min' : iv === '1h' ? '1 Heure' : iv === '1D' ? 'Jour' : 'Semaine'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '5px' }}>ZOOM :</span>
            {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(r => (
              <button key={r} style={filterBtnStyle(timeRange === r)} onClick={() => { captureEvent('time_range_changed', { range: r }); onTimeRangeChange(r); }}>
                {r === 'ALL' ? 'Tout' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ligne 2 : Indicateurs + Dessiner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '5px' }}>INDICATEURS :</span>
          <button style={filterBtnStyle(indicators.volume)}             onClick={() => { captureEvent('indicator_toggled', { indicator: 'volume',  enabled: !indicators.volume  }); toggleIndicator('volume');  }}>Volumes</button>
          <button style={filterBtnStyle(indicators.bb)}                 onClick={() => { captureEvent('indicator_toggled', { indicator: 'bb',      enabled: !indicators.bb      }); toggleIndicator('bb');      }}>Bollinger</button>
          <button style={filterBtnStyle(indicators.atr, '#e91e63')}    onClick={() => { captureEvent('indicator_toggled', { indicator: 'atr',     enabled: !indicators.atr     }); toggleIndicator('atr');     }}>Volatilité (ATR)</button>
          <button style={filterBtnStyle(indicators.ma10, '#00bcd4')}   onClick={() => { captureEvent('indicator_toggled', { indicator: 'ma10',    enabled: !indicators.ma10    }); toggleIndicator('ma10');    }}>MM 10</button>
          <button style={filterBtnStyle(indicators.ma100, '#ff9800')}  onClick={() => { captureEvent('indicator_toggled', { indicator: 'ma100',   enabled: !indicators.ma100   }); toggleIndicator('ma100');   }}>MM 100</button>
          <button style={filterBtnStyle(indicators.ma200, '#9c27b0')}  onClick={() => { captureEvent('indicator_toggled', { indicator: 'ma200',   enabled: !indicators.ma200   }); toggleIndicator('ma200');   }}>MM 200</button>
        </div>
        <button
          style={{ ...filterBtnStyle(showDrawTools, '#374151'), display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => { captureEvent('draw_tools_toggled', { enabled: !showDrawTools }); onToggleDrawTools(); }}
        >
          ✏ Dessiner
        </button>
      </div>
    </div>
  );
}

export default ChartControls;
