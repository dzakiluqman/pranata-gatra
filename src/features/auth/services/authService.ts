import type { AuthError, Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import type {
    EmailOtpRequest,
    VerifyOtpRequest,
} from '../types/auth.types';

export interface AuthResult<T = null> {
  data: T | null;
  error: AuthError | null;
}

export async function sendEmailOtp(
  payload: EmailOtpRequest,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email: payload.email,
    options: {
      shouldCreateUser: true,
    },
  });

  return {
    data: null,
    error,
  };
}

export async function verifyEmailOtp(
  payload: VerifyOtpRequest,
): Promise<AuthResult<Session>> {
  const { data, error } =
    await supabase.auth.verifyOtp({
      email: payload.email,
      token: payload.token,
      type: 'email',
    });

  return {
    data: data.session,
    error,
  };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();

  return {
    data: null,
    error,
  };
}

export async function getSession(): Promise<AuthResult<Session>> {
  const { data, error } =
    await supabase.auth.getSession();

  return {
    data: data.session,
    error,
  };
}