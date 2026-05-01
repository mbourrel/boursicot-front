/**
 * SwipeableContainer — carousel horizontal avec snap et points de pagination.
 *
 * Desktop : affiche les enfants dans un flex-row normal (pas de scroll).
 * Mobile  : chaque enfant occupe ~85 vw et se snappe au centre.
 *
 * Props :
 *   children  ReactNode[]  — les slides (1 enfant = 1 slide)
 *   gap       number       — espacement entre slides (défaut : 12)
 *   style     object       — styles additionnels sur le wrapper
 */
import { useRef, useState, useCallback } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function SwipeableContainer({ children, gap = 12, style = {} }) {
  const { isMobile }    = useBreakpoint();
  const scrollRef       = useRef(null);
  const [active, setActive] = useState(0);
  const slides          = Array.isArray(children) ? children : [children];

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActive(Math.max(0, Math.min(idx, slides.length - 1)));
  }, [slides.length]);

  const goTo = (idx) => {
    scrollRef.current?.scrollTo({ left: idx * scrollRef.current.offsetWidth, behavior: 'smooth' });
  };

  // ── Desktop : rendu inline normal ────────────────────────────────────────
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', gap, ...style }}>
        {slides}
      </div>
    );
  }

  // ── Mobile : carousel snap ────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Piste scrollable */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',          // Firefox
          msOverflowStyle: 'none',         // IE/Edge
          gap: `${gap}px`,
          paddingBottom: '4px',
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 85vw',
              scrollSnapAlign: 'center',
              minWidth: 0,
            }}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      {slides.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '6px',
          marginTop: '10px',
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width:  i === active ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none', cursor: 'pointer', padding: 0,
                backgroundColor: i === active ? '#2962FF' : 'var(--border)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
