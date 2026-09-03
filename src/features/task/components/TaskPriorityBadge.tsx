import { StyleSheet, Text, View } from "react-native";
import { getTaskPriorityInfo } from "../utils/taskPriority";

interface TaskPriorityBadgeProps {
  deadline: string | null;
  compact?: boolean;
}

const PRIORITY_CONFIG = {
  critical: {
    background: "#FEF2F2",
    text: "#DC2626",
  },
  high: {
    background: "#FFF7ED",
    text: "#EA580C",
  },
  medium: {
    background: "#FEFCE8",
    text: "#CA8A04",
  },
  low: {
    background: "#EFF6FF",
    text: "#2563EB",
  },
  none: {
    background: "#F3F4F6",
    text: "#6B7280",
  },
};

export function TaskPriorityBadge({
  deadline,
  compact = false,
}: TaskPriorityBadgeProps) {
  const info = getTaskPriorityInfo(deadline);
  const config = PRIORITY_CONFIG[info.priority];

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
      <Text
        style={[
          styles.text,
          {
            color: config.text,
          },
          compact && styles.compactText,
        ]}
      >
        {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  compactText: {
    fontSize: 11,
  },
});
