import { createContext, useContext, useState } from 'react';

// 'explorateur' : vue simplifiée, métriques reines, SimpleChart, EconomicClock only
// 'stratege'    : vue complète actuelle — zéro régression
const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(
    () => localStorage.getItem('boursicot_profile') || 'explorateur'
  );

  const setProfile = (p) => {
    setProfileState(p);
    localStorage.setItem('boursicot_profile', p);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile doit être utilisé dans ProfileProvider');
  return ctx;
}
