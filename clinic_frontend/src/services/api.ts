import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiCache } from './apiCache';

// Get the API base URL based on the current hostname
// If on localhost, use localhost:8000
// If on an IP address, use the same IP with :8000
const getAPIBaseURL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  // For IP addresses or other hosts, use the same IP
  return `http://${hostname}:8000/api`;
};

const API_BASE_URL = getAPIBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();

const buildGetRequestKey = (url: string, config?: AxiosRequestConfig) => {
  const params = config?.params ? JSON.stringify(config.params) : '';
  return `${url}|${params}`;
};

const isCacheableGet = (url: string) => {
  return !url.includes('/token/refresh/');
};

const originalGet = api.get.bind(api);
api.get = ((url: string, config?: AxiosRequestConfig) => {
  const key = buildGetRequestKey(url, config);

  if (isCacheableGet(url)) {
    const cached = apiCache.get(key);
    if (cached) {
      return Promise.resolve({
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {},
      } as AxiosResponse);
    }
  }

  const existingRequest = inFlightGetRequests.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const request = originalGet(url, config)
    .then((response) => {
      if (isCacheableGet(url)) {
        apiCache.set(key, response.data, 45_000);
      }
      return response;
    })
    .finally(() => {
      inFlightGetRequests.delete(key);
    });

  inFlightGetRequests.set(key, request);
  return request;
}) as typeof api.get;

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl: string = originalRequest?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/accounts/users/login/') ||
      requestUrl.includes('/accounts/users/register/') ||
      requestUrl.includes('/accounts/users/forgot_password/') ||
      requestUrl.includes('/accounts/users/verify_reset_token/') ||
      requestUrl.includes('/accounts/users/reset_password/');

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
