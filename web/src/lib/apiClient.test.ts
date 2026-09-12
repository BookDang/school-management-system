import axios from 'axios';
import { createApiClient, staffApiClient, userApiClient } from './apiClient';

type ResponseHandler = {
  fulfilled: (v: unknown) => unknown;
  rejected: (e: unknown) => Promise<unknown>;
};

type RequestHandler = {
  fulfilled: (c: { headers: Record<string, string> }) => unknown;
};

const getResponseHandler = (client: typeof userApiClient): ResponseHandler =>
  (client.interceptors.response as unknown as { handlers: ResponseHandler[] }).handlers[0];

const getRequestHandler = (client: typeof userApiClient): RequestHandler =>
  (client.interceptors.request as unknown as { handlers: RequestHandler[] }).handlers[0];

describe('apiClient request interceptor', () => {
  afterEach(() => {
    userApiClient.setAccessToken(null);
  });

  it('attaches the access token as a Bearer header once set', () => {
    userApiClient.setAccessToken('the-token');
    const { fulfilled } = getRequestHandler(userApiClient);

    const config = fulfilled({ headers: {} }) as { headers: Record<string, string> };

    expect(config.headers.Authorization).toBe('Bearer the-token');
  });

  it('does not add an Authorization header when no token is set', () => {
    const { fulfilled } = getRequestHandler(userApiClient);

    const config = fulfilled({ headers: {} }) as { headers: Record<string, string> };

    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('apiClient response interceptor', () => {
  afterEach(() => {
    userApiClient.setAccessToken(null);
    jest.restoreAllMocks();
  });

  it('passes a successful response through unchanged', () => {
    const { fulfilled } = getResponseHandler(userApiClient);
    const response = { data: { ok: true } };

    expect(fulfilled(response)).toBe(response);
  });

  it('joins an array validation message and keeps the status', async () => {
    const { rejected } = getResponseHandler(userApiClient);
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
    const { rejected } = getResponseHandler(userApiClient);
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
    const { rejected } = getResponseHandler(userApiClient);
    const error = { message: 'Network Error' };

    await expect(rejected(error)).rejects.toEqual({
      status: 0,
      message: 'Network Error',
    });
  });
});

describe('apiClient 401 refresh-and-retry', () => {
  afterEach(() => {
    userApiClient.setAccessToken(null);
    jest.restoreAllMocks();
  });

  it('refreshes the token and retries the original request once', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'new-token' } });
    const requestSpy = jest.spyOn(userApiClient, 'request').mockResolvedValue({ data: 'retried' });
    const { rejected } = getResponseHandler(userApiClient);
    const error = {
      response: { status: 401, data: {} },
      config: { url: '/protected', headers: {} },
      message: 'Request failed with status code 401',
    };

    const result = await rejected(error);

    expect(axios.post).toHaveBeenCalledWith(
      '/auth/refresh',
      undefined,
      expect.objectContaining({ withCredentials: true }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        _retry: true,
        headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
      }),
    );
    expect(result).toEqual({ data: 'retried' });
  });

  it('does not retry a second time - a 401 already marked _retry rejects normally', async () => {
    const postSpy = jest.spyOn(axios, 'post');
    const { rejected } = getResponseHandler(userApiClient);
    const error = {
      response: { status: 401, data: { message: 'still unauthorized' } },
      config: { url: '/protected', headers: {}, _retry: true },
      message: 'Request failed with status code 401',
    };

    await expect(rejected(error)).rejects.toEqual({ status: 401, message: 'still unauthorized' });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('calls onSessionExpired when the refresh call itself fails', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
    const onSessionExpired = jest.fn();
    const client = createApiClient({ refreshPath: '/auth/refresh', onSessionExpired });
    const { rejected } = getResponseHandler(client);
    const error = {
      response: { status: 401, data: { message: 'unauthorized' } },
      config: { url: '/protected', headers: {} },
      message: 'Request failed with status code 401',
    };

    await expect(rejected(error)).rejects.toEqual({ status: 401, message: 'unauthorized' });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent 401s into a single refresh call', async () => {
    let resolveRefresh: (value: { data: { accessToken: string } }) => void = () => {};
    jest.spyOn(axios, 'post').mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }) as ReturnType<typeof axios.post>,
    );
    jest.spyOn(userApiClient, 'request').mockResolvedValue({ data: 'ok' });
    const { rejected } = getResponseHandler(userApiClient);
    const error = (url: string) => ({
      response: { status: 401, data: {} },
      config: { url, headers: {} },
      message: 'Request failed with status code 401',
    });

    const first = rejected(error('/a'));
    const second = rejected(error('/b'));
    resolveRefresh({ data: { accessToken: 'shared-token' } });
    await Promise.all([first, second]);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe('portal-specific refresh endpoints', () => {
  afterEach(() => {
    userApiClient.setAccessToken(null);
    staffApiClient.setAccessToken(null);
    jest.restoreAllMocks();
  });

  it('restoreSession calls each portal’s own refresh endpoint', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'tok' } });

    await userApiClient.restoreSession();
    expect(postSpy).toHaveBeenLastCalledWith('/auth/refresh', undefined, expect.anything());

    await staffApiClient.restoreSession();
    expect(postSpy).toHaveBeenLastCalledWith('/auth/staff/refresh', undefined, expect.anything());
  });

  it('restoreSession resolves silently (no throw) when there is no valid session', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('no cookie'));

    await expect(userApiClient.restoreSession()).resolves.toBeUndefined();
  });
});
