import { useState, useRef, useEffect } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';
import SourceTag from './SourceTag';

function LiquidityMonitor({ dates, m2_normalized, btc_normalized, loading, error }) {
  const [showInfo,  setShowInfo]  = useState(false);
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const m2Ref        = useRef(null);
  const btcRef       = useRef(null);
  const { theme }    = useTheme();

  // ── Création du chart dès que les données arrivent ────────────────────────
  useEffect(() => {
    if (!dates?.length || !m2_normalized?.length || !btc_normalized?.length) return;
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid', color: theme.bg1 },
        textColor: theme.chartText,
      },
      grid: {
        vertLines: { color: theme.chartGrid },
        horzLines: { color: theme.chartGrid },
      },
      width: containerRef.current.clientWidth,
      height: 280,
      timeScale: { borderColor: theme.chartGrid },
      // Double axe Y : M2 à gauche (plage ~85–130), BTC à droite (plage 100–1000+)
      leftPriceScale:  { visible: true, borderColor: theme.chartGrid },
      rightPriceScale: { visible: true, borderColor: theme.chartGrid },
    });
    chartRef.current = chart;

    const m2Series = chart.addSeries(LineSeries, {
      color: '#60A5FA',
      lineWidth: 2,
      priceScaleId: 'left',
      priceFormat: { type: 'custom', formatter: v => Math.round(v).toString() },
      title: 'M2',
    });
    const btcSeries = chart.addSeries(LineSeries, {
      color: '#F97316',
      lineWidth: 2,
      priceScaleId: 'right',
      priceFormat: { type: 'custom', formatter: v => Math.round(v).toString() },
      title: 'BTC',
    });
    m2Ref.current  = m2Series;
    btcRef.current = btcSeries;

    // Ligne de référence à 100 (base)
    m2Series.createPriceLine({
      price: 100,
      color: '#758696',
      lineWidth: 1,
      lineStyle: 2,  // Dashed
      axisLabelVisible: true,
      title: 'Base 100',
    });

    // Données
    const m2Data  = dates.map((d, i) => ({ time: d, value: m2_normalized[i]  })).filter(p => p.value != null);
    const btcData = dates.map((d, i) => ({ time: d, value: btc_normalized[i] })).filter(p => p.value != null);
    m2Series.setData(m2Data);
    btcSeries.setData(btcData);
    chart.timeScale().fitContent();

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
      m2Ref.current    = null;
      btcRef.current   = null;
    };
  }, [dates, m2_normalized, btc_normalized]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mise à jour du thème ──────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: { background: { type: 'solid', color: theme.bg1 }, textColor: theme.chartText },
      grid:   { vertLines: { color: theme.chartGrid }, horzLines: { color: theme.chartGrid } },
      timeScale:       { borderColor: theme.chartGrid },
      leftPriceScale:  { borderColor: theme.chartGrid },
      rightPriceScale: { borderColor: theme.chartGrid },
    });
  }, [theme]);

  return (
    <div style={cardStyle}>
      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={titleStyle}>LIQUIDITÉ GLOBALE — M2 USA vs BITCOIN</h3>
          <button
            onClick={() => setShowInfo(v => !v)}
            title="Comment interpréter ce graphique ?"
            style={{
              background: showInfo ? '#2962FF22' : 'transparent',
              border: `1px solid ${showInfo ? '#2962FF' : 'var(--border)'}`,
              color: showInfo ? '#2962FF' : 'var(--text3)',
              borderRadius: '50%', width: '22px', height: '22px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
            }}
          >i</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text2)', flexWrap: 'wrap' }}>
          <span>
            <span style={{ color: '#60A5FA', fontWeight: 'bold', marginRight: '5px' }}>←</span>
            M2 USA
          </span>
          <span>
            <span style={{ color: '#F97316', fontWeight: 'bold', marginRight: '5px' }}>—</span>
            Bitcoin
            <span style={{ color: '#F97316', fontWeight: 'bold', marginLeft: '5px' }}>→</span>
          </span>
          <span style={{
            fontSize: '10px', color: 'var(--text3)',
            border: '1px solid var(--border)',
            borderRadius: '4px', padding: '2px 7px',
            letterSpacing: '0.03em',
          }}>
            Double axe Y
          </span>
        </div>
      </div>

      {/* ── Panneau d'explication ── */}
      {showInfo && (
        <div style={infoPanelStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={blockStyle}>
              <div style={{ color: '#60A5FA', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
                M2 — Masse monétaire large
              </div>
              <p style={infoTextStyle}>
                L'agrégat M2 regroupe tous les billets en circulation, les dépôts à vue, les comptes d'épargne
                et les fonds monétaires aux États-Unis. Il représente la quantité de monnaie disponible dans l'économie.
                Quand la Fed imprime de la monnaie (QE), M2 gonfle ; quand elle resserre (QT), M2 se contracte.
              </p>
            </div>
            <div style={blockStyle}>
              <div style={{ color: '#F97316', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
                Pourquoi M2 vs Bitcoin ?
              </div>
              <p style={infoTextStyle}>
                Historiquement, les expansions de la masse monétaire mondiale précèdent de quelques mois les hausses
                des actifs risqués, et particulièrement du Bitcoin. Quand les liquidités abondent, les investisseurs
                prennent plus de risques. Le Bitcoin, actif le plus sensible à la liquidité, amplifie ces mouvements.
                Cette corrélation est suivie de près par les traders macro.
              </p>
            </div>
            <div style={blockStyle}>
              <div style={{ color: '#758696', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
                Base 100 — Lecture du graphique
              </div>
              <p style={infoTextStyle}>
                Les deux séries sont normalisées à <strong style={{ color: 'var(--text2)' }}>100 en janvier 2020</strong> pour
                pouvoir comparer leur trajectoire relative, indépendamment de leurs niveaux absolus (M2 est en trillions
                de dollars, BTC en milliers de dollars). Une valeur de 150 signifie +50 % depuis le point de départ.
                La ligne pointillée marque la base 100.
              </p>
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'var(--bg2)', border: '1px solid #2962FF40' }}>
            <span style={{ color: '#2962FF', fontWeight: 'bold', fontSize: '11px' }}>Observation historique : </span>
            <span style={{ color: 'var(--text3)', fontSize: '11px' }}>
              Les cycles d'expansion de M2 ont souvent coïncidé avec des périodes d'appréciation des actifs risqués,
              dont les crypto-actifs. Une divergence marquée entre BTC et la tendance M2 illustre une prime de risque
              accrue et une volatilité potentiellement élevée. Ces corrélations passées ne préjugent pas des
              comportements futurs et <strong>ne constituent pas un signal d'investissement.</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── États chargement / erreur ── */}
      {loading && (
        <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
          Chargement des données de liquidité…
        </div>
      )}
      {error && (
        <div style={{ color: '#ef5350', fontSize: '13px', padding: '12px 0' }}>Erreur : {error}</div>
      )}

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{ height: loading || error ? '0px' : '280px', overflow: 'hidden' }}
      />
      {!loading && !error && <SourceTag label="FRED · M2SL / Yahoo Finance · BTC-USD" />}
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'var(--bg1)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)',
};
const titleStyle = {
  margin: 0, color: 'var(--text2)', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.06em',
};
const infoPanelStyle = {
  backgroundColor: 'var(--bg0)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '14px 16px', marginBottom: '16px',
};
const blockStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg1)',
};
const infoTextStyle = {
  margin: 0, color: 'var(--text3)', fontSize: '11px', lineHeight: '1.6',
};

export default LiquidityMonitor;
