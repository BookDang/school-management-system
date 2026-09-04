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
