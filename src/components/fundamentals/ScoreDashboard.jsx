/**
 * ScoreDashboard — affiche les 4 scores Boursicot sous forme de jauges circulaires SVG
 * + le verdict textuel + le badge de complexité.
 *
 * Props :
 *   scores  { health, valuation, growth, complexity, verdict }
 */
import { useState } from 'react';
import MethodologyModal from './MethodologyModal';

// ── Couleurs du projet ────────────────────────────────────────────────────────
const COLOR_UP      = '#26a69a';  // Hausse / bon
const COLOR_DOWN    = '#ef5350';  // Baisse / mauvais
const COLOR_NEUTRAL = '#ff9800';  // Neutre / moyen

function scoreColor(score) {
  if (score >= 7) return COLOR_UP;
  if (score >= 4) return COLOR_NEUTRAL;
  return COLOR_DOWN;
}

// ── Jauge circulaire SVG ──────────────────────────────────────────────────────
function CircularGauge({ score, label, size = 100 }) {
  const strokeWidth = 9;
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress    = (score / 10) * circumference;
  const color       = scoreColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size}>
        {/* Fond du cercle */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Arc de progression — démarre à 12h (rotation -90°) */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.5s ease' }}
        />
        {/* Score centré */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="20"
          fontWeight="bold"
          style={{ fontFamily: 'sans-serif' }}
        >
          {score.toFixed(1)}
        </text>
        {/* Sous-texte "/10" */}
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text3)"
          fontSize="10"
          style={{ fontFamily: 'sans-serif' }}
        >
          /10
        </text>
      </svg>

      <span style={{
        fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.06em',
        color: 'var(--text3)', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ScoreDashboard({ scores }) {
  const [showModal, setShowModal] = useState(false);
  if (!scores) return null;

  // Badge complexité
  const complexityLabel = scores.complexity >= 6.5 ? 'Avancé'  : scores.complexity >= 4.0 ? 'Modéré' : 'Simple';
  const complexityColor = scores.complexity >= 6.5 ? COLOR_DOWN : scores.complexity >= 4.0 ? COLOR_NEUTRAL : COLOR_UP;

  // Couleur du verdict
  const verdictColor = {
    'Excellent': COLOR_UP,
    'Bon':       COLOR_UP,
    'Correct':   COLOR_NEUTRAL,
    'Risqué':    COLOR_DOWN,
    'À éviter':  COLOR_DOWN,
  }[scores.verdict] ?? 'var(--text1)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '28px',
      padding: '20px 24px',
      backgroundColor: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '28px',
      flexWrap: 'wrap',
    }}>
      {/* ── Jauges ── */}
      <CircularGauge score={scores.health}    label="Santé"        />
      <CircularGauge score={scores.valuation} label="Valorisation" />
      <CircularGauge score={scores.growth}    label="Croissance"   />

      {/* Séparateur */}
      <div style={{ width: '1px', height: '70px', backgroundColor: 'var(--border)', flexShrink: 0 }} />

      {/* ── Verdict + Complexité ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '120px' }}>

        {/* Verdict */}
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.08em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px',
          }}>
            Verdict
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: verdictColor, lineHeight: 1 }}>
            {scores.verdict}
          </div>
        </div>

        {/* Complexité */}
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.08em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px',
          }}>
            Complexité
          </div>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '0.04em',
            backgroundColor: complexityColor + '22',
            color: complexityColor,
            border: `1px solid ${complexityColor}55`,
          }}>
            {complexityLabel}
          </span>
        </div>
      </div>

      {/* ── Légende mini + bouton méthodologie ── */}
      <div style={{
        marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '6px',
        fontSize: '11px', color: 'var(--text3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLOR_UP,      flexShrink: 0 }} />
          ≥ 7 — Favorable
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLOR_NEUTRAL, flexShrink: 0 }} />
          4-7 — Neutre
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLOR_DOWN,    flexShrink: 0 }} />
          &lt; 4 — Défavorable
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            marginTop: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', fontSize: '11px',
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px',
          }}
        >
          ℹ️ Comprendre la méthodologie
        </button>
      </div>

      {showModal && <MethodologyModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
