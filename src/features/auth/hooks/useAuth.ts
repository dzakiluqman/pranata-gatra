import {
    useAuthContext,
} from '@/providers/AuthProvider';

import {
    sendEmailOtp,
    signOut,
    verifyEmailOtp,
} from '../services/authService';

export function useAuth() {
  const auth = useAuthContext();

  return {
    ...auth,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
  };
}