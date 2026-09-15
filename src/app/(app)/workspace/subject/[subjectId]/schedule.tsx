import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, FONTS } from "@/constants/theme";
import ScheduleForm from "@/features/schedule/components/ScheduleForm";

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
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
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.bgBlack, '#131316', COLORS.bgBlack]}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.goldText} />
          </Pressable>
          <Text style={styles.title}>Atur Jadwal</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
          <Text style={styles.errorText}>Data subject tidak lengkap</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bgBlack, '#131316', COLORS.bgBlack]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.goldText} />
        </Pressable>
        <Text style={styles.title}>
          {scheduleId ? "Edit Jadwal" : "Tambah Jadwal"}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View
        style={{
          flex: 1,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <ScheduleForm
          subjectId={subjectId}
          workspaceId={workspaceId}
          scheduleId={scheduleId}
          onSuccess={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.textLight,
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
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.danger,
  },
});
