import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS } from "@/constants/theme";

import type { Workspace } from "../types/workspace.types";

type WorkspaceCardProps = {
  workspace: Workspace;
  onPress: () => void;
};

export function WorkspaceCard({ workspace, onPress }: WorkspaceCardProps) {
  const isCollaborative = workspace.description
    ?.toLowerCase()
    .includes("collaborative");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <Text numberOfLines={1} style={styles.name}>
          {workspace.name}
        </Text>

        <Text numberOfLines={2} style={styles.description}>
          {workspace.description || "Penjadwalan tugas dan kelas."}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.workspaceType}>
          {isCollaborative ? "Collaborative Workspace" : "Personal Workspace"}
        </Text>

        <Ionicons name="arrow-forward" size={13} color="#8E8E93" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 124,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
    justifyContent: "space-between",
  },
  pressed: {
    opacity: 0.75,
  },
  cardTop: {
    marginBottom: 12,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  workspaceType: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    flex: 1,
  },
});

