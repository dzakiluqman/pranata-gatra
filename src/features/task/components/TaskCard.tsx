import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TaskWithRelations } from "../types/task.types";
import {
    formatDeadlineRelative,
    getTaskPriority,
    isTaskOverdue,
} from "../utils/taskPriority";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface TaskCardProps {
  task: TaskWithRelations;
  onPress?: () => void;
  onStatusChange?: () => void;
  compact?: boolean;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return "Tidak ada deadline";
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return "Deadline tidak valid";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TaskCard({
  task,
  onPress,
  onStatusChange,
  compact = false,
}: TaskCardProps) {
  const overdue = task.status !== "completed" && isTaskOverdue(task.deadline);

  const priority = getTaskPriority(task.deadline);

  const handleStatusPress = () => {
    onStatusChange?.();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compactCard,
        overdue && styles.overdueCard,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <Pressable
          onPress={handleStatusPress}
          disabled={!onStatusChange}
          style={[
            styles.checkbox,
            task.status === "completed" && styles.checkboxCompleted,
          ]}
        >
          {task.status === "completed" ? (
            <Ionicons name="checkmark" size={15} color="#0A0E0A" />
          ) : task.status === "in_progress" ? (
            <View style={styles.progressIndicator} />
          ) : null}
        </Pressable>

        <View style={styles.titleContainer}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              task.status === "completed" && styles.completedTitle,
            ]}
          >
            {task.title}
          </Text>

          {!compact && task.description ? (
            <Text numberOfLines={2} style={styles.description}>
              {task.description}
            </Text>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#8E998F" />
      </View>

      <View style={styles.metaRow}>
        <TaskStatusBadge status={task.status} compact />

        <TaskPriorityBadge deadline={task.deadline} compact />
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={overdue ? "#FF8A8A" : "#8E998F"}
          />

          <Text
            numberOfLines={1}
            style={[styles.infoText, overdue && styles.overdueText]}
          >
            {formatDeadline(task.deadline)}
          </Text>
        </View>

        {task.deadline ? (
          <Text
            style={[styles.relativeDeadline, overdue && styles.overdueText]}
          >
            {formatDeadlineRelative(task.deadline)}
          </Text>
        ) : null}
      </View>

      {(task.subject || task.assignee) && !compact ? (
        <View style={styles.relationsRow}>
          {task.subject ? (
            <View style={styles.relationItem}>
              <Ionicons name="book-outline" size={14} color="#8E998F" />

              <Text numberOfLines={1} style={styles.relationText}>
                {task.subject.name}
              </Text>
            </View>
          ) : null}

          {task.assignee ? (
            <View style={styles.relationItem}>
              <Ionicons name="person-outline" size={14} color="#8E998F" />

              <Text numberOfLines={1} style={styles.relationText}>
                {task.assignee.full_name || task.assignee.email}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {priority === "critical" && task.status !== "completed" ? (
        <View style={styles.warningRow}>
          <Ionicons name="warning-outline" size={14} color="#FF8A8A" />

          <Text style={styles.warningText}>
            Tugas ini membutuhkan perhatian segera
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 14,
  },
  compactCard: {
    padding: 13,
    borderRadius: 15,
    gap: 11,
  },
  overdueCard: {
    borderColor: "rgba(255, 138, 138, 0.3)",
    backgroundColor: "rgba(255, 80, 80, 0.04)",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxCompleted: {
    backgroundColor: "#A8D8A8",
    borderColor: "#A8D8A8",
  },
  progressIndicator: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#A8D8A8",
  },
  titleContainer: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  completedTitle: {
    color: "#8E998F",
    textDecorationLine: "line-through",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: "#8E998F",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    paddingLeft: 35,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingLeft: 35,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#8E998F",
  },
  relativeDeadline: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E998F",
  },
  overdueText: {
    color: "#FF8A8A",
  },
  relationsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingLeft: 35,
  },
  relationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "48%",
  },
  relationText: {
    flexShrink: 1,
    fontSize: 12,
    color: "#8E998F",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255, 138, 138, 0.1)",
    marginLeft: 35,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#FF8A8A",
  },
});

