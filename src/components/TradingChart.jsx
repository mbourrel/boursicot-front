import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';

function TradingChart({ selectedSymbol }) {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const currentDataRef = useRef([]);
  
  // Références de toutes les courbes
  const volumeSeriesRef = useRef(null);
  const ma10SeriesRef = useRef(null);
  const ma100SeriesRef = useRef(null);
  const ma365SeriesRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const atrSeriesRef = useRef(null); // Volatilité
  
  const [legendData, setLegendData] = useState({});
  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');

  // État de visibilité de nos indicateurs (décochés par défaut pour les nouveaux, pour ne pas surcharger)
  const [indicators, setIndicators] = useState({
    volume: true,
    ma10: true,
    ma100: false,
    ma365: false,
    bb: false,    // Bandes de Bollinger
    atr: false    // Volatilité (Average True Range)
  });

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : import.meta.env.VITE_API_URL;

  // Appliquer la visibilité dynamiquement sans recharger le graphique
  useEffect(() => {
    if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: indicators.volume });
    if (ma10SeriesRef.current) ma10SeriesRef.current.applyOptions({ visible: indicators.ma10 });
    if (ma100SeriesRef.current) ma100SeriesRef.current.applyOptions({ visible: indicators.ma100 });
    if (ma365SeriesRef.current) ma365SeriesRef.current.applyOptions({ visible: indicators.ma365 });
    
    // Gérer les 2 courbes de Bollinger d'un coup
    if (bbUpperSeriesRef.current) bbUpperSeriesRef.current.applyOptions({ visible: indicators.bb });
    if (bbLowerSeriesRef.current) bbLowerSeriesRef.current.applyOptions({ visible: indicators.bb });
    
    if (atrSeriesRef.current) atrSeriesRef.current.applyOptions({ visible: indicators.atr });
    // Afficher/Cacher l'échelle de prix dédiée à l'ATR
    if (chartInstanceRef.current) {
        chartInstanceRef.current.priceScale('atr').applyOptions({ visible: indicators.atr });
    }
  }, [indicators]);

  const toggleIndicator = (key) => setIndicators(prev => ({ ...prev, [key]: !prev[key] }));

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

    let fromStr = ['15m', '1h'].includes(candleInterval) 
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
      height: 550,
      timeScale: { timeVisible: true }, 
    });
    
    chartInstanceRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    
    ma10SeriesRef.current = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma10 });
    ma100SeriesRef.current = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma100 });
    ma365SeriesRef.current = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma365 });
    
    // Bandes de Bollinger (Bleu clair avec légère opacité)
    bbUpperSeriesRef.current = chart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, crosshairMarkerVisible: false, visible: indicators.bb });
    bbLowerSeriesRef.current = chart.addSeries(LineSeries, { color: 'rgba(41, 98, 255, 0.5)', lineWidth: 1, crosshairMarkerVisible: false, visible: indicators.bb });

    // Volatilité (ATR) : On la met sur une échelle 'atr' séparée !
    atrSeriesRef.current = chart.addSeries(LineSeries, { 
        color: '#e91e63', lineWidth: 2, priceScaleId: 'atr', visible: indicators.atr 
    });

    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
      visible: indicators.volume
    });

    // Configuration des espaces en bas du graphique pour ne pas que Volume et ATR se superposent
    chart.priceScale('atr').applyOptions({ scaleMargins: { top: 0.65, bottom: 0.2 }, visible: indicators.atr });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    let isMounted = true;

    fetch(`${API_URL}/api/prices?ticker=${selectedSymbol}&interval=${candleInterval}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;

        if (!data.error && Array.isArray(data)) {
          let rawData = data.map(i => ({
              time: ['15m', '1h'].includes(candleInterval) ? Math.floor(new Date(i.time).getTime() / 1000) : i.time.split('T')[0], 
              open: i.open, high: i.high, low: i.low, close: i.close, value: i.volume, 
              color: i.close >= i.open ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)'
          })).sort((a, b) => new Date(a.time) - new Date(b.time));
          
          // ==========================================
          // ALGORITHMES DES INDICATEURS TECHNIQUES
          // ==========================================
          
          // 1. Calcul du True Range (Pour la volatilité)
          for (let i = 0; i < rawData.length; i++) {
              if (i === 0) rawData[i].tr = rawData[i].high - rawData[i].low;
              else rawData[i].tr = Math.max(rawData[i].high - rawData[i].low, Math.abs(rawData[i].high - rawData[i-1].close), Math.abs(rawData[i].low - rawData[i-1].close));
          }

          // 2. Calcul des Moyennes, Bollinger et ATR
          for (let i = 0; i < rawData.length; i++) {
              const calcMA = (period) => {
                  if (i < period - 1) return null;
                  let sum = 0;
                  for (let j = 0; j < period; j++) sum += rawData[i - j].close;
                  return sum / period;
              };
              rawData[i].ma10 = calcMA(10);
              rawData[i].ma100 = calcMA(100);
              rawData[i].ma365 = calcMA(365);

              // Bollinger (Période=20, Déviation=2)
              if (i >= 19) {
                  const sma20 = calcMA(20);
                  let sumSq = 0;
                  for (let j = 0; j < 20; j++) sumSq += Math.pow(rawData[i - j].close - sma20, 2);
                  const sd20 = Math.sqrt(sumSq / 20);
                  rawData[i].bbUpper = sma20 + 2 * sd20;
                  rawData[i].bbLower = sma20 - 2 * sd20;
              } else {
                  rawData[i].bbUpper = null;
                  rawData[i].bbLower = null;
              }

              // ATR - Volatilité (Période=14)
              if (i === 13) {
                  let sum = 0;
                  for (let j = 0; j <= 13; j++) sum += rawData[j].tr;
                  rawData[i].atr = sum / 14;
              } else if (i > 13) {
                  rawData[i].atr = (rawData[i - 1].atr * 13 + rawData[i].tr) / 14;
              } else {
                  rawData[i].atr = null;
              }
          }
          
          if (rawData.length > 0) {
            currentDataRef.current = rawData;
            candleSeries.setData(rawData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
            volumeSeriesRef.current.setData(rawData.map(d => ({ time: d.time, value: d.value, color: d.color })));
            
            ma10SeriesRef.current.setData(rawData.filter(d => d.ma10 !== null).map(d => ({ time: d.time, value: d.ma10 })));
            ma100SeriesRef.current.setData(rawData.filter(d => d.ma100 !== null).map(d => ({ time: d.time, value: d.ma100 })));
            ma365SeriesRef.current.setData(rawData.filter(d => d.ma365 !== null).map(d => ({ time: d.time, value: d.ma365 })));
            
            bbUpperSeriesRef.current.setData(rawData.filter(d => d.bbUpper !== null).map(d => ({ time: d.time, value: d.bbUpper })));
            bbLowerSeriesRef.current.setData(rawData.filter(d => d.bbLower !== null).map(d => ({ time: d.time, value: d.bbLower })));
            atrSeriesRef.current.setData(rawData.filter(d => d.atr !== null).map(d => ({ time: d.time, value: d.atr })));

            applyTimeRange(timeRange, chart, rawData);
          }
        }
      })
      .catch(err => console.error("Erreur récupération prix:", err));

    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData.size > 0) {
        setLegendData({
          close: param.seriesData.get(candleSeries)?.close?.toFixed(2),
          volume: param.seriesData.get(volumeSeriesRef.current)?.value, 
          ma10: param.seriesData.get(ma10SeriesRef.current)?.value?.toFixed(2),
          ma100: param.seriesData.get(ma100SeriesRef.current)?.value?.toFixed(2),
          ma365: param.seriesData.get(ma365SeriesRef.current)?.value?.toFixed(2),
          bbUpper: param.seriesData.get(bbUpperSeriesRef.current)?.value?.toFixed(2),
          bbLower: param.seriesData.get(bbLowerSeriesRef.current)?.value?.toFixed(2),
          atr: param.seriesData.get(atrSeriesRef.current)?.value?.toFixed(2),
        });
      }
    });

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => { isMounted = false; window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [selectedSymbol, candleInterval, API_URL]);

  const filterBtnStyle = (isActive, activeColor = '#2962FF') => ({
    padding: '6px 10px', background: isActive ? activeColor : 'transparent', color: isActive ? 'white' : '#8a919e',
    border: `1px solid ${isActive ? activeColor : '#2B2B43'}`, borderRadius: '4px', cursor: 'pointer', 
    fontSize: '11px', fontWeight: 'bold', transition: 'all 0.2s'
  });

  const formatVal = (val) => {
    if (val === null || val === undefined) return "N/A";
    if (val > 1000000000) return (val / 1000000000).toFixed(2) + ' Md';
    if (val > 1000000) return (val / 1000000).toFixed(2) + ' M';
    return val;
  };

  return (
    <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>
      
      {/* BARRE DE CONTRÔLE SUPÉRIEURE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          {/* Contrôles de Bougies & Zoom */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>BOUGIES :</span>
              {['15m', '1h', '1D', '1W'].map(interval => (
                <button key={interval} style={filterBtnStyle(candleInterval === interval)} onClick={() => setCandleInterval(interval)}>
                    {interval === '15m' ? '15 Min' : interval === '1h' ? '1 Heure' : interval === '1D' ? 'Jour' : 'Semaine'}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>ZOOM :</span>
              {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(range => (
                <button key={range} style={filterBtnStyle(timeRange === range)} onClick={() => { setTimeRange(range); applyTimeRange(range); }}>
                  {range === 'ALL' ? 'Tout' : range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NOUVEAU : Menu des Indicateurs (Sur une 2ème ligne pour ne pas déborder) */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#8a919e', marginRight: '5px' }}>INDICATEURS :</span>
          <button style={filterBtnStyle(indicators.volume, '#2962FF')} onClick={() => toggleIndicator('volume')}>Volumes</button>
          <button style={filterBtnStyle(indicators.bb, '#2962FF')} onClick={() => toggleIndicator('bb')}>Bandes de Bollinger</button>
          <button style={filterBtnStyle(indicators.atr, '#e91e63')} onClick={() => toggleIndicator('atr')}>Volatilité (ATR)</button>
          <button style={filterBtnStyle(indicators.ma10, '#00bcd4')} onClick={() => toggleIndicator('ma10')}>MM 10</button>
          <button style={filterBtnStyle(indicators.ma100, '#ff9800')} onClick={() => toggleIndicator('ma100')}>MM 100</button>
          <button style={filterBtnStyle(indicators.ma365, '#9c27b0')} onClick={() => toggleIndicator('ma365')}>MM 365</button>
        </div>

      </div>

      {/* ZONE DU GRAPHIQUE */}
      <div style={{ position: 'relative' }}>
        
        {/* LÉGENDE DYNAMIQUE */}
        <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '10px', backgroundColor: 'rgba(19, 23, 34, 0.8)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', maxWidth: '90%' }}>
          <span style={{ color: '#d1d4dc' }}>{selectedSymbol} {legendData.close && `$${legendData.close}`}</span>
          
          {indicators.volume && legendData.volume !== undefined && <span style={{ color: '#8a919e' }}>Vol: {formatVal(legendData.volume)}</span>}
          {indicators.ma10 && legendData.ma10 && <span style={{ color: '#00bcd4' }}>MM10: {legendData.ma10}</span>}
          {indicators.ma100 && legendData.ma100 && <span style={{ color: '#ff9800' }}>MM100: {legendData.ma100}</span>}
          {indicators.ma365 && legendData.ma365 && <span style={{ color: '#9c27b0' }}>MM365: {legendData.ma365}</span>}
          {indicators.bb && legendData.bbUpper && legendData.bbLower && <span style={{ color: '#448aff' }}>BB: {legendData.bbLower} - {legendData.bbUpper}</span>}
          {indicators.atr && legendData.atr && <span style={{ color: '#e91e63' }}>ATR: {legendData.atr}</span>}
        </div>
        
        {selectedSymbol && <div ref={chartContainerRef} style={{ width: '100%', height: '550px' }} />}
      </div>
    </div>
  );
}

export default TradingChart;