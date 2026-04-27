import { useState } from 'react';
import { optInTracking } from '../utils/analytics';

const CONSENT_KEY = 'boursicot_analytics_consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(CONSENT_KEY));

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    optInTracking();
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      backgroundColor: 'var(--bg1, #1a1a2e)',
      borderTop: '1px solid var(--border, #2a2a3e)',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', flexWrap: 'wrap',
    }}>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text2, #9ca3af)', flex: 1, minWidth: '240px' }}>
        Nous utilisons des cookies d'analyse (PostHog) pour comprendre comment vous utilisez Boursicot et améliorer l'app.
        Vos données restent sur des serveurs EU et ne sont jamais revendues.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: '7px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            backgroundColor: 'transparent', border: '1px solid var(--border, #2a2a3e)',
            borderRadius: '6px', color: 'var(--text3, #6b7280)',
          }}
        >
          Refuser
        </button>
        <button
          onClick={accept}
          style={{
            padding: '7px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            backgroundColor: '#2962FF', border: 'none',
            borderRadius: '6px', color: 'white',
          }}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
