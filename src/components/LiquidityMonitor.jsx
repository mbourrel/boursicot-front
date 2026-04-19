import React, { useMemo } from 'react';

const ML = 54, MR = 20, MT = 20, MB = 38; // marges SVG
const SVG_W = 780, SVG_H = 300;
const PW = SVG_W - ML - MR; // largeur zone de tracé
const PH = SVG_H - MT - MB; // hauteur zone de tracé

function LiquidityMonitor({ dates, m2_normalized, btc_normalized, loading, error }) {
  const computed = useMemo(() => {
    if (!dates || dates.length < 2 || !m2_normalized || !btc_normalized) return null;

    const allVals = [...m2_normalized, ...btc_normalized].filter((v) => v != null && isFinite(v));
    if (allVals.length === 0) return null;

    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const pad = (rawMax - rawMin) * 0.08 || 10;
    const yLo = rawMin - pad;
    const yHi = rawMax + pad;

    const xS = (i) => ML + (i / (dates.length - 1)) * PW;
    const yS = (v) => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;

    const toPolyline = (values) =>
      values.map((v, i) => `${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ');

    // Repères X : ~10 étiquettes régulièrement espacées
    const step = Math.max(1, Math.floor(dates.length / 10));
    const xTicks = [];
    for (let i = 0; i < dates.length; i += step) {
      xTicks.push({ x: xS(i), label: dates[i].slice(0, 7) }); // YYYY-MM
    }

    // Repères Y : 5 paliers
    const yTicks = Array.from({ length: 6 }, (_, k) => {
      const v = yLo + (k / 5) * (yHi - yLo);
      return { y: yS(v), label: v.toFixed(0) };
    });

    return {
      m2Points:  toPolyline(m2_normalized),
      btcPoints: toPolyline(btc_normalized),
      refY:      yS(100),
      xTicks,
      yTicks,
    };
  }, [dates, m2_normalized, btc_normalized]);

  if (loading) return <Placeholder>Chargement des données de liquidité…</Placeholder>;
  if (error)   return <Placeholder color="#ef5350">{error}</Placeholder>;
  if (!computed) return <Placeholder>Données insuffisantes</Placeholder>;

  const { m2Points, btcPoints, refY, xTicks, yTicks } = computed;

  return (
    <div style={cardStyle}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={titleStyle}>LIQUIDITÉ GLOBALE — M2 USA vs BITCOIN</h3>
        <div style={{ display: 'flex', gap: '18px', fontSize: '12px', color: '#d1d4dc' }}>
          <span>
            <span style={{ color: '#60A5FA', fontWeight: 'bold', marginRight: '5px' }}>—</span>M2 USA
          </span>
          <span>
            <span style={{ color: '#F97316', fontWeight: 'bold', marginRight: '5px' }}>—</span>Bitcoin
          </span>
        </div>
      </div>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        {/* Grille horizontale + labels Y */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={ML} y1={t.y} x2={ML + PW} y2={t.y} stroke="#2B2B43" strokeWidth="1" />
            <text x={ML - 6} y={t.y + 4} textAnchor="end" fontSize="11" fill="#8a919e" fontFamily="sans-serif">
              {t.label}
            </text>
          </g>
        ))}

        {/* Ligne de référence base 100 */}
        <line
          x1={ML} y1={refY} x2={ML + PW} y2={refY}
          stroke="#758696" strokeWidth="1.5" strokeDasharray="7 4" opacity="0.8"
        />
        <text x={ML + PW + 4} y={refY + 4} fontSize="10" fill="#758696" fontFamily="sans-serif">
          100
        </text>

        {/* Grille verticale + labels X */}
        {xTicks.map((t, i) => (
          <g key={i}>
            <line x1={t.x} y1={MT} x2={t.x} y2={MT + PH} stroke="#2B2B43" strokeWidth="0.5" />
            <text x={t.x} y={MT + PH + 16} textAnchor="middle" fontSize="10" fill="#8a919e" fontFamily="sans-serif">
              {t.label}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="#2B2B43" strokeWidth="1" />
        <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="#2B2B43" strokeWidth="1" />

        {/* Label axe Y */}
        <text
          transform={`translate(13,${MT + PH / 2}) rotate(-90)`}
          textAnchor="middle" fontSize="10" fill="#8a919e" fontFamily="sans-serif"
        >
          Base 100 (janv. 2020)
        </text>

        {/* Courbe M2 */}
        <polyline
          points={m2Points}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Courbe BTC */}
        <polyline
          points={btcPoints}
          fill="none"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Placeholder({ children, color = '#8a919e' }) {
  return (
    <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
      <span style={{ color, fontSize: '13px' }}>{children}</span>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#131722', padding: '20px', borderRadius: '12px', border: '1px solid #2B2B43',
};
const titleStyle = {
  margin: 0, color: '#d1d4dc', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.06em',
};

export default LiquidityMonitor;
