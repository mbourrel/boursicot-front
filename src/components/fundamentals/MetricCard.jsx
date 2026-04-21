import MetricInfo from './MetricInfo';

const cardStyle = {
  backgroundColor: 'var(--bg3)', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

function MetricCard({ metric, fmt, fmtRaw }) {
  const hasVal = metric.val !== null && metric.val !== undefined && metric.val !== 0;
  const hasAvg = metric.avg !== null && metric.avg !== undefined && metric.avg !== 0;
  if (!hasVal && !hasAvg) return null;

  return (
    <div style={cardStyle}>
      <span style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
        {metric.name}
        <MetricInfo name={metric.name} />
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text1)' }}>{fmt(metric.val, metric.unit)}</span>
        {metric.avg !== 0 && metric.avg !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '9px', color: 'var(--text3)' }}>Moy. Secteur</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: metric.val >= metric.avg ? '#26a69a' : '#ef5350' }}>
              {fmtRaw(metric.avg, metric.unit)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
