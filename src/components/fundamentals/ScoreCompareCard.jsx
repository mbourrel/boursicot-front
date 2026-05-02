import { memo } from 'react';

const scoreColor = s => s >= 7 ? '#26a69a' : s >= 4 ? '#ff9800' : '#ef5350';

const VERDICT_COLORS = {
  'Profil Fort':    '#26a69a',
  'Profil Solide':  '#26a69a',
  'Profil Neutre':  '#ff9800',
  'Profil Prudent': '#ef5350',
  'Profil Fragile': '#ef5350',
};

const SCORE_METRICS = [
  { label: 'Santé',        icon: '❤️',  key: 'health'     },
  { label: 'Valorisation', icon: '📊',  key: 'valuation'  },
  { label: 'Croissance',   icon: '📈',  key: 'growth'     },
  { label: 'Dividende',    icon: '💰',  key: 'dividend'   },
  { label: 'Momentum',     icon: '⚡',  key: 'momentum'   },
  { label: 'Efficacité',   icon: '⚙️', key: 'efficiency' },
];

function ScoreCompareCard({ sym, color, name, scores }) {
  const globalScore  = scores?.global_score ?? null;
  const verdictColor = VERDICT_COLORS[scores?.verdict] ?? 'var(--text3)';

  return (
    <div style={{
      flex: 1, minWidth: '160px',
      backgroundColor: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      borderTop: `3px solid ${color}`,
      padding: '14px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color, marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name || sym}
      </div>

      {scores ? (
        <>
          {globalScore != null && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', marginBottom: '10px',
              background: scoreColor(globalScore) + '18',
              border: `1px solid ${scoreColor(globalScore)}44`,
              borderRadius: '7px',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 'bold' }}>Note Globale</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {scores.verdict && (
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: verdictColor }}>{scores.verdict}</span>
                )}
                <span style={{ fontSize: '14px', fontWeight: '900', color: scoreColor(globalScore) }}>
                  {globalScore.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SCORE_METRICS.map(({ label, icon, key }) => {
              const value = scores[key] ?? 5;
              const c     = scoreColor(value);
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '12px' }}>{icon}</span>{label}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: c }}>{value.toFixed(1)}</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(value / 10) * 100}%`, height: '100%', background: c, borderRadius: '2px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text3)', fontSize: '11px' }}>Scores indisponibles</div>
      )}
    </div>
  );
}

export default memo(ScoreCompareCard);
