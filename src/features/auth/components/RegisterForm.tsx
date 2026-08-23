import { Controller, useForm } from "react-hook-form";

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { zodResolver } from "@hookform/resolvers/zod";

import { emailSchema, type EmailFormValues } from "../schemas/authSchemas";

import { useAuth } from "../hooks/useAuth";

import { router } from "expo-router";

export default function RegisterForm() {
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
        shouldCreateUser: true,
      },
    );

    if (error) {
      Alert.alert("Registrasi gagal", error.message);
      return;
    }

    router.push({
      pathname: "/(auth)/verify-otp",
      params: {
        email: values.email,
        mode: "register",
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buat Akun</Text>

      <Text style={styles.subtitle}>
        Masukkan email aktif untuk menerima kode OTP.
      </Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Mengirim OTP..." : "Lanjut"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 16,
    opacity: 0.65,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  error: {
    marginTop: 6,
    color: "#DC2626",
  },

  button: {
    height: 52,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
