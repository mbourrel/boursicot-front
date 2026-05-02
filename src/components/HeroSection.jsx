import { useBreakpoint } from '../hooks/useBreakpoint';
import { captureEvent } from '../utils/analytics';

export default function HeroSection({ setViewMode }) {
  const { isMobile, isDesktop } = useBreakpoint();

  const handleCTA = () => {
    captureEvent('hero_cta_clicked');
    setViewMode('screener');
  };

  // Tailles typographiques selon breakpoint
  const h1Size  = isDesktop ? '72px' : isMobile ? '36px' : '54px';
  const h2Size  = isDesktop ? '54px' : isMobile ? '27px' : '40px';

  return (
    <section
      style={{
        minHeight: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: isMobile ? '48px 24px 56px' : isDesktop ? '80px 64px' : '64px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow décoratif — bleu très atténué, fond uniquement */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '380px' : '800px',
          height: isMobile ? '380px' : '800px',
          background: 'radial-gradient(circle, rgba(41,98,255,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />

      {/* Tagline — badge pill au-dessus du H1 */}
      <p
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '11px' : '13px',
          color: '#2962FF',
          fontWeight: '700',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          margin: '0 0 28px',
          padding: isMobile ? '5px 14px' : '6px 18px',
          backgroundColor: 'rgba(41,98,255,0.08)',
          borderRadius: '100px',
          border: '1px solid rgba(41,98,255,0.22)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: '10px' }}>✦</span>
        Votre intuition, validée par les chiffres.
      </p>

      {/* H1 */}
      <h1
        style={{
          fontSize: h1Size,
          fontWeight: '800',
          lineHeight: '1.07',
          color: 'var(--text1)',
          margin: '0',
          letterSpacing: isMobile ? '-0.01em' : '-0.03em',
          maxWidth: isDesktop ? '920px' : '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Le bon sens boursier,
      </h1>

      {/* H2 — ton atténué pour hiérarchiser sous le H1 */}
      <h2
        style={{
          fontSize: h2Size,
          fontWeight: '700',
          lineHeight: '1.15',
          color: 'var(--text3)',
          margin: isMobile ? '6px 0 40px' : '8px 0 52px',
          letterSpacing: isMobile ? '-0.01em' : '-0.025em',
          maxWidth: isDesktop ? '820px' : '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        accessible sans Master en Finance.
      </h2>

      {/* CTA principal */}
      <button
        onClick={handleCTA}
        style={{
          backgroundColor: '#2962FF',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          padding: isMobile ? '15px 30px' : '18px 44px',
          fontSize: isMobile ? '15px' : '17px',
          fontWeight: '700',
          cursor: 'pointer',
          minHeight: '52px',   // min 44px exigé + confort supplémentaire
          letterSpacing: '0.02em',
          boxShadow: '0 8px 32px rgba(41,98,255,0.38)',
          transition: 'transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease',
          position: 'relative',
          zIndex: 1,
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#1e4fd8';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 14px 44px rgba(41,98,255,0.52)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#2962FF';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(41,98,255,0.38)';
        }}
      >
        Analyser ma première action →
      </button>

      {/* Indicateurs de confiance */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginTop: isMobile ? '28px' : '36px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {[
          { icon: '🎓', label: 'Zéro jargon' },
          { icon: '📊', label: '64 actifs analysés' },
          { icon: '🆓', label: '100% gratuit' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: isMobile ? '11px' : '12px',
              color: 'var(--text3)',
              backgroundColor: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: isMobile ? '5px 12px' : '5px 14px',
            }}
          >
            {icon} {label}
          </span>
        ))}
      </div>
    </section>
  );
}
