import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWorkspace } from "@/features/workspace";
import { WorkspaceDetail } from "@/features/workspace/components/WorkspaceDetail";

export default function WorkspaceDetailScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#F5F7F3" />
        </Pressable>
        <Text style={styles.headerTitle}>Workspace</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  spacer: {
    width: 40,
  },

  content: {
    padding: 20,
  },

  pressed: {
    opacity: 0.7,
  },
});

