import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { store, persistor, RootState } from 'redux/store';
import { setData } from 'redux/user';
import axiosClient, { getAccessToken, setAccessToken } from 'api/axiosClient';
import { AUTH, PORTAL, PUBLIC } from 'constants/routes';
import Login from 'screens/Auth/Login';
import Enroll from 'screens/Auth/Enroll';
import Disclaimer from 'screens/Apply/Disclaimer';
import Register from 'screens/Apply/Register';
import CheckEmail from 'screens/Apply/CheckEmail';
import PortalHome from 'screens/Portal/PortalHome';
import ApplicationWizard from 'screens/Portal/ApplicationWizard';
import ApplicationStatus from 'screens/Portal/ApplicationStatus';

const client = new QueryClient();

interface IPrivateRouteProps {
  children: React.ReactNode;
}

// Same chassis as web-next: in-memory access token + SilentRefresh gate.
const PrivateRoute = ({ children }: IPrivateRouteProps): JSX.Element => {
  const token = getAccessToken();
  return !token ? <Navigate to={AUTH.LOGIN} /> : <>{children}</>;
};

function SilentRefresh({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = React.useState(false);
  const user = useSelector((state: RootState) => state.user?.data);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!user) {
      setChecked(true);
      return;
    }
    axiosClient()
      .post('/trade-directory/auth/refresh', {}, { headers: { 'Content-Type': 'application/json' } })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
      })
      .catch(() => {
        setAccessToken(null);
        dispatch(setData({ data: null }));
      })
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return <>{null}</>;
  return <>{children}</>;
}

function Pages() {
  return (
    <Routes>
      <Route path={AUTH.LOGIN} element={<Login />} />
      <Route path={AUTH.ENROLL} element={<Enroll />} />
      {/* Public new-user application funnel */}
      <Route path={PUBLIC.DISCLAIMER} element={<Disclaimer />} />
      <Route path={PUBLIC.REGISTER} element={<Register />} />
      <Route path={PUBLIC.REGISTERED} element={<CheckEmail />} />
      {/* Authenticated client workspace (own-org only, no funder keys) */}
      <Route
        path={PORTAL.HOME}
        element={
          <PrivateRoute>
            <PortalHome />
          </PrivateRoute>
        }
      />
      <Route
        path={PORTAL.APPLICATION}
        element={
          <PrivateRoute>
            <ApplicationWizard />
          </PrivateRoute>
        }
      />
      <Route
        path={PORTAL.STATUS}
        element={
          <PrivateRoute>
            <ApplicationStatus />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to={AUTH.LOGIN} />} />
    </Routes>
  );
}

const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SilentRefresh>
            <Pages />
          </SilentRefresh>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
