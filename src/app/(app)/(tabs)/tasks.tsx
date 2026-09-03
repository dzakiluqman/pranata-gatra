import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  TaskCard,
  TaskFilter,
  type TaskFilters,
  useTasks,
  useUpdateTaskStatus,
} from "@/features/task";

export default function TasksScreen() {
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    deadline: "all",
    search: "",
  });

  const tasksQuery = useTasks(filters);
  const updateStatusMutation = useUpdateTaskStatus();

  const tasks = tasksQuery.data ?? [];

  const filteredTasks = useMemo(() => {
    const search = filters.search?.trim().toLowerCase();

    if (!search) {
      return tasks;
    }

    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.workspace?.name.toLowerCase().includes(search) ||
        task.subject?.name.toLowerCase().includes(search)
      );
    });
  }, [tasks, filters.search]);

  const handleStatusChange = async (
    taskId: string,
    status: "pending" | "in_progress" | "completed",
  ) => {
    await updateStatusMutation.mutateAsync({
      taskId,
      status,
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

  const handleCreateTask = () => {
    router.push("/task/create");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
              Kelola semua tugas kamu dalam satu tempat
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={handleCreateTask}
            android_ripple={{ color: "#ffffff30" }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#8A8F98" />

          <TextInput
            value={filters.search ?? ""}
            onChangeText={(search) =>
              setFilters((current) => ({
                ...current,
                search,
              }))
            }
            placeholder="Cari tugas..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
          />

          {!!filters.search && (
            <Pressable
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  search: "",
                }))
              }
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <TaskFilter filters={filters} onChange={setFilters} />

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{filteredTasks.length} tugas</Text>

          {filters.status !== "all" && (
            <Pressable
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  status: "all",
                }))
              }
            >
              <Text style={styles.clearFilter}>Reset</Text>
            </Pressable>
          )}
        </View>

        {tasksQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1C5BFF" />
            <Text style={styles.loadingText}>Memuat tugas...</Text>
          </View>
        ) : tasksQuery.error ? (
          <View style={styles.center}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            </View>

            <Text style={styles.errorTitle}>Gagal memuat tugas</Text>

            <Text style={styles.errorMessage}>
              {tasksQuery.error instanceof Error
                ? tasksQuery.error.message
                : "Terjadi kesalahan saat mengambil data tugas."}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => tasksQuery.refetch()}
            >
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : (
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
                  <Ionicons
                    name="checkmark-done-outline"
                    size={40}
                    color="#1C5BFF"
                  />
                </View>

                <Text style={styles.emptyTitle}>Belum ada tugas</Text>

                <Text style={styles.emptyMessage}>
                  Buat tugas baru untuk mulai mengatur pekerjaanmu.
                </Text>

                <Pressable
                  style={styles.emptyButton}
                  onPress={handleCreateTask}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Buat Tugas</Text>
                </Pressable>
              </View>
            }
          />
        )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C5BFF",
    shadowColor: "#1C5BFF",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    color: "#111827",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  clearFilter: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C5BFF",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 30,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 80,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  errorMessage: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
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
});
