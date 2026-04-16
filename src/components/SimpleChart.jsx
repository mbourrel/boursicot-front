import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, LineSeries } from 'lightweight-charts';
import { ASSET_COLORS } from './CompareBar';

function SimpleChart({ selectedSymbol, compareSymbols = [] }) {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  // Map ticker -> données brutes normalisées
  const allDataRef = useRef({});
  const debounceTimerRef = useRef(null);

  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');
  // Map ticker -> { price, change }
  const [assetStats, setAssetStats] = useState({});
  const [hoverData, setHoverData] = useState(null);

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.VITE_API_URL;

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

  // Normalise un tableau de {time, value} en base 100 depuis son premier point
  const normalize = (data) => {
    if (!data || data.length === 0) return [];
    const base = data[0].value;
    if (!base) return data;
    return data.map(d => ({ ...d, value: ((d.value - base) / base) * 100 }));
  };

  useEffect(() => {
    if (!chartContainerRef.current || !selectedSymbol) return;

    allDataRef.current = {};

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#131722' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: { timeVisible: true, borderColor: '#2B2B43' },
      rightPriceScale: { borderColor: '#2B2B43' },
      crosshair: { vertLine: { color: '#758696' }, horzLine: { color: '#758696' } },
    });

    chartInstanceRef.current = chart;

    // Références des séries pour le crosshair
    const seriesMap = {};

    const buildSeries = (ticker, colorIndex, isFirst) => {
      const color = ASSET_COLORS[colorIndex];
      if (isFirst && !isComparing) {
        // Vue solo : area pleine
        const s = chart.addSeries(AreaSeries, {
          lineColor: color,
          topColor: `${color}40`,
          bottomColor: `${color}05`,
          lineWidth: 2,
        });
        seriesMap[ticker] = s;
        return s;
      } else {
        // Vue comparaison : toutes en lignes
        const s = chart.addSeries(LineSeries, {
          color,
          lineWidth: isFirst ? 2.5 : 1.5,
          crosshairMarkerVisible: true,
        });
        seriesMap[ticker] = s;
        return s;
      }
    };

    let isMounted = true;
    let loadedCount = 0;

    const fetchAndDraw = (ticker, colorIndex) => {
      return fetch(`${API_URL}/api/prices?ticker=${encodeURIComponent(ticker)}&interval=${candleInterval}`)
        .then(res => res.json())
        .then(data => {
          if (!isMounted || !Array.isArray(data)) return;

          const rawData = data.map(i => ({
            time: ['15m', '1h'].includes(candleInterval)
              ? Math.floor(new Date(i.time).getTime() / 1000)
              : i.time.split('T')[0],
            value: i.close,
          })).sort((a, b) => typeof a.time === 'number' ? a.time - b.time : new Date(a.time) - new Date(b.time));

          // Calcul MA20 / MA50 (actif principal uniquement, vue solo)
          if (!isComparing && colorIndex === 0) {
            for (let i = 0; i < rawData.length; i++) {
              const calcMA = (period) => {
                if (i < period - 1) return null;
                let sum = 0;
                for (let j = 0; j < period; j++) sum += rawData[i - j].value;
                return sum / period;
              };
              rawData[i].ma20 = calcMA(20);
              rawData[i].ma50 = calcMA(50);
            }
          }

          allDataRef.current[ticker] = rawData;
          loadedCount++;

          // On attend que tous les actifs soient chargés pour normaliser ensemble
          if (loadedCount === allSymbols.length) {
            // Supprimer les séries existantes et les recréer proprement
            // (on ne peut pas mettre à jour les séries déjà ajoutées ici car elles sont dans la closure)
            // Les séries ont déjà été ajoutées, on set juste les données

            allSymbols.forEach((sym, idx) => {
              const d = allDataRef.current[sym];
              if (!d || d.length === 0) return;
              const displayData = isComparing ? normalize(d) : d;
              seriesMap[sym].setData(displayData.map(p => ({ time: p.time, value: p.value })));
            });

            // MA20 / MA50 en mode solo
            if (!isComparing) {
              const pd = allDataRef.current[selectedSymbol];
              if (pd) {
                const ma20s = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 1.5, crosshairMarkerVisible: false });
                const ma50s = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1.5, crosshairMarkerVisible: false });
                ma20s.setData(pd.filter(d => d.ma20 != null).map(d => ({ time: d.time, value: d.ma20 })));
                ma50s.setData(pd.filter(d => d.ma50 != null).map(d => ({ time: d.time, value: d.ma50 })));
              }
            }

            // Stats initiales
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

            // % dynamique sur fenêtre visible
            chart.timeScale().subscribeVisibleLogicalRangeChange((lr) => {
              if (!lr) return;
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

            // Légende crosshair
            chart.subscribeCrosshairMove(param => {
              if (!param.time || param.seriesData.size === 0) { setHoverData(null); return; }
              const hover = {};
              allSymbols.forEach(sym => {
                const val = param.seriesData.get(seriesMap[sym])?.value;
                if (val !== undefined) hover[sym] = val.toFixed(2);
              });
              setHoverData(Object.keys(hover).length > 0 ? hover : null);
            });
          }
        });
    };

    // Créer toutes les séries d'abord, puis fetcher
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
  }, [selectedSymbol, compareSymbols.join(','), candleInterval, API_URL]);

  const btnStyle = (active) => ({
    padding: '6px 10px', background: active ? '#2962FF' : 'transparent',
    color: active ? 'white' : '#8a919e', border: `1px solid ${active ? '#2962FF' : '#2B2B43'}`,
    borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.2s',
  });

  return (
    <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>

      {/* BARRE DE CONTRÔLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>INTERVALLE :</span>
            {['15m', '1h', '1D', '1W'].map(iv => (
              <button key={iv} style={btnStyle(candleInterval === iv)} onClick={() => setCandleInterval(iv)}>
                {iv === '15m' ? '15 Min' : iv === '1h' ? '1 Heure' : iv === '1D' ? 'Jour' : 'Semaine'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>ZOOM :</span>
            {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(r => (
              <button key={r} style={btnStyle(timeRange === r)} onClick={() => { setTimeRange(r); applyTimeRange(r); }}>
                {r === 'ALL' ? 'Tout' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Badges stats par actif */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isComparing && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: '#00bcd4', fontWeight: 'bold' }}>— MM20</span>
              <span style={{ color: '#ff9800', fontWeight: 'bold' }}>— MM50</span>
            </div>
          )}
          {allSymbols.map((sym, i) => {
            const s = assetStats[sym];
            if (!s) return null;
            const color = ASSET_COLORS[i];
            const changeColor = s.change >= 0 ? '#26a69a' : '#ef5350';
            return (
              <div key={sym} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', backgroundColor: '#1e222d', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${color}40` }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0, alignSelf: 'center' }} />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>{sym}</span>
                {!isComparing && <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{s.price.toFixed(2)}</span>}
                <span style={{ color: changeColor, fontWeight: 'bold', fontSize: '12px' }}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{ position: 'relative' }}>
        {hoverData && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
            backgroundColor: 'rgba(19, 23, 34, 0.9)', padding: '7px 12px',
            borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
            border: '1px solid #2B2B43', pointerEvents: 'none',
          }}>
            {allSymbols.map((sym, i) => hoverData[sym] && (
              <span key={sym}>
                <span style={{ color: ASSET_COLORS[i] }}>● </span>
                <span style={{ color: '#8a919e' }}>{sym} </span>
                <span style={{ color: 'white' }}>
                  {isComparing ? `${parseFloat(hoverData[sym]) >= 0 ? '+' : ''}${hoverData[sym]}%` : hoverData[sym]}
                </span>
              </span>
            ))}
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />
      </div>
    </div>
  );
}

export default SimpleChart;
