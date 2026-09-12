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
        <ActivityIndicator size="large" color="#A8D8A8" />

        <Text style={styles.stateTitle}>Memuat tugas...</Text>
      </View>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <View style={styles.centerState}>
        <View style={styles.stateIcon}>
          <Ionicons name="cloud-offline-outline" size={28} color="#FF8A8A" />
        </View>

        <Text style={styles.stateTitle}>Gagal memuat tugas</Text>

        <Text style={styles.stateDescription}>
          {error.message || "Terjadi kesalahan saat mengambil data tugas."}
        </Text>

        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Ionicons name="refresh-outline" size={16} color="#0A0E0A" />

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
            <Ionicons name="checkbox-outline" size={30} color="#A8D8A8" />
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
            tintColor="#A8D8A8"
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
    backgroundColor: "rgba(168, 216, 168, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5F7F3",
    textAlign: "center",
  },
  stateDescription: {
    maxWidth: 300,
    fontSize: 13,
    lineHeight: 19,
    color: "#8E998F",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#A8D8A8",
    marginTop: 5,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A0E0A",
  },
});

