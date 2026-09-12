import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
  useUpdateTaskStatus,
  useWorkspaceTasks,
} from "@/features/task";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

export default function WorkspaceTasksScreen() {
  const insets = useSafeAreaInsets();
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
      <View style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A8D8A8" />
          <Text style={styles.loadingText}>Memuat tugas workspace...</Text>
        </View>
      </View>
    );
  }

  if (workspaceQuery.error || tasksQuery.error) {
    const error = workspaceQuery.error ?? tasksQuery.error;

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color="#FF8A8A" />
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
      </View>
    );
  }

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
          <View style={styles.headerTop}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#F5F7F3" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
              onPress={handleCreate}
            >
              <Ionicons name="add" size={24} color="#0A0E0A" />
            </Pressable>
          </View>

          <Text style={styles.title}>{workspace?.name ?? "Tasks"}</Text>

          <Text style={styles.subtitle}>
            {tasks.length} tugas dalam workspace ini
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={19} color="#8E998F" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari tugas..."
            placeholderTextColor="#8E998F"
            style={styles.searchInput}
            returnKeyType="search"
          />

          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#8E998F" />
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: insets.bottom + 40,
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
                  name="clipboard-outline"
                  size={38}
                  color="#A8D8A8"
                />
              </View>

              <Text style={styles.emptyTitle}>Belum ada tugas</Text>

              <Text style={styles.emptyMessage}>
                Workspace ini belum memiliki tugas.
              </Text>

              <Pressable style={styles.emptyButton} onPress={handleCreate}>
                <Ionicons name="add" size={18} color="#0A0E0A" />

                <Text style={styles.emptyButtonText}>Buat Tugas</Text>
              </Pressable>
            </View>
          }
        />
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
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A8D8A8",
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E998F",
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
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#8E998F",
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
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
    textAlign: "center",
    color: "#8E998F",
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
  pressed: {
    opacity: 0.75,
  },
});

