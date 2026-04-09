import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';

function App() {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const currentDataRef = useRef([]);
  
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [viewMode, setViewMode] = useState('chart');
  const [fundamentalsData, setFundamentalsData] = useState([]);
  const [legendData, setLegendData] = useState({ close: null, ma10: null, ma100: null, ma200: null, volume: null });

  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : 'https://boursicot-api.onrender.com';

  useEffect(() => {
    fetch(`${API_URL}/api/fundamentals`)
      .then(res => res.json())
      .then(data => { 
        if (!data.error && Array.isArray(data)) {
          setFundamentalsData(data);
          if (data.length > 0) setSelectedSymbol(data[0].ticker);
        } 
      })
      .catch(err => console.error("Erreur fondamentaux:", err));
  }, [API_URL]);

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
    if (candleInterval === '1h') {
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
    if (interval === '1h') setTimeRange('1W');
    else if (interval === '1D') setTimeRange('1Y');
    else if (interval === '1W') setTimeRange('ALL');
  };

  useEffect(() => {
    if (viewMode !== 'chart' || !chartContainerRef.current || !selectedSymbol) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#131722' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      width: chartContainerRef.current.clientWidth,
      height: 550,
      timeScale: { timeVisible: true }, 
    });
    
    chartInstanceRef.current = chart;

    // Configuration des séries
    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    const ma10Series = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 2, crosshairMarkerVisible: false });
    const ma100Series = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 2, crosshairMarkerVisible: false });
    const ma365Series = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2, crosshairMarkerVisible: false });
    
    // Ajout de la série d'histogramme pour le volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Assigne l'histogramme à une échelle indépendante
    });

    // On force l'échelle indépendante à rester tout en bas du graphique (les derniers 20%)
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
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
                if (candleInterval === '1h') {
                    formattedTime = Math.floor(new Date(i.date).getTime() / 1000);
                } else {
                    formattedTime = i.date.split('T')[0].split(' ')[0];
                }

                // Détermination de la couleur du volume selon que la bougie est haussière ou baissière
                const isBullish = i.close >= i.open;

                return { 
                    time: formattedTime, 
                    open: i.open, 
                    high: i.high, 
                    low: i.low, 
                    close: i.close,
                    value: i.volume, // 'value' est la clé attendue par HistogramSeries
                    color: isBullish ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)'
                };
            })
            .sort((a, b) => {
                if (candleInterval === '1h') return a.time - b.time;
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
            volumeSeries.setData(rawData.map(d => ({ time: d.time, value: d.value, color: d.color })));
            
            ma10Series.setData(rawData.filter(d => d.ma10 !== null).map(d => ({ time: d.time, value: d.ma10 })));
            ma100Series.setData(rawData.filter(d => d.ma100 !== null).map(d => ({ time: d.time, value: d.ma100 })));
            ma365Series.setData(rawData.filter(d => d.ma365 !== null).map(d => ({ time: d.time, value: d.ma365 })));
            
            applyTimeRange(timeRange, chart, rawData);
          }
        }
      })
      .catch(err => console.error("Erreur récupération prix:", err));

    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData.size > 0) {
        setLegendData({
          close: param.seriesData.get(candleSeries)?.close?.toFixed(2),
          ma10: param.seriesData.get(ma10Series)?.value?.toFixed(2),
          ma100: param.seriesData.get(ma100Series)?.value?.toFixed(2),
          ma365: param.seriesData.get(ma365Series)?.value?.toFixed(2),
          volume: param.seriesData.get(volumeSeries)?.value, // Récupération du volume survolé
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, viewMode, candleInterval, API_URL]);

  const filterBtnStyle = (isActive) => ({
    padding: '6px 12px', background: isActive ? '#2962FF' : 'transparent', color: isActive ? 'white' : '#8a919e',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
  });

  const formatVal = (val, unit) => {
    if (val === null || val === undefined) return "N/A";
    if (val > 1000000000) return (val / 1000000000).toFixed(2) + ' Md' + (unit === '$' ? ' $' : '');
    if (val > 1000000) return (val / 1000000).toFixed(2) + ' M' + (unit === '$' ? ' $' : '');
    return val + (unit === '%' ? '%' : unit === 'x' ? 'x' : unit === '$' ? ' $' : '');
  };

  const currentData = Array.isArray(fundamentalsData) ? fundamentalsData.find(f => f.ticker === selectedSymbol) : null;

  const renderCategory = (title, dataArray) => {
    if (!dataArray || dataArray.length === 0) return null;
    return (
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ borderBottom: '2px solid #2B2B43', paddingBottom: '10px', color: '#2962FF' }}>{title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {dataArray.map((metric, i) => (
            <div key={i} style={{ backgroundColor: '#1e222d', padding: '15px', borderRadius: '8px', border: '1px solid #2B2B43', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ color: '#8a919e', fontSize: '12px', textTransform: 'uppercase' }}>{metric.name}</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{formatVal(metric.val, metric.unit)}</span>
                
                {metric.avg !== 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: '#8a919e' }}>Moy. Secteur</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: metric.val >= metric.avg ? '#26a69a' : '#ef5350' }}>{formatVal(metric.avg, metric.unit)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#0b0e14', minHeight: '100vh', color: '#d1d4dc', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#fff' }}>Boursicot Pro 📈</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          
          <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e222d', color: 'white', border: '1px solid #2B2B43', outline: 'none', cursor: 'pointer' }}>
            {fundamentalsData.length === 0 ? <option disabled>Chargement...</option> : 
              fundamentalsData.map((company) => (
                <option key={company.ticker} value={company.ticker}>{company.name} ({company.ticker})</option>
              ))
            }
          </select>

          <div style={{ display: 'flex', backgroundColor: '#1e222d', borderRadius: '6px' }}>
            <button onClick={() => setViewMode('chart')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Données de marché</button>
            <button onClick={() => setViewMode('fundamentals')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Infos Entreprise</button>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '10px' }}>BOUGIES :</span>
              {['1h', '1D', '1W'].map(interval => (
                <button key={interval} style={filterBtnStyle(candleInterval === interval)} onClick={() => handleIntervalChange(interval)}>
                    {interval === '1h' ? '1 Heure' : interval === '1D' ? 'Jour' : 'Semaine'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '10px' }}>ZOOM :</span>
              {['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map(range => (
                <button key={range} style={filterBtnStyle(timeRange === range)} onClick={() => { setTimeRange(range); applyTimeRange(range); }}>
                  {range === 'ALL' ? 'Tout' : range}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', gap: '15px', backgroundColor: 'rgba(19, 23, 34, 0.8)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              <span style={{ color: '#d1d4dc' }}>{selectedSymbol} {legendData.close && `$${legendData.close}`}</span>
              <span style={{ color: '#8a919e' }}>Vol {legendData.volume && `: ${formatVal(legendData.volume, '')}`}</span>
              <span style={{ color: '#00bcd4' }}>MM 10 {legendData.ma10 && `: ${legendData.ma10}`}</span>
              <span style={{ color: '#ff9800' }}>MM 100 {legendData.ma100 && `: ${legendData.ma100}`}</span>
              <span style={{ color: '#9c27b0' }}>MM 365 {legendData.ma365 && `: ${legendData.ma365}`}</span>
            </div>
            {selectedSymbol && <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />}
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {currentData ? (
            <>
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '5px' }}>{currentData.name}</h2>
                <div style={{ color: '#2962FF', fontWeight: 'bold', marginBottom: '15px' }}>Secteur: {currentData.sector}</div>
                <p style={{ color: '#8a919e', maxWidth: '1000px', lineHeight: '1.5' }}>{currentData.description}</p>
              </div>

              {renderCategory("1. Analyse de Marché", currentData.market_analysis)}
              {renderCategory("2. Santé Financière", currentData.financial_health)}
              {renderCategory("3. Valorisation Avancée", currentData.advanced_valuation)}
              {renderCategory("4. Compte de Résultat & Croissance", currentData.income_growth)}
              {renderCategory("5. Bilan & Liquidité", currentData.balance_cash)}
              {renderCategory("6. Risque & Marché", currentData.risk_market)}
              
            </>
          ) : <p>Chargement ou données introuvables pour cette action...</p>}
        </div>
      )}
    </div>
  );
}

export default App;