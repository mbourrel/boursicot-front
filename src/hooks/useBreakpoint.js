import { useState, useEffect } from 'react';

/**
 * Retourne les breakpoints courants basés sur la largeur de la fenêtre.
 * Synchronisé en temps réel via un écouteur resize.
 *
 * isMobile  : < 768 px
 * isTablet  : 768 px – 1023 px
 * isDesktop : ≥ 1024 px
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    width,
    isMobile:  width < 768,
    isTablet:  width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}
