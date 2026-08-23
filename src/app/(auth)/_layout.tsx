import { Redirect, Stack } from "expo-router";

import { useSession } from "@/features/auth";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
