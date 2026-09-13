import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

import type { Workspace } from '../types/workspace.types';

type WorkspaceDetailProps = {
  workspace: Workspace | null;
  isLoading: boolean;
  error: Error | null;
  onEdit: () => void;
  onDelete: () => void;
  onSubjects: () => void;
  onTasks: () => void;
  onMembers: () => void;
};

export function WorkspaceDetail({
  workspace,
  isLoading,
  error,
  onEdit,
  onDelete,
  onSubjects,
  onTasks,
  onMembers,
}: WorkspaceDetailProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primaryGold} />
        <Text style={styles.loadingText}>Memuat workspace...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Gagal memuat workspace</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  if (!workspace) {
    return (
      <View style={styles.center}>
        <Ionicons name="folder-open-outline" size={42} color={COLORS.goldText} />
        <Text style={styles.errorTitle}>Workspace tidak ditemukan</Text>
      </View>
    );
  }

  const isCollaborative = workspace.description?.toLowerCase().includes('collaborative');

  return (
    <View style={styles.container}>
      {/* Workspace Header Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <LinearGradient
            colors={COLORS.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>
              {workspace.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>

          <View style={styles.heroTextContainer}>
            <Text style={styles.workspaceName}>{workspace.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {isCollaborative ? 'Collaborative' : 'Personal'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.workspaceDescription}>
          {workspace.description || 'Tidak ada deskripsi workspace.'}
        </Text>
      </View>

      {/* Navigation Sections */}
      <View style={styles.navSection}>
        <Text style={styles.sectionTitle}>Kelola Workspace</Text>

        {/* Tasks */}
        <Pressable
          onPress={onTasks}
          style={({ pressed }) => [
            styles.navCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="checkbox-outline" size={20} color={COLORS.goldText} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Tasks</Text>
            <Text style={styles.navSubtitle}>Kelola semua tugas dalam workspace</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </Pressable>

        {/* Subjects / Mata Kuliah */}
        <Pressable
          onPress={onSubjects}
          style={({ pressed }) => [
            styles.navCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="book-outline" size={20} color={COLORS.goldText} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Subjects</Text>
            <Text style={styles.navSubtitle}>Daftar mata kuliah dan jadwal kelas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </Pressable>

        {/* Members */}
        <Pressable
          onPress={onMembers}
          style={({ pressed }) => [
            styles.navCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.navIconBox}>
            <Ionicons name="people-outline" size={20} color={COLORS.goldText} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Members</Text>
            <Text style={styles.navSubtitle}>Anggota tim dan kolaborator</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </Pressable>
      </View>

      {/* Action Buttons: Edit / Delete */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.goldText} />
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          <Text style={styles.deleteButtonText}>Hapus</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 20,
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textDark,
  },
  heroTextContainer: {
    flex: 1,
  },
  workspaceName: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: COLORS.goldSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: COLORS.secondaryLightGold,
  },
  workspaceDescription: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  navSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.goldText,
    marginBottom: 14,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
    marginBottom: 10,
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  navSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },
  editButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.goldText,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(229, 83, 83, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 83, 83, 0.25)',
  },
  deleteButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.danger,
  },
  center: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  errorTitle: {
    marginTop: 12,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.danger,
  },
  errorText: {
    marginTop: 4,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
