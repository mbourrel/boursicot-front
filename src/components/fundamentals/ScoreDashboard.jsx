/**
 * ScoreDashboard — layout 3 colonnes :
 *   Col 1 : jauges circulaires (Santé, Valorisation, Croissance)
 *   Col 2 : Verdict + Complexité + contexte secteur (centré)
 *   Col 3 : légende + bouton Méthodologie (droite)
 *
 * Props :
 *   scores       { health, valuation, growth, complexity, verdict }
 *   sector       string — nom du secteur (optionnel)
 *   companyCount number — nb d'entreprises dans le secteur (optionnel)
 */
import { useState } from 'react';
import MethodologyModal from './MethodologyModal';

const COLOR_UP      = '#26a69a';
const COLOR_DOWN    = '#ef5350';
const COLOR_NEUTRAL = '#ff9800';

function scoreColor(score) {
  if (score >= 7) return COLOR_UP;
  if (score >= 4) return COLOR_NEUTRAL;
  return COLOR_DOWN;
}

// ── Jauge circulaire SVG ──────────────────────────────────────────────────────
function CircularGauge({ score, label, size = 96 }) {
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
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="20" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>
          {score.toFixed(1)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text3)" fontSize="10" style={{ fontFamily: 'sans-serif' }}>
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
export default function ScoreDashboard({ scores, sector, companyCount }) {
  const [showModal, setShowModal] = useState(false);
  const [btnHover,  setBtnHover]  = useState(false);
  if (!scores) return null;

  const complexityLabel = scores.complexity >= 6.5 ? 'Avancé' : scores.complexity >= 4.0 ? 'Modéré' : 'Simple';
  const complexityColor = scores.complexity >= 6.5 ? COLOR_DOWN : scores.complexity >= 4.0 ? COLOR_NEUTRAL : COLOR_UP;

  const verdictColor = {
    'Excellent': COLOR_UP, 'Bon': COLOR_UP,
    'Correct':   COLOR_NEUTRAL,
    'Risqué':    COLOR_DOWN, 'À éviter': COLOR_DOWN,
  }[scores.verdict] ?? 'var(--text1)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      padding: '20px 24px',
      backgroundColor: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '28px',
    }}>

      {/* ── Col 1 : Jauges ── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', paddingRight: '24px' }}>
        <CircularGauge score={scores.health}    label="Santé"        />
        <CircularGauge score={scores.valuation} label="Valorisation" />
        <CircularGauge score={scores.growth}    label="Croissance"   />
      </div>

      {/* ── Col 2 : Verdict & Contexte ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '14px', padding: '0 28px',
        borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
      }}>
        {/* Verdict */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.08em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px',
          }}>
            Verdict
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: verdictColor, lineHeight: 1 }}>
            {scores.verdict}
          </div>
        </div>

        {/* Complexité */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.08em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px',
          }}>
            Complexité
          </div>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '4px',
            fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em',
            backgroundColor: complexityColor + '22', color: complexityColor,
            border: `1px solid ${complexityColor}55`,
          }}>
            {complexityLabel}
          </span>
        </div>

        {/* Contexte secteur */}
        {sector && (
          <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', lineHeight: '1.4' }}>
            Basé sur le secteur <span style={{ color: 'var(--text2)', fontWeight: '600' }}>{sector}</span>
            {companyCount ? ` (${companyCount} entreprises)` : ''}
          </div>
        )}
      </div>

      {/* ── Col 3 : Légende + bouton ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '6px',
        fontSize: '11px', color: 'var(--text3)', paddingLeft: '24px',
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

        {/* Bouton Méthodologie */}
        <button
          onClick={() => setShowModal(true)}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            marginTop: '8px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
            border: `1px solid ${btnHover ? 'var(--text1)' : 'var(--border)'}`,
            backgroundColor: 'transparent',
            color: btnHover ? 'var(--text1)' : 'var(--text3)',
            fontSize: '12px', fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '13px' }}>📖</span>
          Méthodologie
        </button>
      </div>

      {showModal && <MethodologyModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
