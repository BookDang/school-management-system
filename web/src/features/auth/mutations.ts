import { useMutation } from '@tanstack/react-query';
import { login, loginStaff } from './api';

export const useLogin = () => useMutation({ mutationFn: login });

export const useStaffLogin = () => useMutation({ mutationFn: loginStaff });
