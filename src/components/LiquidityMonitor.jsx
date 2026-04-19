import React, { useMemo, useState } from 'react';

const ML = 54, MR = 20, MT = 20, MB = 38;
const SVG_W = 780, SVG_H = 300;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;

function LiquidityMonitor({ dates, m2_normalized, btc_normalized, loading, error }) {
  const [showInfo, setShowInfo] = useState(false);

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

    const step = Math.max(1, Math.floor(dates.length / 10));
    const xTicks = [];
    for (let i = 0; i < dates.length; i += step) {
      xTicks.push({ x: xS(i), label: dates[i].slice(0, 7) });
    }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={titleStyle}>LIQUIDITÉ GLOBALE — M2 USA vs BITCOIN</h3>
          <button
            onClick={() => setShowInfo(v => !v)}
            title="Comment interpréter ce graphique ?"
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
        <div style={{ display: 'flex', gap: '18px', fontSize: '12px', color: '#d1d4dc' }}>
          <span>
            <span style={{ color: '#60A5FA', fontWeight: 'bold', marginRight: '5px' }}>—</span>M2 USA
          </span>
          <span>
            <span style={{ color: '#F97316', fontWeight: 'bold', marginRight: '5px' }}>—</span>Bitcoin
          </span>
        </div>
      </div>

      {/* Panneau d'explication */}
      {showInfo && (
        <div style={infoPanelStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={blockStyle}>
              <div style={{ color: '#60A5FA', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
                M2 — Masse monétaire large
              </div>
              <p style={infoTextStyle}>
                L'agrégat M2 regroupe tous les billets en circulation, les dépôts à vue, les comptes d'épargne
                et les fonds monétaires aux États-Unis. Il représente la quantité de monnaie disponible dans l'économie.
                Quand la Fed imprime de la monnaie (QE), M2 gonfle ; quand elle resserre (QT), M2 se contracte.
              </p>
            </div>
            <div style={blockStyle}>
              <div style={{ color: '#F97316', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
                Pourquoi M2 vs Bitcoin ?
              </div>
              <p style={infoTextStyle}>
                Historiquement, les expansions de la masse monétaire mondiale précèdent de quelques mois les hausses
                des actifs risqués, et particulièrement du Bitcoin. Quand les liquidités abondent, les investisseurs
                prennent plus de risques. Le Bitcoin, actif le plus sensible à la liquidité, amplifie ces mouvements.
                Cette corrélation est suivie de près par les traders macro.
              </p>
            </div>
            <div style={blockStyle}>
              <div style={{ color: '#758696', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
                Base 100 — Lecture du graphique
              </div>
              <p style={infoTextStyle}>
                Les deux séries sont normalisées à <strong style={{ color: '#d1d4dc' }}>100 en janvier 2020</strong> pour
                pouvoir comparer leur trajectoire relative, indépendamment de leurs niveaux absolus (M2 est en trillions
                de dollars, BTC en milliers de dollars). Une valeur de 150 signifie +50 % depuis le point de départ.
                La ligne pointillée marque la base 100.
              </p>
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: '#1a1e2e', border: '1px solid #2962FF40' }}>
            <span style={{ color: '#2962FF', fontWeight: 'bold', fontSize: '11px' }}>Signal à surveiller : </span>
            <span style={{ color: '#8a919e', fontSize: '11px' }}>
              Quand la courbe M2 repart à la hausse après une contraction, c'est historiquement un signal
              précurseur d'un rallye Bitcoin à horizon 3-6 mois. Quand BTC diverge fortement au-dessus de M2,
              un recalibrage est possible.
            </span>
          </div>
        </div>
      )}

      {/* SVG */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={ML} y1={t.y} x2={ML + PW} y2={t.y} stroke="#2B2B43" strokeWidth="1" />
            <text x={ML - 6} y={t.y + 4} textAnchor="end" fontSize="11" fill="#8a919e" fontFamily="sans-serif">
              {t.label}
            </text>
          </g>
        ))}

        <line
          x1={ML} y1={refY} x2={ML + PW} y2={refY}
          stroke="#758696" strokeWidth="1.5" strokeDasharray="7 4" opacity="0.8"
        />
        <text x={ML + PW + 4} y={refY + 4} fontSize="10" fill="#758696" fontFamily="sans-serif">
          100
        </text>

        {xTicks.map((t, i) => (
          <g key={i}>
            <line x1={t.x} y1={MT} x2={t.x} y2={MT + PH} stroke="#2B2B43" strokeWidth="0.5" />
            <text x={t.x} y={MT + PH + 16} textAnchor="middle" fontSize="10" fill="#8a919e" fontFamily="sans-serif">
              {t.label}
            </text>
          </g>
        ))}

        <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="#2B2B43" strokeWidth="1" />
        <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="#2B2B43" strokeWidth="1" />

        <text
          transform={`translate(13,${MT + PH / 2}) rotate(-90)`}
          textAnchor="middle" fontSize="10" fill="#8a919e" fontFamily="sans-serif"
        >
          Base 100 (janv. 2020)
        </text>

        <polyline
          points={m2Points}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

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
const infoPanelStyle = {
  backgroundColor: '#0d1117', border: '1px solid #2B2B43', borderRadius: '8px',
  padding: '14px 16px', marginBottom: '16px',
};
const blockStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid #2B2B43', backgroundColor: '#131722',
};
const infoTextStyle = {
  margin: 0, color: '#8a919e', fontSize: '11px', lineHeight: '1.6',
};

export default LiquidityMonitor;
