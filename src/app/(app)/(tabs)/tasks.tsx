import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  TaskCard,
  TaskFilter,
  type TaskFilters,
  useTasks,
  useUpdateTaskStatus,
} from "@/features/task";

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    deadline: "all",
    search: "",
  });

  const tasksQuery = useTasks(filters);
  const updateStatusMutation = useUpdateTaskStatus();

  const filteredTasks = useMemo(() => {
    const list = tasksQuery.data ?? [];
    const search = filters.search?.trim().toLowerCase();

    if (!search) {
      return list;
    }

    return list.filter((task) => {
      return (
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.workspace?.name.toLowerCase().includes(search) ||
        task.subject?.name.toLowerCase().includes(search)
      );
    });
  }, [tasksQuery.data, filters.search]);

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
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.contentWrapper,
          {
            paddingTop: insets.top + 14,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MANAGEMENT</Text>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
              Kelola semua tugas kamu dalam satu tempat
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={handleCreateTask}
          >
            <Ionicons name="add" size={24} color="#0A0E0A" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={19} color="#8E998F" />

          <TextInput
            value={filters.search ?? ""}
            onChangeText={(search) =>
              setFilters((current) => ({
                ...current,
                search,
              }))
            }
            placeholder="Cari tugas..."
            placeholderTextColor="#8E998F"
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
              <Ionicons name="close-circle" size={18} color="#8E998F" />
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
            <ActivityIndicator size="large" color="#A8D8A8" />
            <Text style={styles.loadingText}>Memuat tugas...</Text>
          </View>
        ) : tasksQuery.error ? (
          <View style={styles.center}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle-outline" size={32} color="#FF8A8A" />
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
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: insets.bottom + 120,
              },
              filteredTasks.length === 0 && styles.emptyList,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={tasksQuery.isRefetching}
                onRefresh={() => tasksQuery.refetch()}
                tintColor="#A8D8A8"
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
                    size={38}
                    color="#A8D8A8"
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
                  <Ionicons name="add" size={18} color="#0A0E0A" />
                  <Text style={styles.emptyButtonText}>Buat Tugas</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#8DB88D",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E998F",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A8D8A8",
  },
  searchContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    color: "#F5F7F3",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DCE3DC",
  },
  clearFilter: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A8D8A8",
  },
  separator: {
    height: 10,
  },
  listContent: {
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
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
    color: "#8E998F",
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 138, 138, 0.12)",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  errorMessage: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: "#8E998F",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#A8D8A8",
  },
  retryText: {
    color: "#0A0E0A",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.08)",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "#8E998F",
  },
  emptyButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#A8D8A8",
  },
  emptyButtonText: {
    color: "#0A0E0A",
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});

