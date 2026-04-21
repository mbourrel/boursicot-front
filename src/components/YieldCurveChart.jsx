import { useMemo, useState } from 'react';

const ML = 46, MR = 20, MT = 20, MB = 36;
const SVG_W = 780, SVG_H = 220;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

// ── Snapshot instantané de la courbe (maturités → taux courants) ─────────────
function CurveSnapshot({ bondYields }) {
  const MATURITIES = ['US 2Y', 'US 10Y', 'US 30Y'];
  const points = MATURITIES.map(name => bondYields?.find(b => b.name === name)).filter(Boolean);
  if (points.length < 2) return null;

  const rates   = points.map(p => p.rate ?? 0);
  const minRate = Math.min(...rates) - 0.3;
  const maxRate = Math.max(...rates) + 0.3;
  const W = 320, H = 100, ml = 30, mb = 24;
  const pw = W - ml - 10, ph = H - mb - 10;

  const xS = i  => ml + (i / (points.length - 1)) * pw;
  const yS = v  => 10 + ph - ((v - minRate) / (maxRate - minRate)) * ph;

  const polyline = points.map((p, i) => `${xS(i).toFixed(1)},${yS(p.rate ?? 0).toFixed(1)}`).join(' ');
  const isInverted = (points[0]?.rate ?? 0) > (points[1]?.rate ?? 0);

  return (
    <div style={{ flex: '0 0 auto' }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', textAlign: 'center' }}>
        Courbe actuelle (snapshot)
      </div>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        {/* grille horizontale */}
        {[minRate, (minRate + maxRate) / 2, maxRate].map((v, i) => (
          <g key={i}>
            <line x1={ml} y1={yS(v)} x2={W - 10} y2={yS(v)} stroke="var(--border)" strokeDasharray="3,3" />
            <text x={ml - 4} y={yS(v) + 4} textAnchor="end" fill="var(--text3)" fontSize="9">{v.toFixed(1)}%</text>
          </g>
        ))}
        {/* zone de remplissage */}
        <polyline
          points={`${xS(0).toFixed(1)},${(10 + ph).toFixed(1)} ${polyline} ${xS(points.length - 1).toFixed(1)},${(10 + ph).toFixed(1)}`}
          fill={isInverted ? '#ef535018' : '#2962FF18'} stroke="none"
        />
        {/* ligne */}
        <polyline points={polyline} fill="none" stroke={isInverted ? '#ef5350' : '#2962FF'} strokeWidth="2" strokeLinejoin="round" />
        {/* points + labels */}
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
function SpreadHistory({ dates, values }) {
  const computed = useMemo(() => {
    if (!dates?.length || !values?.length) return null;
    const yLo = Math.min(...values) - 0.2;
    const yHi = Math.max(...values) + 0.2;
    const xS = i => ML + (i / (dates.length - 1)) * PW;
    const yS = v => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;
    const y0 = yS(0);

    const polyline = values.map((v, i) => `${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ');
    const areaBelow = `${xS(0)},${y0} ` + values.map((v, i) => `${xS(i).toFixed(1)},${Math.max(yS(v), Math.min(y0, yS(yLo))).toFixed(1)}`).join(' ') + ` ${xS(dates.length - 1)},${y0}`;

    const step = Math.max(1, Math.floor(dates.length / 8));
    const xTicks = [];
    for (let i = 0; i < dates.length; i += step) xTicks.push({ x: xS(i), label: dates[i].slice(0, 7) });

    const yRange = yHi - yLo;
    const yTicks = Array.from({ length: 5 }, (_, k) => {
      const v = yLo + (k / 4) * yRange;
      return { y: yS(v), label: v.toFixed(1) };
    });

    return { polyline, areaBelow, y0, xTicks, yTicks, yS, xS };
  }, [dates, values]);

  if (!computed) return null;
  const { polyline, areaBelow, y0, xTicks, yTicks } = computed;

  return (
    <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
      {/* grille */}
      {yTicks.map(({ y, label }) => (
        <g key={label}>
          <line x1={ML} y1={y} x2={SVG_W - MR} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
          <text x={ML - 6} y={y + 4} textAnchor="end" fill="var(--text3)" fontSize="10">{label}%</text>
        </g>
      ))}
      {/* axe X labels */}
      {xTicks.map(({ x, label }) => (
        <text key={label} x={x} y={SVG_H - 4} textAnchor="middle" fill="var(--text3)" fontSize="9">{label}</text>
      ))}
      {/* zone rouge (inversion, spread < 0) */}
      <clipPath id="below-zero">
        <rect x={ML} y={y0} width={PW} height={SVG_H - MB - y0 + MT} />
      </clipPath>
      <polyline points={`${ML},${y0} ${polyline} ${ML + PW},${y0}`} fill="#ef535020" stroke="none" clipPath="url(#below-zero)" />
      {/* ligne zéro */}
      <line x1={ML} y1={y0} x2={SVG_W - MR} y2={y0} stroke="#ef535060" strokeWidth="1" strokeDasharray="4,3" />
      <text x={ML - 6} y={y0 + 4} textAnchor="end" fill="#ef535099" fontSize="9">0%</text>
      {/* ligne spread */}
      <polyline points={polyline} fill="none" stroke="#2962FF" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function YieldCurveChart({ yieldCurve, bondYields, loading, error }) {
  const [showInfo, setShowInfo] = useState(false);

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
          marginBottom: '14px', borderLeft: `3px solid ${isInverted ? '#ef5350' : '#2962FF'}`,
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.6',
        }}>
          Normalement, prêter son argent sur <strong>10 ans</strong> rapporte plus que sur <strong>2 ans</strong> (risque plus élevé = meilleure rémunération).
          Quand l'inverse se produit — la courbe s'<strong style={{ color: '#ef5350' }}>inverse</strong> — les investisseurs
          anticipent une dégradation économique à court terme. Ce signal a précédé chacune des 8 dernières récessions américaines.
        </div>
      )}

      {loading && <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>Chargement…</div>}
      {error   && <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>
              Historique spread 10Y–2Y
              <span style={{ marginLeft: '8px', color: '#ef535099', fontSize: '10px' }}>zone rouge = inversion</span>
            </div>
            <SpreadHistory dates={yieldCurve?.dates} values={yieldCurve?.values} />
          </div>
          <CurveSnapshot bondYields={bondYields} />
        </div>
      )}
    </div>
  );
}
