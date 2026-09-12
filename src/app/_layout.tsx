import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/providers/AppProvider';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Slot />
    </AppProvider>
  );
}