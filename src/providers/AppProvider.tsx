import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationModalProvider } from '@/lib/notifications';

import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

export function AppProvider({
  children,
}: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <NotificationModalProvider>
            {children}
          </NotificationModalProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}