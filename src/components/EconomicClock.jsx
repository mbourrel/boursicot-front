import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';

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

import SourceTag from './SourceTag';

function EconomicClock({ phase, growth_yoy, inflation_yoy, growth_trend, inflation_trend, loading, error, history, historyLoading }) {
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

  const phaseColor = PHASE_COLORS[phase] ?? 'var(--text2)';
  const phaseExpl = PHASE_EXPLANATIONS[phase];

  if (loading) return <Placeholder>Chargement du cycle économique…</Placeholder>;
  if (error)   return <Placeholder color="#ef5350">{error}</Placeholder>;

  return (
    <div style={cardStyle}>
      {/* Titre + bouton info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: 'var(--text2)', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.06em' }}>
          HORLOGE ÉCONOMIQUE
        </h3>
        <button
          onClick={() => setShowInfo(v => !v)}
          title="Comment interpréter cet indicateur ?"
          style={{
            background: showInfo ? '#2962FF22' : 'transparent',
            border: `1px solid ${showInfo ? '#2962FF' : 'var(--border)'}`,
            color: showInfo ? '#2962FF' : 'var(--text3)',
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

          {/* ── 1. Principe général ── */}
          <div style={infoSectionStyle}>
            <div style={infoTitleStyle}>Comment fonctionne l'horloge économique ?</div>
            <p style={infoTextStyle}>
              L'horloge s'inspire du modèle de cycle économique de <strong style={{ color: 'var(--text2)' }}>Fidelity Investments</strong> et
              de la théorie du portefeuille <strong style={{ color: 'var(--text2)' }}>All Weather de Ray Dalio</strong>. Elle positionne
              l'économie dans un <strong style={{ color: 'var(--text2)' }}>cycle en 4 phases</strong> en croisant deux variables macroéconomiques
              clés : la <strong style={{ color: '#26a69a' }}>croissance réelle</strong> (INDPRO) et
              l'<strong style={{ color: '#ef5350' }}>inflation</strong> (CPI). Pour chaque variable, on regarde
              non pas le niveau absolu, mais la <strong style={{ color: 'var(--text2)' }}>tendance</strong> : est-ce que le taux de
              variation annuel accélère ou ralentit par rapport au mois précédent ? C'est ce croisement de tendances
              qui détermine la phase et, in fine, quels actifs sont historiquement favorisés ou pénalisés.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <div style={matrixCellStyle}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Croissance ↑ · Inflation ↓</div>
                <div style={{ color: '#26a69a', fontWeight: 'bold', fontSize: '12px' }}>→ Expansion</div>
              </div>
              <div style={matrixCellStyle}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Croissance ↑ · Inflation ↑</div>
                <div style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '12px' }}>→ Surchauffe</div>
              </div>
              <div style={matrixCellStyle}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Croissance ↓ · Inflation ↑</div>
                <div style={{ color: '#ef5350', fontWeight: 'bold', fontSize: '12px' }}>→ Contraction</div>
              </div>
              <div style={matrixCellStyle}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Croissance ↓ · Inflation ↓</div>
                <div style={{ color: '#2962FF', fontWeight: 'bold', fontSize: '12px' }}>→ Récession</div>
              </div>
            </div>
          </div>

          {/* ── 2. Les 4 phases en détail ── */}
          <div style={infoSectionStyle}>
            <div style={infoTitleStyle}>Les 4 phases du cycle en détail</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(PHASE_EXPLANATIONS).map(([name, expl]) => (
                <div key={name} style={{
                  padding: '10px 12px', borderRadius: '8px',
                  border: `1px solid ${name === phase ? expl.color : 'var(--border)'}`,
                  backgroundColor: name === phase ? `${expl.color}15` : 'var(--bg0)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: expl.color, flexShrink: 0 }} />
                    <span style={{ color: expl.color, fontWeight: 'bold', fontSize: '12px' }}>
                      {name}
                    </span>
                    {name === phase && <span style={{ fontSize: '10px', color: expl.color, opacity: 0.8 }}>← actuel</span>}
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '5px', fontStyle: 'italic' }}>{expl.summary}</div>
                  <div style={{ color: '#b0b8c4', fontSize: '11px', lineHeight: '1.55' }}>{expl.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. Les indicateurs utilisés ── */}
          <div style={infoSectionStyle}>
            <div style={infoTitleStyle}>Les indicateurs macroéconomiques utilisés</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={indicatorExplStyle}>
                <div style={{ color: '#26a69a', fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>
                  INDPRO — Production industrielle (Fed)
                </div>
                <p style={infoTextStyle}>
                  Publié chaque mois par la Réserve Fédérale américaine, l'<strong style={{ color: 'var(--text2)' }}>Industrial Production Index</strong> mesure
                  le volume de production des usines, mines et services publics aux États-Unis.
                  C'est un proxy de la <strong style={{ color: 'var(--text2)' }}>croissance économique réelle</strong>, plus réactif que le PIB
                  (trimestriel) car disponible chaque mois avec un décalage d'environ 2 semaines.
                  Une variation annuelle positive et accélérante indique une économie en expansion ;
                  une variation décélérante ou négative signale un ralentissement.
                </p>
              </div>
              <div style={indicatorExplStyle}>
                <div style={{ color: '#ef5350', fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>
                  CPIAUCSL — Indice des prix à la consommation (BLS)
                </div>
                <p style={infoTextStyle}>
                  Publié par le Bureau of Labor Statistics, le <strong style={{ color: 'var(--text2)' }}>Consumer Price Index for All Urban Consumers</strong> mesure
                  l'évolution du coût d'un panier représentatif de biens et services (alimentation, énergie,
                  logement, santé…). C'est l'indicateur d'<strong style={{ color: 'var(--text2)' }}>inflation</strong> de référence suivi
                  par la Fed pour calibrer sa politique monétaire. Un CPI YoY qui accélère pousse la Fed
                  à monter les taux, ce qui pèse sur les actifs risqués.
                </p>
              </div>
            </div>
          </div>

          {/* ── 4. Comment lire le graphique historique ── */}
          <div style={{ ...infoSectionStyle, marginBottom: 0 }}>
            <div style={infoTitleStyle}>Comment lire le graphique historique ?</div>
            <p style={{ ...infoTextStyle, marginBottom: '10px' }}>
              Le graphique retrace le <strong style={{ color: 'var(--text2)' }}>cycle économique depuis 1948</strong> en données
              mensuelles (~920 points). C'est l'intégralité de l'historique disponible sur FRED : CPIAUCSL démarre
              en janvier 1947, ce qui permet de calculer les premières variations YoY dès début 1948.
              Chaque segment est coloré selon la phase à ce moment-là — on y retrouve notamment
              la reconstruction d'après-guerre, les chocs pétroliers (1973, 1979), la grande inflation des années 70,
              la désinflation Volcker (1980–1982), la bulle internet (2001), les subprimes (2008–2009),
              le choc COVID (2020) et la surchauffe post-pandémie (2021–2022).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={indicatorExplStyle}>
                <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                  Axe Y · Croissance YoY (%)
                </div>
                <p style={infoTextStyle}>
                  Variation en % de l'INDPRO par rapport au même mois un an plus tôt.
                  Une valeur <strong style={{ color: '#26a69a' }}>positive</strong> signifie que la production industrielle est plus élevée qu'il y a un an (l'économie croît).
                  Une valeur <strong style={{ color: '#ef5350' }}>négative</strong> indique une contraction.
                  La <strong style={{ color: 'var(--text2)' }}>ligne pointillée à 0 %</strong> sert de référence neutre.
                </p>
              </div>
              <div style={indicatorExplStyle}>
                <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
                  Axe X · Période mensuelle
                </div>
                <p style={infoTextStyle}>
                  Chaque point correspond à un mois de données FRED.
                  L'historique couvre <strong style={{ color: 'var(--text2)' }}>depuis début 1948</strong> (~920 points mensuels) —
                  l'intégralité de ce que FRED met à disposition pour CPIAUCSL. Utilisez la molette pour
                  zoomer sur une période précise (ex. chocs pétroliers 70s, crise 2008, COVID 2020).
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {Object.entries(PHASE_COLORS).map(([name, color]) => (
                <div key={name} style={{ ...matrixCellStyle, flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '3px', borderRadius: '2px', backgroundColor: color }} />
                    <span style={{ color, fontWeight: 'bold', fontSize: '11px' }}>{name}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', lineHeight: '1.4' }}>
                    {PHASE_EXPLANATIONS[name]?.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── Layout côte à côte : jauge (25%) | graphique (75%) ── */}
      <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>

        {/* ── Colonne gauche : jauge ── */}
        <div style={{
          width: '25%', minWidth: '150px', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          paddingRight: '16px', borderRight: '1px solid var(--border)',
        }}>
          <svg viewBox="0 0 320 200" style={{ width: '100%', overflow: 'visible' }}>
            {PHASES.map((p) => (
              <path
                key={p.id}
                d={arcPath(CX, CY, OUTER_R, INNER_R, p.start, p.end)}
                fill={p.id === phase ? p.color : `${p.color}45`}
                stroke="var(--bg1)"
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
                style={{ fill: p.id === phase ? 'var(--text1)' : 'var(--text3)', transition: 'fill 0.5s ease', userSelect: 'none' }}
              >
                {p.id}
              </text>
            ))}
            <g style={{
              transform: `rotate(${cssRotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <line x1={CX} y1={CY + 12} x2={CX} y2={CY - Math.round(OUTER_R * 0.83)}
                stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points={`${CX},${CY + 14} ${CX - 5},${CY + 4} ${CX + 5},${CY + 4}`}
                fill="white" opacity="0.6" />
            </g>
            <circle cx={CX} cy={CY} r="7" fill="var(--bg3)" stroke="var(--text1)" strokeWidth="2" />
            <line x1={CX - OUTER_R - 6} y1={CY} x2={CX + OUTER_R + 6} y2={CY}
              stroke="var(--border)" strokeWidth="1" />
          </svg>

          {/* Phase actuelle */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: phaseColor, transition: 'color 0.5s' }}>
              {phase ?? '—'}
            </div>
            {phaseExpl && (
              <div style={{ fontSize: '10px', color: phaseExpl.color, marginTop: '2px', opacity: 0.8 }}>
                {phaseExpl.summary}
              </div>
            )}
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>
              Phase actuelle
            </div>
          </div>

          {/* Indicateurs YoY empilés */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <YoYBlock label="Croissance (INDPRO)" value={growth_yoy} trend={growth_trend} positiveColor="#26a69a" />
            <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
            <YoYBlock label="Inflation (CPI)" value={inflation_yoy} trend={inflation_trend} positiveColor="#ef5350" />
          </div>
        </div>

        {/* ── Colonne droite : graphique historique ── */}
        <div style={{ flex: 1, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>

          {/* En-tête : titre + légende */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text3)', letterSpacing: '0.06em' }}>
              HISTORIQUE DES PHASES · DEPUIS 1948
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(PHASE_COLORS).map(([name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique */}
          {historyLoading
            ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px' }}>
                <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Chargement de l'historique…</span>
              </div>
            : <>
                <CycleHistoryChart history={history} height={280} />
                <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text3)', opacity: 0.6, marginTop: '2px' }}>
                  molette pour zoomer · double-clic pour réinitialiser
                </div>
              </>
          }
        </div>
      </div>
      <SourceTag label="FRED · INDPRO / CPIAUCSL" />
    </div>
  );
}

// ── Découpe les données en segments continus par phase ───────────────────────
function splitByPhase(data) {
  if (!data || data.length === 0) return [];
  const segments = [];
  let current = { phase: data[0].phase, points: [data[0]] };
  for (let i = 1; i < data.length; i++) {
    if (data[i].phase === current.phase) {
      current.points.push(data[i]);
    } else {
      // On chevauche le point de jonction pour ne pas avoir de gap visuel
      current.points.push(data[i]);
      segments.push(current);
      current = { phase: data[i].phase, points: [data[i]] };
    }
  }
  segments.push(current);
  return segments;
}

function CycleHistoryChart({ history, height = 280 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !history?.length) return;

    const container = containerRef.current;

    const chart = createChart(container, {
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#9ba3ad' },
      grid: { vertLines: { color: '#2a2f3a' }, horzLines: { color: '#2a2f3a' } },
      width: container.clientWidth,
      height,
      timeScale: { borderColor: '#2a2f3a', timeVisible: true },
      rightPriceScale: { borderColor: '#2a2f3a' },
      crosshair: { vertLine: { color: '#758696aa' }, horzLine: { color: '#758696aa' } },
    });

    // Ligne de référence à 0 %
    const zeroSeries = chart.addSeries(LineSeries, {
      color: '#ffffff25',
      lineWidth: 1,
      lineStyle: 2,      // pointillé
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    zeroSeries.setData(history.map(p => ({ time: p.date, value: 0 })));

    // Une LineSeries colorée par segment de phase
    const segments = splitByPhase(history);
    segments.forEach(({ phase, points }) => {
      const color = PHASE_COLORS[phase] ?? '#888888';
      const s = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
      });
      s.setData(points.map(p => ({ time: p.date, value: p.growth_yoy })));
    });

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (container) chart.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [history]);

  if (!history?.length) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Données historiques indisponibles</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', flex: 1 }}>
      <div ref={containerRef} style={{ width: '100%', height: `${height}px` }} />
      {/* Label axe Y — dans la zone de graduation, coin supérieur droit */}
      <div style={{
        position: 'absolute', top: '4px', right: '4px',
        fontSize: '9px', color: '#9ba3ad', opacity: 0.85,
        pointerEvents: 'none', letterSpacing: '0.03em',
      }}>
        YoY (%)
      </div>
      {/* Label axe X — flux normal, juste sous le canvas = juste sous l'axe des dates */}
      <div style={{
        textAlign: 'center', marginTop: '3px',
        fontSize: '9px', color: '#9ba3ad', opacity: 0.85,
        letterSpacing: '0.03em', pointerEvents: 'none',
      }}>
        INDPRO mensuel
      </div>
    </div>
  );
}

function YoYBlock({ label, value, trend, positiveColor }) {
  const trendColor = trend === 'up' ? positiveColor : (positiveColor === '#ef5350' ? '#26a69a' : '#ef5350');
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text2)' }}>
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

function Placeholder({ children, color = 'var(--text3)' }) {
  return (
    <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
      <span style={{ color, fontSize: '13px' }}>{children}</span>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'var(--bg1)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)',
};

const infoPanelStyle = {
  backgroundColor: 'var(--bg0)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '14px 16px', marginBottom: '18px',
};

const infoTextStyle = {
  margin: 0, color: 'var(--text3)', fontSize: '11px', lineHeight: '1.6',
};

const indicatorExplStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg0)',
};

const infoSectionStyle = {
  marginBottom: '18px',
  paddingBottom: '18px',
  borderBottom: '1px solid var(--border)',
};

const infoTitleStyle = {
  color: 'var(--text2)', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px',
};

const matrixCellStyle = {
  padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)',
  backgroundColor: 'var(--bg0)', display: 'flex', flexDirection: 'column',
};

export default EconomicClock;
