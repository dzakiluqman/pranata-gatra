import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

import type { TaskWithRelations } from '../types/task.types';
import {
  formatDeadlineRelative,
  getTaskPriority,
  isTaskOverdue,
} from '../utils/taskPriority';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskCardProps {
  task: TaskWithRelations;
  onPress?: () => void;
  onStatusChange?: () => void;
  compact?: boolean;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return 'Tanpa deadline';
  }

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return 'Deadline tidak valid';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function TaskCard({
  task,
  onPress,
  onStatusChange,
  compact = false,
}: TaskCardProps) {
  const overdue = task.status !== 'completed' && isTaskOverdue(task.deadline);
  const priority = getTaskPriority(task.deadline);

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
          onPress={onStatusChange}
          disabled={!onStatusChange}
          style={[
            styles.checkbox,
            task.status === 'completed' && styles.checkboxCompleted,
          ]}
          hitSlop={8}
        >
          {task.status === 'completed' ? (
            <Ionicons name="checkmark" size={14} color={COLORS.textDark} />
          ) : task.status === 'in_progress' ? (
            <View style={styles.progressDot} />
          ) : null}
        </Pressable>

        <View style={styles.titleContainer}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              task.status === 'completed' && styles.completedTitle,
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

        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.badges}>
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={priority} />
        </View>

        <View style={styles.deadlineInfo}>
          <Ionicons
            name="time-outline"
            size={13}
            color={overdue ? COLORS.danger : COLORS.textMuted}
          />
          <Text
            style={[
              styles.deadlineText,
              overdue && styles.overdueText,
            ]}
          >
            {formatDeadline(task.deadline)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
    marginBottom: 10,
  },
  compactCard: {
    padding: 12,
  },
  overdueCard: {
    borderColor: 'rgba(229, 83, 83, 0.35)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryGold,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  description: {
    marginTop: 4,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  overdueText: {
    color: COLORS.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
