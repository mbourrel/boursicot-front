import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useProfile } from '../context/ProfileContext';
import { UserButton } from '@clerk/clerk-react';
import { captureEvent } from '../utils/analytics';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { usePWA } from '../context/PWAContext';

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

// ── Composant filtre déroulant générique ──────────────────────────────────────
function FilterDropdown({ label, items, filters, onChange, onSelectAll, onSelectNone, dropdownRef }) {
  const [open, setOpen] = useState(false);

  const activeCount = filters ? Object.values(filters).filter(Boolean).length : 0;
  const total = items.length;
  const summary = activeCount === 0
    ? `Aucun`
    : activeCount === total
      ? `Tous`
      : items.filter(i => filters?.[i.key]).map(i => i.label).join(' · ');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  const quickBtnStyle = () => ({
    padding: '2px 8px', fontSize: '10px', fontWeight: 'bold',
    border: '1px solid var(--border)', borderRadius: '4px',
    backgroundColor: 'var(--bg2)', color: 'var(--text3)',
    cursor: 'pointer', lineHeight: '16px',
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', backgroundColor: 'var(--bg3)',
          border: `1px solid ${open ? '#2962FF' : 'var(--border)'}`,
          borderRadius: '6px', cursor: 'pointer', color: 'var(--text1)',
          fontSize: '12px', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 'bold' }}>{label}</span>
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary}</span>
        <span style={{ color: 'var(--text3)', fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '6px 0',
          zIndex: 50, minWidth: '170px', maxHeight: '300px', overflowY: 'auto',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        }}>
          {/* Boutons Tous / Aucun */}
          <div style={{
            display: 'flex', gap: '6px', padding: '6px 14px 8px',
            borderBottom: '1px solid var(--border)',
          }}>
            <button style={quickBtnStyle()} onClick={onSelectAll}>Tous</button>
            <button style={quickBtnStyle()} onClick={onSelectNone}>Aucun</button>
          </div>

          {items.map(({ key, label: fl }) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                color: filters?.[key] ? 'var(--text1)' : 'var(--text3)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input
                type="checkbox"
                checked={!!filters?.[key]}
                onChange={() => onChange(key)}
                style={{ accentColor: '#2962FF', cursor: 'pointer', width: '14px', height: '14px' }}
              />
              {fl}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Header principal ──────────────────────────────────────────────────────────
function Header({ selectedSymbol, setSelectedSymbol, fundamentalsData, viewMode, setViewMode }) {
  const { isDark, toggleTheme } = useTheme();
  const { targetCurrency, setTargetCurrency, updatedAt } = useCurrency();
  const { profile, setProfile, showCoachMark, setShowCoachMark } = useProfile();
  const { isMobile } = useBreakpoint();
  const { installPrompt, isInstalled, triggerInstall } = usePWA();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-dismiss du Coach Mark après 5 s
  useEffect(() => {
    if (!showCoachMark) return;
    const t = setTimeout(() => setShowCoachMark(false), 5000);
    return () => clearTimeout(t);
  }, [showCoachMark, setShowCoachMark]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const typeFilterRef = useRef(null);
  const countryFilterRef = useRef(null);
  const sectorFilterRef = useRef(null);

  // ── Filtre par type ──────────────────────────────────────────────────────────
  const ASSET_CLASS_LABELS = {
    stock: 'Actions', index: 'Indices', crypto: 'Cryptos', commodity: 'Matières', etf: 'ETFs',
  };

  // Fallback par pattern ticker quand asset_class n'est pas encore en DB
  const _assetTypeFromTicker = (ticker) => {
    if (!ticker) return 'stock';
    const t = ticker.toUpperCase();
    if (t.includes('-USD')) return 'crypto';
    if (t.startsWith('^'))  return 'index';
    if (t.endsWith('=F'))   return 'commodity';
    return 'stock';
  };

  const getAssetType = (company) =>
    company.asset_class || _assetTypeFromTicker(company.ticker);

  // Types disponibles — extraits dynamiquement depuis les données API
  const availableAssetTypes = useMemo(() => {
    const ORDER = ['stock', 'index', 'crypto', 'commodity', 'etf'];
    const found = new Set(fundamentalsData.map(c => getAssetType(c)));
    return ORDER.filter(t => found.has(t)).concat(
      Array.from(found).filter(t => !ORDER.includes(t)).sort()
    );
  }, [fundamentalsData]);

  const [assetFilters, setAssetFilters] = useState(null);
  useEffect(() => {
    if (availableAssetTypes.length > 0 && assetFilters === null) {
      const init = {};
      availableAssetTypes.forEach(t => { init[t] = true; });
      setAssetFilters(init);
    }
  }, [availableAssetTypes, assetFilters]);

  const TYPE_FILTERS = availableAssetTypes.map(key => ({
    key, label: ASSET_CLASS_LABELS[key] || key,
  }));

  // Pays dérivé du ticker (lieu de cotation), pas de la base
  const getCountry = (ticker) => {
    if (!ticker) return 'International';
    const t = ticker.toUpperCase();
    if (t.startsWith('^') || t.includes('-USD') || t.endsWith('=F')) return 'International';
    if (t.endsWith('.PA')) return 'France';
    if (t.endsWith('.AS')) return 'Pays-Bas';
    // Ticker sans suffixe = coté aux US
    return 'États-Unis';
  };

  // ── Filtre par pays ──────────────────────────────────────────────────────────
  const availableCountries = useMemo(() => {
    const set = new Set();
    fundamentalsData.forEach(c => set.add(getCountry(c.ticker)));
    return Array.from(set).sort((a, b) => {
      if (a === 'International') return 1;
      if (b === 'International') return -1;
      return a.localeCompare(b, 'fr');
    });
  }, [fundamentalsData]);

  const [countryFilters, setCountryFilters] = useState(null);
  useEffect(() => {
    if (availableCountries.length > 0 && countryFilters === null) {
      const init = {};
      availableCountries.forEach(c => { init[c] = true; });
      setCountryFilters(init);
    }
  }, [availableCountries, countryFilters]);

  // ── Filtre par secteur ───────────────────────────────────────────────────────
  const availableSectors = useMemo(() => {
    const set = new Set();
    fundamentalsData.forEach(c => { if (c.sector) set.add(c.sector); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [fundamentalsData]);

  const [sectorFilters, setSectorFilters] = useState(null);
  useEffect(() => {
    if (availableSectors.length > 0 && sectorFilters === null) {
      const init = {};
      availableSectors.forEach(s => { init[s] = true; });
      setSectorFilters(init);
    }
  }, [availableSectors, sectorFilters]);

  // ── Synchronise le champ de recherche avec le symbole sélectionné ────────────
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSymbol, fundamentalsData]);

  // ── Données filtrées pour la liste déroulante ────────────────────────────────
  const filteredData = fundamentalsData.filter(company => {
    if (assetFilters && !assetFilters[getAssetType(company)]) return false;
    if (countryFilters) {
      if (!countryFilters[getCountry(company.ticker)]) return false;
    }
    if (sectorFilters && company.sector) {
      if (!sectorFilters[company.sector]) return false;
    }
    const name = company.name || '';
    const ticker = company.ticker || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ticker.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (ticker) => {
    captureEvent('symbol_selected', { ticker });
    setSelectedSymbol(ticker);
    setIsOpen(false);
  };

  // ── Items pour les filtres génériques ────────────────────────────────────────
  const TYPE_FILTERS = [
    { key: 'stock',     label: 'Actions' },
    { key: 'index',     label: 'Indices' },
    { key: 'crypto',    label: 'Cryptos' },
    { key: 'commodity', label: 'Matières' },
    { key: 'etf',       label: 'ETFs' },
  ];

  const countryItems = availableCountries.map(c => ({ key: c, label: c }));
  const sectorItems = availableSectors.map(s => ({ key: s, label: s }));

  // ── Contrôles réutilisables (Desktop inline + Mobile menu) ──────────────────
  const Controls = () => (
    <>
      {/* TOGGLE DEVISE */}
      {viewMode === 'fundamentals' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {['LOCAL', 'EUR', 'USD'].map((cur, i) => (
              <button
                key={cur}
                onClick={() => { captureEvent('currency_changed', { currency: cur }); setTargetCurrency(cur); }}
                style={{
                  padding: '6px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  borderRadius: i === 0 ? '5px 0 0 5px' : i === 2 ? '0 5px 5px 0' : '0',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  backgroundColor: targetCurrency === cur ? '#2962FF' : 'transparent',
                  color: targetCurrency === cur ? 'white' : 'var(--text3)',
                  transition: 'all 0.15s',
                }}
              >
                {cur === 'LOCAL' ? '🏳 Local' : cur === 'EUR' ? '€ EUR' : '$ USD'}
              </button>
            ))}
          </div>
          {updatedAt && targetCurrency !== 'LOCAL' && (
            <span style={{ fontSize: '9px', color: 'var(--text3)' }}>
              Taux du {new Date(updatedAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      )}

      {/* TOGGLE PROFIL */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {[
            { value: 'explorateur', icon: '🧭', label: 'Explorateur' },
            { value: 'stratege',    icon: '📈', label: 'Stratège' },
          ].map(({ value, icon, label }, i) => (
            <button
              key={value}
              onClick={() => { captureEvent('profile_changed', { profile: value }); setProfile(value); setMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 11px', border: 'none', cursor: 'pointer',
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                backgroundColor: profile === value ? '#2962FF' : 'transparent',
                color: profile === value ? 'white' : 'var(--text3)',
                fontSize: '11px', fontWeight: 'bold', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
        {showCoachMark && !isMobile && (
          <div
            onClick={() => setShowCoachMark(false)}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              backgroundColor: '#2962FF', color: 'white',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '12px', whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(41,98,255,0.45)',
              cursor: 'pointer', zIndex: 200,
            }}
          >
            <div style={{ position: 'absolute', top: '-6px', right: '20px', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #2962FF' }} />
            ✓ Mode {profile === 'explorateur' ? 'Explorateur' : 'Stratège'} activé
          </div>
        )}
      </div>

      {/* TOGGLE DARK / LIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.04em', userSelect: 'none' }}>DARK</span>
        <ThemeToggle isDark={isDark} onToggle={() => { captureEvent('theme_toggled', { theme: isDark ? 'light' : 'dark' }); toggleTheme(); }} />
      </div>

      {/* BOUTON UTILISATEUR CLERK */}
      <UserButton />
    </>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isMobile ? '10px' : '20px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: isMobile ? '34px' : '42px',
          height: isMobile ? '34px' : '42px',
          borderRadius: '10px',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}>
          <img
            src="/logo.png"
            alt="Boursicot"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <h1 style={{ margin: 0, color: 'var(--text1)', fontSize: isMobile ? '18px' : undefined }}>Boursicot Pro </h1>
      </div>

      {/* ── MOBILE : barre de recherche + burger ── */}
      {isMobile ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
          {/* Boutons de navigation compacts */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg3)', borderRadius: '6px', flexShrink: 0 }}>
            {[
              { mode: 'chart',        label: '📈' },
              { mode: 'fundamentals', label: '📊' },
              { mode: 'screener',     label: '🔍' },
              { mode: 'macro',        label: '🌐' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => { captureEvent('view_changed', { view: mode }); setViewMode(mode); }}
                style={{
                  padding: '8px 11px', border: 'none', cursor: 'pointer', fontSize: '16px',
                  backgroundColor: viewMode === mode ? (mode === 'screener' ? '#7c3aed' : mode === 'macro' ? '#26a69a' : '#2962FF') : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--text3)',
                  borderRadius: '6px', transition: 'background-color 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Barre de recherche (pleine largeur restante) */}
          <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
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
                maxHeight: '260px', overflowY: 'auto', zIndex: 50, color: 'var(--text1)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
              }}>
                {filteredData.length > 0 ? filteredData.map((company) => (
                  <li key={company.ticker} onClick={() => handleSelect(company.ticker)}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2962FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', transition: 'background-color 0.2s' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text1)', marginRight: '8px' }}>{company.name || company.ticker}</span>
                    <span style={{ fontSize: '11px', color: '#00bcd4' }}>({company.ticker})</span>
                  </li>
                )) : (
                  <li style={{ padding: '10px 12px', color: 'var(--text3)', fontStyle: 'italic', fontSize: '13px' }}>Aucun résultat</li>
                )}
              </ul>
            )}
          </div>

          {/* Burger button */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              flexShrink: 0, padding: '8px 10px', border: '1px solid var(--border)',
              borderRadius: '6px', backgroundColor: menuOpen ? '#2962FF' : 'var(--bg3)',
              color: menuOpen ? 'white' : 'var(--text1)', cursor: 'pointer', fontSize: '18px',
              lineHeight: 1,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* FILTRE TYPE */}
        {TYPE_FILTERS.length > 0 && assetFilters && (
          <FilterDropdown
            label="TYPE"
            items={TYPE_FILTERS}
            filters={assetFilters}
            onChange={key => setAssetFilters(prev => ({ ...prev, [key]: !prev[key] }))}
            onSelectAll={() => setAssetFilters(Object.fromEntries(TYPE_FILTERS.map(f => [f.key, true])))}
            onSelectNone={() => setAssetFilters(Object.fromEntries(TYPE_FILTERS.map(f => [f.key, false])))}
            dropdownRef={typeFilterRef}
          />
        )}

        {/* FILTRE PAYS */}
        {countryItems.length > 0 && countryFilters && (
          <FilterDropdown
            label="PAYS"
            items={countryItems}
            filters={countryFilters}
            onChange={key => setCountryFilters(prev => ({ ...prev, [key]: !prev[key] }))}
            onSelectAll={() => setCountryFilters(Object.fromEntries(availableCountries.map(c => [c, true])))}
            onSelectNone={() => setCountryFilters(Object.fromEntries(availableCountries.map(c => [c, false])))}
            dropdownRef={countryFilterRef}
          />
        )}

        {/* FILTRE SECTEUR */}
        {sectorItems.length > 0 && sectorFilters && (
          <FilterDropdown
            label="SECTEUR"
            items={sectorItems}
            filters={sectorFilters}
            onChange={key => setSectorFilters(prev => ({ ...prev, [key]: !prev[key] }))}
            onSelectAll={() => setSectorFilters(Object.fromEntries(availableSectors.map(s => [s, true])))}
            onSelectNone={() => setSectorFilters(Object.fromEntries(availableSectors.map(s => [s, false])))}
            dropdownRef={sectorFilterRef}
          />
        )}

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
          <button onClick={() => { captureEvent('view_changed', { view: 'chart' }); setViewMode('chart'); }} style={{ padding: '8px 16px', border: 'none', backgroundColor: viewMode === 'chart' ? '#2962FF' : 'transparent', color: 'var(--text1)', borderRadius: '6px 0 0 6px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Cours de bourse</button>
          <button onClick={() => { captureEvent('view_changed', { view: 'fundamentals' }); setViewMode('fundamentals'); }} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid var(--border)', backgroundColor: viewMode === 'fundamentals' ? '#2962FF' : 'transparent', color: 'var(--text1)', borderRadius: '0', cursor: 'pointer', transition: 'background-color 0.2s' }}>Analyse Fondamentale</button>
          <button onClick={() => { captureEvent('view_changed', { view: 'screener' }); setViewMode('screener'); }} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid var(--border)', backgroundColor: viewMode === 'screener' ? '#7c3aed' : 'transparent', color: 'var(--text1)', borderRadius: '0', cursor: 'pointer', transition: 'background-color 0.2s' }}>🔍 Screener</button>
          <button onClick={() => { captureEvent('view_changed', { view: 'macro' }); setViewMode('macro'); }} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid var(--border)', backgroundColor: viewMode === 'macro' ? '#26a69a' : 'transparent', color: 'var(--text1)', borderRadius: '0 6px 6px 0', cursor: 'pointer', transition: 'background-color 0.2s' }}>🌐 Macro</button>
        </div>

          <Controls />
        </div>
      )}

      {/* ── Panneau menu mobile (overlay slide-down) ── */}
      {isMobile && menuOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              backgroundColor: 'var(--bg1)', borderBottom: '1px solid var(--border)',
              padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '13px' }}>Paramètres</span>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <Controls />

            {/* Bouton installation PWA — visible uniquement si le prompt est disponible */}
            {installPrompt && !isInstalled && (
              <button
                onClick={() => { triggerInstall(); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '12px 14px', borderRadius: '8px',
                  border: '1px solid #1a787844', backgroundColor: '#1a787812',
                  color: '#1a7878', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  transition: 'background-color 0.15s',
                }}
                onTouchStart={e => e.currentTarget.style.backgroundColor = '#1a787824'}
                onTouchEnd={e => e.currentTarget.style.backgroundColor = '#1a787812'}
              >
                <span style={{ fontSize: '18px' }}>📲</span>
                Installer Boursicot sur l'écran d'accueil
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Coach Mark mobile (toast bas d'écran) ── */}
      {isMobile && showCoachMark && (
        <div onClick={() => setShowCoachMark(false)} style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#2962FF', color: 'white', borderRadius: '8px', padding: '10px 18px',
          fontSize: '12px', zIndex: 300, boxShadow: '0 4px 16px rgba(41,98,255,0.45)',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          ✓ Mode {profile === 'explorateur' ? 'Explorateur' : 'Stratège'} activé
        </div>
      )}

      {/* DISCLAIMER MIF2 */}
      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', paddingTop: '5px', opacity: 0.65, letterSpacing: '0.02em', width: '100%' }}>
        Informations à titre indicatif uniquement — ne constituent pas un conseil en investissement. Tout investissement comporte un risque de perte en capital.
      </div>
    </div>
  );
}

export default Header;
