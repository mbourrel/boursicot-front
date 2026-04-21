import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg0)' }}>
        <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Chargement...</div>
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  return children;
}
