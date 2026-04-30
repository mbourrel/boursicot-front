import MetricInfo from './MetricInfo';

// Métriques où une valeur PLUS BASSE est un meilleur signal
const LOWER_IS_BETTER = new Set([
  'PER', 'Forward PE', 'Price to Book', 'EV / EBITDA', 'PEG Ratio',
  'Dette/Fonds Propres', 'Actions Shortées',
]);

// Métriques sans signal directionnel clair (pas de coloration)
const NEUTRAL = new Set([
  'Capitalisation', 'Beta', 'Plus Haut 52w', 'Plus Bas 52w',
]);

const cardStyle = {
  backgroundColor: 'var(--bg3)', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

function MetricCard({ metric, fmt, fmtRaw }) {
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

  return (
    <div style={cardStyle}>
      <span style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
        {metric.displayName ?? metric.name}
        <MetricInfo name={metric.name} />
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text1)' }}>{fmt(metric.val, metric.unit)}</span>
        {hasAvg && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '9px', color: 'var(--text3)', display: 'inline-flex', alignItems: 'center' }}>
              Moy. Secteur<MetricInfo name="Moy. Secteur" />
            </span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: getAvgColor() }}>
              {fmtRaw(metric.avg, metric.unit)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
