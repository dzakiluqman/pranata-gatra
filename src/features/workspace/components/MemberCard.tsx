import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { WorkspaceMember } from "../types/workspaceMember.types";

type MemberCardProps = {
  member: WorkspaceMember;
  onRemove?: () => void;
};

export function MemberCard({ member, onRemove }: MemberCardProps) {
  const name =
    member.profile?.full_name || member.profile?.email || "Unknown User";

  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>

        <Text numberOfLines={1} style={styles.email}>
          {member.profile?.email}
        </Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{member.role}</Text>
        </View>
      </View>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={19} color="#FF8A8A" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  avatar: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(168, 216, 168, 0.12)",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#A8D8A8",
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  email: {
    marginTop: 2,
    fontSize: 12,
    color: "#8E998F",
  },

  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
    borderRadius: 7,
    backgroundColor: "rgba(168, 216, 168, 0.12)",
  },

  roleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A8D8A8",
    textTransform: "uppercase",
  },

  removeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderRadius: 11,
    backgroundColor: "rgba(255, 138, 138, 0.12)",
  },

  pressed: {
    opacity: 0.6,
  },
});

