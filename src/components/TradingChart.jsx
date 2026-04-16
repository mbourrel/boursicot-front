import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { ASSET_COLORS } from './CompareBar';

const CHART_HEIGHT = 550;

const DRAW_TOOLS = [
  { id: 'line',  label: 'Tendance' },
  { id: 'hline', label: 'Niveau H.' },
  { id: 'vline', label: 'Niveau V.' },
  { id: 'rect',  label: 'Zone' },
  { id: 'fib',   label: 'Fibonacci' },
];

const DRAW_COLORS = ['#f59e0b', '#ef5350', '#26a69a', '#2962FF', '#e0e0e0'];

const FIB_LEVELS = [
  { r: 0,     label: '0%',    color: '#d1d4dc', dash: '' },
  { r: 0.236, label: '23.6%', color: '#2962FF', dash: '4 2' },
  { r: 0.382, label: '38.2%', color: '#26a69a', dash: '4 2' },
  { r: 0.5,   label: '50%',   color: '#ff9800', dash: '6 2' },
  { r: 0.618, label: '61.8%', color: '#26a69a', dash: '4 2' },
  { r: 0.786, label: '78.6%', color: '#2962FF', dash: '4 2' },
  { r: 1,     label: '100%',  color: '#d1d4dc', dash: '' },
];

// Étend une ligne entre p1 et p2 jusqu'aux bords du SVG (largeur W)
const extendLine = (p1, p2, W) => {
  if (!p1 || !p2) return null;
  if (Math.abs(p2.x - p1.x) < 0.001) return { x1: p1.x, y1: 0, x2: p1.x, y2: CHART_HEIGHT };
  const slope = (p2.y - p1.y) / (p2.x - p1.x);
  return { x1: 0, y1: p1.y - slope * p1.x, x2: W, y2: p1.y + slope * (W - p1.x) };
};

function TradingChart({ selectedSymbol, compareSymbols = [] }) {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const mainSeriesRef    = useRef(null);
  const currentDataRef   = useRef([]);
  const compareDataRef   = useRef({});
  const svgFrameRef      = useRef(null);

  const volumeSeriesRef  = useRef(null);
  const ma10SeriesRef    = useRef(null);
  const ma100SeriesRef   = useRef(null);
  const ma365SeriesRef   = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const atrSeriesRef     = useRef(null);

  const [legendData,    setLegendData]    = useState({});
  const [compareLegend, setCompareLegend] = useState({});
  const [timeRange,     setTimeRange]     = useState('1Y');
  const [candleInterval,setCandleInterval]= useState('1D');
  const [indicators, setIndicators] = useState({
    volume: true, ma10: true, ma100: false, ma365: false, bb: false, atr: false,
  });

  // ── Drawing state ──────────────────────────────────────────────────────────
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [activeTool,    setActiveTool]    = useState(null);
  const [drawColor,     setDrawColor]     = useState('#f59e0b');
  const [drawings,      setDrawings]      = useState([]);
  const [pendingPoint,  setPendingPoint]  = useState(null); // 1er point posé
  const [cursorPos,     setCursorPos]     = useState({ x: 0, y: 0 });
  const [svgTick,       setSvgTick]       = useState(0);   // force re-render SVG

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.VITE_API_URL;

  // ── Indicateurs visibilité ─────────────────────────────────────────────────
  useEffect(() => {
    if (volumeSeriesRef.current)  volumeSeriesRef.current.applyOptions({ visible: indicators.volume });
    if (ma10SeriesRef.current)    ma10SeriesRef.current.applyOptions({ visible: indicators.ma10 });
    if (ma100SeriesRef.current)   ma100SeriesRef.current.applyOptions({ visible: indicators.ma100 });
    if (ma365SeriesRef.current)   ma365SeriesRef.current.applyOptions({ visible: indicators.ma365 });
    if (bbUpperSeriesRef.current) bbUpperSeriesRef.current.applyOptions({ visible: indicators.bb });
    if (bbLowerSeriesRef.current) bbLowerSeriesRef.current.applyOptions({ visible: indicators.bb });
    if (atrSeriesRef.current)     atrSeriesRef.current.applyOptions({ visible: indicators.atr });
    if (chartInstanceRef.current) {
      chartInstanceRef.current.priceScale('atr').applyOptions({ visible: indicators.atr });
    }
  }, [indicators]);

  const toggleIndicator = (key) => setIndicators(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Touche Escape ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setPendingPoint(null); setActiveTool(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Sélection outil → réinitialise le point en attente ─────────────────────
  useEffect(() => { setPendingPoint(null); }, [activeTool]);

  // ── Helpers de conversion coordonnées ──────────────────────────────────────
  const toPixel = (time, price) => {
    const chart  = chartInstanceRef.current;
    const series = mainSeriesRef.current;
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(time);
    const y = series.priceToCoordinate(price);
    if (x === null || y === null) return null;
    return { x, y };
  };

  const fromPixel = (px, py) => {
    const chart  = chartInstanceRef.current;
    const series = mainSeriesRef.current;
    if (!chart || !series) return null;
    const time  = chart.timeScale().coordinateToTime(px);
    const price = series.coordinateToPrice(py);
    if (!time || price === null) return null;
    return { time, price };
  };

  // ── Gestionnaires SVG ──────────────────────────────────────────────────────
  const handleSvgClick = (e) => {
    if (!activeTool) return;
    const rect  = chartContainerRef.current.getBoundingClientRect();
    const px    = e.clientX - rect.left;
    const py    = e.clientY - rect.top;
    const coords = fromPixel(px, py);
    if (!coords) return;

    if (activeTool === 'hline') {
      setDrawings(prev => [...prev, { id: Date.now(), type: 'hline', color: drawColor, price: coords.price }]);
      return;
    }
    if (activeTool === 'vline') {
      setDrawings(prev => [...prev, { id: Date.now(), type: 'vline', color: drawColor, time: coords.time }]);
      return;
    }
    // Outils 2 points
    if (!pendingPoint) {
      setPendingPoint(coords);
    } else {
      setDrawings(prev => [...prev, {
        id: Date.now(), type: activeTool, color: drawColor,
        p1: pendingPoint, p2: coords,
      }]);
      setPendingPoint(null);
    }
  };

  const handleSvgMouseMove = (e) => {
    if (!activeTool) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleSvgRightClick = (e) => {
    e.preventDefault();
    setPendingPoint(null);
  };

  // ── TimeRange ──────────────────────────────────────────────────────────────
  const applyTimeRange = (range, chart = chartInstanceRef.current, data = currentDataRef.current) => {
    if (!chart || data.length === 0) return;
    if (range === 'ALL') { chart.timeScale().fitContent(); return; }
    const getLastDate = (item) => typeof item.time === 'number' ? new Date(item.time * 1000) : new Date(item.time);
    const lastDate = getLastDate(data[data.length - 1]);
    let fromDate = new Date(lastDate);
    if (range === '1W')  fromDate.setDate(fromDate.getDate() - 7);
    else if (range === '1M')  fromDate.setMonth(fromDate.getMonth() - 1);
    else if (range === '3M')  fromDate.setMonth(fromDate.getMonth() - 3);
    else if (range === '6M')  fromDate.setMonth(fromDate.getMonth() - 6);
    else if (range === '1Y')  fromDate.setFullYear(fromDate.getFullYear() - 1);
    else if (range === '5Y')  fromDate.setFullYear(fromDate.getFullYear() - 5);
    const fromStr = ['15m', '1h'].includes(candleInterval)
      ? Math.floor(fromDate.getTime() / 1000)
      : fromDate.toISOString().split('T')[0];
    chart.timeScale().setVisibleRange({ from: fromStr, to: data[data.length - 1].time });
  };

  // ── Création du chart ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current || !selectedSymbol) return;
    compareDataRef.current = {};

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#131722' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      width: chartContainerRef.current.clientWidth,
      height: CHART_HEIGHT,
      timeScale: { timeVisible: true },
    });
    chartInstanceRef.current = chart;

    // Abonnement scroll → re-render SVG (throttlé par requestAnimationFrame)
    const onScroll = () => {
      cancelAnimationFrame(svgFrameRef.current);
      svgFrameRef.current = requestAnimationFrame(() => setSvgTick(t => t + 1));
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onScroll);

    // ── Séries principales ─────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    mainSeriesRef.current = candleSeries;

    ma10SeriesRef.current    = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma10 });
    ma100SeriesRef.current   = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma100 });
    ma365SeriesRef.current   = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2, crosshairMarkerVisible: false, visible: indicators.ma365 });
    bbUpperSeriesRef.current = chart.addSeries(LineSeries, { color: 'rgba(41,98,255,0.5)', lineWidth: 1, crosshairMarkerVisible: false, visible: indicators.bb });
    bbLowerSeriesRef.current = chart.addSeries(LineSeries, { color: 'rgba(41,98,255,0.5)', lineWidth: 1, crosshairMarkerVisible: false, visible: indicators.bb });
    atrSeriesRef.current     = chart.addSeries(LineSeries, { color: '#e91e63', lineWidth: 2, priceScaleId: 'atr', visible: indicators.atr });
    volumeSeriesRef.current  = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '', visible: indicators.volume });
    chart.priceScale('atr').applyOptions({ scaleMargins: { top: 0.65, bottom: 0.2 }, visible: indicators.atr });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    // ── Séries comparaison ─────────────────────────────────────────────────
    const compareSeriesMap = {};
    if (compareSymbols.length > 0) {
      chart.priceScale('compare').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.3 }, borderColor: '#2B2B43' });
      compareSymbols.forEach((sym, i) => {
        compareSeriesMap[sym] = chart.addSeries(LineSeries, {
          color: ASSET_COLORS[i + 1], lineWidth: 2,
          priceScaleId: 'compare', crosshairMarkerVisible: true, title: sym,
        });
      });
    }

    let isMounted = true;

    // ── Fetch actif principal ──────────────────────────────────────────────
    fetch(`${API_URL}/api/prices?ticker=${encodeURIComponent(selectedSymbol)}&interval=${candleInterval}`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return;
        let raw = data.map(i => ({
          time: ['15m','1h'].includes(candleInterval) ? Math.floor(new Date(i.time).getTime()/1000) : i.time.split('T')[0],
          open: i.open, high: i.high, low: i.low, close: i.close, value: i.volume,
          color: i.close >= i.open ? 'rgba(38,166,154,0.4)' : 'rgba(239,83,80,0.4)',
        })).sort((a, b) => new Date(a.time) - new Date(b.time));

        for (let i = 0; i < raw.length; i++) {
          raw[i].tr = i === 0
            ? raw[i].high - raw[i].low
            : Math.max(raw[i].high - raw[i].low, Math.abs(raw[i].high - raw[i-1].close), Math.abs(raw[i].low - raw[i-1].close));
        }
        for (let i = 0; i < raw.length; i++) {
          const ma = (p) => { if (i < p-1) return null; let s=0; for (let j=0;j<p;j++) s+=raw[i-j].close; return s/p; };
          raw[i].ma10  = ma(10); raw[i].ma100 = ma(100); raw[i].ma365 = ma(365);
          if (i >= 19) { const s20=ma(20); let sq=0; for(let j=0;j<20;j++) sq+=Math.pow(raw[i-j].close-s20,2); const sd=Math.sqrt(sq/20); raw[i].bbU=s20+2*sd; raw[i].bbL=s20-2*sd; } else { raw[i].bbU=null; raw[i].bbL=null; }
          raw[i].atr = i===13 ? raw.slice(0,14).reduce((a,b)=>a+b.tr,0)/14 : i>13 ? (raw[i-1].atr*13+raw[i].tr)/14 : null;
        }
        if (raw.length > 0) {
          currentDataRef.current = raw;
          candleSeries.setData(raw.map(d => ({ time:d.time, open:d.open, high:d.high, low:d.low, close:d.close })));
          volumeSeriesRef.current.setData(raw.map(d => ({ time:d.time, value:d.value, color:d.color })));
          ma10SeriesRef.current.setData(raw.filter(d=>d.ma10!==null).map(d=>({time:d.time,value:d.ma10})));
          ma100SeriesRef.current.setData(raw.filter(d=>d.ma100!==null).map(d=>({time:d.time,value:d.ma100})));
          ma365SeriesRef.current.setData(raw.filter(d=>d.ma365!==null).map(d=>({time:d.time,value:d.ma365})));
          bbUpperSeriesRef.current.setData(raw.filter(d=>d.bbU!==null).map(d=>({time:d.time,value:d.bbU})));
          bbLowerSeriesRef.current.setData(raw.filter(d=>d.bbL!==null).map(d=>({time:d.time,value:d.bbL})));
          atrSeriesRef.current.setData(raw.filter(d=>d.atr!==null).map(d=>({time:d.time,value:d.atr})));
          applyTimeRange(timeRange, chart, raw);
        }
      }).catch(e => console.error('TradingChart:', e));

    // ── Fetch actifs comparaison ───────────────────────────────────────────
    compareSymbols.forEach(sym => {
      fetch(`${API_URL}/api/prices?ticker=${encodeURIComponent(sym)}&interval=${candleInterval}`)
        .then(r => r.json())
        .then(data => {
          if (!isMounted || !Array.isArray(data)) return;
          const raw = data.map(i => ({
            time: ['15m','1h'].includes(candleInterval) ? Math.floor(new Date(i.time).getTime()/1000) : i.time.split('T')[0],
            close: i.close,
          })).sort((a,b) => new Date(a.time)-new Date(b.time));
          if (!raw.length) return;
          const base = raw[0].close;
          compareSeriesMap[sym].setData(raw.map(d => ({ time:d.time, value:((d.close-base)/base)*100 })));
        }).catch(e => console.error(`Comparaison ${sym}:`, e));
    });

    // ── Crosshair ─────────────────────────────────────────────────────────
    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData.size > 0) {
        setLegendData({
          close:   param.seriesData.get(candleSeries)?.close?.toFixed(2),
          volume:  param.seriesData.get(volumeSeriesRef.current)?.value,
          ma10:    param.seriesData.get(ma10SeriesRef.current)?.value?.toFixed(2),
          ma100:   param.seriesData.get(ma100SeriesRef.current)?.value?.toFixed(2),
          ma365:   param.seriesData.get(ma365SeriesRef.current)?.value?.toFixed(2),
          bbUpper: param.seriesData.get(bbUpperSeriesRef.current)?.value?.toFixed(2),
          bbLower: param.seriesData.get(bbLowerSeriesRef.current)?.value?.toFixed(2),
          atr:     param.seriesData.get(atrSeriesRef.current)?.value?.toFixed(2),
        });
        if (compareSymbols.length > 0) {
          const cl = {};
          compareSymbols.forEach(sym => {
            const v = param.seriesData.get(compareSeriesMap[sym])?.value;
            if (v !== undefined) cl[sym] = v.toFixed(2);
          });
          setCompareLegend(cl);
        }
      }
    });

    const onResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', onResize);
    return () => {
      isMounted = false;
      cancelAnimationFrame(svgFrameRef.current);
      window.removeEventListener('resize', onResize);
      chart.remove();
    };
  }, [selectedSymbol, compareSymbols.join(','), candleInterval, API_URL]);

  // ── Rendu SVG des dessins ──────────────────────────────────────────────────
  // svgTick est référencé pour déclencher le re-render quand le chart scrolle
  const _tick = svgTick; // eslint-disable-line no-unused-vars
  const W = chartContainerRef.current?.clientWidth || 1000;

  const svgElements = drawings.map(d => {
    if (d.type === 'hline') {
      const y = mainSeriesRef.current?.priceToCoordinate(d.price);
      if (y == null) return null;
      return (
        <g key={d.id}>
          <line x1={0} y1={y} x2={W} y2={y} stroke={d.color} strokeWidth="1.5" strokeDasharray="6 3" />
          <rect x={W - 62} y={y - 10} width={61} height={14} fill="#131722cc" rx="2" />
          <text x={W - 59} y={y + 1} fill={d.color} fontSize="10" fontFamily="monospace">{d.price.toFixed(2)}</text>
        </g>
      );
    }
    if (d.type === 'vline') {
      const x = chartInstanceRef.current?.timeScale().timeToCoordinate(d.time);
      if (x == null) return null;
      return <line key={d.id} x1={x} y1={0} x2={x} y2={CHART_HEIGHT} stroke={d.color} strokeWidth="1.5" strokeDasharray="6 3" />;
    }
    if (d.type === 'line') {
      const p1 = toPixel(d.p1.time, d.p1.price);
      const p2 = toPixel(d.p2.time, d.p2.price);
      const ext = extendLine(p1, p2, W);
      if (!ext) return null;
      return <line key={d.id} x1={ext.x1} y1={ext.y1} x2={ext.x2} y2={ext.y2} stroke={d.color} strokeWidth="1.5" />;
    }
    if (d.type === 'rect') {
      const p1 = toPixel(d.p1.time, d.p1.price);
      const p2 = toPixel(d.p2.time, d.p2.price);
      if (!p1 || !p2) return null;
      const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x), h = Math.abs(p2.y - p1.y);
      return <rect key={d.id} x={x} y={y} width={w} height={h} fill={`${d.color}22`} stroke={d.color} strokeWidth="1.5" />;
    }
    if (d.type === 'fib') {
      const priceLow  = Math.min(d.p1.price, d.p2.price);
      const priceHigh = Math.max(d.p1.price, d.p2.price);
      return (
        <g key={d.id}>
          {FIB_LEVELS.map(fib => {
            const price = priceLow + (priceHigh - priceLow) * (1 - fib.r);
            const y = mainSeriesRef.current?.priceToCoordinate(price);
            if (y == null) return null;
            return (
              <g key={fib.r}>
                <line x1={0} y1={y} x2={W} y2={y} stroke={fib.color} strokeWidth="1" strokeDasharray={fib.dash || undefined} opacity="0.85" />
                <rect x={W - 72} y={y - 9} width={71} height={14} fill="#131722cc" rx="2" />
                <text x={W - 69} y={y + 2} fill={fib.color} fontSize="9.5" fontFamily="monospace">{fib.label} {price.toFixed(2)}</text>
              </g>
            );
          })}
        </g>
      );
    }
    return null;
  });

  // Aperçu du dessin en cours (premier point posé, curseur en mouvement)
  let previewEl = null;
  if (pendingPoint && activeTool && !['hline','vline'].includes(activeTool)) {
    const p1 = toPixel(pendingPoint.time, pendingPoint.price);
    const p2 = cursorPos;
    if (p1) {
      if (activeTool === 'line') {
        const ext = extendLine(p1, p2, W);
        if (ext) previewEl = <line x1={ext.x1} y1={ext.y1} x2={ext.x2} y2={ext.y2} stroke={drawColor} strokeWidth="1" strokeDasharray="5 3" opacity="0.6" />;
      }
      if (activeTool === 'rect') {
        const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y);
        previewEl = <rect x={x} y={y} width={Math.abs(p2.x-p1.x)} height={Math.abs(p2.y-p1.y)} fill={`${drawColor}18`} stroke={drawColor} strokeWidth="1" strokeDasharray="4 2" />;
      }
      if (activeTool === 'fib') {
        previewEl = <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={drawColor} strokeWidth="1" strokeDasharray="5 3" opacity="0.6" />;
      }
    }
  }
  // Point d'ancrage (premier clic)
  let anchorDot = null;
  if (pendingPoint) {
    const p = toPixel(pendingPoint.time, pendingPoint.price);
    if (p) anchorDot = <circle cx={p.x} cy={p.y} r={4} fill={drawColor} opacity={0.9} />;
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const btnStyle = (active, activeColor = '#2962FF') => ({
    padding: '6px 10px', background: active ? activeColor : 'transparent',
    color: active ? 'white' : '#8a919e',
    border: `1px solid ${active ? activeColor : '#2B2B43'}`,
    borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.2s',
  });

  const formatVal = (val) => {
    if (val == null) return 'N/A';
    if (val > 1e9) return (val/1e9).toFixed(2)+' Md';
    if (val > 1e6) return (val/1e6).toFixed(2)+' M';
    return val;
  };

  return (
    <div style={{ backgroundColor: '#131722', padding: '15px', borderRadius: '12px', border: '1px solid #2B2B43' }}>

      {/* ── BARRE DE CONTRÔLE ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'15px', borderBottom:'1px solid #2B2B43', paddingBottom:'15px' }}>

        {/* Ligne 1 : Bougies + Zoom */}
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
              <span style={{ fontSize:'11px', color:'#8a919e', marginRight:'4px' }}>BOUGIES :</span>
              {['15m','1h','1D','1W'].map(iv => (
                <button key={iv} style={btnStyle(candleInterval===iv)} onClick={() => setCandleInterval(iv)}>
                  {iv==='15m'?'15 Min':iv==='1h'?'1 Heure':iv==='1D'?'Jour':'Semaine'}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
              <span style={{ fontSize:'11px', color:'#8a919e', marginRight:'4px' }}>ZOOM :</span>
              {['1W','1M','3M','6M','1Y','5Y','ALL'].map(r => (
                <button key={r} style={btnStyle(timeRange===r)} onClick={() => { setTimeRange(r); applyTimeRange(r); }}>
                  {r==='ALL'?'Tout':r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ligne 2 : Indicateurs + bouton Dessiner */}
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
          <div style={{ display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:'11px', color:'#8a919e', marginRight:'4px' }}>INDICATEURS :</span>
            <button style={btnStyle(indicators.volume)}                onClick={() => toggleIndicator('volume')}>Volumes</button>
            <button style={btnStyle(indicators.bb)}                    onClick={() => toggleIndicator('bb')}>Bollinger</button>
            <button style={btnStyle(indicators.atr, '#e91e63')}        onClick={() => toggleIndicator('atr')}>ATR</button>
            <button style={btnStyle(indicators.ma10, '#00bcd4')}       onClick={() => toggleIndicator('ma10')}>MM 10</button>
            <button style={btnStyle(indicators.ma100, '#ff9800')}      onClick={() => toggleIndicator('ma100')}>MM 100</button>
            <button style={btnStyle(indicators.ma365, '#9c27b0')}      onClick={() => toggleIndicator('ma365')}>MM 365</button>
          </div>

          {/* Bouton toggle outils de dessin */}
          <button
            style={{ ...btnStyle(showDrawTools, '#374151'), display:'flex', alignItems:'center', gap:'5px' }}
            onClick={() => { setShowDrawTools(v => !v); if (showDrawTools) { setActiveTool(null); setPendingPoint(null); } }}
          >
            ✏ Dessiner
          </button>
        </div>

        {/* Ligne 3 : Outils de dessin (conditionnelle) */}
        {showDrawTools && (
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', padding:'10px 12px', backgroundColor:'#1a1e2e', borderRadius:'8px', border:'1px solid #2B2B43' }}>

            {/* Outils */}
            <div style={{ display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px', color:'#8a919e', marginRight:'4px' }}>OUTIL :</span>
              {DRAW_TOOLS.map(t => (
                <button
                  key={t.id}
                  style={btnStyle(activeTool===t.id, '#374151')}
                  onClick={() => setActiveTool(activeTool===t.id ? null : t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div style={{ width:'1px', height:'24px', backgroundColor:'#2B2B43' }} />

            {/* Couleurs */}
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <span style={{ fontSize:'11px', color:'#8a919e', marginRight:'2px' }}>COULEUR :</span>
              {DRAW_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setDrawColor(c)}
                  style={{
                    width:'18px', height:'18px', borderRadius:'50%', backgroundColor:c, border:`2px solid ${drawColor===c ? 'white' : 'transparent'}`,
                    cursor:'pointer', padding:0, flexShrink:0, transition:'border 0.15s',
                  }}
                />
              ))}
            </div>

            {/* Séparateur */}
            <div style={{ width:'1px', height:'24px', backgroundColor:'#2B2B43' }} />

            {/* Effacer */}
            <button
              style={{ ...btnStyle(false), color:'#ef5350', borderColor:'#ef535040' }}
              onClick={() => { setDrawings([]); setPendingPoint(null); }}
            >
              Tout effacer
            </button>

            {/* Indications contextuelles */}
            {activeTool && (
              <span style={{ fontSize:'11px', color:'#8a919e', fontStyle:'italic' }}>
                {['line','rect','fib'].includes(activeTool)
                  ? pendingPoint ? '2e clic pour terminer — clic droit pour annuler' : '1er clic pour placer le point de départ'
                  : 'Clic pour placer — Echap ou outil actif pour désélectionner'}
              </span>
            )}
          </div>
        )}

        {/* Légende comparaison */}
        {compareSymbols.length > 0 && (
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:'11px', color:'#8a919e' }}>% vs départ :</span>
            {compareSymbols.map((sym, i) => {
              const val = compareLegend[sym];
              const color = ASSET_COLORS[i+1];
              const num = val ? parseFloat(val) : null;
              return (
                <span key={sym} style={{ fontSize:'12px', fontWeight:'bold' }}>
                  <span style={{ color }}>● {sym}</span>
                  {val && <span style={{ color: num>=0 ? '#26a69a' : '#ef5350' }}> {num>=0?'+':''}{val}%</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ZONE DU GRAPHIQUE ── */}
      <div style={{ position:'relative', overflow:'hidden' }}>

        {/* Légende crosshair */}
        <div style={{ position:'absolute', top:15, left:15, zIndex:10, display:'flex', flexWrap:'wrap', gap:'10px', backgroundColor:'rgba(19,23,34,0.8)', padding:'8px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'bold', maxWidth:'90%', pointerEvents:'none' }}>
          <span style={{ color:'#d1d4dc' }}>{selectedSymbol} {legendData.close && `$${legendData.close}`}</span>
          {indicators.volume && legendData.volume !== undefined && <span style={{ color:'#8a919e' }}>Vol: {formatVal(legendData.volume)}</span>}
          {indicators.ma10  && legendData.ma10   && <span style={{ color:'#00bcd4' }}>MM10: {legendData.ma10}</span>}
          {indicators.ma100 && legendData.ma100  && <span style={{ color:'#ff9800' }}>MM100: {legendData.ma100}</span>}
          {indicators.ma365 && legendData.ma365  && <span style={{ color:'#9c27b0' }}>MM365: {legendData.ma365}</span>}
          {indicators.bb && legendData.bbUpper && legendData.bbLower && <span style={{ color:'#448aff' }}>BB: {legendData.bbLower} – {legendData.bbUpper}</span>}
          {indicators.atr && legendData.atr && <span style={{ color:'#e91e63' }}>ATR: {legendData.atr}</span>}
        </div>

        {/* Chart */}
        {selectedSymbol && <div ref={chartContainerRef} style={{ width:'100%', height:`${CHART_HEIGHT}px` }} />}

        {/* SVG overlay dessin */}
        <svg
          style={{
            position:'absolute', top:0, left:0, width:'100%', height:`${CHART_HEIGHT}px`,
            cursor: activeTool ? 'crosshair' : 'default',
            pointerEvents: activeTool ? 'auto' : 'none',
            overflow:'hidden',
          }}
          onClick={handleSvgClick}
          onMouseMove={handleSvgMouseMove}
          onContextMenu={handleSvgRightClick}
        >
          <defs>
            <clipPath id="chartClip">
              <rect x={0} y={0} width={W} height={CHART_HEIGHT} />
            </clipPath>
          </defs>
          <g clipPath="url(#chartClip)">
            {svgElements}
            {previewEl}
            {anchorDot}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default TradingChart;
