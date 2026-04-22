import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatVal(val, unit) {
  if (val === null || val === undefined) return '—';
  if (unit === '%') return `${val.toFixed(1)}%`;
  if (unit === 'x') return `${val.toFixed(2)}x`;
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)} T$`;
  if (abs >= 1e9)  return `${sign}${(abs / 1e9).toFixed(2)} Md$`;
  if (abs >= 1e6)  return `${sign}${(abs / 1e6).toFixed(2)} M$`;
  if (abs >= 1e3)  return `${sign}${(abs / 1e3).toFixed(2)} k$`;
  return `${sign}${abs.toFixed(2)} $`;
}

// ── Graphique SVG ──────────────────────────────────────────────────────────

const W = 560, H = 240;
const PAD = { top: 20, right: 20, bottom: 36, left: 68 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;
const COMPANY_COLOR = '#2962FF';
const SECTOR_COLOR  = '#8c7ae6';

function LineChart({ years, companyVals, sectorVals, unit, companyName }) {
  const [hover, setHover] = useState(null);

  // Toutes les valeurs pour l'échelle
  const allVals = [...companyVals, ...sectorVals].filter(v => v !== null && v !== undefined);
  if (allVals.length === 0) return <p style={{ color: 'var(--text3)', textAlign: 'center' }}>Pas de données.</p>;

  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const padV  = range * 0.12;
  const yMin  = minV - padV;
  const yMax  = maxV + padV;

  const xOf = (i) => PAD.left + (i / (years.length - 1 || 1)) * INNER_W;
  const yOf = (v) => v === null ? null : PAD.top + INNER_H - ((v - yMin) / (yMax - yMin)) * INNER_H;

  const buildPath = (vals) => {
    const pts = vals.map((v, i) => v !== null ? `${xOf(i)},${yOf(v)}` : null).filter(Boolean);
    return pts.length > 1 ? `M ${pts.join(' L ')}` : null;
  };

  // Ticks Y (4 niveaux)
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grille horizontale */}
        {yTicks.map((v, i) => {
          const cy = yOf(v);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={cy} x2={W - PAD.right} y2={cy}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD.left - 6} y={cy + 4} textAnchor="end"
                fill="var(--text3)" fontSize="10">
                {formatVal(v, unit)}
              </text>
            </g>
          );
        })}

        {/* Ligne entreprise */}
        {buildPath(companyVals) && (
          <path d={buildPath(companyVals)} fill="none" stroke={COMPANY_COLOR} strokeWidth="2.5" strokeLinejoin="round" />
        )}

        {/* Ligne secteur (tiretée) */}
        {buildPath(sectorVals) && (
          <path d={buildPath(sectorVals)} fill="none" stroke={SECTOR_COLOR} strokeWidth="2"
            strokeDasharray="6 4" strokeLinejoin="round" />
        )}

        {/* Points entreprise */}
        {companyVals.map((v, i) => v !== null && (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={hover === i ? 6 : 4}
            fill={COMPANY_COLOR} stroke="var(--bg2)" strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.1s' }}
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {/* Points secteur */}
        {sectorVals.map((v, i) => v !== null && (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3}
            fill={SECTOR_COLOR} stroke="var(--bg2)" strokeWidth="2" />
        ))}

        {/* Axe X — labels années */}
        {years.map((y, i) => (
          <text key={i} x={xOf(i)} y={H - 8} textAnchor="middle"
            fill="var(--text3)" fontSize="11" fontWeight="bold">
            {y}
          </text>
        ))}

        {/* Tooltip au survol */}
        {hover !== null && (() => {
          const cv = companyVals[hover];
          const sv = sectorVals[hover];
          const cx = xOf(hover);
          const tooltipX = cx > W - 140 ? cx - 130 : cx + 12;
          const tooltipY = PAD.top;
          return (
            <g>
              {/* Ligne verticale */}
              <line x1={cx} y1={PAD.top} x2={cx} y2={H - PAD.bottom}
                stroke="var(--text3)" strokeWidth="1" strokeDasharray="3 3" />
              {/* Bulle */}
              <rect x={tooltipX} y={tooltipY} width={118} height={cv !== null && sv !== null ? 58 : 38}
                rx="6" fill="var(--bg2)" stroke="var(--border)" strokeWidth="1" />
              <text x={tooltipX + 8} y={tooltipY + 16} fill="var(--text3)" fontSize="10" fontWeight="bold">
                {years[hover]}
              </text>
              {cv !== null && (
                <text x={tooltipX + 8} y={tooltipY + 32} fill={COMPANY_COLOR} fontSize="11">
                  ● {formatVal(cv, unit)}
                </text>
              )}
              {sv !== null && (
                <text x={tooltipX + 8} y={tooltipY + (cv !== null ? 50 : 32)} fill={SECTOR_COLOR} fontSize="11">
                  ◆ {formatVal(sv, unit)}
                </text>
              )}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

/**
 * Props :
 *   metricName   — string
 *   unit         — "$" | "%" | "x"
 *   companyName  — string
 *   years        — string[]  ex: ["2025-09-30", "2024-09-30", ...]
 *   companyVals  — (number|null)[]  même ordre que years
 *   sectorYearMap— { "2025": number, "2024": number, ... } ou null
 *   onClose      — () => void
 */
function MetricHistoryModal({ metricName, unit, companyName, years, companyVals, sectorYearMap, onClose }) {
  // Normalise les années (YYYY) et aligne les données du + ancien au + récent
  const rawPairs = years.map((y, i) => ({ year: String(y).slice(0, 4), val: companyVals[i] }));
  const sorted   = [...rawPairs].sort((a, b) => a.year.localeCompare(b.year));

  const chartYears   = sorted.map(p => p.year);
  const chartCompany = sorted.map(p => p.val);
  const chartSector  = sorted.map(p => sectorYearMap?.[p.year] ?? null);

  const hasSector = chartSector.some(v => v !== null);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px 28px', width: '640px', maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '15px' }}>{metricName}</div>
            <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '3px' }}>
              Évolution sur {chartYears.length} an{chartYears.length > 1 ? 's' : ''} — {companyName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}
          >
            ✕
          </button>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '24px', height: '3px', backgroundColor: COMPANY_COLOR, borderRadius: '2px' }} />
            <span style={{ color: 'var(--text2)' }}>{companyName}</span>
          </span>
          {hasSector && (
            <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '24px', height: '0', borderTop: `2px dashed ${SECTOR_COLOR}` }} />
              <span style={{ color: 'var(--text2)' }}>Moy. Sectorielle</span>
            </span>
          )}
        </div>

        {/* Graphique */}
        <LineChart
          years={chartYears}
          companyVals={chartCompany}
          sectorVals={chartSector}
          unit={unit}
          companyName={companyName}
        />

        {/* Tableau récapitulatif */}
        <div style={{ marginTop: '18px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ ...thS, textAlign: 'left' }}>Indicateur</th>
                {chartYears.map(y => (
                  <th key={y} style={{ ...thS, textAlign: 'right' }}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdS, color: COMPANY_COLOR, fontWeight: 'bold' }}>{companyName}</td>
                {chartCompany.map((v, i) => (
                  <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: 'bold', color: 'var(--text1)' }}>
                    {formatVal(v, unit)}
                  </td>
                ))}
              </tr>
              {hasSector && (
                <tr>
                  <td style={{ ...tdS, color: SECTOR_COLOR, fontWeight: 'bold' }}>Moy. Secteur</td>
                  {chartSector.map((v, i) => (
                    <td key={i} style={{ ...tdS, textAlign: 'right', color: 'var(--text3)' }}>
                      {formatVal(v, unit)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thS = { padding: '6px 10px', color: 'var(--text3)', fontSize: '11px', borderBottom: '1px solid var(--border)', fontWeight: 'bold' };
const tdS = { padding: '7px 10px', borderBottom: '1px solid var(--border)' };

export default MetricHistoryModal;
