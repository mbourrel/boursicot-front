import { useState } from 'react';

const MAX_RATE = 8; // borne haute de la jauge (%)

function rateColor(rate) {
  if (rate === null || rate === undefined) return '#555';
  if (rate < 1)  return '#2962FF'; // ultra-accommodant
  if (rate < 3)  return '#26a69a'; // accommodant
  if (rate < 5)  return '#f59e0b'; // restrictif
  return '#ef5350';                // très restrictif
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

function BankRow({ name, rate, last_update }) {
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
        <span style={{ color: 'var(--text2)', fontSize: '13px', fontWeight: '600' }}>{name}</span>
      </div>
      <GaugeBar rate={rate} />
      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color, fontVariantNumeric: 'tabular-nums' }}>
        {rate !== null && rate !== undefined ? `${rate.toFixed(2)}%` : '—'}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: '10px', padding: '2px 7px', borderRadius: '10px',
          backgroundColor: `${color}22`, color, fontWeight: '600',
        }}>
          {rateLabel(rate)}
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
            background: 'none', border: '1px solid var(--border)', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text3)',
            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >?</button>
      </div>

      {/* ── Info rétractable ── */}
      {showInfo && (
        <div style={{
          backgroundColor: 'var(--bg3)', borderRadius: '6px', padding: '10px 14px',
          marginBottom: '14px', borderLeft: '3px solid #2962FF',
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.6',
        }}>
          Les taux directeurs définissent le coût du crédit dans une économie. S'ils sont
          élevés <span style={{ color: '#ef5350' }}>■</span>, emprunter coûte cher — cela freine
          l'investissement et l'inflation. S'ils sont bas <span style={{ color: '#2962FF' }}>■</span>,
          comme au Japon depuis des décennies, cela stimule la consommation mais peut alimenter les bulles d'actifs.
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
