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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { zodResolver } from "@hookform/resolvers/zod";

import { otpSchema, type OtpFormValues } from "../schemas/authSchemas";

import { useAuth } from "../hooks/useAuth";

import { router } from "expo-router";

interface Props {
  email: string;
}

export default function OtpVerificationForm({ email }: Props) {
  const insets = useSafeAreaInsets();
  const { verifyEmailOtp } = useAuth();

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>VERIFIKASI</Text>
          <Text style={styles.title}>Verifikasi Email</Text>
          <Text style={styles.subtitle}>Kode OTP telah dikirim ke:</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="#8E998F"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {errors.token && (
            <Text style={styles.error}>{errors.token.message}</Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0A0E0A" />
            ) : (
              <Text style={styles.buttonText}>Verifikasi</Text>
            )}
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Ganti Email atau Kembali</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  header: {
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#8DB88D",
    marginBottom: 6,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F5F7F3",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#8E998F",
  },

  email: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "#A8D8A8",
  },

  form: {
    width: "100%",
  },

  input: {
    height: 60,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    fontSize: 26,
    letterSpacing: 8,
    backgroundColor: "#151A15",
    color: "#F5F7F3",
    fontWeight: "700",
  },

  error: {
    marginTop: 8,
    color: "#FF8A8A",
    fontSize: 13,
  },

  button: {
    height: 52,
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#A8D8A8",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#0A0E0A",
    fontSize: 15,
    fontWeight: "700",
  },

  backButton: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  backButtonText: {
    color: "#8E998F",
    fontSize: 14,
    fontWeight: "500",
  },

  pressed: {
    opacity: 0.75,
  },
});