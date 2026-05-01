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
import { createPortal } from 'react-dom';
import MethodologyModal from './MethodologyModal';
import { PILLARS } from '../../constants/pillars';
import SwipeableContainer from '../SwipeableContainer';
import { useBreakpoint } from '../../hooks/useBreakpoint';

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
function CircularGauge({ score, label, icon, size = 72, strokeWidth = 7, onPillarClick }) {
  const [hovered, setHovered] = useState(false);
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress    = (score / 10) * circumference;
  const color       = scoreColor(score);

  return (
    <div
      onClick={onPillarClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
        cursor: onPillarClick ? 'pointer' : 'default',
        opacity: hovered && onPillarClick ? 0.8 : 1,
        transition: 'opacity 0.15s',
      }}
      title={onPillarClick ? `Détails : ${label}` : undefined}
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

// ── Modale Note Globale ───────────────────────────────────────────────────────
function GlobalScoreModal({ scores, globalScore, verdictColor, onClose }) {
  const color = scoreColor(globalScore);

  const PILLAR_WEIGHTS = [
    { key: 'health',     label: 'Santé Financière', icon: '❤️',  weight: 0.25 },
    { key: 'valuation',  label: 'Valorisation',      icon: '📊',  weight: 0.20 },
    { key: 'growth',     label: 'Croissance',         icon: '📈',  weight: 0.20 },
    { key: 'efficiency', label: 'Efficacité',         icon: '⚙️', weight: 0.15 },
    { key: 'dividend',   label: 'Dividende',          icon: '💰',  weight: 0.10 },
    { key: 'momentum',   label: 'Momentum',           icon: '⚡',  weight: 0.10 },
  ];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderLeft: `5px solid ${color}`,
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          background: color + '12',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>🏆</span>
            <div>
              <div style={{ color: color, fontWeight: 'bold', fontSize: '18px', lineHeight: 1.2 }}>Note Globale</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>Synthèse pondérée de 60+ indicateurs</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color, lineHeight: 1 }}>{globalScore.toFixed(1)}</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: verdictColor }}>{scores.verdict}</div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '24px', padding: '0 4px', lineHeight: 1 }}
            >✕</button>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '22px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '14px' }}>
            Décomposition par pilier
          </div>

          {/* Tableau de pondération */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {PILLAR_WEIGHTS.map(({ key, label, icon, weight }) => {
              const score  = scores[key] ?? 5;
              const contrib = score * weight;
              const c      = scoreColor(score);
              const barW   = `${(score / 10) * 100}%`;
              return (
                <div key={key} style={{
                  display: 'grid', gridTemplateColumns: '26px 1fr 48px 52px 52px',
                  alignItems: 'center', gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '16px', textAlign: 'center' }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text1)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: barW, height: '100%', background: c, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)' }}>
                    {(weight * 100).toFixed(0)}%
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: c }}>
                    {score.toFixed(1)}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text3)' }}>
                    +{contrib.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px',
            background: color + '18', border: `1px solid ${color}44`, borderRadius: '8px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text2)' }}>Note Globale (Σ pondéré)</span>
            <span style={{ fontSize: '22px', fontWeight: '900', color }}>{globalScore.toFixed(1)} / 10</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Modale détail d'une jauge ─────────────────────────────────────────────────
function GaugePillarModal({ pillar, score, onClose }) {
  const color = scoreColor(score);
  const verdictLabel = score >= 7 ? 'Favorable' : score >= 4 ? 'Neutre' : 'Défavorable';

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderLeft: `5px solid ${pillar.color}`,
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          background: pillar.color + '12',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>{pillar.icon}</span>
            <div>
              <div style={{ color: pillar.color, fontWeight: 'bold', fontSize: '18px', lineHeight: 1.2 }}>{pillar.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Indicateur de score</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color, lineHeight: 1 }}>{score.toFixed(1)}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>/10 — <span style={{ color }}>{verdictLabel}</span></div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '24px', padding: '0 4px', lineHeight: 1 }}
            >✕</button>
          </div>
        </div>

        {/* Métriques */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '2px' }}>
            Indicateurs pris en compte
          </div>
          {pillar.metrics.map(m => (
            <div key={m.name} style={{
              padding: '12px 14px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}>
              <div style={{ color: 'var(--text1)', fontWeight: '600', fontSize: '13px', marginBottom: '5px' }}>{m.name}</div>
              <div style={{ color: 'var(--text3)', fontSize: '12px', lineHeight: '1.6' }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ScoreDashboard({ scores, sector, companyCount, beta, marketCap, isBeginnerMode, onShowAdvanced }) {
  const [showModal,      setShowModal]      = useState(false);
  const [activePillar,   setActivePillar]   = useState(null);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [btnHover,       setBtnHover]       = useState(false);
  const { isMobile }    = useBreakpoint();
  if (!scores) return null;

  // Actif non-scorable (indice, crypto, matière première)
  if (scores.is_scorable === false) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '12px', padding: '32px 24px', textAlign: 'center',
        backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: '12px', marginBottom: '28px',
      }}>
        <span style={{ fontSize: '32px' }}>📊</span>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text1)' }}>
          Scoring fondamental non applicable
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text3)', maxWidth: '480px', lineHeight: '1.6' }}>
          Le scoring Boursicot est conçu pour les actions d'entreprises cotées.
          Il nécessite des données financières (bilans, comptes de résultat, ratios de valorisation)
          qui ne sont pas disponibles pour les <strong>indices</strong>, <strong>cryptomonnaies</strong> et <strong>matières premières</strong>.
        </div>
      </div>
    );
  }

  const pillarByKey = Object.fromEntries(PILLARS.map(p => [p.key, p]));
  const openPillar  = (key, score) => setActivePillar({ pillar: pillarByKey[key], score });

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
    'Profil Fort': COLOR_UP, 'Profil Solide': COLOR_UP,
    'Profil Neutre': COLOR_NEUTRAL,
    'Profil Prudent': COLOR_DOWN, 'Profil Fragile': COLOR_DOWN,
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

  // ── Blocs réutilisables (desktop + slides mobiles) ───────────────────────────

  const colLeft = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', padding: '20px 12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase' }}>
        Piliers Financiers
      </div>
      <CircularGauge score={s.health} label="Santé" icon="❤️" size={110} onPillarClick={() => openPillar('health', s.health)} />
      <div style={{ display: 'flex', gap: '36px' }}>
        <CircularGauge score={s.valuation} label="Valorisation" icon="📊" size={110} onPillarClick={() => openPillar('valuation', s.valuation)} />
        <CircularGauge score={s.growth}    label="Croissance"   icon="📈" size={110} onPillarClick={() => openPillar('growth',    s.growth)}    />
      </div>
    </div>
  );

  const colCenter = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '10px', padding: '20px',
    }}>
      {/* Zone cliquable : Label + Gauge + Verdict */}
      <div
        onClick={() => setShowGlobalModal(true)}
        title="Voir le détail de la Note Globale"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          cursor: 'pointer', borderRadius: '10px', padding: '8px 12px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase' }}>
          Note Globale
        </div>
        <MasterGauge score={globalScore} size={104} strokeWidth={10} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: verdictColor, lineHeight: 1, marginBottom: '3px' }}>
            {scores.verdict}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', opacity: 0.75, lineHeight: '1.4' }}>
            Synthèse de 60+ indicateurs<br />(Santé, Valo, Croissance…)
          </div>
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

      {/* Bouton Voir métriques détaillées */}
      {onShowAdvanced && isBeginnerMode && (
        <button
          onClick={onShowAdvanced}
          style={{
            marginTop: '4px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--text2)',
            fontSize: '12px', fontWeight: '500',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#2962FF';
            e.currentTarget.style.color = '#2962FF';
            e.currentTarget.style.backgroundColor = '#2962FF11';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text2)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ fontSize: '13px' }}>📊</span>
          Voir les métriques détaillées
          <span style={{ fontSize: '10px', opacity: 0.6 }}>↓</span>
        </button>
      )}

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
  );

  const colRight = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', padding: '20px 12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase' }}>
        Piliers Stratégiques
      </div>
      <CircularGauge score={s.dividend} label="Dividende" icon="💰" size={110} onPillarClick={() => openPillar('dividend', s.dividend)} />
      <div style={{ display: 'flex', gap: '36px' }}>
        <CircularGauge score={s.momentum}   label="Momentum"   icon="⚡"  size={110} onPillarClick={() => openPillar('momentum',   s.momentum)}   />
        <CircularGauge score={s.efficiency} label="Efficacité" icon="⚙️" size={110} onPillarClick={() => openPillar('efficiency', s.efficiency)} />
      </div>
    </div>
  );

  const colLegend = (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '14px',
      fontSize: '15px', color: 'var(--text3)',
      padding: isMobile ? '20px' : undefined,
      alignItems: isMobile ? 'center' : undefined,
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
        Définition des indicateurs
      </button>
    </div>
  );

  const disclaimer = (
    <div style={{
      textAlign: 'center', fontSize: '9px', color: 'var(--text3)', opacity: 0.55,
      letterSpacing: '0.02em', paddingTop: '10px', borderTop: '1px solid var(--border)',
      marginTop: '4px',
    }}>
      Scores indicatifs uniquement — ne constituent pas un conseil en investissement.
    </div>
  );

  const modals = (
    <>
      {showModal       && <MethodologyModal onClose={() => setShowModal(false)} sector={sector} />}
      {activePillar    && <GaugePillarModal pillar={activePillar.pillar} score={activePillar.score} onClose={() => setActivePillar(null)} />}
      {showGlobalModal && <GlobalScoreModal scores={s} globalScore={globalScore} verdictColor={verdictColor} onClose={() => setShowGlobalModal(false)} />}
    </>
  );

  // ── Mobile : carousel 3 slides ───────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: '12px', marginBottom: '28px', overflow: 'hidden',
        padding: '12px 0 16px',
      }}>
        <SwipeableContainer>
          {colLeft}
          {colCenter}
          <div>
            {colRight}
            <div style={{ borderTop: '1px solid var(--border)', margin: '0 12px' }} />
            {colLegend}
          </div>
        </SwipeableContainer>
        <div style={{ padding: '0 16px' }}>{disclaimer}</div>
        {modals}
      </div>
    );
  }

  // ── Desktop : grille 4 colonnes ──────────────────────────────────────────────
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
        <CircularGauge score={s.health} label="Santé" icon="❤️" size={110} onPillarClick={() => openPillar('health', s.health)} />
        <div style={{ display: 'flex', gap: '36px' }}>
          <CircularGauge score={s.valuation} label="Valorisation" icon="📊" size={110} onPillarClick={() => openPillar('valuation', s.valuation)} />
          <CircularGauge score={s.growth}    label="Croissance"   icon="📈" size={110} onPillarClick={() => openPillar('growth',    s.growth)}    />
        </div>
      </div>

      {/* ── Col 2 : Master Gauge + Verdict + Complexité + Contexte (centre) ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '0 20px',
        borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
      }}>
        {/* Zone cliquable : Label + Gauge + Verdict */}
        <div
          onClick={() => setShowGlobalModal(true)}
          title="Voir le détail de la Note Globale"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            cursor: 'pointer', borderRadius: '10px', padding: '8px 12px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em',
            color: 'var(--text3)', textTransform: 'uppercase',
          }}>
            Note Globale
          </div>

          <MasterGauge score={globalScore} size={104} strokeWidth={10} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: verdictColor, lineHeight: 1, marginBottom: '3px' }}>
              {scores.verdict}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', opacity: 0.75, lineHeight: '1.4' }}>
              Synthèse de 60+ indicateurs<br />(Santé, Valo, Croissance…)
            </div>
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

        {/* Bouton Voir métriques détaillées */}
        {onShowAdvanced && isBeginnerMode && (
          <button
            onClick={onShowAdvanced}
            style={{
              marginTop: '4px',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text2)',
              fontSize: '12px', fontWeight: '500',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#2962FF';
              e.currentTarget.style.color = '#2962FF';
              e.currentTarget.style.backgroundColor = '#2962FF11';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text2)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '13px' }}>📊</span>
            Voir les métriques détaillées
            <span style={{ fontSize: '10px', opacity: 0.6 }}>↓</span>
          </button>
        )}

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
        <CircularGauge score={s.dividend} label="Dividende" icon="💰" size={110} onPillarClick={() => openPillar('dividend', s.dividend)} />
        <div style={{ display: 'flex', gap: '36px' }}>
          <CircularGauge score={s.momentum}   label="Momentum"   icon="⚡"  size={110} onPillarClick={() => openPillar('momentum',   s.momentum)}   />
          <CircularGauge score={s.efficiency} label="Efficacité" icon="⚙️" size={110} onPillarClick={() => openPillar('efficiency', s.efficiency)} />
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
          Définition des indicateurs
        </button>
      </div>

      {showModal       && <MethodologyModal onClose={() => setShowModal(false)} sector={sector} />}
      {activePillar    && <GaugePillarModal pillar={activePillar.pillar} score={activePillar.score} onClose={() => setActivePillar(null)} />}
      {showGlobalModal && <GlobalScoreModal scores={s} globalScore={globalScore} verdictColor={verdictColor} onClose={() => setShowGlobalModal(false)} />}

      {/* DISCLAIMER MIF2 — pleine largeur sous la grille de scores */}
      <div style={{
        gridColumn: '1 / -1',
        textAlign: 'center', fontSize: '9px', color: 'var(--text3)', opacity: 0.55,
        letterSpacing: '0.02em', paddingTop: '10px', borderTop: '1px solid var(--border)',
        marginTop: '4px',
      }}>
        Scores indicatifs uniquement — ne constituent pas un conseil en investissement.
      </div>
    </div>
  );
}
