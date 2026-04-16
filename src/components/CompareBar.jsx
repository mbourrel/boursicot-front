import { useState, useRef, useEffect } from 'react';

export const ASSET_COLORS = ['#2962FF', '#26a69a', '#e91e63', '#ff9800', '#9c27b0'];

function CompareBar({ primarySymbol, compareSymbols, setCompareSymbols, allAssets }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const allSelected = [primarySymbol, ...compareSymbols];
  const canAdd = allSelected.length < 5;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (ticker) => {
    if (!compareSymbols.includes(ticker) && ticker !== primarySymbol && compareSymbols.length < 4) {
      setCompareSymbols(prev => [...prev, ticker]);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleRemove = (ticker) => {
    setCompareSymbols(prev => prev.filter(s => s !== ticker));
  };

  const filtered = allAssets.filter(a =>
    !allSelected.includes(a.ticker) &&
    (a.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 12);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      flexWrap: 'wrap', marginBottom: '12px',
    }}>
      {/* Chip actif primaire */}
      <Chip
        label={primarySymbol}
        color={ASSET_COLORS[0]}
        isPrimary
      />

      {/* Chips actifs de comparaison */}
      {compareSymbols.map((ticker, i) => (
        <Chip
          key={ticker}
          label={ticker}
          color={ASSET_COLORS[i + 1]}
          onRemove={() => handleRemove(ticker)}
        />
      ))}

      {/* Bouton + Ajouter */}
      {canAdd && (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setIsOpen(o => !o); setSearchTerm(''); }}
            style={{
              padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
              border: '1px dashed #2B2B43', background: 'transparent',
              color: '#8a919e', fontSize: '12px', fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2962FF'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2B2B43'}
          >
            + Comparer
          </button>

          {isOpen && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 100,
              width: '240px', backgroundColor: '#1e222d',
              border: '1px solid #2B2B43', borderRadius: '8px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px' }}>
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '4px',
                    backgroundColor: '#131722', color: 'white',
                    border: '1px solid #2B2B43', outline: 'none',
                    fontSize: '12px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 6px 0', maxHeight: '250px', overflowY: 'auto' }}>
                {filtered.length > 0 ? filtered.map(a => (
                  <li
                    key={a.ticker}
                    onClick={() => handleAdd(a.ticker)}
                    style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'baseline' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2962FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>{a.name || a.ticker}</span>
                    <span style={{ color: '#00bcd4', fontSize: '11px' }}>({a.ticker})</span>
                  </li>
                )) : (
                  <li style={{ padding: '8px 12px', color: '#8a919e', fontSize: '12px', fontStyle: 'italic' }}>
                    Aucun résultat
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Indication max atteint */}
      {!canAdd && (
        <span style={{ fontSize: '11px', color: '#8a919e', fontStyle: 'italic' }}>
          Maximum 5 actifs
        </span>
      )}
    </div>
  );
}

function Chip({ label, color, isPrimary, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '20px',
      border: `1px solid ${color}`,
      backgroundColor: `${color}18`,
      fontSize: '12px', fontWeight: 'bold',
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <span style={{ color: 'white' }}>{label}</span>
      {isPrimary && <span style={{ color: color, fontSize: '10px' }}>primaire</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'none', border: 'none', color: '#8a919e',
            cursor: 'pointer', padding: '0', fontSize: '14px', lineHeight: 1,
            marginLeft: '2px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef5350'}
          onMouseLeave={e => e.currentTarget.style.color = '#8a919e'}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default CompareBar;
