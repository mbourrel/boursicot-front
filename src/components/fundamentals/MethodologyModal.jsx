import { createPortal } from 'react-dom';

const COLOR_UP      = '#26a69a';
const COLOR_NEUTRAL = '#ff9800';
const COLOR_DOWN    = '#ef5350';

const PILLARS = [
  {
    icon: '❤️',
    title: 'Santé Financière',
    color: COLOR_UP,
    metrics: [
      { name: 'Marge Nette',           desc: "Part des bénéfices nets dans le chiffre d'affaires" },
      { name: 'ROE',                   desc: 'Rentabilité des capitaux propres' },
      { name: 'Dette / Fonds Propres', desc: "Niveau d'endettement relatif aux fonds propres" },
      { name: 'Ratio de Liquidité',    desc: 'Capacité à couvrir les dettes à court terme' },
    ],
  },
  {
    icon: '📊',
    title: 'Valorisation',
    color: '#2962FF',
    metrics: [
      { name: 'PER vs secteur', desc: 'Price-to-Earnings comparé à la moyenne sectorielle' },
      { name: 'Forward PE',     desc: 'PER basé sur les bénéfices futurs attendus' },
    ],
  },
  {
    icon: '📈',
    title: 'Croissance',
    color: COLOR_NEUTRAL,
    metrics: [
      { name: "Évolution CA (YoY)",         desc: "Variation annuelle du chiffre d'affaires" },
      { name: 'Évolution Bénéfices (YoY)',  desc: 'Variation annuelle du résultat net' },
    ],
  },
];

export default function MethodologyModal({ onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── En-tête ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0,
          background: 'var(--bg2)',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>ℹ️</span>
            <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '15px' }}>
              Méthodologie des Scores Boursicot
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', fontSize: '20px', padding: '0 4px', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Corps ── */}
        <div style={{ padding: '20px' }}>

          {/* Introduction */}
          <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: '1.7', marginTop: 0, marginBottom: '16px' }}>
            Les notes Boursicot (de <strong style={{ color: 'var(--text1)' }}>0 à 10</strong>) sont{' '}
            <strong style={{ color: 'var(--text1)' }}>relatives aux moyennes sectorielles</strong> de notre base de données.
            Chaque entreprise est évaluée par rapport aux autres acteurs de son secteur, afin de mettre ses performances en perspective.
          </p>

          {/* Échelle de lecture */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { color: COLOR_UP,      label: '≥ 7 — Favorable' },
              { color: COLOR_NEUTRAL, label: '4 à 7 — Neutre' },
              { color: COLOR_DOWN,    label: '< 4 — Défavorable' },
            ].map(({ color, label }) => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '6px',
                backgroundColor: color + '22', border: `1px solid ${color}55`,
                fontSize: '12px', color, fontWeight: '600',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>

          {/* Piliers */}
          {PILLARS.map(pillar => (
            <div key={pillar.title} style={{
              marginBottom: '12px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              borderLeft: `3px solid ${pillar.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px' }}>{pillar.icon}</span>
                <span style={{ color: pillar.color, fontWeight: 'bold', fontSize: '13px' }}>{pillar.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pillar.metrics.map(m => (
                  <div key={m.name} style={{ display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text1)', fontWeight: '600', minWidth: '170px', flexShrink: 0 }}>{m.name}</span>
                    <span style={{ color: 'var(--text3)' }}>{m.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Avertissement biais de groupe */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: COLOR_NEUTRAL + '15',
            border: `1px solid ${COLOR_NEUTRAL}55`,
            borderRadius: '8px',
            borderLeft: `3px solid ${COLOR_NEUTRAL}`,
            marginTop: '4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span style={{ color: COLOR_NEUTRAL, fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Biais de groupe de pairs
              </span>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: '1.65', margin: 0 }}>
              Si un secteur contient peu d'entreprises dans notre base, la comparaison est plus sensible aux valeurs extrêmes.
              Une note élevée peut refléter une vraie surperformance, ou simplement l'absence de concurrents comparables.
              Nous recommandons de croiser ces scores avec une analyse qualitative du secteur concerné.
            </p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
