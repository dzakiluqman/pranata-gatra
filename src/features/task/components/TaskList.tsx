import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type { TaskWithRelations } from "../types/task.types";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  onTaskPress?: (task: TaskWithRelations) => void;
  onTaskStatusChange?: (task: TaskWithRelations) => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
  scrollEnabled?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
}

export function TaskList({
  tasks,
  isLoading = false,
  isRefreshing = false,
  error = null,
  onRefresh,
  onTaskPress,
  onTaskStatusChange,
  onRetry,
  emptyTitle = "Belum ada tugas",
  emptyDescription = "Tugas yang kamu buat akan muncul di sini.",
  compact = false,
  scrollEnabled = true,
  ListHeaderComponent,
  ListFooterComponent,
}: TaskListProps) {
  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#1C5BFF" />

        <Text style={styles.stateTitle}>Memuat tugas...</Text>
      </View>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <View style={styles.centerState}>
        <View style={styles.stateIcon}>
          <Ionicons name="cloud-offline-outline" size={28} color="#6B7280" />
        </View>

        <Text style={styles.stateTitle}>Gagal memuat tugas</Text>

        <Text style={styles.stateDescription}>
          {error.message || "Terjadi kesalahan saat mengambil data tugas."}
        </Text>

        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />

            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {ListHeaderComponent}

        <View style={styles.emptyState}>
          <View style={styles.stateIcon}>
            <Ionicons name="checkbox-outline" size={30} color="#6B7280" />
          </View>

          <Text style={styles.stateTitle}>{emptyTitle}</Text>

          <Text style={styles.stateDescription}>{emptyDescription}</Text>
        </View>

        {ListFooterComponent}
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          compact={compact}
          onPress={onTaskPress ? () => onTaskPress(item) : undefined}
          onStatusChange={
            onTaskStatusChange ? () => onTaskStatusChange(item) : undefined
          }
        />
      )}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#1C5BFF"
          />
        ) : undefined
      }
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  stateDescription: {
    maxWidth: 300,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1C5BFF",
    marginTop: 5,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
