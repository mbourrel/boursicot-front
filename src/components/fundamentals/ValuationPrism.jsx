import { useState, useMemo } from 'react';
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

// DCF sur 5 ans + valeur terminale (Gordon Growth à 2.5%)
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
  const price = pv / shares;
  return price > 0 ? price : null;
}

// Nombre de Graham : √(22.5 × BPA × Valeur Comptable/Action)
function calcGraham(eps, bookValue) {
  if (!eps || !bookValue || eps <= 0 || bookValue <= 0) return null;
  return Math.sqrt(22.5 * eps * bookValue);
}

// Valorisation par les Multiples P/E
function calcPE(eps, targetPE) {
  if (!eps || eps <= 0 || !targetPE) return null;
  return eps * targetPE;
}

// ── Sous-composants ────────────────────────────────────────────────────────

function SliderInput({ label, value, min, max, step, onChange, format, infoName }) {
  return (
    <div style={{ flex: 1, minWidth: '160px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>{label}</span>
        <MetricInfo name={infoName} />
        <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 'bold', color: '#2962FF' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#2962FF', cursor: 'pointer', height: '4px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text3)', marginTop: '3px' }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function ModelCard({ title, formula, theoreticalPrice, currentPrice, unavailableReason, currency }) {
  if (unavailableReason) {
    return (
      <div style={{
        flex: 1, minWidth: '200px',
        backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '16px 18px',
        borderTop: '3px solid var(--border)',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', marginBottom: '12px', lineHeight: '1.5' }}>{formula}</div>
        <div style={{ fontSize: '11px', color: '#ff9800', fontStyle: 'italic' }}>{unavailableReason}</div>
      </div>
    );
  }

  if (theoreticalPrice === null) return null;

  const diff = ((theoreticalPrice - currentPrice) / currentPrice) * 100;
  const isUnder = diff > 0;
  const color   = isUnder ? '#26a69a' : '#ef5350';
  const label   = isUnder ? 'Potentiellement sous-évalué' : 'Potentiellement sur-évalué';

  return (
    <div style={{
      flex: 1, minWidth: '200px',
      backgroundColor: 'var(--bg3)',
      border: `1px solid ${color}44`,
      borderRadius: '10px', padding: '16px 18px',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', marginBottom: '14px', lineHeight: '1.5' }}>{formula}</div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>Prix théorique</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color, lineHeight: 1 }}>
          {theoreticalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '12px', fontWeight: 'bold', color,
          backgroundColor: color + '18', padding: '3px 8px', borderRadius: '4px',
        }}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text3)' }}>vs cours actuel</span>
      </div>
      <div style={{ fontSize: '10px', color, fontWeight: '600', marginTop: '6px' }}>{label}</div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

export default function ValuationPrism({ data }) {
  const { isMobile } = useBreakpoint();

  // ── Extraction des inputs ──
  const fcf          = findMetric(data.balance_cash, 'Free Cash Flow');
  const marketCap    = findMetric(data.market_analysis, 'Capitalisation');
  const per          = findMetric(data.market_analysis, 'PER');
  const priceToBook  = findMetric(data.advanced_valuation, 'Price to Book');
  const earningsGrowth = findMetric(data.income_growth, 'Croissance Bénéfices');
  const eps          = findEPS(data);
  const closePrice   = data.close_price;
  const currency     = data.currency || '$';

  // Valeurs dérivées
  const sharesOut       = marketCap && closePrice > 0 ? marketCap / closePrice : null;
  const bookValueShare  = priceToBook && priceToBook > 0 && closePrice > 0 ? closePrice / priceToBook : null;

  // Valeurs par défaut des sliders calées sur les données réelles
  const defaultGrowth = earningsGrowth != null
    ? Math.min(0.20, Math.max(-0.05, earningsGrowth / 100))
    : 0.05;
  const defaultPE = per != null
    ? Math.min(50, Math.max(5, Math.round(per)))
    : 15;

  const [growthRate, setGrowthRate] = useState(defaultGrowth);
  const [wacc,       setWacc]       = useState(0.10);
  const [targetPE,   setTargetPE]   = useState(defaultPE);

  // ── Calculs ──
  const dcfPrice    = useMemo(() => calcDCF(fcf, sharesOut, growthRate, wacc),  [fcf, sharesOut, growthRate, wacc]);
  const grahamPrice = useMemo(() => calcGraham(eps, bookValueShare),             [eps, bookValueShare]);
  const pePrice     = useMemo(() => calcPE(eps, targetPE),                       [eps, targetPE]);

  // Raisons d'indisponibilité
  const dcfUnavailable = !fcf || fcf === 0
    ? 'Free Cash Flow introuvable pour ce ticker.'
    : !sharesOut
      ? 'Capitalisation boursière introuvable.'
      : null;

  const negativeEPS = eps !== null && eps <= 0;
  const grahamUnavailable = negativeEPS
    ? 'Modèle indisponible — bénéfices négatifs.'
    : eps === null
      ? 'Données BPA introuvables pour ce ticker.'
      : !bookValueShare
        ? 'Valeur comptable par action introuvable (Price to Book manquant).'
        : null;

  const peUnavailable = negativeEPS
    ? 'Modèle indisponible — bénéfices négatifs.'
    : eps === null
      ? 'Données BPA introuvables pour ce ticker.'
      : null;

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={h3Style}>Prisme de Valorisation</h3>

      {/* Sliders */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '24px',
        padding: '16px 20px',
        backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: '10px', marginBottom: '20px',
      }}>
        <SliderInput
          label="Taux de Croissance Annuel"
          value={growthRate}
          min={-0.05} max={0.20} step={0.005}
          onChange={setGrowthRate}
          format={v => `${(v * 100).toFixed(1)}%`}
          infoName="Taux de Croissance Annuel"
        />
        <SliderInput
          label="WACC (Taux d'actualisation)"
          value={wacc}
          min={0.05} max={0.15} step={0.005}
          onChange={setWacc}
          format={v => `${(v * 100).toFixed(1)}%`}
          infoName="WACC"
        />
        <SliderInput
          label="Multiple P/E Cible"
          value={targetPE}
          min={5} max={50} step={0.5}
          onChange={setTargetPE}
          format={v => `${v.toFixed(1)}x`}
          infoName="Multiple P/E Cible"
        />
      </div>

      {/* Ligne de référence : prix actuel */}
      {closePrice != null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '16px',
          padding: '8px 14px', borderRadius: '7px',
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
          width: 'fit-content',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Cours actuel de référence</span>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text1)' }}>
            {closePrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
          </span>
        </div>
      )}

      {/* Cartes des 3 modèles */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <ModelCard
          title="DCF Simplifié"
          formula={'∑ FCF·(1+g)ⁿ/(1+WACC)ⁿ\n+ Valeur Terminale'}
          theoreticalPrice={dcfUnavailable ? null : dcfPrice}
          currentPrice={closePrice}
          unavailableReason={dcfUnavailable}
          currency={currency}
        />
        <ModelCard
          title="Nombre de Graham"
          formula={'√(22.5 × BPA\n× Valeur Comptable/Action)'}
          theoreticalPrice={grahamUnavailable ? null : grahamPrice}
          currentPrice={closePrice}
          unavailableReason={grahamUnavailable}
          currency={currency}
        />
        <ModelCard
          title="Valorisation par P/E"
          formula={'BPA × Multiple\nP/E Cible'}
          theoreticalPrice={peUnavailable ? null : pePrice}
          currentPrice={closePrice}
          unavailableReason={peUnavailable}
          currency={currency}
        />
      </div>

      {/* Disclaimer MIF2 */}
      <div style={{
        padding: '10px 14px', borderRadius: '7px',
        backgroundColor: '#ff980012', border: '1px solid #ff980044',
        fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6',
      }}>
        <strong style={{ color: 'var(--text2)' }}>
          Ceci est un outil de simulation mathématique. Les résultats dépendent de vos hypothèses et ne constituent en aucun cas une recommandation d'achat ou de vente.
        </strong>
      </div>
    </div>
  );
}
