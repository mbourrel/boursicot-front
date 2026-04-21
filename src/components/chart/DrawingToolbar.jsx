const DRAW_TOOLS  = [
  { id: 'trend', label: 'Tendance' },
  { id: 'hline', label: 'Horizontal' },
  { id: 'vline', label: 'Vertical' },
  { id: 'zone',  label: 'Zone' },
  { id: 'fib',   label: 'Fibonacci' },
];
const DRAW_COLORS = ['#f59e0b', '#ef5350', '#26a69a', '#2962FF', '#9c27b0', '#e0e0e0'];

function DrawingToolbar({ activeTool, setActiveTool, drawColor, setDrawColor, onUndo, onClear, hintText }) {
  const btnStyle = (isActive, activeColor = '#374151') => ({
    padding: '6px 10px', background: isActive ? activeColor : 'transparent',
    color: isActive ? 'white' : 'var(--text3)',
    border: `1px solid ${isActive ? activeColor : 'var(--border)'}`,
    borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)' }}>

      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '4px' }}>OUTIL :</span>
        {DRAW_TOOLS.map(t => (
          <button key={t.id} style={btnStyle(activeTool === t.id)} onClick={() => setActiveTool(activeTool === t.id ? null : t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', flexShrink: 0 }} />

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '2px' }}>COULEUR :</span>
        {DRAW_COLORS.map(c => (
          <button
            key={c} onClick={() => setDrawColor(c)}
            style={{
              width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c,
              border: `2px solid ${drawColor === c ? 'white' : 'transparent'}`,
              cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'border 0.15s',
            }}
          />
        ))}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', flexShrink: 0 }} />

      <button style={{ ...btnStyle(false), color: '#f59e0b', borderColor: '#f59e0b40' }} onClick={onUndo} title="Annuler le dernier dessin">
        ↩ Annuler
      </button>
      <button style={{ ...btnStyle(false), color: '#ef5350', borderColor: '#ef535040' }} onClick={onClear}>
        Tout effacer
      </button>

      {hintText && (
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic', marginLeft: '4px' }}>
          {hintText}
        </span>
      )}
    </div>
  );
}

export default DrawingToolbar;
