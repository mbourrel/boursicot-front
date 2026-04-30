import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

// 'explorateur' : vue simplifiée, métriques reines, SimpleChart, EconomicClock only
// 'stratege'    : vue complète actuelle — zéro régression
// null          : aucun profil défini → WelcomeModal s'affiche
const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user, isLoaded } = useUser();

  const [profile, setProfileState] = useState(
    () => localStorage.getItem('boursicot_profile') || null
  );
  const [showCoachMark, setShowCoachMark] = useState(false);

  // Sync depuis Clerk unsafeMetadata à la connexion
  // Si l'utilisateur a déjà un profil en localStorage, on le garde.
  // Sinon, on récupère ce qui est stocké dans Clerk.
  useEffect(() => {
    if (!isLoaded || !user) return;
    const clerkProfile = user.unsafeMetadata?.boursicot_profile;
    if (clerkProfile && !localStorage.getItem('boursicot_profile')) {
      setProfileState(clerkProfile);
      localStorage.setItem('boursicot_profile', clerkProfile);
    }
  }, [isLoaded, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setProfile = (p) => {
    setProfileState(p);
    localStorage.setItem('boursicot_profile', p);
    setShowCoachMark(true);
    // Sync vers Clerk si l'utilisateur est connecté
    if (user) {
      user.update({ unsafeMetadata: { ...user.unsafeMetadata, boursicot_profile: p } })
        .catch(() => {}); // silencieux — localStorage fait foi
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, showCoachMark, setShowCoachMark }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile doit être utilisé dans ProfileProvider');
  return ctx;
}
