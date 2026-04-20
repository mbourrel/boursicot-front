import { createContext, useContext, useState, useEffect } from 'react';

// ── Palettes ──────────────────────────────────────────────────────────────────
export const DARK = {
  bg0:       '#0b0e11',   // fond page
  bg1:       '#131722',   // carte / graphique
  bg2:       '#1a1e2e',   // panneau intérieur
  bg3:       '#1e222d',   // input / carte secondaire
  border:    '#2B2B43',   // bordures
  text1:     '#ffffff',   // texte primaire
  text2:     '#d1d4dc',   // texte secondaire
  text3:     '#8a919e',   // texte atténué
  // Valeurs JS pour lightweight-charts (ne supporte pas var())
  chartBg:   '#131722',
  chartGrid: '#2B2B43',
  chartText: '#d1d4dc',
};

export const LIGHT = {
  bg0:       '#eef1f8',
  bg1:       '#ffffff',
  bg2:       '#f5f7fc',
  bg3:       '#edf0f7',
  border:    '#d0d5e3',
  text1:     '#131722',
  text2:     '#2a3040',
  text3:     '#6b7280',
  chartBg:   '#ffffff',
  chartGrid: '#e8ecf5',
  chartText: '#2a3040',
};

// Variables CSS injectées sur :root pour que les styles statiques (hors useTheme)
// puissent aussi réagir au changement de thème.
const CSS_VARS = {
  '--bg0':    'bg0',
  '--bg1':    'bg1',
  '--bg2':    'bg2',
  '--bg3':    'bg3',
  '--border': 'border',
  '--text1':  'text1',
  '--text2':  'text2',
  '--text3':  'text3',
};

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {}, theme: DARK });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;

  // Applique les variables CSS sur <html> à chaque changement de thème
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(CSS_VARS).forEach(([cssVar, key]) => {
      root.style.setProperty(cssVar, theme[key]);
    });
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d), theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
