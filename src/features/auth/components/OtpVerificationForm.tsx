import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

import { useAuth } from '../hooks/useAuth';
import { type OtpFormValues, otpSchema } from '../schemas/authSchemas';
import AuthLayoutWrapper from './AuthLayoutWrapper';

interface Props {
  email: string;
}

export default function OtpVerificationForm({ email }: Props) {
  const { verifyEmailOtp } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: '',
    },
  });

  const onSubmit = async (values: OtpFormValues) => {
    const { error } = await verifyEmailOtp({
      email,
      token: values.token,
    });

    if (error) {
      Alert.alert('Verifikasi gagal', error.message);
      return;
    }

    router.replace('/');
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <AuthLayoutWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Email Verification</Text>
        <Text style={styles.subtitle}>
          OTP code has sent to{' '}
          <Text style={styles.emailHighlight}>{email || 'example@gmail.com'}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>OTP Code</Text>

        <Controller
          control={control}
          name="token"
          render={({ field: { onChange, onBlur, value } }) => (
            <Pressable onPress={focusInput} style={styles.otpBoxesContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const char = value ? value[index] : '';
                const isCurrent = (value?.length || 0) === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      isCurrent && styles.otpBoxActive,
                    ]}
                  >
                    <Text style={styles.otpText}>{char || ''}</Text>
                  </View>
                );
              })}

              {/* Hidden text input capturing input */}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoFocus
                textContentType="oneTimeCode"
              />
            </Pressable>
          )}
        />

        {errors.token && (
          <Text style={styles.error}>{errors.token.message}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.buttonWrapper,
            pressed && styles.pressed,
            isSubmitting && styles.buttonDisabled,
          ]}
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        >
          <LinearGradient
            colors={COLORS.goldGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.textDark} />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </AuthLayoutWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.primaryGold,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#D0C7B7',
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: FONTS.bold,
    color: COLORS.secondaryLightGold,
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.secondaryLightGold,
    marginBottom: 10,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
  },
  otpBox: {
    width: 48,
    height: 54,
    borderWidth: 1.5,
    borderColor: COLORS.primaryGold,
    borderRadius: 14,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: COLORS.secondaryLightGold,
    backgroundColor: '#2A2A2A',
  },
  otpText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.textLight,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  error: {
    marginTop: 8,
    fontFamily: FONTS.regular,
    color: COLORS.danger,
    fontSize: 13,
  },
  buttonWrapper: {
    marginTop: 28,
    borderRadius: 26,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});