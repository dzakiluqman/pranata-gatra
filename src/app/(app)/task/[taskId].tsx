import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
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
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A8D8A8" />
          <Text style={styles.loadingText}>Memuat detail tugas...</Text>
        </View>
      </View>
    );
  }

  if (taskQuery.error || !task) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={34} color="#FF8A8A" />
          </View>

          <Text style={styles.errorTitle}>Tugas tidak ditemukan</Text>

          <Text style={styles.errorText}>
            {taskQuery.error instanceof Error
              ? taskQuery.error.message
              : "Tugas yang kamu cari tidak tersedia."}
          </Text>

          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const priorityInfo = getTaskPriorityInfo(task.deadline);
  const overdue = isTaskOverdue(task.deadline);
  const isCompleted = task.status === "completed";
  const isProcessing =
    completeMutation.isPending || reopenMutation.isPending || isDeleting;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color="#F5F7F3" />
          </Pressable>

          <View style={styles.topBarActions}>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color="#A8D8A8" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={handleDelete}
              disabled={isProcessing}
            >
              <Ionicons name="trash-outline" size={20} color="#FF8A8A" />
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
                  ? "#FF8A8A"
                  : priorityInfo.priority === "high"
                    ? "#F59E0B"
                    : "#DCE3DC"
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
              valueColor={overdue ? "#FF8A8A" : "#DCE3DC"}
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
                color={overdue ? "#FF8A8A" : "#A8D8A8"}
              />
            </View>

            <View style={styles.deadlineContent}>
              <Text style={styles.deadlineLabel}>
                {overdue ? "Deadline terlewat" : "Deadline"}
              </Text>

              <Text
                style={[
                  styles.deadlineValue,
                  overdue && styles.deadlineValueOverdue,
                ]}
              >
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
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.pressed,
              ]}
              onPress={handleReopen}
              disabled={isProcessing}
            >
              {reopenMutation.isPending ? (
                <ActivityIndicator color="#A8D8A8" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#A8D8A8" />
                  <Text style={styles.secondaryActionText}>Buka Kembali</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.pressed,
              ]}
              onPress={handleComplete}
              disabled={isProcessing}
            >
              {completeMutation.isPending ? (
                <ActivityIndicator color="#0A0E0A" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color="#0A0E0A"
                  />
                  <Text style={styles.primaryActionText}>Tandai Selesai</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.editAction, pressed && styles.pressed]}
            onPress={handleEdit}
            disabled={isProcessing}
          >
            <Ionicons name="create-outline" size={20} color="#DCE3DC" />
            <Text style={styles.editActionText}>Edit Tugas</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
        <Ionicons name={icon} size={18} color="#A8D8A8" />
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
    backgroundColor: "#060A08",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hero: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F5F7F3",
    lineHeight: 32,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#8E998F",
  },
  noDescription: {
    marginTop: 8,
    fontSize: 13,
    color: "#5C675D",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DCE3DC",
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.08)",
    marginRight: 13,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#8E998F",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F7F3",
  },
  deadlineCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 22,
    borderRadius: 16,
    backgroundColor: "rgba(168, 216, 168, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(168, 216, 168, 0.15)",
  },
  deadlineCardOverdue: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  deadlineIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.12)",
    marginRight: 13,
  },
  deadlineIconOverdue: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineLabel: {
    fontSize: 11,
    color: "#8E998F",
    marginBottom: 3,
  },
  deadlineValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  deadlineValueOverdue: {
    color: "#FF8A8A",
  },
  actions: {
    gap: 11,
    marginTop: 4,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#A8D8A8",
  },
  primaryActionText: {
    color: "#0A0E0A",
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
    backgroundColor: "rgba(168, 216, 168, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(168, 216, 168, 0.2)",
  },
  secondaryActionText: {
    color: "#A8D8A8",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  editActionText: {
    color: "#DCE3DC",
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
    color: "#8E998F",
    fontSize: 14,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: "#8E998F",
    lineHeight: 20,
    fontSize: 13,
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#A8D8A8",
  },
  backBtnText: {
    color: "#0A0E0A",
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
  },
});
