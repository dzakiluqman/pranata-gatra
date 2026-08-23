import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ScheduleCard from "./ScheduleCard";

import type { Schedule } from "../types/schedule.types";

interface Props {
  schedules: Schedule[];
  loading?: boolean;
  emptyText?: string;
  onSchedulePress?: (schedule: Schedule) => void;
}

export default function ScheduleList({
  schedules,
  loading,
  emptyText = "Belum ada schedule.",
  onSchedulePress,
}: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#9A82B8" />
      </View>
    );
  }

  if (schedules.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Belum ada schedule</Text>

        <Text style={styles.emptyText}>
          Tambahkan schedule pada subject untuk mulai mengatur jadwal.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <ScheduleCard schedule={item} onPress={() => onSchedulePress?.(item)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 24,
  },

  center: {
    paddingVertical: 40,
    alignItems: "center",
  },

  empty: {
    padding: 28,

    borderRadius: 20,

    backgroundColor: "#151A15",

    alignItems: "center",
  },

  emptyTitle: {
    color: "#F5F7F3",

    fontSize: 16,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 7,

    color: "#8A9089",

    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
