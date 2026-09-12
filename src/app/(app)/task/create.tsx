import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSubjects } from "@/features/schedule/hooks/useSubjects";
import { TaskForm, useTask } from "@/features/task";
import {
  useCreateTask,
  useUpdateTask,
} from "@/features/task/hooks/useTaskMutations";
import { useWorkspaceMembers } from "@/features/workspace/hooks/useWorkspaceMembers";
import { useWorkspaces } from "@/features/workspace/hooks/useWorkspaces";

interface NormalizedMember {
  id: string;
  email: string;
  full_name: string | null;
  workspace_id?: string;
}

function normalizeMember(member: unknown): NormalizedMember | null {
  if (!member || typeof member !== "object") {
    return null;
  }

  const item = member as Record<string, unknown>;

  const profile =
    item.profile && typeof item.profile === "object"
      ? (item.profile as Record<string, unknown>)
      : null;

  const id =
    typeof item.user_id === "string"
      ? item.user_id
      : typeof profile?.id === "string"
        ? profile.id
        : typeof item.id === "string"
          ? item.id
          : null;

  if (!id) {
    return null;
  }

  const email =
    typeof profile?.email === "string"
      ? profile.email
      : typeof item.email === "string"
        ? item.email
        : "";

  const fullName =
    typeof profile?.full_name === "string"
      ? profile.full_name
      : typeof item.full_name === "string"
        ? item.full_name
        : null;

  const workspaceId =
    typeof item.workspace_id === "string" ? item.workspace_id : undefined;

  return {
    id,
    email,
    full_name: fullName,
    workspace_id: workspaceId,
  };
}

export default function CreateTaskScreen() {
  const insets = useSafeAreaInsets();
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
    workspaces,
    isLoading: isLoadingWorkspaces,
    error: workspaceError,
  } = useWorkspaces();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null,
  );

  const activeWorkspaceId =
    selectedWorkspaceId ??
    existingTask?.workspace_id ??
    params.workspaceId ??
    workspaces[0]?.id ??
    "";

  const subjectsQuery = useSubjects(activeWorkspaceId || undefined);
  const membersQuery = useWorkspaceMembers(activeWorkspaceId);

  const subjects = useMemo(() => {
    return (subjectsQuery.data ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      workspace_id: subject.workspace_id,
    }));
  }, [subjectsQuery.data]);

  const members = useMemo(() => {
    return membersQuery.members
      .map(normalizeMember)
      .filter((member): member is NormalizedMember => member !== null);
  }, [membersQuery.members]);

  const handleSubmit = async (values: {
    title: string;
    description: string;
    workspace_id: string;
    subject_id: string | null;
    assigned_to: string | null;
    deadline: string | null;
    status?: "pending" | "in_progress" | "completed";
  }) => {
    try {
      if (isEditing && taskId) {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          workspace_id: values.workspace_id,
          title: values.title,
          description: values.description,
          subject_id: values.subject_id,
          assigned_to: values.assigned_to,
          deadline: values.deadline,
          status: values.status,
        });

        router.back();
      } else {
        const task = await createTaskMutation.mutateAsync({
          workspace_id: values.workspace_id,
          subject_id: values.subject_id,
          assigned_to: values.assigned_to,
          title: values.title,
          description: values.description,
          deadline: values.deadline,
          status: values.status ?? "pending",
        });

        router.replace({
          pathname: "/task/[taskId]",
          params: {
            taskId: task.id,
          },
        });
      }
    } catch (error) {
      Alert.alert(
        isEditing ? "Gagal Memperbarui Tugas" : "Gagal Membuat Tugas",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memproses tugas.",
      );
    }
  };

  if (isLoadingWorkspaces || (isEditing && isLoadingTask)) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A8D8A8" />
          <Text style={styles.loadingText}>Menyiapkan form tugas...</Text>
        </View>
      </View>
    );
  }

  if (workspaceError) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF8A8A" />
          <Text style={styles.errorTitle}>Gagal memuat workspace</Text>
          <Text style={styles.errorText}>
            {workspaceError instanceof Error
              ? workspaceError.message
              : "Terjadi kesalahan saat mengambil workspace."}
          </Text>
        </View>
      </View>
    );
  }

  if (!workspaces.length) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <Ionicons name="folder-open-outline" size={40} color="#8E998F" />
          <Text style={styles.emptyTitle}>Belum ada workspace</Text>
          <Text style={styles.emptyText}>
            Buat workspace terlebih dahulu sebelum membuat tugas.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topNavigation}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#F5F7F3" />
        </Pressable>
        <Text style={styles.navTitle}>{isEditing ? "Edit Tugas" : "Buat Tugas"}</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              {isEditing ? "UPDATE TASK" : "NEW TASK"}
            </Text>
            <Text style={styles.title}>
              {isEditing ? "Edit Tugas" : "Buat Tugas Baru"}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? "Perbarui rincian tugas dan penugasan member."
                : "Tambahkan tugas baru dan atur jadwal penyelesaian."}
            </Text>
          </View>

          <TaskForm
            key={existingTask?.id ?? "new"}
            task={existingTask}
            workspaces={workspaces.map((workspace) => ({
              id: workspace.id,
              name: workspace.name,
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  topNavigation: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  spacer: {
    width: 38,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#8DB88D",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#8E998F",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#8E998F",
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FF8A8A",
  },
  errorText: {
    fontSize: 13,
    color: "#8E998F",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  emptyText: {
    fontSize: 13,
    color: "#8E998F",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
