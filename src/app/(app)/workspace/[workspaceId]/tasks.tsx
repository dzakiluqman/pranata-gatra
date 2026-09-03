import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  TaskCard,
  useUpdateTaskStatus,
  useWorkspaceTasks,
} from "@/features/task";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

export default function WorkspaceTasksScreen() {
  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  const workspaceQuery = useWorkspace(workspaceId);

  const tasksQuery = useWorkspaceTasks(workspaceId);

  const updateStatusMutation = useUpdateTaskStatus();

  const [search, setSearch] = useState("");

  const tasks = tasksQuery.data ?? [];

  const filteredTasks = search.trim()
    ? tasks.filter((task) => {
        const query = search.trim().toLowerCase();

        return (
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.subject?.name.toLowerCase().includes(query)
        );
      })
    : tasks;

  const workspace = workspaceQuery.workspace;

  const handleCreate = () => {
    router.push({
      pathname: "/task/create",
      params: {
        workspaceId,
      },
    });
  };

  const handleTaskPress = (taskId: string) => {
    router.push({
      pathname: "/task/[taskId]",
      params: {
        taskId,
      },
    });
  };

  const handleStatusChange = async (
    taskId: string,
    status: "pending" | "in_progress" | "completed",
  ) => {
    await updateStatusMutation.mutateAsync({
      taskId,
      status,
    });
  };

  if (workspaceQuery.isLoading || tasksQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1C5BFF" />

          <Text style={styles.loadingText}>Memuat tugas workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (workspaceQuery.error || tasksQuery.error) {
    const error = workspaceQuery.error ?? tasksQuery.error;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          </View>

          <Text style={styles.errorTitle}>Gagal memuat tugas</Text>

          <Text style={styles.errorMessage}>
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data."}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              workspaceQuery.refresh();
              tasksQuery.refetch();
            }}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </Pressable>

            <Pressable style={styles.addButton} onPress={handleCreate}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.title}>{workspace?.name ?? "Tasks"}</Text>

          <Text style={styles.subtitle}>
            {tasks.length} tugas dalam workspace ini
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#8A8F98" />

          <Pressable style={styles.searchInputWrapper} onPress={() => {}}>
            <Text style={search ? styles.searchText : styles.searchPlaceholder}>
              {search || "Cari tugas..."}
            </Text>
          </Pressable>

          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {tasks.filter((task) => task.status === "pending").length}
            </Text>

            <Text style={styles.summaryLabel}>Pending</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {tasks.filter((task) => task.status === "in_progress").length}
            </Text>

            <Text style={styles.summaryLabel}>Dikerjakan</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {tasks.filter((task) => task.status === "completed").length}
            </Text>

            <Text style={styles.summaryLabel}>Selesai</Text>
          </View>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredTasks.length === 0 ? styles.emptyList : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={tasksQuery.isRefetching}
              onRefresh={() => tasksQuery.refetch()}
              tintColor="#1C5BFF"
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item.id)}
              onStatusChange={() =>
                handleStatusChange(
                  item.id,
                  item.status === "completed" ? "pending" : "completed",
                )
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="clipboard-outline" size={40} color="#1C5BFF" />
              </View>

              <Text style={styles.emptyTitle}>Belum ada tugas</Text>

              <Text style={styles.emptyMessage}>
                Workspace ini belum memiliki tugas.
              </Text>

              <Pressable style={styles.emptyButton} onPress={handleCreate}>
                <Ionicons name="add" size={18} color="#FFFFFF" />

                <Text style={styles.emptyButtonText}>Buat Tugas</Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C5BFF",
    shadowColor: "#1C5BFF",
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  searchContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInputWrapper: {
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 10,
  },
  searchText: {
    fontSize: 15,
    color: "#111827",
  },
  searchPlaceholder: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 15,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
  },
  listContent: {
    paddingTop: 5,
    paddingBottom: 30,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEFF",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#6B7280",
  },
  emptyButton: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1C5BFF",
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#6B7280",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1C5BFF",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
