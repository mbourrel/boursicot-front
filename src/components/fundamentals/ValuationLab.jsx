import { useState, useMemo } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import MetricInfo from './MetricInfo';
import { h3Style } from './styles';
import ValuationMethodCard from './ValuationMethodCard';

// ── Math rendering helpers ─────────────────────────────────────────────────

function Frac({ num, den }) {
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      verticalAlign: 'middle', margin: '0 2px',
    }}>
      <span style={{ borderBottom: '1px solid currentColor', padding: '0 3px 1px', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
        {num}
      </span>
      <span style={{ padding: '1px 3px 0', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
        {den}
      </span>
    </span>
  );
}

function Sigma({ from, to }) {
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      verticalAlign: 'middle', margin: '0 2px',
    }}>
      <span style={{ fontSize: '9px', lineHeight: 1 }}>{to}</span>
      <span style={{ fontSize: '20px', lineHeight: 1 }}>∑</span>
      <span style={{ fontSize: '9px', lineHeight: 1 }}>{from}</span>
    </span>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────

function SliderInput({ label, value, min, max, step, onChange, format, infoName }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>{label}</span>
        {infoName && <MetricInfo name={infoName} />}
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

function InputRow({ label, value }) {
  return (
    <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px' }}>
      <span style={{ fontWeight: '600' }}>{label}</span>
      <span style={{ marginLeft: '6px', color: 'var(--text2)' }}>{value}</span>
    </div>
  );
}

// ── Data helpers ───────────────────────────────────────────────────────────

function findMetric(arr, name) {
  return arr?.find(m => m.name === name)?.val ?? null;
}

function findStmt(stmtObj, name) {
  return stmtObj?.items?.find(m => m.name === name)?.vals?.[0] ?? null;
}

function findEPS(data) {
  const items = data.income_stmt_data?.items;
  if (!items) return null;
  return items.find(m => m.name === 'BPA Dilué')?.vals?.[0]
    ?? items.find(m => m.name === 'BPA Basique')?.vals?.[0]
    ?? null;
}

function fmtNum(v, currency) {
  if (v == null) return '—';
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

function fmtCompact(v, currency) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const s = abs >= 1e9
    ? (v / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Md'
    : abs >= 1e6
      ? (v / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M'
      : v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  return currency ? `${s} ${currency}` : s;
}

function verdictOf(theoreticalPrice, closePrice, currency) {
  if (theoreticalPrice == null || closePrice == null || closePrice === 0) return null;
  return {
    theoreticalPrice,
    currency,
    diff: ((theoreticalPrice - closePrice) / closePrice) * 100,
  };
}

// ── Calculation functions ──────────────────────────────────────────────────

function calcDCF(fcf, shares, g, wacc, gTerminal) {
  if (!fcf || fcf === 0 || !shares || shares <= 0) return null;
  if (wacc <= gTerminal) return null;
  let pv = 0;
  for (let t = 1; t <= 5; t++) {
    pv += (fcf * Math.pow(1 + g, t)) / Math.pow(1 + wacc, t);
  }
  const fcf6 = fcf * Math.pow(1 + g, 5) * (1 + gTerminal);
  pv += (fcf6 / (wacc - gTerminal)) / Math.pow(1 + wacc, 5);
  return pv / shares > 0 ? pv / shares : null;
}

function calcDDM(d0, ke, g) {
  if (!d0 || d0 <= 0 || ke <= g) return null;
  return (d0 * (1 + g)) / (ke - g);
}

function calcEV(ebitda, multiple, netDebt, shares) {
  if (!ebitda || ebitda <= 0 || !shares || shares <= 0) return null;
  const ev       = ebitda * multiple;
  const equity   = ev - (netDebt ?? 0);
  const price    = equity / shares;
  return price > 0 ? price : null;
}

function calcPE(eps, targetPE) {
  if (!eps || eps <= 0 || !targetPE) return null;
  return eps * targetPE;
}

function calcANCC(bvps, adj) {
  if (!bvps || bvps <= 0) return null;
  return bvps * (1 + adj);
}

// ── Formulas (JSX) ────────────────────────────────────────────────────────

const mathBase = { fontFamily: '"Georgia", "Times New Roman", serif', fontSize: '13px', color: 'var(--text2)' };
const sub = txt => <span style={{ fontSize: '9px', verticalAlign: 'sub' }}>{txt}</span>;
const sup = txt => <span style={{ fontSize: '9px', verticalAlign: 'super' }}>{txt}</span>;

const FORMULA_DCF = (
  <div style={mathBase}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap', lineHeight: 2.5 }}>
      <span>V{sub(0)} = </span>
      <Sigma from={<span>t=1</span>} to={<span>n</span>} />
      <Frac num={<span>FCF{sub('t')}</span>} den={<span>(1+WACC){sup('t')}</span>} />
      <span style={{ padding: '0 4px' }}>+</span>
      <Frac num="VT" den={<span>(1+WACC){sup('n')}</span>} />
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
      VT = FCF{sub('n+1')} / (WACC − g) &nbsp;·&nbsp; g terminal fixé à 2.5%
    </div>
  </div>
);

const FORMULA_DDM = (
  <div style={mathBase}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: 2.5 }}>
      <span>P{sub(0)} = </span>
      <Frac num={<span>D{sub(1)}</span>} den={<span>K{sub('e')} − g</span>} />
      <span style={{ margin: '0 6px', color: 'var(--text3)' }}>où</span>
      <span>D{sub(1)} = D{sub(0)} × (1+g)</span>
    </div>
  </div>
);

const FORMULA_EV = (
  <div style={mathBase}>
    <div style={{ lineHeight: 2 }}>
      <div>VE = EBITDA × Multiple</div>
      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
        P/action = (VE − Dette Nette) ÷ Nb actions
      </div>
    </div>
  </div>
);

const FORMULA_PE = (
  <div style={mathBase}>
    <div style={{ lineHeight: 2 }}>
      <div>P{sub(0)} = BPA × (P/E cible)</div>
      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
        PEG = P/E ÷ g{sub('BPA')} (%)
      </div>
    </div>
  </div>
);

const FORMULA_ANCC = (
  <div style={mathBase}>
    <div style={{ lineHeight: 2 }}>
      <div>ANCC = (Capitaux Propres / Action) × (1 + Ajustement)</div>
      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
        Capitaux Propres ± plus-values latentes − fiscalité différée
      </div>
    </div>
  </div>
);

// ── Composant principal ────────────────────────────────────────────────────

export default function ValuationLab({ data }) {
  const { isMobile } = useBreakpoint();

  // ── Extraction données ─────────────────────────────────────────────────
  const fcf          = findMetric(data.balance_cash,       'Free Cash Flow');
  const marketCap    = findMetric(data.market_analysis,    'Capitalisation');
  const per          = findMetric(data.market_analysis,    'PER');
  const priceToBook  = findMetric(data.advanced_valuation, 'Price to Book');
  const egrowth      = findMetric(data.income_growth,      'Croissance Bénéfices'); // %
  const eps          = findEPS(data);
  const closePrice   = data.close_price;
  const currency     = data.currency || '$';

  const ebitda    = findStmt(data.income_stmt_data,  'EBITDA');
  const totalDebt = findStmt(data.balance_sheet_data, 'Dette Totale');
  const cash      = findStmt(data.balance_sheet_data, 'Trésorerie & Équivalents');
  const netDebt   = (totalDebt != null || cash != null)
    ? ((totalDebt ?? 0) - (cash ?? 0))
    : null;

  const d0          = data.dividends_data?.dividend_rate ?? null; // dividende annuel
  const shares      = marketCap && closePrice > 0 ? marketCap / closePrice : null;
  const bvps        = priceToBook && priceToBook > 0 && closePrice > 0 ? closePrice / priceToBook : null;

  // ── Defaults API ────────────────────────────────────────────────────────
  const apiDef   = data.valuation_defaults || {};
  const dWacc    = apiDef.default_wacc     ?? 0.08;
  const dGrowth  = apiDef.default_growth   ?? 0.05;
  const dPE      = apiDef.default_pe       ?? (per != null ? Math.min(50, Math.max(5, Math.round(per))) : 15);
  const dEvEbitda = apiDef.sector_ev_ebitda ?? 10;

  // ── État des sliders par méthode ────────────────────────────────────────
  const [dcf,  setDcf]  = useState({ g: dGrowth, wacc: dWacc, gT: 0.025 });
  const [ddm,  setDdm]  = useState({ ke: dWacc, g: 0.03 });
  const [ev,   setEv]   = useState({ multiple: dEvEbitda });
  const [pe,   setPe]   = useState({ pe: dPE });
  const [ancc, setAncc] = useState({ adj: 0 });
  const [open, setOpen] = useState(new Set());

  const toggle = id => setOpen(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  // ── Calculs ─────────────────────────────────────────────────────────────
  const dcfPrice    = useMemo(() => calcDCF(fcf, shares, dcf.g, dcf.wacc, dcf.gT),        [fcf, shares, dcf.g, dcf.wacc, dcf.gT]);
  const ddmPrice    = useMemo(() => calcDDM(d0, ddm.ke, ddm.g),                            [d0, ddm.ke, ddm.g]);
  const evPrice     = useMemo(() => calcEV(ebitda, ev.multiple, netDebt, shares),           [ebitda, ev.multiple, netDebt, shares]);
  const pePrice     = useMemo(() => calcPE(eps, pe.pe),                                     [eps, pe.pe]);
  const anccPrice   = useMemo(() => calcANCC(bvps, ancc.adj),                               [bvps, ancc.adj]);

  // ── Verdicts (header preview) ────────────────────────────────────────────
  const vDCF    = verdictOf(dcfPrice,  closePrice, currency);
  const vDDM    = verdictOf(ddmPrice,  closePrice, currency);
  const vEV     = verdictOf(evPrice,   closePrice, currency);
  const vPE     = verdictOf(pePrice,   closePrice, currency);
  const vANCC   = verdictOf(anccPrice, closePrice, currency);

  // ── Raisons d'indisponibilité ─────────────────────────────────────────────
  const unavDCF = !fcf || fcf === 0 ? 'Free Cash Flow introuvable.'
    : !shares ? 'Capitalisation boursière introuvable.' : null;

  const unavDDM = !d0 || d0 <= 0 ? 'Aucun dividende versé — modèle non applicable.'
    : ddm.ke <= ddm.g ? 'Ke ≤ g : la formule diverge, ajustez les paramètres.' : null;

  const unavEV  = !ebitda || ebitda <= 0 ? 'EBITDA introuvable pour ce ticker.' : null;

  const unavPE  = eps === null ? 'Données BPA introuvables.'
    : eps <= 0 ? 'Modèle indisponible — bénéfices négatifs.' : null;

  const unavANCC = !bvps ? 'Price to Book introuvable (valeur comptable non dérivable).' : null;

  // ── isDirty par méthode ───────────────────────────────────────────────────
  const dirtyDCF  = dcf.g !== dGrowth || dcf.wacc !== dWacc || dcf.gT !== 0.025;
  const dirtyDDM  = ddm.ke !== dWacc || ddm.g !== 0.03;
  const dirtyEV   = ev.multiple !== dEvEbitda;
  const dirtyPE   = pe.pe !== dPE;
  const dirtyANCC = ancc.adj !== 0;

  // ── PEG ratio ─────────────────────────────────────────────────────────────
  const peg = egrowth && egrowth > 0 && pe.pe > 0
    ? (pe.pe / egrowth).toFixed(2)
    : null;

  const epsFmt  = eps?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bvpsFmt = bvps?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={h3Style}>Laboratoire d'Évaluation (Simulateurs)</h3>

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

      {/* ── Catégorie 1 : Intrinsèque ───────────────────────────────────── */}
      <div style={{ fontSize: '11px', color: '#2962FF', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '4px' }}>
        Approche Intrinsèque (Flux Futurs)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>

        {/* ── DCF ─────────────────────────────────────────────────────── */}
        <ValuationMethodCard
          categoryLabel="Intrinsèque"
          categoryColor="#2962FF"
          title="DCF — Discounted Cash Flow"
          verdict={!unavDCF ? vDCF : null}
          unavailable={unavDCF}
          isOpen={open.has('dcf')}
          onToggle={() => toggle('dcf')}
          isDirty={dirtyDCF}
          onReset={() => setDcf({ g: dGrowth, wacc: dWacc, gT: 0.025 })}
          formulaNode={FORMULA_DCF}
          usageText="Idéal pour les entreprises matures avec des flux de trésorerie prévisibles (M&A, grands groupes industriels). À éviter pour les startups en croissance ou les cycliques dont les FCF sont erratiques."
          warningText={`Dépasser 3 % pour le taux de croissance terminal (g) est considéré comme une hérésie académique (Damodaran) — la croissance à l'infini ne peut excéder celle du PIB nominal.`}
        >
          {!unavDCF && (
            <>
              <InputRow label="Free Cash Flow :" value={fmtCompact(fcf, currency)} />
              <SliderInput
                label="Taux de croissance (5 ans)"
                value={dcf.g} min={-0.05} max={0.20} step={0.005}
                onChange={v => setDcf(s => ({ ...s, g: v }))}
                format={v => `${(v * 100).toFixed(1)}%`}
                infoName="Taux de Croissance Annuel"
              />
              <SliderInput
                label="WACC (taux d'actualisation)"
                value={dcf.wacc} min={0.05} max={0.20} step={0.005}
                onChange={v => setDcf(s => ({ ...s, wacc: v }))}
                format={v => `${(v * 100).toFixed(1)}%`}
                infoName="WACC"
              />
              <SliderInput
                label="Croissance terminale (g∞)"
                value={dcf.gT} min={0} max={0.04} step={0.005}
                onChange={v => setDcf(s => ({ ...s, gT: v }))}
                format={v => `${(v * 100).toFixed(1)}%`}
              />
              <div style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic', marginBottom: '4px' }}>
                Ordres de grandeur — WACC : 6-8 % défensif · 8-10 % industriel · 10-15 % tech · 15-20 % startup
              </div>
            </>
          )}
        </ValuationMethodCard>

        {/* ── DDM ─────────────────────────────────────────────────────── */}
        <ValuationMethodCard
          categoryLabel="Intrinsèque"
          categoryColor="#2962FF"
          title="DDM — Dividend Discount Model"
          verdict={!unavDDM ? vDDM : null}
          unavailable={unavDDM}
          isOpen={open.has('ddm')}
          onToggle={() => toggle('ddm')}
          isDirty={dirtyDDM}
          onReset={() => setDdm({ ke: dWacc, g: 0.03 })}
          formulaNode={FORMULA_DDM}
          usageText="Conçu pour les entreprises versant un dividende stable et croissant : banques, assurances, utilities. Inadapté aux entreprises en hypercroissance qui ne distribuent pas (GAFAM)."
        >
          {!unavDDM && (
            <>
              <InputRow label="Dividende D₀ (annuel) :" value={`${d0?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`} />
              <SliderInput
                label="Kₑ — coût des capitaux propres"
                value={ddm.ke} min={0.04} max={0.20} step={0.005}
                onChange={v => setDdm(s => ({ ...s, ke: v }))}
                format={v => `${(v * 100).toFixed(1)}%`}
                infoName="WACC"
              />
              <SliderInput
                label="g — croissance des dividendes"
                value={ddm.g} min={0} max={0.08} step={0.005}
                onChange={v => setDdm(s => ({ ...s, g: v }))}
                format={v => `${(v * 100).toFixed(1)}%`}
              />
              {ddm.ke <= ddm.g && (
                <div style={{ fontSize: '11px', color: '#ef5350', marginBottom: '6px' }}>
                  ⚠ Ke doit être supérieur à g — augmentez Ke ou réduisez g.
                </div>
              )}
            </>
          )}
        </ValuationMethodCard>
      </div>

      {/* ── Catégorie 2 : Relative ──────────────────────────────────────── */}
      <div style={{ fontSize: '11px', color: '#7B1FA2', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Approche Relative (Multiples de Marché)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>

        {/* ── EV/EBITDA ────────────────────────────────────────────────── */}
        <ValuationMethodCard
          categoryLabel="Relative"
          categoryColor="#7B1FA2"
          title="EV / EBITDA — Multiples de Valeur d'Entreprise"
          verdict={!unavEV ? vEV : null}
          unavailable={unavEV}
          isOpen={open.has('ev')}
          onToggle={() => toggle('ev')}
          isDirty={dirtyEV}
          onReset={() => setEv({ multiple: dEvEbitda })}
          formulaNode={FORMULA_EV}
          usageText="Méthode reine en banque d'affaires (M&A). Neutralise la structure de dette — utile pour comparer des entreprises du même secteur avec des leviers financiers différents. Le multiple cible est initialisé à la moyenne sectorielle."
        >
          {!unavEV && (
            <>
              <InputRow label="EBITDA :" value={fmtCompact(ebitda, currency)} />
              {netDebt != null && <InputRow label="Dette nette :" value={fmtCompact(netDebt, currency)} />}
              <SliderInput
                label="Multiple EV/EBITDA cible"
                value={ev.multiple} min={3} max={30} step={0.5}
                onChange={v => setEv(s => ({ ...s, multiple: v }))}
                format={v => `${v.toFixed(1)}x`}
              />
              <div style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic' }}>
                Ordres de grandeur : 4-8x utilities · 8-12x industriel · 12-20x tech · 20x+ hypercroissance
              </div>
            </>
          )}
        </ValuationMethodCard>

        {/* ── P/E ──────────────────────────────────────────────────────── */}
        <ValuationMethodCard
          categoryLabel="Relative"
          categoryColor="#7B1FA2"
          title="P/E — Multiples de Capitaux Propres"
          verdict={!unavPE ? vPE : null}
          unavailable={unavPE}
          isOpen={open.has('pe')}
          onToggle={() => toggle('pe')}
          isDirty={dirtyPE}
          onReset={() => setPe({ pe: dPE })}
          formulaNode={FORMULA_PE}
          usageText="Screener rapide pour particuliers. Simple et largement répandu. Biaisé par la structure de financement (l'endettement gonfle le BPA). Le multiple cible est initialisé à la moyenne sectorielle."
        >
          {!unavPE && (
            <>
              <InputRow label="BPA (dilué) :" value={`${epsFmt} ${currency}`} />
              <SliderInput
                label="Multiple P/E cible"
                value={pe.pe} min={5} max={50} step={0.5}
                onChange={v => setPe(s => ({ ...s, pe: v }))}
                format={v => `${v.toFixed(1)}x`}
                infoName="Multiple P/E Cible"
              />
              {peg != null && (
                <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>
                  Ratio PEG ={' '}
                  <strong style={{ color: parseFloat(peg) < 1 ? '#26a69a' : parseFloat(peg) > 2 ? '#ef5350' : 'var(--text1)' }}>
                    {peg}
                  </strong>
                  <span style={{ color: 'var(--text3)', fontSize: '10px' }}> (P/E ÷ croissance bénéfices {egrowth?.toFixed(1)}%)</span>
                  <br />
                  <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                    PEG &lt; 1 : potentiellement sous-évalué · PEG &gt; 2 : attention
                  </span>
                </div>
              )}
            </>
          )}
        </ValuationMethodCard>
      </div>

      {/* ── Catégorie 3 : Patrimoniale ──────────────────────────────────── */}
      <div style={{ fontSize: '11px', color: '#00695C', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Approche Patrimoniale (Actif Net)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>

        {/* ── ANCC ─────────────────────────────────────────────────────── */}
        <ValuationMethodCard
          categoryLabel="Patrimoniale"
          categoryColor="#00695C"
          title="ANCC — Actif Net Comptable Corrigé"
          verdict={!unavANCC ? vANCC : null}
          unavailable={unavANCC}
          isOpen={open.has('ancc')}
          onToggle={() => toggle('ancc')}
          isDirty={dirtyANCC}
          onReset={() => setAncc({ adj: 0 })}
          formulaNode={FORMULA_ANCC}
          usageText="Adapté aux foncières (REITs), holdings et banques dont les actifs sont au bilan à leur valeur réelle. Peu pertinent pour les entreprises de services ou de technologie dont la valeur repose sur des intangibles."
          warningText="Cette approche ignore totalement les perspectives de croissance future. Elle représente la valeur de liquidation comptable, non la valeur économique."
        >
          {!unavANCC && (
            <>
              <InputRow label="Valeur comptable par action :" value={`${bvpsFmt} ${currency}`} />
              <SliderInput
                label="Ajustement plus-values latentes (%)"
                value={ancc.adj} min={-0.20} max={0.50} step={0.01}
                onChange={v => setAncc(s => ({ ...s, adj: v }))}
                format={v => `${(v * 100 >= 0 ? '+' : '')}${(v * 100).toFixed(0)}%`}
              />
              <div style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic' }}>
                Ajustement manuel pour estimer les plus-values latentes sur actifs (immobilier, participations…) non reflétées dans les comptes.
              </div>
            </>
          )}
        </ValuationMethodCard>
      </div>

      {/* ── Disclaimer MIF2 ────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 14px', borderRadius: '7px',
        backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
        fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6',
      }}>
        Ces modèles sont des simulations mathématiques basées sur des hypothèses. Ils ne constituent pas un conseil en investissement.
      </div>
    </div>
  );
}
