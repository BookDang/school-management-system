'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { staffApiClient, userApiClient } from '@/lib/apiClient';

interface ProvidersProps {
  portal: 'user' | 'staff';
  children: React.ReactNode;
}

const Providers = ({ portal, children }: ProvidersProps) => {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const client = portal === 'staff' ? staffApiClient : userApiClient;
    client.restoreSession();
  }, [portal]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default Providers;
