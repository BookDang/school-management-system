import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

export interface ApiError {
  status: number;
  message: string;
}

interface NestErrorBody {
  message?: string | string[];
}

interface RefreshResponse {
  accessToken: string;
}

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export interface ApiClient extends AxiosInstance {
  /** In-memory only (never localStorage — defeats the point of the refresh cookie being httpOnly). */
  setAccessToken: (token: string | null) => void;
  /** Call once on app mount to recover an access token from the httpOnly refresh cookie, if any.
   * Resolves silently (no throw) whether or not a session was actually restored. */
  restoreSession: () => Promise<void>;
}

interface CreateApiClientOptions {
  /** Portal-specific refresh endpoint, e.g. '/auth/refresh' or '/auth/staff/refresh'. */
  refreshPath: string;
  /** Called when a mid-session refresh fails (refresh cookie missing/expired) - not called by
   * restoreSession, since a failed restore on a fresh visit just means "not logged in". */
  onSessionExpired: () => void;
}

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const normalizeError = (error: AxiosError<NestErrorBody>): ApiError => {
  const status = error.response?.status ?? 0;
  const rawMessage = error.response?.data?.message;
  const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? error.message);
  return { status, message };
};

export const createApiClient = ({
  refreshPath,
  onSessionExpired,
}: CreateApiClientOptions): ApiClient => {
  let accessToken: string | null = null;
  // Dedupes concurrent refresh attempts - several requests can 401 at once, but they should all
  // wait on the same in-flight refresh call instead of each firing their own.
  let refreshPromise: Promise<string | null> | null = null;

  const setAccessToken = (token: string | null): void => {
    accessToken = token;
  };

  // Plain axios, not the `instance` below - going through `instance` would re-enter this same
  // response interceptor and could recurse forever on a 401 from the refresh call itself.
  const refresh = (): Promise<string | null> => {
    if (!refreshPromise) {
      refreshPromise = axios
        .post<RefreshResponse>(refreshPath, undefined, { baseURL, withCredentials: true })
        .then((response) => {
          const token = response.data.accessToken;
          setAccessToken(token);
          return token;
        })
        .catch(() => {
          setAccessToken(null);
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  };

  const restoreSession = async (): Promise<void> => {
    await refresh();
  };

  const instance = axios.create({
    baseURL,
    // Required for the browser to send/receive the httpOnly refresh cookie — matters whenever web
    // and api aren't on the exact same origin (e.g. `next dev` on :3000 calling api on :4000
    // directly instead of going through nginx). Harmless for the same-origin (nginx) case.
    withCredentials: true,
  }) as ApiClient;

  instance.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<NestErrorBody>) => {
      const status = error.response?.status ?? 0;
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      if (status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        const token = await refresh();
        if (token) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          return instance.request(originalRequest);
        }
        onSessionExpired();
      }

      return Promise.reject(normalizeError(error));
    },
  );

  instance.setAccessToken = setAccessToken;
  instance.restoreSession = restoreSession;

  return instance;
};

export const userApiClient = createApiClient({
  refreshPath: '/auth/refresh',
  onSessionExpired: () => {
    window.location.href = '/login';
  },
});

export const staffApiClient = createApiClient({
  refreshPath: '/auth/staff/refresh',
  onSessionExpired: () => {
    window.location.href = '/admin/login';
  },
});
