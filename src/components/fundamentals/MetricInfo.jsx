import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import EXPLANATIONS from '../../constants/metricExplanations';

function MetricInfo({ name }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const text = EXPLANATIONS[name];
  if (!text) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipWidth = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.left;
    const left = spaceRight >= tooltipWidth + 8
      ? rect.left
      : Math.max(8, rect.right - tooltipWidth);
    setPos({
      left,
      ...(spaceBelow >= 180
        ? { top: rect.bottom + 6 }
        : { top: rect.top - 6, transform: 'translateY(-100%)' }),
    });
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '5px' }}>
      <button
        ref={btnRef}
        onClick={handleClick}
        style={{
          background: pos ? '#2962FF22' : 'transparent',
          border: `1px solid ${pos ? '#2962FF88' : 'var(--border)'}`,
          color: pos ? '#2962FF' : 'var(--text3)',
          borderRadius: '50%', width: '14px', height: '14px',
          fontSize: '9px', fontWeight: 'bold', cursor: 'pointer',
          padding: 0, lineHeight: 1, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >i</button>
      {pos && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setPos(null)} />
          <div style={{
            position: 'fixed', top: pos.top, left: pos.left,
            transform: pos.transform ?? 'none', zIndex: 999, width: '260px',
            backgroundColor: 'var(--bg2)', border: '1px solid #2962FF44',
            borderRadius: '8px', padding: '10px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '11px', color: '#b0b8c4', lineHeight: '1.65',
          }}>
            <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>{name}</div>
            {text}
          </div>
        </>,
        document.body
      )}
    </span>
  );
}

export default MetricInfo;
