import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONTS } from '@/constants/theme';

import { getTaskPriorityInfo } from '../utils/taskPriority';

interface TaskPriorityBadgeProps {
  deadline: string | null;
  compact?: boolean;
}

const PRIORITY_CONFIG = {
  critical: {
    background: 'rgba(239, 68, 68, 0.15)',
    text: '#F87171',
  },
  high: {
    background: 'rgba(249, 115, 22, 0.15)',
    text: '#FB923C',
  },
  medium: {
    background: 'rgba(234, 179, 8, 0.15)',
    text: '#FACC15',
  },
  low: {
    background: 'rgba(179, 141, 70, 0.2)',
    text: '#FFE8B3',
  },
  none: {
    background: 'rgba(255, 255, 255, 0.06)',
    text: '#8E998F',
  },
};

export function TaskPriorityBadge({
  deadline,
  compact = false,
}: TaskPriorityBadgeProps) {
  const info = getTaskPriorityInfo(deadline);
  const config = PRIORITY_CONFIG[info.priority] || PRIORITY_CONFIG.none;

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
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  compactText: {
    fontSize: 10,
  },
});
