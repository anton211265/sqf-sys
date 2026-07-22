import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { store, persistor, RootState } from 'redux/store';
import { setData } from 'redux/user';
import axiosClient, { getAccessToken, setAccessToken } from 'api/axiosClient';
import { AUTH, HOME } from 'constants/routes';
import Login from 'screens/Auth/Login';
import Enroll from 'screens/Auth/Enroll';
import MobileAuth from 'screens/Auth/MobileAuth';
import Home from 'screens/Home/Home';

const client = new QueryClient();

interface IPrivateRouteProps {
  children: React.ReactNode;
}

// Checks the in-memory access token. On a hard refresh this is null until
// SilentRefresh (below) completes — SilentRefresh gates rendering so there's
// no race between the two. Ported from apps/web's PrivateRoute.
const PrivateRoute = ({ children }: IPrivateRouteProps): JSX.Element => {
  const token = getAccessToken();
  return !token ? <Navigate to={AUTH.LOGIN} /> : <>{children}</>;
};

// On app mount, if Redux has a persisted user session, attempt a silent
// refresh to restore the in-memory access token from the httpOnly
// refresh_token cookie. Ported from apps/web's App.tsx.
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
      <Route
        path={AUTH.MOBILE_AUTH}
        element={
          <PrivateRoute>
            <MobileAuth />
          </PrivateRoute>
        }
      />
      <Route
        path={HOME}
        element={
          <PrivateRoute>
            <Home />
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
