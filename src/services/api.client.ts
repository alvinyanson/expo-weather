import { create } from 'axios';
import { logBreadcrumb } from './crash.service';

const apiClient = create({
  baseURL: process.env.EXPO_PUBLIC_OPEN_METEO_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Breadcrumb only; server/network failures are not app bugs.
    const method = error.config?.method?.toUpperCase() ?? 'REQUEST';
    const url = error.config?.url ?? 'unknown';
    const status = error.response?.status ?? 'network-error';
    logBreadcrumb(`[API] ${method} ${url} -> ${status}`);

    return Promise.reject(error);
  },
);

export default apiClient;
