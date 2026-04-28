import { createPortal } from 'react-dom';
import { PILLARS } from '../../constants/pillars';

const COLOR_UP      = '#26a69a';
const COLOR_NEUTRAL = '#ff9800';

export default function MethodologyModal({ onClose, sector }) {
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
            <div style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: `4px solid ${COLOR_UP}` }}>
              <span style={{ fontSize: '11px', color: COLOR_UP, textTransform: 'uppercase', fontWeight: 'bold' }}>Le Verdict : Une vue d'ensemble</span>
              <p style={{ fontSize: '12px', color: 'var(--text2)', margin: '8px 0 0', lineHeight: '1.6' }}>
                Ce n'est pas une recommandation d'achat, mais une note de synthèse pondérée. Elle agrège plus de{' '}
                <strong style={{ color: 'var(--text1)' }}>60 métriques financières</strong> pour déterminer si l'entreprise est globalement performante par rapport à ses pairs
                {sector ? <> du secteur <strong style={{ color: 'var(--text1)' }}>{sector}</strong></> : ' de son secteur'}.
              </p>
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: `4px solid ${COLOR_NEUTRAL}` }}>
              <span style={{ fontSize: '11px', color: COLOR_NEUTRAL, textTransform: 'uppercase', fontWeight: 'bold' }}>La Complexité : Votre niveau de vigilance</span>
              <p style={{ fontSize: '12px', color: 'var(--text2)', margin: '8px 0 0', lineHeight: '1.6' }}>
                Ce badge n'évalue pas la qualité de l'entreprise, mais la <strong style={{ color: 'var(--text1)' }}>difficulté de son analyse</strong>. Une complexité "Avancée" signifie souvent que l'action est très volatile (Beta élevé) ou plus sensible aux mouvements de marché (petite capitalisation), nécessitant une surveillance plus étroite.
              </p>
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
