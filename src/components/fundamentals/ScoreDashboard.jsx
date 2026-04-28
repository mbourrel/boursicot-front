/**
 * ScoreDashboard — Layout "Orbit" :
 *   [3 piliers financiers] | [Master Gauge + Verdict] | [3 piliers stratégiques] | [Légende]
 *
 * Props :
 *   scores       { health, valuation, growth, dividend, momentum, efficiency,
 *                  global_score, complexity, verdict }
 *   sector       string  — nom du secteur (optionnel)
 *   companyCount number  — nb d'entreprises dans le secteur (optionnel)
 *   beta         number  — beta (optionnel, pour la micro-explication complexité)
 *   marketCap    number  — capitalisation en $ (optionnel)
 */
import { useState } from 'react';
import MethodologyModal from './MethodologyModal';

const COLOR_UP      = '#26a69a';
const COLOR_DOWN    = '#ef5350';
const COLOR_NEUTRAL = '#ff9800';

function scoreColor(s) {
  if (s >= 7) return COLOR_UP;
  if (s >= 4) return COLOR_NEUTRAL;
  return COLOR_DOWN;
}

// ── Pondérations (miroir backend) ─────────────────────────────────────────────
const WEIGHTS = { health: 0.25, valuation: 0.20, growth: 0.20, efficiency: 0.15, dividend: 0.10, momentum: 0.10 };

// ── Jauge circulaire SVG ──────────────────────────────────────────────────────
function CircularGauge({ score, label, icon, size = 72, strokeWidth = 7, onClick, sectionId }) {
  const [hovered, setHovered] = useState(false);
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress    = (score / 10) * circumference;
  const color       = scoreColor(score);

  const handleClick = () => {
    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
        cursor: sectionId ? 'pointer' : 'default',
        opacity: hovered && sectionId ? 0.8 : 1,
        transition: 'opacity 0.15s',
      }}
      title={sectionId ? `Voir la section ${label}` : undefined}
    >
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size >= 100 ? 22 : 16} fontWeight="bold"
          style={{ fontFamily: 'sans-serif' }}>
          {score.toFixed(1)}
        </text>
        <text x={cx} y={cy + (size >= 100 ? 16 : 12)} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text3)" fontSize={size >= 100 ? 10 : 9}
          style={{ fontFamily: 'sans-serif' }}>
          /10
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        {icon && <span style={{ fontSize: '11px', display: 'block', lineHeight: 1 }}>{icon}</span>}
        <span style={{
          fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.05em',
          color: 'var(--text3)', textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Master Gauge (Note Globale) ───────────────────────────────────────────────
function MasterGauge({ score, size = 120, strokeWidth = 11 }) {
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress    = (score / 10) * circumference;
  const color       = scoreColor(score);

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cy} r={radius} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${progress} ${circumference - progress}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="26" fontWeight="900"
        style={{ fontFamily: 'sans-serif' }}>
        {score.toFixed(1)}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
        fill="var(--text3)" fontSize="11"
        style={{ fontFamily: 'sans-serif' }}>
        /10
      </text>
    </svg>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ScoreDashboard({ scores, sector, companyCount, beta, marketCap }) {
  const [showModal, setShowModal] = useState(false);
  const [btnHover,  setBtnHover]  = useState(false);
  if (!scores) return null;

  // Note Globale : utilise global_score du backend si disponible, sinon calcul frontend
  const globalScore = scores.global_score != null
    ? scores.global_score
    : parseFloat(
        Object.entries(WEIGHTS)
          .reduce((sum, [k, w]) => sum + (scores[k] ?? 5) * w, 0)
          .toFixed(2)
      );

  const complexityLabel = scores.complexity >= 6.5 ? 'Avancé' : scores.complexity >= 4.0 ? 'Modéré' : 'Simple';
  const complexityColor = scores.complexity >= 6.5 ? COLOR_DOWN : scores.complexity >= 4.0 ? COLOR_NEUTRAL : COLOR_UP;
  const verdictColor    = {
    'Excellent': COLOR_UP, 'Bon': COLOR_UP,
    'Correct': COLOR_NEUTRAL,
    'Risqué': COLOR_DOWN, 'À éviter': COLOR_DOWN,
  }[scores.verdict] ?? 'var(--text1)';

  // Micro-explication complexité
  const riskHint = (() => {
    if (beta !== null && beta > 1.5)           return { icon: '⚡', text: 'Vigilance : Volatilité élevée',     color: COLOR_DOWN };
    if (marketCap !== null && marketCap < 2e9) return { icon: '🔍', text: 'Vigilance : Petite capitalisation', color: COLOR_NEUTRAL };
    return                                            { icon: '✓',  text: 'Profil de risque standard',         color: COLOR_UP };
  })();

  // Scores avec fallback 5.0 pour données manquantes (avant re-seed)
  const s = {
    health:     scores.health     ?? 5,
    valuation:  scores.valuation  ?? 5,
    growth:     scores.growth     ?? 5,
    dividend:   scores.dividend   ?? 5,
    momentum:   scores.momentum   ?? 5,
    efficiency: scores.efficiency ?? 5,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr minmax(auto, 210px) 1fr auto',
      alignItems: 'center',
      gap: '0',
      padding: '20px 24px',
      backgroundColor: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '28px',
    }}>

      {/* ── Col 1 : Piliers Financiers (gauche) — pyramide ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '20px', alignItems: 'center' }}>
        <CircularGauge score={s.health} label="Santé" icon="❤️" size={110} sectionId="section-health" />
        <div style={{ display: 'flex', gap: '36px' }}>
          <CircularGauge score={s.valuation} label="Valorisation" icon="📊" size={110} sectionId="section-valuation" />
          <CircularGauge score={s.growth}    label="Croissance"   icon="📈" size={110} sectionId="section-growth"    />
        </div>
      </div>

      {/* ── Col 2 : Master Gauge + Verdict + Complexité + Contexte (centre) ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '0 20px',
        borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
      }}>
        {/* Label Note Globale */}
        <div style={{
          fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em',
          color: 'var(--text3)', textTransform: 'uppercase',
        }}>
          Note Globale
        </div>

        {/* Master Gauge */}
        <MasterGauge score={globalScore} size={104} strokeWidth={10} />

        {/* Verdict */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: verdictColor, lineHeight: 1, marginBottom: '3px' }}>
            {scores.verdict}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', opacity: 0.75, lineHeight: '1.4' }}>
            Synthèse de 60+ indicateurs<br />(Santé, Valo, Croissance…)
          </div>
        </div>

        {/* Complexité */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '5px' }}>
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
          <div style={{ marginTop: '5px', fontSize: '10px', color: riskHint.color, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span>{riskHint.icon}</span>
            <span>{riskHint.text}</span>
          </div>
        </div>

        {/* Contexte secteur */}
        {(sector || companyCount) && (
          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', lineHeight: '1.5', opacity: 0.8, maxWidth: '190px' }}>
            {companyCount !== null && companyCount < 3 && (
              <span title="Échantillon faible — score moins représentatif" style={{ marginRight: '4px' }}>⚠️</span>
            )}
            {companyCount != null
              ? <>Comparaison basée sur <strong style={{ color: 'var(--text2)' }}>{companyCount} entreprises</strong> du secteur {sector}</>
              : <>Secteur : <strong style={{ color: 'var(--text2)' }}>{sector}</strong></>
            }
          </div>
        )}
      </div>

      {/* ── Col 3 : Piliers Stratégiques (droite) — pyramide ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '20px', paddingRight: '20px', alignItems: 'center' }}>
        <CircularGauge score={s.dividend} label="Dividende" icon="💰" size={110} sectionId={null} />
        <div style={{ display: 'flex', gap: '36px' }}>
          <CircularGauge score={s.momentum}   label="Momentum"   icon="⚡"  size={110} sectionId="section-risk"   />
          <CircularGauge score={s.efficiency} label="Efficacité" icon="⚙️" size={110} sectionId="section-health" />
        </div>
      </div>

      {/* ── Col 4 : Légende + bouton Méthodologie ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '14px',
        fontSize: '15px', color: 'var(--text3)',
        borderLeft: '1px solid var(--border)', paddingLeft: '32px', minWidth: '170px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px', color: 'var(--text3)' }}>
          Légende
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: COLOR_UP,      flexShrink: 0 }} />
          ≥ 7 — Favorable
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: COLOR_NEUTRAL, flexShrink: 0 }} />
          4-7 — Neutre
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: COLOR_DOWN,    flexShrink: 0 }} />
          &lt; 4 — Défavorable
        </div>

        <button
          onClick={() => setShowModal(true)}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            marginTop: '16px',
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '10px 18px', borderRadius: '20px', cursor: 'pointer',
            border: `1px solid ${btnHover ? 'var(--text1)' : 'var(--border)'}`,
            backgroundColor: 'transparent',
            color: btnHover ? 'var(--text1)' : 'var(--text3)',
            fontSize: '14px', fontWeight: '500',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '16px' }}>📖</span>
          Méthodologie
        </button>
      </div>

      {showModal && <MethodologyModal onClose={() => setShowModal(false)} sector={sector} />}
    </div>
  );
}
