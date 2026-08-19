import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth';

export default function Index() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}