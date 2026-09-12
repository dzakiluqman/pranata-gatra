import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type MemberFormProps = {
  onSubmit: (email: string) => Promise<void>;
  isSubmitting?: boolean;
};

export function MemberForm({
  onSubmit,
  isSubmitting = false,
}: MemberFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const value = email.trim().toLowerCase();

    if (!value) {
      setError("Email wajib diisi.");
      return;
    }

    if (!value.includes("@")) {
      setError("Masukkan email yang valid.");
      return;
    }

    try {
      setError(null);
      await onSubmit(value);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengirim invitation.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email Member</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#8E998F" />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="contoh@email.com"
          placeholderTextColor="#8E998F"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          isSubmitting && styles.disabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#0A0E0A" />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="#0A0E0A" />

            <Text style={styles.buttonText}>Kirim Invitation</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  label: {
    marginBottom: 9,
    fontSize: 14,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  inputContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: "#F5F7F3",
  },

  error: {
    marginTop: 8,
    fontSize: 13,
    color: "#FF8A8A",
  },

  button: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: "#A8D8A8",
  },

  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#0A0E0A",
  },

  disabled: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.75,
  },
});

