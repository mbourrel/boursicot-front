import { useCurrency } from '../../context/CurrencyContext';
import { captureEvent } from '../../utils/analytics';

export default function CurrencyBar() {
  const { targetCurrency, setTargetCurrency, updatedAt } = useCurrency();
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px', border: '1px solid var(--border)' }}>
        {['LOCAL', 'EUR', 'USD'].map((cur, i) => (
          <button
            key={cur}
            onClick={() => { captureEvent('currency_changed', { currency: cur }); setTargetCurrency(cur); }}
            style={{
              padding: '6px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              borderRadius: i === 0 ? '5px 0 0 5px' : i === 2 ? '0 5px 5px 0' : '0',
              borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
              backgroundColor: targetCurrency === cur ? '#2962FF' : 'transparent',
              color: targetCurrency === cur ? 'white' : 'var(--text3)',
              transition: 'all 0.15s',
            }}
          >
            {cur === 'LOCAL' ? '🏳 Local' : cur === 'EUR' ? '€ EUR' : '$ USD'}
          </button>
        ))}
      </div>
      {updatedAt && targetCurrency !== 'LOCAL' && (
        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>
          Taux du {new Date(updatedAt).toLocaleDateString('fr-FR')}
        </span>
      )}
    </div>
  );
}
