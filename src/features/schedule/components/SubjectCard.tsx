import { Ionicons } from "@expo/vector-icons";

import { Pressable, StyleSheet, Text, View } from "react-native";

import GlassCard from "../../../components/ui/GlassCard";

import type { Subject } from "../types/subject.types";

interface Props {
  subject: Subject;
  onPress?: () => void;
}

export function SubjectCard({ subject, onPress }: Props) {
  return (
    <GlassCard style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="book-outline" size={18} color="#A8D8A8" />
          </View>

          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1}>
              {subject.name}
            </Text>

            <View style={styles.meta}>
              {subject.lecturer ? (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={13} color="#7F867F" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {subject.lecturer}
                  </Text>
                </View>
              ) : null}

              {subject.room ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color="#7F867F" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {subject.room}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#555C55" />
        </View>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
  },

  pressed: {
    opacity: 0.7,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(168, 216, 168, 0.12)",
  },

  content: {
    flex: 1,
    gap: 4,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 160,
  },

  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: "#7F867F",
  },
});
