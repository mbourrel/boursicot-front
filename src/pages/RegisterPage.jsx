import { SignUp } from '@clerk/clerk-react';

export default function RegisterPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg0)' }}>
      <SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/" />
    </div>
  );
}
