import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';

import { useAppState } from '@/hooks/useAppState';
import { useOnlineManager } from '@/hooks/useOnlineManager';
import {
  restoreQuerySnapshot,
  saveQuerySnapshot,
} from '@/lib/cache/offlineCache';

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
            // Sekali data di-fetch, tetap dianggap valid/static agar bisa dibuka saat offline
            staleTime: Infinity,
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 hari
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // Mode offline-first: langsung tampilkan data yang ada di cache tanpa error jika koneksi mati
            networkMode: 'offlineFirst',
          },
          mutations: {
            networkMode: 'offlineFirst',
          },
        },
      }),
  );

  useEffect(() => {
    // 1. Pulihkan snapshot query terakhir yang tersimpan secara lokal
    restoreQuerySnapshot(queryClient);

    // 2. Simpan setiap perubahan query data yang sukses ke localStorage (debounced)
    let timeoutId: any = null;
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === 'updated' &&
        event.action?.type === 'success'
      ) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveQuerySnapshot(queryClient);
        }, 800);
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}