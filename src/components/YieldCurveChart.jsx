import { useMemo, useState, useRef, useEffect, useCallback } from 'react';

const ML = 46, MR = 20, MT = 20, MB = 36;
const SVG_W = 780, SVG_H = 220;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

const RANGES = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', 'Max'];

// Calcule des ticks à intervalles "propres" — cible 5-8 labels, jamais de chevauchement
function niceXTicks(dates, xS) {
  if (dates.length < 2) return [];
  const start = new Date(dates[0]);
  const end   = new Date(dates[dates.length - 1]);
  const days  = Math.max(1, (end - start) / 86400000);

  const tickDates = [];

  if (days <= 90) {
    // Mensuel
    const cur = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    for (; cur <= end; cur.setMonth(cur.getMonth() + 1))
      tickDates.push(cur.toISOString().slice(0, 7));
  } else if (days <= 2 * 365) {
    // Trimestriel
    const cur = new Date(start.getFullYear(), Math.ceil(start.getMonth() / 3) * 3, 1);
    for (; cur <= end; cur.setMonth(cur.getMonth() + 3))
      tickDates.push(cur.toISOString().slice(0, 7));
  } else if (days <= 5 * 365) {
    // Annuel
    for (let y = start.getFullYear() + 1; y <= end.getFullYear(); y++)
      tickDates.push(`${y}`);
  } else if (days <= 15 * 365) {
    // Tous les 2 ans
    const s = Math.ceil((start.getFullYear() + 1) / 2) * 2;
    for (let y = s; y <= end.getFullYear(); y += 2)
      tickDates.push(`${y}`);
  } else if (days <= 40 * 365) {
    // Tous les 5 ans
    const s = Math.ceil((start.getFullYear() + 1) / 5) * 5;
    for (let y = s; y <= end.getFullYear(); y += 5)
      tickDates.push(`${y}`);
  } else {
    // Tous les 10 ans
    const s = Math.ceil((start.getFullYear() + 1) / 10) * 10;
    for (let y = s; y <= end.getFullYear(); y += 10)
      tickDates.push(`${y}`);
  }

  // Mappe chaque date de tick sur l'index de données le plus proche
  const mapped = tickDates.map(td => {
    const idx = dates.findIndex(d => d >= td);
    if (idx === -1) return null;
    const label = td.length <= 4 ? td : td.slice(0, 7);
    return { x: xS(idx), label };
  }).filter(Boolean);

  // Filtre anti-chevauchement garanti : espacement minimum de 65 unités SVG
  const result = [];
  for (const tick of mapped) {
    if (!result.length || tick.x - result[result.length - 1].x >= 65)
      result.push(tick);
  }
  return result;
}

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

// ── Snapshot instantané ───────────────────────────────────────────────────────
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

// ── Historique spread ─────────────────────────────────────────────────────────
function SpreadHistory({ allDates, allValues, range, onRangeChange }) {
  const [viewWindow, setViewWindow] = useState(() => idxForRange(allDates, range));
  const svgRef = useRef(null);

  // Sync viewWindow quand range change via bouton
  useEffect(() => {
    setViewWindow(idxForRange(allDates, range));
  }, [range, allDates]);

  const isFullView = viewWindow[0] === 0 && viewWindow[1] === (allDates?.length ?? 0);

  const dates  = useMemo(() => allDates?.slice(viewWindow[0], viewWindow[1]) ?? [], [allDates, viewWindow]);
  const values = useMemo(() => allValues?.slice(viewWindow[0], viewWindow[1]) ?? [], [allValues, viewWindow]);

  // Scroll zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseXPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const total = allDates?.length ?? 0;
    if (total < 2) return;

    setViewWindow(([s, en]) => {
      const len = en - s;
      const factor = e.deltaY > 0 ? 1.25 : 0.8;
      const newLen = Math.min(total, Math.max(30, Math.round(len * factor))); // min ~6 semaines (données journalières)
      const anchor = s + mouseXPct * len;
      let newStart = Math.max(0, Math.round(anchor - mouseXPct * newLen));
      let newEnd = newStart + newLen;
      if (newEnd > total) { newEnd = total; newStart = Math.max(0, newEnd - newLen); }
      return [newStart, newEnd];
    });
  }, [allDates]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const computed = useMemo(() => {
    if (!dates.length || !values.length) return null;
    const yLo = Math.min(...values) - 0.2;
    const yHi = Math.max(...values) + 0.2;
    const xS = i => ML + (i / Math.max(dates.length - 1, 1)) * PW;
    const yS = v => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;
    const y0 = yS(0);
    const polyline = values.map((v, i) => `${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ');
    const xTicks = niceXTicks(dates, xS);
    const yTicks = Array.from({ length: 5 }, (_, k) => {
      const v = yLo + (k / 4) * (yHi - yLo);
      return { y: yS(v), label: v.toFixed(1) };
    });
    const minVal = Math.min(...values).toFixed(2);
    const maxVal = Math.max(...values).toFixed(2);
    const inversionDays = values.filter(v => v < 0).length;
    return { polyline, y0, xTicks, yTicks, minVal, maxVal, inversionDays };
  }, [dates, values]);

  if (!computed) return null;
  const { polyline, y0, xTicks, yTicks, minVal, maxVal, inversionDays } = computed;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
          Historique spread 10Y–2Y
          <span style={{ marginLeft: '8px', color: '#ef535099', fontSize: '10px' }}>zone rouge = inversion</span>
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {!isFullView && (
            <button onClick={() => { setViewWindow([0, allDates?.length ?? 0]); onRangeChange('Max'); }} style={{
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

      <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
        {[
          { label: 'Min période', value: `${minVal}%`, color: parseFloat(minVal) < 0 ? '#ef5350' : 'var(--text2)' },
          { label: 'Max période', value: `${maxVal}%`, color: 'var(--text2)' },
          { label: 'Jours en inversion', value: `${inversionDays}`, color: inversionDays > 0 ? '#ef5350' : '#26a69a' },
        ].map(s => (
          <div key={s.label} style={{ fontSize: '10px', color: 'var(--text3)' }}>
            {s.label} : <span style={{ color: s.color, fontWeight: '600' }}>{s.value}</span>
          </div>
        ))}
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto', fontStyle: 'italic' }}>
          scroll pour zoomer
        </div>
      </div>

      <svg ref={svgRef} width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', cursor: 'crosshair' }}>
        {yTicks.map(({ y, label }) => (
          <g key={label}>
            <line x1={ML} y1={y} x2={SVG_W - MR} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
            <text x={ML - 6} y={y + 4} textAnchor="end" fill="var(--text3)" fontSize="10">{label}%</text>
          </g>
        ))}
        {xTicks.map(({ x, label }) => (
          <text key={label} x={x} y={SVG_H - 4} textAnchor="middle" fill="var(--text3)" fontSize="9">{label}</text>
        ))}
        <clipPath id="below-zero-yc">
          <rect x={ML} y={y0} width={PW} height={SVG_H - MB - y0 + MT} />
        </clipPath>
        <polyline points={`${ML},${y0} ${polyline} ${ML + PW},${y0}`} fill="#ef535020" stroke="none" clipPath="url(#below-zero-yc)" />
        <line x1={ML} y1={y0} x2={SVG_W - MR} y2={y0} stroke="#ef535060" strokeWidth="1" strokeDasharray="4,3" />
        <text x={ML - 6} y={y0 + 4} textAnchor="end" fill="#ef535099" fontSize="9">0%</text>
        <polyline points={polyline} fill="none" stroke="#2962FF" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
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
