import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';

function TradingChart({ selectedSymbol }) {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const currentDataRef = useRef([]);
  
  const [legendData, setLegendData] = useState({ close: null, ma10: null, ma100: null, ma365: null, volume: null });
  const [timeRange, setTimeRange] = useState('1Y');
  const [candleInterval, setCandleInterval] = useState('1D');

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : import.meta.env.VITE_API_URL;

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
    const ma10Series = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 2, crosshairMarkerVisible: false });
    const ma100Series = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 2, crosshairMarkerVisible: false });
    const ma365Series = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2, crosshairMarkerVisible: false });
    
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
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
          volume: param.seriesData.get(volumeSeries)?.value, 
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
  }, [selectedSymbol, candleInterval, API_URL]);

  const filterBtnStyle = (isActive) => ({
    padding: '6px 12px', background: isActive ? '#2962FF' : 'transparent', color: isActive ? 'white' : '#8a919e',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
  });

  const formatVal = (val) => {
    if (val === null || val === undefined) return "N/A";
    if (val > 1000000000) return (val / 1000000000).toFixed(2) + ' Md';
    if (val > 1000000) return (val / 1000000).toFixed(2) + ' M';
    return val;
  };

  return (
    <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #2B2B43', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8a919e', marginRight: '10px' }}>BOUGIES :</span>
          {['15m', '1h', '1D', '1W'].map(interval => (
            <button key={interval} style={filterBtnStyle(candleInterval === interval)} onClick={() => handleIntervalChange(interval)}>
                {interval === '15m' ? '15 Min' : interval === '1h' ? '1 Heure' : interval === '1D' ? 'Jour' : 'Semaine'}
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
          <span style={{ color: '#8a919e' }}>Vol {legendData.volume && `: ${formatVal(legendData.volume)}`}</span>
          <span style={{ color: '#00bcd4' }}>MM 10 {legendData.ma10 && `: ${legendData.ma10}`}</span>
          <span style={{ color: '#ff9800' }}>MM 100 {legendData.ma100 && `: ${legendData.ma100}`}</span>
          <span style={{ color: '#9c27b0' }}>MM 365 {legendData.ma365 && `: ${legendData.ma365}`}</span>
        </div>
        {selectedSymbol && <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />}
      </div>
    </div>
  );
}

export default TradingChart;