import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  TaskPriorityBadge,
  TaskStatusBadge,
  formatDeadlineRelative,
  getTaskPriorityInfo,
  isTaskOverdue,
  useCompleteTask,
  useDeleteTask,
  useReopenTask,
  useTask,
} from "@/features/task";

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();

  const taskQuery = useTask(taskId);

  const completeMutation = useCompleteTask();
  const reopenMutation = useReopenTask();
  const deleteMutation = useDeleteTask();

  const [isDeleting, setIsDeleting] = useState(false);

  const task = taskQuery.data;

  const handleComplete = async () => {
    if (!task) {
      return;
    }

    try {
      await completeMutation.mutateAsync(task.id);
    } catch (error) {
      Alert.alert(
        "Gagal",
        error instanceof Error ? error.message : "Gagal menyelesaikan tugas.",
      );
    }
  };

  const handleReopen = async () => {
    if (!task) {
      return;
    }

    try {
      await reopenMutation.mutateAsync(task.id);
    } catch (error) {
      Alert.alert(
        "Gagal",
        error instanceof Error ? error.message : "Gagal membuka kembali tugas.",
      );
    }
  };

  const handleDelete = () => {
    if (!task) {
      return;
    }

    Alert.alert(
      "Hapus Tugas",
      `Apakah kamu yakin ingin menghapus "${task.title}"?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteMutation.mutateAsync(task.id);
              router.back();
            } catch (error) {
              setIsDeleting(false);

              Alert.alert(
                "Gagal Menghapus",
                error instanceof Error
                  ? error.message
                  : "Gagal menghapus tugas.",
              );
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    if (!task) {
      return;
    }

    router.push({
      pathname: "/task/create",
      params: {
        workspaceId: task.workspace_id,
        subjectId: task.subject_id ?? "",
        taskId: task.id,
      },
    });
  };

  if (taskQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1C5BFF" />
          <Text style={styles.loadingText}>Memuat detail tugas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (taskQuery.error || !task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={34} color="#EF4444" />
          </View>

          <Text style={styles.errorTitle}>Tugas tidak ditemukan</Text>

          <Text style={styles.errorText}>
            {taskQuery.error instanceof Error
              ? taskQuery.error.message
              : "Tugas yang kamu cari tidak tersedia."}
          </Text>

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const priorityInfo = getTaskPriorityInfo(task.deadline);

  const overdue = isTaskOverdue(task.deadline);

  const isCompleted = task.status === "completed";

  const isProcessing =
    completeMutation.isPending || reopenMutation.isPending || isDeleting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>

          <View style={styles.topBarActions}>
            <Pressable style={styles.iconButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={21} color="#111827" />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={handleDelete}
              disabled={isProcessing}
            >
              <Ionicons name="trash-outline" size={21} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge deadline={task.deadline} />
          </View>

          <Text style={styles.title}>{task.title}</Text>

          {task.description ? (
            <Text style={styles.description}>{task.description}</Text>
          ) : (
            <Text style={styles.noDescription}>
              Tidak ada deskripsi untuk tugas ini.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Tugas</Text>

          <View style={styles.card}>
            <DetailRow
              icon="business-outline"
              label="Workspace"
              value={task.workspace?.name ?? "Tidak diketahui"}
            />

            <DetailRow
              icon="book-outline"
              label="Subject"
              value={task.subject?.name ?? "Tidak terkait subject"}
            />

            <DetailRow
              icon="person-outline"
              label="Ditugaskan kepada"
              value={
                task.assignee?.full_name ||
                task.assignee?.email ||
                "Belum ditugaskan"
              }
            />

            <DetailRow
              icon="flag-outline"
              label="Prioritas"
              value={priorityInfo.label}
              valueColor={
                priorityInfo.priority === "critical"
                  ? "#EF4444"
                  : priorityInfo.priority === "high"
                    ? "#F97316"
                    : "#374151"
              }
            />

            <DetailRow
              icon="calendar-outline"
              label="Deadline"
              value={
                task.deadline
                  ? formatDeadlineRelative(task.deadline)
                  : "Tidak ada deadline"
              }
              valueColor={overdue ? "#EF4444" : "#374151"}
              last
            />
          </View>
        </View>

        {task.deadline && (
          <View
            style={[styles.deadlineCard, overdue && styles.deadlineCardOverdue]}
          >
            <View
              style={[
                styles.deadlineIcon,
                overdue && styles.deadlineIconOverdue,
              ]}
            >
              <Ionicons
                name={overdue ? "warning-outline" : "time-outline"}
                size={22}
                color={overdue ? "#EF4444" : "#1C5BFF"}
              />
            </View>

            <View style={styles.deadlineContent}>
              <Text style={styles.deadlineLabel}>
                {overdue ? "Deadline terlewat" : "Deadline"}
              </Text>

              <Text style={styles.deadlineValue}>
                {new Date(task.deadline).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {isCompleted ? (
            <Pressable
              style={styles.secondaryAction}
              onPress={handleReopen}
              disabled={isProcessing}
            >
              {reopenMutation.isPending ? (
                <ActivityIndicator color="#1C5BFF" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#1C5BFF" />
                  <Text style={styles.secondaryActionText}>Buka Kembali</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={styles.primaryAction}
              onPress={handleComplete}
              disabled={isProcessing}
            >
              {completeMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryActionText}>Tandai Selesai</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            style={styles.editAction}
            onPress={handleEdit}
            disabled={isProcessing}
          >
            <Ionicons name="create-outline" size={20} color="#374151" />
            <Text style={styles.editActionText}>Edit Tugas</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={19} color="#6B7280" />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>

        <Text
          style={[
            styles.detailValue,
            valueColor ? { color: valueColor } : null,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 20,
  },
  topBarActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hero: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },
  title: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    color: "#111827",
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    color: "#6B7280",
  },
  noDescription: {
    marginTop: 12,
    fontSize: 14,
    fontStyle: "italic",
    color: "#9CA3AF",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  card: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F3",
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  deadlineCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 18,
    borderRadius: 17,
    backgroundColor: "#EAF0FF",
    borderWidth: 1,
    borderColor: "#D6E1FF",
  },
  deadlineCardOverdue: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  deadlineIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 12,
  },
  deadlineIconOverdue: {
    backgroundColor: "#FFFFFF",
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 3,
  },
  deadlineValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  actions: {
    gap: 10,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1C5BFF",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EAF0FF",
    borderWidth: 1,
    borderColor: "#D6E1FF",
  },
  secondaryActionText: {
    color: "#1C5BFF",
    fontSize: 15,
    fontWeight: "800",
  },
  editAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editActionText: {
    color: "#374151",
    fontSize: 15,
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
    color: "#6B7280",
    fontSize: 14,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: "#6B7280",
    lineHeight: 21,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1C5BFF",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
