import { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { formatFinancialValue } from '../../utils/formatFinancialValue';
import SourceTag from '../SourceTag';
import { METRIQUES_REINES } from '../../constants/metrics';
import MetricCard from './MetricCard';
import FinancialStatement from './FinancialStatement';
import ScoreDashboard from './ScoreDashboard';
import MomentumDashboard from './MomentumDashboard';
import CurrencyBar from './CurrencyBar';
import { h3Style } from './styles';
import { captureEvent } from '../../utils/analytics';

export default function SoloView({ selectedSymbol, data, error, sectorAvg, sectorHistory }) {
  const { profile, setProfile } = useProfile();
  const isExplorateur = profile === 'explorateur';
  const { targetCurrency, rates } = useCurrency();
  const { isMobile } = useBreakpoint();
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  if (error) return <p style={{ color: '#ef5350' }}>Aucune donnée disponible pour {selectedSymbol}</p>;
  if (!data)  return <p style={{ color: 'var(--text3)' }}>Aucune donnée disponible.</p>;

  const d = data;
  const sourceCurrency = d.currency || 'USD';

  const fmt = (val, unit) => {
    if (val === null || val === undefined || val === 0)
      return <span style={{ color: 'var(--text3)' }}>—</span>;
    const str = formatFinancialValue(val, unit, sourceCurrency, targetCurrency, rates);
    return str === '—' ? <span style={{ color: 'var(--text3)' }}>—</span> : str;
  };

  const fmtRaw = (val, unit) => {
    if (val === null || val === undefined || val === 0) return '—';
    if (unit === '%') return `${val.toFixed(2)}%`;
    if (unit === 'x') return `${val.toFixed(2)}x`;
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} Md$`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)} M$`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)} k$`;
    return `${sign}${abs.toFixed(2)} $`;
  };

  const getAssetType = () => {
    const cls = d.asset_class;
    if (cls) return cls;
    if (!selectedSymbol) return 'stock';
    const t = selectedSymbol.toUpperCase();
    if (t.includes('-USD')) return 'crypto';
    if (t.startsWith('^'))  return 'index';
    if (t.endsWith('=F'))   return 'commodity';
    return 'stock';
  };

  const renderCategory = (title, dataArray, catKey, sectionId, showTitle = true) => {
    if (!dataArray || dataArray.length === 0) return null;
    const visible = dataArray.filter(m => m.val !== null && m.val !== undefined && m.val !== 0);
    if (visible.length === 0) return null;
    const metricsCarousel = isMobile;
    return (
      <div id={sectionId}>
        {showTitle && <h3 style={h3Style}>{title}</h3>}
        <div style={metricsCarousel ? {
          display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
          gap: '10px', paddingBottom: '4px',
        } : { display: 'grid', gridTemplateColumns: `repeat(${visible.length}, 1fr)`, gap: '8px' }}>
          {visible.map((metric, i) => {
            const avg = sectorAvg?.[catKey]?.[metric.name] ?? undefined;
            return metricsCarousel
              ? <div key={i} style={{ flex: '0 0 44%', flexShrink: 0, scrollSnapAlign: 'start' }}><MetricCard metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} /></div>
              : <MetricCard key={i} metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} />;
          })}
          {metricsCarousel && <div aria-hidden="true" style={{ flex: '0 0 calc(56% - 10px)', flexShrink: 0 }} />}
        </div>
      </div>
    );
  };

  const renderFlatMetrics = (categories) => {
    const allMetrics = [];
    for (const { dataArray, catKey } of categories) {
      if (!dataArray) continue;
      const visible = dataArray.filter(m => m.val !== null && m.val !== undefined && m.val !== 0);
      for (const m of visible) allMetrics.push({ metric: m, catKey });
    }
    if (allMetrics.length === 0) return null;
    return (
      <div style={isMobile ? {
        display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
        gap: '10px', paddingBottom: '4px', marginBottom: '32px',
      } : {
        display: 'grid',
        gridTemplateColumns: `repeat(${allMetrics.length}, 1fr)`,
        gap: '10px',
        marginBottom: '32px',
      }}>
        {allMetrics.map(({ metric, catKey }, i) => {
          const avg = sectorAvg?.[catKey]?.[metric.name] ?? undefined;
          return isMobile
            ? <div key={`${catKey}-${i}`} style={{ flex: '0 0 44%', flexShrink: 0, scrollSnapAlign: 'start' }}><MetricCard metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} large /></div>
            : <MetricCard key={`${catKey}-${i}`} metric={{ ...metric, avg }} fmt={fmt} fmtRaw={fmtRaw} large />;
        })}
        {isMobile && <div aria-hidden="true" style={{ flex: '0 0 calc(56% - 10px)', flexShrink: 0 }} />}
      </div>
    );
  };

  const dd = d.dividends_data || {};
  const divSectorAvg = sectorAvg?.dividends_data || {};

  const fmtEmployees = (n) => {
    if (!n) return null;
    if (n >= 1000) return `${(n / 1000).toFixed(0)} k`;
    return n.toString();
  };

  const identityItems = [
    d.close_price != null && {
      icon: '💰', label: 'Prix Actuel', value: '',
      renderValue: (
        <span style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: '600' }}>
            {d.close_price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {d.currency || '$'}
          </span>
          {d.daily_change_pct != null && (
            <span style={{ fontSize: '12px', fontWeight: '600', marginLeft: '6px', color: d.daily_change_pct >= 0 ? '#26a69a' : '#ef5350' }}>
              {d.daily_change_pct >= 0 ? '+' : ''}{d.daily_change_pct.toFixed(2)}%
            </span>
          )}
        </span>
      ),
    },
    d.industry  && { icon: '🏭', label: 'Industrie',    value: d.industry },
    d.country   && { icon: '📍', label: 'Siège',         value: [d.city, d.country].filter(Boolean).join(', ') },
    d.ipo_date  && { icon: '📅', label: 'Introduction',  value: new Date(d.ipo_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) },
    d.employees && { icon: '👥', label: 'Effectif',      value: `${fmtEmployees(d.employees)} employés` },
    d.exchange  && { icon: '🏦', label: 'Bourse',        value: d.exchange },
    d.currency  && { icon: '💱', label: 'Devise',        value: d.currency },
    d.website   && { icon: '🔗', label: 'Site web',      value: d.website, isLink: true },
  ].filter(Boolean);

  const scores = d.scores ?? null;
  const complexityLabel = scores?.complexity >= 6.5 ? 'Avancé' : scores?.complexity >= 4.0 ? 'Modéré' : 'Simple';
  const complexityColor = scores?.complexity >= 6.5 ? '#ef5350' : scores?.complexity >= 4.0 ? '#ff9800' : '#26a69a';
  const verdictColor = { 'Profil Fort': '#26a69a', 'Profil Solide': '#26a69a', 'Profil Neutre': '#ff9800', 'Profil Prudent': '#ef5350', 'Profil Fragile': '#ef5350' }[scores?.verdict] ?? 'var(--text1)';
  const assetType = getAssetType();

  // ── VUE EXPLORATEUR ────────────────────────────────────────────────────────
  if (isExplorateur) {
    return (
      <div>
        <CurrencyBar />
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h2 style={{ color: 'var(--text1)', fontSize: '26px', margin: 0 }}>{d.name}</h2>
            {scores && (
              <span style={{
                fontSize: '13px', fontWeight: 'bold', padding: '3px 10px',
                borderRadius: '5px', backgroundColor: verdictColor + '22',
                color: verdictColor, border: `1px solid ${verdictColor}55`,
              }}>{scores.verdict}</span>
            )}
          </div>
          <div style={{ color: '#2962FF', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>
            {d.sector}{d.industry && d.industry !== d.sector ? ` — ${d.industry}` : ''}
          </div>
          <div>
            <p style={{
              color: 'var(--text3)', lineHeight: '1.7', fontSize: '13px', margin: 0, maxWidth: '720px',
              ...(!isDescExpanded && isMobile && {
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }),
            }}>{d.description}</p>
            {isMobile && d.description && d.description.length > 180 && (
              <button
                onClick={() => setIsDescExpanded(v => !v)}
                style={{
                  marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer',
                  color: '#2962FF', fontSize: '12px', fontWeight: '600', padding: 0,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                {isDescExpanded ? 'Voir moins ▲' : 'Voir plus ▼'}
              </button>
            )}
          </div>
        </div>

        {assetType !== 'stock' ? (
          <MomentumDashboard
            price={d.risk_market?.find(m => m.name === 'Prix Actuel')?.val ?? null}
            mm50={d.risk_market?.find(m => m.name === 'MM50')?.val ?? null}
            mm200={d.risk_market?.find(m => m.name === 'MM200')?.val ?? null}
            perf1y={d.risk_market?.find(m => m.name === 'Performance 1an')?.val ?? null}
            assetType={assetType}
          />
        ) : (
          <ScoreDashboard
            scores={scores}
            sector={d.sector}
            companyCount={sectorAvg?.company_count ?? null}
            beta={d.risk_market?.find(m => m.name === 'Beta')?.val ?? null}
            marketCap={d.market_analysis?.find(m => m.name === 'Capitalisation')?.val ?? null}
            isBeginnerMode={true}
            onShowAdvanced={() => {
              captureEvent('profile_changed', { profile: 'stratege', source: 'score_dashboard' });
              setProfile('stratege');
              setTimeout(() => {
                document.getElementById('section-market')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Indicateurs clés
            </h3>
            {isMobile && (
              <span style={{ fontSize: '10px', color: 'var(--text3)', opacity: 0.6, letterSpacing: '0.03em' }}>
                ↔ Swipe
              </span>
            )}
          </div>
          <div style={isMobile ? {
            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
            gap: '10px', paddingBottom: '4px',
          } : { display: 'grid', gridTemplateColumns: `repeat(${METRIQUES_REINES.length}, 1fr)`, gap: '10px' }}>
            {METRIQUES_REINES.map(({ cat, name, label }) => {
              let metric;
              let avg;
              if (cat === '_dividends') {
                const val = d.dividends_data?.dividend_yield ?? null;
                metric = val != null ? { name, val, unit: '%' } : null;
                avg = sectorAvg?.dividends_data?.dividend_yield ?? undefined;
              } else {
                metric = d[cat]?.find(m => m.name === name);
                avg = sectorAvg?.[cat]?.[name] ?? undefined;
              }
              if (!metric || metric.val === null || metric.val === undefined) return null;
              return isMobile
                ? <div key={name} style={{ flex: '0 0 44%', flexShrink: 0, scrollSnapAlign: 'start' }}><MetricCard metric={{ ...metric, avg, displayName: label }} fmt={fmt} fmtRaw={fmtRaw} /></div>
                : <MetricCard key={name} metric={{ ...metric, avg, displayName: label }} fmt={fmt} fmtRaw={fmtRaw} />;
            })}
            {isMobile && <div aria-hidden="true" style={{ flex: '0 0 calc(56% - 10px)', flexShrink: 0 }} />}
          </div>
        </div>

        <div style={{
          marginTop: '28px', padding: '16px 20px', borderRadius: '10px',
          backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <div style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '14px', marginBottom: '3px' }}>
              Aller plus loin ?
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '12px' }}>
              Le mode Stratège affiche les tableaux financiers historiques, le radar de comparaison et toutes les métriques avancées.
            </div>
          </div>
          <button
            onClick={() => setProfile('stratege')}
            style={{
              padding: '9px 18px', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid #2962FF', backgroundColor: '#2962FF',
              color: 'white', fontSize: '13px', fontWeight: 'bold',
              whiteSpace: 'nowrap', transition: 'opacity 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            📈 Passer en mode Stratège
          </button>
        </div>

        <SourceTag label="Yahoo Finance · FMP (prix live)" />
      </div>
    );
  }

  // ── VUE STRATÈGE ──────────────────────────────────────────────────────────
  return (
    <div>
      <CurrencyBar />
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '2px' }}>
          <h2 style={{ color: 'var(--text1)', fontSize: '26px', margin: 0 }}>{d.name}</h2>
          {scores && (
            <span style={{
              fontSize: '13px', fontWeight: 'bold', padding: '3px 10px',
              borderRadius: '5px', backgroundColor: verdictColor + '22',
              color: verdictColor, border: `1px solid ${verdictColor}55`,
            }}>
              {scores.verdict}
            </span>
          )}
          {scores && (
            <span style={{
              fontSize: '11px', fontWeight: 'bold', padding: '3px 10px',
              borderRadius: '5px', backgroundColor: complexityColor + '22',
              color: complexityColor, border: `1px solid ${complexityColor}55`,
              letterSpacing: '0.04em',
            }}>
              {complexityLabel}
            </span>
          )}
        </div>
        <div style={{ color: '#2962FF', fontWeight: 'bold', marginBottom: '18px', fontSize: '13px' }}>
          {d.sector}{d.industry && d.industry !== d.sector ? ` — ${d.industry}` : ''}
        </div>

        <div style={isMobile ? {
          display: 'flex', flexDirection: 'column', gap: '20px',
        } : {
          display: 'grid', gridTemplateColumns: '1fr 480px', gap: '24px', alignItems: 'stretch',
        }}>
          <div>
            <p style={{
              color: 'var(--text3)', lineHeight: '1.7', fontSize: '13px', margin: 0,
              ...(!isDescExpanded && isMobile && {
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }),
            }}>{d.description}</p>
            {isMobile && d.description && d.description.length > 180 && (
              <button
                onClick={() => setIsDescExpanded(v => !v)}
                style={{
                  marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer',
                  color: '#2962FF', fontSize: '12px', fontWeight: '600', padding: 0,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                {isDescExpanded ? 'Voir moins ▲' : 'Voir plus ▼'}
              </button>
            )}
          </div>

          <div style={{
            backgroundColor: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--border)',
              fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.08em',
              color: 'var(--text3)', textTransform: 'uppercase',
            }}>
              Informations générales
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {identityItems.map(({ icon, label, value, isLink, renderValue }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 18px', borderBottom: '1px solid var(--border)',
                  flex: 1, gap: '16px',
                }}>
                  <span style={{ color: 'var(--text3)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span style={{ fontSize: '15px' }}>{icon}</span>{label}
                  </span>
                  {isLink
                    ? <a href={value} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#2962FF', fontSize: '14px', fontWeight: '500', textDecoration: 'none', textAlign: 'right', wordBreak: 'break-all' }}>
                        {value.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    : renderValue ?? <span style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {assetType !== 'stock' ? (
        <MomentumDashboard
          price={d.risk_market?.find(m => m.name === 'Prix Actuel')?.val ?? null}
          mm50={d.risk_market?.find(m => m.name === 'MM50')?.val ?? null}
          mm200={d.risk_market?.find(m => m.name === 'MM200')?.val ?? null}
          perf1y={d.risk_market?.find(m => m.name === 'Performance 1an')?.val ?? null}
          assetType={assetType}
        />
      ) : (
        <ScoreDashboard
          scores={scores}
          sector={d.sector}
          companyCount={sectorAvg?.company_count ?? null}
          beta={d.risk_market?.find(m => m.name === 'Beta')?.val ?? null}
          marketCap={d.market_analysis?.find(m => m.name === 'Capitalisation')?.val ?? null}
          isBeginnerMode={false}
        />
      )}

      {assetType !== 'stock' ? (
        <>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text3)', opacity: 0.6, letterSpacing: '0.03em' }}>↔ Swipe</span>
            </div>
          )}
          {renderFlatMetrics([
            { dataArray: d.market_analysis, catKey: 'market_analysis' },
            { dataArray: d.risk_market,     catKey: 'risk_market'     },
          ])}
        </>
      ) : (
        <>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text3)', opacity: 0.6, letterSpacing: '0.03em' }}>↔ Swipe</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 3fr 4fr', gap: isMobile ? '16px' : '20px 24px', alignItems: 'start', marginBottom: '32px' }}>
            {renderCategory('1. Analyse de Marché',               d.market_analysis,    'market_analysis',    'section-market')}
            {renderCategory('2. Santé Financière',                d.financial_health,   'financial_health',   'section-health')}
            {renderCategory('3. Valorisation Avancée',            d.advanced_valuation, 'advanced_valuation', 'section-valuation')}
            {renderCategory('4. Risque & Marché',                 ['Beta', 'Plus Haut 52W', 'Plus Bas 52W', 'Performance 1an'].map(n => d.risk_market?.find(m => m.name === n)).filter(Boolean), 'risk_market', 'section-risk')}
            {renderCategory('5. Bilan & Liquidité',               d.balance_cash,       'balance_cash',       'section-balance')}
            {renderCategory('6. Compte de Résultat & Croissance', d.income_growth,      'income_growth',      'section-growth')}
          </div>

          <FinancialStatement title="7. Compte de Résultat — Historique"  stmtData={d.income_stmt_data}   fmt={fmt} stmtAvg={sectorAvg?.income_stmt_data}   stmtAvgHistory={sectorHistory?.income_stmt_data}   companyName={d.name} />
          <FinancialStatement title="8. Bilan Comptable — Historique"     stmtData={d.balance_sheet_data} fmt={fmt} stmtAvg={sectorAvg?.balance_sheet_data} stmtAvgHistory={sectorHistory?.balance_sheet_data} companyName={d.name} />
          <FinancialStatement title="9. Flux de Trésorerie — Historique"  stmtData={d.cashflow_data}      fmt={fmt} stmtAvg={sectorAvg?.cashflow_data}      stmtAvgHistory={sectorHistory?.cashflow_data}      companyName={d.name} />
        </>
      )}

      {dd.annual?.items?.length > 0 && (() => {
        const scalarRows = [
          dd.dividend_yield      && { name: 'Rendement Div.',     vals: [dd.dividend_yield],      unit: '%' },
          dd.dividend_rate       && { name: 'Dividende/Action',   vals: [dd.dividend_rate],       unit: '$' },
          dd.payout_ratio        && { name: 'Ratio Distribution', vals: [dd.payout_ratio],        unit: '%' },
          dd.five_year_avg_yield && { name: 'Rend. Moy. 5 ans',   vals: [dd.five_year_avg_yield], unit: '%' },
        ].filter(Boolean);
        const dividendStmtData = { years: dd.annual.years, items: [...dd.annual.items, ...scalarRows] };
        const dividendStmtAvg = {
          'Dividende Annuel':   divSectorAvg.dividend_rate,
          'Rendement Div.':     divSectorAvg.dividend_yield,
          'Dividende/Action':   divSectorAvg.dividend_rate,
          'Ratio Distribution': divSectorAvg.payout_ratio,
          'Rend. Moy. 5 ans':   divSectorAvg.five_year_avg_yield,
        };
        return (
          <FinancialStatement
            title="10. Politique de Dividende — Historique"
            stmtData={dividendStmtData}
            fmt={fmt}
            stmtAvg={dividendStmtAvg}
            stmtAvgHistory={{ 'Dividende Annuel': sectorHistory?.dividends_data?.annual_dividend }}
            companyName={d.name}
          />
        );
      })()}

      <SourceTag label="Yahoo Finance · FMP (prix live)" />
    </div>
  );
}
