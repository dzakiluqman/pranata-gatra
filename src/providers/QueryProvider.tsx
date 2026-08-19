import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import { PropsWithChildren, useState } from 'react';

import { useAppState } from '@/hooks/useAppState';
import { useOnlineManager } from '@/hooks/useOnlineManager';

export function QueryProvider({
  children,
}: PropsWithChildren) {
  useOnlineManager();
  useAppState();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}