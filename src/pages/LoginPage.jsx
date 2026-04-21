import { SignIn } from '@clerk/clerk-react';

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg0)' }}>
      <SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl="/" />
    </div>
  );
}
