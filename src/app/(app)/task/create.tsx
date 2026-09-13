import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useSubjects } from '@/features/schedule/hooks/useSubjects';
import { TaskForm, useTask } from '@/features/task';
import {
  useCreateTask,
  useUpdateTask,
} from '@/features/task/hooks/useTaskMutations';
import { useWorkspaceMembers } from '@/features/workspace/hooks/useWorkspaceMembers';
import { useWorkspaces } from '@/features/workspace/hooks/useWorkspaces';

interface NormalizedMember {
  id: string;
  email: string;
  full_name: string | null;
  workspace_id?: string;
}

function normalizeMember(member: unknown): NormalizedMember | null {
  if (!member || typeof member !== 'object') {
    return null;
  }

  const item = member as Record<string, unknown>;
  const profile =
    item.profile && typeof item.profile === 'object'
      ? (item.profile as Record<string, unknown>)
      : null;

  const id =
    typeof item.user_id === 'string'
      ? item.user_id
      : typeof profile?.id === 'string'
        ? profile.id
        : typeof item.id === 'string'
          ? item.id
          : null;

  if (!id) return null;

  const email =
    typeof profile?.email === 'string'
      ? profile.email
      : typeof item.email === 'string'
        ? item.email
        : '';

  const fullName =
    typeof profile?.full_name === 'string'
      ? profile.full_name
      : typeof item.full_name === 'string'
        ? item.full_name
        : null;

  const workspaceId =
    typeof item.workspace_id === 'string' ? item.workspace_id : undefined;

  return {
    id,
    email,
    full_name: fullName,
    workspace_id: workspaceId,
  };
}

export default function CreateTaskScreen() {
  const params = useLocalSearchParams<{
    workspaceId?: string;
    subjectId?: string;
    taskId?: string;
  }>();

  const taskId = Array.isArray(params.taskId)
    ? params.taskId[0]
    : params.taskId;

  const isEditing = Boolean(taskId);
  const { data: existingTask, isLoading: isLoadingTask } = useTask(taskId);

  const {
    workspaces = [],
    isLoading: isLoadingWorkspaces,
  } = useWorkspaces();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<
    string | undefined
  >(undefined);

  const activeWorkspaceId = useMemo(() => {
    return (
      selectedWorkspaceId ||
      existingTask?.workspace_id ||
      (Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : params.workspaceId) ||
      workspaces[0]?.id
    );
  }, [
    selectedWorkspaceId,
    existingTask?.workspace_id,
    params.workspaceId,
    workspaces,
  ]);

  const { data: subjects = [] } = useSubjects(activeWorkspaceId);

  const { members: rawMembers = [] } = useWorkspaceMembers(activeWorkspaceId);

  const members = useMemo(() => {
    return rawMembers
      .map(normalizeMember)
      .filter((m): m is NormalizedMember => Boolean(m));
  }, [rawMembers]);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const handleSubmit = async (values: any) => {
    try {
      if (isEditing && taskId) {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          ...values,
        });
        Alert.alert('Sukses', 'Tugas berhasil diperbarui.');
      } else {
        await createTaskMutation.mutateAsync(values);
        Alert.alert('Sukses', 'Tugas berhasil dibuat.');
      }
      router.back();
    } catch (err) {
      Alert.alert(
        'Gagal',
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.',
      );
    }
  };

  const isLoading =
    isLoadingWorkspaces || (isEditing && isLoadingTask);

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="tasks" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat form tugas...</Text>
          </View>
        ) : !workspaces.length ? (
          <View style={styles.center}>
            <Ionicons name="folder-open-outline" size={40} color={COLORS.primaryGold} />
            <Text style={styles.emptyTitle}>Belum ada workspace</Text>
            <Text style={styles.emptySubtitle}>
              Buat workspace terlebih dahulu sebelum membuat tugas.
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Back chevron */}
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

              <Text style={styles.title}>
                {isEditing ? 'Edit Tugas' : 'Buat Tugas Baru'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditing
                  ? 'Perbarui rincian tugas dan penugasan member.'
                  : 'Tambahkan tugas baru dan atur jadwal penyelesaian.'}
              </Text>

              <TaskForm
                key={existingTask?.id ?? 'new'}
                task={existingTask}
                workspaces={workspaces.map((w) => ({
                  id: w.id,
                  name: w.name,
                }))}
                subjects={subjects}
                members={members}
                defaultWorkspaceId={activeWorkspaceId}
                defaultSubjectId={existingTask?.subject_id ?? params.subjectId ?? null}
                defaultAssignedTo={existingTask?.assigned_to ?? null}
                onWorkspaceChange={(newWsId) => setSelectedWorkspaceId(newWsId)}
                isSubmitting={
                  createTaskMutation.isPending || updateTaskMutation.isPending
                }
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
              />
            </ScrollView>
          </KeyboardAvoidingView>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.goldText,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 20,
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
  emptyTitle: {
    marginTop: 12,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textLight,
  },
  emptySubtitle: {
    marginTop: 4,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
