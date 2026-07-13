import {
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from '@mantine/core';
import '@mantine/dropzone/styles.css';
import {
  TRADE_DIRECTORY,
  CLIENTONBOARDING,
  AUTHORISESIGNATORY,
  AUTH,
  ADMIN,
  CLIENT_DASHBOARD,
  SYSTEM,
  SUPER_ADMIN,
} from './constants/routes';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { Notifications } from '@mantine/notifications';
import SystemSetup from './screens/SystemSetup/SystemSetup';

import AuthenticatedRoute from 'components/SQF/AuthenticatedRoutes';
import WelcomeOnboardingLayout from 'components/SQF/Layout/Onboarding/Welcome';
import ClientWelcome from 'screens/SQF/Client/Onboarding/Welcome';
import ApplicationInReviewLayout from 'components/SQF/Layout/Onboarding/ApplicationInReview';
import AuthoriseSignatoryWelcome from 'screens/SQF/AuthoriseSignatory/Onboarding/Welcome';
import ApplicationInReview from 'screens/SQF/Client/Onboarding/ApplicationInReview';
import AuthoriseSignatoryCompleted from 'screens/SQF/AuthoriseSignatory/Onboarding/Completed';
import ApplicationSteps from 'screens/SQF/Client/Onboarding/ApplicationSteps';
import { AuthoriseSignatoryESignatureSetup } from 'screens/SQF/AuthoriseSignatory/Onboarding/ESignatureSetup';
import NewApplication from 'screens/SQF/Client/Onboarding/NewApplication';
import Login from 'screens/SQF/Auth/Login';
import SetupNewPassword from 'screens/SQF/Auth/SetupNewPassword';
import RiskConfiguration from 'screens/SQF/Admin/Configuration/Risk Model/NewRiskFactor';
import OrganizationList from 'screens/SQF/Admin/Organization/OrganizationList';
import OrganizationView from 'screens/SQF/Admin/Organization/OrganizationView';
import RiskModelList from 'screens/SQF/Admin/Configuration/Risk Model/RiskModelList';
import RiskModelView from 'screens/SQF/Admin/Configuration/Risk Model/RiskModelView';
import AdminLayout from 'components/SQF/Layout/Admin/AdminLayout';
import RiskScoringSurvey from 'screens/SQF/Admin/Organization/Tabs/Risk/RiskScoringSurvey';
import ThresholdBreachProfileList from 'screens/SQF/Admin/Configuration/Risk Profile/ThresholdBreachProfileList';
import ThresholdBreachProfile from 'screens/SQF/Admin/Configuration/Risk Profile/ThresholdBreachProfile';
import DirectoryHome from 'screens/SQF/TradeDirectory/DirectoryHome';
import OrganizationProfile from 'screens/SQF/TradeDirectory/OrganizationProfile';
import InvoiceRegister from 'screens/SQF/TradeDirectory/InvoiceRegister';
import ContractRegister from 'screens/SQF/TradeDirectory/ContractRegister';
import Subscriptions from 'screens/SQF/TradeDirectory/Subscriptions';
import Opportunities from 'screens/SQF/TradeDirectory/Opportunities';
import { client, publicClient } from 'utils/reactQuery';
import { QueryClientProvider } from 'react-query';
import { getAccessToken, setAccessToken } from './api/axiosClient';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { setData } from './redux/user';
import { useDispatch } from 'react-redux';
import DocMgtApiReference from 'screens/SQF/Client/DocMgtApiReference/DocMgtApiReference';
import ClientLayout from 'components/SQF/Layout/Client/ClientLayout';
import DocMgtApiKey from 'screens/SQF/Client/DocMgtApiKey/DocMgtApiKey';
import DocMgtWebhooks from 'screens/SQF/Client/DocMgtWebhooks/DocMgtWebhooks';
import DocMgtWebhookDetails from 'screens/SQF/Client/DocMgtWebhookDetails/DocMgtWebhookDetails';
import DocMgtTemplates from 'screens/SQF/Client/DocMgtTemplates/DocMgtTemplates';
import DocMgtAudits from 'screens/SQF/Client/DocMgtAudits/DocMgtAudits';
import DocMgtExtractions from 'screens/SQF/Client/DocMgtExtractions/DocMgtExtractions';
import DocMgtDcoumentation from 'screens/SQF/Client/DocMgtDocumentation/DocMgtDocumentation';
import SuperAdminLayout from 'components/SQF/Layout/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from 'screens/SQF/SuperAdmin/SuperAdminDashboard';
import MyOrganisation from 'screens/SQF/SuperAdmin/MyOrganisation';
import Users from 'screens/SQF/SuperAdmin/Users';

interface IPrivateRouteProps {
  children: React.ReactNode;
}

// Checks in-memory access token. On page refresh this is null until SilentRefresh completes.
const PrivateRoute = ({ children }: IPrivateRouteProps): JSX.Element => {
  const token = getAccessToken();
  return !token ? <Navigate to={AUTH.LOGIN} /> : <>{children}</>;
};

// On app mount, if Redux has a user session, attempt a silent refresh to restore
// the in-memory access token from the httpOnly refresh_token cookie.
function SilentRefresh({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = React.useState(false);
  const user = useSelector((state: RootState) => state.user?.data);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!user) {
      setChecked(true);
      return;
    }
    publicClient
      .post('/trade-directory/auth/refresh', {}, { headers: { 'Content-Type': 'application/json' } })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
      })
      .catch(() => {
        setAccessToken(null);
        dispatch(setData({ data: null }));
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}

// apps/web/design-system/sqf-sys/MASTER.md is the source of truth for these tokens.
// primary = accent/CTA (#0369A1), navy = primary/on-dark (#0F172A). Shade 6 in each
// tuple is the exact MASTER.md hex; the rest are generated tints/shades around it.
const App = (): JSX.Element => {
  const primary: MantineColorsTuple = [
    '#E5F6FF',
    '#CCEDFF',
    '#A3DEFF',
    '#70CCFF',
    '#33B7FF',
    '#00A5FF',
    '#0369A1',
    '#004F7B',
    '#003A5A',
    '#002539',
  ];

  const navy: MantineColorsTuple = [
    '#ECF0F9',
    '#D9E0F2',
    '#BAC8E8',
    '#94A9DB',
    '#6684CC',
    '#4066BF',
    '#0F172A',
    '#0B1120',
    '#080C17',
    '#05080F',
  ];

  const theme = createTheme({
    primaryColor: 'primary',
    primaryShade: 6,
    colors: {
      primary,
      navy,
    },
    fontFamily: 'Inter, sans-serif',
    headings: { fontFamily: 'Calistoga, serif' },
    defaultRadius: 'md',
  });

  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SilentRefresh>
          <div className="App">
            <MantineProvider theme={theme}>
              <Notifications
                className="mantine-notifications"
                position="top-center"
              />
              <Pages />
            </MantineProvider>
          </div>
          </SilentRefresh>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
};

function Pages() {
  return (
    <>
      <Routes>
        {/* ************************SQF.AI ROUTES************************ */}

        {/* To be replaced with SQF.AI main page */}
        <Route path="*" element={<Navigate to={AUTH.LOGIN} />} />

        {/* ------------AUTH------------ */}

        <Route path={AUTH.LOGIN} element={<Login />} />

        <Route path={AUTH.SETUPNEWPASSWORD} element={<SetupNewPassword />} />

        {/* ------------AUTH------------ */}

        {/* ------------CLIENTS------------ */}
        <Route
          path={CLIENTONBOARDING.NEWAPPLICATION}
          element={<NewApplication />}
        />
        <Route
          path={CLIENTONBOARDING.WElCOMEPAGE}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={WelcomeOnboardingLayout}>
                <ClientWelcome />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENTONBOARDING.APPLICATIONSTEPS}
          element={
            <PrivateRoute>
              <ApplicationSteps />
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENTONBOARDING.INREVIEW}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ApplicationInReviewLayout}>
                <ApplicationInReview />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_REFERENCE}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtApiReference />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_API_KEY}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtApiKey />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_WEBHOOKS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtWebhooks />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_WEBHOOK_DETAILS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtWebhookDetails />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_TEMPLATES}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtTemplates />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_CONSENSUS_MESSAGING}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtAudits />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_EXTRACTIONS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtExtractions />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={CLIENT_DASHBOARD.DOC_MGT_DOCUMENTATION}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ClientLayout}>
                <DocMgtDcoumentation />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        {/* ------------CLIENTS------------ */}

        {/* ------------AUTHORISE SIGNATORY------------ */}

        <Route
          path={AUTHORISESIGNATORY.WElCOMEPAGE}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={WelcomeOnboardingLayout}>
                <AuthoriseSignatoryWelcome />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={AUTHORISESIGNATORY.ESIGNATURESETUP}
          element={
            <PrivateRoute>
              <AuthoriseSignatoryESignatureSetup />
            </PrivateRoute>
          }
        />
        <Route
          path={AUTHORISESIGNATORY.COMPLETED}
          element={<AuthoriseSignatoryCompleted />}
        />
        <Route
          path={AUTHORISESIGNATORY.INREVIEW}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={ApplicationInReviewLayout}>
                {/* use back the same screen as client since UI is same */}
                <ApplicationInReview />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        {/* ------------AUTHORISE SIGNATORY------------ */}

        {/* ------------SUPER ADMIN------------ */}

        <Route
          path={SUPER_ADMIN.DASHBOARD}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={SuperAdminLayout}>
                <SuperAdminDashboard />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={SUPER_ADMIN.ORGANIZATION}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={SuperAdminLayout}>
                <MyOrganisation />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={SUPER_ADMIN.USERS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={SuperAdminLayout}>
                <Users />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        {/* ------------SUPER ADMIN------------ */}

        {/* ------------ADMIN------------ */}

        <Route
          path={ADMIN.RISKMODELS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <RiskModelList />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={ADMIN.RISKMODELVIEW}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <RiskModelView />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path={ADMIN.THRESHOLDRISKPROFILES}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <ThresholdBreachProfileList />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path={ADMIN.ADD_THRESHOLDRISKPROFILES}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <ThresholdBreachProfile mode="edit" />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path={ADMIN.THRESHOLDRISKPROFILESVIEW}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <ThresholdBreachProfile mode="view" />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={ADMIN.ORGANIZATIONS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <OrganizationList />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={ADMIN.ORGANIZATIONVIEW}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <OrganizationView />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={ADMIN.ORGANIZATIONRISKSURVEYVIEW}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <RiskScoringSurvey />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        {/* ------------ADMIN------------ */}

        {/* ------------TRADE DIRECTORY------------ */}

        <Route
          path={TRADE_DIRECTORY.HOME}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <DirectoryHome />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={TRADE_DIRECTORY.ORGANIZATION}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <OrganizationProfile />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={TRADE_DIRECTORY.INVOICES}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <InvoiceRegister />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={TRADE_DIRECTORY.CONTRACTS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <ContractRegister />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={TRADE_DIRECTORY.SUBSCRIPTIONS}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <Subscriptions />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path={TRADE_DIRECTORY.OPPORTUNITIES}
          element={
            <PrivateRoute>
              <AuthenticatedRoute Layout={AdminLayout}>
                <Opportunities />
              </AuthenticatedRoute>
            </PrivateRoute>
          }
        />

        {/* ------------TRADE DIRECTORY------------ */}

        {/* ------------SYSTEM SETUP------------ */}

        <Route
          path={SYSTEM.SETUP.replace('/', '')}
          element={
            <PrivateRoute>
              <SystemSetup />
            </PrivateRoute>
          }
        />
        {/* User-manual URL compatibility redirects — these document URLs that
            differ from the actual route constants. Keep in sync with
            NewHorizons_UserManual_v2.docx Section 7 (Quick Reference). */}
        <Route
          path="/onboarding"
          element={<Navigate to={CLIENTONBOARDING.NEWAPPLICATION} replace />}
        />
        <Route
          path="/client-dashboard"
          element={<Navigate to={CLIENT_DASHBOARD.DOC_MGT_REFERENCE} replace />}
        />
      </Routes>
    </>
  );
}

export default App;
