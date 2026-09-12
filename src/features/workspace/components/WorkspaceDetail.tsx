import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Workspace } from "../types/workspace.types";

type WorkspaceDetailProps = {
  workspace: Workspace | null;
  isLoading: boolean;
  error: Error | null;
  onEdit: () => void;
  onDelete: () => void;
  onSubjects: () => void;
  onTasks: () => void;
  onMembers: () => void;
};

export function WorkspaceDetail({
  workspace,
  isLoading,
  error,
  onEdit,
  onDelete,
  onSubjects,
  onTasks,
  onMembers,
}: WorkspaceDetailProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#DDE5DD" />

        <Text style={styles.loadingText}>Memuat workspace...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color="#E57B7B" />

        <Text style={styles.errorTitle}>Gagal memuat workspace</Text>

        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  if (!workspace) {
    return (
      <View style={styles.center}>
        <Ionicons name="folder-open-outline" size={42} color="#89918A" />

        <Text style={styles.errorTitle}>Workspace tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />

        <View style={styles.icon}>
          <Text style={styles.iconText}>
            {workspace.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{workspace.name}</Text>

        <Text style={styles.description}>
          {workspace.description || "Tidak ada deskripsi workspace."}
        </Text>
      </View>

      <View style={styles.navigation}>
        <Pressable
          onPress={onTasks}
          style={({ pressed }) => [
            styles.navigationCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navigationIcon}>
            <Ionicons name="checkmark-outline" size={21} color="#DDE5DD" />
          </View>

          <View style={styles.navigationContent}>
            <Text style={styles.navigationTitle}>Tasks</Text>

            <Text style={styles.navigationDescription}>
              Kelola tugas dalam workspace.
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={17} color="#A7AEA7" />
        </Pressable>

        <Pressable
          onPress={onSubjects}
          style={({ pressed }) => [
            styles.navigationCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navigationIcon}>
            <Ionicons name="book-outline" size={20} color="#DDE5DD" />
          </View>

          <View style={styles.navigationContent}>
            <Text style={styles.navigationTitle}>Subjects</Text>

            <Text style={styles.navigationDescription}>
              Kelola subject dan jadwal.
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={17} color="#A7AEA7" />
        </Pressable>

        <Pressable
          onPress={onMembers}
          style={({ pressed }) => [
            styles.navigationCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navigationIcon}>
            <Ionicons name="people-outline" size={20} color="#DDE5DD" />
          </View>

          <View style={styles.navigationContent}>
            <Text style={styles.navigationTitle}>Members</Text>

            <Text style={styles.navigationDescription}>
              Kelola member dan invitation workspace.
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={17} color="#A7AEA7" />
        </Pressable>

        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.navigationCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navigationIcon}>
            <Ionicons name="create-outline" size={20} color="#DDE5DD" />
          </View>

          <View style={styles.navigationContent}>
            <Text style={styles.navigationTitle}>Edit Workspace</Text>

            <Text style={styles.navigationDescription}>
              Ubah informasi workspace.
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={17} color="#A7AEA7" />
        </Pressable>
      </View>

      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="trash-outline" size={18} color="#E57B7B" />

        <Text style={styles.deleteButtonText}>Hapus Workspace</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#89918A",
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "600",
    color: "#F1F4F1",
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#E57B7B",
    textAlign: "center",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: "rgba(42, 51, 44, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(205, 218, 207, 0.28)",
  },

  heroGlow: {
    position: "absolute",
    top: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  icon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  iconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#EAF0EA",
  },

  name: {
    marginTop: 16,
    fontSize: 23,
    fontWeight: "600",
    color: "#F3F6F3",
    textAlign: "center",
  },

  description: {
    maxWidth: 300,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#89918A",
    textAlign: "center",
  },

  navigation: {
    gap: 10,
    marginTop: 16,
  },

  navigationCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 74,
    padding: 15,
    borderRadius: 21,
    backgroundColor: "rgba(42, 51, 44, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(205,218,207,0.25)",
  },

  navigationIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  navigationContent: {
    flex: 1,
    marginLeft: 13,
  },

  navigationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F1F4F1",
  },

  navigationDescription: {
    marginTop: 3,
    fontSize: 11,
    color: "#858D86",
  },

  deleteButton: {
    height: 52,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "rgba(133, 43, 43, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(229,123,123,0.25)",
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E57B7B",
  },

  pressed: {
    opacity: 0.7,
  },
});
