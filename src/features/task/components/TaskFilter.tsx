import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

import type { TaskFilters, TaskStatus } from '../types/task.types';

interface TaskFilterProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

const STATUS_OPTIONS: {
  value: TaskStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'Dikerjakan' },
  { value: 'completed', label: 'Selesai' },
];

const DEADLINE_OPTIONS: {
  value: NonNullable<TaskFilters['deadline']>;
  label: string;
}[] = [
  { value: 'all', label: 'Semua' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'upcoming', label: 'Mendatang' },
  { value: 'overdue', label: 'Terlambat' },
  { value: 'none', label: 'Tanpa Deadline' },
];

export function TaskFilter({ filters, onChange }: TaskFilterProps) {
  const handleStatusChange = (status: TaskStatus | 'all') => {
    onChange({ ...filters, status });
  };

  const handleDeadlineChange = (deadline: NonNullable<TaskFilters['deadline']>) => {
    onChange({ ...filters, deadline });
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
          const active = (filters.status ?? 'all') === option.value;
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
          const active = (filters.deadline ?? 'all') === option.value;
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
    marginVertical: 12,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.goldText,
  },
  deadlineLabel: {
    marginTop: 6,
  },
  scrollContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  activeChip: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  chipText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activeChipText: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
});
