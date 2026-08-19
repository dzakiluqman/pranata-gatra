import { Redirect, Slot } from 'expo-router';

import { useSession } from '@/features/auth';

export default function AppLayout() {
  const {
    isAuthenticated,
    isLoading,
  } = useSession();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}