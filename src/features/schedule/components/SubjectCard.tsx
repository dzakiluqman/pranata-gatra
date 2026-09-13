import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

import type { Subject } from '../types/subject.types';

interface Props {
  subject: Subject;
  onPress?: () => void;
}

export function SubjectCard({ subject, onPress }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={18} color={COLORS.goldText} />
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {subject.name}
          </Text>

          <View style={styles.meta}>
            {subject.lecturer ? (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {subject.lecturer}
                </Text>
              </View>
            ) : null}

            {subject.room ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {subject.room}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    marginBottom: 10,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 160,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
