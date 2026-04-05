import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

function App() {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const currentDataRef = useRef([]);
  
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [viewMode, setViewMode] = useState('chart');
  const [fundamentalsData, setFundamentalsData] = useState([]);
  const [legendData, setLegendData] = useState({ close: null, ma10: null, ma100: null, ma365: null });

  const [timeRange, setTimeRange] = useState('ALL');
  const [candleInterval, setCandleInterval] = useState('1D');

  // 1. Récupération des fondamentaux
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/fundamentals`)
      .then(res => res.json())
      .then(data => { if (!data.error) setFundamentalsData(data); });
  }, []);

  // Fonction pour aggréger les bougies journalières en Semaines ou Mois
  const aggregateData = (data, interval) => {
    if (interval === '1D') return data;
    
    const grouped = {};
    data.forEach(d => {
      const date = new Date(d.time);
      let key;
      
      if (interval === '1W') {
        const day = date.getDay() || 7;
        date.setDate(date.getDate() - day + 1);
        key = date.toISOString().split('T')[0];
      } else if (interval === '1M') {
        key = d.time.substring(0, 7) + '-01';
      }
      
      if (!grouped[key]) {
        grouped[key] = { ...d, time: key };
      } else {
        grouped[key].high = Math.max(grouped[key].high, d.high);
        grouped[key].low = Math.min(grouped[key].low, d.low);
        grouped[key].close = d.close;
        grouped[key].ma10 = d.ma10 || grouped[key].ma10;
        grouped[key].ma100 = d.ma100 || grouped[key].ma100;
        grouped[key].ma365 = d.ma365 || grouped[key].ma365;
      }
    });
    
    return Object.values(grouped).sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  // Fonction pour appliquer le zoom (Echelle de temps)
  const applyTimeRange = (range, chart = chartInstanceRef.current, data = currentDataRef.current) => {
    if (!chart || data.length === 0) return;
    
    if (range === 'ALL') {
      chart.timeScale().fitContent();
      return;
    }

    const lastDate = new Date(data[data.length - 1].time);
    let fromDate = new Date(lastDate);

    if (range === '1M') fromDate.setMonth(fromDate.getMonth() - 1);
    else if (range === '3M') fromDate.setMonth(fromDate.getMonth() - 3);
    else if (range === '6M') fromDate.setMonth(fromDate.getMonth() - 6);
    else if (range === '1Y') fromDate.setFullYear(fromDate.getFullYear() - 1);

    chart.timeScale().setVisibleRange({
      from: fromDate.toISOString().split('T')[0],
      to: data[data.length - 1].time
    });
  };

  // 2. Gestion du graphique
  useEffect(() => {
    if (viewMode !== 'chart' || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#131722' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      width: chartContainerRef.current.clientWidth,
      height: 550,
      timeScale: { timeVisible: true },
    });
    
    chartInstanceRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    const ma10Series = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 2, crosshairMarkerVisible: false });
    const ma100Series = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 2, crosshairMarkerVisible: false });
    const ma365Series = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2, crosshairMarkerVisible: false });

    fetch(`${process.env.REACT_APP_API_URL}/api/prices`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const rawData = data.filter(i => i.symbol === selectedSymbol).sort((a, b) => new Date(a.time) - new Date(b.time));
          
          if (rawData.length > 0) {
            const processedData = aggregateData(rawData, candleInterval);
            currentDataRef.current = processedData;

            candleSeries.setData(processedData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
            ma10Series.setData(processedData.filter(d => d.ma10 !== null).map(d => ({ time: d.time, value: d.ma10 })));
            ma100Series.setData(processedData.filter(d => d.ma100 !== null).map(d => ({ time: d.time, value: d.ma100 })));
            ma365Series.setData(processedData.filter(d => d.ma365 !== null).map(d => ({ time: d.time, value: d.ma365 })));
            
            applyTimeRange(timeRange, chart, processedData);
          }
        }
      });

    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData.size > 0) {
        setLegendData({
          close: param.seriesData.get(candleSeries)?.close,
          ma10: param.seriesData.get(ma10Series)?.value,
          ma100: param.seriesData.get(ma100Series)?.value,
          ma365: param.seriesData.get(ma365Series)?.value,
        });
      }
    });

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
    
    // LA LIGNE MAGIQUE POUR VERCEL EST JUSTE EN DESSOUS :
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, viewMode, candleInterval]);

  // Style des boutons de filtres
  const filterBtnStyle = (isActive) => ({
    padding: '6px 12px', background: isActive ? '#2962FF' : 'transparent', color: isActive ? 'white' : '#8a919e',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
  });

  const formatVal = (val, unit) => {
    if (val > 1000000000) return (val / 1000000000).toFixed(2) + ' Md' + (unit === '$' ? ' $' : '');
    if (val > 1000000) return (val / 1000000).toFixed(2) + ' M' + (unit === '$' ? ' $' : '');
    return val + (unit === '%' ? '%' : unit === 'x' ? 'x' : unit === '$' ? ' $' : '');
  };

  const currentData = Array.isArray(fundamentalsData) ? fundamentalsData.find(f => f.symbol === selectedSymbol) : null;

  return (
    <div style={{ padding: '30px', backgroundColor: '#0b0e14', minHeight: '100vh', color: '#d1d4dc', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#fff' }}>Boursicot Pro 📈</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e222d', color: 'white', border: '1px solid #2B2B43' }}>
            <option value="AAPL">Apple (AAPL)</option>
            <option value="MSFT">Microsoft (MSFT)</option>
            <option value="TSLA">Tesla (TSLA)</option>
          </select>
          <div style={{ display: 'flex', backgroundColor: '#1e222d', borderRadius: '6px' }}>
            <button onClick={() => setViewMode('chart')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Données de marché</button>
            <button onClick={() => setViewMode('fundamentals')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Fondamentaux</button>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>
            
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '10px' }}>BOUGIES :</span>
              {['1D', '1W', '1M'].map(interval => (
                <button key={interval} style={filterBtnStyle(candleInterval === interval)} onClick={() => setCandleInterval(interval)}>
                  {interval === '1D' ? 'Jour' : interval === '1W' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '10px' }}>ZOOM :</span>
              {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
                <button key={range} style={filterBtnStyle(timeRange === range)} onClick={() => {
                  setTimeRange(range);
                  applyTimeRange(range);
                }}>
                  {range === 'ALL' ? 'Tout' : range}
                </button>
              ))}
            </div>
            
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', gap: '15px', backgroundColor: 'rgba(19, 23, 34, 0.8)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              <span style={{ color: '#d1d4dc' }}>{selectedSymbol} {legendData.close && `$${legendData.close}`}</span>
              <span style={{ color: '#00bcd4' }}>MM zizi {legendData.ma10 && `: ${legendData.ma10}`}</span>
              <span style={{ color: '#ff9800' }}>MM 100 {legendData.ma100 && `: ${legendData.ma100}`}</span>
              <span style={{ color: '#9c27b0' }}>MM 365 {legendData.ma365 && `: ${legendData.ma365}`}</span>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />
          </div>

        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {currentData ? (
            <>
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px', marginBottom: '5px' }}>{currentData.company_name}</h2>
                <p style={{ color: '#8a919e', maxWidth: '800px' }}>{currentData.description}</p>
              </div>

              <h3 style={{ borderBottom: '2px solid #2B2B43', paddingBottom: '10px', color: '#2962FF' }}>1. Analyse de Marché (10)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                {currentData.market_analysis.map((metric, i) => (
                  <div key={i} style={{ backgroundColor: '#1e222d', padding: '15px', borderRadius: '8px', border: '1px solid #2B2B43', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8a919e', fontSize: '12px', textTransform: 'uppercase' }}>{metric.name}</span>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{formatVal(metric.val, metric.unit)}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                         <span style={{ fontSize: '11px', color: '#8a919e' }}>Secteur</span>
                         <span style={{ fontSize: '13px', fontWeight: 'bold', color: metric.val >= metric.avg ? '#26a69a' : '#ef5350' }}>{formatVal(metric.avg, metric.unit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ borderBottom: '2px solid #2B2B43', paddingBottom: '10px', color: '#2962FF' }}>2. Santé Financière (20)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {currentData.financial_health.map((metric, i) => (
                   <div key={i} style={{ backgroundColor: '#1e222d', padding: '15px', borderRadius: '8px', border: '1px solid #2B2B43', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8a919e', fontSize: '12px', textTransform: 'uppercase' }}>{metric.name}</span>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{formatVal(metric.val, metric.unit)}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                         <span style={{ fontSize: '11px', color: '#8a919e' }}>Secteur</span>
                         <span style={{ fontSize: '13px', fontWeight: 'bold', color: metric.val >= metric.avg ? '#26a69a' : '#ef5350' }}>{formatVal(metric.avg, metric.unit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <p>Chargement ou données introuvables...</p>}
        </div>
      )}
    </div>
  );
}

export default App;
