import { useMemo, useState, useRef, useEffect, useCallback } from 'react';

const ML = 46, MR = 20, MT = 20, MB = 36;
const SVG_W = 780, SVG_H = 240;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

const SERIES = [
  { key: 'us10y',   label: 'US 10Y',   color: '#2962FF' },
  { key: 'bund10y', label: 'Bund 10Y', color: '#f59e0b' },
  { key: 'oat10y',  label: 'OAT 10Y',  color: '#26a69a' },
];

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

function buildAlignedDates(history) {
  const sets = SERIES.map(s => history?.[s.key]).filter(Boolean);
  if (!sets.length) return null;
  const dateSet = new Set();
  sets.forEach(s => s.dates.forEach(d => dateSet.add(d)));
  const dates = [...dateSet].sort();
  const indexed = SERIES.map(s => {
    const map = {};
    history?.[s.key]?.dates.forEach((d, i) => { map[d] = history[s.key].values[i]; });
    return { ...s, map };
  });
  return { allDates: dates, series: indexed };
}

export default function SovereignSpreadsChart({ history, bondYields, loading, error }) {
  const [showInfo,  setShowInfo]  = useState(false);
  const [hoverIdx,  setHoverIdx]  = useState(null);
  const [range,     setRange]     = useState('Max');
  const svgRef = useRef(null);

  const aligned = useMemo(() => buildAlignedDates(history), [history]);
  const allDates = aligned?.allDates ?? [];

  // null = plage complète ; initialisé dès que allDates est disponible
  const [viewWindow, setViewWindow] = useState(null);

  useEffect(() => {
    if (allDates.length) setViewWindow(idxForRange(allDates, range));
  }, [allDates.length, range]); // eslint-disable-line

  const effectiveWindow = viewWindow ?? [0, allDates.length];
  const isFullView = effectiveWindow[0] === 0 && effectiveWindow[1] === allDates.length;

  // Scroll zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseXPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const total = allDates.length;
    if (total < 2) return;

    setViewWindow((prev) => {
      const [s, en] = prev ?? [0, total];
      const len = en - s;
      const factor = e.deltaY > 0 ? 1.25 : 0.8;
      const newLen = Math.min(total, Math.max(5, Math.round(len * factor)));
      const anchor = s + mouseXPct * len;
      let newStart = Math.max(0, Math.round(anchor - mouseXPct * newLen));
      let newEnd = newStart + newLen;
      if (newEnd > total) { newEnd = total; newStart = Math.max(0, newEnd - newLen); }
      return [newStart, newEnd];
    });
  }, [allDates.length]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const computed = useMemo(() => {
    if (!aligned) return null;
    const { series } = aligned;
    const dates = allDates.slice(effectiveWindow[0], effectiveWindow[1]);
    if (!dates.length) return null;

    const allVals = series.flatMap(s => dates.map(d => s.map[d]).filter(v => v != null));
    if (!allVals.length) return null;

    const yLo = Math.min(...allVals) - 0.3;
    const yHi = Math.max(...allVals) + 0.3;
    const xS  = i => ML + (i / Math.max(dates.length - 1, 1)) * PW;
    const yS  = v => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;

    const polylines = series.map(s => ({
      ...s,
      points: dates.map((d, i) => {
        const v = s.map[d];
        return v != null ? `${xS(i).toFixed(1)},${yS(v).toFixed(1)}` : null;
      }).filter(Boolean).join(' '),
    }));

    const step   = Math.max(1, Math.floor(dates.length / 8));
    const xTicks = [];
    for (let i = 0; i < dates.length; i += step) xTicks.push({ x: xS(i), label: dates[i].slice(0, 7) });

    const yTicks = Array.from({ length: 5 }, (_, k) => {
      const v = yLo + (k / 4) * (yHi - yLo);
      return { y: yS(v), label: v.toFixed(1) };
    });

    const stats = series.map(s => {
      const vals = dates.map(d => s.map[d]).filter(v => v != null);
      return {
        key: s.key,
        min: vals.length ? Math.min(...vals).toFixed(2) : null,
        max: vals.length ? Math.max(...vals).toFixed(2) : null,
      };
    });

    return { dates, series, polylines, xTicks, yTicks, xS, yS, stats };
  }, [aligned, allDates, effectiveWindow]);

  const us10y   = bondYields?.find(b => b.name === 'US 10Y')?.rate;
  const bund10y = bondYields?.find(b => b.name === 'Bund 10Y')?.rate;
  const oat10y  = bondYields?.find(b => b.name === 'OAT 10Y')?.rate;
  const spreadUsDe = us10y != null && bund10y != null ? (us10y - bund10y).toFixed(2) : null;
  const spreadFrDe = oat10y != null && bund10y != null ? (oat10y - bund10y).toFixed(2) : null;

  const hoverX    = hoverIdx != null && computed ? computed.xS(hoverIdx) : null;
  const hoverDate = hoverIdx != null ? computed?.dates[hoverIdx] : null;
  const hoverVals = hoverIdx != null && computed ? computed.series.map(s => ({
    label: s.label, color: s.color,
    value: s.map[computed.dates[hoverIdx]],
  })) : null;

  return (
    <div style={{
      backgroundColor: 'var(--bg2)', borderRadius: '10px',
      border: '1px solid var(--border)', padding: '16px 20px',
    }}>
      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🌍</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '14px' }}>
                Baromètre de Confiance — Dettes Souveraines 10 ans
              </span>
              {spreadUsDe && (
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '10px', fontWeight: '600',
                  backgroundColor: '#2962FF15', color: '#2962FF', border: '1px solid #2962FF44',
                }}>US–DE : +{spreadUsDe}%</span>
              )}
              {spreadFrDe && (
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '10px', fontWeight: '600',
                  backgroundColor: '#26a69a15', color: '#26a69a', border: '1px solid #26a69a44',
                }}>FR–DE : +{spreadFrDe}%</span>
              )}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
              Rendements obligataires à 10 ans · USD, EUR
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

      {/* ── Info rétractable ── */}
      {showInfo && (
        <div style={{
          backgroundColor: 'var(--bg3)', borderRadius: '8px', padding: '14px 16px',
          marginBottom: '14px', borderLeft: '3px solid #f59e0b',
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.7',
        }}>
          <div style={{ color: 'var(--text2)', fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}>
            Que mesurent les taux souverains à 10 ans ?
          </div>
          <p style={{ margin: '0 0 10px' }}>
            Le taux à 10 ans d'un État reflète simultanément la <strong style={{ color: 'var(--text2)' }}>confiance
            dans sa solvabilité</strong> et les <strong style={{ color: 'var(--text2)' }}>anticipations
            d'inflation</strong>. Un taux qui monte peut signaler une économie dynamique… ou une dette jugée risquée.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ backgroundColor: '#2962FF0D', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2962FF33' }}>
              <div style={{ color: '#2962FF', fontWeight: '700', marginBottom: '4px' }}>Spread US–Allemagne</div>
              <div>Mesure l'attractivité relative des Treasuries vs Bunds. Un spread élevé signale que les capitaux
              préfèrent les actifs américains → dollar fort, financement européen plus coûteux.</div>
            </div>
            <div style={{ backgroundColor: '#26a69a0D', borderRadius: '6px', padding: '10px 12px', border: '1px solid #26a69a33' }}>
              <div style={{ color: '#26a69a', fontWeight: '700', marginBottom: '4px' }}>Spread France–Allemagne</div>
              <div>Le Bund est la référence sans risque en Europe. L'écart OAT–Bund mesure le risque politique
              français — il s'écarte lors des crises budgétaires ou politiques.</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <span style={{ color: 'var(--text2)', fontWeight: '600' }}>Source · </span>
            Données FRED (St. Louis Fed) — séries IRLTLT01*M156N (OCDE), actualisées mensuellement.
          </div>
        </div>
      )}

      {/* ── Légende + contrôles ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {SERIES.map(s => {
            const currentRate = s.key === 'us10y' ? us10y : s.key === 'bund10y' ? bund10y : oat10y;
            const stat = computed?.stats?.find(st => st.key === s.key);
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                <span style={{ width: '20px', height: '2px', backgroundColor: s.color, display: 'inline-block', borderRadius: '1px' }} />
                {s.label}
                {currentRate != null && <strong style={{ color: s.color }}>{currentRate.toFixed(2)}%</strong>}
                {stat?.min && (
                  <span style={{ color: 'var(--text3)', fontSize: '10px' }}>({stat.min}–{stat.max})</span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {!isFullView && (
            <button onClick={() => { setViewWindow(null); setRange('Max'); }} style={{
              background: '#ef535022', border: '1px solid #ef535044', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px', color: '#ef5350', cursor: 'pointer', marginRight: '4px',
            }}>↺ Reset</button>
          )}
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              background: range === r ? 'var(--text3)' : 'none',
              border: '1px solid var(--border)', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px',
              color: range === r ? 'var(--bg0)' : 'var(--text3)',
              cursor: 'pointer',
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'right', marginBottom: '4px', fontStyle: 'italic' }}>
        scroll pour zoomer
      </div>

      {loading && <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>Chargement…</div>}
      {error   && <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>}

      {!loading && !error && computed && (
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ display: 'block', cursor: 'crosshair' }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
              const rawI = ((svgX - ML) / PW) * (computed.dates.length - 1);
              setHoverIdx(Math.max(0, Math.min(computed.dates.length - 1, Math.round(rawI))));
            }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {computed.yTicks.map(({ y, label }) => (
              <g key={label}>
                <line x1={ML} y1={y} x2={SVG_W - MR} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
                <text x={ML - 6} y={y + 4} textAnchor="end" fill="var(--text3)" fontSize="10">{label}%</text>
              </g>
            ))}
            {computed.xTicks.map(({ x, label }) => (
              <text key={label} x={x} y={SVG_H - 4} textAnchor="middle" fill="var(--text3)" fontSize="9">{label}</text>
            ))}

            {computed.series[0] && computed.series[1] && (() => {
              const us   = computed.series[0];
              const bund = computed.series[1];
              const topPts = computed.dates.map((d, i) => {
                const v = us.map[d]; return v != null ? `${computed.xS(i).toFixed(1)},${computed.yS(v).toFixed(1)}` : null;
              }).filter(Boolean);
              const botPts = [...computed.dates].reverse().map((d, ri) => {
                const i = computed.dates.length - 1 - ri;
                const v = bund.map[d]; return v != null ? `${computed.xS(i).toFixed(1)},${computed.yS(v).toFixed(1)}` : null;
              }).filter(Boolean);
              return <polygon points={[...topPts, ...botPts].join(' ')} fill="#2962FF0D" stroke="none" />;
            })()}

            {computed.polylines.map(s => (
              <polyline key={s.key} points={s.points} fill="none"
                stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" />
            ))}

            {hoverX != null && (
              <line x1={hoverX} y1={MT} x2={hoverX} y2={SVG_H - MB} stroke="var(--text3)" strokeWidth="1" strokeDasharray="3,2" />
            )}
          </svg>

          {hoverVals && hoverDate && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '11px',
              pointerEvents: 'none',
            }}>
              <div style={{ color: 'var(--text3)', marginBottom: '4px', fontWeight: '600' }}>{hoverDate}</div>
              {hoverVals.map(v => v.value != null && (
                <div key={v.label} style={{ color: v.color, fontVariantNumeric: 'tabular-nums' }}>
                  {v.label} : <strong>{v.value.toFixed(2)}%</strong>
                </div>
              ))}
              {(() => {
                const usVal = hoverVals.find(v => v.label === 'US 10Y')?.value;
                const deVal = hoverVals.find(v => v.label === 'Bund 10Y')?.value;
                const frVal = hoverVals.find(v => v.label === 'OAT 10Y')?.value;
                const sUsDe = usVal != null && deVal != null ? (usVal - deVal).toFixed(2) : null;
                const sFrDe = frVal != null && deVal != null ? (frVal - deVal).toFixed(2) : null;
                return (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                    {sUsDe && <div style={{ color: '#2962FF', fontSize: '10px' }}>US–DE : +{sUsDe}%</div>}
                    {sFrDe && <div style={{ color: '#26a69a', fontSize: '10px' }}>FR–DE : +{sFrDe}%</div>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
