import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ProfileProvider } from './context/ProfileContext';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { initAnalytics } from './utils/analytics';
import { PWAProvider } from './context/PWAContext';

// Initialisation analytics avant le premier render — exécuté une seule fois.
// Sans VITE_POSTHOG_KEY dans .env.local, cette fonction est silencieuse.
initAnalytics();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/login">
      <BrowserRouter>
        <ThemeProvider>
          <CurrencyProvider>
            <ProfileProvider>
              <PWAProvider>
                <App />
              </PWAProvider>
            </ProfileProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();
