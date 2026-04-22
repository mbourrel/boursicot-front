import { useState } from 'react';

const MAX_RATE = 8;

function rateColor(rate) {
  if (rate === null || rate === undefined) return '#555';
  if (rate < 1)  return '#2962FF';
  if (rate < 3)  return '#26a69a';
  if (rate < 5)  return '#f59e0b';
  return '#ef5350';
}

function rateLabel(rate) {
  if (rate === null || rate === undefined) return '—';
  if (rate < 1)  return 'Accommodant';
  if (rate < 3)  return 'Neutre';
  if (rate < 5)  return 'Restrictif';
  return 'Très restrictif';
}

function GaugeBar({ rate }) {
  const pct   = Math.max(0, Math.min(100, ((rate ?? 0) / MAX_RATE) * 100));
  const color = rateColor(rate);
  return (
    <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg0)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: '4px',
        backgroundColor: color, transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function BankRow({ name, rate, last_update, stale }) {
  const color = rateColor(rate);
  const flag  = { 'Fed (US)': '🇺🇸', 'BCE': '🇪🇺', 'BoE (UK)': '🇬🇧', 'BoJ (Japon)': '🇯🇵' }[name] ?? '🏦';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '130px 1fr 70px 100px',
      alignItems: 'center', gap: '12px',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{flag}</span>
        <div>
          <span style={{ color: 'var(--text2)', fontSize: '13px', fontWeight: '600' }}>{name}</span>
          {stale && last_update && (
            <div style={{ fontSize: '9px', color: '#f59e0b', marginTop: '1px' }}>
              données · {last_update.slice(0, 7)}
            </div>
          )}
        </div>
      </div>
      <GaugeBar rate={rate} />
      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color, fontVariantNumeric: 'tabular-nums', opacity: stale ? 0.7 : 1 }}>
        {rate !== null && rate !== undefined ? `${rate.toFixed(2)}%` : '—'}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: '10px', padding: '2px 7px', borderRadius: '10px',
          backgroundColor: stale ? '#f59e0b22' : `${color}22`,
          color: stale ? '#f59e0b' : color,
          border: stale ? '1px solid #f59e0b44' : 'none',
          fontWeight: '600',
        }}>
          {stale ? `~${rateLabel(rate)}` : rateLabel(rate)}
        </span>
      </div>
    </div>
  );
}

export default function CentralBanksThermometer({ centralBanks, loading, error }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div style={{
      backgroundColor: 'var(--bg2)', borderRadius: '10px',
      border: '1px solid var(--border)', padding: '16px 20px',
    }}>
      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🌡️</span>
          <div>
            <div style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '14px' }}>
              Thermomètre de l'Économie
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '11px' }}>Taux directeurs des banques centrales</div>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          title="Comprendre cet indicateur"
          style={{
            background: showInfo ? 'var(--border)' : 'none',
            border: '1px solid var(--border)', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text3)',
            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >?</button>
      </div>

      {/* ── Info rétractable ── */}
      {showInfo && (
        <div style={{
          backgroundColor: 'var(--bg3)', borderRadius: '8px', padding: '14px 16px',
          marginBottom: '14px', borderLeft: '3px solid #f59e0b',
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.7',
        }}>
          <div style={{ color: 'var(--text2)', fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}>
            Comment fonctionnent les taux directeurs ?
          </div>
          <p style={{ margin: '0 0 10px' }}>
            Le taux directeur est le principal levier des banques centrales. En le relevant, elles
            renchérissent le coût du crédit — ce qui freine l'investissement, la consommation et
            l'inflation. En le baissant, elles stimulent l'activité mais risquent de créer des bulles d'actifs.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[
              { color: '#2962FF', range: '< 1%', label: 'Accommodant', desc: 'Politique ultra-stimulante. Typique des crises (2008–2015, COVID). Favorise actions, immobilier, crypto.' },
              { color: '#26a69a', range: '1–3%', label: 'Neutre', desc: 'Zone d\'équilibre théorique. La Fed estime le taux neutre à ~2,5%. Ni frein ni accélérateur.' },
              { color: '#f59e0b', range: '3–5%', label: 'Restrictif', desc: 'Frein délibéré à l\'économie. Entreprises endettées et immobilier sous pression. Réduire l\'inflation.' },
              { color: '#ef5350', range: '> 5%', label: 'Très restrictif', desc: 'Territoire rare depuis les années 80. Risque de récession élevé à 12–18 mois.' },
            ].map(z => (
              <div key={z.label} style={{
                backgroundColor: `${z.color}0D`, borderRadius: '6px',
                padding: '8px 10px', border: `1px solid ${z.color}33`,
              }}>
                <div style={{ color: z.color, fontWeight: '700', fontSize: '11px', marginBottom: '3px' }}>
                  {z.range} — {z.label}
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.5' }}>{z.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
            <span style={{ color: 'var(--text2)', fontWeight: '600' }}>Contexte actuel · </span>
            Après le cycle de hausse le plus rapide depuis 40 ans (2022–2023), la Fed et la BCE amorcent
            une normalisation prudente. La BoJ est une exception historique : elle sort à peine d'une
            décennie de taux négatifs après des années de déflation. La divergence Fed/BCE crée
            un différentiel de taux qui soutient structurellement le dollar face à l'euro.
          </div>
        </div>
      )}

      {/* ── Légende jauge ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', justifyContent: 'flex-end' }}>
        {[['< 1%', '#2962FF', 'Accommodant'], ['1–3%', '#26a69a', 'Neutre'], ['3–5%', '#f59e0b', 'Restrictif'], ['> 5%', '#ef5350', 'Très restrictif']].map(([range, color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text3)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: color, display: 'inline-block' }} />
            {range}
          </div>
        ))}
      </div>

      {/* ── Lignes banques ── */}
      {loading && (
        <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
          Chargement…
        </div>
      )}
      {error && (
        <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>
      )}
      {!loading && !error && centralBanks?.map(cb => (
        <BankRow key={cb.name} {...cb} />
      ))}

      {/* ── Échelle ── */}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text3)', paddingLeft: '142px', paddingRight: '172px' }}>
          {[0, 2, 4, 6, 8].map(v => <span key={v}>{v}%</span>)}
        </div>
      )}
    </div>
  );
}
