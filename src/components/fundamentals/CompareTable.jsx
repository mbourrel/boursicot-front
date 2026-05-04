import { useState, memo } from 'react';
import { ASSET_COLORS } from '../CompareBar';
import { h3Style } from './styles';

const CompareTable = memo(function CompareTable({ label, rows, renderRow, allSymbols, dataMap, colWidth, isMobile }) {
  const [scrolled, setScrolled] = useState(false);
  if (rows.length === 0) return null;

  const LABEL_W  = 130;
  const DATA_W   = 120;
  const tableMin = isMobile ? `${LABEL_W + allSymbols.length * DATA_W}px` : undefined;

  const stickyBase = {
    position: 'sticky', left: 0, zIndex: 10,
    boxShadow: scrolled ? '3px 0 8px -2px rgba(0,0,0,0.55)' : 'none',
    borderRight: scrolled ? '1px solid var(--border)' : '1px solid transparent',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  };

  return (
    <div style={{ marginBottom: '36px' }}>
      <h3 style={{ ...h3Style, borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
        {label}
      </h3>
      <div
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '6px', maxWidth: '100%', overscrollBehaviorX: 'contain' }}
        onScroll={e => setScrolled(e.currentTarget.scrollLeft > 4)}
      >
        <table style={{ width: isMobile ? undefined : '100%', minWidth: tableMin, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                width: isMobile ? `${LABEL_W}px` : '20%',
                padding: '10px 12px', textAlign: 'left',
                color: 'var(--text3)', fontSize: '11px',
                borderBottom: '1px solid var(--border)', fontWeight: 'normal',
                backgroundColor: 'var(--bg0)',
                ...stickyBase, zIndex: 20,
              }}>
                MÉTRIQUE
              </th>
              {allSymbols.map((sym, i) => (
                <th key={sym} style={{
                  width: isMobile ? `${DATA_W}px` : colWidth,
                  minWidth: isMobile ? `${DATA_W}px` : undefined,
                  padding: '10px 12px', textAlign: 'right',
                  color: ASSET_COLORS[i], fontSize: '12px',
                  borderBottom: '1px solid var(--border)', fontWeight: 'bold',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: isMobile ? `${DATA_W}px` : undefined,
                }}>
                  {dataMap[sym]?.name || sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((name, rowIdx) => renderRow(name, rowIdx, scrolled))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default CompareTable;
