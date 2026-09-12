import { StyleSheet, Text, View } from "react-native";
import { getTaskPriorityInfo } from "../utils/taskPriority";

interface TaskPriorityBadgeProps {
  deadline: string | null;
  compact?: boolean;
}

const PRIORITY_CONFIG = {
  critical: {
    background: "rgba(239, 68, 68, 0.15)",
    text: "#F87171",
  },
  high: {
    background: "rgba(249, 115, 22, 0.15)",
    text: "#FB923C",
  },
  medium: {
    background: "rgba(234, 179, 8, 0.15)",
    text: "#FACC15",
  },
  low: {
    background: "rgba(168, 216, 168, 0.15)",
    text: "#A8D8A8",
  },
  none: {
    background: "rgba(255, 255, 255, 0.06)",
    text: "#8E998F",
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
