import axios from 'axios';
import { QueryClient } from 'react-query';
import { AUTH } from '../constants/routes';
import { BASE_URL } from 'constants/constant';
import { getAccessToken, setAccessToken } from '../api/axiosClient';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly refresh_token cookie automatically
});

const publicClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onAccessTokenFetched(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    if (response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      return publicClient
        .post(
          '/trade-directory/auth/refresh',
          {},
          { headers: { 'Content-Type': 'application/json' } },
        )
        .then(({ data }) => {
          const newAccessToken = data.accessToken;
          setAccessToken(newAccessToken);
          apiClient.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          onAccessTokenFetched(newAccessToken);
          return apiClient(originalRequest);
        })
        .catch((refreshError) => {
          setAccessToken(null);
          publicClient
            .post('/trade-directory/auth/logout', {})
            .finally(() => {
              window.location.href = AUTH.LOGIN;
            });
          return Promise.reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    return Promise.reject(error);
  },
);

const client = new QueryClient();

export { client, apiClient, publicClient };
