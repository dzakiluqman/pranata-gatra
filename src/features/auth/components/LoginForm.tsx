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

import { emailSchema, type EmailFormValues } from "../schemas/authSchemas";

import { useAuth } from "../hooks/useAuth";

import { router } from "expo-router";

export default function LoginForm() {
  const insets = useSafeAreaInsets();
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
          <Text style={styles.eyebrow}>PRANATA GATRA</Text>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>
            Masukkan email untuk menerima kode OTP.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor="#8E998F"
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
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.switchAuthButton}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.switchAuthText}>
              Belum punya akun?{" "}
              <Text style={styles.switchAuthHighlight}>Daftar sekarang</Text>
            </Text>
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

  form: {
    width: "100%",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DCE3DC",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#151A15",
    color: "#F5F7F3",
  },

  error: {
    marginTop: 6,
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

  switchAuthButton: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  switchAuthText: {
    fontSize: 14,
    color: "#8E998F",
  },

  switchAuthHighlight: {
    color: "#A8D8A8",
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.75,
  },
});

