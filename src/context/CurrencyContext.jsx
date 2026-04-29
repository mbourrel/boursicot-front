import { createContext, useContext, useState } from 'react';
import { useExchangeRates } from '../hooks/useExchangeRates';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [targetCurrency, setTargetCurrency] = useState('LOCAL');
  const { rates, updatedAt } = useExchangeRates();

  return (
    <CurrencyContext.Provider value={{ targetCurrency, setTargetCurrency, rates, updatedAt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
