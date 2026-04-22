import { useMemo, useState, useRef, useEffect } from 'react';
import { createChart, BaselineSeries } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

const RANGES = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', 'Max'];

function idxForRange(dates, range) {
  if (!dates?.length || range === 'Max') return [0, dates.length];
  const d = new Date();
  if (range === '3M') d.setMonth(d.getMonth() - 3);
  else if (range === '6M') d.setMonth(d.getMonth() - 6);
  else if (range === '1Y') d.setFullYear(d.getFullYear() - 1);
  else if (range === '2Y') d.setFullYear(d.getFullYear() - 2);
  else if (range === '5Y') d.setFullYear(d.getFullYear() - 5);
  else if (range === '10Y') d.setFullYear(d.getFullYear() - 10);
  const cutoff = d.toISOString().slice(0, 10);
  const start = Math.max(0, dates.findIndex(dd => dd >= cutoff));
  return [start, dates.length];
}

// ── Snapshot instantané (SVG, inchangé) ──────────────────────────────────────
function CurveSnapshot({ bondYields }) {
  const MATURITIES = ['US 2Y', 'US 10Y', 'US 30Y'];
  const points = MATURITIES.map(name => bondYields?.find(b => b.name === name)).filter(Boolean);
  if (points.length < 2) return null;

  const rates   = points.map(p => p.rate ?? 0);
  const minRate = Math.min(...rates) - 0.3;
  const maxRate = Math.max(...rates) + 0.3;
  const W = 300, H = 110, ml = 30, mb = 24;
  const pw = W - ml - 10, ph = H - mb - 10;
  const xS = i => ml + (i / (points.length - 1)) * pw;
  const yS = v => 10 + ph - ((v - minRate) / (maxRate - minRate)) * ph;
  const polyline = points.map((p, i) => `${xS(i).toFixed(1)},${yS(p.rate ?? 0).toFixed(1)}`).join(' ');
  const isInverted = (points[0]?.rate ?? 0) > (points[1]?.rate ?? 0);
  const spread2Y10Y = points[1] && points[0] ? ((points[1].rate ?? 0) - (points[0].rate ?? 0)).toFixed(2) : null;

  return (
    <div style={{ flex: '0 0 auto' }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', textAlign: 'center' }}>
        Courbe actuelle (snapshot)
      </div>
      {spread2Y10Y && (
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '6px' }}>
          <span style={{ color: isInverted ? '#ef5350' : '#26a69a', fontWeight: '600' }}>
            Spread 10Y–2Y : {spread2Y10Y > 0 ? '+' : ''}{spread2Y10Y}%
          </span>
        </div>
      )}
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        {[minRate, (minRate + maxRate) / 2, maxRate].map((v, i) => (
          <g key={i}>
            <line x1={ml} y1={yS(v)} x2={W - 10} y2={yS(v)} stroke="var(--border)" strokeDasharray="3,3" />
            <text x={ml - 4} y={yS(v) + 4} textAnchor="end" fill="var(--text3)" fontSize="9">{v.toFixed(1)}%</text>
          </g>
        ))}
        <polyline
          points={`${xS(0).toFixed(1)},${(10 + ph).toFixed(1)} ${polyline} ${xS(points.length - 1).toFixed(1)},${(10 + ph).toFixed(1)}`}
          fill={isInverted ? '#ef535018' : '#2962FF18'} stroke="none"
        />
        <polyline points={polyline} fill="none" stroke={isInverted ? '#ef5350' : '#2962FF'} strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.name}>
            <circle cx={xS(i)} cy={yS(p.rate ?? 0)} r="4" fill={isInverted ? '#ef5350' : '#2962FF'} />
            <text x={xS(i)} y={H - mb + 14} textAnchor="middle" fill="var(--text3)" fontSize="9">{p.name}</text>
            <text x={xS(i)} y={yS(p.rate ?? 0) - 8} textAnchor="middle" fill="var(--text2)" fontSize="10" fontWeight="bold">
              {(p.rate ?? 0).toFixed(2)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Historique spread (Canvas) ────────────────────────────────────────────────
function SpreadHistory({ allDates, allValues, range, onRangeChange }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const { theme }    = useTheme();

  const stats = useMemo(() => {
    const [s, e] = idxForRange(allDates, range);
    const vals = allValues?.slice(s, e).filter(v => v != null) ?? [];
    if (!vals.length) return null;
    return {
      min: Math.min(...vals).toFixed(2),
      max: Math.max(...vals).toFixed(2),
      inversionDays: vals.filter(v => v < 0).length,
    };
  }, [allDates, allValues, range]);

  // Crée le chart dès que les données arrivent
  useEffect(() => {
    if (!allDates?.length || !allValues?.length) return;
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid', color: theme.bg2 },
        textColor: theme.chartText,
      },
      grid: {
        vertLines: { color: theme.chartGrid },
        horzLines: { color: theme.chartGrid },
      },
      width: containerRef.current.clientWidth,
      height: 200,
      timeScale: { borderColor: theme.chartGrid },
      rightPriceScale: { borderColor: theme.chartGrid },
    });
    chartRef.current = chart;

    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: '#2962FF',
      topFillColor1: 'rgba(41,98,255,0.22)',
      topFillColor2: 'rgba(41,98,255,0.04)',
      bottomLineColor: '#ef5350',
      bottomFillColor1: 'rgba(239,83,80,0.04)',
      bottomFillColor2: 'rgba(239,83,80,0.22)',
      lineWidth: 2,
      priceFormat: { type: 'custom', formatter: v => v.toFixed(2) + '%' },
    });
    seriesRef.current = series;

    const data = allDates
      .map((d, i) => ({ time: d, value: allValues[i] }))
      .filter(p => p.value != null);
    series.setData(data);

    // Plage initiale
    if (range === 'Max') {
      chart.timeScale().fitContent();
    } else {
      const [startIdx] = idxForRange(allDates, range);
      chart.timeScale().setVisibleRange({
        from: allDates[startIdx],
        to:   allDates[allDates.length - 1],
      });
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [allDates, allValues]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mise à jour du thème
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: { background: { type: 'solid', color: theme.bg2 }, textColor: theme.chartText },
      grid:   { vertLines: { color: theme.chartGrid }, horzLines: { color: theme.chartGrid } },
      timeScale:       { borderColor: theme.chartGrid },
      rightPriceScale: { borderColor: theme.chartGrid },
    });
  }, [theme]);

  // Applique la plage quand elle change via bouton
  useEffect(() => {
    if (!chartRef.current || !allDates?.length) return;
    if (range === 'Max') {
      chartRef.current.timeScale().fitContent();
    } else {
      const [startIdx] = idxForRange(allDates, range);
      chartRef.current.timeScale().setVisibleRange({
        from: allDates[startIdx],
        to:   allDates[allDates.length - 1],
      });
    }
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Contrôles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
          Historique spread 10Y–2Y
          <span style={{ marginLeft: '8px', color: '#ef535099', fontSize: '10px' }}>zone rouge = inversion</span>
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {range !== 'Max' && (
            <button onClick={() => onRangeChange('Max')} style={{
              background: '#ef535022', border: '1px solid #ef535044', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px', color: '#ef5350', cursor: 'pointer', marginRight: '4px',
            }}>↺ Reset</button>
          )}
          {RANGES.map(r => (
            <button key={r} onClick={() => onRangeChange(r)} style={{
              background: range === r ? 'var(--text3)' : 'none',
              border: '1px solid var(--border)', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px',
              color: range === r ? 'var(--bg0)' : 'var(--text3)',
              cursor: 'pointer',
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
          {[
            { label: 'Min période',       value: `${stats.min}%`, color: parseFloat(stats.min) < 0 ? '#ef5350' : 'var(--text2)' },
            { label: 'Max période',       value: `${stats.max}%`, color: 'var(--text2)' },
            { label: 'Mois en inversion', value: `${stats.inversionDays}`, color: stats.inversionDays > 0 ? '#ef5350' : '#26a69a' },
          ].map(s => (
            <div key={s.label} style={{ fontSize: '10px', color: 'var(--text3)' }}>
              {s.label} : <span style={{ color: s.color, fontWeight: '600' }}>{s.value}</span>
            </div>
          ))}
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto', fontStyle: 'italic' }}>
            scroll pour zoomer
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} style={{ height: '200px' }} />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function YieldCurveChart({ yieldCurve, bondYields, loading, error }) {
  const [showInfo, setShowInfo] = useState(false);
  const [range,    setRange]    = useState('Max');

  const currentSpread = yieldCurve?.values?.at(-1) ?? null;
  const isInverted    = currentSpread !== null && currentSpread < 0;

  return (
    <div style={{
      backgroundColor: 'var(--bg2)', borderRadius: '10px',
      border: '1px solid var(--border)', padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📉</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '14px' }}>
                Indicateur de Récession — Courbe des Taux
              </span>
              {!loading && currentSpread !== null && (
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '10px', fontWeight: '700',
                  backgroundColor: isInverted ? '#ef535022' : '#26a69a22',
                  color: isInverted ? '#ef5350' : '#26a69a',
                  border: `1px solid ${isInverted ? '#ef535055' : '#26a69a55'}`,
                }}>
                  {isInverted ? '⚠ Courbe Inversée' : '✓ Courbe Normale'}
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
              Spread 10Y – 2Y (US Treasuries) · {currentSpread !== null ? `${currentSpread.toFixed(2)}%` : '—'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            background: showInfo ? 'var(--border)' : 'none',
            border: '1px solid var(--border)', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text3)',
            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >?</button>
      </div>

      {showInfo && (
        <div style={{
          backgroundColor: 'var(--bg3)', borderRadius: '8px', padding: '14px 16px',
          marginBottom: '14px', borderLeft: `3px solid ${isInverted ? '#ef5350' : '#2962FF'}`,
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.7',
        }}>
          <div style={{ color: 'var(--text2)', fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}>
            Pourquoi la courbe des taux prédit les récessions ?
          </div>
          <p style={{ margin: '0 0 10px' }}>
            Normalement, prêter sur <strong style={{ color: 'var(--text2)' }}>10 ans</strong> rapporte
            plus que sur <strong style={{ color: 'var(--text2)' }}>2 ans</strong>. Quand la courbe
            <strong style={{ color: '#ef5350' }}> s'inverse</strong> (10Y &lt; 2Y), les investisseurs
            anticipent une récession et une baisse des taux à venir.
          </p>
          <div style={{ backgroundColor: 'var(--bg2)', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
            <div style={{ color: 'var(--text2)', fontWeight: '600', marginBottom: '6px', fontSize: '11px' }}>
              Précédents historiques — 8 récessions sur 8 anticipées :
            </div>
            {[
              ['1978', 'Inversion → récession 1980 (choc pétrolier + Volcker)'],
              ['1988', 'Inversion → récession 1990–91 (guerre du Golfe)'],
              ['1998', 'Inversion → récession 2001 (bulle internet)'],
              ['2006', 'Inversion → récession 2008 (subprimes)'],
              ['2019', 'Inversion → récession 2020 (COVID)'],
              ['2022–23', 'Inversion prolongée → à surveiller sur 12–24 mois'],
            ].map(([year, desc]) => (
              <div key={year} style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '3px' }}>
                <span style={{ color: '#ef5350', fontWeight: '600', minWidth: '52px' }}>{year}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <span style={{ color: '#f59e0b', fontWeight: '600' }}>⚠ · </span>
            Délai moyen inversion → récession : <strong style={{ color: 'var(--text2)' }}>12 à 24 mois</strong>.
            La normalisation (retour &gt; 0%) peut signaler l'imminence plutôt que la fin d'une récession.
          </div>
        </div>
      )}

      {loading && <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>Chargement…</div>}
      {error   && <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SpreadHistory
              allDates={yieldCurve?.dates}
              allValues={yieldCurve?.values}
              range={range}
              onRangeChange={setRange}
            />
          </div>
          <CurveSnapshot bondYields={bondYields} />
        </div>
      )}
    </div>
  );
}
