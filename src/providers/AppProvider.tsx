import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

export function AppProvider({
  children,
}: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}