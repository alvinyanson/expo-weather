import { create } from 'axios';

const apiClient = create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Foundation for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error with context for debugging
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Reject with a standard error format or just the error
    return Promise.reject(error);
  },
);

export default apiClient;
