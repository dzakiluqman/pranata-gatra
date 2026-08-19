import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { WorkspaceCard } from "../../features/workspace/components/WorkspaceCard";
import { getWorkspaces } from "../../features/workspace/services/workspaceService";

import type { Workspace } from "../../features/workspace/types/workspace.types";

export default function WorkspaceScreen() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      const data = await getWorkspaces();

      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat workspace.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const activeWorkspaces = useMemo(() => {
    return workspaces;
  }, [workspaces]);

  const expiredWorkspaces = useMemo<Workspace[]>(() => {
    return [];
  }, []);

  const firstName = useMemo(() => {
    const workspaceOwner = workspaces[0]?.ownerId;

    if (!workspaceOwner) {
      return "First Name";
    }

    return "First Name";
  }, [workspaces]);

  const openWorkspace = (workspace: Workspace) => {
    router.push(`/(app)/workspace/${workspace.id}`);
  };

  const handleCreateWorkspace = () => {
    router.push("/(app)/workspace/create");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadWorkspaces(true)}
              tintColor="#DDE5DD"
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={25} color="#E6ECE6" />
              </View>

              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  Welcome, <Text style={styles.welcomeName}>{firstName}</Text>
                </Text>

                <Text style={styles.welcomeSubtitle}>
                  Let’s Get Things Done!
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerIconButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="#F1F4F1"
                />

                <View style={styles.notificationDot} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.headerIconButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="menu-outline" size={34} color="#F1F4F1" />
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#DDE5DD" />

              <Text style={styles.loadingText}>Memuat workspace...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color="#E57B7B"
                />
              </View>

              <Text style={styles.errorTitle}>Gagal memuat workspace</Text>

              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                onPress={() => loadWorkspaces()}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="refresh-outline" size={17} color="#172018" />

                <Text style={styles.retryText}>Coba Lagi</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Workspaces</Text>

                  <Text style={styles.sectionCount}>
                    {activeWorkspaces.length}
                  </Text>
                </View>

                {activeWorkspaces.length > 0 ? (
                  <View style={styles.workspaceGrid}>
                    {activeWorkspaces.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        onPress={() => openWorkspace(workspace)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                      <Ionicons
                        name="folder-open-outline"
                        size={28}
                        color="#AAB4AA"
                      />
                    </View>

                    <Text style={styles.emptyTitle}>Belum ada workspace</Text>

                    <Text style={styles.emptyText}>
                      Buat workspace pertama kamu untuk mulai mengelola
                      aktivitas.
                    </Text>
                  </View>
                )}
              </View>

              {expiredWorkspaces.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Expired Workspaces</Text>

                    <Text style={styles.sectionCount}>
                      {expiredWorkspaces.length}
                    </Text>
                  </View>

                  <View style={styles.workspaceGrid}>
                    {expiredWorkspaces.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        onPress={() => openWorkspace(workspace)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>

        <Pressable
          onPress={handleCreateWorkspace}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Ionicons name="add" size={34} color="#E0E7E0" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A100C",
  },

  container: {
    flex: 1,
  },

  backgroundGlowTop: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(55, 84, 61, 0.12)",
  },

  backgroundGlowBottom: {
    position: "absolute",
    right: -130,
    bottom: 50,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(43, 75, 49, 0.08)",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
  },

  profileSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#55466E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  welcomeContainer: {
    marginLeft: 13,
  },

  welcomeText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#DCE3DC",
  },

  welcomeName: {
    fontWeight: "700",
    color: "#F3F6F3",
  },

  welcomeSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: "#858D86",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerIconButton: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D96363",
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#F1F4F1",
  },

  sectionCount: {
    minWidth: 22,
    height: 22,
    marginLeft: 8,
    paddingHorizontal: 6,
    borderRadius: 11,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 10,
    fontWeight: "700",
    color: "#DCE5DC",
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  workspaceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: "#858D86",
  },

  errorContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(133,43,43,0.14)",
    borderWidth: 1,
    borderColor: "rgba(229,123,123,0.25)",
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#F1F4F1",
    textAlign: "center",
  },

  errorText: {
    maxWidth: 300,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: "#858D86",
    textAlign: "center",
  },

  retryButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    marginTop: 18,
    borderRadius: 15,
    backgroundColor: "#E4EBE4",
  },

  retryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#172018",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
    paddingHorizontal: 25,
    borderRadius: 24,
    backgroundColor: "rgba(42,51,44,0.42)",
    borderWidth: 1,
    borderColor: "rgba(205,218,207,0.2)",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#E8EEE8",
  },

  emptyText: {
    maxWidth: 280,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "#858D86",
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 26,
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 35,
    backgroundColor: "rgba(29,46,32,0.96)",
    borderWidth: 1,
    borderColor: "rgba(210,220,210,0.28)",
  },

  fabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  pressed: {
    opacity: 0.7,
  },

  bottomSpace: {
    height: 90,
  },
});
