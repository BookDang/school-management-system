'use client';

import { useEffect } from 'react';
import { getErrorCode } from '@/utils/getErrorCode';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Ultimate fallback for errors that escape even the per-portal error.tsx boundaries - e.g. a
 * failure inside RootShell or the providers it wires up, not just inside a page. Next.js requires
 * this file to render its own <html>/<body> (it replaces the root layout entirely when it fires),
 * and it deliberately stays free of antd/next-intl/RootShell so it can't itself fail the same way -
 * `getErrorCode` is a dependency-free pure function, so pulling it in doesn't compromise that.
 */
const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  const errorCode = getErrorCode(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {errorCode !== undefined && (
            <p style={{ color: '#888', fontSize: 32, fontFamily: 'monospace', margin: 0 }}>
              {errorCode}
            </p>
          )}
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try again.</p>
          <button type="button" onClick={reset} style={{ marginRight: 8 }}>
            Try again
          </button>
          <a href="/">Go home</a>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
