interface StatusfulError {
  status?: number;
}

/**
 * Decides which React Query errors get re-thrown to the nearest error.tsx boundary (via
 * `throwOnError`) instead of just sitting in the query's own `error` state - error.tsx itself
 * picks the right title/illustration per status (see AdminErrorPage/UserErrorPage). A genuinely
 * broken backend (status 0 - network failure/timeout, or a 5xx) or a 403 (forbidden) means the
 * page can't do anything useful with partial UI, so those are treated as fatal. A 401 is already
 * handled by apiClient's own refresh-and-redirect flow before it ever reaches here. A 404 is left
 * alone deliberately: unlike "the whole page is broken," a resource-not-found (e.g. "this student
 * doesn't exist") is usually more useful handled inline by the component itself (which knows what
 * else it can still show), not by discarding the entire page.
 */
export const shouldThrowQueryError = (error: unknown): boolean => {
  const status = (error as StatusfulError | undefined)?.status;
  return status === 0 || status === 403 || (status !== undefined && status >= 500);
};
