import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WorkspaceMembers } from "@/features/workspace/components/WorkspaceMembers";

export default function WorkspaceMembersPage() {
  const insets = useSafeAreaInsets();
  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  if (!workspaceId) {
    return null;
  }

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Members",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#060A08",
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "800",
            color: "#F5F7F3",
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#F5F7F3" />
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <WorkspaceMembers workspaceId={workspaceId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060A08",
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

