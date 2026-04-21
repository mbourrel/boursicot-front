import { useAuth } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const GUEST_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function GuestBanner({ timeLeft }) {
  const urgent = timeLeft <= 60;
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
        backgroundColor: urgent ? '#1a0a00' : 'var(--bg3)',
        border: `1px solid ${urgent ? '#f59e0b' : hovered ? '#2962FF' : 'var(--border)'}`,
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        cursor: 'default',
      }}
    >
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '10px',
        color: urgent ? '#f59e0b' : 'var(--text3)',
      }}>
        <span>{urgent ? '⚠' : '👤'}</span>
        <span>Session invité — expire dans <strong>{formatTime(timeLeft)}</strong></span>
      </div>

      {hovered && (
        <div
          onClick={() => navigate('/login')}
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            color: '#2962FF',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2962FF15'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Se connecter pour une session illimitée →
        </div>
      )}
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);

  const guestTs = sessionStorage.getItem('guestSession');
  const isGuest = !!guestTs;

  useEffect(() => {
    if (!isGuest) return;

    const tick = () => {
      const elapsed = Date.now() - parseInt(guestTs);
      const remaining = Math.ceil((GUEST_DURATION_MS - elapsed) / 1000);
      if (remaining <= 0) {
        sessionStorage.removeItem('guestSession');
        navigate('/login', { replace: true });
        return;
      }
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isGuest, guestTs, navigate]);

  if (!isLoaded && !isGuest) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg0)' }}>
        <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Chargement...</div>
      </div>
    );
  }

  if (!isSignedIn && !isGuest) return <Navigate to="/login" replace />;

  return (
    <>
      {isGuest && timeLeft !== null && <GuestBanner timeLeft={timeLeft} />}
      {children}
    </>
  );
}
