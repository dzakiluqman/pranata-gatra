import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import ScheduleForm from "../../../../../features/schedule/components/ScheduleForm";

export default function ScheduleScreen() {
  const params = useLocalSearchParams<{
    subjectId: string;
    workspaceId: string;
    scheduleId?: string;
  }>();

  const subjectId = Array.isArray(params.subjectId)
    ? params.subjectId[0]
    : params.subjectId;

  const workspaceId = Array.isArray(params.workspaceId)
    ? params.workspaceId[0]
    : params.workspaceId;

  const scheduleId = Array.isArray(params.scheduleId)
    ? params.scheduleId[0]
    : params.scheduleId;

  if (!subjectId || !workspaceId) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
          locations={[0, 0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F5F7F3" />
          </Pressable>
          <Text style={styles.title}>Schedule</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF8A8A" />
          <Text style={styles.errorText}>Data tidak lengkap</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F5F7F3" />
        </Pressable>
        <Text style={styles.title}>Schedule</Text>
        <View style={styles.spacer} />
      </View>

      <ScheduleForm
        subjectId={subjectId}
        workspaceId={workspaceId}
        scheduleId={scheduleId}
        onSuccess={() => router.back()}
      />
    </SafeAreaView>
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
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  spacer: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#FF8A8A",
    fontWeight: "600",
  },
});
