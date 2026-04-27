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
      { name: 'Marge Nette',           desc: "Indique la part de profit réel sur chaque euro vendu." },
      { name: 'ROE',                   desc: "Capacité de l'entreprise à générer du profit avec l'argent des actionnaires." },
      { name: 'Dette / Fonds Propres', desc: "Mesure si l'entreprise utilise trop d'emprunts par rapport à son propre capital." },
      { name: 'Ratio de Liquidité',    desc: 'Capacité à payer ses factures et dettes urgentes sans difficulté.' },
    ],
  },
  {
    icon: '📊',
    title: 'Valorisation',
    color: '#2962FF',
    metrics: [
      { name: 'PER vs secteur', desc: "Compare le prix de l'action aux bénéfices. Un PER bas peut indiquer une action bon marché." },
      { name: 'Forward PE',     desc: "Estimation du prix par rapport aux bénéfices attendus l'année prochaine." },
    ],
  },
  {
    icon: '📈',
    title: 'Croissance',
    color: COLOR_NEUTRAL,
    metrics: [
      { name: "Chiffre d'Affaires", desc: "Évolution de l'activité commerciale sur les 5 dernières années." },
      { name: 'Bénéfices (EPS)',    desc: "Capacité de l'entreprise à faire progresser ses profits réels." },
    ],
  },
];

export default function MethodologyModal({ onClose }) {
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
          borderRadius: '12px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── En-tête ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '16px' }}>
              Comprendre les Scores Boursicot
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', fontSize: '24px', padding: '0 4px', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Corps ── */}
        <div style={{ padding: '20px' }}>

          {/* Introduction */}
          <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', marginTop: 0, marginBottom: '20px' }}>
            Nos scores (de <strong style={{ color: 'var(--text1)' }}>0 à 10</strong>) ne sont pas des conseils d'achat. Ils mesurent la performance d'une entreprise{' '}
            <strong style={{ color: 'var(--text1)' }}>relativement à son secteur</strong> (ex: Tech, Santé, Énergie).
          </p>

          {/* Verdict & Complexité */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Le Verdict</span>
              <p style={{ fontSize: '12px', color: 'var(--text2)', margin: '4px 0 0' }}>Conclusion globale basée sur la moyenne pondérée des 3 piliers.</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 'bold' }}>La Complexité</span>
              <p style={{ fontSize: '12px', color: 'var(--text2)', margin: '4px 0 0' }}>Dépend de la volatilité (Beta) et de la taille de l'entreprise (Market Cap).</p>
            </div>
          </div>

          {/* Piliers en grille 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {PILLARS.map(pillar => (
              <div key={pillar.title} style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                borderLeft: `4px solid ${pillar.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{pillar.icon}</span>
                  <span style={{ color: pillar.color, fontWeight: 'bold', fontSize: '14px' }}>{pillar.title}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pillar.metrics.map(m => (
                    <div key={m.name} style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text1)', fontWeight: '600', minWidth: '140px', flexShrink: 0 }}>{m.name}</span>
                      <span style={{ color: 'var(--text3)', lineHeight: '1.4' }}>{m.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Avertissement Biais de Groupe */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: COLOR_NEUTRAL + '15',
            border: `1px solid ${COLOR_NEUTRAL}55`,
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span style={{ color: COLOR_NEUTRAL, fontWeight: 'bold', fontSize: '12px' }}>
                Biais de groupe (Peer Group)
              </span>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              Si un secteur contient peu d'entreprises dans notre base (ex: <em>Basic Materials</em>), le score est plus sensible. Une note de 4/10 peut signifier que l'entreprise est moins performante que son unique concurrent direct en base, et non qu'elle est en difficulté absolue.
            </p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
