import { useMemo, useState, useRef, useEffect } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

const SERIES = [
  { key: 'us2y',    label: 'US 2Y',    color: '#e91e63', flag: 'us' },
  { key: 'us10y',   label: 'US 10Y',   color: '#2962FF', flag: 'us' },
  { key: 'us30y',   label: 'US 30Y',   color: '#9c27b0', flag: 'us' },
  { key: 'us3m',    label: 'US 3M',    color: '#fb8c00', flag: 'us', dashed: true },
  { key: 'bund10y', label: 'Bund 10Y', color: '#f59e0b', flag: 'de' },
  { key: 'bund3m',  label: 'Bund 3M',  color: '#fdd835', flag: 'de', dashed: true },
  { key: 'oat10y',  label: 'OAT 10Y',  color: '#26a69a', flag: 'fr' },
  { key: 'oat3m',   label: 'OAT 3M',   color: '#80cbc4', flag: 'fr', dashed: true },
  { key: 'gilt10y', label: 'Gilt 10Y', color: '#ef5350', flag: 'gb' },
  { key: 'gilt3m',  label: 'Gilt 3M',  color: '#ff7043', flag: 'gb', dashed: true },
];

const NAME_BY_KEY = {
  us2y: 'US 2Y', us10y: 'US 10Y', us30y: 'US 30Y', us3m: 'US 3M',
  bund10y: 'Bund 10Y', bund3m: 'Bund 3M',
  oat10y: 'OAT 10Y',  oat3m: 'OAT 3M',
  gilt10y: 'Gilt 10Y', gilt3m: 'Gilt 3M',
};

const SERIES_DEFINITIONS = {
  us2y:    { title: 'US 2Y — Treasury américain 2 ans', desc: 'Très sensible aux décisions de la Fed. Monte quand les marchés anticipent des hausses de taux, baisse quand ils anticipent des baisses. Baromètre de la politique monétaire à court terme.' },
  us10y:   { title: 'US 10Y — Treasury américain 10 ans', desc: 'Référence mondiale du coût de l\'argent à long terme. Influence les taux hypothécaires, le crédit corporate et la valorisation des actions (taux d\'actualisation). Un US 10Y élevé pèse sur les marchés actions.' },
  us30y:   { title: 'US 30Y — Treasury américain 30 ans', desc: 'Reflète les anticipations d\'inflation et de croissance sur très long terme. Moins réactif que le 2Y. Très suivi par les fonds de pension et assureurs qui gèrent des passifs longs.' },
  us3m:    { title: 'US 3M — Bon du Trésor américain 3 mois', desc: 'Taux du marché monétaire américain (DGS3MO, quotidien). Colle très étroitement au taux directeur de la Fed. Utile pour lire l\'anticipation des marchés sur les prochaines décisions de politique monétaire à très court terme.' },
  bund10y: { title: 'Bund 10Y — Obligation allemande 10 ans', desc: 'Référence sans risque de la zone euro. L\'Allemagne étant la première économie de la zone, son taux sert de plancher pour tous les spreads souverains européens. Un Bund qui monte signale une remontée des taux en Europe.' },
  bund3m:  { title: 'Bund 3M — Taux court allemand 3 mois', desc: 'Taux du marché monétaire de la zone euro (IRLTST01DEM, mensuel OCDE). Reflète les décisions de la BCE à court terme. Sert de référence pour les emprunts interbancaires et les fonds monétaires en euros.' },
  oat10y:  { title: 'OAT 10Y — Obligation française 10 ans', desc: 'Le spread OAT–Bund mesure la prime de risque française. Il s\'écarte lors des crises politiques ou budgétaires (dissolution, dégradation de note). Indicateur clé de la confiance des marchés envers la France.' },
  oat3m:   { title: 'OAT 3M — Taux court français 3 mois', desc: 'Taux du marché monétaire français (IRLTST01FRM, mensuel OCDE). Suit de très près le Bund 3M au sein de la zone euro. Un écart persistant avec l\'Allemagne signalerait un stress de financement à court terme pour la France.' },
  gilt10y: { title: 'Gilt 10Y — Obligation britannique 10 ans', desc: 'Taux souverain du Royaume-Uni post-Brexit. Reflète à la fois la politique de la BoE et les risques spécifiques britanniques (inflation structurelle, déficit courant). L\'épisode Truss (2022) a illustré sa sensibilité aux chocs budgétaires.' },
  gilt3m:  { title: 'Gilt 3M — Taux court britannique 3 mois', desc: 'Taux du marché monétaire UK (IRLTST01GBM, mensuel OCDE). Suit la Bank of England Rate. Depuis le Brexit, le UK pilote sa politique monétaire indépendamment de la BCE, ce qui peut créer des divergences notables.' },
};

const RANGES = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', 'Max'];

function idxForRange(dates, range) {
  if (!dates?.length || range === 'Max') return [0, dates.length];
  const d = new Date();
  if (range === '3M') d.setMonth(d.getMonth() - 3);
  else if (range === '6M') d.setMonth(d.getMonth() - 6);
  else if (range === '1Y') d.setFullYear(d.getFullYear() - 1);
  else if (range === '2Y') d.setFullYear(d.getFullYear() - 2);
  else if (range === '5Y') d.setFullYear(d.getFullYear() - 5);
  else if (range === '10Y') d.setFullYear(d.getFullYear() - 10);
  const cutoff = d.toISOString().slice(0, 10);
  const start = Math.max(0, dates.findIndex(dd => dd >= cutoff));
  return [start, dates.length];
}

function buildAlignedDates(history) {
  const sets = SERIES.map(s => history?.[s.key]).filter(Boolean);
  if (!sets.length) return null;
  const dateSet = new Set();
  sets.forEach(s => s.dates.forEach(d => dateSet.add(d)));
  const dates = [...dateSet].sort();
  const indexed = SERIES.map(s => {
    const map = {};
    history?.[s.key]?.dates.forEach((d, i) => { map[d] = history[s.key].values[i]; });
    return { ...s, map };
  });
  return { allDates: dates, series: indexed };
}

export default function SovereignSpreadsChart({ history, bondYields, loading, error }) {
  const [showInfo,    setShowInfo]    = useState(false);
  const [range,       setRange]       = useState('Max');
  const [visibleKeys, setVisibleKeys] = useState(() => new Set(['us2y', 'us10y', 'oat10y']));
  const [hoverData,   setHoverData]   = useState(null);

  const containerRef  = useRef(null);
  const chartRef      = useRef(null);
  const seriesMapRef  = useRef({});  // { key -> series instance }
  const { theme }     = useTheme();

  const toggleSeries = (key) => setVisibleKeys(prev => {
    const next = new Set(prev);
    if (next.has(key)) { if (next.size > 1) next.delete(key); }
    else next.add(key);
    return next;
  });

  const aligned = useMemo(() => buildAlignedDates(history), [history]);

  // Stats par série pour la plage active
  const visibleStats = useMemo(() => {
    if (!aligned) return {};
    const [s, e] = idxForRange(aligned.allDates, range);
    const slicedDates = aligned.allDates.slice(s, e);
    const out = {};
    aligned.series.forEach(ser => {
      if (!visibleKeys.has(ser.key)) return;
      const vals = slicedDates.map(d => ser.map[d]).filter(v => v != null);
      if (vals.length) out[ser.key] = { min: Math.min(...vals).toFixed(2), max: Math.max(...vals).toFixed(2) };
    });
    return out;
  }, [aligned, range, visibleKeys]);

  // Taux courants
  const rateByKey = useMemo(() => {
    const out = {};
    SERIES.forEach(s => { out[s.key] = bondYields?.find(b => b.name === NAME_BY_KEY[s.key])?.rate ?? null; });
    return out;
  }, [bondYields]);
  const { us10y, bund10y, oat10y } = rateByKey;
  const spreadUsDe = us10y != null && bund10y != null ? (us10y - bund10y).toFixed(2) : null;
  const spreadFrDe = oat10y != null && bund10y != null ? (oat10y - bund10y).toFixed(2) : null;

  // ── Création du chart dès que les données sont prêtes ─────────────────────
  useEffect(() => {
    if (!aligned || !containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid', color: theme.bg2 },
        textColor: theme.chartText,
      },
      grid: {
        vertLines: { color: theme.chartGrid },
        horzLines: { color: theme.chartGrid },
      },
      width: containerRef.current.clientWidth,
      height: 260,
      timeScale: { borderColor: theme.chartGrid },
      rightPriceScale: { borderColor: theme.chartGrid },
    });
    chartRef.current = chart;

    // Créer toutes les séries
    SERIES.forEach(s => {
      const series = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: s.dashed ? 1.5 : 2,
        lineStyle: s.dashed ? 2 : 0,  // 2 = Dashed, 0 = Solid
        visible: visibleKeys.has(s.key),
        priceFormat: { type: 'custom', formatter: v => v.toFixed(2) + '%' },
        crosshairMarkerRadius: 4,
      });
      seriesMapRef.current[s.key] = series;

      // Données
      const ser = aligned.series.find(as => as.key === s.key);
      if (ser) {
        const data = aligned.allDates
          .map(d => ({ time: d, value: ser.map[d] ?? null }))
          .filter(p => p.value != null);
        series.setData(data);
      }
    });

    // Crosshair → tooltip
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.point) {
        setHoverData(null);
        return;
      }
      const vals = {};
      SERIES.forEach(s => {
        const sr = seriesMapRef.current[s.key];
        if (sr) vals[s.key] = param.seriesData.get(sr)?.value ?? null;
      });
      setHoverData({ date: String(param.time), vals });
    });

    // Plage initiale
    if (range === 'Max') {
      chart.timeScale().fitContent();
    } else {
      const [startIdx] = idxForRange(aligned.allDates, range);
      chart.timeScale().setVisibleRange({
        from: aligned.allDates[startIdx],
        to:   aligned.allDates[aligned.allDates.length - 1],
      });
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current = {};
    };
  }, [aligned]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mise à jour du thème ──────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: { background: { type: 'solid', color: theme.bg2 }, textColor: theme.chartText },
      grid:   { vertLines: { color: theme.chartGrid }, horzLines: { color: theme.chartGrid } },
      timeScale:       { borderColor: theme.chartGrid },
      rightPriceScale: { borderColor: theme.chartGrid },
    });
  }, [theme]);

  // ── Visibilité des séries ─────────────────────────────────────────────────
  useEffect(() => {
    SERIES.forEach(s => {
      const sr = seriesMapRef.current[s.key];
      if (sr) sr.applyOptions({ visible: visibleKeys.has(s.key) });
    });
  }, [visibleKeys]);

  // ── Plage temporelle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current || !aligned) return;
    if (range === 'Max') {
      chartRef.current.timeScale().fitContent();
    } else {
      const [startIdx] = idxForRange(aligned.allDates, range);
      chartRef.current.timeScale().setVisibleRange({
        from: aligned.allDates[startIdx],
        to:   aligned.allDates[aligned.allDates.length - 1],
      });
    }
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      backgroundColor: 'var(--bg2)', borderRadius: '10px',
      border: '1px solid var(--border)', padding: '16px 20px',
    }}>
      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🌍</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text1)', fontWeight: 'bold', fontSize: '14px' }}>
                Baromètre de Confiance — Dettes Souveraines
              </span>
              {spreadUsDe && (
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '10px', fontWeight: '600',
                  backgroundColor: '#2962FF15', color: '#2962FF', border: '1px solid #2962FF44',
                }}>US–DE : +{spreadUsDe}%</span>
              )}
              {spreadFrDe && (
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '10px', fontWeight: '600',
                  backgroundColor: '#26a69a15', color: '#26a69a', border: '1px solid #26a69a44',
                }}>FR–DE : +{spreadFrDe}%</span>
              )}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
              Rendements souverains 3M / 2Y / 10Y / 30Y · US, DE, FR, UK — tirets = taux 3 mois (marché monétaire)
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            background: showInfo ? 'var(--border)' : 'none',
            border: '1px solid var(--border)', borderRadius: '50%',
            width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text3)',
            fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >?</button>
      </div>

      {/* ── Info rétractable ── */}
      {showInfo && (
        <div style={{
          backgroundColor: 'var(--bg3)', borderRadius: '8px', padding: '14px 16px',
          marginBottom: '14px', borderLeft: '3px solid #f59e0b',
          fontSize: '12px', color: 'var(--text3)', lineHeight: '1.7',
        }}>
          <div style={{ color: 'var(--text2)', fontWeight: '700', marginBottom: '12px', fontSize: '13px' }}>
            Définition de chaque série
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {SERIES.map(s => {
              const def = SERIES_DEFINITIONS[s.key];
              return (
                <div key={s.key} style={{
                  backgroundColor: 'var(--bg2)', borderRadius: '6px', padding: '10px 12px',
                  border: `1px solid ${s.color}44`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <img src={`https://flagcdn.com/16x12/${s.flag}.png`} width="16" height="12" alt={s.flag} style={{ borderRadius: '1px', display: 'block' }} />
                    {s.dashed
                      ? <span style={{ width: '18px', height: '2px', display: 'inline-block', background: `repeating-linear-gradient(90deg, ${s.color} 0px, ${s.color} 4px, transparent 4px, transparent 7px)` }} />
                      : <span style={{ width: '18px', height: '2px', backgroundColor: s.color, display: 'inline-block', borderRadius: '1px' }} />
                    }
                    <span style={{ color: s.color, fontWeight: '700', fontSize: '11px' }}>{def.title}</span>
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.6' }}>{def.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--text2)', fontWeight: '600' }}>Source · </span>
            FRED (St. Louis Fed) — DGS2/10/30/3MO (quotidien), IRLTLT01*/IRLTST01* OCDE (mensuel). Les séries 3M mesurent les taux du marché monétaire, pas des obligations 3 mois stricto sensu.
          </div>
        </div>
      )}

      {/* ── Légende toggleable + contrôles ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SERIES.map(s => {
            const active = visibleKeys.has(s.key);
            const currentRate = rateByKey[s.key];
            const stat = visibleStats[s.key];
            return (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  border: `1px solid ${active ? s.color : 'var(--border)'}`,
                  backgroundColor: active ? `${s.color}18` : 'transparent',
                  opacity: active ? 1 : 0.45,
                  transition: 'all 0.15s',
                }}
              >
                <img src={`https://flagcdn.com/16x12/${s.flag}.png`} width="16" height="12" alt={s.flag} style={{ borderRadius: '1px', display: 'block' }} />
                {s.dashed
                  ? <span style={{ width: '16px', height: '2px', display: 'inline-block', background: `repeating-linear-gradient(90deg, ${s.color} 0px, ${s.color} 4px, transparent 4px, transparent 7px)` }} />
                  : <span style={{ width: '16px', height: '2px', backgroundColor: s.color, display: 'inline-block', borderRadius: '1px' }} />
                }
                <span style={{ fontSize: '11px', color: active ? s.color : 'var(--text3)', fontWeight: '600' }}>{s.label}</span>
                {currentRate != null && (
                  <span style={{ fontSize: '11px', color: active ? s.color : 'var(--text3)' }}>{currentRate.toFixed(2)}%</span>
                )}
                {stat && active && (
                  <span style={{ color: 'var(--text3)', fontSize: '10px' }}>({stat.min}–{stat.max})</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {range !== 'Max' && (
            <button onClick={() => setRange('Max')} style={{
              background: '#ef535022', border: '1px solid #ef535044', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px', color: '#ef5350', cursor: 'pointer', marginRight: '4px',
            }}>↺ Reset</button>
          )}
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              background: range === r ? 'var(--text3)' : 'none',
              border: '1px solid var(--border)', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px',
              color: range === r ? 'var(--bg0)' : 'var(--text3)',
              cursor: 'pointer',
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'right', marginBottom: '4px', fontStyle: 'italic' }}>
        scroll pour zoomer
      </div>

      {loading && <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>Chargement…</div>}
      {error   && <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>}

      {!loading && !error && aligned && (
        <div style={{ position: 'relative' }}>
          <div ref={containerRef} style={{ height: '260px' }} />

          {/* Tooltip hover */}
          {hoverData && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '11px',
              pointerEvents: 'none', zIndex: 10,
            }}>
              <div style={{ color: 'var(--text3)', marginBottom: '4px', fontWeight: '600' }}>{hoverData.date}</div>
              {SERIES.filter(s => visibleKeys.has(s.key)).map(s => {
                const v = hoverData.vals[s.key];
                if (v == null) return null;
                return (
                  <div key={s.key} style={{ color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                    {s.label} : <strong>{v.toFixed(2)}%</strong>
                  </div>
                );
              })}
              {(() => {
                const usVal = hoverData.vals.us10y;
                const deVal = hoverData.vals.bund10y;
                const frVal = hoverData.vals.oat10y;
                const sUsDe = usVal != null && deVal != null ? (usVal - deVal).toFixed(2) : null;
                const sFrDe = frVal != null && deVal != null ? (frVal - deVal).toFixed(2) : null;
                if (!sUsDe && !sFrDe) return null;
                return (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                    {sUsDe && <div style={{ color: '#2962FF', fontSize: '10px' }}>US–DE : +{sUsDe}%</div>}
                    {sFrDe && <div style={{ color: '#26a69a', fontSize: '10px' }}>FR–DE : +{sFrDe}%</div>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
