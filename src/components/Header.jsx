import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Bouton toggle dark/light ──────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      style={{
        position: 'relative',
        width: '44px',
        height: '24px',
        backgroundColor: isDark ? '#2962FF' : '#d0d5e3',
        borderRadius: '12px',
        cursor: 'pointer',
        flexShrink: 0,
        border: 'none',
        padding: 0,
        transition: 'background-color 0.25s ease',
        outline: 'none',
      }}
    >
      {/* Thumb circulaire */}
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: isDark ? '23px' : '3px',
          width: '18px',
          height: '18px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transition: 'left 0.25s ease',
        }}
      />
    </button>
  );
}

function Header({ selectedSymbol, setSelectedSymbol, fundamentalsData, viewMode, setViewMode }) {
  const { isDark, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);

  const [assetFilters, setAssetFilters] = useState({
    stock: true, index: true, crypto: true, commodity: true,
  });

  useEffect(() => {
    const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
    if (selectedCompany) {
      setSearchTerm(`${selectedCompany.name || selectedCompany.ticker} (${selectedCompany.ticker})`);
    }
  }, [selectedSymbol, fundamentalsData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        const selectedCompany = fundamentalsData.find(c => c.ticker === selectedSymbol);
        if (selectedCompany) {
          setSearchTerm(`${selectedCompany.name || selectedCompany.ticker} (${selectedCompany.ticker})`);
        }
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSymbol, fundamentalsData]);

  const handleFilterChange = (assetType) => {
    setAssetFilters(prev => ({ ...prev, [assetType]: !prev[assetType] }));
  };

  const getAssetType = (ticker) => {
    if (!ticker) return 'stock';
    const t = ticker.toUpperCase();
    if (t.includes('-USD')) return 'crypto';
    if (t.startsWith('^')) return 'index';
    if (t.endsWith('=F')) return 'commodity';
    return 'stock';
  };

  const filteredData = fundamentalsData.filter(company => {
    if (!assetFilters[getAssetType(company.ticker)]) return false;
    const name = company.name || '';
    const ticker = company.ticker || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ticker.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (ticker) => {
    setSelectedSymbol(ticker);
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <h1 style={{ margin: 0, color: 'var(--text1)' }}>Boursicot Pro 📈</h1>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* FILTRE DÉROULANT */}
        {(() => {
          const FILTERS = [
            { key: 'stock',     label: 'Actions' },
            { key: 'index',     label: 'Indices' },
            { key: 'crypto',    label: 'Cryptos' },
            { key: 'commodity', label: 'Matières' },
          ];
          const activeCount = Object.values(assetFilters).filter(Boolean).length;
          const total = FILTERS.length;
          const label = activeCount === 0
            ? 'Aucun type'
            : activeCount === total
              ? 'Tous les types'
              : FILTERS.filter(f => assetFilters[f.key]).map(f => f.label).join(' · ');
          return (
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', backgroundColor: 'var(--bg3)',
                  border: `1px solid ${filterOpen ? '#2962FF' : 'var(--border)'}`,
                  borderRadius: '6px', cursor: 'pointer', color: 'var(--text1)',
                  fontSize: '12px', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 'bold' }}>FILTRER</span>
                <span>{label}</span>
                <span style={{ color: 'var(--text3)', fontSize: '10px' }}>{filterOpen ? '▲' : '▼'}</span>
              </button>

              {filterOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '6px 0',
                  zIndex: 50, minWidth: '150px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                }}>
                  {FILTERS.map(({ key, label: fl }) => (
                    <label
                      key={key}
                      onClick={() => handleFilterChange(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                        color: assetFilters[key] ? 'var(--text1)' : 'var(--text3)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={assetFilters[key]}
                        onChange={() => handleFilterChange(key)}
                        onClick={e => e.stopPropagation()}
                        style={{ accentColor: '#2962FF', cursor: 'pointer', width: '14px', height: '14px' }}
                      />
                      {fl}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* BARRE DE RECHERCHE */}
        <div ref={dropdownRef} style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
            onClick={() => { setSearchTerm(''); setIsOpen(true); }}
            placeholder={fundamentalsData.length === 0 ? 'Chargement...' : 'Rechercher...'}
            disabled={fundamentalsData.length === 0}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '6px',
              backgroundColor: 'var(--bg3)', color: 'var(--text1)',
              border: '1px solid var(--border)', outline: 'none', boxSizing: 'border-box',
            }}
          />

          {isOpen && (
            <ul style={{
              position: 'absolute', top: '100%', left: 0, width: '100%',
              backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '6px', marginTop: '4px', padding: 0, listStyle: 'none',
              maxHeight: '300px', overflowY: 'auto', zIndex: 50, color: 'var(--text1)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
            }}>
              {filteredData.length > 0 ? (
                filteredData.map((company) => (
                  <li
                    key={company.ticker}
                    onClick={() => handleSelect(company.ticker)}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2962FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    style={{
                      padding: '10px 12px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'baseline',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text1)', marginRight: '8px' }}>
                      {company.name || company.ticker}
                    </span>
                    <span style={{ fontSize: '12px', color: '#00bcd4' }}>
                      ({company.ticker})
                    </span>
                  </li>
                ))
              ) : (
                <li style={{ padding: '10px 12px', color: 'var(--text3)', fontStyle: 'italic', fontSize: '13px' }}>
                  Aucun résultat
                </li>
              )}
            </ul>
          )}
        </div>

        {/* BOUTONS DE NAVIGATION */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('chart')} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'var(--text1)', borderRadius: '6px 0 0 6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Graphique</button>
          <button onClick={() => setViewMode('fundamentals')} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid var(--border)', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'var(--text1)', borderRadius: '0', cursor: 'pointer', transition: 'background-color 0.2s' }}>Infos</button>
          <button onClick={() => setViewMode('macro')} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid var(--border)', backgroundColor: viewMode === 'macro' ? '#26a69a' : 'transparent', color: 'var(--text1)', borderRadius: '0 6px 6px 0', cursor: 'pointer', transition: 'background-color 0.2s' }}>🌐 Macro</button>
        </div>

        {/* TOGGLE DARK / LIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.04em', userSelect: 'none' }}>
            DARK
          </span>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </div>
    </div>
  );
}

export default Header;
