import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, LineSeries } from 'lightweight-charts';
import { ASSET_COLORS } from './CompareBar';
import { useTheme } from '../context/ThemeContext';
import { API_URL, authFetch } from '../api/config';
import SourceTag from './SourceTag';
import { useBreakpoint } from '../hooks/useBreakpoint';

function SimpleChart({ selectedSymbol, compareSymbols = [], allAssets = [] }) {
  const { theme, isDark } = useTheme();
  const { isMobile } = useBreakpoint();
  const CHART_HEIGHT = isMobile ? 300 : 500;
  const getName = (ticker) => allAssets.find(a => a.ticker === ticker)?.name || ticker;
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const allDataRef = useRef({});
  const debounceTimerRef   = useRef(null);
  const candleIntervalRef  = useRef('1D');
  const ma10sRef  = useRef(null);
  const ma100sRef = useRef(null);
  const ma200sRef = useRef(null);

  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');
  const [assetStats, setAssetStats] = useState({});
  const [hoverData, setHoverData] = useState(null);
  // true = cours réels chacun sur sa propre échelle (défaut), false = normalisé base 100 (%)
  const [individualScales, setIndividualScales] = useState(true);
  const [showMa10,  setShowMa10]  = useState(true);
  const [showMa100, setShowMa100] = useState(true);
  const [showMa200, setShowMa200] = useState(true);


  const allSymbols = [selectedSymbol, ...compareSymbols];
  const isComparing = compareSymbols.length > 0;

  const applyTimeRange = (range, chart = chartInstanceRef.current) => {
    const anyData = Object.values(allDataRef.current)[0];
    if (!chart || !anyData || anyData.length === 0) return;
    if (range === 'ALL') { chart.timeScale().fitContent(); return; }

    const last = anyData[anyData.length - 1];
    const getLastDate = (item) => typeof item.time === 'number' ? new Date(item.time * 1000) : new Date(item.time);
    const lastDate = getLastDate(last);
    let fromDate = new Date(lastDate);

    if (range === '1W') fromDate.setDate(fromDate.getDate() - 7);
    else if (range === '1M') fromDate.setMonth(fromDate.getMonth() - 1);
    else if (range === '3M') fromDate.setMonth(fromDate.getMonth() - 3);
    else if (range === '6M') fromDate.setMonth(fromDate.getMonth() - 6);
    else if (range === '1Y') fromDate.setFullYear(fromDate.getFullYear() - 1);
    else if (range === '5Y') fromDate.setFullYear(fromDate.getFullYear() - 5);

    const fromStr = ['15m', '1h'].includes(candleInterval)
      ? Math.floor(fromDate.getTime() / 1000)
      : fromDate.toISOString().split('T')[0];

    chart.timeScale().setVisibleRange({ from: fromStr, to: last.time });
  };

  // Garde le ref à jour pour éviter les closures périmées dans les callbacks
  useEffect(() => { candleIntervalRef.current = candleInterval; }, [candleInterval]);

  // Recrée le graphique quand les actifs, l'intervalle ou le mode d'échelle changent
  useEffect(() => {
    if (!chartContainerRef.current || !selectedSymbol) return;

    allDataRef.current = {};

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: theme.chartBg }, textColor: theme.chartText },
      grid: { vertLines: { color: theme.chartGrid }, horzLines: { color: theme.chartGrid } },
      width: chartContainerRef.current.clientWidth,
      height: CHART_HEIGHT,
      timeScale: { timeVisible: true, borderColor: theme.chartGrid, minBarSpacing: 0.001 },
      rightPriceScale: { borderColor: theme.chartGrid },
      crosshair: { vertLine: { color: '#758696' }, horzLine: { color: '#758696' } },
    });

    chartInstanceRef.current = chart;

    const seriesMap = {};

    const buildSeries = (ticker, colorIndex, isFirst) => {
      const color = ASSET_COLORS[colorIndex];

      if (isFirst && !isComparing) {
        // Vue solo : area sur l'échelle principale
        const s = chart.addSeries(AreaSeries, {
          lineColor: color, topColor: `${color}40`, bottomColor: `${color}05`, lineWidth: 2,
        });
        seriesMap[ticker] = s;
        return;
      }

      if (isFirst || !individualScales) {
        // Mode normalisé OU actif principal en mode individuel : échelle principale partagée
        const s = chart.addSeries(LineSeries, {
          color, lineWidth: isFirst ? 2.5 : 1.5, crosshairMarkerVisible: true,
        });
        seriesMap[ticker] = s;
        return;
      }

      // Mode individuel : chaque actif de comparaison sur sa propre échelle cachée
      const scaleId = `compare_${colorIndex}`;
      chart.priceScale(scaleId).applyOptions({ visible: false });
      const s = chart.addSeries(LineSeries, {
        color, lineWidth: 1.5, crosshairMarkerVisible: true, priceScaleId: scaleId,
      });
      seriesMap[ticker] = s;
    };

    let isMounted = true;
    let loadedCount = 0;
    let upgradeScheduled = false;

    const fetchAndDraw = (ticker, colorIndex) => {
      return authFetch(`${API_URL}/api/prices?ticker=${encodeURIComponent(ticker)}&interval=${candleInterval}`)
        .then(res => res.json())
        .then(data => {
          if (!isMounted || !Array.isArray(data)) return;

          const rawData = data.map(i => ({
            time: ['15m', '1h'].includes(candleInterval)
              ? Math.floor(new Date(i.time).getTime() / 1000)
              : i.time.split('T')[0],
            value: i.close,
          })).sort((a, b) => typeof a.time === 'number' ? a.time - b.time : new Date(a.time) - new Date(b.time));

          if (!isComparing && colorIndex === 0) {
            for (let i = 0; i < rawData.length; i++) {
              const calcMA = (period) => {
                if (i < period - 1) return null;
                let sum = 0;
                for (let j = 0; j < period; j++) sum += rawData[i - j].value;
                return sum / period;
              };
              rawData[i].ma10  = calcMA(10);
              rawData[i].ma100 = calcMA(100);
              rawData[i].ma200 = calcMA(200);
            }
          }

          allDataRef.current[ticker] = rawData;
          loadedCount++;

          if (loadedCount === allSymbols.length) {
            allSymbols.forEach((sym) => {
              const d = allDataRef.current[sym];
              if (!d || d.length === 0) return;
              // Toujours afficher les prix réels (jamais de normalisation en %)
              seriesMap[sym].setData(d.map(p => ({ time: p.time, value: p.value })));
            });

            if (!isComparing) {
              const pd = allDataRef.current[selectedSymbol];
              if (pd) {
                ma10sRef.current  = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 1.5, crosshairMarkerVisible: false, visible: showMa10 });
                ma100sRef.current = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1.5, crosshairMarkerVisible: false, visible: showMa100 });
                ma200sRef.current = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1.5, crosshairMarkerVisible: false, visible: showMa200 });
                ma10sRef.current.setData(pd.filter(d => d.ma10   != null).map(d => ({ time: d.time, value: d.ma10 })));
                ma100sRef.current.setData(pd.filter(d => d.ma100 != null).map(d => ({ time: d.time, value: d.ma100 })));
                ma200sRef.current.setData(pd.filter(d => d.ma200 != null).map(d => ({ time: d.time, value: d.ma200 })));
              }
            }

            // Stats (% sur fenêtre)
            const stats = {};
            allSymbols.forEach(sym => {
              const d = allDataRef.current[sym];
              if (!d || d.length === 0) return;
              stats[sym] = {
                price: d[d.length - 1].value,
                change: ((d[d.length - 1].value - d[0].value) / d[0].value) * 100,
              };
            });
            setAssetStats(stats);
            applyTimeRange(timeRange, chart);

            // % dynamique sur la fenêtre visible + auto-upgrade d'intervalle
            chart.timeScale().subscribeVisibleLogicalRangeChange((lr) => {
              if (!lr) return;
              // Si le dézoom dépasse le début des données, passer à l'intervalle supérieur
              if (lr.from < -0.5 && !upgradeScheduled) {
                const curr = candleIntervalRef.current;
                if (curr === '15m') { upgradeScheduled = true; setTimeRange('ALL'); setCandleInterval('1h'); }
                else if (curr === '1h') { upgradeScheduled = true; setTimeRange('ALL'); setCandleInterval('1D'); }
              }
              clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = setTimeout(() => {
                const newStats = {};
                allSymbols.forEach(sym => {
                  const d = allDataRef.current[sym];
                  if (!d || d.length === 0) return;
                  const from = Math.max(0, Math.floor(lr.from));
                  const to = Math.min(d.length - 1, Math.ceil(lr.to));
                  if (from >= to) return;
                  newStats[sym] = {
                    price: d[to].value,
                    change: ((d[to].value - d[from].value) / d[from].value) * 100,
                  };
                });
                setAssetStats(newStats);
              }, 50);
            });

            // Légende curseur
            chart.subscribeCrosshairMove(param => {
              if (!param.time || param.seriesData.size === 0) { setHoverData(null); return; }
              const hover = {};
              allSymbols.forEach(sym => {
                const val = param.seriesData.get(seriesMap[sym])?.value;
                if (val !== undefined) hover[sym] = val;
              });
              setHoverData(Object.keys(hover).length > 0 ? hover : null);
            });
          }
        });
    };

    allSymbols.forEach((sym, idx) => buildSeries(sym, idx, idx === 0));
    allSymbols.forEach((sym, idx) => fetchAndDraw(sym, idx).catch(e => console.error(e)));

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimerRef.current);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedSymbol, compareSymbols.join(','), candleInterval, individualScales, isDark, API_URL]);

  // Toggles MA sans recréer le chart
  useEffect(() => { ma10sRef.current?.applyOptions({ visible: showMa10 }); },  [showMa10]);
  useEffect(() => { ma100sRef.current?.applyOptions({ visible: showMa100 }); }, [showMa100]);
  useEffect(() => { ma200sRef.current?.applyOptions({ visible: showMa200 }); }, [showMa200]);

  const btnStyle = (active, activeColor = '#2962FF') => ({
    padding: '6px 10px', background: active ? activeColor : 'transparent',
    color: active ? 'white' : 'var(--text3)', border: `1px solid ${active ? activeColor : 'var(--border)'}`,
    borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.2s',
  });

  const formatPrice = (val) => {
    if (val === null || val === undefined) return '—';
    if (val >= 1000) return val.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    return val.toFixed(2);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg1)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>

      {/* BARRE DE CONTRÔLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '5px' }}>INTERVALLE :</span>
            {['15m', '1h', '1D', '1W'].map(iv => (
              <button key={iv} style={btnStyle(candleInterval === iv)} onClick={() => setCandleInterval(iv)}>
                {iv === '15m' ? '15 Min' : iv === '1h' ? '1 Heure' : iv === '1D' ? 'Jour' : 'Semaine'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '5px' }}>ZOOM :</span>
            {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(r => (
              <button key={r} style={btnStyle(timeRange === r)} onClick={() => { setTimeRange(r); applyTimeRange(r); }}>
                {r === 'ALL' ? 'Tout' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Badges + bouton "Mutualiser les échelles" */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!isComparing && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px' }}>
              {[
                { label: 'MM10',  color: '#00bcd4', active: showMa10,  toggle: () => setShowMa10(v  => !v) },
                { label: 'MM100', color: '#ff9800', active: showMa100, toggle: () => setShowMa100(v => !v) },
                { label: 'MM200', color: '#9c27b0', active: showMa200, toggle: () => setShowMa200(v => !v) },
              ].map(({ label, color, active, toggle }) => (
                <button
                  key={label}
                  onClick={toggle}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '3px 6px', borderRadius: '4px',
                    opacity: active ? 1 : 0.35, transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{ display: 'inline-block', width: '18px', height: '2px', backgroundColor: color, borderRadius: '1px' }} />
                  <span style={{ color, fontWeight: 'bold' }}>{label}</span>
                </button>
              ))}
            </div>
          )}

          {allSymbols.map((sym, i) => {
            const s = assetStats[sym];
            if (!s) return null;
            const color = ASSET_COLORS[i];
            const changeColor = s.change >= 0 ? '#26a69a' : '#ef5350';
            return (
              <div key={sym} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', backgroundColor: 'var(--bg3)', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${color}40` }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0, alignSelf: 'center' }} />
                <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '13px' }}>{getName(sym)}</span>
                <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '14px' }}>{formatPrice(s.price)}</span>
                <span style={{ color: changeColor, fontWeight: 'bold', fontSize: '12px' }}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                </span>
              </div>
            );
          })}

          {/* Bouton visible uniquement en mode comparaison */}
          {isComparing && (
            <button
              style={btnStyle(!individualScales, '#758696')}
              onClick={() => setIndividualScales(v => !v)}
              title={individualScales ? 'Afficher tous les actifs sur la même échelle de prix' : 'Revenir aux échelles indépendantes par actif'}
            >
              {individualScales ? 'Cours réels' : 'Échelle normalisée'}
            </button>
          )}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{ position: 'relative' }}>
        {hoverData && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
            backgroundColor: isDark ? 'rgba(19,23,34,0.9)' : 'rgba(255,255,255,0.92)', padding: '7px 12px',
            borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            border: '1px solid var(--border)', pointerEvents: 'none',
          }}>
            {allSymbols.map((sym, i) => hoverData[sym] !== undefined && (
              <span key={sym}>
                <span style={{ color: ASSET_COLORS[i] }}>● </span>
                <span style={{ color: 'var(--text3)' }}>{getName(sym)} </span>
                <span style={{ color: 'var(--text1)' }}>
                  {formatPrice(hoverData[sym])}
                </span>
              </span>
            ))}
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: '100%', height: `${CHART_HEIGHT}px` }} />
        <SourceTag label="Yahoo Finance" />
      </div>
    </div>
  );
}

export default SimpleChart;
