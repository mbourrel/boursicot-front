import { useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function WelcomeModal() {
  const { setProfile } = useProfile();
  const { isMobile }   = useBreakpoint();

  // ESC ou clic hors des cartes → Explorateur par défaut
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setProfile('explorateur');
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={() => setProfile('explorateur')}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg1)', borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: isMobile ? '24px 16px' : '40px 32px',
          maxWidth: '660px', width: isMobile ? '95%' : '100%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.65)',
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧭</div>
          <h2 style={{ color: 'var(--text1)', fontSize: '22px', margin: '0 0 10px', fontWeight: 'bold' }}>
            Bienvenue sur Boursicot Pro
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '14px', margin: 0, lineHeight: '1.7' }}>
            Choisissez votre profil pour personnaliser votre expérience.
            <br />Vous pourrez changer à tout moment depuis le menu en haut.
          </p>
        </div>

        {/* Cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <ProfileCard
            icon="🧭"
            title="Explorateur"
            subtitle="Je débute en bourse"
            features={[
              'Vue simplifiée et épurée',
              '5 indicateurs clés expliqués',
              'Graphique de prix simple',
              'Cycle économique mondial',
            ]}
            color="#26a69a"
            onClick={() => setProfile('explorateur')}
          />
          <ProfileCard
            icon="📈"
            title="Stratège"
            subtitle="J'analyse en profondeur"
            features={[
              'Toutes les métriques avancées',
              'Tableaux financiers historiques',
              'Graphique Trading (indicateurs)',
              'Analyse macro complète',
            ]}
            color="#2962FF"
            onClick={() => setProfile('stratege')}
          />
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '11px', marginTop: '20px', marginBottom: 0 }}>
          Cliquer ailleurs → Explorateur par défaut · Modifiable à tout moment
        </p>
      </div>
    </div>
  );
}

function ProfileCard({ icon, title, subtitle, features, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', cursor: 'pointer',
        backgroundColor: 'var(--bg2)',
        border: '2px solid var(--border)',
        borderRadius: '12px',
        padding: '24px 20px',
        width: '100%',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ color, fontWeight: 'bold', fontSize: '17px', marginBottom: '4px' }}>{title}</div>
      <div style={{ color: 'var(--text3)', fontSize: '12px', marginBottom: '16px' }}>{subtitle}</div>
      <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text3)', fontSize: '12px', lineHeight: '1.9' }}>
        {features.map(f => <li key={f}>{f}</li>)}
      </ul>
    </button>
  );
}
