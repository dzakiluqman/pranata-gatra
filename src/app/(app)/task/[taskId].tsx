import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import {
  formatDeadlineRelative,
  getTaskPriorityInfo,
  isTaskOverdue,
  TaskPriorityBadge,
  TaskStatusBadge,
  useCompleteTask,
  useDeleteTask,
  useReopenTask,
  useTask,
} from '@/features/task';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  const taskQuery = useTask(taskId);
  const completeMutation = useCompleteTask();
  const reopenMutation = useReopenTask();
  const deleteMutation = useDeleteTask();

  const [isDeleting, setIsDeleting] = useState(false);

  const task = taskQuery.data;

  const handleComplete = async () => {
    if (!task) return;
    try {
      await completeMutation.mutateAsync(task.id);
    } catch (error) {
      Alert.alert('Gagal', error instanceof Error ? error.message : 'Gagal menyelesaikan tugas.');
    }
  };

  const handleReopen = async () => {
    if (!task) return;
    try {
      await reopenMutation.mutateAsync(task.id);
    } catch (error) {
      Alert.alert('Gagal', error instanceof Error ? error.message : 'Gagal membuka kembali tugas.');
    }
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert('Hapus Tugas', `Apakah kamu yakin ingin menghapus "${task.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            await deleteMutation.mutateAsync(task.id);
            router.back();
          } catch (error) {
            Alert.alert('Gagal', error instanceof Error ? error.message : 'Gagal menghapus tugas.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!task) return;
    router.push({
      pathname: '/(app)/task/create',
      params: { taskId: task.id, workspaceId: task.workspace_id },
    } as any);
  };

  const isProcessing =
    completeMutation.isPending ||
    reopenMutation.isPending ||
    deleteMutation.isPending ||
    isDeleting;

  const priorityInfo = getTaskPriorityInfo(task?.deadline ?? null);
  const overdue = Boolean(
    task && task.status !== 'completed' && isTaskOverdue(task.deadline),
  );

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="tasks" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {taskQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat detail tugas...</Text>
          </View>
        ) : taskQuery.error || !task ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
            <Text style={styles.errorTitle}>Tugas tidak ditemukan</Text>
            <Pressable style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryText}>Kembali</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Top Bar: Back Chevron + Action Buttons */}
            <View style={styles.navRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.back()}
                hitSlop={10}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.goldText} />
              </Pressable>

              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionIconBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleEdit}
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.goldText} />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionIconBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleDelete}
                  disabled={isProcessing}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </Pressable>
              </View>
            </View>

            {/* Task Hero */}
            <View style={styles.heroCard}>
              <View style={styles.badgeRow}>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge deadline={task.deadline} />
              </View>

              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>
                {task.description || 'Tidak ada deskripsi untuk tugas ini.'}
              </Text>
            </View>

            {/* Detail Rows Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detail Tugas</Text>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Workspace</Text>
                  <Text style={styles.detailValue}>
                    {task.workspace?.name ?? 'Tidak diketahui'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subject</Text>
                  <Text style={styles.detailValue}>
                    {task.subject?.name ?? 'Tidak terkait'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ditugaskan kepada</Text>
                  <Text style={styles.detailValue}>
                    {task.assignee?.full_name || task.assignee?.email || 'Belum ditugaskan'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prioritas</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: priorityInfo.priority === 'critical' ? COLORS.danger : COLORS.goldText },
                    ]}
                  >
                    {priorityInfo.label}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Deadline</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      overdue && { color: COLORS.danger },
                    ]}
                  >
                    {task.deadline
                      ? formatDeadlineRelative(task.deadline)
                      : 'Tidak ada deadline'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Complete / Reopen Action Button */}
            <View style={styles.bottomAction}>
              {task.status === 'completed' ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.reopenButton,
                    pressed && styles.pressed,
                    isProcessing && styles.disabled,
                  ]}
                  onPress={handleReopen}
                  disabled={isProcessing}
                >
                  <Text style={styles.reopenButtonText}>
                    {isProcessing ? 'Memproses...' : 'Buka Kembali Tugas'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.completeButtonWrapper,
                    pressed && styles.pressed,
                    isProcessing && styles.disabled,
                  ]}
                  onPress={handleComplete}
                  disabled={isProcessing}
                >
                  <LinearGradient
                    colors={COLORS.goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.completeButtonGradient}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color={COLORS.textDark} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textDark} />
                        <Text style={styles.completeButtonText}>Tandai Selesai</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  blackSheet: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: -8,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 20,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  taskTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: 8,
  },
  taskDescription: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.goldText,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textLight,
  },
  bottomAction: {
    marginTop: 8,
  },
  completeButtonWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
  },
  completeButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textDark,
  },
  reopenButton: {
    height: 52,
    borderRadius: 28,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reopenButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.goldText,
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
    marginTop: 10,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.danger,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  retryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.goldText,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
});
