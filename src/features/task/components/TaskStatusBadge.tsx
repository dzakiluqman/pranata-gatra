import { StyleSheet, Text, View } from "react-native";
import type { TaskStatus } from "../types/task.types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    background: string;
    text: string;
  }
> = {
  pending: {
    label: "Pending",
    background: "rgba(245, 158, 11, 0.15)",
    text: "#FBBF24",
  },
  in_progress: {
    label: "In Progress",
    background: "rgba(168, 216, 168, 0.15)",
    text: "#A8D8A8",
  },
  completed: {
    label: "Completed",
    background: "rgba(74, 222, 128, 0.15)",
    text: "#4ADE80",
  },
};


export function TaskStatusBadge({
  status,
  compact = false,
}: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.background,
        },
        compact && styles.compact,
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: config.text,
          },
        ]}
      />

      <Text
        style={[
          styles.text,
          {
            color: config.text,
          },
          compact && styles.compactText,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  compactText: {
    fontSize: 11,
  },
});
