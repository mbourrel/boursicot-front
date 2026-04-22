import { useMemo, useState } from 'react';

const ML = 46, MR = 20, MT = 20, MB = 36;
const SVG_W = 780, SVG_H = 220;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

const RANGES = ['3M', '6M', '1Y', '2Y', '5Y', '10Y'];

function cutoffForRange(range) {
  const d = new Date();
  if (range === '3M')  d.setMonth(d.getMonth() - 3);
  else if (range === '6M')  d.setMonth(d.getMonth() - 6);
  else if (range === '1Y')  d.setFullYear(d.getFullYear() - 1);
  else if (range === '2Y')  d.setFullYear(d.getFullYear() - 2);
  else if (range === '5Y')  d.setFullYear(d.getFullYear() - 5);
  else return null; // 10Y = tout
  return d.toISOString().slice(0, 10);
}

// ── Snapshot instantané de la courbe ─────────────────────────────────────────
function CurveSnapshot({ bondYields }) {
  const MATURITIES = ['US 2Y', 'US 10Y', 'US 30Y'];
  const points = MATURITIES.map(name => bondYields?.find(b => b.name === name)).filter(Boolean);
  if (points.length < 2) return null;

  const rates   = points.map(p => p.rate ?? 0);
  const minRate = Math.min(...rates) - 0.3;
  const maxRate = Math.max(...rates) + 0.3;
  const W = 300, H = 110, ml = 30, mb = 24;
  const pw = W - ml - 10, ph = H - mb - 10;

  const xS = i  => ml + (i / (points.length - 1)) * pw;
  const yS = v  => 10 + ph - ((v - minRate) / (maxRate - minRate)) * ph;

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

// ── Historique du spread 10Y–2Y ───────────────────────────────────────────────
function SpreadHistory({ dates, values, range, onRangeChange }) {
  const filtered = useMemo(() => {
    if (!dates?.length || !values?.length) return null;
    const cutoff = cutoffForRange(range);
    if (!cutoff) return { dates, values };
    const startIdx = dates.findIndex(d => d >= cutoff);
    if (startIdx === -1) return { dates, values };
    return { dates: dates.slice(startIdx), values: values.slice(startIdx) };
  }, [dates, values, range]);

  const computed = useMemo(() => {
    if (!filtered) return null;
    const { dates: fd, values: fv } = filtered;
    if (!fd.length) return null;

    const yLo = Math.min(...fv) - 0.2;
    const yHi = Math.max(...fv) + 0.2;
    const xS = i => ML + (i / (fd.length - 1)) * PW;
    const yS = v => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;
    const y0 = yS(0);

    const polyline = fv.map((v, i) => `${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ');

    const step = Math.max(1, Math.floor(fd.length / 8));
    const xTicks = [];
    for (let i = 0; i < fd.length; i += step) xTicks.push({ x: xS(i), label: fd[i].slice(0, 7) });

    const yTicks = Array.from({ length: 5 }, (_, k) => {
      const v = yLo + (k / 4) * (yHi - yLo);
      return { y: yS(v), label: v.toFixed(1) };
    });

    const minVal = Math.min(...fv).toFixed(2);
    const maxVal = Math.max(...fv).toFixed(2);
    const inversionDays = fv.filter(v => v < 0).length;

    return { fd, fv, polyline, y0, xTicks, yTicks, yS, xS, minVal, maxVal, inversionDays };
  }, [filtered]);

  if (!computed) return null;
  const { polyline, y0, xTicks, yTicks, minVal, maxVal, inversionDays } = computed;

  return (
    <div>
      {/* ── Contrôles range + stats ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
          Historique spread 10Y–2Y
          <span style={{ marginLeft: '8px', color: '#ef535099', fontSize: '10px' }}>zone rouge = inversion</span>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
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

      {/* ── Mini stats ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
        {[
          { label: 'Min période', value: `${minVal}%`, color: parseFloat(minVal) < 0 ? '#ef5350' : 'var(--text2)' },
          { label: 'Max période', value: `${maxVal}%`, color: 'var(--text2)' },
          { label: 'Jours en inversion', value: inversionDays > 0 ? `${inversionDays}` : '0', color: inversionDays > 0 ? '#ef5350' : '#26a69a' },
        ].map(s => (
          <div key={s.label} style={{ fontSize: '10px', color: 'var(--text3)' }}>
            {s.label} : <span style={{ color: s.color, fontWeight: '600' }}>{s.value}</span>
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
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
  const [range,    setRange]    = useState('10Y');

  const currentSpread = yieldCurve?.values?.at(-1) ?? null;
  const isInverted    = currentSpread !== null && currentSpread < 0;

  return (
    <div style={{
      backgroundColor: 'var(--bg2)', borderRadius: '10px',
      border: '1px solid var(--border)', padding: '16px 20px',
    }}>
      {/* ── En-tête ── */}
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

      {/* ── Info rétractable ── */}
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
            Normalement, prêter son argent sur <strong style={{ color: 'var(--text2)' }}>10 ans</strong> rapporte
            plus que sur <strong style={{ color: 'var(--text2)' }}>2 ans</strong> — plus c'est long, plus
            c'est risqué, donc mieux rémunéré. Quand la courbe <strong style={{ color: '#ef5350' }}>s'inverse</strong> (10Y &lt; 2Y),
            les investisseurs acceptent moins pour le long terme parce qu'ils anticipent une récession
            et une baisse des taux à venir.
          </p>

          <div style={{ backgroundColor: 'var(--bg2)', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
            <div style={{ color: 'var(--text2)', fontWeight: '600', marginBottom: '6px', fontSize: '11px' }}>
              Précédents historiques — 8 récessions sur 8 anticipées :
            </div>
            {[
              ['1978', 'Inversion → récession 1980 (choc pétrolier + hausse des taux Volcker)'],
              ['1988', 'Inversion → récession 1990–91 (guerre du Golfe)'],
              ['1998', 'Inversion → récession 2001 (éclatement bulle internet)'],
              ['2006', 'Inversion → récession 2008 (crise des subprimes)'],
              ['2019', 'Inversion → récession 2020 (COVID — bien qu\'exogène)'],
              ['2022–23', 'Inversion prolongée → à surveiller sur 12–24 mois'],
            ].map(([year, desc]) => (
              <div key={year} style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '3px' }}>
                <span style={{ color: '#ef5350', fontWeight: '600', minWidth: '52px' }}>{year}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <span style={{ color: '#f59e0b', fontWeight: '600' }}>⚠ Points d'attention · </span>
            L'inversion n'est pas une récession immédiate — le délai moyen est de <strong style={{ color: 'var(--text2)' }}>12 à 24 mois</strong>.
            Paradoxalement, la <em>normalisation</em> (retour &gt; 0%) peut signaler l'imminence d'une
            récession plutôt que sa fin — les investisseurs rapatrient leur capital en anticipant
            la première baisse de taux de la Fed.
          </div>
        </div>
      )}

      {loading && <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>Chargement…</div>}
      {error   && <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SpreadHistory
              dates={yieldCurve?.dates}
              values={yieldCurve?.values}
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
