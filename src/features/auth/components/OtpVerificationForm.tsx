import React, { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

import { otpSchema, type OtpFormValues } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import AuthLayoutWrapper from "./AuthLayoutWrapper";

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
      token: "",
    },
  });

  const onSubmit = async (values: OtpFormValues) => {
    const { error } = await verifyEmailOtp({
      email,
      token: values.token,
    });

    if (error) {
      Alert.alert("Verifikasi gagal", error.message);
      return;
    }

    router.replace("/");
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <AuthLayoutWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Email Verification</Text>
        <Text style={styles.subtitle}>
          OTP code has sent to <Text style={styles.emailHighlight}>{email || "example@gmail.com"}</Text>
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
                const char = value ? value[index] : "";
                const isCurrent = (value?.length || 0) === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      isCurrent && styles.otpBoxActive,
                    ]}
                  >
                    <Text style={styles.otpText}>{char || ""}</Text>
                  </View>
                );
              })}

              {/* Hidden text input capturing input and paste */}
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
                autoComplete="one-time-code"
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
            colors={["#B38D46", "#FFE8B3"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Change Email or Go Back</Text>
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
    fontSize: 26,
    fontWeight: "700",
    color: "#B38D46",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#D0C7B7",
  },
  emailHighlight: {
    color: "#FFE8B3",
    fontWeight: "700",
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFE8B3",
    marginBottom: 12,
  },
  otpBoxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1F1F1F",
    borderWidth: 1.5,
    borderColor: "#B38D46",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxActive: {
    borderColor: "#FFE8B3",
    backgroundColor: "#282828",
  },
  otpText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
    fontSize: 1,
  },
  error: {
    marginTop: 8,
    color: "#FF6B6B",
    fontSize: 13,
  },
  buttonWrapper: {
    marginTop: 24,
    borderRadius: 26,
    overflow: "hidden",
  },
  gradientButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#FFE8B3",
    fontSize: 14,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.85,
  },
});