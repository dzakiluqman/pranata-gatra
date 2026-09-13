import React from "react";
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

import { emailSchema, type EmailFormValues } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import AuthLayoutWrapper from "./AuthLayoutWrapper";

export default function LoginForm() {
  const { sendEmailOtp } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
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
      Alert.alert("Login gagal", error.message);
      return;
    }

    router.push({
      pathname: "/(auth)/verify-otp",
      params: {
        email: values.email,
        mode: "login",
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
            colors={["#B38D46", "#FFE8B3"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.switchAuthButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.switchAuthText}>
            Still don’t have account?{" "}
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
  form: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFE8B3",
    marginBottom: 10,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: "#B38D46",
    borderRadius: 26,
    paddingHorizontal: 20,
    fontSize: 15,
    backgroundColor: "#1F1F1F",
    color: "#FFFFFF",
  },
  error: {
    marginTop: 6,
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
  switchAuthButton: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: "#BDB39E",
  },
  switchAuthHighlight: {
    color: "#FFE8B3",
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
