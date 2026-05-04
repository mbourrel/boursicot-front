import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export default function ValuationMethodCard({
  categoryLabel,
  categoryColor,
  title,
  verdict,      // { diff, theoreticalPrice, currency } | null
  unavailable,  // string | null
  isOpen,
  onToggle,
  isDirty,
  onReset,
  formulaNode,
  usageText,
  warningText,
  children,
}) {
  const verdictColor = verdict
    ? (verdict.diff > 0 ? '#26a69a' : '#ef5350')
    : null;

  return (
    <div style={{
      backgroundColor: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em',
            color: categoryColor ?? '#2962FF',
            textTransform: 'uppercase', marginBottom: '2px',
          }}>
            {categoryLabel}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text1)' }}>
            {title}
          </div>
        </div>

        {unavailable ? (
          <span style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic', whiteSpace: 'nowrap', marginRight: '4px' }}>
            N/A
          </span>
        ) : verdict ? (
          <div style={{ textAlign: 'right', marginRight: '4px', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Écart théorique</div>
            <span style={{
              fontSize: '12px', fontWeight: 'bold', color: verdictColor,
              backgroundColor: verdictColor + '1a', padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap',
            }}>
              {verdict.diff > 0 ? '+' : ''}{verdict.diff.toFixed(1)}%
            </span>
          </div>
        ) : null}

        <div style={{ color: 'var(--text3)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* ── Expanded ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>

          {formulaNode && (
            <div style={{
              margin: '14px 0 12px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg2)',
              borderRadius: '7px',
              textAlign: 'center',
              overflowX: 'auto',
            }}>
              {formulaNode}
            </div>
          )}

          {usageText && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6', marginBottom: '12px' }}>
              {usageText}
            </div>
          )}

          {warningText && (
            <div style={{ fontSize: '11px', color: '#ff9800', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '12px' }}>
              ⚠ {warningText}
            </div>
          )}

          {unavailable ? (
            <div style={{ fontSize: '11px', color: '#ff9800', fontStyle: 'italic' }}>{unavailable}</div>
          ) : (
            <>
              {children}

              {verdict && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>Prix théorique</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text1)', lineHeight: 1, marginBottom: '6px' }}>
                    {verdict.theoreticalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {verdict.currency}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 'bold', color: verdictColor,
                      backgroundColor: verdictColor + '1a', padding: '3px 8px', borderRadius: '4px',
                    }}>
                      {verdict.diff > 0 ? '+' : ''}{verdict.diff.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                      écart théorique avec le cours actuel
                    </span>
                  </div>
                </div>
              )}

              {isDirty && (
                <button
                  onClick={e => { e.stopPropagation(); onReset(); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    marginTop: '12px', fontSize: '11px', color: 'var(--text3)',
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: '5px', padding: '3px 8px', cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={11} /> Réinitialiser
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
