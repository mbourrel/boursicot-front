import { useMemo, useState } from 'react';

const ML = 46, MR = 20, MT = 20, MB = 36;
const SVG_W = 780, SVG_H = 240;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

const SERIES = [
  { key: 'us10y',   label: 'US 10Y',   color: '#2962FF' },
  { key: 'bund10y', label: 'Bund 10Y', color: '#f59e0b' },
  { key: 'oat10y',  label: 'OAT 10Y',  color: '#26a69a' },
];

function alignSeries(history) {
  const sets = SERIES.map(s => history?.[s.key]).filter(Boolean);
  if (!sets.length) return null;

  // Index commun = union des dates
  const dateSet = new Set();
  sets.forEach(s => s.dates.forEach(d => dateSet.add(d)));
  const dates = [...dateSet].sort();

  const indexed = SERIES.map(s => {
    const map = {};
    history?.[s.key]?.dates.forEach((d, i) => { map[d] = history[s.key].values[i]; });
    return { ...s, map };
  });

  return { dates, series: indexed };
}

export default function SovereignSpreadsChart({ history, bondYields, loading, error }) {
  const [showInfo,   setShowInfo]   = useState(false);
  const [hoverIdx,   setHoverIdx]   = useState(null);

  const computed = useMemo(() => {
    const aligned = alignSeries(history);
    if (!aligned) return null;
    const { dates, series } = aligned;

    const allVals = series.flatMap(s => dates.map(d => s.map[d]).filter(v => v != null));
    if (!allVals.length) return null;

    const yLo = Math.min(...allVals) - 0.3;
    const yHi = Math.max(...allVals) + 0.3;
    const xS  = i => ML + (i / (dates.length - 1)) * PW;
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

    return { dates, series, polylines, xTicks, yTicks, xS, yS };
  }, [history]);

  // Spread courant US 10Y – Bund 10Y
  const us10y   = bondYields?.find(b => b.name === 'US 10Y')?.rate;
  const bund10y = bondYields?.find(b => b.name === 'Bund 10Y')?.rate;
  const spread  = us10y != null && bund10y != null ? (us10y - bund10y).toFixed(2) : null;

  const hoverX     = hoverIdx != null && computed ? computed.xS(hoverIdx) : null;
  const hoverDate  = hoverIdx != null ? computed?.dates[hoverIdx] : null;
  const hoverVals  = hoverIdx != null ? computed?.series.map(s => ({
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '14px' }}>
                Baromètre de Confiance — Dettes Souveraines 10 ans
              </span>
              {spread && (
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '10px', fontWeight: '600',
                  backgroundColor: '#2962FF15', color: '#2962FF', border: '1px solid #2962FF44',
                }}>
                  Spread US–DE : +{spread}%
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
              Rendements obligataires à 10 ans · USD, EUR · 2 ans d'historique
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text3)',
            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >?</button>
      </div>

      {/* ── Info rétractable ── */}
      {showInfo && (
        <div style={{
          backgroundColor: 'var(--bg3)', borderRadius: '6px', padding: '10px 14px',
          marginBottom: '14px', borderLeft: '3px solid #f59e0b',
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.6',
        }}>
          Le taux à <strong>10 ans</strong> reflète la confiance des marchés dans la capacité d'un État à rembourser
          ses dettes et les anticipations d'inflation futures. Un taux qui monte signale soit une économie dynamique,
          soit une dette jugée risquée. L'<strong>écart (spread) entre les États-Unis et l'Europe</strong> indique
          où les capitaux mondiaux se dirigent préférentiellement.
        </div>
      )}

      {/* ── Légende ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        {SERIES.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
            <span style={{ width: '20px', height: '2px', backgroundColor: s.color, display: 'inline-block', borderRadius: '1px' }} />
            {s.label}
            {s.key === 'us10y'   && us10y   != null && <strong style={{ color: s.color }}>{us10y.toFixed(2)}%</strong>}
            {s.key === 'bund10y' && bund10y  != null && <strong style={{ color: s.color }}>{bund10y.toFixed(2)}%</strong>}
            {s.key === 'oat10y'  && bondYields?.find(b => b.name === 'OAT 10Y')?.rate != null &&
              <strong style={{ color: s.color }}>{bondYields.find(b => b.name === 'OAT 10Y').rate.toFixed(2)}%</strong>}
          </div>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>Chargement…</div>}
      {error   && <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>}

      {!loading && !error && computed && (
        <div style={{ position: 'relative' }}>
          <svg
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
            {/* grille */}
            {computed.yTicks.map(({ y, label }) => (
              <g key={label}>
                <line x1={ML} y1={y} x2={SVG_W - MR} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
                <text x={ML - 6} y={y + 4} textAnchor="end" fill="var(--text3)" fontSize="10">{label}%</text>
              </g>
            ))}
            {computed.xTicks.map(({ x, label }) => (
              <text key={label} x={x} y={SVG_H - 4} textAnchor="middle" fill="var(--text3)" fontSize="9">{label}</text>
            ))}

            {/* zone spread US–Bund */}
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
              return (
                <polygon
                  points={[...topPts, ...botPts].join(' ')}
                  fill="#2962FF0D" stroke="none"
                />
              );
            })()}

            {/* lignes */}
            {computed.polylines.map(s => (
              <polyline key={s.key} points={s.points} fill="none"
                stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" />
            ))}

            {/* crosshair */}
            {hoverX != null && (
              <line x1={hoverX} y1={MT} x2={hoverX} y2={SVG_H - MB} stroke="var(--text3)" strokeWidth="1" strokeDasharray="3,2" />
            )}
          </svg>

          {/* Tooltip hover */}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
