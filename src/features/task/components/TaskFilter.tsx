import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { TaskFilters, TaskStatus } from "../types/task.types";

interface TaskFilterProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

const STATUS_OPTIONS: {
  value: TaskStatus | "all";
  label: string;
}[] = [
  {
    value: "all",
    label: "Semua",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "in_progress",
    label: "Dikerjakan",
  },
  {
    value: "completed",
    label: "Selesai",
  },
];

const DEADLINE_OPTIONS: {
  value: NonNullable<TaskFilters["deadline"]>;
  label: string;
}[] = [
  {
    value: "all",
    label: "Semua Deadline",
  },
  {
    value: "overdue",
    label: "Terlambat",
  },
  {
    value: "today",
    label: "Hari Ini",
  },
  {
    value: "upcoming",
    label: "Mendatang",
  },
  {
    value: "none",
    label: "Tanpa Deadline",
  },
];

export function TaskFilter({ filters, onChange }: TaskFilterProps) {
  const handleStatusChange = (status: TaskStatus | "all") => {
    onChange({
      ...filters,
      status,
    });
  };

  const handleDeadlineChange = (
    deadline: NonNullable<TaskFilters["deadline"]>,
  ) => {
    onChange({
      ...filters,
      deadline,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Status</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STATUS_OPTIONS.map((option) => {
          const active = (filters.status ?? "all") === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => handleStatusChange(option.value)}
              style={[styles.chip, active && styles.activeChip]}
            >
              <Text style={[styles.chipText, active && styles.activeChipText]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.label, styles.deadlineLabel]}>Deadline</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DEADLINE_OPTIONS.map((option) => {
          const active = (filters.deadline ?? "all") === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => handleDeadlineChange(option.value)}
              style={[styles.chip, active && styles.activeChip]}
            >
              <Text style={[styles.chipText, active && styles.activeChipText]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DCE3DC",
  },
  deadlineLabel: {
    marginTop: 8,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
  },
  activeChip: {
    backgroundColor: "#A8D8A8",
    borderColor: "#A8D8A8",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E998F",
  },
  activeChipText: {
    color: "#0A0E0A",
    fontWeight: "700",
  },
});

