import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
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
import { type EmailFormValues, emailSchema } from '../schemas/authSchemas';
import AuthLayoutWrapper from './AuthLayoutWrapper';

export default function LoginForm() {
  const { sendEmailOtp } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: EmailFormValues) => {
    const { error } = await sendEmailOtp(
      {
        email: values.email,
      },
      {
        shouldCreateUser: false,
      },
    );

    if (error) {
      Alert.alert('Login gagal', error.message);
      return;
    }

    router.push({
      pathname: '/(auth)/verify-otp',
      params: {
        email: values.email,
        mode: 'login',
      },
    });
  };

  return (
    <AuthLayoutWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          Input email address to receive OTP code
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#757575"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {errors.email && (
          <Text style={styles.error}>{errors.email.message}</Text>
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
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.switchAuthButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.switchAuthText}>
            Still don’t have account?{' '}
            <Text style={styles.switchAuthHighlight}>Sign Up</Text>
          </Text>
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
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.primaryGold,
    borderRadius: 26,
    paddingHorizontal: 20,
    fontFamily: FONTS.regular,
    fontSize: 15,
    backgroundColor: COLORS.bgInput,
    color: COLORS.textLight,
  },
  error: {
    marginTop: 6,
    fontFamily: FONTS.regular,
    color: COLORS.danger,
    fontSize: 13,
  },
  buttonWrapper: {
    marginTop: 24,
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
  switchAuthButton: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  switchAuthText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#BDB39E',
  },
  switchAuthHighlight: {
    fontFamily: FONTS.bold,
    color: COLORS.secondaryLightGold,
  },
  pressed: {
    opacity: 0.85,
  },
});
