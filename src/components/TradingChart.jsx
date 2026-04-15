import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';

function TradingChart({ selectedSymbol }) {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const currentDataRef = useRef([]);
  
  // Références pour pouvoir cibler les courbes et les masquer/afficher sans tout recharger
  const volumeSeriesRef = useRef(null);
  const ma10SeriesRef = useRef(null);
  const ma100SeriesRef = useRef(null);
  const ma365SeriesRef = useRef(null);
  
  const [legendData, setLegendData] = useState({ close: null, ma10: null, ma100: null, ma365: null, volume: null });
  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');

  // NOUVEAU : État pour gérer la visibilité des indicateurs
  const [indicators, setIndicators] = useState({
    volume: true,
    ma10: true,
    ma100: true,
    ma365: true
  });

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : import.meta.env.VITE_API_URL;

  // Effet pour mettre à jour la visibilité quand on clique sur un bouton
  useEffect(() => {
    if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: indicators.volume });
    if (ma10SeriesRef.current) ma10SeriesRef.current.applyOptions({ visible: indicators.ma10 });
    if (ma100SeriesRef.current) ma100SeriesRef.current.applyOptions({ visible: indicators.ma100 });
    if (ma365SeriesRef.current) ma365SeriesRef.current.applyOptions({ visible: indicators.ma365 });
  }, [indicators]);

  const toggleIndicator = (key) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyTimeRange = (range, chart = chartInstanceRef.current, data = currentDataRef.current) => {
    if (!chart || data.length === 0) return;
    if (range === 'ALL') {
      chart.timeScale().fitContent();
      return;
    }
    
    const getLastDate = (item) => typeof item.time === 'number' ? new Date(item.time * 1000) : new Date(item.time);
    const lastDate = getLastDate(data[data.length - 1]);
    let fromDate = new Date(lastDate);
    
    if (range === '1W') fromDate.setDate(fromDate.getDate() - 7);
    else if (range === '1M') fromDate.setMonth(fromDate.getMonth() - 1);
    else if (range === '3M') fromDate.setMonth(fromDate.getMonth() - 3);
    else if (range === '6M') fromDate.setMonth(fromDate.getMonth() - 6);
    else if (range === '1Y') fromDate.setFullYear(fromDate.getFullYear() - 1);
    else if (range === '5Y') fromDate.setFullYear(fromDate.getFullYear() - 5);

    let fromStr;
    if (['15m', '1h'].includes(candleInterval)) {
        fromStr = Math.floor(fromDate.getTime() / 1000);
    } else {
        fromStr = fromDate.toISOString().split('T')[0];
    }

    chart.timeScale().setVisibleRange({
      from: fromStr,
      to: data[data.length - 1].time
    });
  };

  const handleIntervalChange = (interval) => {
    setCandleInterval(interval);
    if (interval === '15m') setTimeRange('1W');
    else if (interval === '1h') setTimeRange('1M');
    else if (interval === '1D') setTimeRange('1Y');
    else if (interval === '1W') setTimeRange('ALL');
  };

  // Chargement principal du graphique
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
    
    // On sauvegarde la référence de chaque indicateur en l'ajoutant
    ma10SeriesRef.current = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma10 });
    ma100SeriesRef.current = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma100 });
    ma365SeriesRef.current = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma365 });
    
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
      visible: indicators.volume
    });

    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    let isMounted = true;

    fetch(`${API_URL}/api/prices?ticker=${selectedSymbol}&interval=${candleInterval}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;

        if (!data.error && Array.isArray(data)) {
          let rawData = data
            .map(i => {
                let formattedTime;
                if (['15m', '1h'].includes(candleInterval)) {
                    formattedTime = Math.floor(new Date(i.time).getTime() / 1000);
                } else {
                    formattedTime = i.time.split('T')[0];
                }

                const isBullish = i.close >= i.open;

                return { 
                    time: formattedTime, 
                    open: i.open, 
                    high: i.high, 
                    low: i.low, 
                    close: i.close,
                    value: i.volume, 
                    color: isBullish ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)'
                };
            })
            .sort((a, b) => {
                if (['15m', '1h'].includes(candleInterval)) return a.time - b.time;
                return new Date(a.time) - new Date(b.time);
            });
          
          rawData = rawData.map((d, index, arr) => {
              const calcMA = (period) => {
                  if (index < period - 1) return null;
                  let sum = 0;
                  for (let j = 0; j < period; j++) sum += arr[index - j].close;
                  return sum / period;
              };
              return { ...d, ma10: calcMA(10), ma100: calcMA(100), ma365: calcMA(365) };
          });
          
          if (rawData.length > 0) {
            currentDataRef.current = rawData;
            candleSeries.setData(rawData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
            volumeSeriesRef.current.setData(rawData.map(d => ({ time: d.time, value: d.value, color: d.color })));
            
            ma10SeriesRef.current.setData(rawData.filter(d => d.ma10 !== null).map(d => ({ time: d.time, value: d.ma10 })));
            ma100SeriesRef.current.setData(rawData.filter(d => d.ma100 !== null).map(d => ({ time: d.time, value: d.ma100 })));
            ma365SeriesRef.current.setData(rawData.filter(d => d.ma365 !== null).map(d => ({ time: d.time, value: d.ma365 })));
            
            applyTimeRange(timeRange, chart, rawData);
          }
        }
      })
      .catch(err => console.error("Erreur récupération prix:", err));

    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData.size > 0) {
        setLegendData({
          close: param.seriesData.get(candleSeries)?.close?.toFixed(2),
          ma10: param.seriesData.get(ma10SeriesRef.current)?.value?.toFixed(2),
          ma100: param.seriesData.get(ma100SeriesRef.current)?.value?.toFixed(2),
          ma365: param.seriesData.get(ma365SeriesRef.current)?.value?.toFixed(2),
          volume: param.seriesData.get(volumeSeriesRef.current)?.value, 
        });
      }
    });

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    
    return () => { 
        isMounted = false; 
        window.removeEventListener('resize', handleResize); 
        chart.remove(); 
    };
  }, [selectedSymbol, candleInterval, API_URL]); // Note : on n'inclut pas "indicators" ici pour ne pas relancer la requête API !

  // On personnalise un peu la couleur selon l'indicateur activé
  const filterBtnStyle = (isActive, activeColor = '#2962FF') => ({
    padding: '6px 12px', background: isActive ? activeColor : 'transparent', color: isActive ? 'white' : '#8a919e',
    border: `1px solid ${isActive ? activeColor : '#2B2B43'}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>
        
        {/* Contrôles de Bougies */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '5px' }}>BOUGIES :</span>
          {['15m', '1h', '1D', '1W'].map(interval => (
            <button key={interval} style={filterBtnStyle(candleInterval === interval)} onClick={() => handleIntervalChange(interval)}>
                {interval === '15m' ? '15 Min' : interval === '1h' ? '1 Heure' : interval === '1D' ? 'Jour' : 'Semaine'}
            </button>
          ))}
        </div>
        
        {/* Contrôles de Zoom */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '5px' }}>ZOOM :</span>
          {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(range => (
            <button key={range} style={filterBtnStyle(timeRange === range)} onClick={() => { setTimeRange(range); applyTimeRange(range); }}>
              {range === 'ALL' ? 'Tout' : range}
            </button>
          ))}
        </div>

        {/* NOUVEAU : Contrôles d'affichage des Indicateurs */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '5px' }}>AFFICHAGE :</span>
          <button style={filterBtnStyle(indicators.volume, '#2962FF')} onClick={() => toggleIndicator('volume')}>Volumes</button>
          <button style={filterBtnStyle(indicators.ma10, '#00bcd4')} onClick={() => toggleIndicator('ma10')}>MM 10</button>
          <button style={filterBtnStyle(indicators.ma100, '#ff9800')} onClick={() => toggleIndicator('ma100')}>MM 100</button>
          <button style={filterBtnStyle(indicators.ma365, '#9c27b0')} onClick={() => toggleIndicator('ma365')}>MM 365</button>
        </div>

      </div>

      {/* ZONE DU GRAPHIQUE */}
      <div style={{ position: 'relative' }}>
        
        {/* LÉGENDE DYNAMIQUE AU SURVOL (Masque les infos décochées) */}
        <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', gap: '15px', backgroundColor: 'rgba(19, 23, 34, 0.8)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
          <span style={{ color: '#d1d4dc' }}>{selectedSymbol} {legendData.close && `$${legendData.close}`}</span>
          {indicators.volume && legendData.volume !== undefined && <span style={{ color: '#8a919e' }}>Vol : {formatVal(legendData.volume)}</span>}
          {indicators.ma10 && legendData.ma10 && <span style={{ color: '#00bcd4' }}>MM 10 : {legendData.ma10}</span>}
          {indicators.ma100 && legendData.ma100 && <span style={{ color: '#ff9800' }}>MM 100 : {legendData.ma100}</span>}
          {indicators.ma365 && legendData.ma365 && <span style={{ color: '#9c27b0' }}>MM 365 : {legendData.ma365}</span>}
        </div>
        
        {selectedSymbol && <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />}
      </div>
    </div>
  );
}

export default TradingChart;