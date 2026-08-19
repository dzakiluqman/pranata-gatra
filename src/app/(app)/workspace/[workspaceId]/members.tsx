import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, View } from "react-native";

import { WorkspaceMembers } from "@/features/workspace/components/WorkspaceMembers";

export default function WorkspaceMembersPage() {
  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  if (!workspaceId) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Members",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#F8FAFC",
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "800",
            color: "#111827",
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <WorkspaceMembers workspaceId={workspaceId} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
  },

  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
