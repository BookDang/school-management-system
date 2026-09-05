import apiClient from '@/lib/apiClient';
import type { LoginInput } from './schema';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export const login = async (input: LoginInput): Promise<LoginResult> => {
  const response = await apiClient.post<LoginResult>('/auth/login', input);
  return response.data;
};

export const loginStaff = async (input: LoginInput): Promise<LoginResult> => {
  const response = await apiClient.post<LoginResult>('/auth/staff/login', input);
  return response.data;
};
