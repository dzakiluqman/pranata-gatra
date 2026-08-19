import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getWorkspaces } from "@/features/workspace/services/workspaceService";
import { supabase } from "@/lib/supabase";

import type { Workspace } from "@/features/workspace/types/workspace.types";

type WorkspaceStats = {
  subjects: number;
  tasks: number;
  members: number;
};

type WorkspaceWithStats = Workspace & {
  stats: WorkspaceStats;
};

export default function WorkspaceScreen() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithStats[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getWorkspaces();

      if (data.length === 0) {
        setWorkspaces([]);
        return;
      }

      const workspaceIds = data.map((workspace) => workspace.id);

      const [
        { data: subjects, error: subjectsError },
        { data: tasks, error: tasksError },
        { data: members, error: membersError },
      ] = await Promise.all([
        supabase
          .from("subjects")
          .select("workspace_id")
          .in("workspace_id", workspaceIds),

        supabase
          .from("tasks")
          .select("workspace_id")
          .in("workspace_id", workspaceIds),

        supabase
          .from("workspace_members")
          .select("workspace_id")
          .in("workspace_id", workspaceIds),
      ]);

      if (subjectsError) {
        throw subjectsError;
      }

      if (tasksError) {
        throw tasksError;
      }

      if (membersError) {
        throw membersError;
      }

      const subjectCounts = new Map<string, number>();
      const taskCounts = new Map<string, number>();
      const memberCounts = new Map<string, number>();

      (subjects ?? []).forEach((subject) => {
        subjectCounts.set(
          subject.workspace_id,
          (subjectCounts.get(subject.workspace_id) ?? 0) + 1,
        );
      });

      (tasks ?? []).forEach((task) => {
        taskCounts.set(
          task.workspace_id,
          (taskCounts.get(task.workspace_id) ?? 0) + 1,
        );
      });

      (members ?? []).forEach((member) => {
        memberCounts.set(
          member.workspace_id,
          (memberCounts.get(member.workspace_id) ?? 0) + 1,
        );
      });

      const mappedWorkspaces: WorkspaceWithStats[] = data.map((workspace) => ({
        ...workspace,
        stats: {
          subjects: subjectCounts.get(workspace.id) ?? 0,
          tasks: taskCounts.get(workspace.id) ?? 0,
          members: memberCounts.get(workspace.id) ?? 0,
        },
      }));

      setWorkspaces(mappedWorkspaces);
    } catch (err) {
      console.error("Failed to load workspaces:", err);

      setError(err instanceof Error ? err.message : "Gagal memuat workspace.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const filteredWorkspaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return workspaces;
    }

    return workspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(keyword) ||
        (workspace.description ?? "").toLowerCase().includes(keyword),
    );
  }, [search, workspaces]);

  const openWorkspace = (workspaceId: string) => {
    router.push(`/(app)/workspace/${workspaceId}`);
  };

  const createWorkspace = () => {
    router.push("/(app)/workspace/create");
  };

  const renderWorkspace = ({ item }: { item: WorkspaceWithStats }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.workspaceCard,
          pressed && styles.pressed,
        ]}
        onPress={() => openWorkspace(item.id)}
      >
        <View style={styles.workspaceAccent} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.workspaceIcon}>
              <Ionicons name="grid-outline" size={24} color="#208AEF" />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.workspaceName} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={styles.workspaceDescription} numberOfLines={2}>
                {item.description || "Tidak ada deskripsi workspace."}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="book-outline" size={16} color="#6B7280" />

              <Text style={styles.statText}>{item.stats.subjects} Subject</Text>
            </View>

            <View style={styles.stat}>
              <Ionicons name="checkbox-outline" size={16} color="#6B7280" />

              <Text style={styles.statText}>{item.stats.tasks} Task</Text>
            </View>

            <View style={styles.stat}>
              <Ionicons name="people-outline" size={16} color="#6B7280" />

              <Text style={styles.statText}>{item.stats.members} Member</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#208AEF" />

          <Text style={styles.loadingText}>Memuat workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={34} color="#EF4444" />
          </View>

          <Text style={styles.errorTitle}>Gagal Memuat Workspace</Text>

          <Text style={styles.errorDescription}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadWorkspaces()}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />

            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.eyebrow}>COLLABORATION</Text>

            <Text style={styles.title}>Workspace</Text>

            <Text style={styles.subtitle}>
              Kelola ruang kerja dan aktivitasmu.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={createWorkspace}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari workspace..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workspace Kamu</Text>

          <View style={styles.workspaceCount}>
            <Text style={styles.workspaceCountText}>
              {filteredWorkspaces.length}
            </Text>
          </View>
        </View>

        <FlatList
          data={filteredWorkspaces}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkspace}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadWorkspaces(true)}
          contentContainerStyle={[
            styles.listContent,
            filteredWorkspaces.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={search ? "search-outline" : "grid-outline"}
                  size={32}
                  color="#208AEF"
                />
              </View>

              <Text style={styles.emptyTitle}>
                {search ? "Workspace tidak ditemukan" : "Belum ada workspace"}
              </Text>

              <Text style={styles.emptyDescription}>
                {search
                  ? "Coba gunakan kata kunci pencarian yang berbeda."
                  : "Buat workspace pertama kamu untuk mulai mengorganisir aktivitas."}
              </Text>

              {!search && (
                <Pressable style={styles.emptyButton} onPress={createWorkspace}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />

                  <Text style={styles.emptyButtonText}>Buat Workspace</Text>
                </Pressable>
              )}
            </View>
          }
        />

        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          onPress={createWorkspace}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 20,
  },

  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#208AEF",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#208AEF",
  },

  searchContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    marginLeft: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  workspaceCount: {
    marginLeft: 8,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3FF",
  },

  workspaceCountText: {
    color: "#208AEF",
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 100,
  },

  workspaceCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },

  workspaceAccent: {
    width: 5,
    backgroundColor: "#208AEF",
  },

  cardContent: {
    flex: 1,
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  workspaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3FF",
  },

  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  workspaceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  workspaceDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
  },

  statText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 5,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#208AEF",
    elevation: 6,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3FF",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#208AEF",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#208AEF",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.75,
  },
});
