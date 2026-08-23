import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useSubjectMutation } from "../hooks/useSubjects";

import type { Subject } from "../types/subject.types";

interface Props {
  workspaceId: string;
  initial?: Subject | null;
  onSuccess?: () => void;
}

export default function SubjectForm({
  workspaceId,
  initial,
  onSuccess,
}: Props) {
  const { createSubject, updateSubject, isCreating, isUpdating } =
    useSubjectMutation();

  const isEditing = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [lecturer, setLecturer] = useState(initial?.lecturer ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama subject wajib diisi.");
      return;
    }

    try {
      const input = {
        name: name.trim(),
        lecturer: lecturer.trim() ? lecturer.trim() : null,
        room: room.trim() ? room.trim() : null,
        description: description.trim() ? description.trim() : null,
        reminderEnabled: initial?.reminder_enabled ?? false,
        reminderMinutes: initial?.reminder_minutes ?? 60,
      };

      if (isEditing && initial) {
        await updateSubject({
          subjectId: initial.id,
          input,
        });

        Alert.alert("Berhasil", "Subject berhasil diperbarui.");
      } else {
        await createSubject({
          ...input,
          workspaceId,
        });

        Alert.alert("Berhasil", "Subject berhasil dibuat.");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Failed to save subject:", error);

      Alert.alert("Gagal", "Subject gagal disimpan.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Nama subject</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="cth. Matematika Diskrit"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Dosen</Text>

        <TextInput
          value={lecturer}
          onChangeText={setLecturer}
          placeholder="Nama dosen pengampu"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ruangan</Text>

        <TextInput
          value={room}
          onChangeText={setRoom}
          placeholder="cth. Ruang 301"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Deskripsi (opsional)</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Deskripsi singkat subject"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
          editable={!isSubmitting}
        />
      </View>

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          isSubmitting && styles.disabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? "Simpan Perubahan" : "Buat Subject"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
  },

  field: {
    gap: 8,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A2A8A1",
  },

  input: {
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    color: "#F5F7F3",
    fontSize: 14,
  },

  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  button: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    borderRadius: 13,
    backgroundColor: "#A8D8A8",
  },

  buttonText: {
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
