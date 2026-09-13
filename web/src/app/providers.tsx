'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { staffApiClient, userApiClient } from '@/lib/apiClient';
import { shouldThrowQueryError } from '@/utils/shouldThrowQueryError';

interface ProvidersProps {
  portal: 'user' | 'staff';
  children: React.ReactNode;
}

const Providers = ({ portal, children }: ProvidersProps) => {
  // Query errors are re-thrown to the nearest error.tsx boundary when they represent a genuinely
  // broken backend (shouldThrowQueryError) - this is opt-out, not opt-in, so a future page using
  // useQuery gets this for free with no extra code. Scoped to queries only: a mutation (form
  // submit) should keep showing its error inline at the call site, like LoginPage already does,
  // rather than blowing away the whole page over a failed submit.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { throwOnError: (error) => shouldThrowQueryError(error) },
        },
      }),
  );

  useEffect(() => {
    const client = portal === 'staff' ? staffApiClient : userApiClient;
    client.restoreSession();
  }, [portal]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default Providers;
