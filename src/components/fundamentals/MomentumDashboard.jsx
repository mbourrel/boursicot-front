/**
 * MomentumDashboard — affiché pour les actifs sans analyse fondamentale
 * (indices, crypto, matières premières).
 *
 * Props :
 *   price    number | null  — Prix Actuel (devise native)
 *   mm50     number | null  — Moyenne Mobile 50 jours
 *   mm200    number | null  — Moyenne Mobile 200 jours
 *   perf1y   number | null  — Performance 1 an en %
 *   assetType string        — 'index' | 'crypto' | 'commodity'
 */
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const COLOR_UP      = '#26a69a';
const COLOR_DOWN    = '#ef5350';
const COLOR_NEUTRAL = '#ff9800';

function scoreColor(s) {
  if (s >= 7) return COLOR_UP;
  if (s >= 4) return COLOR_NEUTRAL;
  return COLOR_DOWN;
}

function clamp(v, lo = 0, hi = 10) {
  return Math.max(lo, Math.min(hi, v));
}

// Normalisation → score 0-10 (mêmes formules que scoring_logic.py)
function scoreMM50(price, mm50) {
  if (!price || !mm50 || mm50 === 0) return 5;
  return clamp(5 + (price / mm50 - 1) * 20);
}

function scoreMM200(price, mm200) {
  if (!price || !mm200 || mm200 === 0) return 5;
  return clamp(5 + (price / mm200 - 1) * 15);
}

function scorePerf1y(perf) {
  if (perf == null) return 5;
  // -50% → 0 | 0% → 5 | +50% → 10
  return clamp((perf + 50) / 100 * 10);
}

// ── Jauge circulaire SVG (identique à ScoreDashboard) ────────────────────────
function CircularGauge({ score, label, size = 96, strokeWidth = 8 }) {
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress    = (score / 10) * circumference;
  const color       = scoreColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="15" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>
          {score.toFixed(1)}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text3)" fontSize="9" style={{ fontFamily: 'sans-serif' }}>
          /10
        </text>
      </svg>
      <span style={{
        fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.05em',
        color: 'var(--text3)', textTransform: 'uppercase', textAlign: 'center',
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Labels lisibles par type d'actif ─────────────────────────────────────────
const ASSET_LABEL = {
  index:     'Indice boursier',
  crypto:    'Cryptomonnaie',
  commodity: 'Matière première',
};

export default function MomentumDashboard({ price, mm50, mm200, perf1y, assetType }) {
  const [expandedTip, setExpandedTip] = useState(null);

  const s50    = scoreMM50(price, mm50);
  const s200   = scoreMM200(price, mm200);
  const sPerf  = scorePerf1y(perf1y);

  // ── Verdict global ────────────────────────────────────────────────────────
  let verdict, verdictColor, verdictIcon;
  const aboveMM50  = price != null && mm50  != null && price > mm50;
  const aboveMM200 = price != null && mm200 != null && price > mm200;
  const belowMM50  = price != null && mm50  != null && price < mm50;
  const belowMM200 = price != null && mm200 != null && price < mm200;

  if (aboveMM50 && aboveMM200) {
    verdict      = 'Tendance Haussière';
    verdictColor = COLOR_UP;
    verdictIcon  = '🟢';
  } else if (belowMM50 && belowMM200) {
    verdict      = 'Tendance Baissière';
    verdictColor = COLOR_DOWN;
    verdictIcon  = '🔴';
  } else {
    verdict      = 'Tendance Neutre';
    verdictColor = COLOR_NEUTRAL;
    verdictIcon  = '🟡';
  }

  const assetLabel = ASSET_LABEL[assetType] ?? 'Actif';

  // ── Tooltips inline ───────────────────────────────────────────────────────
  const TIPS = {
    MM50: {
      title: 'Moyenne Mobile 50 jours (MM50)',
      text: "La moyenne des prix de clôture sur les 50 derniers jours. Si le prix actuel est au-dessus, l'actif est dans une dynamique positive à court terme.",
    },
    MM200: {
      title: 'Moyenne Mobile 200 jours (MM200)',
      text: "La moyenne des prix de clôture sur les 200 derniers jours. C'est la frontière structurelle entre un marché globalement haussier (prix au-dessus) ou baissier (prix en-dessous). Référence clé des investisseurs long terme.",
    },
    Perf1y: {
      title: 'Performance 1 an',
      text: "La variation du prix sur les 12 derniers mois, exprimée en pourcentage. Utile pour mesurer la force et la persistance de la tendance sur une période significative.",
    },
  };

  function TipButton({ id }) {
    const open   = expandedTip === id;
    const tip    = TIPS[id];
    const btnRef = useRef(null);
    const [pos, setPos] = useState(null);

    const handleClick = (e) => {
      e.stopPropagation();
      if (open) { setExpandedTip(null); setPos(null); return; }
      const rect        = btnRef.current.getBoundingClientRect();
      const tipWidth    = 280;
      const spaceRight  = window.innerWidth - rect.right;
      const spaceLeft   = rect.left;
      const left = spaceRight >= tipWidth + 12
        ? rect.right + 8
        : spaceLeft >= tipWidth + 12
          ? rect.left - tipWidth - 8
          : Math.max(8, rect.right + 8);
      const top = rect.top - 4;
      setPos({ left, top });
      setExpandedTip(id);
    };

    return (
      <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '5px' }}>
        <button
          ref={btnRef}
          onClick={handleClick}
          style={{
            background: open ? '#2962FF22' : 'transparent',
            border: `1px solid ${open ? '#2962FF88' : 'var(--border)'}`,
            color: open ? '#2962FF' : 'var(--text3)',
            borderRadius: '50%', width: '14px', height: '14px',
            fontSize: '9px', fontWeight: 'bold', cursor: 'pointer',
            padding: 0, lineHeight: 1, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >i</button>
        {open && pos && createPortal(
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => { setExpandedTip(null); setPos(null); }} />
            <div style={{
              position: 'fixed', top: pos.top, left: pos.left, zIndex: 999,
              width: '280px', backgroundColor: 'var(--bg2)',
              border: '1px solid #2962FF44', borderRadius: '8px',
              padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              fontSize: '11px', lineHeight: '1.65',
            }}>
              <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>{tip.title}</div>
              <div style={{ color: '#b0b8c4' }}>{tip.text}</div>
            </div>
          </>,
          document.body
        )}
      </span>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: '12px', marginBottom: '28px', overflow: 'hidden',
    }}>

      {/* ── Bandeau pédagogique ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        backgroundColor: '#2962FF0e',
      }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>📊</span>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)', lineHeight: '1.55' }}>
          <strong style={{ color: 'var(--text2)' }}>{assetLabel}</strong> — L'analyse fondamentale classique (bilan, chiffre d'affaires) ne s'applique pas à cet actif.
          Nous analysons ici sa <strong style={{ color: '#2962FF' }}>dynamique de prix (Momentum)</strong>.
        </p>
      </div>

      {/* ── Corps : Verdict + 3 jauges ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(auto, 220px) 1fr',
        alignItems: 'center',
        gap: '0',
        padding: '24px',
      }}>

        {/* Verdict global */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '10px', paddingRight: '24px',
          borderRight: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase' }}>
            Verdict
          </div>
          <div style={{ fontSize: '32px', lineHeight: 1 }}>{verdictIcon}</div>
          <div style={{
            fontSize: '15px', fontWeight: 'bold', color: verdictColor,
            textAlign: 'center', lineHeight: '1.3',
          }}>
            {verdict}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', lineHeight: '1.5', maxWidth: '170px' }}>
            {aboveMM50 && aboveMM200
              ? "Prix au-dessus de MM50 et MM200 — dynamique structurellement positive."
              : belowMM50 && belowMM200
              ? "Prix en dessous de MM50 et MM200 — pression vendeuse persistante."
              : "Signal mixte — dynamique incertaine entre court et long terme."}
          </div>
        </div>

        {/* 3 jauges */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
          gap: '16px', paddingLeft: '24px',
        }}>

          {/* MM50 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CircularGauge score={s50} label="Court terme" />
            <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
              Prix vs MM50 <TipButton id="MM50" />
            </div>
            {price != null && mm50 != null && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: scoreColor(s50) }}>
                {((price / mm50 - 1) * 100).toFixed(1)}%
              </div>
            )}
          </div>

          {/* MM200 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CircularGauge score={s200} label="Long terme" />
            <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
              Prix vs MM200 <TipButton id="MM200" />
            </div>
            {price != null && mm200 != null && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: scoreColor(s200) }}>
                {((price / mm200 - 1) * 100).toFixed(1)}%
              </div>
            )}
          </div>

          {/* Performance 1an */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CircularGauge score={sPerf} label="Dynamique 1 an" />
            <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
              Performance 1 an <TipButton id="Perf1y" />
            </div>
            {perf1y != null && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: scoreColor(sPerf) }}>
                {perf1y >= 0 ? '+' : ''}{perf1y.toFixed(1)}%
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
