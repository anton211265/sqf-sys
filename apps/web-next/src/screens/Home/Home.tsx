import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { RootState } from 'redux/store';
import { setData } from 'redux/user';
import { setAccessToken } from 'api/axiosClient';
import { AUTH } from 'constants/routes';

/**
 * Proof-of-life protected screen — confirms the auth chassis (login,
 * refresh, PrivateRoute) works end-to-end. Gets replaced by the real
 * permissions-manifest-driven shell once the storyboard/nav design lands
 * (see CLAUDE.md "Planned: Dynamic RBAC... Role-Based Dashboard").
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user?.data);

  const handleLogout = () => {
    setAccessToken(null);
    dispatch(setData({ data: null }));
    navigate(AUTH.LOGIN);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">web-next chassis is live</h1>
      <p className="text-muted-foreground">Signed in as {user?.email ?? 'unknown'}</p>
      <Button onClick={handleLogout}>Log out</Button>
    </div>
  );
};

export default Home;
