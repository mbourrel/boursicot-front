import React, { useMemo } from 'react';

// ── Géométrie de la jauge ──────────────────────────────────────────────────
const CX = 160, CY = 190;
const OUTER_R = 145, INNER_R = 82;

// 4 quadrants : chacun couvre 45° de l'arc semi-circulaire (0° = droite, 180° = gauche)
const PHASES = [
  { id: 'Contraction', color: '#ef5350', start: 0,   end: 45,  needle: 22.5  },
  { id: 'Surchauffe',  color: '#ff9800', start: 45,  end: 90,  needle: 67.5  },
  { id: 'Expansion',   color: '#26a69a', start: 90,  end: 135, needle: 112.5 },
  { id: 'Récession',   color: '#2962FF', start: 135, end: 180, needle: 157.5 },
];

const toRad = (d) => (d * Math.PI) / 180;

// Retourne le path SVG d'un anneau de arc (secteur entre inner et outer radius)
const arcPath = (cx, cy, outerR, innerR, startDeg, endDeg) => {
  const os = { x: cx + outerR * Math.cos(toRad(startDeg)), y: cy - outerR * Math.sin(toRad(startDeg)) };
  const oe = { x: cx + outerR * Math.cos(toRad(endDeg)),   y: cy - outerR * Math.sin(toRad(endDeg)) };
  const is = { x: cx + innerR * Math.cos(toRad(startDeg)), y: cy - innerR * Math.sin(toRad(startDeg)) };
  const ie = { x: cx + innerR * Math.cos(toRad(endDeg)),   y: cy - innerR * Math.sin(toRad(endDeg)) };
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${os.x.toFixed(2)} ${os.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)}`,
    `L ${ie.x.toFixed(2)} ${ie.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${is.x.toFixed(2)} ${is.y.toFixed(2)}`,
    'Z',
  ].join(' ');
};

const PHASE_COLORS = {
  Expansion:   '#26a69a',
  Surchauffe:  '#ff9800',
  Contraction: '#ef5350',
  Récession:   '#2962FF',
};

function EconomicClock({ phase, growth_yoy, inflation_yoy, growth_trend, inflation_trend, loading, error }) {
  const activePhase = PHASES.find((p) => p.id === phase);
  const needleAngle = activePhase?.needle ?? 112.5; // défaut : Expansion
  // Conversion : math (0°=droite, 90°=haut) → CSS rotate (0°=haut, +CW)
  const cssRotation = 90 - needleAngle;

  // Positions des labels au centre de chaque quadrant
  const labelPositions = useMemo(() => {
    const r = (OUTER_R + INNER_R) / 2;
    return PHASES.map((p) => {
      const mid = (p.start + p.end) / 2;
      return { ...p, lx: CX + r * Math.cos(toRad(mid)), ly: CY - r * Math.sin(toRad(mid)) };
    });
  }, []);

  const phaseColor = PHASE_COLORS[phase] ?? '#d1d4dc';

  if (loading) return <Placeholder>Chargement du cycle économique…</Placeholder>;
  if (error)   return <Placeholder color="#ef5350">{error}</Placeholder>;

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>HORLOGE ÉCONOMIQUE</h3>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

        {/* ── SVG Jauge ── */}
        <svg viewBox="0 0 320 200" style={{ width: '100%', maxWidth: '320px', overflow: 'visible' }}>

          {/* Secteurs colorés */}
          {PHASES.map((p) => (
            <path
              key={p.id}
              d={arcPath(CX, CY, OUTER_R, INNER_R, p.start, p.end)}
              fill={p.id === phase ? p.color : `${p.color}45`}
              stroke="#131722"
              strokeWidth="2"
              style={{ transition: 'fill 0.5s ease' }}
            />
          ))}

          {/* Labels des quadrants */}
          {labelPositions.map((p) => (
            <text
              key={p.id}
              x={p.lx.toFixed(1)}
              y={(p.ly + 4).toFixed(1)}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="sans-serif"
              fill={p.id === phase ? 'white' : '#8a919e'}
              style={{ transition: 'fill 0.5s ease', userSelect: 'none' }}
            >
              {p.id}
            </text>
          ))}

          {/* Aiguille (pivote via CSS transform autour du centre) */}
          <g
            style={{
              transform: `rotate(${cssRotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Corps de l'aiguille */}
            <line
              x1={CX} y1={CY + 12}
              x2={CX} y2={CY - Math.round(OUTER_R * 0.83)}
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Empennage */}
            <polygon
              points={`${CX},${CY + 14} ${CX - 5},${CY + 4} ${CX + 5},${CY + 4}`}
              fill="white"
              opacity="0.6"
            />
          </g>

          {/* Pivot central */}
          <circle cx={CX} cy={CY} r="7" fill="#1e222d" stroke="white" strokeWidth="2" />

          {/* Ligne de base */}
          <line
            x1={CX - OUTER_R - 6} y1={CY}
            x2={CX + OUTER_R + 6} y2={CY}
            stroke="#2B2B43" strokeWidth="1"
          />
        </svg>

        {/* ── Phase actuelle ── */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: phaseColor, transition: 'color 0.5s' }}>
            {phase ?? '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#8a919e', marginTop: '3px' }}>
            Phase de marché actuelle
          </div>
        </div>

        {/* ── Indicateurs YoY ── */}
        <div style={{ display: 'flex', gap: '32px', paddingTop: '8px', borderTop: '1px solid #2B2B43', width: '100%', justifyContent: 'center' }}>
          <YoYBlock
            label="Croissance (INDPRO)"
            value={growth_yoy}
            trend={growth_trend}
            positiveColor="#26a69a"
          />
          <div style={{ width: '1px', backgroundColor: '#2B2B43' }} />
          <YoYBlock
            label="Inflation (CPI)"
            value={inflation_yoy}
            trend={inflation_trend}
            positiveColor="#ef5350"
          />
        </div>
      </div>
    </div>
  );
}

function YoYBlock({ label, value, trend, positiveColor }) {
  const trendColor = trend === 'up' ? positiveColor : (positiveColor === '#ef5350' ? '#26a69a' : '#ef5350');
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: '#8a919e', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d1d4dc' }}>
        {value != null ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : '—'}
        {trend && (
          <span style={{ marginLeft: '5px', fontSize: '18px', color: trendColor }}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
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
  margin: '0 0 16px', color: '#d1d4dc', fontSize: '13px', fontWeight: 'bold',
  letterSpacing: '0.06em', borderBottom: '1px solid #2B2B43', paddingBottom: '10px',
};

export default EconomicClock;
