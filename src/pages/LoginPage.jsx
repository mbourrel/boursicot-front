import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  const continueAsGuest = () => {
    sessionStorage.setItem('guestSession', Date.now().toString());
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg0)', gap: '16px' }}>
      <SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl="/" />
      <button
        onClick={continueAsGuest}
        style={{
          padding: '10px 24px',
          backgroundColor: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text3)',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2962FF'; e.currentTarget.style.color = 'var(--text1)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
      >
        Continuer sans compte →
      </button>
    </div>
  );
}
