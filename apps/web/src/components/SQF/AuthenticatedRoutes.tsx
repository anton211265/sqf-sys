import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import WelcomeLayout from './Layout/Onboarding/Welcome';

interface LayoutProps {
  children: ReactNode;
  Layout?: any; // Pass in flexible layout component, set the fallback to Client Welcome layout by default
}

const AuthenticatedRoute: React.FC<LayoutProps> = ({
  children,
  Layout = WelcomeLayout,
}) => {
  const isAuthenticated = true;
  let persona;

  const url = window.location.href;

  // Detect if 'client' or 'authorise-signatory' in the URL
  if (url.includes('client')) {
    persona = 'client';
  } else if (url.includes('signatory')) {
    persona = 'authorise-signatory';
  } else {
    persona = 'admin';
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      {/* Authentication passed, now render Layout, detect the persona to suits the screen settings */}
      <Layout persona={persona}>{children}</Layout>
    </div>
  );
};

export default AuthenticatedRoute;
