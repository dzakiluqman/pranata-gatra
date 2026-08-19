import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useWorkspace } from "@/features/workspace";

import { WorkspaceDetail } from "@/features/workspace/components/WorkspaceDetail";

export default function WorkspaceDetailScreen() {
  const router = useRouter();

  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  const { workspace, isLoading, error, removeWorkspace } =
    useWorkspace(workspaceId);

  const handleDelete = () => {
    Alert.alert(
      "Hapus Workspace",
      `Apakah kamu yakin ingin menghapus "${workspace?.name}"?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await removeWorkspace();

              router.replace("/(app)/workspace");
            } catch (err) {
              Alert.alert(
                "Gagal",
                err instanceof Error
                  ? err.message
                  : "Gagal menghapus workspace.",
              );
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: "/(app)/workspace/[workspaceId]/settings",
      params: {
        workspaceId,
      },
    });
  };

  const handleTasks = () => {
    router.push({
      pathname: "/(app)/workspace/[workspaceId]/tasks",
      params: {
        workspaceId,
      },
    });
  };

  const handleSubjects = () => {
    router.push({
      pathname: "/(app)/workspace/[workspaceId]/subjects",
      params: {
        workspaceId,
      },
    });
  };

  const handleMembers = () => {
    router.push(`/(app)/workspace/${workspaceId}/members`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Workspace</Text>

        <WorkspaceDetail
          workspace={workspace}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTasks={handleTasks}
          onSubjects={handleSubjects}
          onMembers={handleMembers}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    marginBottom: 20,
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
});
