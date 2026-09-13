import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

import type { WorkspaceMember } from '../types/workspaceMember.types';

type MemberCardProps = {
  member: WorkspaceMember;
  onRemove?: () => void;
};

export function MemberCard({ member, onRemove }: MemberCardProps) {
  const name =
    member.profile?.full_name || member.profile?.email || 'Unknown User';

  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>

        <Text numberOfLines={1} style={styles.email}>
          {member.profile?.email}
        </Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{member.role}</Text>
        </View>
      </View>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.goldText,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textLight,
  },
  email: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: COLORS.goldSoft,
  },
  roleText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: COLORS.secondaryLightGold,
    textTransform: 'uppercase',
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 83, 83, 0.1)',
  },
  pressed: {
    opacity: 0.6,
  },
});
