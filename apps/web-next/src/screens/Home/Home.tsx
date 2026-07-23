import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'redux/store';

/**
 * Proof-of-life protected screen — confirms the auth chassis (login,
 * refresh, PrivateRoute) works end-to-end. Gets replaced by the real
 * permissions-manifest-driven shell once the storyboard/nav design lands
 * (see CLAUDE.md "Planned: Dynamic RBAC... Role-Based Dashboard").
 */
const Home: React.FC = () => {
  const user = useSelector((state: RootState) => state.user?.data);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold">Welcome to SQF</h1>
      <p className="text-muted-foreground">
        Signed in as {user?.email ?? 'unknown'} — pick a workspace from the sidebar.
      </p>
    </div>
  );
};

export default Home;
