import {
    useAuthContext,
} from '@/providers/AuthProvider';

export function useSession() {
  const {
    session,
    user,
    isLoading,
  } = useAuthContext();

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
  };
}