interface CodedError {
  status?: number;
  digest?: string;
}

/**
 * Picks whichever error code is actually present to show the user - `status` for an API error
 * (thrown to this boundary via React Query's `throwOnError`) or `digest` for a Next.js
 * Server Component render error (the correlation id Next.js generates in production so it can
 * redact the real error message from the client while still letting it be traced in server logs).
 * A plain client-side render bug (neither) has nothing meaningful to show.
 */
export const getErrorCode = (error: CodedError): number | string | undefined =>
  error.status ?? error.digest;
