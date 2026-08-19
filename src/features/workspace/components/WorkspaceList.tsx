import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { WorkspaceCard } from "./WorkspaceCard";

import type { Workspace } from "../types/workspace.types";

type WorkspaceListProps = {
  workspaces: Workspace[];
  isLoading: boolean;
  onWorkspacePress: (workspace: Workspace) => void;
  title?: string;
};

export function WorkspaceList({
  workspaces,
  isLoading,
  onWorkspacePress,
  title = "Active Workspaces",
}: WorkspaceListProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#DDE5DD" />

        <Text style={styles.loadingText}>Memuat workspace...</Text>
      </View>
    );
  }

  if (workspaces.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>+</Text>
        </View>

        <Text style={styles.emptyTitle}>Belum ada workspace</Text>

        <Text style={styles.emptyDescription}>
          Buat workspace untuk mulai mengelola tugas dan aktivitasmu.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.grid}>
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onPress={() => onWorkspacePress(workspace)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontWeight: "600",
    color: "#F1F4F1",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  loadingContainer: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: "#858D86",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  emptyIconText: {
    fontSize: 26,
    fontWeight: "300",
    color: "#DDE5DD",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#F1F4F1",
  },

  emptyDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#858D86",
  },
});
