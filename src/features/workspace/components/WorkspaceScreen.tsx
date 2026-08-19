import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWorkspaces } from "../hooks/useWorkspaces";
import type { Workspace } from "../types/workspace.types";

type WorkspaceWithExpiry = Workspace & {
  expiresAt?: string | null;
};

const TAB_BAR_HEIGHT = 76;

export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const { workspaces = [], isLoading, error } = useWorkspaces();

  const filteredWorkspaces = useMemo(() => workspaces, [workspaces]);

  const { activeWorkspaces, expiredWorkspaces } = useMemo(() => {
    const currentTime = Date.now();
    const active: Workspace[] = [];
    const expired: Workspace[] = [];

    filteredWorkspaces.forEach((workspace) => {
      const expiresAt = (workspace as WorkspaceWithExpiry).expiresAt;

      if (expiresAt && new Date(expiresAt).getTime() <= currentTime) {
        expired.push(workspace);
      } else {
        active.push(workspace);
      }
    });

    return { activeWorkspaces: active, expiredWorkspaces: expired };
  }, [filteredWorkspaces]);

  const handleOpenWorkspace = (workspaceId: string) => {
    router.push(`/(app)/workspace/${workspaceId}`);
  };

  const handleCreateWorkspace = () => {
    router.push("/(app)/workspace/create");
  };

  const renderWorkspace = ({ item }: { item: Workspace }) => {
    return (
      <Pressable
        onPress={() => handleOpenWorkspace(item.id)}
        style={({ pressed }) => [
          styles.cardContainer,
          pressed && styles.pressed,
        ]}
      >
        <BlurView intensity={50} tint="dark" style={styles.workspaceCard}>
          {/* Efek kilau (glare) di dalam card agar terlihat seperti kaca */}
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0.12)",
              "rgba(255, 255, 255, 0)",
              "rgba(255, 255, 255, 0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={styles.cardInfo}>
                <Text numberOfLines={1} style={styles.workspaceName}>
                  {item.name}
                </Text>

                <Text numberOfLines={2} style={styles.workspaceDescription}>
                  {item.description || "Tidak ada deskripsi workspace."}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.workspaceType}>Personal Workspace</Text>
              <Ionicons name="arrow-forward" size={14} color="#D5DAD6" />
            </View>
          </View>
        </BlurView>
      </Pressable>
    );
  };

  const renderSection = (title: string, data: Workspace[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkspace}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5F7F3" />
          <Text style={styles.loadingText}>Memuat workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={34} color="#F5F7F3" />
          <Text style={styles.errorTitle}>Gagal memuat workspace</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Background Gradient menggantikan backgroundGlowTop & Bottom manual */}
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={[]}
            renderItem={null}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                {renderSection("Active Workspaces", activeWorkspaces)}
                {expiredWorkspaces.length > 0 &&
                  renderSection("Expired Workspaces", expiredWorkspaces)}
                {activeWorkspaces.length === 0 &&
                  expiredWorkspaces.length === 0 && (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIcon}>
                        <Ionicons
                          name="folder-open-outline"
                          size={31}
                          color="#DCE3DD"
                        />
                      </View>
                      <Text style={styles.emptyTitle}>
                        "Belum ada workspace"
                      </Text>
                      <Text style={styles.emptyDescription}>
                        "Buat workspace pertama untuk mulai berkolaborasi."
                      </Text>
                    </View>
                  )}
              </>
            }
          />

          {/* Floating Action Button dengan desain Glassmorphism */}
          <Pressable
            onPress={handleCreateWorkspace}
            style={({ pressed }) => [
              styles.fabContainer,
              {
                bottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 18,
              },
              pressed && styles.pressed,
            ]}
          >
            <BlurView intensity={60} tint="dark" style={styles.fabBlur}>
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </BlurView>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 11,
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F4F1",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },

  // -- AREA CARD DESIGN --
  cardContainer: {
    width: "48%",
    marginBottom: 12,
  },
  workspaceCard: {
    minHeight: 142,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.2,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    borderLeftColor: "rgba(255, 255, 255, 0.15)",
    borderRightColor: "rgba(255, 255, 255, 0.03)",
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardInfo: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F4F1",
  },
  workspaceDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: "#9EA89D",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  workspaceType: {
    flex: 1,
    fontSize: 10,
    color: "#AAB3AB",
  },

  // -- AREA FLOATING ACTION BUTTON --
  fabContainer: {
    position: "absolute",
    right: 0,
    zIndex: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  fabBlur: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.2,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
    borderLeftColor: "rgba(255, 255, 255, 0.2)",
    borderRightColor: "rgba(255, 255, 255, 0.05)",
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },

  // -- LAIN-LAIN --
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 65,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F4F1",
    textAlign: "center",
  },
  emptyDescription: {
    maxWidth: 300,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#7E8980",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#060A08",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#A3ADA5",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: "#060A08",
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#F1F4F1",
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#929B94",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
});
