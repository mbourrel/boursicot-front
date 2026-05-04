import { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import MetricInfo from './MetricInfo';
import { h3Style } from './styles';

// ── Helpers ────────────────────────────────────────────────────────────────

function findMetric(arr, name) {
  return arr?.find(m => m.name === name)?.val ?? null;
}

function findEPS(data) {
  const items = data.income_stmt_data?.items;
  if (!items) return null;
  return items.find(m => m.name === 'BPA Dilué')?.vals?.[0]
    ?? items.find(m => m.name === 'BPA Basique')?.vals?.[0]
    ?? null;
}

function calcDCF(fcf, shares, growthRate, wacc) {
  if (!fcf || fcf === 0 || !shares || shares <= 0) return null;
  const TERMINAL_GROWTH = 0.025;
  if (wacc <= TERMINAL_GROWTH) return null;
  let pv = 0;
  for (let i = 1; i <= 5; i++) {
    pv += (fcf * Math.pow(1 + growthRate, i)) / Math.pow(1 + wacc, i);
  }
  const fcf5 = fcf * Math.pow(1 + growthRate, 5);
  const tv   = (fcf5 * (1 + TERMINAL_GROWTH)) / (wacc - TERMINAL_GROWTH);
  pv += tv / Math.pow(1 + wacc, 5);
  return pv / shares > 0 ? pv / shares : null;
}

function calcGraham(eps, bookValue) {
  if (!eps || !bookValue || eps <= 0 || bookValue <= 0) return null;
  return Math.sqrt(22.5 * eps * bookValue);
}

function calcPE(eps, targetPE) {
  if (!eps || eps <= 0 || !targetPE) return null;
  return eps * targetPE;
}

function fmtNum(v, currency) {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

function fmtCompact(v, currency) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const n = abs >= 1e9
    ? (v / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Md'
    : abs >= 1e6
      ? (v / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M'
      : v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  return currency ? `${n} ${currency}` : n;
}

// ── Sous-composants ────────────────────────────────────────────────────────

function SliderInput({ label, value, min, max, step, onChange, format, infoName }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>{label}</span>
        <MetricInfo name={infoName} />
        <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 'bold', color: '#2962FF' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#2962FF', cursor: 'pointer', height: '4px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function PriceResult({ theoreticalPrice, currentPrice, currency, unavailableReason }) {
  if (unavailableReason) {
    return (
      <div style={{ fontSize: '11px', color: '#ff9800', fontStyle: 'italic', marginTop: '10px' }}>
        {unavailableReason}
      </div>
    );
  }
  if (theoreticalPrice === null) return null;

  const diff  = ((theoreticalPrice - currentPrice) / currentPrice) * 100;
  const color = diff > 0 ? '#26a69a' : '#ef5350';

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>Prix théorique</div>
      <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text1)', lineHeight: 1, marginBottom: '8px' }}>
        {fmtNum(theoreticalPrice, currency)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '12px', fontWeight: 'bold', color,
          backgroundColor: color + '1a', padding: '3px 8px', borderRadius: '4px',
        }}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text3)' }}>écart théorique vs cours actuel</span>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

export default function ValuationPrism({ data }) {
  const { isMobile } = useBreakpoint();

  const fcf            = findMetric(data.balance_cash,       'Free Cash Flow');
  const marketCap      = findMetric(data.market_analysis,    'Capitalisation');
  const per            = findMetric(data.market_analysis,    'PER');
  const priceToBook    = findMetric(data.advanced_valuation, 'Price to Book');
  const earningsGrowth = findMetric(data.income_growth,      'Croissance Bénéfices');
  const eps            = findEPS(data);
  const closePrice     = data.close_price;
  const currency       = data.currency || '$';

  const sharesOut      = marketCap && closePrice > 0 ? marketCap / closePrice : null;
  const bookValueShare = priceToBook && priceToBook > 0 && closePrice > 0 ? closePrice / priceToBook : null;

  // Defaults : API (CAPM / FCF CAGR / P/E sectoriel) sinon dérivation locale
  const apiDef = data.valuation_defaults;
  const defaultGrowth = apiDef?.default_growth
    ?? (earningsGrowth != null ? Math.min(0.15, Math.max(0.0, earningsGrowth / 100)) : 0.05);
  const defaultWacc = apiDef?.default_wacc ?? 0.08;
  const defaultPE   = apiDef?.default_pe
    ?? (per != null ? Math.min(50, Math.max(5, Math.round(per))) : 15);

  const [growthRate, setGrowthRate] = useState(defaultGrowth);
  const [wacc,       setWacc]       = useState(defaultWacc);
  const [targetPE,   setTargetPE]   = useState(defaultPE);

  const isDirty = growthRate !== defaultGrowth || wacc !== defaultWacc || targetPE !== defaultPE;

  const reset = () => { setGrowthRate(defaultGrowth); setWacc(defaultWacc); setTargetPE(defaultPE); };

  const dcfPrice    = useMemo(() => calcDCF(fcf, sharesOut, growthRate, wacc),  [fcf, sharesOut, growthRate, wacc]);
  const grahamPrice = useMemo(() => calcGraham(eps, bookValueShare),             [eps, bookValueShare]);
  const pePrice     = useMemo(() => calcPE(eps, targetPE),                       [eps, targetPE]);

  const negEPS = eps !== null && eps <= 0;

  const dcfUnavailable = !fcf || fcf === 0
    ? 'Free Cash Flow introuvable pour ce ticker.'
    : !sharesOut ? 'Capitalisation boursière introuvable.' : null;

  const grahamUnavailable = negEPS
    ? 'Modèle indisponible — bénéfices négatifs.'
    : eps === null ? 'Données BPA introuvables pour ce ticker.'
    : !bookValueShare ? 'Valeur comptable par action introuvable (Price to Book manquant).'
    : null;

  const peUnavailable = negEPS
    ? 'Modèle indisponible — bénéfices négatifs.'
    : eps === null ? 'Données BPA introuvables pour ce ticker.' : null;

  const cardStyle = {
    flex: 1, minWidth: '200px',
    backgroundColor: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '16px 18px',
  };

  const epsFmt = eps != null
    ? eps.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
  const bvFmt = bookValueShare != null
    ? bookValueShare.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  return (
    <div style={{ marginBottom: '36px' }}>

      {/* Titre + Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <h3 style={{ ...h3Style, margin: 0 }}>Prisme de Valorisation</h3>
        {isDirty && (
          <button
            onClick={reset}
            title="Réinitialiser les hypothèses aux valeurs calculées"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', color: 'var(--text3)',
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '5px', padding: '3px 8px', cursor: 'pointer',
            }}
          >
            <RotateCcw size={11} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Cours de référence */}
      {closePrice != null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          marginBottom: '16px', padding: '6px 12px', borderRadius: '7px',
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Cours actuel de référence</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text1)' }}>
            {fmtNum(closePrice, currency)}
          </span>
        </div>
      )}

      {/* Cartes */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px', marginBottom: '16px' }}>

        {/* ── DCF ── */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text1)', marginBottom: '2px' }}>
            DCF Simplifié
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', whiteSpace: 'pre', marginBottom: '10px', lineHeight: '1.5' }}>
            {'∑ FCF·(1+g)ⁿ/(1+WACC)ⁿ\n+ Valeur Terminale (2,5%)'}
          </div>
          {!dcfUnavailable && fcf != null && (
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '10px' }}>
              Basé sur FCF de {fmtCompact(fcf, currency)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '4px' }}>
            <SliderInput
              label="Croissance annuelle"
              value={growthRate} min={-0.05} max={0.20} step={0.005}
              onChange={setGrowthRate}
              format={v => `${(v * 100).toFixed(1)}%`}
              infoName="Taux de Croissance Annuel"
            />
            <SliderInput
              label="WACC (actualisation)"
              value={wacc} min={0.05} max={0.15} step={0.005}
              onChange={setWacc}
              format={v => `${(v * 100).toFixed(1)}%`}
              infoName="WACC"
            />
          </div>
          <PriceResult
            theoreticalPrice={dcfUnavailable ? null : dcfPrice}
            currentPrice={closePrice}
            currency={currency}
            unavailableReason={dcfUnavailable}
          />
        </div>

        {/* ── Graham ── */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text1)', marginBottom: '2px' }}>
            Nombre de Graham
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', whiteSpace: 'pre', marginBottom: '10px', lineHeight: '1.5' }}>
            {'√(22.5 × BPA\n  × Valeur Comptable/Action)'}
          </div>
          {!grahamUnavailable && epsFmt != null && (
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '10px' }}>
              BPA {epsFmt} {currency}
              {bvFmt != null && ` · VCpA ${bvFmt} ${currency}`}
            </div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic', lineHeight: '1.5', marginBottom: '4px' }}>
            Formule déterministe · aucun paramètre ajustable.
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic', lineHeight: '1.5' }}>
            Approche conservative, conçue pour les entreprises matures et profitables.
          </div>
          <PriceResult
            theoreticalPrice={grahamUnavailable ? null : grahamPrice}
            currentPrice={closePrice}
            currency={currency}
            unavailableReason={grahamUnavailable}
          />
        </div>

        {/* ── P/E ── */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text1)', marginBottom: '2px' }}>
            Valorisation par P/E
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', whiteSpace: 'pre', marginBottom: '10px', lineHeight: '1.5' }}>
            {'BPA × Multiple P/E Cible'}
          </div>
          {!peUnavailable && epsFmt != null && (
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '10px' }}>
              Basé sur BPA {epsFmt} {currency}
            </div>
          )}
          <SliderInput
            label="Multiple P/E Cible"
            value={targetPE} min={5} max={50} step={0.5}
            onChange={setTargetPE}
            format={v => `${v.toFixed(1)}x`}
            infoName="Multiple P/E Cible"
          />
          <PriceResult
            theoreticalPrice={peUnavailable ? null : pePrice}
            currentPrice={closePrice}
            currency={currency}
            unavailableReason={peUnavailable}
          />
        </div>

      </div>

      {/* Disclaimer MIF2 */}
      <div style={{
        padding: '10px 14px', borderRadius: '7px',
        backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6',
      }}>
        Outil de simulation mathématique. Les résultats dépendent des hypothèses saisies et ne constituent en aucun cas une recommandation d'achat ou de vente.
      </div>

    </div>
  );
}
