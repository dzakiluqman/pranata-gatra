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

import type { CreateWorkspaceInput } from "../types/workspace.types";

type WorkspaceFormProps = {
  initialValues?: CreateWorkspaceInput;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateWorkspaceInput) => Promise<void>;
};

export function WorkspaceForm({
  initialValues,
  submitLabel = "Buat Workspace",
  isSubmitting = false,
  onSubmit,
}: WorkspaceFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");

  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Nama workspace wajib diisi.");
      return;
    }

    try {
      setError(null);

      await onSubmit({
        name: trimmedName,
        description: description.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan workspace.",
      );
    }
  };

  return (
    <View>
      <View style={styles.field}>
        <Text style={styles.label}>Nama Workspace</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="folder-outline" size={19} color="#858D86" />

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Contoh: Semester 5"
            placeholderTextColor="#697169"
            style={styles.input}
            editable={!isSubmitting}
            maxLength={100}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Deskripsi</Text>

        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tambahkan deskripsi workspace..."
            placeholderTextColor="#697169"
            style={[styles.input, styles.textArea]}
            editable={!isSubmitting}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={17} color="#E57B7B" />

          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.button,
          isSubmitting && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#152016" />
        ) : (
          <>
            <Text style={styles.buttonText}>{submitLabel}</Text>

            <Ionicons name="arrow-forward" size={18} color="#152016" />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 9,
    fontSize: 12,
    fontWeight: "600",
    color: "#DDE4DD",
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: "rgba(42,51,44,0.65)",
    borderWidth: 1,
    borderColor: "rgba(205,218,207,0.22)",
  },

  textAreaContainer: {
    alignItems: "flex-start",
    paddingVertical: 14,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 0,
    fontSize: 14,
    color: "#F1F4F1",
  },

  textArea: {
    minHeight: 100,
    marginLeft: 0,
    paddingTop: 0,
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },

  error: {
    flex: 1,
    fontSize: 12,
    color: "#E57B7B",
  },

  button: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 19,
    backgroundColor: "#E7EEE7",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#152016",
  },

  pressed: {
    opacity: 0.75,
  },
});
