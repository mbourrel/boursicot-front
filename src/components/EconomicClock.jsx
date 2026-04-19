import React, { useMemo, useState } from 'react';

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

const PHASE_EXPLANATIONS = {
  Expansion: {
    color: '#26a69a',
    summary: 'Croissance accélère · Inflation contenue',
    detail: 'C\'est la phase de reprise idéale : l\'économie produit davantage sans générer d\'inflation excessive. Les banques centrales maintiennent des taux accommodants. Les actifs risqués (actions tech, crypto) surperforment historiquement car les investisseurs cherchent du rendement. Le dollar s\'affaiblit car les capitaux fuient vers des marchés plus dynamiques.',
  },
  Surchauffe: {
    color: '#ff9800',
    summary: 'Croissance forte · Inflation monte',
    detail: 'La croissance reste robuste mais l\'inflation s\'emballe, forçant les banques centrales à resserrer leur politique monétaire (hausse des taux). Les matières premières et l\'énergie servent de couverture contre l\'inflation. Les obligations souffrent de la hausse des rendements. C\'est souvent la fin du cycle haussier.',
  },
  Contraction: {
    color: '#ef5350',
    summary: 'Croissance ralentit · Inflation persistante',
    detail: 'Phase de stagflation : la croissance recule mais l\'inflation reste élevée, laissant les banques centrales dans une impasse (elles ne peuvent pas baisser les taux sans relancer l\'inflation). C\'est la phase la plus difficile pour les portefeuilles. Le cash et l\'or jouent leur rôle de valeur refuge.',
  },
  Récession: {
    color: '#2962FF',
    summary: 'Croissance négative · Inflation recule',
    detail: 'La demande s\'effondre et entraîne l\'inflation avec elle. Les banques centrales coupent les taux pour relancer l\'économie, ce qui booste les obligations d\'État (leurs prix montent quand les taux baissent). C\'est souvent le point bas avant une nouvelle phase d\'expansion.',
  },
};

function EconomicClock({ phase, growth_yoy, inflation_yoy, growth_trend, inflation_trend, loading, error }) {
  const [showInfo, setShowInfo] = useState(false);

  const activePhase = PHASES.find((p) => p.id === phase);
  const needleAngle = activePhase?.needle ?? 112.5;
  const cssRotation = 90 - needleAngle;

  const labelPositions = useMemo(() => {
    const r = (OUTER_R + INNER_R) / 2;
    return PHASES.map((p) => {
      const mid = (p.start + p.end) / 2;
      return { ...p, lx: CX + r * Math.cos(toRad(mid)), ly: CY - r * Math.sin(toRad(mid)) };
    });
  }, []);

  const phaseColor = PHASE_COLORS[phase] ?? '#d1d4dc';
  const phaseExpl = PHASE_EXPLANATIONS[phase];

  if (loading) return <Placeholder>Chargement du cycle économique…</Placeholder>;
  if (error)   return <Placeholder color="#ef5350">{error}</Placeholder>;

  return (
    <div style={cardStyle}>
      {/* Titre + bouton info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #2B2B43', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#d1d4dc', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.06em' }}>
          HORLOGE ÉCONOMIQUE
        </h3>
        <button
          onClick={() => setShowInfo(v => !v)}
          title="Comment interpréter cet indicateur ?"
          style={{
            background: showInfo ? '#2962FF22' : 'transparent',
            border: `1px solid ${showInfo ? '#2962FF' : '#2B2B43'}`,
            color: showInfo ? '#2962FF' : '#8a919e',
            borderRadius: '50%', width: '22px', height: '22px',
            cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}
        >
          i
        </button>
      </div>

      {/* Panneau d'explication */}
      {showInfo && (
        <div style={infoPanelStyle}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#d1d4dc', fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>
              Comment fonctionne l'horloge économique ?
            </div>
            <p style={infoTextStyle}>
              L'horloge positionne l'économie dans un <strong style={{ color: '#d1d4dc' }}>cycle en 4 phases</strong> en croisant
              deux variables clés : la croissance réelle et l'inflation. La phase détermine quels actifs sont
              historiquement favorisés ou pénalisés.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {Object.entries(PHASE_EXPLANATIONS).map(([name, expl]) => (
              <div key={name} style={{
                padding: '10px 12px', borderRadius: '8px',
                border: `1px solid ${name === phase ? expl.color : '#2B2B43'}`,
                backgroundColor: name === phase ? `${expl.color}15` : '#0d1117',
              }}>
                <div style={{ color: expl.color, fontWeight: 'bold', fontSize: '12px', marginBottom: '3px' }}>
                  {name} {name === phase && <span style={{ fontSize: '10px', opacity: 0.8 }}>← actuel</span>}
                </div>
                <div style={{ color: '#8a919e', fontSize: '11px', marginBottom: '5px' }}>{expl.summary}</div>
                <div style={{ color: '#b0b8c4', fontSize: '11px', lineHeight: '1.5' }}>{expl.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={indicatorExplStyle}>
              <div style={{ color: '#26a69a', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>INDPRO — Indice de production industrielle</div>
              <p style={infoTextStyle}>
                Publié par la Réserve Fédérale américaine, il mesure la production des usines, mines et
                services publics. C'est un proxy fiable de la croissance économique réelle, plus réactif que le PIB
                car publié chaque mois.
              </p>
            </div>
            <div style={indicatorExplStyle}>
              <div style={{ color: '#ef5350', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>CPI — Indice des prix à la consommation</div>
              <p style={infoTextStyle}>
                Mesure l'évolution du coût d'un panier de biens et services représentatif (alimentation, énergie,
                logement…). C'est l'indicateur d'inflation de référence suivi par la Fed pour calibrer sa politique monétaire.
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

        {/* ── SVG Jauge ── */}
        <svg viewBox="0 0 320 200" style={{ width: '100%', maxWidth: '320px', overflow: 'visible' }}>

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

          <g
            style={{
              transform: `rotate(${cssRotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <line
              x1={CX} y1={CY + 12}
              x2={CX} y2={CY - Math.round(OUTER_R * 0.83)}
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${CX},${CY + 14} ${CX - 5},${CY + 4} ${CX + 5},${CY + 4}`}
              fill="white"
              opacity="0.6"
            />
          </g>

          <circle cx={CX} cy={CY} r="7" fill="#1e222d" stroke="white" strokeWidth="2" />
          <line
            x1={CX - OUTER_R - 6} y1={CY}
            x2={CX + OUTER_R + 6} y2={CY}
            stroke="#2B2B43" strokeWidth="1"
          />
        </svg>

        {/* ── Phase actuelle + explication courte ── */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: phaseColor, transition: 'color 0.5s' }}>
            {phase ?? '—'}
          </div>
          {phaseExpl && (
            <div style={{ fontSize: '11px', color: phaseExpl.color, marginTop: '2px', opacity: 0.8 }}>
              {phaseExpl.summary}
            </div>
          )}
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

const infoPanelStyle = {
  backgroundColor: '#0d1117', border: '1px solid #2B2B43', borderRadius: '8px',
  padding: '14px 16px', marginBottom: '18px',
};

const infoTextStyle = {
  margin: 0, color: '#8a919e', fontSize: '11px', lineHeight: '1.6',
};

const indicatorExplStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid #2B2B43', backgroundColor: '#0d1117',
};

export default EconomicClock;
