import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSubjects } from "@/features/schedule/hooks/useSubjects";
import { TaskForm } from "@/features/task";
import { useCreateTask } from "@/features/task/hooks/useTaskMutations";
import { useWorkspaceMembers } from "@/features/workspace/hooks/useWorkspaceMembers";
import { useWorkspaces } from "@/features/workspace/hooks/useWorkspaces";

interface NormalizedMember {
  id: string;
  email: string;
  full_name: string | null;
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

  return {
    id,
    email,
    full_name: fullName,
  };
}

export default function CreateTaskScreen() {
  const params = useLocalSearchParams<{
    workspaceId?: string;
    subjectId?: string;
  }>();

  const {
    workspaces,
    isLoading: isLoadingWorkspaces,
    error: workspaceError,
  } = useWorkspaces();

  const createTaskMutation = useCreateTask();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    params.workspaceId ?? "",
  );

  useEffect(() => {
    if (selectedWorkspaceId || !workspaces.length) {
      return;
    }

    setSelectedWorkspaceId(workspaces[0].id);
  }, [selectedWorkspaceId, workspaces]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId),
    [workspaces, selectedWorkspaceId],
  );

  const subjectsQuery = useSubjects(selectedWorkspaceId || undefined);

  const membersQuery = useWorkspaceMembers(selectedWorkspaceId);

  const subjects = subjectsQuery.data ?? [];

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
    } catch (error) {
      Alert.alert(
        "Gagal Membuat Tugas",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat tugas.",
      );
    }
  };

  if (isLoadingWorkspaces) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1C5BFF" />
          <Text style={styles.loadingText}>Menyiapkan form tugas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (workspaceError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Gagal memuat workspace</Text>

          <Text style={styles.errorText}>
            {workspaceError instanceof Error
              ? workspaceError.message
              : "Terjadi kesalahan saat mengambil workspace."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workspaces.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Belum ada workspace</Text>

          <Text style={styles.emptyText}>
            Buat workspace terlebih dahulu sebelum membuat tugas.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedWorkspace) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1C5BFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Buat Tugas</Text>

            <Text style={styles.subtitle}>
              Tambahkan tugas baru ke workspace kamu.
            </Text>
          </View>

          <TaskForm
            workspaces={workspaces.map((workspace) => ({
              id: workspace.id,
              name: workspace.name,
            }))}
            subjects={subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
            }))}
            members={members}
            defaultWorkspaceId={params.workspaceId ?? selectedWorkspace.id}
            defaultSubjectId={params.subjectId ?? null}
            isSubmitting={createTaskMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#6B7280",
  },
});
