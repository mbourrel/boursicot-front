import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, LineSeries } from 'lightweight-charts';

function SimpleChart({ selectedSymbol }) {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const currentDataRef = useRef([]);
  const debounceTimerRef = useRef(null);

  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [hoverData, setHoverData] = useState(null); // légende curseur

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.VITE_API_URL;

  const applyTimeRange = (range, chart = chartInstanceRef.current, data = currentDataRef.current) => {
    if (!chart || data.length === 0) return;
    if (range === 'ALL') { chart.timeScale().fitContent(); return; }

    const getLastDate = (item) => typeof item.time === 'number' ? new Date(item.time * 1000) : new Date(item.time);
    const lastDate = getLastDate(data[data.length - 1]);
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

    chart.timeScale().setVisibleRange({ from: fromStr, to: data[data.length - 1].time });
  };

  useEffect(() => {
    if (!chartContainerRef.current || !selectedSymbol) return;

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

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#2962FF',
      topColor: 'rgba(41, 98, 255, 0.25)',
      bottomColor: 'rgba(41, 98, 255, 0.01)',
      lineWidth: 2,
    });

    const ma20Series = chart.addSeries(LineSeries, {
      color: '#00bcd4',
      lineWidth: 1.5,
      crosshairMarkerVisible: false,
    });

    const ma50Series = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 1.5,
      crosshairMarkerVisible: false,
    });

    let isMounted = true;

    fetch(`${API_URL}/api/prices?ticker=${selectedSymbol}&interval=${candleInterval}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return;

        const rawData = data.map(i => ({
          time: ['15m', '1h'].includes(candleInterval)
            ? Math.floor(new Date(i.time).getTime() / 1000)
            : i.time.split('T')[0],
          value: i.close,
        })).sort((a, b) => typeof a.time === 'number' ? a.time - b.time : new Date(a.time) - new Date(b.time));

        // Calcul MA20 et MA50
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

        currentDataRef.current = rawData;
        areaSeries.setData(rawData.map(d => ({ time: d.time, value: d.value })));
        ma20Series.setData(rawData.filter(d => d.ma20 !== null).map(d => ({ time: d.time, value: d.ma20 })));
        ma50Series.setData(rawData.filter(d => d.ma50 !== null).map(d => ({ time: d.time, value: d.ma50 })));

        if (rawData.length > 0) {
          const last = rawData[rawData.length - 1].value;
          const first = rawData[0].value;
          setCurrentPrice(last);
          setPriceChange(((last - first) / first) * 100);
          applyTimeRange(timeRange, chart, rawData);
        }

        // --- % DYNAMIQUE SUR LA FENÊTRE VISIBLE ---
        // subscribeVisibleLogicalRangeChange donne les indices de barres visibles
        // Calcul O(1), debounce 50ms pour ne pas re-rendre à chaque pixel de scroll
        chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
          if (!logicalRange || currentDataRef.current.length === 0) return;
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            const d = currentDataRef.current;
            const fromIdx = Math.max(0, Math.floor(logicalRange.from));
            const toIdx = Math.min(d.length - 1, Math.ceil(logicalRange.to));
            if (fromIdx >= toIdx) return;
            const first = d[fromIdx].value;
            const last = d[toIdx].value;
            setCurrentPrice(last);
            setPriceChange(((last - first) / first) * 100);
          }, 50);
        });

        // --- LÉGENDE EN DIRECT AU CURSEUR ---
        chart.subscribeCrosshairMove(param => {
          if (!param.time || param.seriesData.size === 0) {
            setHoverData(null);
            return;
          }
          const price = param.seriesData.get(areaSeries)?.value;
          const ma20 = param.seriesData.get(ma20Series)?.value;
          const ma50 = param.seriesData.get(ma50Series)?.value;
          if (price !== undefined) {
            setHoverData({
              price: price.toFixed(2),
              ma20: ma20 != null ? ma20.toFixed(2) : null,
              ma50: ma50 != null ? ma50.toFixed(2) : null,
            });
          }
        });
      })
      .catch(err => console.error('Erreur SimpleChart:', err));

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimerRef.current);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedSymbol, candleInterval, API_URL]);

  const btnStyle = (active) => ({
    padding: '6px 10px',
    background: active ? '#2962FF' : 'transparent',
    color: active ? 'white' : '#8a919e',
    border: `1px solid ${active ? '#2962FF' : '#2B2B43'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  });

  const changeColor = priceChange === null ? '#8a919e' : priceChange >= 0 ? '#26a69a' : '#ef5350';

  return (
    <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>

      {/* BARRE DE CONTRÔLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Intervalle */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>INTERVALLE :</span>
            {['15m', '1h', '1D', '1W'].map(interval => (
              <button key={interval} style={btnStyle(candleInterval === interval)}
                onClick={() => setCandleInterval(interval)}>
                {interval === '15m' ? '15 Min' : interval === '1h' ? '1 Heure' : interval === '1D' ? 'Jour' : 'Semaine'}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>ZOOM :</span>
            {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(range => (
              <button key={range} style={btnStyle(timeRange === range)}
                onClick={() => { setTimeRange(range); applyTimeRange(range); }}>
                {range === 'ALL' ? 'Tout' : range}
              </button>
            ))}
          </div>
        </div>

        {/* Badge prix + variation fenêtre visible */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#00bcd4', fontWeight: 'bold' }}>— MM20</span>
            <span style={{ color: '#ff9800', fontWeight: 'bold' }}>— MM50</span>
          </div>
          {currentPrice !== null && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', backgroundColor: '#1e222d', padding: '6px 12px', borderRadius: '6px', border: '1px solid #2B2B43' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                {currentPrice.toFixed(2)}
              </span>
              <span style={{ color: changeColor, fontWeight: 'bold', fontSize: '13px' }}>
                {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* GRAPHIQUE + LÉGENDE CURSEUR */}
      <div style={{ position: 'relative' }}>

        {/* Overlay légende au survol */}
        {hoverData && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            display: 'flex', gap: '12px', alignItems: 'center',
            backgroundColor: 'rgba(19, 23, 34, 0.85)',
            padding: '7px 12px', borderRadius: '6px',
            fontSize: '12px', fontWeight: 'bold',
            border: '1px solid #2B2B43', pointerEvents: 'none',
          }}>
            <span style={{ color: '#d1d4dc' }}>{selectedSymbol} <span style={{ color: 'white' }}>{hoverData.price}</span></span>
            {hoverData.ma20 && <span style={{ color: '#00bcd4' }}>MM20 : {hoverData.ma20}</span>}
            {hoverData.ma50 && <span style={{ color: '#ff9800' }}>MM50 : {hoverData.ma50}</span>}
          </div>
        )}

        <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />
      </div>
    </div>
  );
}

export default SimpleChart;
