import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setAccessToken } from 'api/axiosClient';
import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { AUTH, PORTAL } from 'constants/routes';
import { useApplication } from 'hooks/usePortal';
import { RootState } from 'redux/store';
import { setData } from 'redux/user';

/**
 * Client landing after sign-in (pass 1): application progress only. The
 * Global Portal Dashboard and product workspaces arrive in later passes
 * once facilities exist.
 */
const PortalHome: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user?.data);
  const { data: application, isLoading } = useApplication();

  const logout = () => {
    setAccessToken(null);
    dispatch(setData({ data: null }));
    navigate(AUTH.LOGIN);
  };

  const inDraft = application?.status === 'DRAFT';

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b bg-[#0F172A] px-6 py-4 text-white">
        <div>
          <div className="text-lg font-semibold">SQF Client Portal</div>
          <div className="text-xs text-slate-300">{user?.email}</div>
        </div>
        <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={logout}>
          Log out
        </Button>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Your financing application</h1>
          {isLoading && <p className="mt-2 text-sm text-muted-foreground">Loading…</p>}
          {application && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {application.applicationNumber} ·{' '}
                {inDraft
                  ? 'In progress — complete the steps and submit.'
                  : 'Submitted — track the status below.'}
              </p>
              <div className="mt-4 flex gap-2">
                {inDraft ? (
                  <Button onClick={() => navigate(PORTAL.APPLICATION)}>Continue application</Button>
                ) : (
                  <Button onClick={() => navigate(PORTAL.STATUS)}>View status</Button>
                )}
              </div>
            </>
          )}
        </Card>
        <Card className="border-dashed p-4 text-sm text-muted-foreground">
          Once a facility is in force, your product workspaces (invoice uploads, drawdowns,
          settlement calendars) will appear here.
        </Card>
      </main>
    </div>
  );
};

export default PortalHome;
