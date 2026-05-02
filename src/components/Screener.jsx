import { useState, useEffect, useMemo } from 'react';
import { useScreener } from '../hooks/useScreener';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useProfile } from '../context/ProfileContext';
import { captureEvent } from '../utils/analytics';

// ── Filter options ────────────────────────────────────────────────────────────

const HEALTH_OPTIONS = [
  { value: 'any',     label: 'Peu importe' },
  { value: 'solide',  label: 'Solide',     min: 6.0 },
  { value: 'neutre',  label: 'Neutre',     min: 4.0, max: 6.0 },
  { value: 'fragile', label: 'Fragile',               max: 4.0 },
];

const VALUATION_OPTIONS = [
  { value: 'any',        label: 'Peu importe' },
  { value: 'attrayante', label: 'Attrayante', min: 6.0 },
  { value: 'correcte',   label: 'Correcte',   min: 3.5, max: 6.0 },
  { value: 'elevee',     label: 'Élevée',               max: 3.5 },
];

// Labels adjectivaux pour la phrase guidée ("une entreprise européenne")
const GEO_OPTIONS = [
  { value: 'all',    label: 'internationale' },
  { value: 'europe', label: 'européenne' },
  { value: 'us',     label: 'américaine' },
];

// Labels nominaux pour les filtres avancés
const GEO_OPTIONS_ADV = [
  { value: 'all',    label: 'Monde entier' },
  { value: 'europe', label: 'Europe' },
  { value: 'us',     label: 'États-Unis' },
];

const VERDICT_COLORS = {
  'Profil Fort':    '#22c55e',
  'Profil Solide':  '#86efac',
  'Profil Neutre':  '#f59e0b',
  'Profil Prudent': '#f97316',
  'Profil Fragile': '#ef4444',
};

const ADV_DIMS    = ['health', 'valuation', 'growth', 'momentum', 'efficiency', 'dividend'];
const ADV_LABELS  = { health: 'Santé', valuation: 'Valorisation', growth: 'Croissance', momentum: 'Momentum', efficiency: 'Efficacité', dividend: 'Dividende' };
const ADV_DEFAULTS = { geo: 'all', sector: 'all', verdict: 'all', health: 0, valuation: 0, growth: 0, momentum: 0, efficiency: 0, dividend: 0 };

// ── SVG geometry (full-width) ─────────────────────────────────────────────────

const SVG_W = 760;
const SVG_H = 460;
const PAD   = { top: 50, right: 40, bottom: 62, left: 68 };
const X0 = PAD.left;
const X1 = SVG_W - PAD.right;
const Y0 = PAD.top;
const Y1 = SVG_H - PAD.bottom;
const PW = X1 - X0;
const PH = Y1 - Y0;
const toX = s => X0 + (s / 10) * PW;
const toY = s => Y1 - (s / 10) * PH;
const MX  = toX(5);
const MY  = toY(5);

// X = Score Santé (right = better), Y = Score Valorisation (top = cheaper = better score)
const QUADRANTS = [
  { x: X0, y: Y0, w: MX - X0, h: MY - Y0, fill: 'rgba(245,158,11,0.07)', label: ['Prix Attrayant,', 'Fondamentaux Fragiles'] },
  { x: MX, y: Y0, w: X1 - MX, h: MY - Y0, fill: 'rgba(34,197,94,0.09)',  label: ['Fondations Solides', '& Prix Attrayant'] },
  { x: X0, y: MY, w: MX - X0, h: Y1 - MY, fill: 'rgba(239,68,68,0.06)',  label: ['Profil Risqué'] },
  { x: MX, y: MY, w: X1 - MX, h: Y1 - MY, fill: 'rgba(59,130,246,0.07)', label: ['Qualité à', 'Prix Élevé'] },
];

const SVG_TICKS = [0, 2.5, 5, 7.5, 10];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesTier(score, opt) {
  if (!opt || opt.value === 'any') return true;
  if (score == null) return false;
  if (opt.min != null && score < opt.min) return false;
  if (opt.max != null && score >= opt.max) return false;
  return true;
}

function scoreColor(v) {
  if (v == null) return 'var(--text3)';
  if (v >= 7)   return '#22c55e';
  if (v >= 5.5) return '#86efac';
  if (v >= 4)   return '#f59e0b';
  if (v >= 2.5) return '#f97316';
  return '#ef4444';
}

function getGeoRegion(country) {
  if (!country) return null;
  if (country === 'United States') return 'us';
  return 'europe';
}

// ── TabButton ─────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 20px',
        border: 'none', cursor: 'pointer',
        backgroundColor: 'transparent',
        color: active ? 'var(--text1)' : 'var(--text3)',
        borderBottom: active ? '3px solid #2962FF' : '3px solid transparent',
        marginBottom: '-2px',
        fontWeight: active ? '700' : '500',
        fontSize: '14px',
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ── InlineSelect ──────────────────────────────────────────────────────────────

function InlineSelect({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        display: 'inline-block',
        margin: '0 4px',
        padding: '3px 26px 3px 10px',
        backgroundColor: '#2962FF1a',
        border: '1px solid #2962FF55',
        borderRadius: '20px',
        color: '#60a5fa',
        fontWeight: '700',
        fontSize: 'inherit',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%2360a5fa' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        outline: 'none',
        verticalAlign: 'middle',
        lineHeight: 'inherit',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── QuadrantMatrix ────────────────────────────────────────────────────────────

function QuadrantMatrix({ assets, onSelectTicker }) {
  const [hovered, setHovered] = useState(null);

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Quadrant backgrounds */}
      {QUADRANTS.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill={q.fill} />
      ))}

      {/* Divider lines */}
      <line x1={MX} y1={Y0} x2={MX} y2={Y1} stroke="var(--border)" strokeWidth="1" strokeDasharray="5,4" />
      <line x1={X0} y1={MY} x2={X1} y2={MY} stroke="var(--border)" strokeWidth="1" strokeDasharray="5,4" />

      {/* Axes */}
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--border)" strokeWidth="1.5" />
      <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--border)" strokeWidth="1.5" />

      {/* X ticks + labels */}
      {SVG_TICKS.map(t => (
        <g key={`x${t}`}>
          <line x1={toX(t)} y1={Y1} x2={toX(t)} y2={Y1 + 5} stroke="var(--border)" />
          <text x={toX(t)} y={Y1 + 18} textAnchor="middle" fontSize="11" fill="var(--text3)">{t}</text>
        </g>
      ))}

      {/* Y ticks + labels */}
      {SVG_TICKS.map(t => (
        <g key={`y${t}`}>
          <line x1={X0 - 5} y1={toY(t)} x2={X0} y2={toY(t)} stroke="var(--border)" />
          <text x={X0 - 9} y={toY(t) + 4} textAnchor="end" fontSize="11" fill="var(--text3)">{t}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={(X0 + X1) / 2} y={Y1 + 44} textAnchor="middle" fontSize="12" fill="var(--text2)" fontWeight="600">
        Score Santé →
      </text>
      <text
        x={-(Y0 + Y1) / 2} y={16}
        textAnchor="middle" fontSize="12" fill="var(--text2)" fontWeight="600"
        transform="rotate(-90)"
      >
        Score Valorisation →
      </text>

      {/* Quadrant labels */}
      {QUADRANTS.map((q, i) => {
        const lx = q.x + q.w / 2;
        const ly = q.y + q.h / 2 - (q.label.length - 1) * 8;
        return (
          <g key={`ql${i}`} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {q.label.map((line, j) => (
              <text key={j} x={lx} y={ly + j * 17} textAnchor="middle" fontSize="12" fill="var(--text3)" fontWeight="500">
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Asset bubbles */}
      {assets.map(a => {
        const cx    = toX(a.scores.health    ?? 5);
        const cy    = toY(a.scores.valuation ?? 5);
        const isHov = hovered === a.ticker;
        const r     = isHov ? 13 : 8;
        const color = VERDICT_COLORS[a.scores.verdict] || '#94a3b8';
        const short = a.ticker.replace(/\.(PA|AS)$/i, '');
        const ttW   = 168;
        const ttH   = 50;
        const ttX   = cx + 16 + ttW > SVG_W - 8 ? cx - 14 - ttW : cx + 14;
        const ttY   = Math.max(Y0 + 2, Math.min(Y1 - ttH - 4, cy - 26));

        return (
          <g
            key={a.ticker}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectTicker(a.ticker)}
            onMouseEnter={() => setHovered(a.ticker)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              cx={cx} cy={cy} r={r}
              fill={color}
              fillOpacity={isHov ? 0.95 : 0.72}
              stroke={isHov ? 'white' : 'transparent'}
              strokeWidth={isHov ? 2 : 0}
            />
            {!isHov && (
              <text
                x={cx} y={cy + r + 11}
                textAnchor="middle" fontSize="8.5" fill="var(--text3)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {short.length > 7 ? short.slice(0, 6) + '…' : short}
              </text>
            )}
            {isHov && (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={ttX} y={ttY} width={ttW} height={ttH}
                  rx={5} fill="var(--bg1)" stroke="var(--border)" strokeWidth="1"
                  style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.55))' }}
                />
                <text x={ttX + 10} y={ttY + 17} fontSize="12" fill="var(--text1)" fontWeight="bold">{a.ticker}</text>
                <text x={ttX + 10} y={ttY + 34} fontSize="10" fill="var(--text3)">
                  {(a.name || '').length > 26 ? (a.name || '').slice(0, 24) + '…' : (a.name || '')}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── ResultCard (mobile) ───────────────────────────────────────────────────────

function ResultCard({ asset, onSelectTicker }) {
  const color = VERDICT_COLORS[asset.scores.verdict] || '#94a3b8';
  return (
    <div
      onClick={() => onSelectTicker(asset.ticker)}
      style={{
        backgroundColor: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', color: '#60a5fa', fontSize: '15px' }}>{asset.ticker}</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {asset.name}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '11px', marginTop: '2px' }}>
            {[asset.sector, asset.country].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span style={{
          flexShrink: 0,
          backgroundColor: `${color}20`,
          border: `1px solid ${color}50`,
          color,
          borderRadius: '12px',
          padding: '3px 10px',
          fontSize: '11px', fontWeight: 'bold',
          whiteSpace: 'nowrap',
        }}>
          {asset.scores.verdict}
        </span>
      </div>

      <div style={{ display: 'flex', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        {[
          { label: 'Santé',        val: asset.scores.health },
          { label: 'Valorisation', val: asset.scores.valuation },
          { label: 'Score Global', val: asset.scores.global_score },
        ].map(({ label, val }, i) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '19px', fontWeight: 'bold', color: scoreColor(val) }}>
              {val?.toFixed(1) ?? '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ResultsTable (desktop) ────────────────────────────────────────────────────

function ResultsTable({ assets, onSelectTicker }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg3)', zIndex: 1 }}>
        <tr style={{ borderBottom: '2px solid var(--border)' }}>
          {['Ticker', 'Nom', 'Secteur', 'Santé', 'Val.', 'Global', 'Verdict'].map((h, i) => (
            <th key={h} style={{
              padding: '10px 14px',
              textAlign: i < 3 ? 'left' : 'center',
              color: 'var(--text3)', fontWeight: '600', fontSize: '11px',
              whiteSpace: 'nowrap', letterSpacing: '0.04em',
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {assets.map(a => (
          <tr
            key={a.ticker}
            onClick={() => onSelectTicker(a.ticker)}
            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <td style={{ padding: '11px 14px', fontWeight: 'bold', color: '#60a5fa', whiteSpace: 'nowrap' }}>
              {a.ticker}
            </td>
            <td style={{ padding: '11px 14px', color: 'var(--text2)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {a.name}
            </td>
            <td style={{ padding: '11px 14px', color: 'var(--text3)', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {a.sector || '—'}
            </td>
            <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 'bold', color: scoreColor(a.scores.health) }}>
              {a.scores.health?.toFixed(1) ?? '—'}
            </td>
            <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 'bold', color: scoreColor(a.scores.valuation) }}>
              {a.scores.valuation?.toFixed(1) ?? '—'}
            </td>
            <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 'bold', color: scoreColor(a.scores.global_score) }}>
              {a.scores.global_score?.toFixed(1) ?? '—'}
            </td>
            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: VERDICT_COLORS[a.scores.verdict] || 'var(--text3)', whiteSpace: 'nowrap' }}>
                {a.scores.verdict}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── AdvancedFilters ───────────────────────────────────────────────────────────

function AdvancedFilters({ filters, onChange, sectors }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '16px 20px', marginBottom: '20px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px 20px', marginBottom: '14px' }}>

        <div>
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>GÉOGRAPHIE</label>
          <select value={filters.geo} onChange={e => onChange({ ...filters, geo: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', backgroundColor: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text1)', fontSize: '12px' }}>
            {GEO_OPTIONS_ADV.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>SECTEUR</label>
          <select value={filters.sector} onChange={e => onChange({ ...filters, sector: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', backgroundColor: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text1)', fontSize: '12px' }}>
            <option value="all">Tous les secteurs</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>VERDICT</label>
          <select value={filters.verdict} onChange={e => onChange({ ...filters, verdict: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', backgroundColor: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text1)', fontSize: '12px' }}>
            <option value="all">Tous les profils</option>
            {['Profil Fort', 'Profil Solide', 'Profil Neutre', 'Profil Prudent', 'Profil Fragile'].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {ADV_DIMS.map(dim => (
          <div key={dim}>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>
              {ADV_LABELS[dim].toUpperCase()} ≥ <span style={{ color: 'var(--text1)', fontWeight: 'bold' }}>{filters[dim].toFixed(1)}</span>
            </label>
            <input type="range" min={0} max={10} step={0.5} value={filters[dim]}
              onChange={e => onChange({ ...filters, [dim]: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#2962FF', cursor: 'pointer' }} />
          </div>
        ))}
      </div>

      <button
        onClick={() => onChange({ ...ADV_DEFAULTS })}
        style={{ padding: '4px 12px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--bg2)', color: 'var(--text3)', cursor: 'pointer' }}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}

// ── Main Screener ─────────────────────────────────────────────────────────────

export default function Screener({ onSelectTicker }) {
  const { data, loading, error } = useScreener();
  const { isMobile } = useBreakpoint();
  const { profile } = useProfile();

  // Stratège → avancé par défaut, Explorateur → guidé par défaut
  const [mode, setMode] = useState(() => profile === 'stratege' ? 'advanced' : 'guided');
  useEffect(() => {
    setMode(profile === 'stratege' ? 'advanced' : 'guided');
  }, [profile]);

  // Default: matrix on desktop, list on mobile
  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'matrix'
  );

  // Auto-switch to list when viewport shrinks to mobile width
  useEffect(() => {
    if (isMobile) setActiveTab('list');
  }, [isMobile]);

  const [guidedFilters, setGuidedFilters] = useState({
    geo:       'all',
    sector:    'all',
    health:    'solide',
    valuation: 'any',
  });

  const [advFilters, setAdvFilters] = useState({ ...ADV_DEFAULTS });

  const sectors = useMemo(() => {
    const s = new Set();
    data.forEach(a => { if (a.is_scorable && a.sector) s.add(a.sector); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [data]);

  const filteredAssets = useMemo(() => {
    const scorable = data.filter(a => a.is_scorable && a.scores);

    if (mode === 'guided') {
      const healthOpt = HEALTH_OPTIONS.find(o => o.value === guidedFilters.health);
      const valOpt    = VALUATION_OPTIONS.find(o => o.value === guidedFilters.valuation);
      return scorable.filter(a => {
        if (guidedFilters.geo !== 'all' && getGeoRegion(a.country) !== guidedFilters.geo) return false;
        if (guidedFilters.sector !== 'all' && a.sector !== guidedFilters.sector) return false;
        if (!matchesTier(a.scores.health,    healthOpt)) return false;
        if (!matchesTier(a.scores.valuation, valOpt))    return false;
        return true;
      });
    }

    return scorable.filter(a => {
      if (advFilters.geo !== 'all' && getGeoRegion(a.country) !== advFilters.geo) return false;
      if (advFilters.sector !== 'all' && a.sector !== advFilters.sector) return false;
      if (advFilters.verdict !== 'all' && a.scores.verdict !== advFilters.verdict) return false;
      return ADV_DIMS.every(dim => a.scores[dim] >= advFilters[dim]);
    });
  }, [data, mode, guidedFilters, advFilters]);

  const scorableCount = useMemo(() => data.filter(a => a.is_scorable).length, [data]);

  const handleSelectTicker = (ticker) => {
    captureEvent('screener_asset_selected', { ticker, mode });
    onSelectTicker(ticker);
  };

  if (error) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
      Erreur lors du chargement du screener. Veuillez rafraîchir la page.
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text1)', fontSize: isMobile ? '18px' : '20px' }}>
            Screener Pédagogique
          </h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text3)', fontSize: '13px' }}>
            Explorez les {scorableCount || '…'} actions de notre univers selon leurs scores fondamentaux.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>MODE</span>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[{ value: 'guided', label: '🎓 Guidé' }, { value: 'advanced', label: '⚙️ Avancé' }].map(({ value, label }, i) => (
              <button
                key={value}
                onClick={() => { captureEvent('screener_mode_changed', { mode: value }); setMode(value); }}
                style={{
                  padding: '7px 15px', border: 'none', cursor: 'pointer',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  backgroundColor: mode === value ? '#2962FF' : 'transparent',
                  color: mode === value ? 'white' : 'var(--text3)',
                  fontSize: '12px', fontWeight: 'bold', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Phrase à trous (mode Guidé) ── */}
      {mode === 'guided' && (
        <div style={{
          backgroundColor: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: isMobile ? '12px 14px' : '14px 20px',
          marginBottom: '20px',
          fontSize: isMobile ? '14px' : '15px',
          color: 'var(--text1)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0 4px',
          lineHeight: 2.5,
        }}>
          {/* Chaque <span nowrap> est un item flex atomique : le texte et son select restent ensemble */}
          <span style={{ whiteSpace: 'nowrap' }}>
            Je cherche une entreprise
            <InlineSelect value={guidedFilters.geo} options={GEO_OPTIONS} onChange={v => setGuidedFilters(f => ({ ...f, geo: v }))} />
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>
            dans le secteur
            <InlineSelect
              value={guidedFilters.sector}
              options={[{ value: 'all', label: 'tous les secteurs' }, ...sectors.map(s => ({ value: s, label: s }))]}
              onChange={v => setGuidedFilters(f => ({ ...f, sector: v }))}
            />
            ,
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>
            avec une santé financière
            <InlineSelect value={guidedFilters.health} options={HEALTH_OPTIONS} onChange={v => setGuidedFilters(f => ({ ...f, health: v }))} />
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>
            et une valorisation
            <InlineSelect value={guidedFilters.valuation} options={VALUATION_OPTIONS} onChange={v => setGuidedFilters(f => ({ ...f, valuation: v }))} />.
          </span>
        </div>
      )}

      {/* ── Filtres avancés ── */}
      {mode === 'advanced' && (
        <AdvancedFilters filters={advFilters} onChange={setAdvFilters} sectors={sectors} />
      )}

      {/* ── Chargement ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text3)', fontSize: '14px' }}>
          Chargement des scores…
        </div>
      )}

      {/* ── État vide ── */}
      {!loading && filteredAssets.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
          <div style={{ fontWeight: 'bold', color: 'var(--text1)', fontSize: '15px', marginBottom: '8px' }}>Aucun résultat</div>
          <div style={{ color: 'var(--text3)', fontSize: '13px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.65 }}>
            Nos 64 actifs actuels ne correspondent pas à cette recherche précise.
            Essayez d'élargir vos critères.
          </div>
        </div>
      )}

      {/* ── Onglets + contenu ── */}
      {!loading && filteredAssets.length > 0 && (
        <div>

          {/* Barre d'onglets */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '20px' }}>
            {!isMobile && (
              <TabButton active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')}>
                📊 Vue Matrice
              </TabButton>
            )}
            <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
              📋 Vue Liste
              <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text3)', fontWeight: '400' }}>
                {filteredAssets.length} actif{filteredAssets.length > 1 ? 's' : ''}
              </span>
            </TabButton>
          </div>

          {/* Vue Matrice */}
          {activeTab === 'matrix' && !isMobile && (
            <div style={{
              backgroundColor: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px 20px 16px',
            }}>
              <QuadrantMatrix assets={filteredAssets} onSelectTicker={handleSelectTicker} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: '14px', justifyContent: 'center' }}>
                {Object.entries(VERDICT_COLORS).map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text3)' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vue Liste */}
          {activeTab === 'list' && (
            <div style={{
              backgroundColor: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '0',
              overflow: isMobile ? 'visible' : 'hidden',
            }}>
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredAssets.map(a => (
                    <ResultCard key={a.ticker} asset={a} onSelectTicker={handleSelectTicker} />
                  ))}
                </div>
              ) : (
                <ResultsTable assets={filteredAssets} onSelectTicker={handleSelectTicker} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer MIF2 permanent ── */}
      <div style={{
        marginTop: '24px', padding: '11px 15px',
        backgroundColor: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: '6px', fontSize: '11px', color: 'var(--text3)', lineHeight: 1.65,
      }}>
        <strong style={{ color: '#f59e0b' }}>Avertissement réglementaire (MIF2) :</strong>{' '}
        Les scores sont calculés à partir de métriques fondamentales relatives à des données historiques
        et <strong>ne constituent pas un conseil en investissement</strong>.
        Les performances passées ne présagent pas des performances futures.
        Tout investissement comporte un risque de perte en capital.
        Les labels des quadrants sont purement descriptifs et ne représentent aucune recommandation d'achat ou de vente.
      </div>
    </div>
  );
}
