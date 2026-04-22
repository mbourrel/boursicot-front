import { useMemo, useState, useRef, useEffect, useCallback } from 'react';

const ML = 46, MR = 20, MT = 20, MB = 36;
const SVG_W = 780, SVG_H = 240;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

const SERIES = [
  { key: 'us2y',    label: 'US 2Y',    color: '#e91e63' },
  { key: 'us10y',   label: 'US 10Y',   color: '#2962FF' },
  { key: 'us30y',   label: 'US 30Y',   color: '#9c27b0' },
  { key: 'bund10y', label: 'Bund 10Y', color: '#f59e0b' },
  { key: 'oat10y',  label: 'OAT 10Y',  color: '#26a69a' },
  { key: 'gilt10y', label: 'Gilt 10Y', color: '#ef5350' },
];

const SERIES_DEFINITIONS = {
  us2y:    { title: 'US 2Y — Treasury américain 2 ans', desc: 'Très sensible aux décisions de la Fed. Monte quand les marchés anticipent des hausses de taux, baisse quand ils anticipent des baisses. Baromètre de la politique monétaire à court terme.' },
  us10y:   { title: 'US 10Y — Treasury américain 10 ans', desc: 'Référence mondiale du coût de l\'argent à long terme. Influence les taux hypothécaires, le crédit corporate et la valorisation des actions (taux d\'actualisation). Un US 10Y élevé pèse sur les marchés actions.' },
  us30y:   { title: 'US 30Y — Treasury américain 30 ans', desc: 'Reflète les anticipations d\'inflation et de croissance sur très long terme. Moins réactif que le 2Y. Très suivi par les fonds de pension et assureurs qui gèrent des passifs longs.' },
  bund10y: { title: 'Bund 10Y — Obligation allemande 10 ans', desc: 'Référence sans risque de la zone euro. L\'Allemagne étant la première économie de la zone, son taux sert de plancher pour tous les spreads souverains européens. Un Bund qui monte signale une remontée des taux en Europe.' },
  oat10y:  { title: 'OAT 10Y — Obligation française 10 ans', desc: 'Le spread OAT–Bund mesure la prime de risque française. Il s\'écarte lors des crises politiques ou budgétaires (dissolution, dégradation de note). Indicateur clé de la confiance des marchés envers la France.' },
  gilt10y: { title: 'Gilt 10Y — Obligation britannique 10 ans', desc: 'Taux souverain du Royaume-Uni post-Brexit. Reflète à la fois la politique de la BoE et les risques spécifiques britanniques (inflation structurelle, déficit courant). L\'épisode Truss (2022) a illustré sa sensibilité aux chocs budgétaires.' },
};

const RANGES = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', 'Max'];

function niceXTicks(dates, xS) {
  if (dates.length < 2) return [];
  const start = new Date(dates[0]);
  const end   = new Date(dates[dates.length - 1]);
  const days  = Math.max(1, (end - start) / 86400000);

  const tickDates = [];

  if (days <= 90) {
    const cur = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    for (; cur <= end; cur.setMonth(cur.getMonth() + 1))
      tickDates.push(cur.toISOString().slice(0, 7));
  } else if (days <= 2 * 365) {
    const cur = new Date(start.getFullYear(), Math.ceil(start.getMonth() / 3) * 3, 1);
    for (; cur <= end; cur.setMonth(cur.getMonth() + 3))
      tickDates.push(cur.toISOString().slice(0, 7));
  } else if (days <= 5 * 365) {
    for (let y = start.getFullYear() + 1; y <= end.getFullYear(); y++)
      tickDates.push(`${y}`);
  } else if (days <= 15 * 365) {
    const s = Math.ceil((start.getFullYear() + 1) / 2) * 2;
    for (let y = s; y <= end.getFullYear(); y += 2)
      tickDates.push(`${y}`);
  } else if (days <= 40 * 365) {
    const s = Math.ceil((start.getFullYear() + 1) / 5) * 5;
    for (let y = s; y <= end.getFullYear(); y += 5)
      tickDates.push(`${y}`);
  } else {
    const s = Math.ceil((start.getFullYear() + 1) / 10) * 10;
    for (let y = s; y <= end.getFullYear(); y += 10)
      tickDates.push(`${y}`);
  }

  const mapped = tickDates.map(td => {
    const idx = dates.findIndex(d => d >= td);
    if (idx === -1) return null;
    const label = td.length <= 4 ? td : td.slice(0, 7);
    return { x: xS(idx), label };
  }).filter(Boolean);

  // Filtre anti-chevauchement garanti
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
  const [showInfo,     setShowInfo]     = useState(false);
  const [hoverIdx,     setHoverIdx]     = useState(null);
  const [range,        setRange]        = useState('Max');
  const [visibleKeys,  setVisibleKeys]  = useState(() => new Set(SERIES.map(s => s.key)));
  const svgRef = useRef(null);

  const toggleSeries = (key) => setVisibleKeys(prev => {
    const next = new Set(prev);
    if (next.has(key)) { if (next.size > 1) next.delete(key); }
    else next.add(key);
    return next;
  });

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
      const newLen = Math.min(total, Math.max(6, Math.round(len * factor))); // min 6 mois (données mensuelles)
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
    const series = aligned.series.filter(s => visibleKeys.has(s.key));
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

    const xTicks = niceXTicks(dates, xS);

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
  }, [aligned, allDates, effectiveWindow, visibleKeys]);

  const rateByKey = useMemo(() => {
    const map = { us2y: 'US 2Y', us10y: 'US 10Y', us30y: 'US 30Y', bund10y: 'Bund 10Y', oat10y: 'OAT 10Y' };
    const out = {};
    SERIES.forEach(s => { out[s.key] = bondYields?.find(b => b.name === map[s.key])?.rate ?? null; });
    return out;
  }, [bondYields]);
  const { us10y, bund10y, oat10y } = rateByKey;
  const spreadUsDe = us10y != null && bund10y != null ? (us10y - bund10y).toFixed(2) : null;
  const spreadFrDe = oat10y != null && bund10y != null ? (oat10y - bund10y).toFixed(2) : null;

  const hoverX    = hoverIdx != null && computed ? computed.xS(hoverIdx) : null;
  const hoverDate = hoverIdx != null ? computed?.dates[hoverIdx] : null;
  const hoverVals = hoverIdx != null && computed
    ? computed.series.map(s => ({ label: s.label, color: s.color, value: s.map[computed.dates[hoverIdx]] }))
    : null;

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
          <div style={{ color: 'var(--text2)', fontWeight: '700', marginBottom: '12px', fontSize: '13px' }}>
            Définition de chaque série
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {SERIES.map(s => {
              const def = SERIES_DEFINITIONS[s.key];
              return (
                <div key={s.key} style={{
                  backgroundColor: 'var(--bg2)', borderRadius: '6px', padding: '10px 12px',
                  border: `1px solid ${s.color}44`,
                }}>
                  <div style={{ color: s.color, fontWeight: '700', marginBottom: '5px', fontSize: '11px' }}>
                    {def.title}
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.6' }}>{def.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--text2)', fontWeight: '600' }}>Source · </span>
            FRED (St. Louis Fed) — DGS2/10/30 (quotidien), IRLTLT01*M156N OCDE (mensuel).
          </div>
        </div>
      )}

      {/* ── Légende toggleable + contrôles ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SERIES.map(s => {
            const active = visibleKeys.has(s.key);
            const currentRate = rateByKey[s.key];
            const stat = computed?.stats?.find(st => st.key === s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  border: `1px solid ${active ? s.color : 'var(--border)'}`,
                  backgroundColor: active ? `${s.color}18` : 'transparent',
                  opacity: active ? 1 : 0.45,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ width: '16px', height: '2px', backgroundColor: s.color, display: 'inline-block', borderRadius: '1px' }} />
                <span style={{ fontSize: '11px', color: active ? s.color : 'var(--text3)', fontWeight: '600' }}>{s.label}</span>
                {currentRate != null && (
                  <span style={{ fontSize: '11px', color: active ? s.color : 'var(--text3)' }}>{currentRate.toFixed(2)}%</span>
                )}
                {stat?.min && active && (
                  <span style={{ color: 'var(--text3)', fontSize: '10px' }}>({stat.min}–{stat.max})</span>
                )}
              </button>
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
