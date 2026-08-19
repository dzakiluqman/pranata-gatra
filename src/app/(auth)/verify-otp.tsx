import { OtpVerificationForm } from '@/features/auth';

import { useLocalSearchParams } from 'expo-router';

export default function VerifyOtpScreen() {
  const {
    email,
  } = useLocalSearchParams<{
    email: string;
    mode?: string;
  }>();

  return (
    <OtpVerificationForm
      email={email}
    />
  );
}