import {
    Controller,
    useForm,
} from 'react-hook-form';

import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    zodResolver,
} from '@hookform/resolvers/zod';

import {
    otpSchema,
    type OtpFormValues,
} from '../schemas/authSchemas';

import { useAuth } from '../hooks/useAuth';

import { router } from 'expo-router';

interface Props {
  email: string;
}

export default function OtpVerificationForm({
  email,
}: Props) {
  const {
    verifyEmailOtp,
  } = useAuth();

  const {
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: '',
    },
  });

  const onSubmit = async (
    values: OtpFormValues,
  ) => {
    const { error } =
      await verifyEmailOtp({
        email,
        token: values.token,
      });

    if (error) {
      Alert.alert(
        'Verifikasi gagal',
        error.message,
      );
      return;
    }

    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Verifikasi Email
      </Text>

      <Text style={styles.subtitle}>
        Kode OTP telah dikirim ke:
      </Text>

      <Text style={styles.email}>
        {email}
      </Text>

      <Controller
        control={control}
        name="token"
        render={({
          field: {
            onChange,
            value,
          },
        }) => (
          <TextInput
            style={styles.input}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      {errors.token && (
        <Text style={styles.error}>
          {errors.token.message}
        </Text>
      )}

      <Pressable
        style={[
          styles.button,
          isSubmitting &&
            styles.buttonDisabled,
        ]}
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>
          {isSubmitting
            ? 'Memverifikasi...'
            : 'Verifikasi'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.65,
  },

  email: {
    marginTop: 4,
    marginBottom: 24,
    fontSize: 16,
    fontWeight: '600',
  },

  input: {
    height: 60,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    fontSize: 24,
    letterSpacing: 8,
  },

  error: {
    marginTop: 6,
    color: '#DC2626',
  },

  button: {
    height: 52,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});