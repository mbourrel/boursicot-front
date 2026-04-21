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
          padding: '11px 28px',
          backgroundColor: 'transparent',
          border: '1px solid #2962FF',
          borderRadius: '6px',
          color: '#2962FF',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2962FF20'; e.currentTarget.style.color = '#5b8cff'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#2962FF'; }}
      >
        Continuer sans compte →
      </button>
    </div>
  );
}
