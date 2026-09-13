import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONTS } from '@/constants/theme';

import type { TaskStatus } from '../types/task.types';

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
    label: 'Pending',
    background: 'rgba(245, 158, 11, 0.15)',
    text: '#FBBF24',
  },
  in_progress: {
    label: 'In Progress',
    background: 'rgba(179, 141, 70, 0.2)',
    text: '#FFE8B3',
  },
  completed: {
    label: 'Completed',
    background: 'rgba(74, 222, 128, 0.15)',
    text: '#4ADE80',
  },
};

export function TaskStatusBadge({
  status,
  compact = false,
}: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

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
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  compactText: {
    fontSize: 10,
  },
});
