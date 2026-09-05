import apiClient from './apiClient';

const getHandler = () =>
  apiClient.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (v: unknown) => unknown;
      rejected: (e: unknown) => Promise<never>;
    }>;
  };

describe('apiClient response interceptor', () => {
  it('passes a successful response through unchanged', () => {
    const { fulfilled } = getHandler().handlers[0];
    const response = { data: { ok: true } };

    expect(fulfilled(response)).toBe(response);
  });

  it('joins an array validation message and keeps the status', async () => {
    const { rejected } = getHandler().handlers[0];
    const error = {
      response: {
        status: 400,
        data: { message: ['email must be an email', 'password is too short'] },
      },
      message: 'Request failed with status code 400',
    };

    await expect(rejected(error)).rejects.toEqual({
      status: 400,
      message: 'email must be an email, password is too short',
    });
  });

  it('uses a string validation message as-is', async () => {
    const { rejected } = getHandler().handlers[0];
    const error = {
      response: { status: 409, data: { message: 'Email is already registered' } },
      message: 'Request failed with status code 409',
    };

    await expect(rejected(error)).rejects.toEqual({
      status: 409,
      message: 'Email is already registered',
    });
  });

  it('falls back to the axios error message and status 0 on a network error', async () => {
    const { rejected } = getHandler().handlers[0];
    const error = { message: 'Network Error' };

    await expect(rejected(error)).rejects.toEqual({
      status: 0,
      message: 'Network Error',
    });
  });
});
