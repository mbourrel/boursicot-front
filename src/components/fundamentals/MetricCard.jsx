import MetricInfo from './MetricInfo';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Métriques où une valeur PLUS BASSE est un meilleur signal
const LOWER_IS_BETTER = new Set([
  'PER', 'Forward PE', 'Price to Book', 'EV / EBITDA', 'PEG Ratio',
  'Dette/Fonds Propres', 'Actions Shortées',
]);

// Métriques sans signal directionnel clair (pas de coloration)
const NEUTRAL = new Set([
  'Capitalisation', 'Beta', 'Plus Haut 52w', 'Plus Bas 52w',
]);

function MetricCard({ metric, fmt, fmtRaw, large = false }) {
  const { isMobile } = useBreakpoint();
  const hasVal = metric.val !== null && metric.val !== undefined && metric.val !== 0;
  const hasAvg = metric.avg !== null && metric.avg !== undefined && metric.avg !== 0;
  if (!hasVal && !hasAvg) return null;

  const getAvgColor = () => {
    if (!hasVal || !hasAvg || NEUTRAL.has(metric.name)) return 'var(--text3)';
    const better = LOWER_IS_BETTER.has(metric.name)
      ? metric.val <= metric.avg
      : metric.val >= metric.avg;
    return better ? '#26a69a' : '#ef5350';
  };

  // Padding et tailles adaptatifs
  const pad    = isMobile ? '8px 10px'  : large ? '16px 20px' : '10px 12px';
  const valFs  = isMobile ? '15px'      : large ? '24px' : '17px';
  const lblFs  = isMobile ? '10px'      : large ? '12px' : '11px';
  const avgFs  = isMobile ? '11px'      : large ? '14px' : '12px';
  const avgLbl = isMobile ? '9px'       : large ? '10px' : '9px';

  const cardStyle = {
    backgroundColor: 'var(--bg3)',
    padding: pad,
    borderRadius: '8px',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    minHeight: large && !isMobile ? '90px' : undefined,
    overflow: 'hidden',
  };

  return (
    <div style={cardStyle}>
      {/* Label */}
      <span style={{
        color: 'var(--text3)', fontSize: lblFs,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center',
        whiteSpace: isMobile ? 'nowrap' : undefined,
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {metric.displayName ?? metric.name}
        <MetricInfo name={metric.name} />
      </span>

      {/* Valeur principale */}
      <span style={{
        fontSize: valFs, fontWeight: 'bold', color: 'var(--text1)',
        marginTop: isMobile ? '4px' : large ? '10px' : '6px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
      }}>
        {fmt(metric.val, metric.unit)}
      </span>

      {/* Moy. Secteur — en dessous sur mobile, en ligne sur desktop */}
      {hasAvg && (
        isMobile ? (
          <div style={{ marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '1px' }}>
              Moy. sect.<MetricInfo name="Moy. Secteur" />
            </span>
            <span style={{ fontSize: avgFs, fontWeight: 'bold', color: getAvgColor() }}>
              {fmtRaw(metric.avg, metric.unit)}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: avgLbl, color: 'var(--text3)', display: 'inline-flex', alignItems: 'center' }}>
                Moy. Secteur<MetricInfo name="Moy. Secteur" />
              </span>
              <span style={{ fontSize: avgFs, fontWeight: 'bold', color: getAvgColor() }}>
                {fmtRaw(metric.avg, metric.unit)}
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default MetricCard;
