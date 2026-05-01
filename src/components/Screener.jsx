import { useState, useMemo, useRef } from 'react';
import { useScreener } from '../hooks/useScreener';
import { useBreakpoint } from '../hooks/useBreakpoint';
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

const VERDICT_COLORS = {
  'Profil Fort':    '#22c55e',
  'Profil Solide':  '#86efac',
  'Profil Neutre':  '#f59e0b',
  'Profil Prudent': '#f97316',
  'Profil Fragile': '#ef4444',
};

const ADV_DIMS = ['health', 'valuation', 'growth', 'momentum', 'efficiency', 'dividend'];
const ADV_LABELS = {
  health: 'Santé', valuation: 'Valorisation', growth: 'Croissance',
  momentum: 'Momentum', efficiency: 'Efficacité', dividend: 'Dividende',
};

// ── SVG geometry ──────────────────────────────────────────────────────────────

const SVG_W = 480;
const SVG_H = 340;
const PAD   = { top: 28, right: 16, bottom: 46, left: 50 };
const X0 = PAD.left;
const X1 = SVG_W - PAD.right;
const Y0 = PAD.top;
const Y1 = SVG_H - PAD.bottom;
const PW = X1 - X0;
const PH = Y1 - Y0;

const toX  = s => X0 + (s / 10) * PW;
const toY  = s => Y1 - (s / 10) * PH;
const MX   = toX(5);
const MY   = toY(5);

const QUADRANTS = [
  {
    x: X0, y: Y0, w: MX - X0, h: MY - Y0,
    fill: 'rgba(245,158,11,0.07)',
    label: ['Prix Bas,', 'Fondamentaux Fragiles'],
  },
  {
    x: MX, y: Y0, w: X1 - MX, h: MY - Y0,
    fill: 'rgba(34,197,94,0.09)',
    label: ['Fondations Solides', '& Prix Attrayant'],
  },
  {
    x: X0, y: MY, w: MX - X0, h: Y1 - MY,
    fill: 'rgba(239,68,68,0.06)',
    label: ['Profil Risqué'],
  },
  {
    x: MX, y: MY, w: X1 - MX, h: Y1 - MY,
    fill: 'rgba(59,130,246,0.07)',
    label: ['Qualité à', 'Prix Élevé'],
  },
];

const SVG_TICKS = [0, 2.5, 5, 7.5, 10];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesTier(score, opt) {
  if (!opt || opt.value === 'any') return true;
  if (opt.min !== undefined && score < opt.min)  return false;
  if (opt.max !== undefined && score >= opt.max) return false;
  return true;
}

function scoreColor(v) {
  if (v >= 7)  return '#22c55e';
  if (v >= 5)  return '#f59e0b';
  return '#ef4444';
}

// ── InlineSelect (dropdown intégré dans la phrase guidée) ─────────────────────

function InlineSelect({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        display: 'inline-block', margin: '0 3px',
        padding: '2px 6px', borderRadius: '4px',
        backgroundColor: 'var(--bg2)',
        border: '1px solid #2962FF',
        color: '#60a5fa', fontWeight: 'bold',
        fontSize: 'inherit', cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── QuadrantMatrix ────────────────────────────────────────────────────────────

function QuadrantMatrix({ assets, onSelectTicker }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  const handleEnter = (e, asset) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, asset });
  };

  const handleMove = (e) => {
    if (!tooltip) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', color: 'var(--text3)' }}
        role="img"
        aria-label="Matrice quadrant : Score Santé (axe X) vs Score Valorisation (axe Y)"
        onMouseMove={handleMove}
      >
        {/* ── Quadrant backgrounds + watermark labels ── */}
        {QUADRANTS.map((q, i) => (
          <g key={i}>
            <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.fill} />
            {q.label.map((line, li) => (
              <text
                key={li}
                x={q.x + q.w / 2}
                y={q.y + q.h / 2 + (li - (q.label.length - 1) / 2) * 14}
                textAnchor="middle"
                fill="currentColor"
                fillOpacity="0.18"
                fontSize="10"
                fontWeight="500"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {line}
              </text>
            ))}
          </g>
        ))}

        {/* ── Axis borders ── */}
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />

        {/* ── Quadrant dividers ── */}
        <line x1={MX} y1={Y0} x2={MX} y2={Y1} stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
        <line x1={X0} y1={MY} x2={X1} y2={MY} stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />

        {/* ── Ticks ── */}
        {SVG_TICKS.map(v => (
          <g key={v}>
            <text x={toX(v)} y={Y1 + 14} textAnchor="middle" fill="currentColor" fillOpacity="0.45" fontSize="9">
              {v}
            </text>
            <text x={X0 - 6} y={toY(v) + 3} textAnchor="end" fill="currentColor" fillOpacity="0.45" fontSize="9">
              {v}
            </text>
          </g>
        ))}

        {/* ── Axis labels ── */}
        <text
          x={(X0 + X1) / 2}
          y={SVG_H - 6}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity="0.5"
          fontSize="10"
        >
          Score Santé →
        </text>
        <text
          x={11}
          y={(Y0 + Y1) / 2}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity="0.5"
          fontSize="10"
          transform={`rotate(-90, 11, ${(Y0 + Y1) / 2})`}
        >
          Score Valorisation →
        </text>

        {/* ── Bubbles ── */}
        {assets.map(a => {
          const cx    = toX(a.scores.health);
          const cy    = toY(a.scores.valuation);
          const color = VERDICT_COLORS[a.scores.verdict] || '#94a3b8';
          const isHov = tooltip?.asset?.ticker === a.ticker;
          return (
            <circle
              key={a.ticker}
              cx={cx} cy={cy}
              r={isHov ? 9 : 7}
              fill={color}
              opacity={isHov ? 1 : 0.82}
              stroke={isHov ? 'white' : 'rgba(255,255,255,0.25)'}
              strokeWidth={isHov ? 2 : 1}
              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
              onMouseEnter={e => handleEnter(e, a)}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => onSelectTicker(a.ticker)}
            />
          );
        })}
      </svg>

      {/* ── Floating tooltip ── */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth ?? 400) - 160),
            top: Math.max(tooltip.y - 50, 4),
            backgroundColor: 'var(--bg1)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '7px 11px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            minWidth: '148px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: 'var(--text1)' }}>{tooltip.asset.ticker}</div>
          <div style={{ color: 'var(--text2)', fontSize: '11px', marginBottom: '4px' }}>
            {tooltip.asset.name}
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
            <span style={{ color: '#60a5fa' }}>
              Santé <b>{tooltip.asset.scores.health?.toFixed(1)}</b>
            </span>
            <span style={{ color: '#a78bfa' }}>
              Val. <b>{tooltip.asset.scores.valuation?.toFixed(1)}</b>
            </span>
          </div>
          <div style={{
            marginTop: '3px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: VERDICT_COLORS[tooltip.asset.scores.verdict] || 'var(--text3)',
          }}>
            {tooltip.asset.scores.verdict}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ResultsTable ──────────────────────────────────────────────────────────────

function ResultsTable({ assets, onSelectTicker }) {
  if (assets.length === 0) return null;

  return (
    <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg3)', zIndex: 1 }}>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Ticker', 'Nom', 'Santé', 'Val.', 'Verdict'].map(h => (
              <th
                key={h}
                style={{
                  padding: '8px 10px',
                  textAlign: h === 'Ticker' || h === 'Nom' ? 'left' : 'center',
                  color: 'var(--text3)', fontWeight: '600', fontSize: '11px',
                  whiteSpace: 'nowrap',
                }}
              >
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
              style={{
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '9px 10px', fontWeight: 'bold', color: '#60a5fa', whiteSpace: 'nowrap' }}>
                {a.ticker}
              </td>
              <td style={{
                padding: '9px 10px', color: 'var(--text2)',
                maxWidth: '140px', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {a.name}
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold', color: scoreColor(a.scores.health) }}>
                  {a.scores.health?.toFixed(1) ?? '—'}
                </span>
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold', color: scoreColor(a.scores.valuation) }}>
                  {a.scores.valuation?.toFixed(1) ?? '—'}
                </span>
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 'bold',
                  color: VERDICT_COLORS[a.scores.verdict] || 'var(--text3)',
                }}>
                  {a.scores.verdict}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── AdvancedFilters ───────────────────────────────────────────────────────────

const ADV_DEFAULTS = {
  sector: 'all', verdict: 'all',
  health: 0, valuation: 0, growth: 0, momentum: 0, efficiency: 0, dividend: 0,
};

function AdvancedFilters({ filters, onChange, sectors }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '16px 20px', marginBottom: '20px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))',
        gap: '14px 20px',
        marginBottom: '14px',
      }}>
        {/* Sector */}
        <div>
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>
            SECTEUR
          </label>
          <select
            value={filters.sector}
            onChange={e => onChange({ ...filters, sector: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', backgroundColor: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text1)', fontSize: '12px' }}
          >
            <option value="all">Tous les secteurs</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Verdict */}
        <div>
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>
            VERDICT
          </label>
          <select
            value={filters.verdict}
            onChange={e => onChange({ ...filters, verdict: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', backgroundColor: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text1)', fontSize: '12px' }}
          >
            <option value="all">Tous les profils</option>
            {['Profil Fort', 'Profil Solide', 'Profil Neutre', 'Profil Prudent', 'Profil Fragile'].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Score sliders */}
        {ADV_DIMS.map(dim => (
          <div key={dim}>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', fontWeight: '700', letterSpacing: '0.06em' }}>
              {ADV_LABELS[dim].toUpperCase()} ≥{' '}
              <span style={{ color: 'var(--text1)', fontWeight: 'bold' }}>{filters[dim].toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0} max={10} step={0.5}
              value={filters[dim]}
              onChange={e => onChange({ ...filters, [dim]: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#2962FF', cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onChange({ ...ADV_DEFAULTS })}
        style={{
          padding: '4px 12px', fontSize: '11px',
          border: '1px solid var(--border)', borderRadius: '4px',
          backgroundColor: 'var(--bg2)', color: 'var(--text3)',
          cursor: 'pointer',
        }}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}

// ── Main Screener ─────────────────────────────────────────────────────────────

export default function Screener({ onSelectTicker }) {
  const { data, loading, error } = useScreener();
  const { isMobile }             = useBreakpoint();

  // Mode toggle
  const [mode, setMode] = useState('guided');

  // Guided mode — pre-filled as specified
  const [guidedFilters, setGuidedFilters] = useState({
    sector:    'all',
    health:    'solide',
    valuation: 'any',
  });

  // Advanced mode
  const [advFilters, setAdvFilters] = useState({ ...ADV_DEFAULTS });

  // Sector list derived from scorable assets
  const sectors = useMemo(() => {
    const s = new Set();
    data.forEach(a => { if (a.is_scorable && a.sector) s.add(a.sector); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [data]);

  // Filtered asset list
  const filteredAssets = useMemo(() => {
    const scorable = data.filter(a => a.is_scorable && a.scores);

    if (mode === 'guided') {
      const healthOpt = HEALTH_OPTIONS.find(o => o.value === guidedFilters.health);
      const valOpt    = VALUATION_OPTIONS.find(o => o.value === guidedFilters.valuation);

      return scorable.filter(a => {
        if (guidedFilters.sector !== 'all' && a.sector !== guidedFilters.sector) return false;
        if (!matchesTier(a.scores.health,    healthOpt)) return false;
        if (!matchesTier(a.scores.valuation, valOpt))    return false;
        return true;
      });
    }

    // Advanced mode
    return scorable.filter(a => {
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

  // ── Error state ──
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
          <h2 style={{ margin: 0, color: 'var(--text1)', fontSize: '20px' }}>Screener Pédagogique</h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text3)', fontSize: '13px' }}>
            Explorez les {scorableCount || '…'} actions de notre univers selon leurs scores fondamentaux.
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>MODE</span>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[
              { value: 'guided',   label: '🎓 Guidé' },
              { value: 'advanced', label: '⚙️ Avancé' },
            ].map(({ value, label }, i) => (
              <button
                key={value}
                onClick={() => { captureEvent('screener_mode_changed', { mode: value }); setMode(value); }}
                style={{
                  padding: '7px 15px', border: 'none', cursor: 'pointer',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  backgroundColor: mode === value ? '#2962FF' : 'transparent',
                  color: mode === value ? 'white' : 'var(--text3)',
                  fontSize: '12px', fontWeight: 'bold', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Guided filter sentence ── */}
      {mode === 'guided' && (
        <div style={{
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
          fontSize: '15px', color: 'var(--text1)', lineHeight: 2.2,
        }}>
          Je cherche une entreprise du secteur
          <InlineSelect
            value={guidedFilters.sector}
            options={[
              { value: 'all', label: 'Tous les secteurs' },
              ...sectors.map(s => ({ value: s, label: s })),
            ]}
            onChange={v => setGuidedFilters(f => ({ ...f, sector: v }))}
          />
          avec une santé financière
          <InlineSelect
            value={guidedFilters.health}
            options={HEALTH_OPTIONS}
            onChange={v => setGuidedFilters(f => ({ ...f, health: v }))}
          />
          et une valorisation
          <InlineSelect
            value={guidedFilters.valuation}
            options={VALUATION_OPTIONS}
            onChange={v => setGuidedFilters(f => ({ ...f, valuation: v }))}
          />
        </div>
      )}

      {/* ── Advanced filters ── */}
      {mode === 'advanced' && (
        <AdvancedFilters filters={advFilters} onChange={setAdvFilters} sectors={sectors} />
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text3)', fontSize: '14px' }}>
          Chargement des scores…
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filteredAssets.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
          <div style={{ fontWeight: 'bold', color: 'var(--text1)', fontSize: '15px', marginBottom: '8px' }}>
            Aucun résultat
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '13px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.65 }}>
            Nos 64 actifs actuels ne correspondent pas à cette recherche précise.
            Essayez d'élargir vos critères.
          </div>
        </div>
      )}

      {/* ── Split screen : Matrice + Tableau ── */}
      {!loading && filteredAssets.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '14px',
          alignItems: 'flex-start',
        }}>

          {/* ── Gauche (60%) : Matrice quadrant ── */}
          <div style={{
            flex: isMobile ? undefined : '0 0 60%',
            width: isMobile ? '100%' : undefined,
            backgroundColor: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
                Matrice Santé / Valorisation
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                {filteredAssets.length} actif{filteredAssets.length > 1 ? 's' : ''} — clic pour analyser
              </span>
            </div>

            <QuadrantMatrix assets={filteredAssets} onSelectTicker={handleSelectTicker} />

            {/* Légende verdict */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '10px' }}>
              {Object.entries(VERDICT_COLORS).map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text3)' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Droite (40%) : Tableau des résultats ── */}
          <div style={{
            flex: isMobile ? undefined : '1 1 0%',
            width: isMobile ? '100%' : undefined,
            backgroundColor: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
                Résultats
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                clic → Analyse détaillée
              </span>
            </div>
            <ResultsTable assets={filteredAssets} onSelectTicker={handleSelectTicker} />
          </div>
        </div>
      )}

      {/* ── Disclaimer MIF2 permanent ── */}
      <div style={{
        marginTop: '24px',
        padding: '11px 15px',
        backgroundColor: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: '6px',
        fontSize: '11px',
        color: 'var(--text3)',
        lineHeight: 1.65,
      }}>
        <strong style={{ color: '#f59e0b' }}>Avertissement réglementaire (MIF2) :</strong>{' '}
        Les scores affichés sont calculés à partir de métriques fondamentales relatives à des données historiques
        et <strong>ne constituent pas un conseil en investissement</strong>.
        Les performances passées ne présagent pas des performances futures.
        Tout investissement comporte un risque de perte en capital.
        Les labels des quadrants sont purement descriptifs et ne représentent
        aucune recommandation d'achat ou de vente.
      </div>
    </div>
  );
}
