import React, { useState } from 'react';

// ── Matrice statique phase → actifs ───────────────────────────────────────
const PHASE_MATRIX = {
  Expansion: [
    { label: 'Tech / Actions Croissance', status: 'strong',  reason: 'Les taux bas et la croissance forte dopent les valorisations des entreprises à fort potentiel. Les investisseurs acceptent de payer une prime pour la croissance future.' },
    { label: 'Bitcoin / Crypto',          status: 'strong',  reason: 'Les liquidités abondantes alimentent l\'appétit pour le risque. Le Bitcoin profite aussi de la faiblesse du dollar, souvent corrélée à l\'expansion.' },
    { label: 'Dollar (DXY)',              status: 'weak',    reason: 'En phase d\'expansion, les capitaux fuient vers les marchés émergents et les actifs risqués, ce qui affaiblit mécaniquement le dollar.' },
    { label: 'Obligations d\'État',       status: 'neutral', reason: 'Les taux restent stables ou légèrement haussiers, ce qui limite le potentiel des obligations, sans les pénaliser sévèrement.' },
    { label: 'Matières premières',        status: 'neutral', reason: 'La demande augmente avec la croissance, mais l\'inflation restant contenue, les matières premières ne surperforment pas encore.' },
  ],
  Surchauffe: [
    { label: 'Matières premières',        status: 'strong',  reason: 'L\'inflation galopante profite directement aux producteurs de ressources physiques (pétrole, métaux, agricole). C\'est leur heure de gloire.' },
    { label: 'Énergie / Banques (Value)', status: 'strong',  reason: 'Les banques profitent de la hausse des taux (meilleure marge nette d\'intérêt). L\'énergie bénéficie de la forte demande et de l\'inflation.' },
    { label: 'Obligations',              status: 'weak',    reason: 'La hausse des taux fait chuter mécaniquement les prix des obligations existantes (relation inverse taux/prix).' },
    { label: 'Tech / Croissance',        status: 'neutral', reason: 'Les valorisations commencent à souffrir de la hausse des taux (taux d\'actualisation plus élevé), mais la croissance économique soutient encore les résultats.' },
    { label: 'Bitcoin / Crypto',         status: 'neutral', reason: 'Le resserrement monétaire pèse sur les actifs spéculatifs, mais la phase reste porteuse économiquement. Signal mixte.' },
  ],
  Contraction: [
    { label: 'Dollar / Cash',            status: 'strong',  reason: 'En stagflation, le cash est roi. Le dollar s\'apprécie car les banques centrales ne peuvent pas baisser les taux sans relancer l\'inflation.' },
    { label: 'Or',                       status: 'strong',  reason: 'L\'or performe en période d\'incertitude et d\'inflation persistante. Il n\'a pas de contrepartie de crédit et protège le pouvoir d\'achat réel.' },
    { label: 'Actions Croissance',       status: 'weak',    reason: 'Double peine : taux élevés (valorisations comprimées) et ralentissement économique (résultats en baisse). Phase la plus difficile pour la tech.' },
    { label: 'Matières premières',       status: 'weak',    reason: 'Paradoxalement, même si l\'inflation reste haute, le ralentissement de la demande finit par faire chuter les prix des matières premières.' },
    { label: 'Bitcoin / Crypto',         status: 'neutral', reason: 'Le Bitcoin peut servir de valeur refuge contre la dévaluation monétaire, mais la fuite vers le cash limite sa performance. Signal incertain.' },
  ],
  Récession: [
    { label: 'Obligations d\'État',      status: 'strong',  reason: 'C\'est leur meilleure phase : la baisse des taux fait monter les prix des obligations. Les banques centrales coupent les taux pour relancer l\'économie.' },
    { label: 'Actions Défensives',       status: 'neutral', reason: 'Secteurs à dividendes stables (santé, utilities, agroalimentaire) : résistent mieux que le marché global, mais ne surperforment pas non plus.' },
    { label: 'Matières premières',       status: 'weak',    reason: 'La chute de la demande mondiale fait s\'effondrer les prix des matières premières : pétrole, métaux industriels, agricole.' },
    { label: 'Actions Croissance',       status: 'weak',    reason: 'Les résultats d\'entreprise chutent avec l\'activité économique. Le rallye viendra, mais seulement en sortie de récession.' },
    { label: 'Or',                       status: 'neutral', reason: 'L\'or bénéficie de l\'incertitude, mais la baisse de l\'inflation et la force du dollar limitent son potentiel haussier en pleine récession.' },
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

const PHASE_CONTEXT = {
  Expansion:   'La croissance accélère, l\'inflation est contenue et les banques centrales sont accommodantes. C\'est la phase idéale pour prendre du risque.',
  Surchauffe:  'La croissance reste forte mais l\'inflation s\'emballe, forçant les banques centrales à agir. La fin du cycle approche.',
  Contraction: 'Stagflation : la croissance ralentit mais l\'inflation résiste. Les banques centrales sont en impasse. Phase de défense absolue.',
  Récession:   'La demande s\'effondre, entraînant l\'inflation avec elle. Les banques centrales coupent les taux. Point bas avant la reprise.',
};

function AssetWindMatrix({ phase, loading }) {
  const [showInfo, setShowInfo] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState(null);

  const assets = PHASE_MATRIX[phase] ?? [];
  const phaseColor = PHASE_COLORS[phase] ?? '#8a919e';

  return (
    <div style={cardStyle}>
      {/* Titre + bouton info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #2B2B43', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#d1d4dc', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.06em' }}>
          VENTS PORTEURS PAR CLASSE D'ACTIFS
        </h3>
        <button
          onClick={() => setShowInfo(v => !v)}
          title="Comment lire cette matrice ?"
          style={{
            background: showInfo ? '#2962FF22' : 'transparent',
            border: `1px solid ${showInfo ? '#2962FF' : '#2B2B43'}`,
            color: showInfo ? '#2962FF' : '#8a919e',
            borderRadius: '50%', width: '22px', height: '22px',
            cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}
        >
          i
        </button>
      </div>

      {/* Panneau d'explication générale */}
      {showInfo && (
        <div style={infoPanelStyle}>
          <div style={{ color: '#d1d4dc', fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>
            Comment lire cette matrice ?
          </div>
          <p style={{ ...infoTextStyle, marginBottom: '10px' }}>
            Cette matrice est inspirée du modèle de cycle économique de <strong style={{ color: '#d1d4dc' }}>Fidelity Investments</strong> et
            de la théorie des <strong style={{ color: '#d1d4dc' }}>All Weather</strong> de Ray Dalio. Elle associe chaque phase du cycle
            économique aux classes d'actifs historiquement favorisées ou pénalisées.
          </p>
          <p style={{ ...infoTextStyle, marginBottom: '10px' }}>
            Les positionnements sont basés sur les performances médianes observées depuis 1970. Ce ne sont pas des
            recommandations d'investissement, mais des biais statistiques à connaître pour orienter son allocation.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8a919e', padding: '8px 10px', backgroundColor: '#131722', borderRadius: '6px', border: '1px solid #2B2B43' }}>
            <span>💡</span>
            <span>Cliquez sur chaque ligne pour voir l'explication détaillée du positionnement.</span>
          </div>
        </div>
      )}

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
          {/* Contexte de phase */}
          <div style={{ marginBottom: '14px', fontSize: '13px', lineHeight: '1.5' }}>
            <span style={{ color: '#8a919e' }}>En phase de </span>
            <span style={{ color: phaseColor, fontWeight: 'bold' }}>{phase}</span>
            <span style={{ color: '#8a919e' }}>  — </span>
            <span style={{ color: '#8a919e' }}>{PHASE_CONTEXT[phase]}</span>
          </div>

          {/* Tableau avec raisons dépliables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {assets.map(({ label, status, reason }) => {
              const cfg = STATUS[status];
              const isOpen = expandedAsset === label;
              return (
                <div key={label}>
                  <div
                    onClick={() => setExpandedAsset(isOpen ? null : label)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', backgroundColor: cfg.bg,
                      border: `1px solid ${isOpen ? cfg.color : cfg.border}`,
                      borderRadius: isOpen ? '8px 8px 0 0' : '8px',
                      cursor: 'pointer', transition: 'border-color 0.2s',
                    }}
                  >
                    <span style={{ color: '#d1d4dc', fontSize: '13px' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      <span style={{ color: '#8a919e', fontSize: '11px', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{
                      padding: '10px 14px', backgroundColor: `${cfg.bg}`,
                      border: `1px solid ${cfg.color}`, borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                    }}>
                      <p style={{ margin: 0, color: '#b0b8c4', fontSize: '12px', lineHeight: '1.6' }}>
                        {reason}
                      </p>
                    </div>
                  )}
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
const infoPanelStyle = {
  backgroundColor: '#0d1117', border: '1px solid #2B2B43', borderRadius: '8px',
  padding: '14px 16px', marginBottom: '16px',
};
const infoTextStyle = {
  margin: 0, color: '#8a919e', fontSize: '11px', lineHeight: '1.6',
};

export default AssetWindMatrix;
