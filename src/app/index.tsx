import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import { SplashScreen, useSession } from '@/features/auth';

export default function Index() {
  const { session, isLoading } = useSession();
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashDone(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !isSplashDone) {
    return <SplashScreen />;
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}