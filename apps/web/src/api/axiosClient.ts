import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
} from 'axios';
import { BASE_URL } from '../constants/constant';
import { AUTH } from '../constants/routes';

// Access token lives in memory only — never written to localStorage or a JS-readable cookie.
// Lost on page refresh; re-acquired via silent refresh (see App.tsx).
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => inMemoryAccessToken;

// Shared refresh-coordination state so concurrent 401s don't trigger multiple refresh calls.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onAccessTokenFetched(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

const axiosClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    withCredentials: true, // sends httpOnly refresh_token cookie automatically
  });

  client.interceptors.request.use((config) => {
    const token = inMemoryAccessToken;
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest: AxiosRequestConfig & { _retry?: boolean } =
        (error.config as any) ?? {};

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
            resolve(client(originalRequest));
          });
        });
      }

      isRefreshing = true;

      return axios
        .post(
          `${BASE_URL}/trade-directory/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
        )
        .then(({ data }) => {
          const newAccessToken = data.accessToken;
          setAccessToken(newAccessToken);
          onAccessTokenFetched(newAccessToken);
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          return client(originalRequest);
        })
        .catch((refreshError) => {
          setAccessToken(null);
          window.location.href = AUTH.LOGIN;
          return Promise.reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
        });
    },
  );

  return client;
};

export default axiosClient;
