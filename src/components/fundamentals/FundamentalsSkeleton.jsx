// Injecte les keyframes une seule fois dans le document
let _styleInjected = false;
function _injectStyle() {
  if (_styleInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes skel-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .skel-block {
      background: linear-gradient(90deg, var(--bg3) 25%, var(--border) 50%, var(--bg3) 75%);
      background-size: 400px 100%;
      animation: skel-shimmer 1.4s infinite linear;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(el);
  _styleInjected = true;
}

function Block({ w = '100%', h = 14, mb = 0 }) {
  return (
    <div
      className="skel-block"
      style={{ width: w, height: h, marginBottom: mb || undefined }}
    />
  );
}

export default function FundamentalsSkeleton() {
  _injectStyle();
  return (
    <div style={{ paddingTop: '4px' }}>
      {/* En-tête : nom + secteur + description */}
      <div style={{ marginBottom: '28px' }}>
        <Block w="38%" h={30} mb={10} />
        <Block w="22%" h={13} mb={18} />
        <Block w="100%" h={13} mb={6} />
        <Block w="95%"  h={13} mb={6} />
        <Block w="78%"  h={13} />
      </div>

      {/* Dashboard principal (ScoreDashboard ou MomentumDashboard) */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '28px' }}>
        <Block w="55%" h={180} />
        <Block w="45%" h={180} />
      </div>

      {/* Ligne de MetricCards */}
      <div style={{ marginBottom: '16px' }}>
        <Block w="18%" h={12} mb={14} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {Array.from({ length: 5 }, (_, i) => <Block key={i} h={82} />)}
        </div>
      </div>

      {/* CTA Stratège */}
      <div style={{ marginTop: '28px' }}>
        <Block w="100%" h={72} />
      </div>
    </div>
  );
}
