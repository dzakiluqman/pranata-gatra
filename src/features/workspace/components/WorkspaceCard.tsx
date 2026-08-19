import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Workspace } from "../types/workspace.types";

type WorkspaceCardProps = {
  workspace: Workspace;
  onPress: () => void;
};

export function WorkspaceCard({ workspace, onPress }: WorkspaceCardProps) {
  const initial = workspace.name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.glow} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{initial}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={13} color="#DDE5DD" />
          </View>
        </View>

        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>
            {workspace.name}
          </Text>

          <Text numberOfLines={2} style={styles.description}>
            {workspace.description || "Tidak ada deskripsi workspace."}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.workspaceType}>Personal Workspace</Text>

          <Ionicons name="arrow-forward" size={13} color="#D8DED8" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 142,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(42, 51, 44, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(205, 218, 207, 0.34)",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  glow: {
    position: "absolute",
    top: -30,
    right: -25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.025)",
  },

  content: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  iconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E8EEE8",
  },

  arrowContainer: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },

  info: {
    marginTop: 8,
  },

  name: {
    fontSize: 15,
    fontWeight: "500",
    color: "#F3F6F3",
  },

  description: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 14,
    color: "#89918A",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  workspaceType: {
    flex: 1,
    fontSize: 10,
    color: "#D0D6D0",
  },
});
