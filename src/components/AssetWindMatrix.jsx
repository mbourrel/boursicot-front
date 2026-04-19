import React from 'react';

// ── Matrice statique phase → actifs ───────────────────────────────────────
const PHASE_MATRIX = {
  Expansion: [
    { label: 'Tech / Actions Croissance', status: 'strong'  },
    { label: 'Bitcoin / Crypto',          status: 'strong'  },
    { label: 'Dollar (DXY)',              status: 'weak'    },
    { label: 'Obligations d\'État',       status: 'neutral' },
    { label: 'Matières premières',        status: 'neutral' },
  ],
  Surchauffe: [
    { label: 'Matières premières',        status: 'strong'  },
    { label: 'Énergie / Banques (Value)', status: 'strong'  },
    { label: 'Obligations',              status: 'weak'    },
    { label: 'Tech / Croissance',        status: 'neutral' },
    { label: 'Bitcoin / Crypto',         status: 'neutral' },
  ],
  Contraction: [
    { label: 'Dollar / Cash',            status: 'strong'  },
    { label: 'Or',                       status: 'strong'  },
    { label: 'Actions Croissance',       status: 'weak'    },
    { label: 'Matières premières',       status: 'weak'    },
    { label: 'Bitcoin / Crypto',         status: 'neutral' },
  ],
  Récession: [
    { label: 'Obligations d\'État',      status: 'strong'  },
    { label: 'Actions Défensives',       status: 'neutral' },
    { label: 'Matières premières',       status: 'weak'    },
    { label: 'Actions Croissance',       status: 'weak'    },
    { label: 'Or',                       status: 'neutral' },
  ],
};

const STATUS = {
  strong:  { color: '#26a69a', bg: '#26a69a1a', border: '#26a69a40', label: 'Favorable',   icon: '↑' },
  weak:    { color: '#ef5350', bg: '#ef53501a', border: '#ef535040', label: 'Défavorable',  icon: '↓' },
  neutral: { color: '#f59e0b', bg: '#f59e0b1a', border: '#f59e0b40', label: 'Neutre',       icon: '→' },
};

const PHASE_COLORS = {
  Expansion:   '#26a69a',
  Surchauffe:  '#ff9800',
  Contraction: '#ef5350',
  Récession:   '#2962FF',
};

function AssetWindMatrix({ phase, loading }) {
  const assets = PHASE_MATRIX[phase] ?? [];
  const phaseColor = PHASE_COLORS[phase] ?? '#8a919e';

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>VENTS PORTEURS PAR CLASSE D'ACTIFS</h3>

      {loading ? (
        <div style={{ color: '#8a919e', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
          Chargement…
        </div>
      ) : !phase ? (
        <div style={{ color: '#8a919e', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
          Phase indéterminée — données API indisponibles
        </div>
      ) : (
        <>
          {/* Résumé de phase */}
          <div style={{ marginBottom: '14px', fontSize: '13px', color: '#8a919e', lineHeight: '1.5' }}>
            En phase de{' '}
            <span style={{ color: phaseColor, fontWeight: 'bold' }}>{phase}</span>
            , les positionnements recommandés sont :
          </div>

          {/* Tableau */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {assets.map(({ label, status }) => {
              const cfg = STATUS[status];
              return (
                <div
                  key={label}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', backgroundColor: cfg.bg,
                    border: `1px solid ${cfg.border}`, borderRadius: '8px',
                  }}
                >
                  <span style={{ color: '#d1d4dc', fontSize: '13px' }}>{label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cfg.color, fontSize: '12px', fontWeight: 'bold' }}>
                    <span
                      style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '11px', fontWeight: 'bold', flexShrink: 0,
                      }}
                    >
                      {cfg.icon}
                    </span>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #2B2B43' }}>
            {Object.entries(STATUS).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8a919e' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
                {cfg.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#131722', padding: '20px', borderRadius: '12px', border: '1px solid #2B2B43',
};
const titleStyle = {
  margin: '0 0 14px', color: '#d1d4dc', fontSize: '13px', fontWeight: 'bold',
  letterSpacing: '0.06em', borderBottom: '1px solid #2B2B43', paddingBottom: '10px',
};

export default AssetWindMatrix;
