import axios, { type AxiosError } from 'axios';

export interface ApiError {
  status: number;
  message: string;
}

interface NestErrorBody {
  message?: string | string[];
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  // Required for the browser to send/receive the httpOnly refresh cookie — matters whenever web
  // and api aren't on the exact same origin (e.g. `next dev` on :3000 calling api on :4000
  // directly instead of going through nginx). Harmless for the same-origin (nginx) case.
  withCredentials: true,
});

// In-memory only (never localStorage — defeats the point of the refresh cookie being httpOnly).
// Lost on full page reload; a page that needs to stay authenticated across reloads should call
// POST /auth/refresh (or /auth/staff/refresh) once on mount to get a fresh access token.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<NestErrorBody>) => {
    const status = error.response?.status ?? 0;
    const rawMessage = error.response?.data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : (rawMessage ?? error.message);

    const apiError: ApiError = { status, message };
    return Promise.reject(apiError);
  },
);

export default apiClient;
