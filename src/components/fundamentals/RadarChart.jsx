import { memo } from 'react';
import { ASSET_COLORS } from '../CompareBar';

function RadarChart({ allSymbols, dataMap }) {
  const size      = 280;
  const cx        = size / 2;
  const cy        = size / 2;
  const maxRadius = 88;
  const labelGap  = 20;
  const axes      = ['health', 'valuation', 'growth', 'efficiency', 'dividend', 'momentum'];
  const axisLabels= ['Santé', 'Valorisation', 'Croissance', 'Efficacité', 'Dividende', 'Momentum'];
  const angles    = axes.map((_, i) => ((i * 60 - 90) * Math.PI) / 180);

  const pt = (angle, value) => ({
    x: cx + ((value / 10) * maxRadius) * Math.cos(angle),
    y: cy + ((value / 10) * maxRadius) * Math.sin(angle),
  });

  const anchor = (a) => {
    const deg = (a * 180 / Math.PI + 360) % 360;
    if (deg < 30 || deg > 330) return 'middle';
    if (deg < 150) return 'start';
    if (deg < 210) return 'middle';
    return 'end';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
      {/* Grilles */}
      {[0.25, 0.5, 0.75, 1].map(level => (
        <polygon key={level}
          points={angles.map(a => `${cx + level * maxRadius * Math.cos(a)},${cy + level * maxRadius * Math.sin(a)}`).join(' ')}
          fill="none" stroke="var(--border)" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + maxRadius * Math.cos(a)} y2={cy + maxRadius * Math.sin(a)}
          stroke="var(--border)" strokeWidth="1"
        />
      ))}
      {/* Libellés */}
      {angles.map((a, i) => {
        const r = maxRadius + labelGap;
        return (
          <text key={i}
            x={cx + r * Math.cos(a)} y={cy + r * Math.sin(a)}
            textAnchor={anchor(a)} dominantBaseline="middle"
            fill="var(--text3)" fontSize="9" fontFamily="sans-serif"
          >
            {axisLabels[i]}
          </text>
        );
      })}
      {/* Polygones par entreprise */}
      {allSymbols.map((sym, si) => {
        const s = dataMap[sym]?.scores;
        if (!s) return null;
        const vals   = [s.health, s.valuation, s.growth, s.efficiency ?? 5, s.dividend ?? 5, s.momentum ?? 5];
        const points = angles.map((a, i) => pt(a, vals[i]));
        const pStr   = points.map(p => `${p.x},${p.y}`).join(' ');
        const clr    = ASSET_COLORS[si];
        return (
          <g key={sym}>
            <polygon points={pStr} fill={clr + '28'} stroke={clr} strokeWidth="1.5" strokeLinejoin="round" />
            {points.map((p, pi) => <circle key={pi} cx={p.x} cy={p.y} r="3" fill={clr} />)}
          </g>
        );
      })}
    </svg>
  );
}

export default memo(RadarChart);
